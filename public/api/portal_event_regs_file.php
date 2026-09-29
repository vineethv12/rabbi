<?php
// Authenticated download of an event registration submission file (?id=<id>)
// Mirrors /api/portal_event_regs_file.php in the Node backend (api-server.js).

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Admin-Password');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit(0); }

require_once __DIR__ . '/portal_middleware.php';
require_once __DIR__ . '/portal_event_helper.php';

$claims = portal_auth_or_admin();
$role   = $claims['role'] ?? '';
$pdo    = portal_db();
_ev_ensure_tables($pdo);

$id = (int)($_GET['id'] ?? 0);
if (!$id) {
    http_response_code(400);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'id is required']);
    exit;
}

if ($role === 'admin') {
    $stmt = $pdo->prepare("SELECT filename, original_name FROM portal_event_regs WHERE id = ?");
    $stmt->execute([$id]);
} elseif ($role === 'franchise') {
    $stmt = $pdo->prepare("SELECT filename, original_name FROM portal_event_regs WHERE id = ? AND center_id = ?");
    $stmt->execute([$id, $claims['center_id']]);
} else {
    http_response_code(403);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'Access denied']);
    exit;
}

$rec = $stmt->fetch();
if (!$rec) {
    http_response_code(404);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'Submission not found']);
    exit;
}

_ev_send_file($rec['filename'], $rec['original_name'] ?: 'registrations.xlsx');
