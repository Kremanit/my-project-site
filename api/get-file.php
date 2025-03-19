<?php
include('../vendor/autoload.php');
use phpseclib3\Net\SFTP;

include('sftp-config.php');

if (isset($_GET['file'])) {
    $sftp = new SFTP(SFTP_HOST);
    if (!$sftp->login(SFTP_USERNAME, SFTP_PASSWORD)) {
        http_response_code(500);
        echo json_encode(['error' => 'SFTP connection failed']);
        exit;
    }

    $filePath = $_GET['file'];
    $content = $sftp->get($filePath);
    if ($content !== false) {
        echo json_encode(['content' => $content]);
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to read file']);
    }
} else {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid request']);
}
?>