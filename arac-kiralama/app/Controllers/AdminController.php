<?php
declare(strict_types=1);

namespace App\Controllers;

use App\Core\Controller;
use App\Models\Admin;
use App\Models\RentalRepository;

final class AdminController extends Controller
{
    private RentalRepository $repo;

    public function __construct()
    {
        require_admin();
        $this->repo = new RentalRepository();
    }

    public function dashboard(): void
    {
        $this->view('admin/dashboard', [
            'stats' => $this->repo->stats(),
            'insuranceAlerts' => $this->repo->expiring('insurance_expiry'),
            'registrationAlerts' => $this->repo->expiring('registration_expiry'),
        ], 'admin');
    }

    public function vehicles(): void
    {
        $this->view('admin/vehicles', ['vehicles' => $this->repo->vehicles()], 'admin');
    }

    public function saveVehicle(): void
    {
        $id = $this->repo->saveVehicle($this->postVehicle());
        $this->handleVehicleUploads($id);
        redirect('admin/vehicles');
    }

    public function deleteVehicle(): void
    {
        $this->repo->deleteVehicle((int) $_POST['id']);
        redirect('admin/vehicles');
    }

    public function uploadVehicleImages(): void
    {
        $this->handleVehicleUploads((int) $_POST['vehicle_id']);
        redirect('admin/vehicles');
    }

    public function reservations(): void
    {
        $this->view('admin/reservations', [
            'reservations' => $this->repo->reservations(),
            'vehicles' => $this->repo->vehicles(),
            'customers' => $this->repo->customers(),
        ], 'admin');
    }

    public function saveReservation(): void
    {
        $vehicle = $this->repo->vehicle((int) $_POST['vehicle_id']);
        $days = days_between($_POST['pickup_at'], $_POST['return_at']);
        $daily = (float) ($_POST['daily_price'] ?: ($vehicle['daily_price'] ?? 0));
        $outside = (float) ($_POST['outside_kosovo_fee'] ?? 0);
        $additional = (float) ($_POST['additional_driver_fee'] ?? 0);
        $this->repo->saveReservation([
            'id' => $_POST['id'] ?: null,
            'customer_id' => (int) $_POST['customer_id'],
            'vehicle_id' => (int) $_POST['vehicle_id'],
            'pickup_location' => trim((string) $_POST['pickup_location']),
            'return_location' => trim((string) $_POST['return_location']),
            'pickup_at' => $_POST['pickup_at'],
            'return_at' => $_POST['return_at'],
            'days' => $days,
            'daily_price' => $daily,
            'outside_kosovo_fee' => $outside,
            'additional_driver_fee' => $additional,
            'total_price' => ($days * $daily) + $outside + $additional,
            'status' => $_POST['status'],
            'start_mileage' => $_POST['start_mileage'] ?: null,
            'end_mileage' => $_POST['end_mileage'] ?: null,
            'notes' => trim((string) ($_POST['notes'] ?? '')),
        ]);
        redirect('admin/reservations');
    }

    public function updateReservationStatus(): void
    {
        $this->repo->updateReservationStatus((int) $_POST['id'], (string) $_POST['status']);
        redirect('admin/reservations');
    }

    public function customers(): void
    {
        $this->view('admin/customers', ['customers' => $this->repo->customers(), 'reservations' => $this->repo->reservations()], 'admin');
    }

    public function saveCustomer(): void
    {
        $this->repo->saveCustomer([
            'id' => $_POST['id'] ?: null,
            'full_name' => trim((string) $_POST['full_name']),
            'phone' => trim((string) $_POST['phone']),
            'email' => trim((string) $_POST['email']),
            'address' => trim((string) $_POST['address']),
            'passport_no' => trim((string) $_POST['passport_no']),
            'license_no' => trim((string) $_POST['license_no']),
            'license_expiry' => $_POST['license_expiry'] ?: null,
        ]);
        redirect('admin/customers');
    }

    public function deleteCustomer(): void
    {
        $this->repo->deleteCustomer((int) $_POST['id']);
        redirect('admin/customers');
    }

    public function contracts(): void
    {
        $this->view('admin/contracts', ['contracts' => $this->repo->contracts(), 'reservations' => $this->repo->reservations()], 'admin');
    }

    public function printContract(): void
    {
        $this->rawView('admin/print_contract', ['contract' => $this->repo->printableContract((int) $_GET['reservation_id'])]);
    }

    public function printInvoice(): void
    {
        $this->rawView('admin/print_invoice', ['invoice' => $this->repo->printableInvoice((int) $_GET['reservation_id'])]);
    }

    public function maintenance(): void
    {
        $this->view('admin/maintenance', ['records' => $this->repo->maintenance(), 'vehicles' => $this->repo->vehicles()], 'admin');
    }

