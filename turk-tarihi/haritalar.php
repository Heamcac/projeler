<?php
require_once __DIR__ . '/includes/functions.php';
$maps = fetch_all("SELECT name, slug, map_image, region FROM states WHERE map_image IS NOT NULL AND map_image <> '' ORDER BY start_year ASC");
$pageTitle = 'Haritalar | ' . APP_NAME;
include __DIR__ . '/includes/header.php';
?>
<section class="page-hero compact"><p class="eyebrow">Haritalar</p><h1>Tarihî coğrafya</h1></section>
<section class="section card-grid">
    <?php foreach ($maps as $map): ?>
        <article class="history-card"><img src="<?= e($map['map_image']) ?>" alt="<?= e($map['name']) ?> haritası"><div><span><?= e($map['region']) ?></span><h2><a href="<?= e(detail_url('devlet', $map['slug'])) ?>"><?= e($map['name']) ?></a></h2></div></article>
    <?php endforeach; ?>
</section>
<?php include __DIR__ . '/includes/footer.php'; ?>

