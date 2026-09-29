<?php
// Portal event registration template — mirrors /api/portal_event_template.php
// in the Node backend (api-server.js).
//   GET  ?list=1             → all event templates (franchise/admin)
//   GET  ?meta=1&event_id=N  → template metadata JSON (franchise/admin)
//   GET  ?event_id=N         → download the event template (franchise/admin)
//   POST                     → admin uploads/replaces a template (file, event_id)
//   DELETE                   → admin removes a template (JSON: event_id)

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Admin-Password');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit(0); }

require_once __DIR__ . '/portal_middleware.php';
require_once __DIR__ . '/portal_audit_helper.php';
require_once __DIR__ . '/portal_event_helper.php';

$claims = portal_auth_or_admin();
$role   = $claims['role'] ?? '';
$pdo    = portal_db();
_ev_ensure_tables($pdo);
$method = $_SERVER['REQUEST_METHOD'];

if ($role !== 'franchise' && $role !== 'admin') {
    http_response_code(403);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'Access denied']);
    exit;
}

if ($method === 'GET') {
    if (!empty($_GET['list'])) {
        header('Content-Type: application/json');
        $rows = $pdo->query(
            "SELECT t.event_id, e.title AS event_name, t.filename, t.original_name, t.uploaded_at
             FROM portal_event_template t
             JOIN events e ON e.id = t.event_id
             WHERE t.event_id IS NOT NULL AND e.is_active = 1
               AND (e.deadline IS NULL OR e.deadline = '' OR e.deadline >= CURDATE())
             ORDER BY e.event_date ASC, e.id ASC"
        )->fetchAll();
        echo json_encode(array_map(function ($row) {
            $row['event_id'] = (int)$row['event_id'];
            $row['uploaded_at'] = date('c', strtotime($row['uploaded_at']));
            return $row;
        }, $rows));
        exit;
    }

    $event_id = (int)($_GET['event_id'] ?? 0);
    if ($event_id <= 0) {
        http_response_code(400);
        header('Content-Type: application/json');
        echo json_encode(['error' => 'event_id is required']);
        exit;
    }
    $eligibility = $role === 'franchise'
        ? " AND e.is_active = 1 AND (e.deadline IS NULL OR e.deadline = '' OR e.deadline >= CURDATE())"
        : "";
    $stmt = $pdo->prepare(
        "SELECT t.event_id, e.title AS event_name, t.filename, t.original_name, t.uploaded_at
         FROM portal_event_template t JOIN events e ON e.id = t.event_id
         WHERE t.event_id = ?" . $eligibility
    );
    $stmt->execute([$event_id]);
    $meta = $stmt->fetch() ?: null;

    if (!empty($_GET['meta'])) {
        header('Content-Type: application/json');
        if (!$meta) { echo json_encode(new stdClass()); exit; }
        echo json_encode([
            'event_id'      => (int)$meta['event_id'],
            'event_name'    => $meta['event_name'],
            'filename'      => $meta['filename'],
            'original_name' => $meta['original_name'],
            'uploaded_at'   => date('c', strtotime($meta['uploaded_at'])),
        ]);
        exit;
    }

    if (!$meta || !$meta['filename']) {
        http_response_code(404);
        header('Content-Type: application/json');
        echo json_encode(['error' => 'No event template has been uploaded yet']);
        exit;
    }
    _ev_send_file(
        $meta['filename'],
        $meta['original_name'] ?: 'event_template.xlsx',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
}

if ($method === 'POST') {
    header('Content-Type: application/json');
    if ($role !== 'admin') {
        http_response_code(403);
        echo json_encode(['error' => 'Admin access required']);
        exit;
    }
    if (empty($_FILES['file'])) {
        http_response_code(400);
        echo json_encode(['error' => 'No file uploaded']);
        exit;
    }
    [$ok, $err] = _ev_validate_upload($_FILES['file']);
    if (!$ok) { http_response_code(400); echo json_encode(['error' => $err]); exit; }

    $event_id = (int)($_POST['event_id'] ?? 0);
    if ($event_id <= 0) {
        http_response_code(400);
        echo json_encode(['error' => 'Select a valid event']);
        exit;
    }
    $eventStmt = $pdo->prepare("SELECT title FROM events WHERE id = ?");
    $eventStmt->execute([$event_id]);
    $event = $eventStmt->fetch();
    if (!$event) {
        http_response_code(404);
        echo json_encode(['error' => 'Event not found']);
        exit;
    }
    $event_name = $event['title'];

    $filename = _ev_store_upload($_FILES['file']);
    if (!$filename) { http_response_code(500); echo json_encode(['error' => 'Could not save uploaded file']); exit; }

    $oldStmt = $pdo->prepare("SELECT filename FROM portal_event_template WHERE event_id = ?");
    $oldStmt->execute([$event_id]);
    $old = $oldStmt->fetch();
    $original = $_FILES['file']['name'] ?? '';
    $pdo->prepare(
        "INSERT INTO portal_event_template (event_id, event_name, filename, original_name, uploaded_at)
         VALUES (?, ?, ?, ?, NOW())
         ON DUPLICATE KEY UPDATE event_name = VALUES(event_name), filename = VALUES(filename),
             original_name = VALUES(original_name), uploaded_at = NOW()"
    )->execute([$event_id, $event_name, $filename, $original]);
    if ($old && !empty($old['filename']) && $old['filename'] !== $filename) {
        @unlink(_ev_upload_dir() . '/' . basename($old['filename']));
    }

    _portal_audit_write($pdo, 'event_template_uploaded', 'admin', 'admin', "\"$event_name\" (#$event_id)", "File: $original");

    echo json_encode([
        'success'       => true,
        'event_id'      => $event_id,
        'event_name'    => $event_name,
        'filename'      => $filename,
        'original_name' => $original,
        'uploaded_at'   => date('c'),
    ]);
    exit;
}

if ($method === 'DELETE') {
    header('Content-Type: application/json');
    if ($role !== 'admin') {
        http_response_code(403);
        echo json_encode(['error' => 'Admin access required']);
        exit;
    }
    $body = json_decode(file_get_contents('php://input'), true) ?: [];
    $event_id = (int)($body['event_id'] ?? 0);
    if ($event_id <= 0) {
        http_response_code(400);
        echo json_encode(['error' => 'event_id is required']);
        exit;
    }
    $stmt = $pdo->prepare("SELECT filename, event_name FROM portal_event_template WHERE event_id = ?");
    $stmt->execute([$event_id]);
    $old = $stmt->fetch();
    if ($old) {
        $pdo->prepare("DELETE FROM portal_event_template WHERE event_id = ?")->execute([$event_id]);
        if (!empty($old['filename'])) @unlink(_ev_upload_dir() . '/' . basename($old['filename']));
        _portal_audit_write($pdo, 'event_template_removed', 'admin', 'admin', "\"{$old['event_name']}\" (#$event_id)", '');
    }
    echo json_encode(['success' => true, 'event_id' => $event_id]);
    exit;
}

http_response_code(405);
header('Content-Type: application/json');
echo json_encode(['error' => 'Method not allowed']);
