<?php
// Admin oversight of students, reports, and videos (protected by admin password)
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-Admin-Password');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit(0); }

require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/portal_middleware.php';

$admin_pw = $_SERVER['HTTP_X_ADMIN_PASSWORD'] ?? '';
if ($admin_pw !== ADMIN_PASSWORD) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

$pdo      = portal_db();
$type     = $_GET['type'] ?? 'students';
$paginate = isset($_GET['page']);
$page     = max(1, (int)($_GET['page'] ?? 1));
$per_page = min(200, max(10, (int)($_GET['per_page'] ?? 50)));
$offset   = ($page - 1) * $per_page;

// ── Reports ──────────────────────────────────────────────────────────────────
if ($type === 'reports') {
    $enrollment = trim($_GET['enrollment_no'] ?? '');
    $center_f   = trim($_GET['center_id'] ?? '');

    $rpt_cols = "r.id, r.enrollment_no, r.center_id, r.report_date, r.attendance,
                 r.sw_direct_view, r.sw_indirect_view, r.sw_right_hand_writing, r.sw_left_hand_writing,
                 r.number_drop, r.decimal_drop, r.pagework_type, r.book_a_page, r.book_b_page,
                 r.hw_book_a_page, r.hw_book_b_page,
                 r.activity, r.created_at, r.updated_at, s.name AS student_name";

    if ($enrollment) {
        if ($paginate) {
            $cnt  = $pdo->prepare("SELECT COUNT(*) FROM student_reports WHERE enrollment_no = ?");
            $cnt->execute([$enrollment]);
            $total = (int)$cnt->fetchColumn();
        }
        $stmt = $pdo->prepare(
            "SELECT id, enrollment_no, center_id, report_date, attendance,
                    sw_direct_view, sw_indirect_view, sw_right_hand_writing, sw_left_hand_writing,
                    number_drop, decimal_drop, pagework_type, book_a_page, book_b_page,
                    hw_book_a_page, hw_book_b_page,
                    activity, created_at, updated_at
             FROM student_reports WHERE enrollment_no = ?
             ORDER BY report_date DESC, id DESC" .
            ($paginate ? " LIMIT $per_page OFFSET $offset" : "")
        );
        $stmt->execute([$enrollment]);
    } elseif ($center_f) {
        if ($paginate) {
            $cnt  = $pdo->prepare("SELECT COUNT(*) FROM student_reports WHERE center_id = ?");
            $cnt->execute([$center_f]);
            $total = (int)$cnt->fetchColumn();
        }
        $stmt = $pdo->prepare(
            "SELECT $rpt_cols
             FROM student_reports r LEFT JOIN students s ON s.enrollment_no = r.enrollment_no
             WHERE r.center_id = ?
             ORDER BY r.report_date DESC, r.id DESC" .
            ($paginate ? " LIMIT $per_page OFFSET $offset" : " LIMIT 500")
        );
        $stmt->execute([$center_f]);
    } else {
        if ($paginate) {
            $total = (int)$pdo->query("SELECT COUNT(*) FROM student_reports")->fetchColumn();
        }
        $stmt = $pdo->query(
            "SELECT $rpt_cols
             FROM student_reports r LEFT JOIN students s ON s.enrollment_no = r.enrollment_no
             ORDER BY r.report_date DESC, r.id DESC" .
            ($paginate ? " LIMIT $per_page OFFSET $offset" : " LIMIT 500")
        );
    }

    $rows = $stmt->fetchAll();
    if ($paginate) {
        echo json_encode(['data' => $rows, 'total' => $total, 'page' => $page, 'per_page' => $per_page]);
    } else {
        echo json_encode($rows);
    }
    exit;
}

