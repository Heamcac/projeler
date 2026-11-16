<!doctype html>
<html lang="tr">
<head>
    <meta charset="utf-8">
    <title>Kiralama Sözleşmesi</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
    <style>body{padding:32px}.print-actions{position:fixed;right:20px;top:20px}@media print{.print-actions{display:none}}</style>
</head>
<body>
<?php if (!$contract): ?><p>Sözleşme bulunamadı.</p><?php else: ?>
<button class="btn btn-dark print-actions" onclick="window.print()">Yazdır / PDF</button>
<h1 class="h3"><?= e(config('company.name')) ?> Kiralama Sözleşmesi</h1>
<p><strong>Sözleşme No:</strong> <?= e($contract['contract_number']) ?></p>
<hr>
<div class="row">
    <div class="col-6"><h2 class="h5">Müşteri</h2><p><?= e($contract['full_name']) ?><br><?= e($contract['phone']) ?><br><?= e($contract['email']) ?><br>Pasaport: <?= e($contract['passport_no']) ?><br>Ehliyet: <?= e($contract['license_no']) ?></p></div>
    <div class="col-6"><h2 class="h5">Araç</h2><p><?= e($contract['vehicle_name']) ?><br><?= e($contract['brand'].' '.$contract['model']) ?><br>Plaka: <?= e($contract['plate_number']) ?></p></div>
</div>
<table class="table table-bordered">
    <tr><th>Teslim Alma</th><td><?= e($contract['pickup_location']) ?> · <?= e($contract['pickup_at']) ?></td></tr>
    <tr><th>İade</th><td><?= e($contract['return_location']) ?> · <?= e($contract['return_at']) ?></td></tr>
    <tr><th>Gün / Tutar</th><td><?= e($contract['days']) ?> gün · <?= money($contract['total_price']) ?></td></tr>
    <tr><th>Kilometre</th><td><?= e($contract['start_mileage']) ?> - <?= e($contract['end_mileage']) ?></td></tr>
</table>
<h2 class="h5">Sözleşme Şartları</h2>
<p><?= nl2br(e($contract['terms'])) ?></p>
<h2 class="h5">Sigorta Koşulları</h2>
<p><?= nl2br(e($contract['insurance_terms'])) ?></p>
<div class="row mt-5"><div class="col-6">Şirket İmza</div><div class="col-6">Müşteri İmza</div></div>
<?php endif; ?>
</body>
</html>
