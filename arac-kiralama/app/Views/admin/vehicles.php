<div class="container-fluid p-4">
    <div class="d-flex justify-content-between mb-3"><h1 class="h3">Araç Yönetimi</h1><button class="btn btn-dark" data-bs-toggle="collapse" data-bs-target="#form">Araç Ekle</button></div>
    <form id="form" class="panel collapse show mb-4" method="post" enctype="multipart/form-data" action="<?= url('admin/vehicles/save') ?>">
        <?= csrf_field() ?><input type="hidden" name="id">
        <div class="row g-2">
            <?php foreach (['name'=>'Araç adı','brand'=>'Marka','model'=>'Model','year'=>'Yıl','plate_number'=>'Plaka','daily_price'=>'Günlük fiyat','mileage'=>'Kilometre'] as $n=>$p): ?>
                <div class="col-md-3"><input required class="form-control" name="<?= e($n) ?>" placeholder="<?= e($p) ?>"></div>
            <?php endforeach; ?>
            <div class="col-md-3"><select class="form-select" name="fuel_type"><option>Petrol</option><option>Dizel</option><option>Hibrit</option><option>Elektrik</option></select></div>
            <div class="col-md-3"><select class="form-select" name="transmission"><option>Manual</option><option>Automatic</option></select></div>
            <div class="col-md-3"><input class="form-control" type="date" name="insurance_expiry" title="Sigorta"></div>
            <div class="col-md-3"><input class="form-control" type="date" name="registration_expiry" title="Tescil"></div>
            <div class="col-md-3"><select class="form-select" name="status"><option value="available">available</option><option value="rented">rented</option><option value="maintenance">maintenance</option><option value="inactive">inactive</option></select></div>
            <div class="col-md-6"><input class="form-control" type="file" name="images[]" multiple accept="image/*"></div>
            <div class="col-12"><textarea class="form-control" name="description" placeholder="Açıklama"></textarea></div>
            <div class="col-12"><button class="btn btn-success">Kaydet</button></div>
        </div>
    </form>
    <div class="table-responsive panel"><table class="table align-middle"><thead><tr><th>Araç</th><th>Plaka</th><th>Fiyat</th><th>Km</th><th>Sigorta</th><th>Durum</th><th></th></tr></thead><tbody>
        <?php foreach ($vehicles as $v): ?><tr><td><?= e($v['name']) ?><div class="small text-muted"><?= e($v['brand'].' '.$v['model'].' '.$v['year']) ?></div></td><td><?= e($v['plate_number']) ?></td><td><?= money($v['daily_price']) ?></td><td><?= e($v['mileage']) ?></td><td><?= e($v['insurance_expiry']) ?></td><td><span class="badge text-bg-secondary"><?= e($v['status']) ?></span></td><td><form method="post" action="<?= url('admin/vehicles/delete') ?>" onsubmit="return confirm('Silinsin mi?')"><?= csrf_field() ?><input type="hidden" name="id" value="<?= e($v['id']) ?>"><button class="btn btn-sm btn-outline-danger">Sil</button></form></td></tr><?php endforeach; ?>
    </tbody></table></div>
</div>
