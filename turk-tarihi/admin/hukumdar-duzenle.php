<?php
require_once __DIR__ . '/../includes/auth.php';
require_admin();
$id = (int) ($_GET['id'] ?? 0);
$ruler = fetch_one('SELECT * FROM rulers WHERE id = ? LIMIT 1', [$id]);
if (!$ruler) { admin_redirect('hukumdarlar.php'); }
$states = fetch_all('SELECT id, name FROM states ORDER BY name');
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    verify_csrf();
    $slug = trim((string) ($_POST['slug'] ?? '')) ?: slugify((string) $_POST['name']);
    db()->prepare('UPDATE rulers SET state_id=?, name=?, slug=?, birth_year=?, death_year=?, reign_start=?, reign_end=?, biography=?, achievements=?, image=? WHERE id=?')
        ->execute([$_POST['state_id'], $_POST['name'], $slug, $_POST['birth_year'] ?: null, $_POST['death_year'] ?: null, $_POST['reign_start'] ?: null, $_POST['reign_end'] ?: null, $_POST['biography'], $_POST['achievements'], $_POST['image'], $id]);
    admin_redirect('hukumdarlar.php');
}
admin_header('Hükümdar Düzenle');
?>
<section class="admin-heading"><h1>Hükümdar düzenle</h1></section>
<form class="admin-form" method="post"><?= csrf_field() ?>
    <label>Devlet<select name="state_id"><?php foreach ($states as $state): ?><option value="<?= e((string) $state['id']) ?>" <?= (int) $ruler['state_id'] === (int) $state['id'] ? 'selected' : '' ?>><?= e($state['name']) ?></option><?php endforeach; ?></select></label>
    <?php text_input('name', 'Ad', $ruler); text_input('slug', 'Slug', $ruler); text_input('birth_year', 'Doğum yılı', $ruler, 'number'); text_input('death_year', 'Ölüm yılı', $ruler, 'number'); text_input('reign_start', 'Tahta çıkış', $ruler, 'number'); text_input('reign_end', 'Tahttan ayrılış', $ruler, 'number'); textarea_input('biography', 'Biyografi', $ruler); textarea_input('achievements', 'Başarılar', $ruler); text_input('image', 'Görsel URL', $ruler); ?>
    <button class="button primary" type="submit">Güncelle</button>
</form>
<?php admin_footer(); ?>

