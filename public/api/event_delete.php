<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: X-Admin-Password, Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit(0); }

require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/portal_event_helper.php';

$password = $_SERVER['HTTP_X_ADMIN_PASSWORD'] ?? '';
if ($password !== ADMIN_PASSWORD) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}

$body = json_decode(file_get_contents('php://input'), true);
$id   = isset($body['id']) ? (int)$body['id'] : 0;

if ($id <= 0) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid event ID']);
    exit;
}

try {
    $pdo = new PDO(
        "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4",
        DB_USER,
        DB_PASS,
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );
    _ev_ensure_tables($pdo);

    $regStmt = $pdo->prepare("SELECT COUNT(*) FROM portal_event_regs WHERE event_id = ?");
    $regStmt->execute([$id]);
    if ((int)$regStmt->fetchColumn() > 0) {
        http_response_code(409);
        echo json_encode(['error' => 'Delete this event’s registration uploads first, then delete the event']);
        exit;
    }

    $tmplStmt = $pdo->prepare("SELECT filename FROM portal_event_template WHERE event_id = ?");
    $tmplStmt->execute([$id]);
    $template = $tmplStmt->fetch();

    $stmt = $pdo->prepare("DELETE FROM events WHERE id = ?");
    $stmt->execute([$id]);

    if ($stmt->rowCount() === 0) {
        http_response_code(404);
        echo json_encode(['error' => 'Event not found']);
        exit;
    }
    $pdo->prepare("DELETE FROM portal_event_template WHERE event_id = ?")->execute([$id]);
    if ($template && !empty($template['filename'])) {
        @unlink(_ev_upload_dir() . '/' . basename($template['filename']));
    }

    echo json_encode(['success' => true, 'id' => $id]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database error']);
}