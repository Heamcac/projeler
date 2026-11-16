<section class="container py-5">
    <h1 class="h2 fw-bold mb-4"><?= e(t('vehicles')) ?></h1>
    <div class="row g-4">
        <?php foreach ($vehicles as $vehicle): ?>
            <?php require dirname(__DIR__) . '/public/partials/vehicle_card.php'; ?>
        <?php endforeach; ?>
    </div>
</section>
