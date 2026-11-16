<?php
declare(strict_types=1);

namespace App\Core;

abstract class Controller
{
    protected function view(string $view, array $data = [], string $layout = 'public'): void
    {
        extract($data, EXTR_SKIP);
        $viewFile = dirname(__DIR__) . '/Views/' . $view . '.php';
        require dirname(__DIR__) . '/Views/' . $layout . '/partials/header.php';
        require $viewFile;
        require dirname(__DIR__) . '/Views/' . $layout . '/partials/footer.php';
    }

    protected function rawView(string $view, array $data = []): void
    {
        extract($data, EXTR_SKIP);
        require dirname(__DIR__) . '/Views/' . $view . '.php';
    }
}
