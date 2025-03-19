<?php
include('vendor/autoload.php');
use phpseclib3\Net\SFTP;

include('sftp-config.php');

$sftp = new SFTP(SFTP_HOST);
if (!$sftp->login(SFTP_USERNAME, SFTP_PASSWORD)) {
    http_response_code(500);
    echo json_encode(['error' => 'SFTP connection failed']);
    exit;
}

$files = $sftp->nlist(SFTP_PATH);
$fileList = array_filter($files, function($file) {
    return $file !== '.' && $file !== '..';
});
echo json_encode(array_values($fileList));
?>