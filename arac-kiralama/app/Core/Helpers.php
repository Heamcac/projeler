<?php
declare(strict_types=1);

use App\Core\Translator;

function config(string $key = null, mixed $default = null): mixed
{
    static $config = null;
    $config ??= require dirname(__DIR__, 2) . '/config/config.php';
    if ($key === null) {
        return $config;
    }
    $value = $config;
    foreach (explode('.', $key) as $part) {
        if (!is_array($value) || !array_key_exists($part, $value)) {
            return $default;
        }
        $value = $value[$part];
    }
    return $value;
}

function url(string $path = ''): string
{
    return rtrim((string) config('base_url'), '/') . '/' . ltrim($path, '/');
}

function redirect(string $path): void
{
    header('Location: ' . url($path));
    exit;
}

function e(mixed $value): string
{
    return htmlspecialchars((string) $value, ENT_QUOTES, 'UTF-8');
}

function csrf_token(): string
{
    if (empty($_SESSION['_csrf'])) {
        $_SESSION['_csrf'] = bin2hex(random_bytes(32));
    }
    return $_SESSION['_csrf'];
}

function csrf_field(): string
{
    return '<input type="hidden" name="_csrf" value="' . e(csrf_token()) . '">';
}

function verify_csrf(): void
{
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $token = $_POST['_csrf'] ?? '';
        if (!is_string($token) || !hash_equals($_SESSION['_csrf'] ?? '', $token)) {
            http_response_code(419);
            exit('CSRF token mismatch.');
        }
    }
}

function is_admin(): bool
{
    return !empty($_SESSION['admin_id']);
}

function require_admin(): void
{
    if (!is_admin()) {
        redirect('admin/login');
    }
}

function t(string $key): string
{
    return Translator::get($key);
}

function money(mixed $amount): string
{
    return number_format((float) $amount, 2) . ' EUR';
}

function days_between(string $start, string $end): int
{
    $from = new DateTime($start);
    $to = new DateTime($end);
    return max(1, (int) ceil(($to->getTimestamp() - $from->getTimestamp()) / 86400));
}
