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

$body  = json_decode(file_get_contents('php://input'), true);
$email = isset($body['email']) ? trim(strtolower($body['email'])) : '';

// Always return success to prevent email enumeration
$genericOk = ['success' => true, 'message' => 'If that address matches our records, a reset link has been sent.'];

if ($email === '' || strtolower(ADMIN_EMAIL) !== $email) {
    echo json_encode($genericOk);
    exit;
}

// Ensure reset tokens table exists
try {
    $pdo = new PDO(
        'mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=utf8mb4',
        DB_USER, DB_PASS,
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );
    $pdo->exec("CREATE TABLE IF NOT EXISTS password_reset_tokens (
        id         INT AUTO_INCREMENT PRIMARY KEY,
        token      VARCHAR(64) NOT NULL UNIQUE,
        email      VARCHAR(255) NOT NULL,
        expires_at DATETIME NOT NULL,
        used       TINYINT(1) NOT NULL DEFAULT 0,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )");

    // Expire any old unused tokens for this email
    $pdo->prepare("UPDATE password_reset_tokens SET used=1 WHERE email=? AND used=0")
        ->execute([$email]);

    // Generate secure token
    $token     = bin2hex(random_bytes(32));
    $expiresAt = date('Y-m-d H:i:s', time() + 15 * 60);

    $stmt = $pdo->prepare("INSERT INTO password_reset_tokens (token, email, expires_at) VALUES (?, ?, ?)");
    $stmt->execute([$token, $email, $expiresAt]);

} catch (Exception $e) {
    error_log('forgot_password.php: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'A server error occurred. Please try again later.']);
    exit;
}

// Build reset URL
$scheme   = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
$host     = $_SERVER['HTTP_HOST'] ?? 'localhost';
$resetUrl = $scheme . '://' . $host . '/admin?token=' . urlencode($token);

// Send email
$subject = 'Rabbi Global Academy — Admin Password Reset';
$body    = "Hello,\n\nA password reset was requested for the Rabbi Global Academy admin panel.\n\n"
         . "Click the link below to set a new password. This link expires in 15 minutes.\n\n"
         . $resetUrl . "\n\n"
         . "If you did not request this, you can ignore this email.\n\n"
         . "— Rabbi Global Academy";

$headers = "From: noreply@" . $host . "\r\n"
         . "Reply-To: noreply@" . $host . "\r\n"
         . "X-Mailer: PHP/" . phpversion();

$sent = mail($email, $subject, $body, $headers);

if (!$sent) {
    // Still return success to avoid enumeration, but log to error_log
    error_log("forgot_password.php: mail() failed for $email");
}

echo json_encode($genericOk);
