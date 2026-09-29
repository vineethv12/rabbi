<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: X-Admin-Password, Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit(0); }

require_once __DIR__ . '/../config.php';

$password = $_SERVER['HTTP_X_ADMIN_PASSWORD'] ?? '';
if ($password !== ADMIN_PASSWORD) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}

if (empty($_FILES['file']) || $_FILES['file']['error'] !== UPLOAD_ERR_OK) {
    http_response_code(400);
    echo json_encode(['error' => 'No file uploaded or upload error']);
    exit;
}

$file     = $_FILES['file'];
$finfo    = finfo_open(FILEINFO_MIME_TYPE);
$mimeType = finfo_file($finfo, $file['tmp_name']);
finfo_close($finfo);

$allowed = [
    'image/jpeg' => 'jpg',
    'image/png'  => 'png',
    'image/webp' => 'webp',
    'image/gif'  => 'gif',
];

if (!isset($allowed[$mimeType])) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid file type. Allowed: JPG, PNG, WebP, GIF.']);
    exit;
}

$maxSize = 20 * 1024 * 1024;
if ($file['size'] > $maxSize) {
    http_response_code(400);
    echo json_encode(['error' => 'File too large (max 20 MB)']);
    exit;
}

$uploadDir = __DIR__ . '/../uploads/events/';
$uploadUrl = '/uploads/events/';
if (!is_dir($uploadDir)) { mkdir($uploadDir, 0755, true); }

/**
 * Optimize event photos so the website loads fast even when the original
 * is a huge high-quality image: resize to max 1600px and save as WebP
 * (falls back to JPEG, then the original file, if the server lacks support).
 */
function rga_optimize_event_photo(string $tmpPath, string $mimeType, string $destDir): ?string {
    if (!function_exists('imagecreatetruecolor')) return null; // no GD
    try {
        switch ($mimeType) {
            case 'image/jpeg': $src = @imagecreatefromjpeg($tmpPath); break;
            case 'image/png':  $src = @imagecreatefrompng($tmpPath);  break;
            case 'image/webp': $src = function_exists('imagecreatefromwebp') ? @imagecreatefromwebp($tmpPath) : null; break;
            case 'image/gif':  return null; // keep GIFs as-is (may be animated)
            default:           return null;
        }
        if (!$src) return null;

        $w = imagesx($src); $h = imagesy($src);
        $maxDim = 1600;
        $scale  = min(1, $maxDim / max($w, $h));
        $nw = max(1, (int)round($w * $scale));
        $nh = max(1, (int)round($h * $scale));

        $dst = imagecreatetruecolor($nw, $nh);
        // Keep transparency for PNG/WebP sources
        imagealphablending($dst, false);
        imagesavealpha($dst, true);
        imagecopyresampled($dst, $src, 0, 0, 0, 0, $nw, $nh, $w, $h);
        imagedestroy($src);

        if (function_exists('imagewebp')) {
            $filename = 'event_' . uniqid() . '.webp';
            $ok = @imagewebp($dst, $destDir . $filename, 80);
        } else {
            $filename = 'event_' . uniqid() . '.jpg';
            // Flatten transparency onto white for JPEG
            $flat = imagecreatetruecolor($nw, $nh);
            $white = imagecolorallocate($flat, 255, 255, 255);
            imagefill($flat, 0, 0, $white);
            imagecopy($flat, $dst, 0, 0, 0, 0, $nw, $nh);
            $ok = @imagejpeg($flat, $destDir . $filename, 82);
            imagedestroy($flat);
        }
        imagedestroy($dst);
        return $ok ? $filename : null;
    } catch (Throwable $e) {
        return null;
    }
}

$filename = rga_optimize_event_photo($file['tmp_name'], $mimeType, $uploadDir);
if (!$filename) {
    // Fallback: store the original file as-is
    $ext      = $allowed[$mimeType];
    $filename = 'event_' . uniqid() . '.' . $ext;
    if (!move_uploaded_file($file['tmp_name'], $uploadDir . $filename)) {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to save file']);
        exit;
    }
}

echo json_encode(['success' => true, 'url' => $uploadUrl . $filename]);
