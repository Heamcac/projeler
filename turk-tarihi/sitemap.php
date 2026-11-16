<?php
require_once __DIR__ . '/includes/functions.php';
header('Content-Type: application/xml; charset=utf-8');

$urls = [
    app_url('/'),
    app_url('devletler.php'),
    app_url('hukumdarlar.php'),
    app_url('savaslar.php'),
    app_url('zaman-cizelgesi.php'),
    app_url('kultur.php'),
    app_url('destanlar.php'),
    app_url('kaynaklar.php'),
];

foreach (fetch_all('SELECT slug FROM states') as $row) {
    $urls[] = detail_url('devlet', $row['slug']);
}
foreach (fetch_all('SELECT slug FROM rulers') as $row) {
    $urls[] = detail_url('hukumdar', $row['slug']);
}
foreach (fetch_all('SELECT slug FROM wars') as $row) {
    $urls[] = detail_url('savas', $row['slug']);
}
foreach (fetch_all('SELECT slug FROM cultures') as $row) {
    $urls[] = detail_url('kultur', $row['slug']);
}
foreach (fetch_all('SELECT slug FROM epics') as $row) {
    $urls[] = detail_url('destan', $row['slug']);
}
echo '<?xml version="1.0" encoding="UTF-8"?>';
?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
<?php foreach ($urls as $url): ?>
    <url><loc><?= e($url) ?></loc></url>
<?php endforeach; ?>
</urlset>

