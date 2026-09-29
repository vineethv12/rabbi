<?php
// Admin endpoint to manage franchise portal accounts (protected by admin password)
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-Admin-Password');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit(0); }

require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/portal_middleware.php';
require_once __DIR__ . '/portal_audit_helper.php';

// Verify admin password
$admin_pw = $_SERVER['HTTP_X_ADMIN_PASSWORD'] ?? '';
if ($admin_pw !== ADMIN_PASSWORD) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}

$pdo    = portal_db();
$method = $_SERVER['REQUEST_METHOD'];

// Ensure photo/whatsapp columns exist (upgrade older databases automatically)
try { $pdo->exec("ALTER TABLE portal_users ADD COLUMN `photo` VARCHAR(255) NOT NULL DEFAULT '' AFTER `email`"); } catch (Throwable $e) {}
try { $pdo->exec("ALTER TABLE portal_users ADD COLUMN `whatsapp` VARCHAR(32) NOT NULL DEFAULT '' AFTER `email`"); } catch (Throwable $e) {}

// ── GET: list all franchise accounts ─────────────────────────────────────────
if ($method === 'GET') {
    $stmt = $pdo->query(
        "SELECT id, login_id, name, center_id, email, whatsapp, photo, created_at, plain_password AS password
         FROM portal_users WHERE role = 'franchise' ORDER BY created_at DESC"
    );
    echo json_encode($stmt->fetchAll());
    exit;
}

