<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: X-Admin-Password, Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit(0); }

require_once __DIR__ . '/../config.php';

// ── Auth ─────────────────────────────────────────────────────────────────────
$password = $_SERVER['HTTP_X_ADMIN_PASSWORD'] ?? '';
if ($password !== ADMIN_PASSWORD) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}

// ── Parse body ────────────────────────────────────────────────────────────────
$body = json_decode(file_get_contents('php://input'), true);

// Support both single id and bulk ids array
$ids = [];
if (!empty($body['ids']) && is_array($body['ids'])) {
    foreach ($body['ids'] as $v) {
        $int = (int)$v;
        if ($int > 0) $ids[] = $int;
    }
} elseif (!empty($body['id'])) {
    $int = (int)$body['id'];
    if ($int > 0) $ids[] = $int;
}

if (empty($ids)) {
    http_response_code(400);
    echo json_encode(['error' => 'No valid image ID(s) provided']);
    exit;
}

// ── Fetch & delete ────────────────────────────────────────────────────────────
try {
    $pdo = new PDO(
        "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4",
        DB_USER,
        DB_PASS,
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );

    $placeholders = implode(',', array_fill(0, count($ids), '?'));

    $stmt = $pdo->prepare("SELECT id, filename FROM gallery_images WHERE id IN ($placeholders)");
    $stmt->execute($ids);
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    if (empty($rows)) {
        http_response_code(404);
        echo json_encode(['error' => 'No matching images found']);
        exit;
    }

    // Delete from database
    $pdo->prepare("DELETE FROM gallery_images WHERE id IN ($placeholders)")->execute($ids);

    // Delete files from disk
    foreach ($rows as $row) {
        $filepath = UPLOAD_DIR . $row['filename'];
        if (file_exists($filepath)) {
            @unlink($filepath);
        }
    }

    $deletedIds = array_column($rows, 'id');
    echo json_encode(['success' => true, 'deleted' => $deletedIds]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database error']);
}
