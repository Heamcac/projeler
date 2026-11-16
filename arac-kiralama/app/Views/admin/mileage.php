<div class="container-fluid p-4">
    <h1 class="h3 mb-3">Kilometre Yönetimi</h1>
    <form class="panel mb-4" method="post" action="<?= url('admin/mileage/save') ?>">
        <?= csrf_field() ?><div class="row g-2">
            <div class="col-md-3"><select name="vehicle_id" class="form-select"><?php foreach($vehicles as $v): ?><option value="<?= e($v['id']) ?>"><?= e($v['name']) ?></option><?php endforeach; ?></select></div>
            <div class="col-md-3"><select name="reservation_id" class="form-select"><option value="">Rezervasyonsuz</option><?php foreach($reservations as $r): ?><option value="<?= e($r['id']) ?>"><?= e($r['customer_name'].' - '.$r['vehicle_name']) ?></option><?php endforeach; ?></select></div>
            <div class="col-md-2"><input type="date" name="log_date" class="form-control" required></div>
            <div class="col-md-2"><input name="start_mileage" class="form-control" placeholder="Başlangıç km"></div>
            <div class="col-md-2"><input name="end_mileage" class="form-control" placeholder="Bitiş km"></div>
            <div class="col-12"><input name="notes" class="form-control" placeholder="Notlar"></div>
            <div class="col-12"><button class="btn btn-success">Kilometre Kaydet</button></div>
        </div>
    </form>
    <div class="panel table-responsive"><table class="table"><thead><tr><th>Araç</th><th>Tarih</th><th>Başlangıç</th><th>Bitiş</th><th>Not</th></tr></thead><tbody><?php foreach($logs as $l): ?><tr><td><?= e($l['vehicle_name']) ?></td><td><?= e($l['log_date']) ?></td><td><?= e($l['start_mileage']) ?></td><td><?= e($l['end_mileage']) ?></td><td><?= e($l['notes']) ?></td></tr><?php endforeach; ?></tbody></table></div>
</div>
