<?php
require_once __DIR__ . '/../includes/auth.php';
require_admin();
admin_header('Dashboard');
$cards = [
    'Devletler' => count_rows('states'),
    'Hükümdarlar' => count_rows('rulers'),
    'Savaşlar' => count_rows('wars'),
    'Kaynaklar' => count_rows('sources'),
    'Timeline' => count_rows('timeline_events'),
];
?>
<section class="admin-heading">
    <h1>Yönetim paneli</h1>
    <p>SQL verilerini elle sorgu yazmadan yönetmek için temel panel.</p>
</section>
<section class="admin-cards">
    <?php foreach ($cards as $label => $count): ?>
        <article><span><?= e((string) $count) ?></span><strong><?= e($label) ?></strong></article>
    <?php endforeach; ?>
</section>
<?php admin_footer(); ?>

