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

$body     = json_decode(file_get_contents('php://input'), true) ?? [];
$login_id = trim($body['login_id'] ?? '');
$password = $body['password'] ?? '';
$role     = $body['role'] ?? '';

if (!$login_id || !$password || !in_array($role, ['franchise', 'student'], true)) {
    http_response_code(400);
    echo json_encode(['error' => 'login_id, password, and role are required']);
    exit;
}

try {
    $pdo  = portal_db();
    $stmt = $pdo->prepare("SELECT * FROM portal_users WHERE login_id = ? AND role = ? LIMIT 1");
    $stmt->execute([$login_id, $role]);
    $user = $stmt->fetch();

    if (!$user || !password_verify($password, $user['password_hash'])) {
        http_response_code(401);
        echo json_encode(['error' => 'Invalid ' . ($role === 'franchise' ? 'Center ID' : 'Enrollment Number') . ' or password']);
        exit;
    }

    $now   = time();
    $token = portal_jwt_create([
        'sub'       => $user['id'],
        'login_id'  => $user['login_id'],
        'name'      => $user['name'],
        'role'      => $user['role'],
        'center_id' => $user['center_id'],
        'iat'       => $now,
        'exp'       => $now + 86400, // 24 hours
    ]);

    echo json_encode([
        'success'   => true,
        'token'     => $token,
        'role'      => $user['role'],
        'login_id'  => $user['login_id'],
        'name'      => $user['name'],
        'center_id' => $user['center_id'],
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Server error: ' . $e->getMessage()]);
}
