<div class="container-fluid p-4">
    <h1 class="h3 mb-3">Hasar ve Kaza Raporları</h1>
    <form class="panel mb-4" method="post" enctype="multipart/form-data" action="<?= url('admin/damage/save') ?>">
        <?= csrf_field() ?><div class="row g-2">
            <div class="col-md-3"><select name="vehicle_id" class="form-select"><?php foreach($vehicles as $v): ?><option value="<?= e($v['id']) ?>"><?= e($v['name']) ?></option><?php endforeach; ?></select></div>
            <div class="col-md-2"><input type="date" name="report_date" class="form-control" required></div>
            <div class="col-md-2"><input name="cost" class="form-control" placeholder="Maliyet"></div>
            <div class="col-md-3"><input name="file" type="file" class="form-control"></div>
            <div class="col-md-6"><input name="description" class="form-control" placeholder="Açıklama"></div>
            <div class="col-md-6"><input name="status_notes" class="form-control" placeholder="Araç durum notları"></div>
            <div class="col-12"><button class="btn btn-success">Rapor Kaydet</button></div>
        </div>
    </form>
    <div class="panel table-responsive"><table class="table"><thead><tr><th>Araç</th><th>Tarih</th><th>Açıklama</th><th>Maliyet</th><th>Dosya</th><th>Not</th></tr></thead><tbody><?php foreach($reports as $r): ?><tr><td><?= e($r['vehicle_name']) ?></td><td><?= e($r['report_date']) ?></td><td><?= e($r['description']) ?></td><td><?= money($r['cost']) ?></td><td><?php if($r['file_path']): ?><a href="<?= url($r['file_path']) ?>" target="_blank">Aç</a><?php endif; ?></td><td><?= e($r['status_notes']) ?></td></tr><?php endforeach; ?></tbody></table></div>
</div>
