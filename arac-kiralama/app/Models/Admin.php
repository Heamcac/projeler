<?php
declare(strict_types=1);

namespace App\Models;

use App\Core\Model;

final class Admin extends Model
{
    public function findByEmail(string $email): ?array
    {
        $admin = $this->query('SELECT * FROM admins WHERE email = ? AND is_active = 1 LIMIT 1', [$email])->fetch();
        return $admin ?: null;
    }

    public function all(): array
    {
        return $this->query('SELECT id, name, email, role, is_active, created_at FROM admins ORDER BY id DESC')->fetchAll();
    }

    public function create(array $data): void
    {
        $this->query(
            'INSERT INTO admins (name, email, password_hash, role, is_active) VALUES (?, ?, ?, ?, ?)',
            [$data['name'], $data['email'], password_hash($data['password'], PASSWORD_DEFAULT), $data['role'], $data['is_active']]
        );
    }
}
