<!doctype html>
<html lang="<?= e(\App\Core\Translator::locale()) ?>">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="description" content="<?= e(t('meta_description')) ?>">
    <title><?= e(config('app_name')) ?></title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
    <link href="<?= url('assets/css/style.css') ?>" rel="stylesheet">
</head>
<body>
<nav class="navbar navbar-expand-lg navbar-dark bg-dark sticky-top">
    <div class="container">
        <a class="navbar-brand fw-bold" href="<?= url() ?>">Rent a Car Premtimi</a>
        <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#nav"><span class="navbar-toggler-icon"></span></button>
        <div class="collapse navbar-collapse" id="nav">
            <ul class="navbar-nav ms-auto align-items-lg-center">
                <li class="nav-item"><a class="nav-link" href="<?= url() ?>"><?= e(t('home')) ?></a></li>
                <li class="nav-item"><a class="nav-link" href="<?= url('vehicles') ?>"><?= e(t('vehicles')) ?></a></li>
                <li class="nav-item"><a class="nav-link" href="<?= url('contact') ?>"><?= e(t('contact')) ?></a></li>
                <li class="nav-item"><a class="nav-link" href="<?= url('admin/login') ?>">Admin</a></li>
                <li class="nav-item dropdown">
                    <a class="nav-link dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown">Lang</a>
                    <ul class="dropdown-menu dropdown-menu-end">
                        <li><a class="dropdown-item" href="?lang=sq">Shqip</a></li>
                        <li><a class="dropdown-item" href="?lang=en">English</a></li>
                        <li><a class="dropdown-item" href="?lang=tr">Türkçe</a></li>
                    </ul>
                </li>
            </ul>
        </div>
    </div>
</nav>
<?php if (!empty($_SESSION['flash'])): ?>
<div class="container mt-3"><div class="alert alert-success"><?= e($_SESSION['flash']); unset($_SESSION['flash']); ?></div></div>
<?php endif; ?>
<main>
