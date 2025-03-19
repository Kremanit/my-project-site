<?php
include('../vendor/autoload.php');
use phpseclib3\Net\SFTP;

include('sftp-config.php');

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_FILES['file'])) {
    $sftp = new SFTP(SFTP_HOST);
    if (!$sftp->login(SFTP_USERNAME, SFTP_PASSWORD)) {
        http_response_code(500);
        echo json_encode(['error' => 'SFTP connection failed']);
        exit;
    }

    $path = isset($_POST['path']) ? $_POST['path'] : '/';
    $fullPath = rtrim(SFTP_PATH . $path, '/') . '/';

    if (!$sftp->file_exists($fullPath)) {
        if (!$sftp->mkdir($fullPath, -1, true)) {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to create directory']);
            exit;
        }
    }

    $file = $_FILES['file'];
    $fileName = basename($file['name']);
    $remotePath = $fullPath . $fileName;

    if ($sftp->put($remotePath, $file['tmp_name'], SFTP::SOURCE_LOCAL_FILE)) {
        echo json_encode(['success' => true]);
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to upload file']);
    }
} else {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid request']);
}
?>