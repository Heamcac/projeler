$mariaDb = "C:\Program Files\MariaDB 13.0\bin\mariadbd.exe"
$config = "C:\Program Files\MariaDB 13.0\data\my.ini"

if (Get-Process -Name "mariadbd" -ErrorAction SilentlyContinue) {
    Write-Host "MariaDB zaten çalışıyor."
    exit 0
}

Start-Process -FilePath $mariaDb -ArgumentList "--defaults-file=`"$config`" --console" -WindowStyle Hidden
Start-Sleep -Seconds 3

& "C:\Program Files\MariaDB 13.0\bin\mariadb-admin.exe" ping -uroot

