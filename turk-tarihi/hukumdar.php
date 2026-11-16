<?php
require_once __DIR__ . '/includes/functions.php';
$slug = require_slug();
$ruler = get_ruler_by_slug($slug);
if (!$ruler) {
    require __DIR__ . '/404.php';
    exit;
}
$wars = get_wars_by_ruler((int) $ruler['id']);
$pageTitle = $ruler['name'] . ' | Türk Tarihi';
$pageDescription = excerpt($ruler['biography'], 160);
$canonicalUrl = detail_url('hukumdar', $ruler['slug']);
include __DIR__ . '/includes/header.php';
?>
<section class="page-hero compact">
    <p class="eyebrow"><?= e($ruler['state_name']) ?></p>
    <h1><?= e($ruler['name']) ?></h1>
    <p><?= e($ruler['reign_start']) ?> - <?= e($ruler['reign_end']) ?></p>
</section>
<section class="section two-column detail-layout">
    <article class="prose">
        <h2>Biyografi</h2>
        <p><?= nl2br(e($ruler['biography'])) ?></p>
        <h2>Öne çıkan başarılar</h2>
        <p><?= nl2br(e($ruler['achievements'])) ?></p>
    </article>
    <aside class="info-panel">
        <dl>
            <dt>Devlet</dt><dd><a href="<?= e(detail_url('devlet', $ruler['state_slug'])) ?>"><?= e($ruler['state_name']) ?></a></dd>
            <dt>Doğum</dt><dd><?= e($ruler['birth_year'] ?: 'Bilinmiyor') ?></dd>
            <dt>Ölüm</dt><dd><?= e($ruler['death_year'] ?: 'Bilinmiyor') ?></dd>
        </dl>
    </aside>
</section>
<section class="section">
    <div class="section-heading"><h2>İlişkili savaşlar</h2></div>
    <div class="list-grid">
        <?php foreach ($wars as $war): ?>
            <a class="list-card" href="<?= e(detail_url('savas', $war['slug'])) ?>"><strong><?= e($war['name']) ?></strong><span><?= e($war['date_text']) ?></span></a>
        <?php endforeach; ?>
    </div>
</section>
<?php include __DIR__ . '/includes/footer.php'; ?>

