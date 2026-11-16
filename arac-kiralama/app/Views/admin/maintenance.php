<div class="container-fluid p-4">
    <h1 class="h3 mb-3">Servis ve Bakım</h1>
    <form class="panel mb-4" method="post" action="<?= url('admin/maintenance/save') ?>">
        <?= csrf_field() ?><div class="row g-2">
            <div class="col-md-3"><select name="vehicle_id" class="form-select"><?php foreach($vehicles as $v): ?><option value="<?= e($v['id']) ?>"><?= e($v['name']) ?></option><?php endforeach; ?></select></div>
            <div class="col-md-2"><input type="date" name="service_date" class="form-control" required></div>
            <div class="col-md-2"><input name="cost" class="form-control" placeholder="Maliyet"></div>
            <div class="col-md-2"><input name="next_service_mileage" class="form-control" placeholder="Sonraki km"></div>
            <div class="col-md-3"><input name="description" class="form-control" placeholder="Açıklama"></div>
            <div class="col-12"><button class="btn btn-success">Servis Kaydet</button></div>
        </div>
    </form>
    <div class="panel table-responsive"><table class="table"><thead><tr><th>Araç</th><th>Tarih</th><th>Açıklama</th><th>Maliyet</th><th>Sonraki Km</th></tr></thead><tbody><?php foreach($records as $r): ?><tr><td><?= e($r['vehicle_name']) ?></td><td><?= e($r['service_date']) ?></td><td><?= e($r['description']) ?></td><td><?= money($r['cost']) ?></td><td><?= e($r['next_service_mileage']) ?></td></tr><?php endforeach; ?></tbody></table></div>
</div>
