<?php
require_once __DIR__ . '/includes/functions.php';

$pageTitle = APP_NAME . ' | Türk Tarihi Platformu';
$featuredStates = get_featured_states(6);
$featuredRulers = get_rulers(4, 0);
$featuredWars = get_wars(4, 0);
$timeline = get_timeline_events(5);
$latest = get_latest_content(6);
include __DIR__ . '/includes/header.php';
?>
<section class="hero">
    <div class="hero-content">
        <p class="eyebrow">Veritabanı destekli tarih müzesi</p>
        <h1>TÜRK TARİHİ DEMO 2</h1>
        <p>Devletler, hükümdarlar, savaşlar, kültür mirası ve zaman çizelgesi ayrı URL'lere sahip gerçek sayfalarda bir araya geliyor.</p>
        <div class="hero-actions">
            <a class="button primary" href="<?= e(app_url('devletler.php')) ?>">Devletleri İncele</a>
            <a class="button ghost" href="<?= e(app_url('zaman-cizelgesi.php')) ?>">Zaman Çizelgesi</a>
        </div>
    </div>
</section>

<section class="section">
    <div class="section-heading">
        <p class="eyebrow">Öne çıkan devletler</p>
        <h2>Bozkırdan imparatorluğa uzanan hat</h2>
        <a href="<?= e(app_url('devletler.php')) ?>">Tüm devletler</a>
    </div>
    <div class="card-grid">
        <?php foreach ($featuredStates as $state): ?>
            <article class="history-card">
                <img src="<?= e($state['hero_image'] ?: app_url('assets/images/state-placeholder.svg')) ?>" alt="<?= e($state['name']) ?>">
                <div>
                    <span><?= e($state['start_year']) ?> - <?= e($state['end_year'] ?: '...') ?></span>
                    <h3><a href="<?= e(detail_url('devlet', $state['slug'])) ?>"><?= e($state['name']) ?></a></h3>
                    <p><?= e($state['short_description']) ?></p>
                </div>
            </article>
        <?php endforeach; ?>
    </div>
</section>

<section class="section split-band">
    <div>
        <p class="eyebrow">Kısa timeline</p>
        <h2>Tarihin akışı</h2>
        <div class="timeline-mini">
            <?php foreach ($timeline as $event): ?>
                <a href="<?= e(app_url('zaman-cizelgesi.php')) ?>">
                    <strong><?= e($event['year_start']) ?></strong>
                    <span><?= e($event['title']) ?></span>
                </a>
            <?php endforeach; ?>
        </div>
    </div>
    <div>
        <p class="eyebrow">Son eklenen içerikler</p>
        <h2>Yeni kayıtlar</h2>
        <div class="compact-list">
            <?php foreach ($latest as $item): ?>
                <a href="<?= e(detail_url($item['type'], $item['slug'])) ?>">
                    <strong><?= e($item['title']) ?></strong>
                    <span><?= e(excerpt($item['summary'], 80)) ?></span>
                </a>
            <?php endforeach; ?>
        </div>
    </div>
</section>

<section class="section">
    <div class="section-heading">
        <p class="eyebrow">Hükümdarlar ve savaşlar</p>
        <h2>Karar anları</h2>
    </div>
    <div class="two-column">
        <div class="panel">
            <h3>Önemli hükümdarlar</h3>
            <?php foreach ($featuredRulers as $ruler): ?>
                <a class="row-link" href="<?= e(detail_url('hukumdar', $ruler['slug'])) ?>"><?= e($ruler['name']) ?><span><?= e($ruler['state_name']) ?></span></a>
            <?php endforeach; ?>
        </div>
        <div class="panel">
            <h3>Önemli savaşlar</h3>
            <?php foreach ($featuredWars as $war): ?>
                <a class="row-link" href="<?= e(detail_url('savas', $war['slug'])) ?>"><?= e($war['name']) ?><span><?= e($war['date_text']) ?></span></a>
            <?php endforeach; ?>
        </div>
    </div>
</section>

<section class="section museum-band">
    <div>
        <p class="eyebrow">Türk kültürü</p>
        <h2>Dil, yazıtlar, hukuk, sanat ve destanlar</h2>
        <p>Kültür bölümü ileride genişleyen içeriklerle birlikte SQL üzerinden yönetilecek biçimde hazırlandı.</p>
    </div>
    <a class="button primary" href="<?= e(app_url('kultur.php')) ?>">Kültürü İncele</a>
</section>
<?php include __DIR__ . '/includes/footer.php'; ?>

