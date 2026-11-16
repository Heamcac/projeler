<?php
require_once __DIR__ . '/../includes/auth.php';
require_admin();
$states = fetch_all('SELECT id, name FROM states ORDER BY name');
$data = [];
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    verify_csrf();
    $slug = trim((string) ($_POST['slug'] ?? '')) ?: slugify((string) $_POST['name']);
    db()->prepare('INSERT INTO rulers (state_id, name, slug, birth_year, death_year, reign_start, reign_end, biography, achievements, image) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
        ->execute([$_POST['state_id'], $_POST['name'], $slug, $_POST['birth_year'] ?: null, $_POST['death_year'] ?: null, $_POST['reign_start'] ?: null, $_POST['reign_end'] ?: null, $_POST['biography'], $_POST['achievements'], $_POST['image']]);
    admin_redirect('hukumdarlar.php');
}
admin_header('Hükümdar Ekle');
?>
<section class="admin-heading"><h1>Hükümdar ekle</h1></section>
<form class="admin-form" method="post"><?= csrf_field() ?>
    <label>Devlet<select name="state_id"><?php foreach ($states as $state): ?><option value="<?= e((string) $state['id']) ?>"><?= e($state['name']) ?></option><?php endforeach; ?></select></label>
    <?php text_input('name', 'Ad', $data); text_input('slug', 'Slug', $data); text_input('birth_year', 'Doğum yılı', $data, 'number'); text_input('death_year', 'Ölüm yılı', $data, 'number'); text_input('reign_start', 'Tahta çıkış', $data, 'number'); text_input('reign_end', 'Tahttan ayrılış', $data, 'number'); textarea_input('biography', 'Biyografi', $data); textarea_input('achievements', 'Başarılar', $data); text_input('image', 'Görsel URL', $data); ?>
    <button class="button primary" type="submit">Kaydet</button>
</form>
<?php admin_footer(); ?>

