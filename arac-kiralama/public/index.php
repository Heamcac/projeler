<?php
declare(strict_types=1);

session_start();
date_default_timezone_set('Europe/Istanbul');

spl_autoload_register(function (string $class): void {
    $prefix = 'App\\';
    if (str_starts_with($class, $prefix)) {
        $path = dirname(__DIR__) . '/app/' . str_replace('\\', '/', substr($class, strlen($prefix))) . '.php';
        if (file_exists($path)) {
            require $path;
        }
    }
});

require dirname(__DIR__) . '/app/Core/Helpers.php';

use App\Controllers\AdminController;
use App\Controllers\AuthController;
use App\Controllers\PublicController;
use App\Core\Router;
use App\Core\Translator;

Translator::boot();
verify_csrf();

$router = new Router();

$router->get('', [PublicController::class, 'home']);
$router->get('vehicles', [PublicController::class, 'vehicles']);
$router->get('vehicle', [PublicController::class, 'vehicle']);
$router->post('reservation/request', [PublicController::class, 'storeReservation']);
$router->get('contact', [PublicController::class, 'contact']);

$router->get('admin/login', [AuthController::class, 'login']);
$router->post('admin/login', [AuthController::class, 'authenticate']);
$router->get('admin/logout', [AuthController::class, 'logout']);

$router->get('admin', [AdminController::class, 'dashboard']);
$router->get('admin/vehicles', [AdminController::class, 'vehicles']);
$router->post('admin/vehicles/save', [AdminController::class, 'saveVehicle']);
$router->post('admin/vehicles/delete', [AdminController::class, 'deleteVehicle']);
$router->post('admin/vehicles/images', [AdminController::class, 'uploadVehicleImages']);
$router->get('admin/reservations', [AdminController::class, 'reservations']);
$router->post('admin/reservations/save', [AdminController::class, 'saveReservation']);
$router->post('admin/reservations/status', [AdminController::class, 'updateReservationStatus']);
$router->get('admin/customers', [AdminController::class, 'customers']);
$router->post('admin/customers/save', [AdminController::class, 'saveCustomer']);
$router->post('admin/customers/delete', [AdminController::class, 'deleteCustomer']);
$router->get('admin/contracts', [AdminController::class, 'contracts']);
$router->get('admin/contract/print', [AdminController::class, 'printContract']);
$router->get('admin/invoice/print', [AdminController::class, 'printInvoice']);
$router->get('admin/maintenance', [AdminController::class, 'maintenance']);
$router->post('admin/maintenance/save', [AdminController::class, 'saveMaintenance']);
$router->get('admin/expenses', [AdminController::class, 'expenses']);
$router->post('admin/expenses/save', [AdminController::class, 'saveExpense']);
$router->get('admin/damage', [AdminController::class, 'damage']);
$router->post('admin/damage/save', [AdminController::class, 'saveDamage']);
$router->get('admin/mileage', [AdminController::class, 'mileage']);
$router->post('admin/mileage/save', [AdminController::class, 'saveMileage']);
$router->get('admin/reports', [AdminController::class, 'reports']);
$router->get('admin/admins', [AdminController::class, 'admins']);
$router->post('admin/admins/save', [AdminController::class, 'saveAdmin']);

$router->dispatch();
