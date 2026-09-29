<?php
/**
 * portal_me.php — Student / Franchise self-profile
 * GET  — returns the logged-in user's profile
 * POST — students only: update mobile/email/address/family + optional photo
 */
header('Content-Type: application/json; charset=UTF-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }

require_once __DIR__ . '/portal_middleware.php';

/* ── GET ──────────────────────────────────────────────────────────────────── */
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $claims = portal_require_auth();
    $role   = $claims['role'] ?? '';

    try {
        $pdo = portal_db();

        if ($role === 'student') {
            $stmt = $pdo->prepare(
                "SELECT enrollment_no, name, center_id, level, status, join_date, dob,
                        father_name, mother_contact, mobile, anniversary, photo, address,
                        blood_group, gender, parent_name, parent_contact, email, notes, created_at
                 FROM students WHERE enrollment_no = ? LIMIT 1"
            );
            $stmt->execute([$claims['login_id']]);
            $student = $stmt->fetch();
            if (!$student) { http_response_code(404); echo json_encode(['error' => 'Student record not found']); exit; }
            echo json_encode($student);
            exit;
        }

        if ($role === 'franchise') {
            $stmt = $pdo->prepare("SELECT login_id, name, email, center_id FROM portal_users WHERE login_id = ? LIMIT 1");
            $stmt->execute([$claims['login_id']]);
            $user = $stmt->fetch();
            if (!$user) { http_response_code(404); echo json_encode(['error' => 'User not found']); exit; }
            echo json_encode($user);
            exit;
        }

        http_response_code(403); echo json_encode(['error' => 'Access denied']); exit;

    } catch (Exception $e) {
        http_response_code(500); echo json_encode(['error' => 'Server error: ' . $e->getMessage()]); exit;
    }
}

/* ── POST (student self-update) ───────────────────────────────────────────── */
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $claims = portal_require_auth('student');
    $enrollment_no = $claims['login_id'];

    try {
        $pdo = portal_db();

        /* Fetch current record */
        $stmt = $pdo->prepare("SELECT * FROM students WHERE enrollment_no = ? LIMIT 1");
        $stmt->execute([$enrollment_no]);
        $current = $stmt->fetch();
        if (!$current) { http_response_code(404); echo json_encode(['error' => 'Student not found']); exit; }

        /* Editable fields */
        $mobile         = trim($_POST['mobile']         ?? '');
        $email          = trim($_POST['email']          ?? '');
        $address        = trim($_POST['address']        ?? '');
        $parent_name    = trim($_POST['parent_name']    ?? '');
        $parent_contact = trim($_POST['parent_contact'] ?? '');
        $father_name    = trim($_POST['father_name']    ?? '');
        $mother_contact = trim($_POST['mother_contact'] ?? '');

        $changes = [];
        $sets    = [];
        $params  = [];

        if ($mobile !== '' && $mobile !== ($current['mobile'] ?? '')) {
            $sets[] = 'mobile = ?'; $params[] = $mobile; $changes[] = "Mobile: $mobile";
        }
        if ($email !== ($current['email'] ?? '')) {
            $sets[] = 'email = ?'; $params[] = $email; if ($email) $changes[] = "Email: $email";
        }
        if ($address !== '' && $address !== ($current['address'] ?? '')) {
            $sets[] = 'address = ?'; $params[] = $address; $changes[] = 'Address updated';
        }
        if ($parent_name !== ($current['parent_name'] ?? '')) {
            $sets[] = 'parent_name = ?'; $params[] = $parent_name;
            if ($parent_name) $changes[] = "Guardian: $parent_name";
        }
        if ($parent_contact !== ($current['parent_contact'] ?? '')) {
            $sets[] = 'parent_contact = ?'; $params[] = $parent_contact;
        }
        if ($father_name !== '' && $father_name !== ($current['father_name'] ?? '')) {
            $sets[] = 'father_name = ?'; $params[] = $father_name; $changes[] = "Father: $father_name";
        }
        if ($mother_contact !== '' && $mother_contact !== ($current['mother_contact'] ?? '')) {
            $sets[] = 'mother_contact = ?'; $params[] = $mother_contact;
        }

        /* Photo upload */
        $photo_filename = null;
        if (isset($_FILES['photo']) && $_FILES['photo']['error'] === UPLOAD_ERR_OK) {
            $file    = $_FILES['photo'];
            $mime    = mime_content_type($file['tmp_name']);
            $allowed = ['image/jpeg','image/png','image/gif','image/webp'];
            if (!in_array($mime, $allowed, true)) { http_response_code(400); echo json_encode(['error' => 'Invalid image format']); exit; }
            if ($file['size'] > 5 * 1024 * 1024) { http_response_code(400); echo json_encode(['error' => 'Photo must be under 5 MB']); exit; }
            $ext            = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION) ?: 'jpg');
            $photo_filename = $enrollment_no . '_self_' . time() . '.' . $ext;
            $upload_dir     = __DIR__ . '/../uploads/students/';
            if (!is_dir($upload_dir)) mkdir($upload_dir, 0755, true);
            if (!move_uploaded_file($file['tmp_name'], $upload_dir . $photo_filename)) {
                http_response_code(500); echo json_encode(['error' => 'Failed to save photo']); exit;
            }
            $sets[]  = 'photo = ?';
            $params[] = $photo_filename;
            $changes[] = 'Profile photo updated';
        }

        if (!empty($sets)) {
            $params[] = $enrollment_no;
            $sql = 'UPDATE students SET ' . implode(', ', $sets) . ' WHERE enrollment_no = ?';
            $pdo->prepare($sql)->execute($params);
        }

        /* Audit log */
        portal_audit_log($pdo, 'student_profile_updated', $enrollment_no, 'student',
            ($current['name'] ?? '') . " ($enrollment_no)",
            $changes ? implode(', ', $changes) : 'No changes');

        /* Return updated record */
        $stmt = $pdo->prepare("SELECT enrollment_no, name, center_id, level, status, join_date, dob,
                                      father_name, mother_contact, mobile, anniversary, photo, address,
                                      blood_group, gender, parent_name, parent_contact, email, notes, created_at
                               FROM students WHERE enrollment_no = ? LIMIT 1");
        $stmt->execute([$enrollment_no]);
        echo json_encode(['success' => true, 'student' => $stmt->fetch()]);

    } catch (Exception $e) {
        http_response_code(500); echo json_encode(['error' => 'Server error: ' . $e->getMessage()]); exit;
    }
    exit;
}

http_response_code(405); echo json_encode(['error' => 'Method not allowed']);
