<?php
require_once __DIR__ . '/../includes/auth.php';
$_SESSION = [];
session_destroy();
admin_redirect('login.php');

