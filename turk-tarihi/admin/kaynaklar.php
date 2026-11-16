<?php
require_once __DIR__ . '/../includes/auth.php';
require_admin();
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    verify_csrf();
    db()->prepare('INSERT INTO sources (title, author, publisher, year, url, source_type) VALUES (?, ?, ?, ?, ?, ?)')
        ->execute([$_POST['title'], $_POST['author'], $_POST['publisher'], $_POST['year'] ?: null, $_POST['url'], $_POST['source_type']]);
    admin_redirect('kaynaklar.php');
}
$sources = get_sources();
admin_header('Kaynaklar');
?>
<section class="admin-heading"><h1>Kaynaklar</h1></section>
<form class="admin-form inline-form" method="post"><?= csrf_field() ?><?php text_input('title', 'Başlık'); text_input('author', 'Yazar'); text_input('publisher', 'Yayıncı'); text_input('year', 'Yıl', [], 'number'); text_input('url', 'URL'); text_input('source_type', 'Tür'); ?><button class="button primary" type="submit">Ekle</button></form>
<table class="admin-table"><thead><tr><th>Başlık</th><th>Yazar</th><th>Yıl</th></tr></thead><tbody><?php foreach ($sources as $source): ?><tr><td><?= e($source['title']) ?></td><td><?= e($source['author']) ?></td><td><?= e((string) $source['year']) ?></td></tr><?php endforeach; ?></tbody></table>
<?php admin_footer(); ?>

