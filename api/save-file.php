<?php
include('../vendor/autoload.php');
use phpseclib3\Net\SFTP;

include('sftp-config.php');

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['file']) && isset($_POST['content'])) {
    $sftp = new SFTP(SFTP_HOST);
    if (!$sftp->login(SFTP_USERNAME, SFTP_PASSWORD)) {
        http_response_code(500);
        echo json_encode(['error' => 'SFTP connection failed']);
        exit;
    }

    $filePath = $_POST['file'];
    if ($sftp->put($filePath, $_POST['content'])) {
        echo json_encode(['success' => true]);
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to save file']);
    }
} else {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid request']);
}
?>