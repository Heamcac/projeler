<?php
require_once __DIR__ . '/../includes/auth.php';
require_admin();
$wars = get_wars(500, 0);
admin_header('Savaşlar');
?>
<section class="admin-heading"><h1>Savaşlar</h1><a class="button primary" href="<?= e(app_url('admin/savas-ekle.php')) ?>">Savaş ekle</a></section>
<table class="admin-table"><thead><tr><th>Ad</th><th>Tarih</th><th>Yer</th><th>İşlem</th></tr></thead><tbody>
<?php foreach ($wars as $war): ?><tr><td><?= e($war['name']) ?></td><td><?= e($war['date_text']) ?></td><td><?= e($war['location']) ?></td><td><a href="<?= e(app_url('admin/savas-duzenle.php?id=' . $war['id'])) ?>">Düzenle</a></td></tr><?php endforeach; ?>
</tbody></table>
<?php admin_footer(); ?>

