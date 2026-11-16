<?php
declare(strict_types=1);

namespace App\Models;

use App\Core\Model;

final class RentalRepository extends Model
{
    public function stats(): array
    {
        return [
            'vehicles' => (int) $this->query('SELECT COUNT(*) c FROM vehicles')->fetch()['c'],
            'pending' => (int) $this->query("SELECT COUNT(*) c FROM reservations WHERE status = 'pending'")->fetch()['c'],
            'active' => (int) $this->query("SELECT COUNT(*) c FROM reservations WHERE status = 'active'")->fetch()['c'],
            'revenue' => (float) $this->query("SELECT COALESCE(SUM(total_price),0) c FROM reservations WHERE status IN ('approved','active','completed')")->fetch()['c'],
            'expenses' => (float) $this->query('SELECT COALESCE(SUM(amount),0) c FROM expenses')->fetch()['c'],
        ];
    }

    public function expiring(string $column, int $days = 30): array
    {
        return $this->query(
            "SELECT * FROM vehicles WHERE {$column} IS NOT NULL AND {$column} <= DATE_ADD(CURDATE(), INTERVAL ? DAY) ORDER BY {$column} ASC",
            [$days]
        )->fetchAll();
    }

    public function vehicles(bool $publicOnly = false): array
    {
        $where = $publicOnly ? "WHERE status = 'available'" : '';
        return $this->query("SELECT v.*, (SELECT image_path FROM vehicle_images vi WHERE vi.vehicle_id = v.id ORDER BY is_primary DESC, id ASC LIMIT 1) image_path FROM vehicles v {$where} ORDER BY v.id DESC")->fetchAll();
    }

    public function vehicle(int $id): ?array
    {
        $row = $this->query('SELECT * FROM vehicles WHERE id = ?', [$id])->fetch();
        return $row ?: null;
    }

    public function vehicleImages(int $vehicleId): array
    {
        return $this->query('SELECT * FROM vehicle_images WHERE vehicle_id = ? ORDER BY is_primary DESC, id ASC', [$vehicleId])->fetchAll();
    }

    public function saveVehicle(array $data): int
    {
        $params = [
            $data['name'], $data['brand'], $data['model'], $data['year'], $data['plate_number'],
            $data['fuel_type'], $data['transmission'], $data['daily_price'], $data['mileage'],
            $data['insurance_expiry'], $data['registration_expiry'], $data['status'], $data['description'],
        ];
        if (!empty($data['id'])) {
            $params[] = $data['id'];
            $this->query('UPDATE vehicles SET name=?, brand=?, model=?, year=?, plate_number=?, fuel_type=?, transmission=?, daily_price=?, mileage=?, insurance_expiry=?, registration_expiry=?, status=?, description=? WHERE id=?', $params);
            return (int) $data['id'];
        }
        $this->query('INSERT INTO vehicles (name, brand, model, year, plate_number, fuel_type, transmission, daily_price, mileage, insurance_expiry, registration_expiry, status, description) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)', $params);
        return (int) $this->db->lastInsertId();
    }

    public function deleteVehicle(int $id): void
    {
        $this->query('DELETE FROM vehicles WHERE id = ?', [$id]);
    }

    public function addVehicleImage(int $vehicleId, string $path, bool $primary = false): void
    {
        $this->query('INSERT INTO vehicle_images (vehicle_id, image_path, is_primary) VALUES (?, ?, ?)', [$vehicleId, $path, $primary ? 1 : 0]);
    }

    public function customers(): array
    {
        return $this->query('SELECT * FROM customers ORDER BY id DESC')->fetchAll();
    }

    public function customer(int $id): ?array
    {
        $row = $this->query('SELECT * FROM customers WHERE id = ?', [$id])->fetch();
        return $row ?: null;
    }

    public function saveCustomer(array $data): int
    {
        $params = [$data['full_name'], $data['phone'], $data['email'], $data['address'], $data['passport_no'], $data['license_no'], $data['license_expiry']];
        if (!empty($data['id'])) {
            $params[] = $data['id'];
            $this->query('UPDATE customers SET full_name=?, phone=?, email=?, address=?, passport_no=?, license_no=?, license_expiry=? WHERE id=?', $params);
            return (int) $data['id'];
        }
        $this->query('INSERT INTO customers (full_name, phone, email, address, passport_no, license_no, license_expiry) VALUES (?,?,?,?,?,?,?)', $params);
        return (int) $this->db->lastInsertId();
    }

