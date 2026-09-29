<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Admin-Password');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit(0); }

require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/portal_middleware.php';

$pdo    = portal_db();
$method = $_SERVER['REQUEST_METHOD'];

// ── GET: list notifications for the logged-in user (franchise or student) ─────
if ($method === 'GET') {
    $claims = portal_require_auth();
    $role   = $claims['role'] ?? '';

    if ($role === 'franchise') {
        $stmt = $pdo->prepare(
            "SELECT n.id, n.title, n.message, n.sender_role, n.created_at,
                    (r.id IS NOT NULL) AS is_read
             FROM portal_notifications n
             LEFT JOIN notification_reads r ON r.notification_id = n.id AND r.login_id = ?
             WHERE n.scope = 'all_centers'
             ORDER BY n.created_at DESC LIMIT 200"
        );
        $stmt->execute([$claims['login_id']]);
    } else { // student
        $stmt = $pdo->prepare(
            "SELECT n.id, n.title, n.message, n.sender_role, n.created_at,
                    (r.id IS NOT NULL) AS is_read
             FROM portal_notifications n
             LEFT JOIN notification_reads r ON r.notification_id = n.id AND r.login_id = ?
             WHERE n.scope = 'all_students'
                OR (n.scope = 'center_students' AND n.target_center_id = ?)
                OR (n.scope = 'student' AND n.target_enrollment_no = ?)
             ORDER BY n.created_at DESC LIMIT 200"
        );
        $stmt->execute([$claims['login_id'], $claims['center_id'], $claims['login_id']]);
    }

    $rows = $stmt->fetchAll();
    foreach ($rows as &$r) $r['is_read'] = (bool)$r['is_read'];
    echo json_encode($rows);
    exit;
}

if ($method !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

$body   = json_decode(file_get_contents('php://input'), true) ?? [];
$action = $body['action'] ?? '';

// ── POST mark_read: any logged-in user marks a notification read ─────────────
if ($action === 'mark_read') {
    $claims = portal_require_auth();
    $nid    = (int)($body['id'] ?? 0);
    if (!$nid) { http_response_code(400); echo json_encode(['error' => 'id is required']); exit; }
    $stmt = $pdo->prepare(
        "INSERT IGNORE INTO notification_reads (notification_id, login_id) VALUES (?, ?)"
    );
    $stmt->execute([$nid, $claims['login_id']]);
    echo json_encode(['success' => true]);
    exit;
}

// ── POST send: admin (X-Admin-Password) OR franchise (JWT) ───────────────────
$admin_pw = $_SERVER['HTTP_X_ADMIN_PASSWORD'] ?? '';
$is_admin = ($admin_pw !== '' && $admin_pw === ADMIN_PASSWORD);

$title   = trim($body['title'] ?? '');
$message = trim($body['message'] ?? '');
if (!$message) {
    http_response_code(400);
    echo json_encode(['error' => 'Message is required']);
    exit;
}

if ($is_admin) {
    $scope = $body['scope'] ?? '';
    if (!in_array($scope, ['all_centers', 'all_students', 'center_students'], true)) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid audience']);
        exit;
    }
    $target_center = '';
    if ($scope === 'center_students') {
        $target_center = trim($body['target_center_id'] ?? '');
        if (!$target_center) {
            http_response_code(400);
            echo json_encode(['error' => 'Select a center for this audience']);
            exit;
        }
    }
    $stmt = $pdo->prepare(
        "INSERT INTO portal_notifications
           (scope, target_center_id, target_enrollment_no, title, message, sender_role, sender_id)
         VALUES (?, ?, '', ?, ?, 'admin', 'admin')"
    );
    $stmt->execute([$scope, $target_center, $title, $message]);
    echo json_encode(['success' => true, 'id' => $pdo->lastInsertId()]);
    exit;
}

// Franchise sender
$claims    = portal_require_auth('franchise');
$center_id = $claims['center_id'];
$scope     = $body['scope'] ?? 'center_students';

if ($scope === 'student') {
    $enrollment = trim($body['target_enrollment_no'] ?? '');
    if (!$enrollment) {
        http_response_code(400);
        echo json_encode(['error' => 'Select a student']);
        exit;
    }
    // verify the student belongs to this center
    $chk = $pdo->prepare("SELECT id FROM students WHERE enrollment_no = ? AND center_id = ?");
    $chk->execute([$enrollment, $center_id]);
    if (!$chk->fetch()) {
        http_response_code(404);
        echo json_encode(['error' => 'Student not found in your center']);
        exit;
    }
    $stmt = $pdo->prepare(
        "INSERT INTO portal_notifications
           (scope, target_center_id, target_enrollment_no, title, message, sender_role, sender_id)
         VALUES ('student', ?, ?, ?, ?, 'franchise', ?)"
    );
    $stmt->execute([$center_id, $enrollment, $title, $message, $claims['login_id']]);
} else {
    // all of this center's students
    $stmt = $pdo->prepare(
        "INSERT INTO portal_notifications
           (scope, target_center_id, target_enrollment_no, title, message, sender_role, sender_id)
         VALUES ('center_students', ?, '', ?, ?, 'franchise', ?)"
    );
    $stmt->execute([$center_id, $title, $message, $claims['login_id']]);
}

echo json_encode(['success' => true, 'id' => $pdo->lastInsertId()]);
