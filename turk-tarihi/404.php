<?php
http_response_code(404);
$pageTitle = 'İçerik Bulunamadı | TÜRK TARİHİ DEMO 2';
include __DIR__ . '/includes/header.php';
?>
<section class="page-hero compact not-found">
    <p class="eyebrow">404</p>
    <h1>Aradığınız tarih içeriği bulunamadı.</h1>
    <p>Bu kayıt henüz eklenmemiş veya bağlantı değişmiş olabilir.</p>
    <a class="button primary" href="<?= e(app_url('/')) ?>">Ana sayfaya dön</a>
</section>
<?php include __DIR__ . '/includes/footer.php'; ?>

