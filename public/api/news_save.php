<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: X-Admin-Password, Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit(0); }

require_once __DIR__ . '/../config.php';

define('NEWS_UPLOAD_DIR', __DIR__ . '/../uploads/news/');
define('NEWS_IMAGE_MAX', 10 * 1024 * 1024);  // 10 MB
define('NEWS_VIDEO_MAX', 50 * 1024 * 1024);  // 50 MB

$password = $_SERVER['HTTP_X_ADMIN_PASSWORD'] ?? '';
if ($password !== ADMIN_PASSWORD) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}

$categories = ['News', 'Update', 'Story', 'Announcement'];

$id       = isset($_POST['id']) ? (int)$_POST['id'] : 0;
$title    = trim($_POST['title'] ?? '');
$category = in_array($_POST['category'] ?? '', $categories) ? $_POST['category'] : 'News';
$date     = trim($_POST['news_date'] ?? ($_POST['date'] ?? ''));
$summary  = trim($_POST['summary'] ?? '');
$body     = trim($_POST['body'] ?? '');
$linkUrl  = trim($_POST['link_url'] ?? '');
$isActive = (($_POST['is_active'] ?? '1') === '0') ? 0 : 1;
$removeMedia = (($_POST['remove_media'] ?? '') === '1') || (($_POST['remove_image'] ?? '') === '1');

if ($title === '') {
    http_response_code(400);
    echo json_encode(['error' => 'Title is required']);
    exit;
}
$dateVal = $date !== '' ? $date : date('Y-m-d');

// ── Optional media upload (photo or video) ────────────────────────────────────
$upload = null;
if (!empty($_FILES['media']) && $_FILES['media']['error'] === UPLOAD_ERR_OK) {
    $upload = $_FILES['media'];
} elseif (!empty($_FILES['image']) && $_FILES['image']['error'] === UPLOAD_ERR_OK) {
    $upload = $_FILES['image']; // back-compat
}

$newFilename = null;   // stored file name
$newIsVideo  = false;
if ($upload) {
    $finfo    = finfo_open(FILEINFO_MIME_TYPE);
    $mimeType = finfo_file($finfo, $upload['tmp_name']);
    finfo_close($finfo);

    $allowedImages = ['image/jpeg' => 'jpg', 'image/png' => 'png', 'image/webp' => 'webp', 'image/gif' => 'gif'];
    $allowedVideos = ['video/mp4' => 'mp4', 'video/webm' => 'webm', 'video/quicktime' => 'mov'];

    if (isset($allowedImages[$mimeType])) {
        if ($upload['size'] > NEWS_IMAGE_MAX) {
            http_response_code(400);
            echo json_encode(['error' => 'Image too large (max 10 MB)']);
            exit;
        }
        $ext = $allowedImages[$mimeType];
    } elseif (isset($allowedVideos[$mimeType])) {
        if ($upload['size'] > NEWS_VIDEO_MAX) {
            http_response_code(400);
            echo json_encode(['error' => 'Video too large (max 50 MB)']);
            exit;
        }
        $ext = $allowedVideos[$mimeType];
        $newIsVideo = true;
    } else {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid file type. Allowed: JPG, PNG, WebP, GIF images or MP4, WebM, MOV videos.']);
        exit;
    }

    if (!is_dir(NEWS_UPLOAD_DIR)) { mkdir(NEWS_UPLOAD_DIR, 0755, true); }
    $newFilename = null;
    if (!$newIsVideo) {
        // Compress + convert image to WebP for fast page loads
        require_once __DIR__ . '/image_optimize.php';
        $newFilename = rga_optimize_image($upload['tmp_name'], $mimeType, NEWS_UPLOAD_DIR, 'news');
    }
    if ($newFilename === null) {
        $newFilename = 'news_' . uniqid() . '.' . $ext;
        if (!move_uploaded_file($upload['tmp_name'], NEWS_UPLOAD_DIR . $newFilename)) {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to save file']);
            exit;
        }
    }
}

try {
    $pdo = new PDO(
        "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4",
        DB_USER, DB_PASS,
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );

    if ($id > 0) {
        $cur = $pdo->prepare("SELECT image, video FROM news WHERE id = ?");
        $cur->execute([$id]);
        $existing = $cur->fetch(PDO::FETCH_ASSOC);
        if (!$existing) {
            if ($newFilename) @unlink(NEWS_UPLOAD_DIR . $newFilename);
            http_response_code(404);
            echo json_encode(['error' => 'News post not found']);
            exit;
        }
        $imageVal = $existing['image'];
        $videoVal = $existing['video'] ?? null;
        if ($newFilename) {
            if ($imageVal) @unlink(NEWS_UPLOAD_DIR . $imageVal);
            if ($videoVal) @unlink(NEWS_UPLOAD_DIR . $videoVal);
            $imageVal = $newIsVideo ? null : $newFilename;
            $videoVal = $newIsVideo ? $newFilename : null;
        } elseif ($removeMedia) {
            if ($imageVal) @unlink(NEWS_UPLOAD_DIR . $imageVal);
            if ($videoVal) @unlink(NEWS_UPLOAD_DIR . $videoVal);
            $imageVal = null;
            $videoVal = null;
        }
        $stmt = $pdo->prepare(
            "UPDATE news SET title=?, category=?, news_date=?, summary=?, body=?, image=?, video=?, link_url=?, is_active=? WHERE id=?"
        );
        $stmt->execute([$title, $category, $dateVal, $summary, $body, $imageVal, $videoVal, $linkUrl, $isActive, $id]);
        echo json_encode(['success' => true, 'id' => $id, 'action' => 'updated']);
    } else {
        $stmt = $pdo->prepare(
            "INSERT INTO news (title, category, news_date, summary, body, image, video, link_url, is_active)
             VALUES (?,?,?,?,?,?,?,?,?)"
        );
        $stmt->execute([
            $title, $category, $dateVal, $summary, $body,
            $newIsVideo ? null : $newFilename,
            $newIsVideo ? $newFilename : null,
            $linkUrl, $isActive,
        ]);
        echo json_encode(['success' => true, 'id' => (int)$pdo->lastInsertId(), 'action' => 'created']);
    }
} catch (Exception $e) {
    if ($newFilename) @unlink(NEWS_UPLOAD_DIR . $newFilename);
    http_response_code(500);
    echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
}
