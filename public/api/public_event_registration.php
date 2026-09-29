<?php
// Public event registration template download and filled-sheet upload.
// Access is allowed only for active events with an admin-published template.

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit(0); }

require_once __DIR__ . '/portal_event_helper.php';

$pdo = portal_db();
_ev_ensure_tables($pdo);
$method = $_SERVER['REQUEST_METHOD'];
$event_id = (int)($_REQUEST['event_id'] ?? 0);

if ($event_id <= 0) {
    http_response_code(400);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'event_id is required']);
    exit;
}

$stmt = $pdo->prepare(
    "SELECT t.filename, t.original_name, e.title AS event_name, e.deadline
     FROM portal_event_template t
     JOIN events e ON e.id = t.event_id
     WHERE t.event_id = ? AND e.is_active = 1"
);
$stmt->execute([$event_id]);
$template = $stmt->fetch();

if (!$template) {
    http_response_code(404);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'Bulk registration is not available for this event']);
    exit;
}

if (!empty($template['deadline']) && date('Y-m-d') > $template['deadline']) {
    http_response_code(403);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'The registration deadline has passed']);
    exit;
}

if ($method === 'GET') {
    _ev_send_file(
        $template['filename'],
        $template['original_name'] ?: 'event_registration_template.xlsx',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
}

if ($method === 'POST') {
    header('Content-Type: application/json');
    if (empty($_FILES['file'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Choose the completed Excel file']);
        exit;
    }
    [$ok, $err] = _ev_validate_upload($_FILES['file']);
    if (!$ok) {
        http_response_code(400);
        echo json_encode(['error' => $err]);
        exit;
    }
    $uploader_name = trim($_POST['uploader_name'] ?? '');
    $academy_name = trim($_POST['academy_name'] ?? '');
    $city = trim($_POST['city'] ?? '');
    if ($uploader_name === '' || $academy_name === '' || $city === '') {
        http_response_code(400);
        echo json_encode(['error' => 'Your name, academy name, and city are required']);
        exit;
    }
    if (mb_strlen($uploader_name) > 150 || mb_strlen($academy_name) > 255 || mb_strlen($city) > 100) {
        http_response_code(400);
        echo json_encode(['error' => 'One or more details are too long']);
        exit;
    }

    $original = $_FILES['file']['name'] ?? '';
    $ext = strtolower(pathinfo($original, PATHINFO_EXTENSION));
    $parsed = ['headers' => null, 'rows' => []];
    if ($ext === 'xlsx') {
        try { $parsed = _ev_extract_rows($_FILES['file']['tmp_name']); } catch (Throwable $e) { }
    }

    $filename = _ev_store_upload($_FILES['file']);
    if (!$filename) {
        http_response_code(500);
        echo json_encode(['error' => 'Could not save the uploaded file']);
        exit;
    }

    $count = count($parsed['rows']);
    $pdo->prepare(
        "INSERT INTO portal_event_regs
            (event_id, center_id, event_name, filename, original_name, uploaded_at, headers_json, rows_json, row_count, uploader_name, academy_name, city)
         VALUES (?, 'PUBLIC', ?, ?, ?, NOW(), ?, ?, ?, ?, ?, ?)"
    )->execute([
        $event_id,
        $template['event_name'],
        $filename,
        $original,
        $parsed['headers'] !== null ? json_encode($parsed['headers'], JSON_UNESCAPED_UNICODE) : null,
        json_encode($parsed['rows'], JSON_UNESCAPED_UNICODE),
        $count,
        $uploader_name,
        $academy_name,
        $city,
    ]);

    echo json_encode([
        'success' => true,
        'count' => $count,
        'parsed' => $parsed['headers'] !== null,
        'message' => 'Registration file uploaded successfully',
    ]);
    exit;
}

http_response_code(405);
header('Content-Type: application/json');
echo json_encode(['error' => 'Method not allowed']);