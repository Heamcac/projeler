<?php
// Navbar bütün sayfalarda ortak olduğu için ayrı dosyadan çağrılıyor.
$currentPath = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';
$navItems = [
    '/' => 'Ana Sayfa',
    '/devletler.php' => 'Devletler',
    '/hukumdarlar.php' => 'Hükümdarlar',
    '/savaslar.php' => 'Savaşlar',
    '/zaman-cizelgesi.php' => 'Timeline',
    '/kultur.php' => 'Kültür',
    '/destanlar.php' => 'Destanlar',
    '/kaynaklar.php' => 'Kaynaklar',
];
?>
<header class="site-header">
    <a class="brand" href="<?= e(app_url('/')) ?>">
        <span class="brand-mark">TT</span>
        <span><?= e(APP_NAME) ?></span>
    </a>
    <button class="menu-toggle" type="button" aria-label="Menüyü aç" data-menu-toggle>☰</button>
    <nav class="site-nav" data-site-nav>
        <?php foreach ($navItems as $href => $label): ?>
            <a href="<?= e(app_url($href)) ?>" class="<?= $currentPath === $href ? 'active' : '' ?>"><?= e($label) ?></a>
        <?php endforeach; ?>
        <a class="nav-search" href="<?= e(app_url('arama.php')) ?>">Ara</a>
    </nav>
</header>

