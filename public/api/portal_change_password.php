<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit(0); }
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405); echo json_encode(['error' => 'Method not allowed']); exit;
}

require_once __DIR__ . '/portal_middleware.php';
require_once __DIR__ . '/portal_audit_helper.php';

$claims   = portal_require_auth(); // any role
$login_id = $claims['login_id'];

$body        = json_decode(file_get_contents('php://input'), true) ?? [];
$current_pw  = $body['current_password'] ?? '';
$new_pw      = $body['new_password'] ?? '';
$confirm_pw  = $body['confirm_password'] ?? '';

if (!$current_pw || !$new_pw || !$confirm_pw) {
    http_response_code(400);
    echo json_encode(['error' => 'All fields are required']);
    exit;
}
if ($new_pw !== $confirm_pw) {
    http_response_code(400);
    echo json_encode(['error' => 'New passwords do not match']);
    exit;
}
if (strlen($new_pw) < 6) {
    http_response_code(400);
    echo json_encode(['error' => 'New password must be at least 6 characters']);
    exit;
}

try {
    $pdo  = portal_db();
    $stmt = $pdo->prepare("SELECT password_hash FROM portal_users WHERE login_id = ? LIMIT 1");
    $stmt->execute([$login_id]);
    $user = $stmt->fetch();

    if (!$user || !password_verify($current_pw, $user['password_hash'])) {
        http_response_code(401);
        echo json_encode(['error' => 'Current password is incorrect']);
        exit;
    }

    $new_hash = password_hash($new_pw, PASSWORD_DEFAULT);
    $upd      = $pdo->prepare("UPDATE portal_users SET password_hash = ?, plain_password = ? WHERE login_id = ?");
    $upd->execute([$new_hash, $new_pw, $login_id]);

    _portal_audit_write($pdo, 'password_changed',
        $login_id, $claims['role'] ?? '',
        $login_id, 'Self-service password change',
        $login_id);

    echo json_encode(['success' => true, 'message' => 'Password updated successfully']);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Server error: ' . $e->getMessage()]);
}
