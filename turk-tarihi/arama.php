<?php
require_once __DIR__ . '/includes/functions.php';
$query = trim((string) ($_GET['q'] ?? ''));
$results = $query !== '' ? search_content($query) : [];
$pageTitle = 'Arama | ' . APP_NAME;
include __DIR__ . '/includes/header.php';
?>
<section class="page-hero compact">
    <p class="eyebrow">Arama</p>
    <h1>Veritabanında ara</h1>
    <form class="search-form" method="get" action="<?= e(app_url('arama.php')) ?>">
        <input type="search" name="q" value="<?= e($query) ?>" placeholder="Alp Arslan, 1071, Göktürk..." data-search-input>
        <button class="button primary" type="submit">Ara</button>
    </form>
</section>
<section class="section">
    <?php if ($query === ''): ?>
        <p class="muted">Aramak için bir kelime yazın.</p>
    <?php else: ?>
        <?php foreach ($results as $category => $items): ?>
            <div class="search-group">
                <h2><?= e($category) ?></h2>
                <div class="list-grid">
                    <?php foreach ($items as $item): ?>
                        <?php $type = ['Devletler' => 'devlet', 'Hükümdarlar' => 'hukumdar', 'Savaşlar' => 'savas', 'Kültür' => 'kultur', 'Destanlar' => 'destan'][$category]; ?>
                        <a class="list-card" href="<?= e(detail_url($type, $item['slug'])) ?>"><strong><?= e($item['title']) ?></strong><span><?= e(excerpt($item['summary'], 120)) ?></span></a>
                    <?php endforeach; ?>
                    <?php if (!$items): ?><p class="muted">Sonuç bulunamadı.</p><?php endif; ?>
                </div>
            </div>
        <?php endforeach; ?>
    <?php endif; ?>
</section>
<?php include __DIR__ . '/includes/footer.php'; ?>

