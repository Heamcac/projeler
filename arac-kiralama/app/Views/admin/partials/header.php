<!doctype html>
<html lang="tr">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Admin · <?= e(config('app_name')) ?></title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
    <link href="<?= url('assets/css/style.css') ?>" rel="stylesheet">
</head>
<body class="admin-body">
<div class="d-flex">
    <aside class="admin-sidebar">
        <a class="brand" href="<?= url('admin') ?>">Premtimi Admin</a>
        <?php $items = [
            'admin' => 'Dashboard', 'admin/vehicles' => 'Araçlar', 'admin/reservations' => 'Rezervasyonlar',
            'admin/customers' => 'Müşteriler', 'admin/contracts' => 'Sözleşme/Fatura', 'admin/maintenance' => 'Servis',
            'admin/expenses' => 'Giderler', 'admin/damage' => 'Hasar/Kaza', 'admin/mileage' => 'Kilometre',
            'admin/reports' => 'Raporlar', 'admin/admins' => 'Adminler',
        ]; ?>
        <nav class="nav flex-column">
            <?php foreach ($items as $href => $label): ?>
                <a class="nav-link" href="<?= url($href) ?>"><?= e($label) ?></a>
            <?php endforeach; ?>
            <a class="nav-link text-warning" href="<?= url() ?>">Public Site</a>
            <a class="nav-link text-danger" href="<?= url('admin/logout') ?>">Çıkış</a>
        </nav>
    </aside>
    <main class="admin-main">
        <div class="admin-topbar">
            <span>Hoş geldiniz, <?= e($_SESSION['admin_name'] ?? 'Admin') ?></span>
        </div>
