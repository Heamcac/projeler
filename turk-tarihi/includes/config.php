<?php
// Uygulamanın temel ayarlarını ve environment değişkenlerini tek yerde topluyoruz.

$envFile = dirname(__DIR__) . '/.env';
if (is_readable($envFile)) {
    foreach (file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $line) {
        $line = trim($line);
        if ($line === '' || str_starts_with($line, '#') || !str_contains($line, '=')) {
            continue;
        }

        [$key, $value] = explode('=', $line, 2);
        $key = trim($key);
        $value = trim($value, " \t\n\r\0\x0B\"'");

        if (getenv($key) === false) {
            putenv($key . '=' . $value);
            $_ENV[$key] = $value;
        }
    }
}

function env_value(string $key, mixed $default = null): mixed
{
    $value = getenv($key);
    return $value === false ? $default : $value;
}

define('APP_NAME', env_value('APP_NAME', 'TÜRK TARİHİ DEMO 2'));
define('APP_ENV', env_value('APP_ENV', 'production'));
define('APP_URL', rtrim(env_value('APP_URL', ''), '/'));
define('APP_DEBUG', filter_var(env_value('APP_DEBUG', false), FILTER_VALIDATE_BOOLEAN));
define('BASE_PATH', dirname(__DIR__));
define('LOG_PATH', BASE_PATH . '/logs/app.log');

if (session_status() === PHP_SESSION_NONE) {
    session_name(env_value('SESSION_NAME', 'turk_tarihi_demo_2'));
    session_start();
}

if (APP_ENV === 'production') {
    ini_set('display_errors', '0');
    error_reporting(E_ALL);
} else {
    ini_set('display_errors', APP_DEBUG ? '1' : '0');
    error_reporting(E_ALL);
}

