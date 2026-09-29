<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: X-Admin-Password');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit(0); }

require_once __DIR__ . '/../config.php';

// ── Auth ─────────────────────────────────────────────────────────────────────
$password = $_SERVER['HTTP_X_ADMIN_PASSWORD'] ?? '';
if ($password !== ADMIN_PASSWORD) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}

// ── Inputs ────────────────────────────────────────────────────────────────────
$displayType = (isset($_POST['display_type']) && $_POST['display_type'] === 'category')
    ? 'category' : 'year';
$caption  = isset($_POST['caption'])  ? trim($_POST['caption'])  : '';
$category = isset($_POST['category']) ? trim($_POST['category']) : 'General';
$year     = isset($_POST['year'])     ? (int)$_POST['year']      : 0;

if ($caption  === '') { $caption  = 'Gallery Item'; }
if ($category === '') { $category = 'General'; }

if ($displayType === 'year' && ($year < 2000 || $year > 2100)) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid year']);
    exit;
}

// ── File validation ───────────────────────────────────────────────────────────
if (empty($_FILES['image']) || $_FILES['image']['error'] !== UPLOAD_ERR_OK) {
    http_response_code(400);
    echo json_encode(['error' => 'No file uploaded or upload error']);
    exit;
}

$file = $_FILES['image'];

$finfo    = finfo_open(FILEINFO_MIME_TYPE);
$mimeType = finfo_file($finfo, $file['tmp_name']);
finfo_close($finfo);

$mimeMap = [
    'image/jpeg'      => ['ext' => 'jpg',  'media_type' => 'image'],
    'image/png'       => ['ext' => 'png',  'media_type' => 'image'],
    'image/webp'      => ['ext' => 'webp', 'media_type' => 'image'],
    'image/gif'       => ['ext' => 'gif',  'media_type' => 'image'],
    'video/mp4'       => ['ext' => 'mp4',  'media_type' => 'video'],
    'video/webm'      => ['ext' => 'webm', 'media_type' => 'video'],
    'video/quicktime' => ['ext' => 'mov',  'media_type' => 'video'],
    'video/x-msvideo' => ['ext' => 'avi',  'media_type' => 'video'],
];

if (!isset($mimeMap[$mimeType])) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid file type. Allowed: JPG, PNG, WebP, GIF, MP4, WebM, MOV.']);
    exit;
}

$mediaType = $mimeMap[$mimeType]['media_type'];
$ext       = $mimeMap[$mimeType]['ext'];

// Images: 10 MB max — Videos: 200 MB max
$maxSize = $mediaType === 'video' ? 200 * 1024 * 1024 : MAX_FILE_SIZE;
if ($file['size'] > $maxSize) {
    $limitLabel = $mediaType === 'video' ? '200 MB' : '10 MB';
    http_response_code(400);
    echo json_encode(['error' => "File too large (max $limitLabel for {$mediaType}s)"]);
    exit;
}

// ── Save file ─────────────────────────────────────────────────────────────────
if (!is_dir(UPLOAD_DIR)) {
    mkdir(UPLOAD_DIR, 0755, true);
}

$prefix   = $displayType === 'year'
    ? $year
    : substr(preg_replace('/[^a-z0-9]/i', '_', $category), 0, 30);

// Save the file exactly as uploaded — no WebP conversion, no resizing,
// no rotation. The original format and orientation are preserved.
$filename = $prefix . '_' . uniqid() . '.' . $ext;
$dest     = UPLOAD_DIR . $filename;

if (!move_uploaded_file($file['tmp_name'], $dest)) {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to save file']);
    exit;
}

// ── Insert into DB ────────────────────────────────────────────────────────────
try {
    $pdo = new PDO(
        "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4",
        DB_USER,
        DB_PASS,
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );

    $dbYear = ($displayType === 'year') ? $year : null;

    $stmt = $pdo->prepare(
        "INSERT INTO gallery_images (year, caption, category, display_type, media_type, filename)
         VALUES (?, ?, ?, ?, ?, ?)"
    );
    $stmt->execute([$dbYear, $caption, $category, $displayType, $mediaType, $filename]);
    $id = $pdo->lastInsertId();

    echo json_encode([
        'success'      => true,
        'id'           => (int)$id,
        'src'          => UPLOAD_URL . $filename,
        'caption'      => $caption,
        'year'         => $dbYear,
        'display_type' => $displayType,
        'media_type'   => $mediaType,
        'category'     => $category,
    ]);
} catch (Exception $e) {
    @unlink($dest);
    http_response_code(500);
    echo json_encode(['error' => 'Database error. File was not saved.']);
}
