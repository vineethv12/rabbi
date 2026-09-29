<?php
// Shared JWT helpers for the portal — include this in all portal API files

function _base64url_encode($data) {
    return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
}

function _base64url_decode($data) {
    $pad = strlen($data) % 4;
    if ($pad) $data .= str_repeat('=', 4 - $pad);
    return base64_decode(strtr($data, '-_', '+/'));
}

function _portal_secret(): string {
    // 1. Env var takes highest priority (recommended for production deployments)
    $env = getenv('PORTAL_JWT_SECRET');
    if ($env && strlen($env) >= 16) return $env;

    // 2. Explicit override in config.php (non-default string)
    if (!defined('JWT_SECRET')) @require_once __DIR__ . '/../config.php';
    if (defined('JWT_SECRET') && JWT_SECRET !== '' && JWT_SECRET !== 'CHANGE_ME') {
        return JWT_SECRET;
    }

    // 3. Auto-generated per-installation secret stored outside web root
    //    Unique per XAMPP install — not predictable and persists across requests.
    $secret_file = __DIR__ . '/../../.portal_secret';
    if (is_readable($secret_file)) {
        $s = trim(@file_get_contents($secret_file));
        if (strlen($s) >= 32) return $s;
    }
    $new_secret = bin2hex(random_bytes(32)); // 64-char hex = 256 bits
    @file_put_contents($secret_file, $new_secret, LOCK_EX);
    return $new_secret;
}

function portal_jwt_create(array $payload): string {
    $secret  = _portal_secret();
    $header  = _base64url_encode(json_encode(['alg' => 'HS256', 'typ' => 'JWT']));
    $pay     = _base64url_encode(json_encode($payload));
    $sig     = _base64url_encode(hash_hmac('sha256', "$header.$pay", $secret, true));
    return "$header.$pay.$sig";
}

function portal_jwt_verify(string $token) {
    $secret = _portal_secret();
    $parts  = explode('.', $token);
    if (count($parts) !== 3) return false;
    [$header, $payload, $sig] = $parts;
    $expected = _base64url_encode(hash_hmac('sha256', "$header.$payload", $secret, true));
    if (!hash_equals($expected, $sig)) return false;
    $data = json_decode(_base64url_decode($payload), true);
    if (!$data) return false;
    if (isset($data['exp']) && $data['exp'] < time()) return false;
    return $data;
}

/**
 * Validate JWT from Authorization header.
 * Sends 401/403 and exits if invalid.
 * @param string|null $required_role  'franchise' | 'student' | null (any role)
 * @return array JWT claims
 */
function portal_require_auth(?string $required_role = null): array {
    $auth = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
    if (!$auth && function_exists('apache_request_headers')) {
        $hdrs = apache_request_headers();
        $auth = $hdrs['Authorization'] ?? '';
    }
    if (!preg_match('/^Bearer\s+(.+)$/i', $auth, $m)) {
        http_response_code(401);
        echo json_encode(['error' => 'Authentication required']);
        exit;
    }
    $claims = portal_jwt_verify(trim($m[1]));
    if (!$claims) {
        http_response_code(401);
        echo json_encode(['error' => 'Invalid or expired session — please log in again']);
        exit;
    }
    if ($required_role && ($claims['role'] ?? '') !== $required_role) {
        http_response_code(403);
        echo json_encode(['error' => 'Access denied']);
        exit;
    }
    return $claims;
}

// Uppercase, alphanumeric-only token from a string (e.g. "Mumbai Andheri" -> "MUMBAI" for first word).
function portal_slug(string $s, bool $first_word_only = true): string {
    $s = trim($s);
    if ($first_word_only) {
        $parts = preg_split('/\s+/', $s);
        $s = $parts[0] ?? '';
    }
    $s = strtoupper(preg_replace('/[^A-Za-z0-9]/', '', $s));
    return $s;
}

// Generate a unique center login_id of the form RGA-<FIRSTWORD>, bumping a numeric suffix on collision.
function portal_generate_center_id(PDO $pdo, string $name): string {
    $base = portal_slug($name);
    if ($base === '') $base = 'CENTER';
    $candidate = $base;
    $i = 1;
    $chk = $pdo->prepare("SELECT 1 FROM portal_users WHERE login_id = ?");
    while (true) {
        $chk->execute([$candidate]);
        if (!$chk->fetchColumn()) return $candidate;
        $i++;
        $candidate = "$base$i";
    }
}

// Generate a unique student enrollment_no of the form <FIRSTNAME>-<NN>.
// Matches the Node backend: e.g. ETADA-01 (no center prefix; globally unique).
function portal_generate_enrollment_no(PDO $pdo, string $center_id, string $name): string {
    $parts = preg_split('/\s+/', trim($name));
    $first = strtoupper(preg_replace('/[^A-Za-z0-9]/', '', $parts[0] ?? ''));
    if ($first === '') $first = 'STUDENT';

    $chk = $pdo->prepare("SELECT 1 FROM students WHERE enrollment_no = ?");
    $n = 1;
    while (true) {
        $candidate = $first . '-' . str_pad((string)$n, 2, '0', STR_PAD_LEFT);
        $chk->execute([$candidate]);
        if (!$chk->fetchColumn()) return $candidate;
        $n++;
    }
}

/**
 * Accepts either an admin password header OR a valid JWT.
 * Returns claims array. For admin: ['role'=>'admin','login_id'=>'admin','center_id'=>null].
 * Sends 401/403 and exits if neither is valid.
 */
function portal_auth_or_admin(?string $required_role = null): array {
    $admin_pw = $_SERVER['HTTP_X_ADMIN_PASSWORD'] ?? '';
    if (!defined('ADMIN_PASSWORD')) @require_once __DIR__ . '/../config.php';
    if ($admin_pw !== '' && defined('ADMIN_PASSWORD') && $admin_pw === ADMIN_PASSWORD) {
        return ['role' => 'admin', 'login_id' => 'admin', 'name' => 'Admin', 'center_id' => null, 'exp' => PHP_INT_MAX];
    }
    return portal_require_auth($required_role);
}

function portal_db(): PDO {
    require_once __DIR__ . '/../config.php';
    static $pdo = null;
    if ($pdo) return $pdo;
    $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4";
    $pdo = new PDO($dsn, DB_USER, DB_PASS, [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);
    return $pdo;
}