    public function deleteCustomer(int $id): void
    {
        $this->query('DELETE FROM customers WHERE id = ?', [$id]);
    }

    public function reservations(): array
    {
        return $this->query('SELECT r.*, c.full_name customer_name, v.name vehicle_name, v.plate_number FROM reservations r JOIN customers c ON c.id = r.customer_id JOIN vehicles v ON v.id = r.vehicle_id ORDER BY r.id DESC')->fetchAll();
    }

    public function reservation(int $id): ?array
    {
        $row = $this->query('SELECT r.*, c.*, c.id customer_id, v.name vehicle_name, v.brand, v.model, v.plate_number, v.daily_price FROM reservations r JOIN customers c ON c.id = r.customer_id JOIN vehicles v ON v.id = r.vehicle_id WHERE r.id = ?', [$id])->fetch();
        return $row ?: null;
    }

    public function saveReservation(array $data): int
    {
        $params = [
            $data['customer_id'], $data['vehicle_id'], $data['pickup_location'], $data['return_location'],
            $data['pickup_at'], $data['return_at'], $data['days'], $data['daily_price'], $data['outside_kosovo_fee'],
            $data['additional_driver_fee'], $data['total_price'], $data['status'], $data['start_mileage'], $data['end_mileage'], $data['notes'],
        ];
        if (!empty($data['id'])) {
            $params[] = $data['id'];
            $this->query('UPDATE reservations SET customer_id=?, vehicle_id=?, pickup_location=?, return_location=?, pickup_at=?, return_at=?, days=?, daily_price=?, outside_kosovo_fee=?, additional_driver_fee=?, total_price=?, status=?, start_mileage=?, end_mileage=?, notes=? WHERE id=?', $params);
            return (int) $data['id'];
        }
        $this->query('INSERT INTO reservations (customer_id, vehicle_id, pickup_location, return_location, pickup_at, return_at, days, daily_price, outside_kosovo_fee, additional_driver_fee, total_price, status, start_mileage, end_mileage, notes) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)', $params);
        return (int) $this->db->lastInsertId();
    }

    public function saveAdditionalDriver(int $reservationId, array $data): void
    {
        if (empty($data['full_name'])) {
            return;
        }
        $this->query('INSERT INTO additional_drivers (reservation_id, full_name, phone, passport_no, license_no) VALUES (?, ?, ?, ?, ?)', [
            $reservationId,
            $data['full_name'],
            $data['phone'] ?? null,
            $data['passport_no'] ?? null,
            $data['license_no'] ?? null,
        ]);
    }

    public function updateReservationStatus(int $id, string $status): void
    {
        $this->query('UPDATE reservations SET status = ? WHERE id = ?', [$status, $id]);
        if (in_array($status, ['approved', 'active'], true)) {
            $reservation = $this->reservation($id);
            if ($reservation) {
                $this->query("UPDATE vehicles SET status = 'rented' WHERE id = ?", [$reservation['vehicle_id']]);
                $this->ensureContractAndInvoice($id);
            }
        }
        if (in_array($status, ['completed', 'cancelled', 'rejected'], true)) {
            $reservation = $this->reservation($id);
            if ($reservation) {
                $this->query("UPDATE vehicles SET status = 'available' WHERE id = ?", [$reservation['vehicle_id']]);
            }
        }
    }

    public function ensureContractAndInvoice(int $reservationId): void
    {
        $contract = $this->query('SELECT id FROM contracts WHERE reservation_id = ?', [$reservationId])->fetch();
        if (!$contract) {
            $this->query('INSERT INTO contracts (reservation_id, contract_number, terms, insurance_terms) VALUES (?, ?, ?, ?)', [
                $reservationId,
                'CNT-' . date('Y') . '-' . str_pad((string) $reservationId, 5, '0', STR_PAD_LEFT),
                'Vehicle must be returned on time, clean, and with agreed fuel level. Fines, damages, and unauthorized use are charged to the customer.',
                'Standard insurance applies inside Kosovo. Cross-border use requires written approval and may include extra fees.',
            ]);
        }
        $invoice = $this->query('SELECT id FROM invoices WHERE reservation_id = ?', [$reservationId])->fetch();
        if (!$invoice) {
            $reservation = $this->reservation($reservationId);
            $this->query('INSERT INTO invoices (reservation_id, invoice_number, subtotal, tax, total, status) VALUES (?, ?, ?, ?, ?, ?)', [
                $reservationId,
                'INV-' . date('Y') . '-' . str_pad((string) $reservationId, 5, '0', STR_PAD_LEFT),
                $reservation['total_price'],
                0,
                $reservation['total_price'],
                'unpaid',
            ]);
        }
    }

