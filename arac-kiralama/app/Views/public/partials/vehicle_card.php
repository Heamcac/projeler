<div class="col-md-6 col-xl-4">
    <div class="card car-card h-100">
        <img src="<?= url($vehicle['image_path'] ?: 'assets/css/car-placeholder.svg') ?>" class="card-img-top" alt="<?= e($vehicle['name']) ?>">
        <div class="card-body d-flex flex-column">
            <h3 class="h5"><?= e($vehicle['name']) ?></h3>
            <p class="text-muted mb-2"><?= e($vehicle['brand'] . ' ' . $vehicle['model'] . ' · ' . $vehicle['year']) ?></p>
            <div class="d-flex gap-2 flex-wrap small mb-3">
                <span class="badge text-bg-light"><?= e($vehicle['fuel_type']) ?></span>
                <span class="badge text-bg-light"><?= e($vehicle['transmission']) ?></span>
                <span class="badge text-bg-success"><?= money($vehicle['daily_price']) ?>/<?= e(t('day')) ?></span>
            </div>
            <a href="<?= url('vehicle?id=' . $vehicle['id']) ?>" class="btn btn-dark mt-auto"><?= e(t('details_reserve')) ?></a>
        </div>
    </div>
</div>
