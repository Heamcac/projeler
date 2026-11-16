<div class="container-fluid p-4">
    <h1 class="h3 mb-3">Müşteri Yönetimi</h1>
    <form class="panel mb-4" method="post" action="<?= url('admin/customers/save') ?>">
        <?= csrf_field() ?><input type="hidden" name="id">
        <div class="row g-2">
            <?php foreach(['full_name'=>'Ad soyad','phone'=>'Telefon','email'=>'E-posta','address'=>'Adres','passport_no'=>'Pasaport','license_no'=>'Sürücü belgesi'] as $n=>$p): ?>
                <div class="col-md-4"><input class="form-control" name="<?= e($n) ?>" placeholder="<?= e($p) ?>" <?= $n==='full_name'?'required':'' ?>></div>
            <?php endforeach; ?>
            <div class="col-md-4"><input type="date" class="form-control" name="license_expiry"></div>
            <div class="col-12"><button class="btn btn-success">Müşteri Kaydet</button></div>
        </div>
    </form>
    <div class="table-responsive panel"><table class="table align-middle"><thead><tr><th>Müşteri</th><th>İletişim</th><th>Belgeler</th><th>Rezervasyon Geçmişi</th><th></th></tr></thead><tbody>
        <?php foreach($customers as $c): ?><tr><td><?= e($c['full_name']) ?><div class="small text-muted"><?= e($c['address']) ?></div></td><td><?= e($c['phone']) ?><br><?= e($c['email']) ?></td><td><?= e($c['passport_no']) ?><br><?= e($c['license_no']) ?></td><td><?php foreach($reservations as $r){ if($r['customer_id']==$c['id']) echo '<span class="badge text-bg-light me-1">'.e($r['vehicle_name']).'</span>'; } ?></td><td><form method="post" action="<?= url('admin/customers/delete') ?>"><?= csrf_field() ?><input type="hidden" name="id" value="<?= e($c['id']) ?>"><button class="btn btn-sm btn-outline-danger">Sil</button></form></td></tr><?php endforeach; ?>
    </tbody></table></div>
</div>
