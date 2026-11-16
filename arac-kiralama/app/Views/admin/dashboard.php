<div class="container-fluid p-4">
    <h1 class="h3 fw-bold mb-4">Dashboard</h1>
    <div class="row g-3 mb-4">
        <div class="col-md"><div class="metric"><span>Araç</span><strong><?= e($stats['vehicles']) ?></strong></div></div>
        <div class="col-md"><div class="metric warning"><span>Bekleyen</span><strong><?= e($stats['pending']) ?></strong></div></div>
        <div class="col-md"><div class="metric info"><span>Aktif</span><strong><?= e($stats['active']) ?></strong></div></div>
        <div class="col-md"><div class="metric success"><span>Gelir</span><strong><?= money($stats['revenue']) ?></strong></div></div>
        <div class="col-md"><div class="metric danger"><span>Gider</span><strong><?= money($stats['expenses']) ?></strong></div></div>
    </div>
    <div class="row g-4">
        <div class="col-lg-6">
            <div class="panel">
                <h2 class="h5">Yaklaşan Sigorta Bitişleri</h2>
                <?php foreach ($insuranceAlerts as $v): ?><div class="alert alert-warning py-2 mb-2"><?= e($v['name']) ?> · <?= e($v['insurance_expiry']) ?></div><?php endforeach; ?>
            </div>
        </div>
        <div class="col-lg-6">
            <div class="panel">
                <h2 class="h5">Yaklaşan Tescil Bitişleri</h2>
                <?php foreach ($registrationAlerts as $v): ?><div class="alert alert-info py-2 mb-2"><?= e($v['name']) ?> · <?= e($v['registration_expiry']) ?></div><?php endforeach; ?>
            </div>
        </div>
    </div>
</div>
