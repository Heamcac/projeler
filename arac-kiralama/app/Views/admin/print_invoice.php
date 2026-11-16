<!doctype html>
<html lang="tr">
<head>
    <meta charset="utf-8">
    <title>Fatura</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
    <style>body{padding:32px}.print-actions{position:fixed;right:20px;top:20px}@media print{.print-actions{display:none}}</style>
</head>
<body>
<?php if (!$invoice): ?><p>Fatura bulunamadı.</p><?php else: ?>
<button class="btn btn-dark print-actions" onclick="window.print()">Yazdır / PDF</button>
<div class="d-flex justify-content-between">
    <div><h1 class="h3"><?= e(config('company.name')) ?></h1><p><?= e(config('company.address')) ?><br><?= e(config('company.phone')) ?><br><?= e(config('company.email')) ?></p></div>
    <div class="text-end"><h2 class="h4">Fatura</h2><p><?= e($invoice['invoice_number']) ?><br><?= e(date('Y-m-d')) ?></p></div>
</div>
<hr>
<p><strong>Müşteri:</strong> <?= e($invoice['full_name']) ?><br><?= e($invoice['address']) ?><br><?= e($invoice['email']) ?> · <?= e($invoice['phone']) ?></p>
<table class="table table-bordered">
    <thead><tr><th>Açıklama</th><th>Gün</th><th>Birim</th><th>Toplam</th></tr></thead>
    <tbody><tr><td><?= e($invoice['vehicle_name']) ?> (<?= e($invoice['plate_number']) ?>)</td><td><?= e($invoice['days']) ?></td><td><?= money($invoice['daily_price']) ?></td><td><?= money($invoice['days'] * $invoice['daily_price']) ?></td></tr></tbody>
    <tfoot>
        <tr><th colspan="3">Kosova dışı / Ek sürücü</th><td><?= money($invoice['outside_kosovo_fee'] + $invoice['additional_driver_fee']) ?></td></tr>
        <tr><th colspan="3">Vergi</th><td><?= money($invoice['tax']) ?></td></tr>
        <tr><th colspan="3">Genel Toplam</th><td><?= money($invoice['total']) ?></td></tr>
    </tfoot>
</table>
<?php endif; ?>
</body>
</html>
