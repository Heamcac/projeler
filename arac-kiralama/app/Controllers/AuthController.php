<?php
declare(strict_types=1);

namespace App\Controllers;

use App\Core\Controller;
use App\Models\Admin;

final class AuthController extends Controller
{
    public function login(): void
    {
        $this->rawView('admin/login', ['error' => $_SESSION['login_error'] ?? null]);
        unset($_SESSION['login_error']);
    }

    public function authenticate(): void
    {
        $admin = (new Admin())->findByEmail(trim((string) ($_POST['email'] ?? '')));
        $password = (string) ($_POST['password'] ?? '');
        $valid = $admin && (password_verify($password, $admin['password_hash']) || hash_equals($admin['password_hash'], hash('sha256', $password)));
        if (!$valid) {
            $_SESSION['login_error'] = 'Invalid email or password.';
            redirect('admin/login');
        }

        session_regenerate_id(true);
        $_SESSION['admin_id'] = $admin['id'];
        $_SESSION['admin_name'] = $admin['name'];
        redirect('admin');
    }

    public function logout(): void
    {
        session_destroy();
        redirect('admin/login');
    }
}
