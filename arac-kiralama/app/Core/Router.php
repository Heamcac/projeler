<?php
declare(strict_types=1);

namespace App\Core;

final class Router
{
    private array $routes = [];

    public function get(string $path, array $action): void
    {
        $this->routes['GET'][$this->clean($path)] = $action;
    }

    public function post(string $path, array $action): void
    {
        $this->routes['POST'][$this->clean($path)] = $action;
    }

    public function dispatch(): void
    {
        $method = $_SERVER['REQUEST_METHOD'];
        $path = $this->clean(parse_url($_GET['route'] ?? '', PHP_URL_PATH) ?: '');
        $action = $this->routes[$method][$path] ?? null;

        if (!$action) {
            http_response_code(404);
            echo '404 Not Found';
            return;
        }

        [$class, $methodName] = $action;
        (new $class())->$methodName();
    }

    private function clean(string $path): string
    {
        return trim($path, '/');
    }
}
