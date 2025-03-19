<?php
include('../vendor/autoload.php');
use phpseclib3\Net\SFTP;

include('sftp-config.php');

ini_set('memory_limit', '256M');

$sftp = new SFTP(SFTP_HOST);
if (!$sftp->login(SFTP_USERNAME, SFTP_PASSWORD)) {
    http_response_code(500);
    error_log("SFTP login failed for user " . SFTP_USERNAME . " on " . SFTP_HOST);
    echo json_encode(['error' => 'SFTP connection failed']);
    exit;
}

$path = isset($_GET['path']) ? $_GET['path'] : '/';
$fullPath = rtrim(SFTP_PATH . $path, '/') . '/';
error_log("Attempting to list directory: " . $fullPath);

try {
    $items = $sftp->nlist($fullPath);
    if ($items === false) {
        http_response_code(500);
        error_log("Failed to list directory: " . $fullPath);
        echo json_encode(['error' => 'Unable to list directory']);
        exit;
    }

    $folders = [];
    $files = [];
    foreach ($items as $item) {
        if ($item === '.' || $item === '..') continue;

        $itemPath = $fullPath . $item;
        $isDir = $sftp->is_dir($itemPath);
        if ($isDir === false && $sftp->getLastError()) {
            error_log("Cannot access item: " . $itemPath . " - " . $sftp->getLastError());
            continue;
        }

        if ($isDir) {
            $folders[] = $item;
        } elseif (in_array(substr($item, -3), ['.py', '.js', '.txt'])) {
            $files[] = $item;
        }
    }

    error_log("Successfully listed directory: " . $fullPath . " with " . count($folders) . " folders and " . count($files) . " files");
    echo json_encode(['folders' => $folders, 'files' => $files]);
} catch (Exception $e) {
    http_response_code(500);
    error_log("Exception while listing directory " . $fullPath . ": " . $e->getMessage());
    echo json_encode(['error' => 'Error listing directory: ' . $e->getMessage()]);
}
?>