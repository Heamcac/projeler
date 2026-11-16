<section class="hero text-white">
    <div class="container py-5">
        <div class="col-lg-7 py-5">
            <h1 class="display-4 fw-bold">Rent a Car Premtimi</h1>
            <p class="lead"><?= e(t('hero_text')) ?></p>
            <a href="<?= url('vehicles') ?>" class="btn btn-warning btn-lg"><?= e(t('view_cars')) ?></a>
        </div>
    </div>
</section>
<section class="container py-5">
    <div class="d-flex justify-content-between align-items-end mb-4">
        <div>
            <h2 class="h3 fw-bold"><?= e(t('available_cars')) ?></h2>
            <p class="text-muted mb-0"><?= e(t('available_cars_sub')) ?></p>
        </div>
        <a href="<?= url('vehicles') ?>" class="btn btn-outline-dark"><?= e(t('all_cars')) ?></a>
    </div>
    <div class="row g-4">
        <?php foreach ($vehicles as $vehicle): ?>
            <?php require dirname(__DIR__) . '/public/partials/vehicle_card.php'; ?>
        <?php endforeach; ?>
    </div>
</section>
