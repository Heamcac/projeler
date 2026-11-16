<?php
$pageTitle = 'İletişim | TÜRK TARİHİ DEMO 2';
include __DIR__ . '/includes/header.php';
?>
<section class="page-hero compact"><p class="eyebrow">İletişim</p><h1>Geri bildirim</h1></section>
<section class="section contact-panel">
    <form method="post">
        <label>Adınız <input type="text" name="name" required></label>
        <label>E-posta <input type="email" name="email" required></label>
        <label>Mesaj <textarea name="message" rows="6" required></textarea></label>
        <button class="button primary" type="submit">Gönder</button>
    </form>
</section>
<?php include __DIR__ . '/includes/footer.php'; ?>

