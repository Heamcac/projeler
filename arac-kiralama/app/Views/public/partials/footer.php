</main>
<a class="whatsapp-float" href="https://wa.me/<?= e(config('company.whatsapp')) ?>" target="_blank" aria-label="WhatsApp">WA</a>
<footer class="bg-dark text-white py-4 mt-5">
    <div class="container d-flex flex-column flex-md-row justify-content-between gap-2">
        <span>&copy; <?= date('Y') ?> Rent a Car Premtimi</span>
        <span><?= e(config('company.phone')) ?> · <?= e(config('company.email')) ?></span>
    </div>
</footer>
<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
<script src="<?= url('assets/js/app.js') ?>"></script>
</body>
</html>
