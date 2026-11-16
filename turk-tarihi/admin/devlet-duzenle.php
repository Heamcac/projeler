<?php
require_once __DIR__ . '/../includes/auth.php';
require_admin();
$id = (int) ($_GET['id'] ?? 0);
$state = fetch_one('SELECT * FROM states WHERE id = ? LIMIT 1', [$id]);
if (!$state) {
    admin_redirect('devletler.php');
}
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    verify_csrf();
    $slug = trim((string) ($_POST['slug'] ?? '')) ?: slugify((string) $_POST['name']);
    db()->prepare(
        'UPDATE states SET name=?, slug=?, short_description=?, description=?, start_year=?, end_year=?, capital=?, founder=?, government=?, religion=?, region=?, flag_image=?, symbol_image=?, map_image=?, hero_image=?, status=? WHERE id=?'
    )->execute([
        $_POST['name'], $slug, $_POST['short_description'], $_POST['description'], $_POST['start_year'] ?: null, $_POST['end_year'] ?: null,
        $_POST['capital'], $_POST['founder'], $_POST['government'], $_POST['religion'], $_POST['region'], $_POST['flag_image'], $_POST['symbol_image'], $_POST['map_image'], $_POST['hero_image'], $_POST['status'], $id,
    ]);
    admin_redirect('devletler.php');
}
admin_header('Devlet Düzenle');
?>
<section class="admin-heading"><h1>Devlet düzenle</h1></section>
<form class="admin-form" method="post">
    <?= csrf_field() ?>
    <?php
    foreach (['name' => 'Ad', 'slug' => 'Slug', 'capital' => 'Başkent', 'founder' => 'Kurucu', 'government' => 'Yönetim', 'religion' => 'Din', 'region' => 'Bölge', 'flag_image' => 'Bayrak görsel URL', 'symbol_image' => 'Sembol görsel URL', 'map_image' => 'Harita görsel URL', 'hero_image' => 'Hero görsel URL', 'status' => 'Durum'] as $name => $label) {
        text_input($name, $label, $state);
    }
    text_input('start_year', 'Başlangıç yılı', $state, 'number');
    text_input('end_year', 'Bitiş yılı', $state, 'number');
    textarea_input('short_description', 'Kısa açıklama', $state);
    textarea_input('description', 'Açıklama', $state);
    ?>
    <button class="button primary" type="submit">Güncelle</button>
</form>
<?php admin_footer(); ?>

