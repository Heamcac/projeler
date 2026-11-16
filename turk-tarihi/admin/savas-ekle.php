<?php
require_once __DIR__ . '/../includes/auth.php';
require_admin();
$data = [];
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    verify_csrf();
    $slug = trim((string) ($_POST['slug'] ?? '')) ?: slugify((string) $_POST['name']);
    db()->prepare('INSERT INTO wars (name, slug, date_text, year, location, result, description, background, battle, aftermath, importance, map_image) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
        ->execute([$_POST['name'], $slug, $_POST['date_text'], $_POST['year'] ?: null, $_POST['location'], $_POST['result'], $_POST['description'], $_POST['background'], $_POST['battle'], $_POST['aftermath'], $_POST['importance'], $_POST['map_image']]);
    admin_redirect('savaslar.php');
}
admin_header('Savaş Ekle');
?>
<section class="admin-heading"><h1>Savaş ekle</h1></section>
<form class="admin-form" method="post"><?= csrf_field() ?>
<?php foreach (['name' => 'Ad', 'slug' => 'Slug', 'date_text' => 'Tarih metni', 'location' => 'Yer', 'result' => 'Sonuç', 'map_image' => 'Harita URL'] as $name => $label) text_input($name, $label, $data); text_input('year', 'Yıl', $data, 'number'); foreach (['description' => 'Açıklama', 'background' => 'Arka plan', 'battle' => 'Savaş', 'aftermath' => 'Sonrası', 'importance' => 'Önemi'] as $name => $label) textarea_input($name, $label, $data); ?>
<button class="button primary" type="submit">Kaydet</button></form>
<?php admin_footer(); ?>

