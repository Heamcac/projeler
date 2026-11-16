<div class="container-fluid p-4">
    <h1 class="h3 mb-3">Raporlama</h1>
    <div class="row g-3 mb-4">
        <div class="col-md-3"><div class="metric success"><span>Toplam Gelir</span><strong><?= money($stats['revenue']) ?></strong></div></div>
        <div class="col-md-3"><div class="metric danger"><span>Toplam Gider</span><strong><?= money($stats['expenses']) ?></strong></div></div>
        <div class="col-md-3"><div class="metric info"><span>Net Kazanç</span><strong><?= money($net) ?></strong></div></div>
        <div class="col-md-3"><div class="metric warning"><span>Bekleyen</span><strong><?= e($stats['pending']) ?></strong></div></div>
    </div>
    <div class="row g-4">
        <div class="col-lg-6"><div class="panel"><h2 class="h5">Araç Müsaitlik</h2><table class="table"><tbody><?php foreach($vehicles as $v): ?><tr><td><?= e($v['name']) ?></td><td><span class="badge text-bg-secondary"><?= e($v['status']) ?></span></td></tr><?php endforeach; ?></tbody></table></div></div>
        <div class="col-lg-6"><div class="panel"><h2 class="h5">En Çok Kiralanan Araçlar</h2><table class="table"><tbody><?php foreach($topVehicles as $v): ?><tr><td><?= e($v['name']) ?></td><td><?= e($v['rentals']) ?> kiralama</td><td><?= money($v['revenue']) ?></td></tr><?php endforeach; ?></tbody></table></div></div>
    </div>
</div>