    public function contracts(): array
    {
        return $this->query('SELECT ct.*, r.pickup_at, r.return_at, c.full_name, v.name vehicle_name FROM contracts ct JOIN reservations r ON r.id = ct.reservation_id JOIN customers c ON c.id = r.customer_id JOIN vehicles v ON v.id = r.vehicle_id ORDER BY ct.id DESC')->fetchAll();
    }

    public function printableContract(int $reservationId): ?array
    {
        $row = $this->query('SELECT ct.*, r.*, c.*, v.name vehicle_name, v.brand, v.model, v.plate_number FROM contracts ct JOIN reservations r ON r.id = ct.reservation_id JOIN customers c ON c.id = r.customer_id JOIN vehicles v ON v.id = r.vehicle_id WHERE r.id = ?', [$reservationId])->fetch();
        return $row ?: null;
    }

    public function printableInvoice(int $reservationId): ?array
    {
        $row = $this->query('SELECT i.*, r.*, c.full_name, c.address, c.email, c.phone, v.name vehicle_name, v.plate_number FROM invoices i JOIN reservations r ON r.id = i.reservation_id JOIN customers c ON c.id = r.customer_id JOIN vehicles v ON v.id = r.vehicle_id WHERE r.id = ?', [$reservationId])->fetch();
        return $row ?: null;
    }

    public function maintenance(): array
    {
        return $this->query('SELECT m.*, v.name vehicle_name, v.plate_number FROM maintenance_records m JOIN vehicles v ON v.id = m.vehicle_id ORDER BY service_date DESC')->fetchAll();
    }

    public function saveMaintenance(array $data): void
    {
        $this->query('INSERT INTO maintenance_records (vehicle_id, service_date, description, cost, next_service_mileage) VALUES (?, ?, ?, ?, ?)', [(int) $data['vehicle_id'], $data['service_date'], $data['description'], (float) ($data['cost'] ?: 0), $data['next_service_mileage'] ?: null]);
    }

    public function expenses(): array
    {
        return $this->query('SELECT e.*, v.name vehicle_name FROM expenses e LEFT JOIN vehicles v ON v.id = e.vehicle_id ORDER BY expense_date DESC')->fetchAll();
    }

    public function saveExpense(array $data): void
    {
        $this->query('INSERT INTO expenses (vehicle_id, category, expense_date, description, amount) VALUES (?, ?, ?, ?, ?)', [$data['vehicle_id'] ?: null, $data['category'], $data['expense_date'], $data['description'], (float) ($data['amount'] ?: 0)]);
    }

    public function damageReports(): array
    {
        return $this->query('SELECT d.*, v.name vehicle_name FROM damage_reports d JOIN vehicles v ON v.id = d.vehicle_id ORDER BY report_date DESC')->fetchAll();
    }

    public function saveDamage(array $data): void
    {
        $this->query('INSERT INTO damage_reports (vehicle_id, report_date, description, cost, file_path, status_notes) VALUES (?, ?, ?, ?, ?, ?)', [(int) $data['vehicle_id'], $data['report_date'], $data['description'], (float) ($data['cost'] ?: 0), $data['file_path'], $data['status_notes']]);
    }

    public function mileageLogs(): array
    {
        return $this->query('SELECT ml.*, v.name vehicle_name FROM mileage_logs ml JOIN vehicles v ON v.id = ml.vehicle_id ORDER BY log_date DESC')->fetchAll();
    }

    public function saveMileage(array $data): void
    {
        $end = (int) ($data['end_mileage'] ?: 0);
        $this->query('INSERT INTO mileage_logs (vehicle_id, reservation_id, log_date, start_mileage, end_mileage, notes) VALUES (?, ?, ?, ?, ?, ?)', [(int) $data['vehicle_id'], $data['reservation_id'] ?: null, $data['log_date'], (int) ($data['start_mileage'] ?: 0), $end, $data['notes']]);
        $this->query('UPDATE vehicles SET mileage = GREATEST(mileage, ?) WHERE id = ?', [$end, (int) $data['vehicle_id']]);
    }

    public function topVehicles(): array
    {
        return $this->query('SELECT v.name, COUNT(r.id) rentals, COALESCE(SUM(r.total_price),0) revenue FROM vehicles v LEFT JOIN reservations r ON r.vehicle_id = v.id GROUP BY v.id ORDER BY rentals DESC LIMIT 10')->fetchAll();
    }
}
