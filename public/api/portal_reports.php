<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Admin-Password');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit(0); }

require_once __DIR__ . '/portal_middleware.php';
require_once __DIR__ . '/portal_audit_helper.php';

$claims = portal_auth_or_admin();
$role   = $claims['role'] ?? '';
$pdo    = portal_db();
$method = $_SERVER['REQUEST_METHOD'];

$REPORT_COLS = "r.id, r.enrollment_no, r.center_id, r.report_date, r.attendance,
                r.sw_direct_view, r.sw_indirect_view,
                r.sw_right_hand_writing AS sw_hand_writing,
                r.number_drop, r.decimal_drop, r.pagework_type,
                r.book_a_page, r.book_b_page, r.hw_book_a_page, r.hw_book_b_page,
                r.activity, r.created_at, r.updated_at";

// ── GET: list reports ────────────────────────────────────────────────────────
if ($method === 'GET') {
    if ($role === 'admin') {
        $enrollment_no = trim($_GET['enrollment_no'] ?? '');
        $center_id_f   = trim($_GET['center_id'] ?? '');
        if ($enrollment_no) {
            $stmt = $pdo->prepare(
                "SELECT $REPORT_COLS, s.name AS student_name FROM student_reports r
                 LEFT JOIN students s ON s.enrollment_no = r.enrollment_no
                 WHERE r.enrollment_no = ?
                 ORDER BY r.report_date DESC, r.id DESC LIMIT 500"
            );
            $stmt->execute([$enrollment_no]);
        } elseif ($center_id_f) {
            $stmt = $pdo->prepare(
                "SELECT $REPORT_COLS, s.name AS student_name FROM student_reports r
                 LEFT JOIN students s ON s.enrollment_no = r.enrollment_no
                 WHERE r.center_id = ?
                 ORDER BY r.report_date DESC, r.id DESC LIMIT 500"
            );
            $stmt->execute([$center_id_f]);
        } else {
            $stmt = $pdo->query(
                "SELECT $REPORT_COLS, s.name AS student_name FROM student_reports r
                 LEFT JOIN students s ON s.enrollment_no = r.enrollment_no
                 ORDER BY r.report_date DESC, r.id DESC LIMIT 500"
            );
        }
        echo json_encode($stmt->fetchAll());
        exit;
    }

    if ($role === 'student') {
        $stmt = $pdo->prepare(
            "SELECT $REPORT_COLS FROM student_reports r
             WHERE r.enrollment_no = ? ORDER BY r.report_date DESC, r.id DESC"
        );
        $stmt->execute([$claims['login_id']]);
        echo json_encode($stmt->fetchAll());
        exit;
    }

    if ($role === 'franchise') {
        $center_id     = $claims['center_id'];
        $enrollment_no = trim($_GET['enrollment_no'] ?? '');
        if ($enrollment_no) {
            $stmt = $pdo->prepare(
                "SELECT $REPORT_COLS FROM student_reports r
                 WHERE r.enrollment_no = ? AND r.center_id = ?
                 ORDER BY r.report_date DESC, r.id DESC"
            );
            $stmt->execute([$enrollment_no, $center_id]);
        } else {
            $stmt = $pdo->prepare(
                "SELECT $REPORT_COLS, s.name AS student_name FROM student_reports r
                 LEFT JOIN students s ON s.enrollment_no = r.enrollment_no
                 WHERE r.center_id = ?
                 ORDER BY r.report_date DESC, r.id DESC LIMIT 500"
            );
            $stmt->execute([$center_id]);
        }
        echo json_encode($stmt->fetchAll());
        exit;
    }

    http_response_code(403);
    echo json_encode(['error' => 'Access denied']);
    exit;
}

