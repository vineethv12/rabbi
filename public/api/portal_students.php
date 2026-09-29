<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Admin-Password');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit(0); }

require_once __DIR__ . '/portal_middleware.php';
require_once __DIR__ . '/portal_audit_helper.php';
require_once __DIR__ . '/student_levels_helper.php';

$claims = portal_auth_or_admin();
$role   = $claims['role'] ?? '';
$pdo    = portal_db();
$method = $_SERVER['REQUEST_METHOD'];

// Determine center_id based on role
// For admin: GET can filter by ?center_id=, POST/PUT must include center_id in body
$caller_center_id = ($role === 'franchise') ? $claims['center_id'] : null;

if ($role !== 'franchise' && $role !== 'admin') {
    http_response_code(403);
    echo json_encode(['error' => 'Access denied']);
    exit;
}

student_levels_ensure($pdo);

$STUDENT_COLS = "id, enrollment_no, name, center_id, level, status, join_date, dob,
                 father_name, mother_contact, mobile, anniversary, photo, address,
                 blood_group, gender, parent_name, parent_contact, email, notes, reg_no, created_at";

// Same columns, s.-prefixed, plus the student's plain password (shown to the
// franchise/admin as "View password" — matches the Node backend response).
$STUDENT_COLS_PW = "s.id, s.enrollment_no, s.name, s.center_id, s.level, s.status, s.join_date, s.dob,
                 s.father_name, s.mother_contact, s.mobile, s.anniversary, s.photo, s.address,
                 s.blood_group, s.gender, s.parent_name, s.parent_contact, s.email, s.notes, s.reg_no, s.created_at,
                 COALESCE(su.plain_password, '') AS password";
$STUDENT_PW_JOIN = "LEFT JOIN portal_users su ON su.login_id = s.enrollment_no AND su.role = 'student'";

// Fetch a single student including their plain password (as `password`).
function _student_with_password(PDO $pdo, $key, $by_id = false): ?array {
    global $STUDENT_COLS_PW, $STUDENT_PW_JOIN;
    $where = $by_id ? "s.id = ?" : "s.enrollment_no = ?";
    $st = $pdo->prepare("SELECT $STUDENT_COLS_PW FROM students s $STUDENT_PW_JOIN WHERE $where");
    $st->execute([$key]);
    $row = $st->fetch();
    return $row ?: null;
}

// ── GET: list students ────────────────────────────────────────────────────────
if ($method === 'GET') {
    try {
        $paginate = isset($_GET['page']);
        $page     = max(1, (int)($_GET['page'] ?? 1));
        $per_page = min(200, max(10, (int)($_GET['per_page'] ?? 50)));
        $offset   = ($page - 1) * $per_page;

        if ($role === 'admin') {
            $center_id_f  = trim($_GET['center_id'] ?? '');
            $limit_clause = $paginate ? " LIMIT $per_page OFFSET $offset" : "";
            // Admin rows include the student's password and the center display name
            $ADMIN_SELECT = "SELECT $STUDENT_COLS_PW, COALESCE(cu.name, s.center_id) AS center_name
                             FROM students s $STUDENT_PW_JOIN
                             LEFT JOIN portal_users cu ON cu.login_id = s.center_id AND cu.role = 'franchise'";
            if ($center_id_f) {
                if ($paginate) {
                    $cnt = $pdo->prepare("SELECT COUNT(*) FROM students WHERE center_id = ?");
                    $cnt->execute([$center_id_f]);
                    $total = (int)$cnt->fetchColumn();
                }
                $stmt = $pdo->prepare(
                    "$ADMIN_SELECT WHERE s.center_id = ? ORDER BY s.created_at DESC$limit_clause"
                );
                $stmt->execute([$center_id_f]);
            } else {
                if ($paginate) {
                    $total = (int)$pdo->query("SELECT COUNT(*) FROM students")->fetchColumn();
                }
                $stmt = $pdo->query(
                    "$ADMIN_SELECT ORDER BY s.created_at DESC$limit_clause"
                );
            }
        } else {
            $stmt = $pdo->prepare(
                "SELECT $STUDENT_COLS_PW FROM students s $STUDENT_PW_JOIN
                 WHERE s.center_id = ? ORDER BY s.created_at DESC"
            );
            $stmt->execute([$caller_center_id]);
        }

        $rows = $stmt->fetchAll();
        if ($paginate && $role === 'admin') {
            echo json_encode(['data' => $rows, 'total' => $total, 'page' => $page, 'per_page' => $per_page]);
        } else {
            echo json_encode($rows);
        }
    } catch (Exception $e) {
        http_response_code(500);
        $msg = $e->getMessage();
        if (strpos($msg, 'father_name') !== false || strpos($msg, "Column not found") !== false) {
            echo json_encode(['error' => 'Database schema is outdated. Please run the ALTER TABLE patch from rabbi_global_academy_database.sql in phpMyAdmin to add missing columns to the students table.']);
        } else {
            echo json_encode(['error' => 'Database error: ' . $msg]);
        }
    }
    exit;
}

