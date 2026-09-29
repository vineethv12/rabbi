<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: X-Admin-Password, Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit(0); }

require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/event_resource_helper.php';

$password = $_SERVER['HTTP_X_ADMIN_PASSWORD'] ?? '';
if ($password !== ADMIN_PASSWORD) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}

$body = json_decode(file_get_contents('php://input'), true);
if (!$body) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid JSON body']);
    exit;
}

$id            = isset($body['id'])             ? (int)$body['id']             : 0;
$eventDate     = trim($body['event_date']    ?? '');
$month         = trim($body['month']         ?? '');
$day           = trim($body['day']           ?? '');
$dateRange     = trim($body['date_range']    ?? '');
$badge         = trim($body['badge']         ?? '');
$statusLabel   = trim($body['status_label']  ?? 'Coming Soon');
$statusType    = in_array($body['status_type'] ?? '', ['open','soon','early','closed'])
                   ? $body['status_type'] : 'soon';
$title         = trim($body['title']         ?? 'Rabbi Global Academy');
$subtitle      = trim($body['subtitle']      ?? '');
$description   = trim($body['description']   ?? '');
$venue         = trim($body['venue']         ?? '');
$format        = trim($body['format']        ?? '');
$participants  = trim($body['participants']  ?? '');
$registerUrl   = trim($body['register_url']  ?? '');
$registerLabel = trim($body['register_label']?? 'Register Now');
$brochureUrl   = trim($body['brochure_url']  ?? '');
$modelPaperUrl = trim($body['model_question_paper_url'] ?? '');
if ($modelPaperUrl !== '' && (
    strlen($modelPaperUrl) > 2000 ||
    !filter_var($modelPaperUrl, FILTER_VALIDATE_URL) ||
    !in_array(strtolower(parse_url($modelPaperUrl, PHP_URL_SCHEME) ?? ''), ['http', 'https'], true)
)) {
    http_response_code(400);
    echo json_encode(['error' => 'Model question paper URL must be a valid http:// or https:// link (maximum 2000 characters).']);
    exit;
}
$deadline      = trim($body['deadline']      ?? '');
$image         = trim($body['image']         ?? '');
$isActive      = isset($body['is_active'])   ? ($body['is_active'] ? 1 : 0) : 1;

if ($eventDate && (!$month || !$day)) {
    $d     = new DateTime($eventDate);
    $month = $month ?: $d->format('F');
    $day   = $day   ?: $d->format('j');
}

$eventDateVal    = $eventDate !== '' ? $eventDate : null;
$eventEndDate    = trim($body['event_end_date'] ?? '');
$eventEndDateVal = $eventEndDate !== '' ? $eventEndDate : null;
// Subtitle and description are optional (matches the Node backend).

try {
    $pdo = new PDO(
        "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4",
        DB_USER,
        DB_PASS,
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );

    $hasEnd = $pdo->query("SHOW COLUMNS FROM events LIKE 'event_end_date'")->fetch();
    event_resource_ensure($pdo);
    if (!$hasEnd) {
        try { $pdo->exec("ALTER TABLE events ADD COLUMN event_end_date DATE NULL AFTER event_date"); }
        catch (Exception $e) { /* concurrent add or no ALTER privilege */ }
    }
    $hasImg = $pdo->query("SHOW COLUMNS FROM events LIKE 'image'")->fetch();
    if (!$hasImg) {
        try { $pdo->exec("ALTER TABLE events ADD COLUMN image VARCHAR(500) NOT NULL DEFAULT ''"); }
        catch (Exception $e) { /* concurrent add or no ALTER privilege */ }
    }

    if ($id > 0) {
        $stmt = $pdo->prepare(
            "UPDATE events SET
               event_date=?, event_end_date=?, month=?, day=?, date_range=?, badge=?,
               status_label=?, status_type=?, title=?, subtitle=?, description=?,
               venue=?, format=?, participants=?,
               register_url=?, register_label=?, brochure_url=?, model_question_paper_url=?, deadline=?, image=?, is_active=?
             WHERE id=?"
        );
        $stmt->execute([
            $eventDateVal, $eventEndDateVal, $month, $day, $dateRange, $badge,
            $statusLabel, $statusType, $title, $subtitle, $description,
            $venue, $format, $participants,
            $registerUrl, $registerLabel, $brochureUrl, $modelPaperUrl, $deadline, $image, $isActive,
            $id
        ]);
        echo json_encode(['success' => true, 'id' => $id, 'action' => 'updated']);
    } else {
        $stmt = $pdo->prepare(
            "INSERT INTO events
               (event_date, event_end_date, month, day, date_range, badge,
                status_label, status_type, title, subtitle, description,
                venue, format, participants,
                register_url, register_label, brochure_url, model_question_paper_url, deadline, image, is_active)
             VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)"
        );
        $stmt->execute([
            $eventDateVal, $eventEndDateVal, $month, $day, $dateRange, $badge,
            $statusLabel, $statusType, $title, $subtitle, $description,
            $venue, $format, $participants,
            $registerUrl, $registerLabel, $brochureUrl, $modelPaperUrl, $deadline, $image, $isActive
        ]);
        echo json_encode(['success' => true, 'id' => (int)$pdo->lastInsertId(), 'action' => 'created']);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
}