// ── POST: create a report ─────────────────────────────────────────────────────
if ($method === 'POST') {
    if ($role !== 'franchise' && $role !== 'admin') {
        http_response_code(403);
        echo json_encode(['error' => 'Access denied']);
        exit;
    }
    $body = json_decode(file_get_contents('php://input'), true) ?? [];

    $enrollment_no = trim($body['enrollment_no'] ?? '');
    $report_date   = trim($body['report_date'] ?? '');

    // Admin must provide center_id explicitly
    $center_id = ($role === 'admin')
        ? trim($body['center_id'] ?? '')
        : $claims['center_id'];

    if (!$enrollment_no || !$report_date) {
        http_response_code(400);
        echo json_encode(['error' => 'Student and report date are required']);
        exit;
    }
    if ($role === 'admin' && !$center_id) {
        http_response_code(400);
        echo json_encode(['error' => 'center_id is required for admin']);
        exit;
    }
    try {
        $report_date = (new DateTime($report_date))->format('Y-m-d');
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

    // Verify the student belongs to the center
    $chk = $pdo->prepare("SELECT id FROM students WHERE enrollment_no = ? AND center_id = ?");
    $chk->execute([$enrollment_no, $center_id]);
    if (!$chk->fetch()) {
        http_response_code(404);
        echo json_encode(['error' => 'Student not found in the specified center']);
        exit;
    }

    // Only one report per student per date
    $dup = $pdo->prepare("SELECT id FROM student_reports WHERE enrollment_no = ? AND report_date = ?");
    $dup->execute([$enrollment_no, $report_date]);
    if ($dup->fetch()) {
        http_response_code(409);
        echo json_encode(['error' => "A report already exists for $report_date"]);
        exit;
    }

    $attendance = ($body['attendance'] ?? 'present') === 'absent' ? 'absent' : 'present';
    $pwtype     = ($body['pagework_type'] ?? 'class') === 'homework' ? 'homework' : 'class';
    $clamp      = fn($v, $max) => max(0, min($max, round((float)$v, 2)));

    $hwVal = $clamp($body['sw_hand_writing'] ?? $body['sw_right_hand_writing'] ?? 0, 20);

    $stmt = $pdo->prepare(
        "INSERT INTO student_reports
           (enrollment_no, center_id, report_date, attendance,
            sw_direct_view, sw_indirect_view, sw_right_hand_writing, sw_left_hand_writing,
            number_drop, decimal_drop, pagework_type, book_a_page, book_b_page,
            hw_book_a_page, hw_book_b_page, activity)
         VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?, ?, ?, ?)"
    );
    $stmt->execute([
        $enrollment_no, $center_id, $report_date, $attendance,
        $clamp($body['sw_direct_view']   ?? 0, 20),
        $clamp($body['sw_indirect_view'] ?? 0, 20),
        $hwVal,
        $clamp($body['number_drop']      ?? 0, 999),
        $clamp($body['decimal_drop']     ?? 0, 999),
        $pwtype,
        $clamp($body['book_a_page']      ?? 0, 100),
        $clamp($body['book_b_page']      ?? 0, 100),
        $clamp($body['hw_book_a_page']   ?? 0, 100),
        $clamp($body['hw_book_b_page']   ?? 0, 100),
        trim($body['activity'] ?? ''),
    ]);

    $newId = (int)$pdo->lastInsertId();

    // Audit log
    $actorName = ($role === 'admin') ? 'Admin' : ($claims['center_id'] ?? '');
    _portal_audit_write($pdo, 'report_created',
        ($role === 'admin') ? 'admin' : ($claims['center_id'] ?? ''),
        $role, $enrollment_no,
        "Report for $enrollment_no on $report_date ($attendance)",
        $actorName);

    echo json_encode(['success' => true, 'id' => $newId]);
    exit;
}

