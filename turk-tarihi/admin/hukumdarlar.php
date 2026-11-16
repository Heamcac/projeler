<?php
require_once __DIR__ . '/../includes/auth.php';
require_admin();
$rulers = get_rulers(500, 0);
admin_header('Hükümdarlar');
?>
<section class="admin-heading"><h1>Hükümdarlar</h1><a class="button primary" href="<?= e(app_url('admin/hukumdar-ekle.php')) ?>">Hükümdar ekle</a></section>
<table class="admin-table"><thead><tr><th>Ad</th><th>Devlet</th><th>Dönem</th><th>İşlem</th></tr></thead><tbody>
<?php foreach ($rulers as $ruler): ?>
<tr><td><?= e($ruler['name']) ?></td><td><?= e($ruler['state_name']) ?></td><td><?= e($ruler['reign_start']) ?> - <?= e($ruler['reign_end']) ?></td><td><a href="<?= e(app_url('admin/hukumdar-duzenle.php?id=' . $ruler['id'])) ?>">Düzenle</a></td></tr>
<?php endforeach; ?>
</tbody></table>
<?php admin_footer(); ?>

