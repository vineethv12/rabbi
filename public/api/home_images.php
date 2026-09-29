<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-Admin-Password');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit(0); }

require_once __DIR__ . '/../config.php';

define('HOME_UPLOAD_DIR', __DIR__ . '/../uploads/home/');
define('HOME_UPLOAD_URL', '/uploads/home/');
define('HERO_LIMIT',    5);
define('GALLERY_LIMIT', 10);

function homeDb() {
    return new PDO(
        "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4",
        DB_USER, DB_PASS,
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );
}

function requireHomeAuth() {
    $pw = $_SERVER['HTTP_X_ADMIN_PASSWORD'] ?? '';
    if ($pw !== ADMIN_PASSWORD) {
        http_response_code(401);
        echo json_encode(['error' => 'Unauthorized']);
        exit;
    }
}

// ── GET ───────────────────────────────────────────────────────────────────────
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    try {
        $pdo  = homeDb();
        $stmt = $pdo->query(
            "SELECT id, section, filename, caption, sort_order, uploaded_at
             FROM home_images ORDER BY section, sort_order ASC, id ASC"
        );
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
        $hero = []; $gallery = []; $awards = []; $founders = [];
        foreach ($rows as $row) {
            $item = [
                'id'          => (int)$row['id'],
                'src'         => HOME_UPLOAD_URL . $row['filename'],
                'caption'     => $row['caption'],
                'sort_order'  => (int)$row['sort_order'],
                'uploaded_at' => $row['uploaded_at'],
            ];
            if      ($row['section'] === 'hero')     $hero[]     = $item;
            elseif  ($row['section'] === 'gallery')  $gallery[]  = $item;
            elseif  ($row['section'] === 'awards')   $awards[]   = $item;
            else                                     $founders[] = $item;
        }
        echo json_encode(['hero' => $hero, 'gallery' => $gallery, 'awards' => $awards, 'founders' => $founders]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Database error']);
    }
    exit;
}

// ── POST (upload) ─────────────────────────────────────────────────────────────
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    requireHomeAuth();

    $section = isset($_POST['section']) ? trim($_POST['section']) : '';
    if (!in_array($section, ['hero', 'gallery', 'awards', 'founders'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid section. Use "hero", "gallery", "awards", or "founders".']);
        exit;
    }
    $caption = isset($_POST['caption']) ? trim($_POST['caption']) : '';
    $limits  = ['hero' => HERO_LIMIT, 'gallery' => GALLERY_LIMIT, 'awards' => 12, 'founders' => 4];
    $limit   = $limits[$section];

    try {
        $pdo       = homeDb();
        $countStmt = $pdo->prepare("SELECT COUNT(*) FROM home_images WHERE section = ?");
        $countStmt->execute([$section]);
        $count = (int)$countStmt->fetchColumn();
        if ($count >= $limit) {
            http_response_code(400);
            echo json_encode(['error' => "Maximum {$limit} images allowed for this section. Please delete one first."]);
            exit;
        }
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Database error']);
        exit;
    }

    if (empty($_FILES['image']) || $_FILES['image']['error'] !== UPLOAD_ERR_OK) {
        http_response_code(400);
        echo json_encode(['error' => 'No file uploaded or upload error']);
        exit;
    }

    $file     = $_FILES['image'];
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

    if (!is_dir(HOME_UPLOAD_DIR)) { mkdir(HOME_UPLOAD_DIR, 0755, true); }

    // Compress + convert to WebP for fast page loads (falls back to original)
    require_once __DIR__ . '/image_optimize.php';
    $filename = rga_optimize_image($file['tmp_name'], $mimeType, HOME_UPLOAD_DIR, $section);
    if ($filename !== null) {
        $dest = HOME_UPLOAD_DIR . $filename;
    } else {
        $ext      = $allowed[$mimeType];
        $filename = $section . '_' . uniqid() . '.' . $ext;
        $dest     = HOME_UPLOAD_DIR . $filename;
        if (!move_uploaded_file($file['tmp_name'], $dest)) {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to save file']);
            exit;
        }
    }

    try {
        $sortStmt = $pdo->prepare("SELECT COALESCE(MAX(sort_order), 0) + 1 FROM home_images WHERE section = ?");
        $sortStmt->execute([$section]);
        $sortOrder = (int)$sortStmt->fetchColumn();

        $ins = $pdo->prepare(
            "INSERT INTO home_images (section, filename, caption, sort_order) VALUES (?, ?, ?, ?)"
        );
        $captionDefaults = ['hero' => 'Hero Image', 'gallery' => 'Gallery Image', 'awards' => 'Award Photo', 'founders' => 'Founder Photo'];
        $ins->execute([$section, $filename, $caption ?: $captionDefaults[$section], $sortOrder]);
        $id = $pdo->lastInsertId();

        echo json_encode([
            'success' => true,
            'id'      => (int)$id,
            'src'     => HOME_UPLOAD_URL . $filename,
            'caption' => $caption,
        ]);
    } catch (Exception $e) {
        @unlink($dest);
        http_response_code(500);
        echo json_encode(['error' => 'Database error. File was not saved.']);
    }
    exit;
}

// ── DELETE ────────────────────────────────────────────────────────────────────
if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    requireHomeAuth();

    $id = isset($_GET['id']) ? (int)$_GET['id'] : 0;
    if ($id <= 0) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid ID']);
        exit;
    }

    try {
        $pdo  = homeDb();
        $stmt = $pdo->prepare("SELECT filename FROM home_images WHERE id = ?");
        $stmt->execute([$id]);
        $row  = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$row) {
            http_response_code(404);
            echo json_encode(['error' => 'Image not found']);
            exit;
        }
        $pdo->prepare("DELETE FROM home_images WHERE id = ?")->execute([$id]);
        @unlink(HOME_UPLOAD_DIR . $row['filename']);
        echo json_encode(['success' => true]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Database error']);
    }
    exit;
}

http_response_code(405);
echo json_encode(['error' => 'Method not allowed']);
