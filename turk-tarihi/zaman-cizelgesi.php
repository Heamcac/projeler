<?php
require_once __DIR__ . '/includes/functions.php';
$events = get_timeline_events();
$pageTitle = 'Zaman Çizelgesi | ' . APP_NAME;
include __DIR__ . '/includes/header.php';
?>
<section class="page-hero compact"><p class="eyebrow">Timeline</p><h1>Türk tarihinin zaman çizelgesi</h1></section>
<section class="section timeline" data-timeline>
    <?php foreach ($events as $event): ?>
        <article class="timeline-item">
            <time><?= e($event['year_start']) ?><?= $event['year_end'] ? ' - ' . e($event['year_end']) : '' ?></time>
            <div><h2><?= e($event['title']) ?></h2><p><?= e($event['description']) ?></p><span><?= e($event['event_type']) ?></span></div>
        </article>
    <?php endforeach; ?>
</section>
<script src="<?= e(app_url('assets/js/timeline.js')) ?>"></script>
<?php include __DIR__ . '/includes/footer.php'; ?>

