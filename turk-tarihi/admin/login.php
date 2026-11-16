<?php
require_once __DIR__ . '/../includes/auth.php';

$error = '';
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    verify_csrf();
    $username = trim((string) ($_POST['username'] ?? ''));
    $password = (string) ($_POST['password'] ?? '');

    // Admin şifresi düz metin değil, veritabanındaki hash ile doğrulanır.
    $admin = fetch_one('SELECT * FROM admin_users WHERE username = ? LIMIT 1', [$username]);
    if ($admin && password_verify($password, $admin['password_hash'])) {
        session_regenerate_id(true);
        $_SESSION['admin_user_id'] = $admin['id'];
        $_SESSION['admin_username'] = $admin['username'];
        admin_redirect('dashboard.php');
    }

    $error = 'Kullanıcı adı veya şifre hatalı.';
}
?>
<!doctype html>
<html lang="tr">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Admin Giriş | <?= e(APP_NAME) ?></title>
    <link rel="stylesheet" href="<?= e(app_url('assets/css/main.css')) ?>">
    <link rel="stylesheet" href="<?= e(app_url('assets/css/components.css')) ?>">
</head>
<body class="login-body">
    <form class="login-panel" method="post">
        <?= csrf_field() ?>
        <h1>Admin Giriş</h1>
        <?php if ($error): ?><p class="alert"><?= e($error) ?></p><?php endif; ?>
        <label>Kullanıcı adı <input type="text" name="username" required></label>
        <label>Şifre <input type="password" name="password" required></label>
        <button class="button primary" type="submit">Giriş Yap</button>
    </form>
</body>
</html>

