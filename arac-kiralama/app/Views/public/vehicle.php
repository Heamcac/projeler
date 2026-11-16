<section class="container py-5">
    <div class="row g-5">
        <div class="col-lg-7">
            <?php $main = $images[0]['image_path'] ?? 'assets/css/car-placeholder.svg'; ?>
            <img class="vehicle-main mb-3" src="<?= url($main) ?>" alt="<?= e($vehicle['name']) ?>">
            <div class="row g-2">
                <?php foreach ($images as $image): ?>
                    <div class="col-3"><img class="thumb" src="<?= url($image['image_path']) ?>" alt=""></div>
                <?php endforeach; ?>
            </div>
        </div>
        <div class="col-lg-5">
            <h1 class="h2 fw-bold"><?= e($vehicle['name']) ?></h1>
            <p class="text-muted"><?= e($vehicle['brand'] . ' ' . $vehicle['model']) ?></p>
            <p><?= e($vehicle['description']) ?></p>
            <div class="price-box mb-4"><?= money($vehicle['daily_price']) ?> / <?= e(t('day')) ?></div>
            <form method="post" action="<?= url('reservation/request') ?>" class="card p-3 shadow-sm">
                <?= csrf_field() ?>
                <input type="hidden" name="vehicle_id" value="<?= e($vehicle['id']) ?>">
                <h2 class="h5"><?= e(t('reservation_request')) ?></h2>
                <div class="row g-2">
                    <div class="col-12"><input required name="full_name" class="form-control" placeholder="<?= e(t('full_name')) ?>"></div>
                    <div class="col-md-6"><input required name="phone" class="form-control" placeholder="<?= e(t('phone')) ?>"></div>
                    <div class="col-md-6"><input required type="email" name="email" class="form-control" placeholder="<?= e(t('email')) ?>"></div>
                    <div class="col-md-6"><input required type="datetime-local" name="pickup_at" class="form-control"></div>
                    <div class="col-md-6"><input required type="datetime-local" name="return_at" class="form-control"></div>
                    <div class="col-md-6"><input required name="pickup_location" class="form-control" placeholder="<?= e(t('pickup_location')) ?>"></div>
                    <div class="col-md-6"><input required name="return_location" class="form-control" placeholder="<?= e(t('return_location')) ?>"></div>
                    <div class="col-md-6"><input name="passport_no" class="form-control" placeholder="<?= e(t('passport')) ?>"></div>
                    <div class="col-md-6"><input name="license_no" class="form-control" placeholder="<?= e(t('license')) ?>"></div>
                    <div class="col-12 form-check ms-2"><input class="form-check-input" type="checkbox" name="additional_driver" id="ad"><label class="form-check-label" for="ad"><?= e(t('additional_driver')) ?></label></div>
                    <div class="col-md-6"><input name="additional_driver_name" class="form-control" placeholder="<?= e(t('additional_driver_name')) ?>"></div>
                    <div class="col-md-6"><input name="additional_driver_phone" class="form-control" placeholder="<?= e(t('additional_driver_phone')) ?>"></div>
                    <div class="col-md-6"><input name="additional_driver_passport" class="form-control" placeholder="<?= e(t('passport')) ?>"></div>
                    <div class="col-md-6"><input name="additional_driver_license" class="form-control" placeholder="<?= e(t('license')) ?>"></div>
                    <div class="col-12"><textarea name="notes" class="form-control" rows="3" placeholder="<?= e(t('notes')) ?>"></textarea></div>
                    <div class="col-12"><button class="btn btn-warning w-100"><?= e(t('send_request')) ?></button></div>
                </div>
            </form>
        </div>
    </div>
</section>