// ── POST: create OR update a student (JSON or multipart with photo) ───────────
if ($method === 'POST') {
    $ct = $_SERVER['CONTENT_TYPE'] ?? '';
    if (stripos($ct, 'multipart/form-data') !== false) {
        $body = $_POST;
    } else {
        $body = json_decode(file_get_contents('php://input'), true) ?? [];
    }

    // Admin must supply center_id in the body
    $center_id = ($role === 'admin')
        ? trim($body['center_id'] ?? '')
        : $caller_center_id;

    if ($role === 'admin' && !$center_id) {
        http_response_code(400);
        echo json_encode(['error' => 'center_id is required']);
        exit;
    }

    $enrollment_no = trim($body['enrollment_no'] ?? '');
    $is_update     = $enrollment_no !== '';

    $name           = trim($body['name'] ?? '');
    $father_name    = trim($body['father_name'] ?? '');
    $mother_contact = trim($body['mother_contact'] ?? '');
    $dob_str        = trim($body['dob'] ?? '');
    $mobile         = trim($body['mobile'] ?? '');
    $address        = trim($body['address'] ?? '');
    $blood_group    = trim($body['blood_group'] ?? '');
    $gender         = trim($body['gender'] ?? '');
    $level          = trim($body['level'] ?? '');
    $reg_no         = trim($body['reg_no'] ?? '');
    $email          = trim($body['email'] ?? '');
    $anniversary    = trim($body['anniversary'] ?? '');
    $parent_name    = trim($body['parent_name'] ?? '');
    $parent_contact = trim($body['parent_contact'] ?? '');
    $notes          = trim($body['notes'] ?? '');
    $status         = trim($body['status'] ?? '') ?: 'active';
    $join_str       = trim($body['join_date'] ?? '');

    $missing = [];
    if (!$name)           $missing[] = 'Student Name';
    if (!$father_name)    $missing[] = 'Father Name';
    if (!$mother_contact) $missing[] = 'Mother Name';
    if (!$dob_str)        $missing[] = 'Date of Birth';
    if (!$mobile)         $missing[] = 'Mobile';
    if (!$gender)         $missing[] = 'Gender';
    if (!$level)          $missing[] = 'Level';
    if ($missing) {
        http_response_code(400);
        echo json_encode(['error' => 'Required: ' . implode(', ', $missing)]);
        exit;
    }
    $level = student_level_name($pdo, $level);
    if (!$level) {
        http_response_code(400);
        echo json_encode(['error' => 'Choose an available student level.']);
        exit;
    }

    if (!preg_match('/^\d{10}$/', $mobile)) {
        http_response_code(400);
        echo json_encode(['error' => 'Mobile must be a 10-digit number']);
        exit;
    }
    if ($email && !filter_var($email, FILTER_VALIDATE_EMAIL)) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid email address']);
        exit;
    }

    try {
        $dob_obj = new DateTime($dob_str);
        $dob_fmt = $dob_obj->format('Y-m-d');
    } catch (Exception $e) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid date of birth']);
        exit;
    }
    if ($dob_fmt >= date('Y-m-d')) {
        http_response_code(400);
        echo json_encode(['error' => 'Date of birth must be in the past']);
        exit;
    }

    $anniv_fmt = null;
    if ($anniversary) {
        try { $anniv_fmt = (new DateTime($anniversary))->format('Y-m-d'); } catch (Exception $e) { $anniv_fmt = null; }
    }

    // ── UPDATE ────────────────────────────────────────────────────────────────
    if ($is_update) {
        try {
            $photo_name = _portal_save_student_photo();

            $sets = [
                'name = ?', 'father_name = ?', 'mother_contact = ?', 'dob = ?', 'mobile = ?',
                'anniversary = ?', 'address = ?', 'blood_group = ?', 'gender = ?',
                'level = ?', 'status = ?', 'email = ?', 'parent_name = ?', 'parent_contact = ?', 'notes = ?', 'reg_no = ?',
            ];
            $params = [
                $name, $father_name, $mother_contact, $dob_fmt, $mobile,
                $anniv_fmt, $address, $blood_group, $gender,
                $level, $status, $email, $parent_name, $parent_contact, $notes, $reg_no,
            ];
            if ($photo_name) { $sets[] = 'photo = ?'; $params[] = $photo_name; }
            $params[] = $enrollment_no;
            $params[] = $center_id;

            $stmt = $pdo->prepare(
                "UPDATE students SET " . implode(', ', $sets) .
                " WHERE enrollment_no = ? AND center_id = ?"
            );
            $stmt->execute($params);

            if ($stmt->rowCount() === 0) {
                $chk = $pdo->prepare("SELECT id FROM students WHERE enrollment_no = ? AND center_id = ?");
                $chk->execute([$enrollment_no, $center_id]);
                if (!$chk->fetch()) {
                    http_response_code(404);
                    echo json_encode(['error' => 'Student not found']);
                    exit;
                }
            }

            $pn = $pdo->prepare("UPDATE portal_users SET name = ? WHERE login_id = ? AND role = 'student'");
            $pn->execute([$name, $enrollment_no]);

            echo json_encode(['success' => true, 'student' => _student_with_password($pdo, $enrollment_no)]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to update student: ' . $e->getMessage()]);
        }
        exit;
    }

    // ── CREATE ──────────────────────────────────────────────────────────────────
    $custom_pass = trim($body['password'] ?? '');
    if ($custom_pass !== '' && strlen($custom_pass) < 6) {
        http_response_code(400);
        echo json_encode(['error' => 'Password must be at least 6 characters']);
        exit;
    }
    $def_pass    = $custom_pass !== '' ? $custom_pass : '123456';
    $join_date = date('Y-m-d');
    if ($join_str) {
        try { $join_date = (new DateTime($join_str))->format('Y-m-d'); } catch (Exception $e) {}
    }

    try {
        $photo_name = _portal_save_student_photo();

        $pdo->beginTransaction();

        $stmt = $pdo->prepare(
            "INSERT INTO students
               (enrollment_no, name, center_id, level, status, join_date, dob,
                father_name, mother_contact, mobile, anniversary, photo, address,
                blood_group, gender, parent_name, parent_contact, email, notes, reg_no)
             VALUES ('PENDING', ?, ?, ?, 'active', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
        );
        $stmt->execute([
            $name, $center_id, $level, $join_date, $dob_fmt,
            $father_name, $mother_contact, $mobile, $anniv_fmt, $photo_name, $address,
            $blood_group, $gender, $parent_name, $parent_contact, $email, $notes, $reg_no,
        ]);
        $student_id = (int)$pdo->lastInsertId();
        $pass_hash  = password_hash($def_pass, PASSWORD_DEFAULT);

        $upd   = $pdo->prepare("UPDATE students SET enrollment_no = ? WHERE id = ?");
        $stmt2 = $pdo->prepare(
            "INSERT INTO portal_users (login_id, name, password_hash, plain_password, role, center_id, email)
             VALUES (?, ?, ?, ?, 'student', ?, ?)"
        );

        $enrollment_no = null;
        for ($attempt = 0; ; $attempt++) {
            $enrollment_no = portal_generate_enrollment_no($pdo, $center_id, $name);
            try {
                $upd->execute([$enrollment_no, $student_id]);
                $stmt2->execute([$enrollment_no, $name, $pass_hash, $def_pass, $center_id, $email]);
                break;
            } catch (PDOException $e) {
                if (str_contains($e->getMessage(), 'Duplicate') && $attempt < 5) continue;
                throw $e;
            }
        }

        $pdo->commit();

        $s_row = _student_with_password($pdo, $student_id, true);
        // Look up center name for audit
        $cRow = $pdo->prepare("SELECT name FROM portal_users WHERE login_id = ? AND role = 'franchise' LIMIT 1");
        $cRow->execute([$center_id]);
        $centerName = $cRow->fetchColumn() ?: $center_id;
        $actorId   = ($role === 'admin') ? 'admin' : $caller_center_id;
        _portal_audit_write($pdo, 'student_created',
            $actorId, $role, $enrollment_no,
            "Student \"$name\" added to center $center_id",
            ($role === 'admin') ? 'Admin' : $centerName);
        echo json_encode([
            'success'          => true,
            'student'          => $s_row,
            'enrollment_no'    => $enrollment_no,
            'default_password' => $def_pass,
        ]);
    } catch (Exception $e) {
        if ($pdo->inTransaction()) $pdo->rollBack();
        http_response_code(500);
        echo json_encode(['error' => 'Failed to add student: ' . $e->getMessage()]);
    }
    exit;
}

// ── PUT: lightweight field update (JSON, no photo) ───────────────────────────
if ($method === 'PUT') {
    $body          = json_decode(file_get_contents('php://input'), true) ?? [];
    $enrollment_no = trim($body['enrollment_no'] ?? '');

    if (!$enrollment_no) {
        http_response_code(400);
        echo json_encode(['error' => 'enrollment_no is required']);
        exit;
    }

    // Admin must specify center_id or leave blank to update any student
    $center_id = ($role === 'admin')
        ? trim($body['center_id'] ?? '')
        : $caller_center_id;

    $allowed = ['name', 'level', 'status', 'notes', 'father_name', 'mother_contact', 'mobile',
                'address', 'blood_group', 'gender', 'parent_name', 'parent_contact', 'email', 'reg_no'];
    if (array_key_exists('level', $body)) {
        $body['level'] = student_level_name($pdo, (string)$body['level']);
        if (!$body['level']) {
            http_response_code(400);
            echo json_encode(['error' => 'Choose an available student level.']);
            exit;
        }
    }
    $sets    = [];
    $params  = [];
    foreach ($allowed as $field) {
        if (array_key_exists($field, $body)) {
            $sets[]   = "$field = ?";
            $params[] = $body[$field];
        }
    }

    if (!$sets) {
        http_response_code(400);
        echo json_encode(['error' => 'No fields to update']);
        exit;
    }

    // Capture previous level for audit if it is being changed
    $prev_level = null;
    if (array_key_exists('level', $body)) {
        $lv = $pdo->prepare("SELECT name, level FROM students WHERE enrollment_no = ?");
        $lv->execute([$enrollment_no]);
        $prev_row   = $lv->fetch();
        $prev_level = $prev_row['level'] ?? null;
        $stu_name   = $prev_row['name'] ?? $enrollment_no;
    }

    $params[] = $enrollment_no;
    if ($center_id) {
        $params[] = $center_id;
        $stmt = $pdo->prepare(
            "UPDATE students SET " . implode(', ', $sets) .
            " WHERE enrollment_no = ? AND center_id = ?"
        );
    } else {
        $stmt = $pdo->prepare(
            "UPDATE students SET " . implode(', ', $sets) .
            " WHERE enrollment_no = ?"
        );
    }
    $stmt->execute($params);

    if (array_key_exists('level', $body) && $body['level'] !== $prev_level) {
        _portal_audit_write($pdo, 'student_updated',
            ($role === 'admin') ? 'admin' : $caller_center_id,
            $role, ($stu_name ?? $enrollment_no) . " ($enrollment_no)",
            'Level: "' . ($prev_level ?: '—') . '"→"' . $body['level'] . '"',
            ($role === 'admin') ? 'Admin' : $caller_center_id);
    }

    echo json_encode(['success' => true]);
    exit;
}

// ── DELETE: remove a student ──────────────────────────────────────────────────
if ($method === 'DELETE') {
    $body = json_decode(file_get_contents('php://input'), true) ?? [];
    $enrollment_no = trim($body['enrollment_no'] ?? '');

    if (!$enrollment_no) {
        http_response_code(400);
        echo json_encode(['error' => 'enrollment_no is required']);
        exit;
    }

    // Franchise can only delete students in their own center
    if ($role === 'franchise') {
        $chk = $pdo->prepare("SELECT center_id FROM students WHERE enrollment_no = ?");
        $chk->execute([$enrollment_no]);
        $row = $chk->fetch();
        if (!$row || $row['center_id'] !== $caller_center_id) {
            http_response_code(403);
            echo json_encode(['error' => 'Access denied']);
            exit;
        }
    }

    try {
        $pdo->beginTransaction();
        $pdo->prepare("DELETE FROM student_reports WHERE enrollment_no = ?")->execute([$enrollment_no]);
        $pdo->prepare("DELETE FROM portal_users WHERE login_id = ? AND role = 'student'")->execute([$enrollment_no]);
        $pdo->prepare("DELETE FROM students WHERE enrollment_no = ?")->execute([$enrollment_no]);
        $pdo->commit();
        // Write audit log
        $actorId2 = ($role === 'admin') ? 'admin' : $caller_center_id;
        _portal_audit_write($pdo, 'student_deleted',
            $actorId2, $role, $enrollment_no,
            "Student $enrollment_no removed permanently",
            ($role === 'admin') ? 'Admin' : $actorId2);
        echo json_encode(['success' => true]);
    } catch (Exception $e) {
        $pdo->rollBack();
        http_response_code(500);
        echo json_encode(['error' => 'Delete failed: ' . $e->getMessage()]);
    }
    exit;
}

http_response_code(405);
echo json_encode(['error' => 'Method not allowed']);

// ── Helpers ───────────────────────────────────────────────────────────────────
function _portal_save_student_photo(): string {
    if (empty($_FILES['photo']) || ($_FILES['photo']['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) {
        return '';
    }
    $f       = $_FILES['photo'];
    $allowed = ['image/jpeg' => 'jpg', 'image/png' => 'png', 'image/webp' => 'webp', 'image/gif' => 'gif'];
    $info    = @getimagesize($f['tmp_name']);
    $mime    = $info['mime'] ?? '';
    if (!isset($allowed[$mime])) throw new Exception('Photo must be a JPG, PNG, WEBP or GIF image');
    if ($f['size'] > 5 * 1024 * 1024) throw new Exception('Photo must be under 5 MB');

    $dir = __DIR__ . '/../uploads/students/';
    if (!is_dir($dir)) @mkdir($dir, 0775, true);

    $fname = 'stu_' . date('YmdHis') . '_' . bin2hex(random_bytes(4)) . '.' . $allowed[$mime];
    if (!move_uploaded_file($f['tmp_name'], $dir . $fname)) {
        throw new Exception('Could not save the uploaded photo');
    }
    return $fname;
}
