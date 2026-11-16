<?php
require_once __DIR__ . '/includes/functions.php';
$pagination = paginate('rulers');
$rulers = get_rulers($pagination['per_page'], $pagination['offset']);
$pageTitle = 'Hükümdarlar | ' . APP_NAME;
include __DIR__ . '/includes/header.php';
?>
<section class="page-hero compact"><p class="eyebrow">Hükümdarlar</p><h1>Türk tarihinin liderleri</h1></section>
<section class="section">
    <div class="list-grid">
        <?php foreach ($rulers as $ruler): ?>
            <a class="list-card" href="<?= e(detail_url('hukumdar', $ruler['slug'])) ?>">
                <strong><?= e($ruler['name']) ?></strong>
                <span><?= e($ruler['state_name']) ?> · <?= e($ruler['reign_start']) ?> - <?= e($ruler['reign_end']) ?></span>
            </a>
        <?php endforeach; ?>
    </div>
    <?php render_pagination($pagination['page'], $pagination['pages']); ?>
</section>
<?php include __DIR__ . '/includes/footer.php'; ?>

