<section class="container py-5">
    <div class="row g-5">
        <div class="col-lg-5">
            <h1 class="h2 fw-bold"><?= e(t('contact')) ?></h1>
            <p class="lead"><?= e(t('contact_text')) ?></p>
            <p><strong><?= e(t('phone')) ?>:</strong> <?= e(config('company.phone')) ?></p>
            <p><strong><?= e(t('email')) ?>:</strong> <?= e(config('company.email')) ?></p>
            <p><strong><?= e(t('address')) ?>:</strong> <?= e(config('company.address')) ?></p>
            <a class="btn btn-success" href="https://wa.me/<?= e(config('company.whatsapp')) ?>" target="_blank">WhatsApp</a>
        </div>
        <div class="col-lg-7">
            <iframe class="map" src="<?= e(config('company.maps_iframe')) ?>" loading="lazy"></iframe>
        </div>
    </div>
</section>
