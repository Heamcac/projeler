<?php
require_once __DIR__ . '/includes/functions.php';
$slug = require_slug();
$war = get_war_by_slug($slug);
if (!$war) {
    require __DIR__ . '/404.php';
    exit;
}
$states = get_states_by_war((int) $war['id']);
$pageTitle = $war['name'] . ' | Türk Tarihi';
$pageDescription = excerpt($war['description'], 160);
$canonicalUrl = detail_url('savas', $war['slug']);
include __DIR__ . '/includes/header.php';
?>
<section class="page-hero compact">
    <p class="eyebrow"><?= e($war['date_text']) ?> · <?= e($war['location']) ?></p>
    <h1><?= e($war['name']) ?></h1>
    <p><?= e($war['description']) ?></p>
</section>
<section class="section two-column detail-layout">
    <article class="prose">
        <h2>Arka plan</h2><p><?= nl2br(e($war['background'])) ?></p>
        <h2>Savaş</h2><p><?= nl2br(e($war['battle'])) ?></p>
        <h2>Sonuç ve önem</h2><p><?= nl2br(e($war['aftermath'])) ?></p>
        <p><?= nl2br(e($war['importance'])) ?></p>
    </article>
    <aside class="info-panel">
        <dl>
            <dt>Sonuç</dt><dd><?= e($war['result']) ?></dd>
            <dt>Yıl</dt><dd><?= e($war['year']) ?></dd>
        </dl>
        <h3>İlgili devletler</h3>
        <?php foreach ($states as $state): ?>
            <a class="tag-link" href="<?= e(detail_url('devlet', $state['slug'])) ?>"><?= e($state['name']) ?></a>
        <?php endforeach; ?>
    </aside>
</section>
<?php include __DIR__ . '/includes/footer.php'; ?>

