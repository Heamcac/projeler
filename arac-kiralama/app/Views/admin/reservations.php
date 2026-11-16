<div class="container-fluid p-4">
    <h1 class="h3 mb-3">Rezervasyon Yönetimi</h1>
    <form class="panel mb-4" method="post" action="<?= url('admin/reservations/save') ?>">
        <?= csrf_field() ?><input type="hidden" name="id">
        <div class="row g-2">
            <div class="col-md-3"><select required class="form-select" name="customer_id"><option value="">Müşteri</option><?php foreach($customers as $c): ?><option value="<?= e($c['id']) ?>"><?= e($c['full_name']) ?></option><?php endforeach; ?></select></div>
            <div class="col-md-3"><select required class="form-select" name="vehicle_id"><option value="">Araç</option><?php foreach($vehicles as $v): ?><option value="<?= e($v['id']) ?>"><?= e($v['name']) ?> - <?= e($v['plate_number']) ?></option><?php endforeach; ?></select></div>
            <div class="col-md-3"><input required type="datetime-local" class="form-control" name="pickup_at"></div>
            <div class="col-md-3"><input required type="datetime-local" class="form-control" name="return_at"></div>
            <div class="col-md-3"><input required class="form-control" name="pickup_location" placeholder="Teslim alma yeri"></div>
            <div class="col-md-3"><input required class="form-control" name="return_location" placeholder="İade yeri"></div>
            <div class="col-md-2"><input class="form-control" name="daily_price" placeholder="Günlük fiyat"></div>
            <div class="col-md-2"><input class="form-control" name="outside_kosovo_fee" value="0" placeholder="Kosova dışı"></div>
            <div class="col-md-2"><input class="form-control" name="additional_driver_fee" value="0" placeholder="Ek sürücü"></div>
            <div class="col-md-2"><input class="form-control" name="start_mileage" placeholder="Başlangıç km"></div>
            <div class="col-md-2"><input class="form-control" name="end_mileage" placeholder="Bitiş km"></div>
            <div class="col-md-2"><select class="form-select" name="status"><?php foreach(['pending','approved','rejected','active','completed','cancelled'] as $s): ?><option><?= e($s) ?></option><?php endforeach; ?></select></div>
            <div class="col-12"><textarea class="form-control" name="notes" placeholder="Notlar"></textarea></div>
            <div class="col-12"><button class="btn btn-success">Rezervasyon Kaydet</button></div>
        </div>
    </form>
    <div class="table-responsive panel"><table class="table align-middle"><thead><tr><th>Müşteri</th><th>Araç</th><th>Tarih</th><th>Tutar</th><th>Durum</th><th>İşlem</th></tr></thead><tbody>
        <?php foreach($reservations as $r): ?><tr><td><?= e($r['customer_name']) ?></td><td><?= e($r['vehicle_name']) ?><div class="small text-muted"><?= e($r['plate_number']) ?></div></td><td><?= e($r['pickup_at']) ?><br><?= e($r['return_at']) ?></td><td><?= money($r['total_price']) ?></td><td><span class="badge text-bg-dark"><?= e($r['status']) ?></span></td><td><form class="d-flex gap-1" method="post" action="<?= url('admin/reservations/status') ?>"><?= csrf_field() ?><input type="hidden" name="id" value="<?= e($r['id']) ?>"><select class="form-select form-select-sm" name="status"><?php foreach(['pending','approved','rejected','active','completed','cancelled'] as $s): ?><option <?= $r['status']===$s?'selected':'' ?>><?= e($s) ?></option><?php endforeach; ?></select><button class="btn btn-sm btn-outline-primary">Güncelle</button></form></td></tr><?php endforeach; ?>
    </tbody></table></div>
</div>
