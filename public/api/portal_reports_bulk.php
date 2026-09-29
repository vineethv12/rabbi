<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Admin-Password');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit(0); }

require_once __DIR__ . '/portal_middleware.php';
require_once __DIR__ . '/portal_audit_helper.php';

$claims = portal_auth_or_admin();
$role   = $claims['role'] ?? '';
$pdo    = portal_db();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

if ($role !== 'franchise' && $role !== 'admin') {
    http_response_code(403);
    echo json_encode(['error' => 'Access denied']);
    exit;
}

$body = json_decode(file_get_contents('php://input'), true) ?: [];

$center_id = ($role === 'admin')
    ? trim($body['center_id'] ?? '')
    : ($claims['center_id'] ?? '');
if (!$center_id) {
    http_response_code(400);
    echo json_encode(['error' => 'center_id is required for admin']);
    exit;
}

$report_date_raw = trim($body['report_date'] ?? '');
if (!$report_date_raw) {
    http_response_code(400);
    echo json_encode(['error' => 'Report date is required']);
    exit;
}
try {
    $report_date = (new DateTime($report_date_raw))->format('Y-m-d');
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid report date']);
    exit;
}
if ($report_date > date('Y-m-d')) {
    http_response_code(400);
    echo json_encode(['error' => 'Report date cannot be in the future']);
    exit;
}

$items = $body['reports'] ?? [];
if (!is_array($items) || count($items) === 0) {
    http_response_code(400);
    echo json_encode(['error' => 'No reports to submit']);
    exit;
}
if (count($items) > 500) {
    http_response_code(400);
    echo json_encode(['error' => 'Too many reports in one request']);
    exit;
}

// Keeps decimals (e.g. 0.8, 1.3), clamped to [0, max], 2 dp.
$clampDec = fn($v, $max) => max(0, min($max, round((float)$v, 2)));
$clampInt = fn($v, $max) => max(0, min($max, (int)$v));

$saved  = [];
$errors = [];
$seen   = [];

$chkStudent = $pdo->prepare("SELECT id FROM students WHERE enrollment_no = ? AND center_id = ?");
$chkDup     = $pdo->prepare("SELECT id FROM student_reports WHERE enrollment_no = ? AND report_date = ?");
$ins        = $pdo->prepare(
    "INSERT INTO student_reports
       (enrollment_no, center_id, report_date, attendance,
        sw_direct_view, sw_indirect_view, sw_right_hand_writing, sw_left_hand_writing,
        number_drop, decimal_drop, pagework_type, book_a_page, book_b_page,
        hw_book_a_page, hw_book_b_page, activity)
     VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?, ?, ?, ?)"
);

foreach ($items as $item) {
    if (!is_array($item)) $item = [];
    $enrollment_no = trim((string)($item['enrollment_no'] ?? ''));
    if (!$enrollment_no) { $errors[] = 'Missing enrollment number'; continue; }
    if (isset($seen[$enrollment_no])) { $errors[] = "$enrollment_no: duplicated in request"; continue; }
    $seen[$enrollment_no] = true;

    $chkStudent->execute([$enrollment_no, $center_id]);
    if (!$chkStudent->fetch()) { $errors[] = "$enrollment_no: student not found in center"; continue; }

    $chkDup->execute([$enrollment_no, $report_date]);
    if ($chkDup->fetch()) { $errors[] = "$enrollment_no: report already exists for $report_date"; continue; }

    $attendance = ($item['attendance'] ?? 'present') === 'absent' ? 'absent' : 'present';
    $pwtype     = ($item['pagework_type'] ?? 'class') === 'homework' ? 'homework' : 'class';
    $hwVal      = $clampDec($item['sw_hand_writing'] ?? $item['sw_right_hand_writing'] ?? 0, 20);
    $activity   = $item['activity'] ?? '';
    $activity   = (is_string($activity) || is_numeric($activity)) ? trim((string)$activity) : '';

    try {
        $ins->execute([
            $enrollment_no, $center_id, $report_date, $attendance,
            $clampDec($item['sw_direct_view']   ?? 0, 20),
            $clampDec($item['sw_indirect_view'] ?? 0, 20),
            $hwVal,
            $clampDec($item['number_drop']      ?? 0, 999),
            $clampDec($item['decimal_drop']     ?? 0, 999),
            $pwtype,
            $clampInt($item['book_a_page']      ?? 0, 100),
            $clampInt($item['book_b_page']      ?? 0, 100),
            $clampInt($item['hw_book_a_page']   ?? 0, 100),
            $clampInt($item['hw_book_b_page']   ?? 0, 100),
            $activity,
        ]);
        $saved[] = $enrollment_no;
    } catch (Exception $e) {
        $errors[] = "$enrollment_no: failed to save";
    }
}

if (count($saved) > 0) {
    $actorName = ($role === 'admin') ? 'Admin' : ($claims['center_id'] ?? '');
    _portal_audit_write($pdo, 'report_submitted',
        ($role === 'admin') ? 'admin' : ($claims['center_id'] ?? ''),
        $role, "Bulk ($report_date)",
        count($saved) . ' report(s) submitted: ' . implode(', ', $saved)
            . (count($errors) ? ' | ' . count($errors) . ' failed' : ''),
        $actorName);
}

echo json_encode(['success' => count($errors) === 0, 'saved' => count($saved), 'errors' => $errors]);
