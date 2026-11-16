<!doctype html>
<html lang="tr">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Admin Login</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
    <link href="<?= url('assets/css/style.css') ?>" rel="stylesheet">
</head>
<body class="login-page">
<form class="login-card" method="post" action="<?= url('admin/login') ?>">
    <?= csrf_field() ?>
    <h1 class="h4 mb-3">Rent a Car Premtimi</h1>
    <?php if ($error): ?><div class="alert alert-danger"><?= e($error) ?></div><?php endif; ?>
    <input class="form-control mb-2" type="email" name="email" placeholder="E-posta" required>
    <input class="form-control mb-3" type="password" name="password" placeholder="Şifre" required>
    <button class="btn btn-dark w-100">Giriş</button>
    <p class="small text-muted mt-3 mb-0">Demo: admin@premtimi.local / admin123</p>
</form>
</body>
</html>
