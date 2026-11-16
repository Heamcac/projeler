<?php
require_once __DIR__ . '/config.php';

// Bulut MySQL veritabanına güvenli PDO bağlantısı oluşturuyoruz.
function db(): PDO
{
    static $pdo = null;

    if ($pdo instanceof PDO) {
        return $pdo;
    }

    $host = env_value('DB_HOST', '127.0.0.1');
    $port = env_value('DB_PORT', '3306');
    $name = env_value('DB_NAME', '');
    $user = env_value('DB_USER', '');
    $password = env_value('DB_PASSWORD', '');

    $dsn = "mysql:host={$host};port={$port};dbname={$name};charset=utf8mb4";

    try {
        $pdo = new PDO($dsn, $user, $password, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ]);
    } catch (PDOException $exception) {
        log_error($exception);
        http_response_code(500);

        if (APP_DEBUG) {
            exit('Veritabanı bağlantı hatası: ' . htmlspecialchars($exception->getMessage(), ENT_QUOTES, 'UTF-8'));
        }

        exit('Şu anda sistem bakımda. Lütfen daha sonra tekrar deneyin.');
    }

    return $pdo;
}

function log_error(Throwable $exception): void
{
    $line = '[' . date('Y-m-d H:i:s') . '] ' . $exception->getMessage() . PHP_EOL;
    if (!is_dir(dirname(LOG_PATH))) {
        mkdir(dirname(LOG_PATH), 0775, true);
    }
    error_log($line, 3, LOG_PATH);
}