// ── POST: create a franchise account ─────────────────────────────────────────
if ($method === 'POST') {
    // Accept both multipart/form-data (photo upload) and raw JSON
    if (!empty($_POST)) {
        $body = $_POST;
    } else {
        $body = json_decode(file_get_contents('php://input'), true) ?? [];
    }
    $name      = trim($body['name'] ?? '');
    $password  = $body['password'] ?? '';
    $email     = trim($body['email'] ?? '');
    $whatsapp  = trim($body['whatsapp'] ?? '');

    if (!$name || !$password) {
        http_response_code(400);
        echo json_encode(['error' => 'name and password are required']);
        exit;
    }
    if (strlen($password) < 6) {
        http_response_code(400);
        echo json_encode(['error' => 'Password must be at least 6 characters']);
        exit;
    }

    // Optional profile photo
    $photo = '';
    if (isset($_FILES['photo']) && $_FILES['photo']['error'] === UPLOAD_ERR_OK) {
        $ext = strtolower(pathinfo($_FILES['photo']['name'], PATHINFO_EXTENSION));
        if (!in_array($ext, ['jpg', 'jpeg', 'png', 'webp', 'gif'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Invalid photo type (jpg, png, webp, gif only)']);
            exit;
        }
        $dir = __DIR__ . '/../uploads/centers/';
        if (!is_dir($dir)) @mkdir($dir, 0755, true);
        $fname = 'center_' . time() . '_' . bin2hex(random_bytes(4)) . '.' . $ext;
        if (!move_uploaded_file($_FILES['photo']['tmp_name'], $dir . $fname)) {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to save photo']);
            exit;
        }
        $photo = '/uploads/centers/' . $fname;
    }

    $hash = password_hash($password, PASSWORD_DEFAULT);
    $stmt = $pdo->prepare(
        "INSERT INTO portal_users (login_id, name, password_hash, plain_password, role, center_id, email, whatsapp, photo)
         VALUES (?, ?, ?, ?, 'franchise', ?, ?, ?, ?)"
    );

    // Auto-generate the center login ID from the name (e.g. "Mumbai Andheri" -> "RGA-MUMBAI"),
    // retrying on the rare collision from a concurrent create.
    for ($attempt = 0; ; $attempt++) {
        $center_id = portal_generate_center_id($pdo, $name);
        try {
            $stmt->execute([$center_id, $name, $hash, $password, $center_id, $email ?: '', $whatsapp, $photo]);
            echo json_encode(['success' => true, 'id' => $pdo->lastInsertId(), 'login_id' => $center_id, 'center_id' => $center_id]);
            exit;
        } catch (PDOException $e) {
            if (str_contains($e->getMessage(), 'Duplicate') && $attempt < 5) continue;
            http_response_code(409);
            echo json_encode(['error' => str_contains($e->getMessage(), 'Duplicate')
                ? 'A franchise with this Center ID already exists' : $e->getMessage()]);
            exit;
        }
    }
}

// ── PUT: reset password for any portal user (franchise or student) ───────────
if ($method === 'PUT') {
    $body     = json_decode(file_get_contents('php://input'), true) ?? [];
    $login_id = trim($body['login_id'] ?? '');
    $password = $body['password'] ?? '';

    if (!$login_id || !$password) {
        http_response_code(400);
        echo json_encode(['error' => 'login_id and password are required']);
        exit;
    }
    if (strlen($password) < 6) {
        http_response_code(400);
        echo json_encode(['error' => 'Password must be at least 6 characters']);
        exit;
    }

    $stmt = $pdo->prepare("UPDATE portal_users SET password_hash = ?, plain_password = ? WHERE login_id = ?");
    $stmt->execute([password_hash($password, PASSWORD_DEFAULT), $password, $login_id]);

    if ($stmt->rowCount() === 0) {
        // rowCount can be 0 if the hash is unchanged; verify the user exists
        $chk = $pdo->prepare("SELECT id FROM portal_users WHERE login_id = ?");
        $chk->execute([$login_id]);
        if (!$chk->fetch()) {
            http_response_code(404);
            echo json_encode(['error' => 'Account not found']);
            exit;
        }
    }

    echo json_encode(['success' => true, 'message' => 'Password reset successfully']);
    exit;
}

// ── PATCH: update center details (name / email / whatsapp) ───────────────────
if ($method === 'PATCH') {
    $body     = json_decode(file_get_contents('php://input'), true) ?? [];
    $login_id = trim($body['login_id'] ?? '');
    if (!$login_id) {
        http_response_code(400);
        echo json_encode(['error' => 'login_id is required']);
        exit;
    }

    $chk = $pdo->prepare("SELECT name FROM portal_users WHERE login_id = ? AND role = 'franchise'");
    $chk->execute([$login_id]);
    $existing_name = $chk->fetchColumn();
    if ($existing_name === false) {
        http_response_code(404);
        echo json_encode(['error' => 'Franchise not found']);
        exit;
    }

    $sets = []; $params = []; $new_name = $existing_name;
    foreach (['name', 'email', 'whatsapp'] as $f) {
        if (array_key_exists($f, $body)) {
            $v = trim((string)$body[$f]);
            $sets[] = "$f = ?";
            $params[] = $v;
            if ($f === 'name') $new_name = $v;
        }
    }
    if ($sets) {
        $params[] = $login_id;
        $pdo->prepare("UPDATE portal_users SET " . implode(', ', $sets) . " WHERE login_id = ? AND role = 'franchise'")
            ->execute($params);
    }

    _portal_audit_write($pdo, 'center_updated', 'admin', 'admin',
        "$new_name ($login_id)", 'Details updated by admin', 'Admin');

    echo json_encode(['success' => true]);
    exit;
}

// ── DELETE: remove a franchise account ───────────────────────────────────────
if ($method === 'DELETE') {
    $body      = json_decode(file_get_contents('php://input'), true) ?? [];
    $center_id = trim($body['center_id'] ?? '');
    if (!$center_id) {
        http_response_code(400); echo json_encode(['error' => 'center_id is required']); exit;
    }

    // Look up center name (for the audit log) before deleting.
    // 404 if this login_id is not an actual franchise account.
    $nameStmt = $pdo->prepare("SELECT name FROM portal_users WHERE login_id = ? AND role = 'franchise'");
    $nameStmt->execute([$center_id]);
    $centerName = $nameStmt->fetchColumn();
    if ($centerName === false) {
        http_response_code(404); echo json_encode(['error' => 'Franchise not found']); exit;
    }

    try {
        $pdo->beginTransaction();
        // Remove every report belonging to this center's students
        $pdo->prepare("DELETE FROM student_reports WHERE center_id = ?")->execute([$center_id]);
        // Remove the student login accounts in this center
        $pdo->prepare("DELETE FROM portal_users WHERE center_id = ? AND role = 'student'")->execute([$center_id]);
        // Remove the student records
        $pdo->prepare("DELETE FROM students WHERE center_id = ?")->execute([$center_id]);
        // Finally remove the franchise account itself
        $pdo->prepare("DELETE FROM portal_users WHERE login_id = ? AND role = 'franchise'")->execute([$center_id]);
        $pdo->commit();
    } catch (Exception $e) {
        $pdo->rollBack();
        http_response_code(500);
        echo json_encode(['error' => 'Delete failed: ' . $e->getMessage()]);
        exit;
    }

    // Audit log
    _portal_audit_write($pdo, 'center_deleted', 'admin', 'admin', $center_id,
        "Center $centerName ($center_id) and all of its students were removed", 'Admin');

    echo json_encode(['success' => true]);
    exit;
}

http_response_code(405);
echo json_encode(['error' => 'Method not allowed']);