// ── PUT: edit an existing report ─────────────────────────────────────────────
if ($method === 'PUT') {
    if ($role !== 'franchise' && $role !== 'admin') {
        http_response_code(403);
        echo json_encode(['error' => 'Access denied']);
        exit;
    }
    $body = json_decode(file_get_contents('php://input'), true) ?? [];
    $id   = (int)($body['id'] ?? 0);
    if (!$id) {
        http_response_code(400);
        echo json_encode(['error' => 'Report id is required']);
        exit;
    }

    // Load existing report and check ownership
    if ($role === 'franchise') {
        $center_id = $claims['center_id'];
        $chk = $pdo->prepare("SELECT id, enrollment_no, report_date FROM student_reports WHERE id = ? AND center_id = ?");
        $chk->execute([$id, $center_id]);
    } else {
        $chk = $pdo->prepare("SELECT id, enrollment_no, report_date FROM student_reports WHERE id = ?");
        $chk->execute([$id]);
    }
    $existingRpt = $chk->fetch();
    if (!$existingRpt) {
        http_response_code(404);
        echo json_encode(['error' => 'Report not found']);
        exit;
    }

    $attendance = ($body['attendance'] ?? 'present') === 'absent' ? 'absent' : 'present';
    $pwtype     = ($body['pagework_type'] ?? 'class') === 'homework' ? 'homework' : 'class';
    $clamp      = fn($v, $max) => max(0, min($max, round((float)$v, 2)));

    $sets   = [];
    $params = [];

    if (isset($body['report_date'])) {
        try { $new_date = (new DateTime($body['report_date']))->format('Y-m-d'); }
        catch (Exception $e) { http_response_code(400); echo json_encode(['error' => 'Invalid report date']); exit; }
        if ($new_date > date('Y-m-d')) {
            http_response_code(400);
            echo json_encode(['error' => 'Report date cannot be in the future']);
            exit;
        }
        $dup = $pdo->prepare("SELECT id FROM student_reports WHERE enrollment_no = ? AND report_date = ? AND id != ?");
        $dup->execute([$existingRpt['enrollment_no'], $new_date, $id]);
        if ($dup->fetch()) {
            http_response_code(409);
            echo json_encode(['error' => "A report already exists for $new_date"]);
            exit;
        }
        $sets[] = 'report_date = ?'; $params[] = $new_date;
    }
    $sets[]   = 'attendance = ?';         $params[] = $attendance;
    $sets[]   = 'sw_direct_view = ?';           $params[] = $clamp($body['sw_direct_view']        ?? 0, 20);
    $sets[]   = 'sw_indirect_view = ?';         $params[] = $clamp($body['sw_indirect_view']      ?? 0, 20);
    $hwVal2   = $clamp($body['sw_hand_writing'] ?? $body['sw_right_hand_writing'] ?? 0, 20);
    $sets[]   = 'sw_right_hand_writing = ?';    $params[] = $hwVal2;
    $sets[]   = 'sw_left_hand_writing = ?';     $params[] = 0;
    $sets[]   = 'number_drop = ?';        $params[] = $clamp($body['number_drop']      ?? 0, 999);
    $sets[]   = 'decimal_drop = ?';       $params[] = $clamp($body['decimal_drop']     ?? 0, 999);
    $sets[]   = 'pagework_type = ?';      $params[] = $pwtype;
    $sets[]   = 'book_a_page = ?';        $params[] = $clamp($body['book_a_page']      ?? 0, 100);
    $sets[]   = 'book_b_page = ?';        $params[] = $clamp($body['book_b_page']      ?? 0, 100);
    $sets[]   = 'hw_book_a_page = ?';     $params[] = $clamp($body['hw_book_a_page']   ?? 0, 100);
    $sets[]   = 'hw_book_b_page = ?';     $params[] = $clamp($body['hw_book_b_page']   ?? 0, 100);
    $sets[]   = 'activity = ?';           $params[] = trim($body['activity'] ?? '');
    $sets[]   = 'updated_at = NOW()';
    $params[] = $id;

    $pdo->prepare("UPDATE student_reports SET " . implode(', ', $sets) . " WHERE id = ?")->execute($params);

    $row = $pdo->prepare("SELECT $REPORT_COLS FROM student_reports r WHERE r.id = ?");
    $row->execute([$id]);
    $updatedReport = $row->fetch();

    // Audit log for update
    $actorNamePut = ($role === 'admin') ? 'Admin' : ($claims['center_id'] ?? '');
    _portal_audit_write($pdo, 'report_updated',
        ($role === 'admin') ? 'admin' : ($claims['center_id'] ?? ''),
        $role, $updatedReport['enrollment_no'] ?? '',
        "Report #$id updated",
        $actorNamePut);

    echo json_encode(['success' => true, 'report' => $updatedReport]);
    exit;
}

// ── DELETE: remove a report ──────────────────────────────────────────────────
if ($method === 'DELETE') {
    if ($role !== 'franchise' && $role !== 'admin') {
        http_response_code(403);
        echo json_encode(['error' => 'Access denied']);
        exit;
    }
    $body = json_decode(file_get_contents('php://input'), true) ?? [];
    $id   = (int)($body['id'] ?? 0);
    if (!$id) {
        http_response_code(400);
        echo json_encode(['error' => 'Report id is required']);
        exit;
    }

    // Load existing report and check ownership
    if ($role === 'franchise') {
        $center_id = $claims['center_id'];
        $chk = $pdo->prepare("SELECT id, enrollment_no FROM student_reports WHERE id = ? AND center_id = ?");
        $chk->execute([$id, $center_id]);
    } else {
        $chk = $pdo->prepare("SELECT id, enrollment_no FROM student_reports WHERE id = ?");
        $chk->execute([$id]);
    }
    $existing = $chk->fetch();
    if (!$existing) {
        http_response_code(404);
        echo json_encode(['error' => 'Report not found']);
        exit;
    }

    $pdo->prepare("DELETE FROM student_reports WHERE id = ?")->execute([$id]);

    // Audit log
    $actorNameDel = ($role === 'admin') ? 'Admin' : ($claims['center_id'] ?? '');
    _portal_audit_write($pdo, 'report_deleted',
        ($role === 'admin') ? 'admin' : ($claims['center_id'] ?? ''),
        $role, $existing['enrollment_no'] ?? '',
        "Report #$id deleted",
        $actorNameDel);

    echo json_encode(['success' => true]);
    exit;
}

http_response_code(405);
echo json_encode(['error' => 'Method not allowed']);
