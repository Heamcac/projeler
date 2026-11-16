<?php
require_once __DIR__ . '/functions.php';

function is_admin(): bool
{
    return isset($_SESSION['admin_user_id']);
}

function require_admin(): void
{
    if (!is_admin()) {
        header('Location: ' . app_url('admin/login.php'));
        exit;
    }
}

function csrf_token(): string
{
    if (empty($_SESSION['csrf_token'])) {
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
    }
    return $_SESSION['csrf_token'];
}

function csrf_field(): string
{
    return '<input type="hidden" name="csrf_token" value="' . e(csrf_token()) . '">';
}

function verify_csrf(): void
{
    $token = (string) ($_POST['csrf_token'] ?? '');
    if ($token === '' || !hash_equals($_SESSION['csrf_token'] ?? '', $token)) {
        http_response_code(419);
        exit('Güvenlik doğrulaması başarısız oldu.');
    }
}

function admin_redirect(string $path): never
{
    header('Location: ' . app_url('admin/' . ltrim($path, '/')));
    exit;
}

function slugify(string $text): string
{
    return generateSlug($text);
}

function admin_header(string $title): void
{
    ?>
    <!doctype html>
    <html lang="tr">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title><?= e($title) ?> | Admin</title>
        <link rel="stylesheet" href="<?= e(app_url('assets/css/main.css')) ?>">
        <link rel="stylesheet" href="<?= e(app_url('assets/css/components.css')) ?>">
    </head>
    <body class="admin-body">
    <aside class="admin-sidebar">
        <a class="brand" href="<?= e(app_url('admin/dashboard.php')) ?>"><span class="brand-mark">TT</span><span>Admin</span></a>
        <nav>
            <a href="<?= e(app_url('admin/dashboard.php')) ?>">Panel</a>
            <a href="<?= e(app_url('admin/devletler.php')) ?>">Devletler</a>
            <a href="<?= e(app_url('admin/hukumdarlar.php')) ?>">Hükümdarlar</a>
            <a href="<?= e(app_url('admin/savaslar.php')) ?>">Savaşlar</a>
            <a href="<?= e(app_url('admin/kaynaklar.php')) ?>">Kaynaklar</a>
            <a href="<?= e(app_url('admin/kultur.php')) ?>">Kültür</a>
            <a href="<?= e(app_url('admin/destanlar.php')) ?>">Destanlar</a>
            <a href="<?= e(app_url('admin/timeline.php')) ?>">Timeline</a>
            <a href="<?= e(app_url('/')) ?>">Siteye Dön</a>
            <a href="<?= e(app_url('admin/logout.php')) ?>">Çıkış</a>
        </nav>
    </aside>
    <main class="admin-main">
    <?php
}

function admin_footer(): void
{
    echo '</main></body></html>';
}

function form_value(array $data, string $key): string
{
    return e((string) ($data[$key] ?? ''));
}

function text_input(string $name, string $label, array $data = [], string $type = 'text'): void
{
    echo '<label>' . e($label) . '<input type="' . e($type) . '" name="' . e($name) . '" value="' . form_value($data, $name) . '"></label>';
}

function textarea_input(string $name, string $label, array $data = []): void
{
    echo '<label>' . e($label) . '<textarea name="' . e($name) . '" rows="5">' . form_value($data, $name) . '</textarea></label>';
}

