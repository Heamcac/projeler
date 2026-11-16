<?php
require_once __DIR__ . '/../includes/auth.php';
require_admin();
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    verify_csrf();
    $slug = trim((string) ($_POST['slug'] ?? '')) ?: slugify((string) $_POST['title']);
    db()->prepare('INSERT INTO cultures (title, slug, category, summary, content, image) VALUES (?, ?, ?, ?, ?, ?)')
        ->execute([$_POST['title'], $slug, $_POST['category'], $_POST['summary'], $_POST['content'], $_POST['image']]);
    admin_redirect('kultur.php');
}
$items = fetch_all('SELECT * FROM cultures ORDER BY category, title');
admin_header('Kültür');
?>
<section class="admin-heading"><h1>Kültür içeriği</h1></section>
<form class="admin-form" method="post"><?= csrf_field() ?><?php text_input('title', 'Başlık'); text_input('slug', 'Slug'); text_input('category', 'Kategori'); textarea_input('summary', 'Özet'); textarea_input('content', 'İçerik'); text_input('image', 'Görsel URL'); ?><button class="button primary" type="submit">Ekle</button></form>
<div class="list-grid"><?php foreach ($items as $item): ?><article class="list-card"><strong><?= e($item['title']) ?></strong><span><?= e($item['category']) ?></span></article><?php endforeach; ?></div>
<?php admin_footer(); ?>

