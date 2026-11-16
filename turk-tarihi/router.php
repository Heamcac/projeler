<?php
// PHP dahili sunucusunda Apache .htaccess kuralları çalışmadığı için temiz URL'leri burada yönlendiriyoruz.
$path = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';
$file = __DIR__ . $path;

if ($path !== '/' && is_file($file)) {
    return false;
}

$routes = [
    '#^/devlet/([a-z0-9-]+)/?$#' => 'devlet.php',
    '#^/hukumdar/([a-z0-9-]+)/?$#' => 'hukumdar.php',
    '#^/savas/([a-z0-9-]+)/?$#' => 'savas.php',
    '#^/kultur/([a-z0-9-]+)/?$#' => 'kultur.php',
    '#^/destan/([a-z0-9-]+)/?$#' => 'destanlar.php',
];

if ($path === '/sitemap.xml') {
    require __DIR__ . '/sitemap.php';
    return true;
}

foreach ($routes as $pattern => $target) {
    if (preg_match($pattern, $path, $matches)) {
        $_GET['slug'] = $matches[1];
        require __DIR__ . '/' . $target;
        return true;
    }
}

if ($path === '/') {
    require __DIR__ . '/index.php';
    return true;
}

http_response_code(404);
require __DIR__ . '/404.php';
return true;

