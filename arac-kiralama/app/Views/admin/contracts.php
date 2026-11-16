<div class="container-fluid p-4">
    <h1 class="h3 mb-3">Sözleşme ve Fatura</h1>
    <div class="alert alert-info">Onaylanan rezervasyonlar için sözleşme ve fatura otomatik oluşturulur.</div>
    <div class="table-responsive panel"><table class="table align-middle"><thead><tr><th>No</th><th>Müşteri</th><th>Araç</th><th>Tarih</th><th>Yazdır</th></tr></thead><tbody>
        <?php foreach($contracts as $c): ?><tr><td><?= e($c['contract_number']) ?></td><td><?= e($c['full_name']) ?></td><td><?= e($c['vehicle_name']) ?></td><td><?= e($c['pickup_at']) ?> - <?= e($c['return_at']) ?></td><td><a target="_blank" class="btn btn-sm btn-outline-dark" href="<?= url('admin/contract/print?reservation_id='.$c['reservation_id']) ?>">Sözleşme</a> <a target="_blank" class="btn btn-sm btn-outline-success" href="<?= url('admin/invoice/print?reservation_id='.$c['reservation_id']) ?>">Fatura</a></td></tr><?php endforeach; ?>
    </tbody></table></div>
</div>
