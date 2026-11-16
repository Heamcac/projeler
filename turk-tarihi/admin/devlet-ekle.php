<?php
require_once __DIR__ . '/../includes/auth.php';
require_admin();

$data = [];
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    verify_csrf();
    $data = $_POST;
    $slug = trim((string) ($_POST['slug'] ?? '')) ?: slugify((string) $_POST['name']);
    db()->prepare(
        'INSERT INTO states (name, slug, short_description, description, start_year, end_year, capital, founder, government, religion, region, flag_image, symbol_image, map_image, hero_image, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    )->execute([
        $_POST['name'], $slug, $_POST['short_description'], $_POST['description'], $_POST['start_year'] ?: null, $_POST['end_year'] ?: null,
        $_POST['capital'], $_POST['founder'], $_POST['government'], $_POST['religion'], $_POST['region'], $_POST['flag_image'], $_POST['symbol_image'], $_POST['map_image'], $_POST['hero_image'], $_POST['status'] ?: 'published',
    ]);
    admin_redirect('devletler.php');
}

admin_header('Devlet Ekle');
?>
<section class="admin-heading"><h1>Devlet ekle</h1></section>
<form class="admin-form" method="post">
    <?= csrf_field() ?>
    <?php
    text_input('name', 'Ad', $data);
    text_input('slug', 'Slug', $data);
    textarea_input('short_description', 'Kısa açıklama', $data);
    textarea_input('description', 'Açıklama', $data);
    text_input('start_year', 'Başlangıç yılı', $data, 'number');
    text_input('end_year', 'Bitiş yılı', $data, 'number');
    text_input('capital', 'Başkent', $data);
    text_input('founder', 'Kurucu', $data);
    text_input('government', 'Yönetim', $data);
    text_input('religion', 'Din', $data);
    text_input('region', 'Bölge', $data);
    text_input('flag_image', 'Bayrak görsel URL', $data);
    text_input('symbol_image', 'Sembol görsel URL', $data);
    text_input('map_image', 'Harita görsel URL', $data);
    text_input('hero_image', 'Hero görsel URL', $data);
    text_input('status', 'Durum', ['status' => 'published']);
    ?>
    <button class="button primary" type="submit">Kaydet</button>
</form>
<?php admin_footer(); ?>

