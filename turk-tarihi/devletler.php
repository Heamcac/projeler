<?php
require_once __DIR__ . '/includes/functions.php';
$pagination = paginate('states');
$states = get_states($pagination['per_page'], $pagination['offset']);
$pageTitle = 'Türk Devletleri | ' . APP_NAME;
include __DIR__ . '/includes/header.php';
?>
<section class="page-hero compact">
    <p class="eyebrow">Devletler</p>
    <h1>Türk devletleri</h1>
    <p>Her kart kendi detay sayfasına ve paylaşılabilir URL yapısına sahiptir.</p>
</section>
<section class="section">
    <div class="card-grid">
        <?php foreach ($states as $state): ?>
            <article class="history-card">
                <img src="<?= e($state['hero_image'] ?: app_url('assets/images/state-placeholder.svg')) ?>" alt="<?= e($state['name']) ?>">
                <div>
                    <span><?= e($state['region']) ?> · <?= e($state['capital']) ?></span>
                    <h2><a href="<?= e(detail_url('devlet', $state['slug'])) ?>"><?= e($state['name']) ?></a></h2>
                    <p><?= e($state['short_description']) ?></p>
                </div>
            </article>
        <?php endforeach; ?>
    </div>
    <?php render_pagination($pagination['page'], $pagination['pages']); ?>
</section>
<?php include __DIR__ . '/includes/footer.php'; ?>