// ── All active learning videos (with student counts) ─────────────────────────
if ($type === 'videos') {
    try {
        $vd  = __DIR__ . '/../uploads/videos/';
        $old = $pdo->query("SELECT id, filename FROM learning_videos WHERE expires_at < NOW()")->fetchAll();
        if ($old) {
            $ids = array_column($old, 'id');
            foreach ($old as $o) @unlink($vd . $o['filename']);
            $in = implode(',', array_fill(0, count($ids), '?'));
            $pdo->prepare("DELETE FROM learning_video_students WHERE video_id IN ($in)")->execute($ids);
            $pdo->prepare("DELETE FROM learning_videos WHERE id IN ($in)")->execute($ids);
        }
    } catch (Exception $e) {}

    $stmt = $pdo->query(
        "SELECT v.id, v.center_id, v.title, v.filename, v.uploaded_at, v.expires_at,
                (SELECT COUNT(*) FROM learning_video_students m WHERE m.video_id = v.id) AS students_count
         FROM learning_videos v WHERE v.expires_at > NOW()
         ORDER BY v.uploaded_at DESC"
    );
    $rows = $stmt->fetchAll();
    foreach ($rows as &$r) $r['url'] = '/uploads/videos/' . $r['filename'];
    echo json_encode($rows);
    exit;
}

// ── Notification history ──────────────────────────────────────────────────────
if ($type === 'notifications') {
    $stmt = $pdo->query(
        "SELECT id, scope, target_center_id, target_enrollment_no, title, message,
                sender_role, sender_id, created_at
         FROM portal_notifications ORDER BY created_at DESC LIMIT 200"
    );
    echo json_encode($stmt->fetchAll());
    exit;
}

// ── Inactive students: active students with no recent report ─────────────────
if ($type === 'inactive') {
    $days = max(1, (int)($_GET['days'] ?? 14));
    $stmt = $pdo->prepare(
        "SELECT s.enrollment_no, s.name, s.center_id,
                COALESCE(pu.name, '') AS center_name, COALESCE(s.level, '') AS level,
                (SELECT MAX(r.report_date) FROM student_reports r
                  WHERE r.enrollment_no = s.enrollment_no) AS last_report_date
         FROM students s
         LEFT JOIN portal_users pu ON pu.login_id = s.center_id AND pu.role = 'franchise'
         WHERE COALESCE(NULLIF(s.status, ''), 'active') = 'active'
         HAVING last_report_date IS NULL OR last_report_date <= DATE_SUB(CURDATE(), INTERVAL ? DAY)
         ORDER BY (last_report_date IS NULL) DESC, last_report_date ASC"
    );
    $stmt->execute([$days]);
    $rows = $stmt->fetchAll();
    $today = new DateTime('today');
    foreach ($rows as &$r) {
        $r['days_since'] = $r['last_report_date']
            ? (int)$today->diff(new DateTime($r['last_report_date']))->format('%a')
            : null;
    }
    echo json_encode($rows);
    exit;
}

// ── Trends: last 6 months report counts per center ───────────────────────────
if ($type === 'trends') {
    $months = [];
    for ($i = 5; $i >= 0; $i--) {
        $months[] = date('Y-m', strtotime("first day of -$i month"));
    }

    $centers_stmt = $pdo->query(
        "SELECT login_id AS center_id, COALESCE(NULLIF(name, ''), login_id) AS name
         FROM portal_users WHERE role = 'franchise' ORDER BY name ASC"
    );
    $centers = $centers_stmt->fetchAll();

    $cnt_stmt = $pdo->prepare(
        "SELECT DATE_FORMAT(report_date, '%Y-%m') AS ym, COUNT(*) AS c
         FROM student_reports
         WHERE center_id = ? AND report_date >= ?
         GROUP BY ym"
    );
    $earliest = $months[0] . '-01';
    foreach ($centers as &$c) {
        $cnt_stmt->execute([$c['center_id'], $earliest]);
        $byMonth = [];
        foreach ($cnt_stmt->fetchAll() as $row) $byMonth[$row['ym']] = (int)$row['c'];
        $c['counts'] = array_map(fn($m) => $byMonth[$m] ?? 0, $months);
    }

    echo json_encode(['months' => $months, 'centers' => $centers]);
    exit;
}

