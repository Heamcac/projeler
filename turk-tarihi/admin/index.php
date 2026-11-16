<?php
require_once __DIR__ . '/../includes/auth.php';
admin_redirect(is_admin() ? 'dashboard.php' : 'login.php');

