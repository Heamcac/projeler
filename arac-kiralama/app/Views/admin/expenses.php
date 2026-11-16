<div class="container-fluid p-4">
    <h1 class="h3 mb-3">Gider Yönetimi</h1>
    <form class="panel mb-4" method="post" action="<?= url('admin/expenses/save') ?>">
        <?= csrf_field() ?><div class="row g-2">
            <div class="col-md-3"><select name="vehicle_id" class="form-select"><option value="">Genel gider</option><?php foreach($vehicles as $v): ?><option value="<?= e($v['id']) ?>"><?= e($v['name']) ?></option><?php endforeach; ?></select></div>
            <div class="col-md-2"><select name="category" class="form-select"><?php foreach(['fuel','service','insurance','tax','fine','other'] as $cat): ?><option><?= e($cat) ?></option><?php endforeach; ?></select></div>
            <div class="col-md-2"><input type="date" name="expense_date" class="form-control" required></div>
            <div class="col-md-2"><input name="amount" class="form-control" placeholder="Tutar" required></div>
            <div class="col-md-3"><input name="description" class="form-control" placeholder="Açıklama"></div>
            <div class="col-12"><button class="btn btn-success">Gider Kaydet</button></div>
        </div>
    </form>
    <div class="panel table-responsive"><table class="table"><thead><tr><th>Araç</th><th>Kategori</th><th>Tarih</th><th>Açıklama</th><th>Tutar</th></tr></thead><tbody><?php foreach($expenses as $e): ?><tr><td><?= e($e['vehicle_name'] ?? 'Genel') ?></td><td><?= e($e['category']) ?></td><td><?= e($e['expense_date']) ?></td><td><?= e($e['description']) ?></td><td><?= money($e['amount']) ?></td></tr><?php endforeach; ?></tbody></table></div>
</div>
