<?php
// Optional private configuration lives one directory above the public web root.
ini_set('display_errors', '0');
ini_set('display_startup_errors', '0');
error_reporting(E_ALL);
$privateFile = dirname(__DIR__) . '/config.local.php';
$private = is_file($privateFile) ? require $privateFile : [];
if (!is_array($private)) $private = [];
foreach (['DB_HOST', 'DB_NAME', 'DB_USER', 'DB_PASS', 'ADMIN_PASSWORD', 'SESSION_SECRET'] as $key) {
    $value = getenv($key);
    if ($value === false || $value === '') $value = $private[$key] ?? '';
    if (!is_string($value) || $value === '') {
        http_response_code(503);
        header('Content-Type: application/json');
        echo json_encode(['error' => 'Backend setup is incomplete. Configure the database, administrator password and session secret.']);
        exit;
    }
    define($key, $value);
}
define('ADMIN_EMAIL', getenv('ADMIN_EMAIL') ?: ($private['ADMIN_EMAIL'] ?? ''));
define('JWT_SECRET', SESSION_SECRET);
define('UPLOAD_DIR', __DIR__ . '/uploads/gallery/');
define('UPLOAD_URL', '/uploads/gallery/');
define('MAX_FILE_SIZE', 40 * 1024 * 1024);
define('ALLOWED_TYPES', ['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
