<?php
declare(strict_types=1);

namespace App\Core;

final class Translator
{
    private static array $lines = [];
    private static string $locale = 'sq';

    public static function boot(): void
    {
        $allowed = ['sq', 'en', 'tr'];
        if (isset($_GET['lang']) && in_array($_GET['lang'], $allowed, true)) {
            $_SESSION['lang'] = $_GET['lang'];
        }
        self::$locale = $_SESSION['lang'] ?? 'sq';
        $file = dirname(__DIR__, 2) . '/lang/' . self::$locale . '.php';
        self::$lines = file_exists($file) ? require $file : [];
    }

    public static function get(string $key): string
    {
        return self::$lines[$key] ?? $key;
    }

    public static function locale(): string
    {
        return self::$locale;
    }
}
