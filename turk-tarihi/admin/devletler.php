<?php
require_once __DIR__ . '/../includes/auth.php';
require_admin();

if ($_SERVER['REQUEST_METHOD'] === 'POST' && ($_POST['action'] ?? '') === 'delete') {
    verify_csrf();
    db()->prepare('DELETE FROM states WHERE id = ?')->execute([(int) $_POST['id']]);
    admin_redirect('devletler.php');
}

$states = fetch_all('SELECT * FROM states ORDER BY start_year ASC');
admin_header('Devletler');
?>
<section class="admin-heading"><h1>Devletler</h1><a class="button primary" href="<?= e(app_url('admin/devlet-ekle.php')) ?>">Devlet ekle</a></section>
<table class="admin-table">
    <thead><tr><th>Ad</th><th>Slug</th><th>Dönem</th><th>İşlem</th></tr></thead>
    <tbody>
    <?php foreach ($states as $state): ?>
        <tr>
            <td><?= e($state['name']) ?></td>
            <td><?= e($state['slug']) ?></td>
            <td><?= e($state['start_year']) ?> - <?= e($state['end_year']) ?></td>
            <td class="table-actions">
                <a href="<?= e(app_url('admin/devlet-duzenle.php?id=' . $state['id'])) ?>">Düzenle</a>
                <form method="post" onsubmit="return confirm('Bu devleti silmek istiyor musunuz?')"><?= csrf_field() ?><input type="hidden" name="action" value="delete"><input type="hidden" name="id" value="<?= e((string) $state['id']) ?>"><button type="submit">Sil</button></form>
            </td>
        </tr>
    <?php endforeach; ?>
    </tbody>
</table>
<?php admin_footer(); ?>

