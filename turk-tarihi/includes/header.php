<?php
require_once __DIR__ . '/functions.php';

$pageTitle = $pageTitle ?? APP_NAME;
$pageDescription = $pageDescription ?? 'Türk tarihini devletler, hükümdarlar, savaşlar ve kültür başlıklarıyla anlatan veritabanı destekli demo platform.';
$canonicalUrl = $canonicalUrl ?? app_url(parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/');
$ogImage = $ogImage ?? app_url('assets/images/og-turk-tarihi.svg');
?>
<!doctype html>
<html lang="tr">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title><?= e($pageTitle) ?></title>
    <meta name="description" content="<?= e($pageDescription) ?>">
    <link rel="canonical" href="<?= e($canonicalUrl) ?>">
    <meta property="og:title" content="<?= e($pageTitle) ?>">
    <meta property="og:description" content="<?= e($pageDescription) ?>">
    <meta property="og:type" content="website">
    <meta property="og:url" content="<?= e($canonicalUrl) ?>">
    <meta property="og:image" content="<?= e($ogImage) ?>">
    <link rel="stylesheet" href="<?= e(app_url('assets/css/main.css')) ?>">
    <link rel="stylesheet" href="<?= e(app_url('assets/css/components.css')) ?>">
    <link rel="stylesheet" href="<?= e(app_url('assets/css/responsive.css')) ?>">
</head>
<body>
<?php include __DIR__ . '/navbar.php'; ?>
<main>