// ── Overview: per-center stats for the admin dashboard ───────────────────────
if ($type === 'overview') {
    $month_prefix = date('Y-m');

    $totals = [
        'centers'            => (int)$pdo->query("SELECT COUNT(*) FROM portal_users WHERE role = 'franchise'")->fetchColumn(),
        'students'           => (int)$pdo->query("SELECT COUNT(*) FROM students")->fetchColumn(),
        'active_students'    => (int)$pdo->query("SELECT COUNT(*) FROM students WHERE COALESCE(NULLIF(status, ''), 'active') = 'active'")->fetchColumn(),
        'reports'            => (int)$pdo->query("SELECT COUNT(*) FROM student_reports")->fetchColumn(),
        'reports_this_month' => 0,
    ];
    $stmt = $pdo->prepare("SELECT COUNT(*) FROM student_reports WHERE DATE_FORMAT(report_date, '%Y-%m') = ?");
    $stmt->execute([$month_prefix]);
    $totals['reports_this_month'] = (int)$stmt->fetchColumn();

    $stmt = $pdo->prepare(
        "SELECT pu.login_id AS center_id,
                COALESCE(NULLIF(pu.name, ''), pu.login_id) AS name,
                (SELECT COUNT(*) FROM students s WHERE s.center_id = pu.login_id) AS students,
                (SELECT COUNT(*) FROM students s WHERE s.center_id = pu.login_id
                    AND COALESCE(NULLIF(s.status, ''), 'active') = 'active') AS active_students,
                (SELECT COUNT(*) FROM student_reports r WHERE r.center_id = pu.login_id) AS reports,
                (SELECT COUNT(*) FROM student_reports r WHERE r.center_id = pu.login_id
                    AND DATE_FORMAT(r.report_date, '%Y-%m') = ?) AS reports_this_month,
                (SELECT MAX(r.report_date) FROM student_reports r WHERE r.center_id = pu.login_id) AS last_report_date
         FROM portal_users pu WHERE pu.role = 'franchise'
         ORDER BY students DESC, name ASC"
    );
    $stmt->execute([$month_prefix]);
    $centers = $stmt->fetchAll();
    foreach ($centers as &$c) {
        $c['students']           = (int)$c['students'];
        $c['active_students']    = (int)$c['active_students'];
        $c['reports']            = (int)$c['reports'];
        $c['reports_this_month'] = (int)$c['reports_this_month'];
    }

    echo json_encode(['totals' => $totals, 'centers' => $centers]);
    exit;
}

// ── Default: all students across all centers ──────────────────────────────────
$center_id = trim($_GET['center_id'] ?? '');
$cols = "s.id, s.enrollment_no, s.name, s.center_id, s.level, s.status, s.join_date, s.dob,
         s.father_name, s.mother_contact, s.mobile, s.anniversary, s.photo, s.address,
         s.blood_group, s.gender, s.parent_name, s.parent_contact, s.email, s.notes, s.created_at,
         pu.name AS center_name, su.plain_password AS password";
$limit_clause = $paginate ? " LIMIT $per_page OFFSET $offset" : "";
if ($center_id) {
    if ($paginate) {
        $cnt = $pdo->prepare("SELECT COUNT(*) FROM students WHERE center_id = ?");
        $cnt->execute([$center_id]);
        $total = (int)$cnt->fetchColumn();
    }
    $stmt = $pdo->prepare(
        "SELECT $cols FROM students s
         LEFT JOIN portal_users pu ON pu.login_id = s.center_id AND pu.role = 'franchise'
         LEFT JOIN portal_users su ON su.login_id = s.enrollment_no AND su.role = 'student'
         WHERE s.center_id = ? ORDER BY s.created_at DESC$limit_clause"
    );
    $stmt->execute([$center_id]);
} else {
    if ($paginate) {
        $total = (int)$pdo->query("SELECT COUNT(*) FROM students")->fetchColumn();
    }
    $stmt = $pdo->query(
        "SELECT $cols FROM students s
         LEFT JOIN portal_users pu ON pu.login_id = s.center_id AND pu.role = 'franchise'
         LEFT JOIN portal_users su ON su.login_id = s.enrollment_no AND su.role = 'student'
         ORDER BY s.created_at DESC$limit_clause"
    );
}
$rows = $stmt->fetchAll();
if ($paginate) {
    echo json_encode(['data' => $rows, 'total' => $total, 'page' => $page, 'per_page' => $per_page]);
} else {
    echo json_encode($rows);
}