    public function saveMaintenance(): void
    {
        $this->repo->saveMaintenance($_POST);
        redirect('admin/maintenance');
    }

    public function expenses(): void
    {
        $this->view('admin/expenses', ['expenses' => $this->repo->expenses(), 'vehicles' => $this->repo->vehicles()], 'admin');
    }

    public function saveExpense(): void
    {
        $this->repo->saveExpense($_POST);
        redirect('admin/expenses');
    }

    public function damage(): void
    {
        $this->view('admin/damage', ['reports' => $this->repo->damageReports(), 'vehicles' => $this->repo->vehicles()], 'admin');
    }

    public function saveDamage(): void
    {
        $path = $this->uploadSingle('file', 'damage');
        $data = $_POST;
        $data['file_path'] = $path;
        $this->repo->saveDamage($data);
        redirect('admin/damage');
    }

    public function mileage(): void
    {
        $this->view('admin/mileage', ['logs' => $this->repo->mileageLogs(), 'vehicles' => $this->repo->vehicles(), 'reservations' => $this->repo->reservations()], 'admin');
    }

    public function saveMileage(): void
    {
        $this->repo->saveMileage($_POST);
        redirect('admin/mileage');
    }

    public function reports(): void
    {
        $stats = $this->repo->stats();
        $this->view('admin/reports', [
            'stats' => $stats,
            'net' => $stats['revenue'] - $stats['expenses'],
            'vehicles' => $this->repo->vehicles(),
            'topVehicles' => $this->repo->topVehicles(),
            'reservations' => $this->repo->reservations(),
        ], 'admin');
    }

    public function admins(): void
    {
        $this->view('admin/admins', ['admins' => (new Admin())->all()], 'admin');
    }

    public function saveAdmin(): void
    {
        (new Admin())->create([
            'name' => trim((string) $_POST['name']),
            'email' => trim((string) $_POST['email']),
            'password' => (string) $_POST['password'],
            'role' => $_POST['role'] ?? 'admin',
            'is_active' => isset($_POST['is_active']) ? 1 : 0,
        ]);
        redirect('admin/admins');
    }

    private function postVehicle(): array
    {
        return [
            'id' => $_POST['id'] ?: null,
            'name' => trim((string) $_POST['name']),
            'brand' => trim((string) $_POST['brand']),
            'model' => trim((string) $_POST['model']),
            'year' => (int) $_POST['year'],
            'plate_number' => trim((string) $_POST['plate_number']),
            'fuel_type' => $_POST['fuel_type'],
            'transmission' => $_POST['transmission'],
            'daily_price' => (float) $_POST['daily_price'],
            'mileage' => (int) $_POST['mileage'],
            'insurance_expiry' => $_POST['insurance_expiry'] ?: null,
            'registration_expiry' => $_POST['registration_expiry'] ?: null,
            'status' => $_POST['status'],
            'description' => trim((string) ($_POST['description'] ?? '')),
        ];
    }

    private function handleVehicleUploads(int $vehicleId): void
    {
        if (empty($_FILES['images']['name'][0])) {
            return;
        }
        foreach ($_FILES['images']['name'] as $index => $name) {
            if ($_FILES['images']['error'][$index] !== UPLOAD_ERR_OK) {
                continue;
            }
            $ext = strtolower(pathinfo($name, PATHINFO_EXTENSION));
            if (!in_array($ext, ['jpg', 'jpeg', 'png', 'webp'], true)) {
                continue;
            }
            $filename = 'vehicle_' . $vehicleId . '_' . bin2hex(random_bytes(6)) . '.' . $ext;
            $target = dirname(__DIR__, 2) . '/public/uploads/vehicles/' . $filename;
            move_uploaded_file($_FILES['images']['tmp_name'][$index], $target);
            $this->repo->addVehicleImage($vehicleId, 'uploads/vehicles/' . $filename, $index === 0);
        }
    }

    private function uploadSingle(string $field, string $folder): ?string
    {
        if (empty($_FILES[$field]['name']) || $_FILES[$field]['error'] !== UPLOAD_ERR_OK) {
            return null;
        }
        $ext = strtolower(pathinfo($_FILES[$field]['name'], PATHINFO_EXTENSION));
        if (!in_array($ext, ['jpg', 'jpeg', 'png', 'webp', 'pdf'], true)) {
            return null;
        }
        $filename = $folder . '_' . bin2hex(random_bytes(8)) . '.' . $ext;
        $relative = 'uploads/' . $folder . '/' . $filename;
        move_uploaded_file($_FILES[$field]['tmp_name'], dirname(__DIR__, 2) . '/public/' . $relative);
        return $relative;
    }
}
