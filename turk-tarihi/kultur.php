<?php
require_once __DIR__ . '/includes/functions.php';
$slug = trim((string) ($_GET['slug'] ?? ''));
if ($slug !== '') {
    $content = fetch_one('SELECT * FROM cultures WHERE slug = ? LIMIT 1', [$slug]);
    if (!$content) {
        require __DIR__ . '/404.php';
        exit;
    }
    $pageTitle = $content['title'] . ' | Türk Kültürü';
    include __DIR__ . '/includes/header.php';
    echo '<section class="page-hero compact"><p class="eyebrow">' . e($content['category']) . '</p><h1>' . e($content['title']) . '</h1><p>' . e($content['summary']) . '</p></section>';
    echo '<section class="section prose"><p>' . nl2br(e($content['content'])) . '</p></section>';
    include __DIR__ . '/includes/footer.php';
    exit;
}
$items = fetch_all('SELECT * FROM cultures ORDER BY category, title');
$pageTitle = 'Kültür | ' . APP_NAME;
include __DIR__ . '/includes/header.php';
?>
<section class="page-hero compact"><p class="eyebrow">Kültür</p><h1>Türk kültür mirası</h1></section>
<section class="section list-grid">
    <?php foreach ($items as $item): ?>
        <a class="list-card" href="<?= e(detail_url('kultur', $item['slug'])) ?>"><strong><?= e($item['title']) ?></strong><span><?= e($item['category']) ?> · <?= e($item['summary']) ?></span></a>
    <?php endforeach; ?>
</section>
<?php include __DIR__ . '/includes/footer.php'; ?>

