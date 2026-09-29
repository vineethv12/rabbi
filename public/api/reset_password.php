<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit(0); }
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

require_once __DIR__ . '/../config.php';

$body        = json_decode(file_get_contents('php://input'), true);
$token       = isset($body['token'])       ? trim($body['token'])       : '';
$newPassword = isset($body['newPassword']) ? trim($body['newPassword']) : '';

if ($token === '' || $newPassword === '') {
    http_response_code(400);
    echo json_encode(['error' => 'Token and new password are required.']);
    exit;
}

if (strlen($newPassword) < 6) {
    http_response_code(400);
    echo json_encode(['error' => 'Password must be at least 6 characters.']);
    exit;
}

try {
    $pdo = new PDO(
        'mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=utf8mb4',
        DB_USER, DB_PASS,
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );

    $stmt = $pdo->prepare(
        "SELECT id, email, expires_at, used FROM password_reset_tokens WHERE token = ? LIMIT 1"
    );
    $stmt->execute([$token]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$row) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid or expired reset link. Please request a new one.']);
        exit;
    }

    if ($row['used']) {
        http_response_code(400);
        echo json_encode(['error' => 'This reset link has already been used. Please request a new one.']);
        exit;
    }

    if (strtotime($row['expires_at']) < time()) {
        http_response_code(400);
        echo json_encode(['error' => 'This reset link has expired (15-minute limit). Please request a new one.']);
        exit;
    }

    // Rewrite ADMIN_PASSWORD in config.php
    $configPath = __DIR__ . '/../config.php';
    $configSrc  = file_get_contents($configPath);

    // Escape the new password for PHP string literal (single-quoted)
    $escaped = str_replace(["\\", "'"], ["\\\\", "\\'"], $newPassword);

    $newSrc = preg_replace(
        "/define\s*\(\s*'ADMIN_PASSWORD'\s*,\s*'[^']*'\s*\)/",
        "define('ADMIN_PASSWORD', '" . $escaped . "')",
        $configSrc
    );

    if ($newSrc === null || $newSrc === $configSrc) {
        http_response_code(500);
        echo json_encode(['error' => 'Could not update the password. Please contact your developer.']);
        exit;
    }

    if (file_put_contents($configPath, $newSrc) === false) {
        http_response_code(500);
        echo json_encode(['error' => 'Could not write config file. Check server file permissions.']);
        exit;
    }

    // Invalidate all tokens for this email
    $pdo->prepare("UPDATE password_reset_tokens SET used=1 WHERE email=?")
        ->execute([$row['email']]);

    echo json_encode(['success' => true, 'message' => 'Password updated successfully.']);

} catch (Exception $e) {
    error_log('reset_password.php: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'A server error occurred. Please try again later.']);
    exit;
}
