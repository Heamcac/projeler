<?php
require_once __DIR__ . '/includes/functions.php';
$pagination = paginate('wars');
$wars = get_wars($pagination['per_page'], $pagination['offset']);
$pageTitle = 'Savaşlar | ' . APP_NAME;
include __DIR__ . '/includes/header.php';
?>
<section class="page-hero compact"><p class="eyebrow">Savaşlar</p><h1>Dönüm noktaları</h1></section>
<section class="section">
    <div class="list-grid">
        <?php foreach ($wars as $war): ?>
            <a class="list-card" href="<?= e(detail_url('savas', $war['slug'])) ?>">
                <strong><?= e($war['name']) ?></strong>
                <span><?= e($war['date_text']) ?> · <?= e($war['location']) ?></span>
            </a>
        <?php endforeach; ?>
    </div>
    <?php render_pagination($pagination['page'], $pagination['pages']); ?>
</section>
<?php include __DIR__ . '/includes/footer.php'; ?>

