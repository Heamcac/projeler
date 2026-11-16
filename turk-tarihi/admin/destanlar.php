<?php
require_once __DIR__ . '/../includes/auth.php';
require_admin();
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    verify_csrf();
    $slug = trim((string) ($_POST['slug'] ?? '')) ?: slugify((string) $_POST['name']);
    db()->prepare('INSERT INTO epics (name, slug, related_people, summary, content, image) VALUES (?, ?, ?, ?, ?, ?)')
        ->execute([$_POST['name'], $slug, $_POST['related_people'], $_POST['summary'], $_POST['content'], $_POST['image']]);
    admin_redirect('destanlar.php');
}
$items = fetch_all('SELECT * FROM epics ORDER BY name');
admin_header('Destanlar');
?>
<section class="admin-heading"><h1>Destanlar</h1></section>
<form class="admin-form" method="post"><?= csrf_field() ?><?php text_input('name', 'Ad'); text_input('slug', 'Slug'); text_input('related_people', 'İlişkili kişiler'); textarea_input('summary', 'Özet'); textarea_input('content', 'İçerik'); text_input('image', 'Görsel URL'); ?><button class="button primary" type="submit">Ekle</button></form>
<div class="list-grid"><?php foreach ($items as $item): ?><article class="list-card"><strong><?= e($item['name']) ?></strong><span><?= e($item['summary']) ?></span></article><?php endforeach; ?></div>
<?php admin_footer(); ?>

