<?php
require_once __DIR__ . '/../includes/auth.php';
require_admin();
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    verify_csrf();
    $slug = trim((string) ($_POST['slug'] ?? '')) ?: slugify((string) $_POST['title']);
    db()->prepare('INSERT INTO timeline_events (title, slug, year_start, year_end, description, event_type, related_content_id) VALUES (?, ?, ?, ?, ?, ?, ?)')
        ->execute([$_POST['title'], $slug, $_POST['year_start'] ?: null, $_POST['year_end'] ?: null, $_POST['description'], $_POST['event_type'], $_POST['related_content_id'] ?: null]);
    admin_redirect('timeline.php');
}
$items = get_timeline_events();
admin_header('Timeline');
?>
<section class="admin-heading"><h1>Timeline olayı</h1></section>
<form class="admin-form" method="post"><?= csrf_field() ?><?php text_input('title', 'Başlık'); text_input('slug', 'Slug'); text_input('year_start', 'Başlangıç yılı', [], 'number'); text_input('year_end', 'Bitiş yılı', [], 'number'); textarea_input('description', 'Açıklama'); text_input('event_type', 'Tür'); text_input('related_content_id', 'İlişkili içerik ID', [], 'number'); ?><button class="button primary" type="submit">Ekle</button></form>
<div class="list-grid"><?php foreach ($items as $item): ?><article class="list-card"><strong><?= e($item['title']) ?></strong><span><?= e((string) $item['year_start']) ?></span></article><?php endforeach; ?></div>
<?php admin_footer(); ?>

