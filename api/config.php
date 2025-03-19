<?php
header('Content-Type: application/javascript');

$secretToken = 'token';
$token = isset($_GET['token']) ? $_GET['token'] : '';

if ($token !== $secretToken) {
    http_response_code(403);
    echo 'console.error("Access denied: Invalid token");';
    exit;
}

$mainPassword = 'parol';
$uploadPassword = 'parol';

echo "const MAIN_PASSWORD = '$mainPassword';\n";
echo "const UPLOAD_PASSWORD = '$uploadPassword';\n";
?>