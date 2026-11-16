<?php
require_once __DIR__ . '/includes/functions.php';
$sources = get_sources();
$pageTitle = 'Kaynaklar | ' . APP_NAME;
include __DIR__ . '/includes/header.php';
?>
<section class="page-hero compact"><p class="eyebrow">Kaynaklar</p><h1>Başvuru kaynakları</h1></section>
<section class="section list-grid">
    <?php foreach ($sources as $source): ?>
        <article class="list-card">
            <strong><?= e($source['title']) ?></strong>
            <span><?= e($source['author']) ?> · <?= e($source['publisher']) ?> · <?= e($source['year']) ?></span>
            <?php if ($source['url']): ?><a href="<?= e($source['url']) ?>" rel="noopener">Kaynağa git</a><?php endif; ?>
        </article>
    <?php endforeach; ?>
</section>
<?php include __DIR__ . '/includes/footer.php'; ?>

