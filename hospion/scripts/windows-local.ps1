param(
    [ValidateSet('Install', 'Start', 'Stop')][string]$Action = 'Start',
    [switch]$OpenBrowser
)
$ErrorActionPreference = 'Stop'
$root = Split-Path $PSScriptRoot -Parent
$local = Join-Path $root '.local'
$bin = Join-Path $local 'pgsql\bin'
$data = Join-Path $local 'pgdata'
$stateFile = Join-Path $local 'processes.json'
Set-Location -LiteralPath $root

function Invoke-Checked {
    param([string]$Program, [string[]]$Arguments)
    & $Program @Arguments
    if ($LASTEXITCODE -ne 0) { throw "$Program failed ($LASTEXITCODE)." }
}
function New-Secret {
    $bytes = New-Object byte[] 32
    $rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
    try { $rng.GetBytes($bytes) } finally { $rng.Dispose() }
    return ([BitConverter]::ToString($bytes)).Replace('-', '').ToLowerInvariant()
}
function Test-Http {
    param([string]$Url)
    try { return (Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 3).StatusCode -eq 200 }
    catch { return $false }
}
function Start-AppProcess {
    param([string]$Name, [string]$Directory, [string[]]$Arguments)
    $process = Start-Process -FilePath (Get-Command node.exe).Source -ArgumentList $Arguments `
        -WorkingDirectory $Directory -WindowStyle Hidden -PassThru `
        -RedirectStandardOutput (Join-Path $local "$Name.log") `
        -RedirectStandardError (Join-Path $local "$Name.error.log")
    $identity = Get-CimInstance Win32_Process -Filter "ProcessId = $($process.Id)"
    if (!$identity) { throw "$Name exited during startup. Check .local logs." }
    return @{ name = $Name; pid = $process.Id; command = $identity.CommandLine; created = $identity.CreationDate.ToUniversalTime().Ticks.ToString() }
}

try {
    if ($Action -eq 'Stop') {
        if (Test-Path -LiteralPath $stateFile) {
            $savedEntries = Get-Content -LiteralPath $stateFile -Raw | ConvertFrom-Json
            foreach ($entry in $savedEntries) {
                $process = Get-CimInstance Win32_Process -Filter "ProcessId = $($entry.pid)" -ErrorAction SilentlyContinue
                if ($process -and $process.CommandLine -eq $entry.command -and $process.CreationDate.ToUniversalTime().Ticks.ToString() -eq $entry.created) {
                    # Next.js creates a child server; terminate the recorded process tree.
                    Invoke-Checked 'taskkill.exe' @('/PID', "$($entry.pid)", '/T', '/F')
                }
            }
            Remove-Item -LiteralPath $stateFile
        }
        if (Test-Path -LiteralPath (Join-Path $data 'postmaster.pid')) {
            Invoke-Checked (Join-Path $bin 'pg_ctl.exe') @('-D', $data, '-m', 'fast', '-w', 'stop')
        }
        Write-Host 'HOSPION durduruldu.'
        exit 0
    }

    New-Item -ItemType Directory -Force -Path $local | Out-Null
    if (!(Get-Command node.exe -ErrorAction SilentlyContinue)) { throw 'Node.js bulunamadi.' }
    if (!(Test-Path -LiteralPath (Join-Path $root 'node_modules\pg'))) {
        Invoke-Checked 'npm.cmd' @('ci')
    }

    $envPath = Join-Path $root '.env'
    if (!(Test-Path -LiteralPath $envPath)) { Copy-Item -LiteralPath (Join-Path $root '.env.example') -Destination $envPath }
    $envText = [IO.File]::ReadAllText($envPath)
    $envText = $envText.Replace('SESSION_SECRET=replace-with-a-long-random-value', ('SESSION_SECRET=' + (New-Secret)))
    $envText = $envText.Replace('postgres://hospion:hospion@localhost:5432/hospion', ('postgres://hospion:' + (New-Secret) + '@127.0.0.1:5432/hospion'))
    [IO.File]::WriteAllText($envPath, $envText, (New-Object Text.UTF8Encoding($false)))
    foreach ($line in [IO.File]::ReadAllLines($envPath)) {
        if ($line -match '^([A-Z_][A-Z0-9_]*)=(.*)$') {
            [Environment]::SetEnvironmentVariable($Matches[1], $Matches[2], 'Process')
        }
    }
    $env:DOTENV_CONFIG_PATH = $envPath

    if (!(Test-Path -LiteralPath (Join-Path $bin 'pg_ctl.exe'))) {
        $archive = Join-Path $local 'postgresql.zip'
        Write-Host 'PostgreSQL indiriliyor...'
        $ProgressPreference = 'SilentlyContinue'
        Invoke-WebRequest -Uri 'https://sbp.enterprisedb.com/getfile.jsp?fileid=1260616' -UseBasicParsing -OutFile $archive
        Add-Type -AssemblyName System.IO.Compression.FileSystem
        [IO.Compression.ZipFile]::ExtractToDirectory($archive, $local)
        Remove-Item -LiteralPath $archive
    }
    if (!(Test-Path -LiteralPath (Join-Path $data 'PG_VERSION'))) {
        $passwordFile = Join-Path $local 'admin-password'
        if (!(Test-Path -LiteralPath $passwordFile)) {
            [IO.File]::WriteAllText($passwordFile, (New-Secret), (New-Object Text.UTF8Encoding($false)))
        }
        Invoke-Checked (Join-Path $bin 'initdb.exe') @('-D', $data, '-U', 'hospion_admin', '--encoding=UTF8', '--locale=C', '--auth=scram-sha-256', "--pwfile=$passwordFile")
    }
    & (Join-Path $bin 'pg_ctl.exe') -D $data status *> $null
    if ($LASTEXITCODE -ne 0) {
        Invoke-Checked (Join-Path $bin 'pg_ctl.exe') @('-D', $data, '-l', (Join-Path $local 'postgres.log'), '-o', '-h 127.0.0.1 -p 5432', '-w', 'start')
    }
    if ($Action -eq 'Install' -or !(Test-Path -LiteralPath (Join-Path $local 'installed'))) {
        Invoke-Checked 'node.exe' @('scripts/setup-db.cjs')
        Invoke-Checked 'npm.cmd' @('run', 'db:migrate')
        Invoke-Checked 'npm.cmd' @('run', 'db:seed')
        Invoke-Checked 'npm.cmd' @('run', 'build', '-w', '@hospion/api')
        [IO.File]::WriteAllText((Join-Path $local 'installed'), (Get-Date).ToString('o'))
    }
    if ($Action -eq 'Install') { Write-Host 'Kurulum tamamlandi. HOSPION-Baslat.cmd dosyasini acabilirsiniz.'; exit 0 }

    $entries = @()
    if (Test-Path -LiteralPath $stateFile) {
        $savedEntries = Get-Content -LiteralPath $stateFile -Raw | ConvertFrom-Json
        $entries = @($savedEntries)
    }
    if (!(Test-Http 'http://localhost:4000/api/v1/auth/csrf')) {
        $entries += Start-AppProcess 'api' $root @('apps/api/dist/src/main.js')
        [IO.File]::WriteAllText($stateFile, (ConvertTo-Json -InputObject @($entries)))
    }
    if (!(Test-Http 'http://localhost:3000/login')) {
        $entries += Start-AppProcess 'web' (Join-Path $root 'apps\web') @('..\..\node_modules\next\dist\bin\next', 'dev', '--hostname', '127.0.0.1', '--port', '3000')
        [IO.File]::WriteAllText($stateFile, (ConvertTo-Json -InputObject @($entries)))
    }
    $ready = $false
    for ($attempt = 0; $attempt -lt 40; $attempt++) {
        if ((Test-Http 'http://localhost:4000/api/v1/auth/csrf') -and (Test-Http 'http://localhost:3000/login')) { $ready = $true; break }
        Start-Sleep -Seconds 1
    }
    if (!$ready) { throw 'Sunucular baslatilamadi. .local klasorundeki log dosyalarini kontrol edin.' }
    Write-Host 'HOSPION hazir: http://localhost:3000/login'
    if ($OpenBrowser) { Start-Process 'http://localhost:3000/login' }
} catch {
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}
