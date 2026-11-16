<div class="container-fluid p-4">
    <h1 class="h3 mb-3">Admin Kullanıcıları</h1>
    <form class="panel mb-4" method="post" action="<?= url('admin/admins/save') ?>">
        <?= csrf_field() ?><div class="row g-2">
            <div class="col-md-3"><input name="name" class="form-control" placeholder="Ad" required></div>
            <div class="col-md-3"><input type="email" name="email" class="form-control" placeholder="E-posta" required></div>
            <div class="col-md-2"><input type="password" name="password" class="form-control" placeholder="Şifre" required></div>
            <div class="col-md-2"><select name="role" class="form-select"><option>admin</option><option>manager</option></select></div>
            <div class="col-md-2 form-check pt-2"><input class="form-check-input" type="checkbox" name="is_active" checked id="active"><label for="active">Aktif</label></div>
            <div class="col-12"><button class="btn btn-success">Admin Ekle</button></div>
        </div>
    </form>
    <div class="panel table-responsive"><table class="table"><thead><tr><th>Ad</th><th>E-posta</th><th>Rol</th><th>Aktif</th></tr></thead><tbody><?php foreach($admins as $a): ?><tr><td><?= e($a['name']) ?></td><td><?= e($a['email']) ?></td><td><?= e($a['role']) ?></td><td><?= $a['is_active'] ? 'Evet' : 'Hayır' ?></td></tr><?php endforeach; ?></tbody></table></div>
</div>
