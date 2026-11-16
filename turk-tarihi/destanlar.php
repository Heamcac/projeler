<?php
require_once __DIR__ . '/includes/functions.php';
$slug = trim((string) ($_GET['slug'] ?? ''));
if ($slug !== '') {
    $epic = fetch_one('SELECT * FROM epics WHERE slug = ? LIMIT 1', [$slug]);
    if (!$epic) {
        require __DIR__ . '/404.php';
        exit;
    }
    $pageTitle = $epic['name'] . ' | Türk Destanları';
    include __DIR__ . '/includes/header.php';
    echo '<section class="page-hero compact"><p class="eyebrow">' . e($epic['related_people']) . '</p><h1>' . e($epic['name']) . '</h1><p>' . e($epic['summary']) . '</p></section>';
    echo '<section class="section prose"><p>' . nl2br(e($epic['content'])) . '</p></section>';
    include __DIR__ . '/includes/footer.php';
    exit;
}
$epics = fetch_all('SELECT * FROM epics ORDER BY name');
$pageTitle = 'Destanlar | ' . APP_NAME;
include __DIR__ . '/includes/header.php';
?>
<section class="page-hero compact"><p class="eyebrow">Destanlar</p><h1>Anlatı geleneği</h1></section>
<section class="section list-grid">
    <?php foreach ($epics as $epic): ?>
        <a class="list-card" href="<?= e(detail_url('destan', $epic['slug'])) ?>"><strong><?= e($epic['name']) ?></strong><span><?= e($epic['summary']) ?></span></a>
    <?php endforeach; ?>
</section>
<?php include __DIR__ . '/includes/footer.php'; ?>

