<?php
require_once __DIR__ . '/includes/functions.php';

// URL'deki slug bilgisini alıyoruz. Örnek: /devlet/gokturk-kaganligi
$slug = require_slug();
$state = get_state_by_slug($slug);
if (!$state) {
    require __DIR__ . '/404.php';
    exit;
}

$rulers = get_rulers_by_state((int) $state['id']);
$wars = get_wars_by_state((int) $state['id']);
$pageTitle = $state['name'] . ' | Türk Tarihi';
$pageDescription = excerpt($state['short_description'] ?: $state['description'], 160);
$canonicalUrl = detail_url('devlet', $state['slug']);
$ogImage = $state['hero_image'] ?: app_url('assets/images/og-turk-tarihi.svg');
include __DIR__ . '/includes/header.php';
?>
<section class="detail-hero" style="--hero-image: url('<?= e($state['hero_image'] ?: app_url('assets/images/state-placeholder.svg')) ?>')">
    <div>
        <p class="eyebrow"><?= e($state['region']) ?></p>
        <h1><?= e($state['name']) ?></h1>
        <p><?= e($state['short_description']) ?></p>
    </div>
</section>
<section class="section two-column detail-layout">
    <article class="prose">
        <h2>Genel bakış</h2>
        <p><?= nl2br(e($state['description'])) ?></p>
    </article>
    <aside class="info-panel">
        <dl>
            <dt>Kuruluş</dt><dd><?= e($state['start_year']) ?></dd>
            <dt>Bitiş</dt><dd><?= e($state['end_year'] ?: 'Devam / bilinmiyor') ?></dd>
            <dt>Başkent</dt><dd><?= e($state['capital']) ?></dd>
            <dt>Kurucu</dt><dd><?= e($state['founder']) ?></dd>
            <dt>Yönetim</dt><dd><?= e($state['government']) ?></dd>
            <dt>Din</dt><dd><?= e($state['religion']) ?></dd>
        </dl>
    </aside>
</section>
<section class="section">
    <div class="section-heading"><h2>Hükümdarlar</h2></div>
    <div class="list-grid">
        <?php foreach ($rulers as $ruler): ?>
            <a class="list-card" href="<?= e(detail_url('hukumdar', $ruler['slug'])) ?>">
                <strong><?= e($ruler['name']) ?></strong>
                <span><?= e($ruler['reign_start']) ?> - <?= e($ruler['reign_end']) ?></span>
            </a>
        <?php endforeach; ?>
    </div>
</section>
<section class="section">
    <div class="section-heading"><h2>İlişkili savaşlar</h2></div>
    <div class="list-grid">
        <?php foreach ($wars as $war): ?>
            <a class="list-card" href="<?= e(detail_url('savas', $war['slug'])) ?>">
                <strong><?= e($war['name']) ?></strong>
                <span><?= e($war['date_text']) ?></span>
            </a>
        <?php endforeach; ?>
    </div>
</section>
<?php include __DIR__ . '/includes/footer.php'; ?>

