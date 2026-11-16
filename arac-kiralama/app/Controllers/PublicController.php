<?php
declare(strict_types=1);

namespace App\Controllers;

use App\Core\Controller;
use App\Models\RentalRepository;

final class PublicController extends Controller
{
    private RentalRepository $repo;

    public function __construct()
    {
        $this->repo = new RentalRepository();
    }

    public function home(): void
    {
        $this->view('public/home', ['vehicles' => array_slice($this->repo->vehicles(true), 0, 6)]);
    }

    public function vehicles(): void
    {
        $this->view('public/vehicles', ['vehicles' => $this->repo->vehicles(true)]);
    }

    public function vehicle(): void
    {
        $id = (int) ($_GET['id'] ?? 0);
        $vehicle = $this->repo->vehicle($id);
        if (!$vehicle) {
            http_response_code(404);
            exit('Vehicle not found.');
        }
        $this->view('public/vehicle', ['vehicle' => $vehicle, 'images' => $this->repo->vehicleImages($id)]);
    }

    public function storeReservation(): void
    {
        $vehicle = $this->repo->vehicle((int) $_POST['vehicle_id']);
        if (!$vehicle) {
            redirect('vehicles');
        }
        $customerId = $this->repo->saveCustomer([
            'id' => null,
            'full_name' => trim((string) $_POST['full_name']),
            'phone' => trim((string) $_POST['phone']),
            'email' => trim((string) $_POST['email']),
            'address' => trim((string) ($_POST['address'] ?? '')),
            'passport_no' => trim((string) ($_POST['passport_no'] ?? '')),
            'license_no' => trim((string) ($_POST['license_no'] ?? '')),
            'license_expiry' => null,
        ]);
        $days = days_between($_POST['pickup_at'], $_POST['return_at']);
        $outside = (float) ($_POST['outside_kosovo_fee'] ?? 0);
        $additional = isset($_POST['additional_driver']) ? 15 * $days : 0;
        $reservationId = $this->repo->saveReservation([
            'id' => null,
            'customer_id' => $customerId,
            'vehicle_id' => $vehicle['id'],
            'pickup_location' => trim((string) $_POST['pickup_location']),
            'return_location' => trim((string) $_POST['return_location']),
            'pickup_at' => $_POST['pickup_at'],
            'return_at' => $_POST['return_at'],
            'days' => $days,
            'daily_price' => $vehicle['daily_price'],
            'outside_kosovo_fee' => $outside,
            'additional_driver_fee' => $additional,
            'total_price' => ($days * (float) $vehicle['daily_price']) + $outside + $additional,
            'status' => 'pending',
            'start_mileage' => null,
            'end_mileage' => null,
            'notes' => trim((string) ($_POST['notes'] ?? '')),
        ]);
        $this->repo->saveAdditionalDriver($reservationId, [
            'full_name' => trim((string) ($_POST['additional_driver_name'] ?? '')),
            'phone' => trim((string) ($_POST['additional_driver_phone'] ?? '')),
            'passport_no' => trim((string) ($_POST['additional_driver_passport'] ?? '')),
            'license_no' => trim((string) ($_POST['additional_driver_license'] ?? '')),
        ]);
        $_SESSION['flash'] = t('request_received');
        redirect('vehicles');
    }

    public function contact(): void
    {
        $this->view('public/contact');
    }
}
