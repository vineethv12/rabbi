<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: X-Admin-Password, Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit(0); }

require_once __DIR__ . '/../config.php';

define('FRANCHISE_UPLOAD_DIR', __DIR__ . '/../uploads/franchises/');
define('FRANCHISE_UPLOAD_URL', '/uploads/franchises/');

$password = $_SERVER['HTTP_X_ADMIN_PASSWORD'] ?? '';
if ($password !== ADMIN_PASSWORD) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}

$id      = isset($_POST['id']) ? (int)$_POST['id'] : 0;
$academy = trim($_POST['academy'] ?? '');
$head    = trim($_POST['head'] ?? '');
$area    = trim($_POST['area'] ?? '');
$city    = trim($_POST['city'] ?? '');
$photo   = trim($_POST['photo'] ?? '');
$removePhoto = (($_POST['remove_photo'] ?? '') === '1');

if ($academy === '') {
    http_response_code(400);
    echo json_encode(['error' => 'Academy name is required']);
    exit;
}
if ($head === '') {
    http_response_code(400);
    echo json_encode(['error' => 'Head name is required']);
    exit;
}

// ── Optional photo upload ─────────────────────────────────────────────────────
$newPhotoUrl = null;
if (!empty($_FILES['photo']) && $_FILES['photo']['error'] === UPLOAD_ERR_OK) {
    $file     = $_FILES['photo'];
    $finfo    = finfo_open(FILEINFO_MIME_TYPE);
    $mimeType = finfo_file($finfo, $file['tmp_name']);
    finfo_close($finfo);

    $allowed = ['image/jpeg' => 'jpg', 'image/png' => 'png', 'image/webp' => 'webp', 'image/gif' => 'gif'];
    if (!isset($allowed[$mimeType])) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid file type. Allowed: JPG, PNG, WebP, GIF.']);
        exit;
    }
    if ($file['size'] > MAX_FILE_SIZE) {
        http_response_code(400);
        echo json_encode(['error' => 'File too large (max 10 MB)']);
        exit;
    }
    if (!is_dir(FRANCHISE_UPLOAD_DIR)) { mkdir(FRANCHISE_UPLOAD_DIR, 0755, true); }

    // Compress + convert to WebP for fast page loads (falls back to original)
    require_once __DIR__ . '/image_optimize.php';
    $newFilename = rga_optimize_image($file['tmp_name'], $mimeType, FRANCHISE_UPLOAD_DIR, 'franchise');
    if ($newFilename === null) {
        $ext         = $allowed[$mimeType];
        $newFilename = 'franchise_' . uniqid() . '.' . $ext;
        if (!move_uploaded_file($file['tmp_name'], FRANCHISE_UPLOAD_DIR . $newFilename)) {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to save photo']);
            exit;
        }
    }
    $newPhotoUrl = FRANCHISE_UPLOAD_URL . $newFilename;
}

// Only delete a previously-uploaded photo (never seed images under /images/).
function franchise_delete_uploaded_photo($photoUrl) {
    if ($photoUrl && strpos($photoUrl, FRANCHISE_UPLOAD_URL) === 0) {
        $fname = basename($photoUrl);
        @unlink(FRANCHISE_UPLOAD_DIR . $fname);
    }
}

try {
    $pdo = new PDO(
        "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4",
        DB_USER, DB_PASS,
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );

    if ($id > 0) {
        $cur = $pdo->prepare("SELECT photo FROM franchises WHERE id = ?");
        $cur->execute([$id]);
        $existing = $cur->fetch(PDO::FETCH_ASSOC);
        if (!$existing) {
            franchise_delete_uploaded_photo($newPhotoUrl);
            http_response_code(404);
            echo json_encode(['error' => 'Franchise not found']);
            exit;
        }
        $photoVal = $existing['photo'];
        if ($newPhotoUrl) {
            franchise_delete_uploaded_photo($existing['photo']);
            $photoVal = $newPhotoUrl;
        } elseif ($removePhoto) {
            franchise_delete_uploaded_photo($existing['photo']);
            $photoVal = '';
        } elseif ($photo !== '') {
            $photoVal = $photo;
        }
        $stmt = $pdo->prepare(
            "UPDATE franchises SET academy=?, head=?, area=?, city=?, photo=? WHERE id=?"
        );
        $stmt->execute([$academy, $head, $area, $city, $photoVal, $id]);
        echo json_encode(['success' => true, 'id' => $id, 'action' => 'updated']);
    } else {
        $photoVal = $newPhotoUrl ?: $photo;
        $order = (int)$pdo->query("SELECT COALESCE(MAX(sort_order), 0) + 1 FROM franchises")->fetchColumn();
        $stmt = $pdo->prepare(
            "INSERT INTO franchises (academy, head, area, city, photo, sort_order)
             VALUES (?,?,?,?,?,?)"
        );
        $stmt->execute([$academy, $head, $area, $city, $photoVal, $order]);
        echo json_encode(['success' => true, 'id' => (int)$pdo->lastInsertId(), 'action' => 'created']);
    }
} catch (Exception $e) {
    franchise_delete_uploaded_photo($newPhotoUrl);
    http_response_code(500);
    echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
}
