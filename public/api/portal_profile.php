<?php
/**
 * Franchise self profile — view / update own center photo.
 * GET  → { login_id, name, email, photo }
 * POST (multipart) → photo file OR remove_photo=1
 */
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit(0); }

require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/portal_middleware.php';
require_once __DIR__ . '/portal_audit_helper.php';

$claims = portal_require_auth('franchise');
$pdo    = portal_db();
$method = $_SERVER['REQUEST_METHOD'];

// Ensure photo/whatsapp columns exist (upgrade older databases automatically)
try { $pdo->exec("ALTER TABLE portal_users ADD COLUMN `photo` VARCHAR(255) NOT NULL DEFAULT '' AFTER `email`"); } catch (Throwable $e) {}
try { $pdo->exec("ALTER TABLE portal_users ADD COLUMN `whatsapp` VARCHAR(32) NOT NULL DEFAULT '' AFTER `email`"); } catch (Throwable $e) {}

if ($method === 'GET') {
    $stmt = $pdo->prepare("SELECT login_id, name, email, whatsapp, photo FROM portal_users WHERE login_id = ?");
    $stmt->execute([$claims['login_id']]);
    $u = $stmt->fetch();
    if (!$u) { http_response_code(404); echo json_encode(['error' => 'User not found']); exit; }
    echo json_encode([
        'login_id' => $u['login_id'],
        'name'     => $u['name'],
        'email'    => $u['email'] ?? '',
        'whatsapp' => $u['whatsapp'] ?? '',
        'photo'    => $u['photo'] ?? '',
    ]);
    exit;
}

if ($method === 'POST') {
    $remove  = (string)($_POST['remove_photo'] ?? '') === '1';
    $photo   = null;
    $changes = [];
    $sets    = [];
    $params  = [];

    // Text detail updates (name, email, whatsapp) — matches the Node backend:
    // a field only counts as a change when the value actually differs.
    $curStmt = $pdo->prepare("SELECT name, email, whatsapp FROM portal_users WHERE login_id = ?");
    $curStmt->execute([$claims['login_id']]);
    $current = $curStmt->fetch() ?: [];
    foreach (['name', 'email', 'whatsapp'] as $f) {
        if (isset($_POST[$f])) {
            $v = trim((string)$_POST[$f]);
            if ($f === 'name' && $v === '') {
                http_response_code(400);
                echo json_encode(['error' => 'Name cannot be empty']);
                exit;
            }
            if ((string)($current[$f] ?? '') !== $v) {
                $sets[]    = "$f = ?";
                $params[]  = $v;
                $changes[] = $f;
            }
        }
    }

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
        $sets[]    = 'photo = ?';
        $params[]  = $photo;
        $changes[] = 'photo';
    } elseif ($remove) {
        $photo     = '';
        $sets[]    = 'photo = ?';
        $params[]  = $photo;
        $changes[] = 'photo removed';
    }

    if (!$changes) {
        http_response_code(400);
        echo json_encode(['error' => 'No changes provided']);
        exit;
    }

    $params[] = $claims['login_id'];
    $pdo->prepare("UPDATE portal_users SET " . implode(', ', $sets) . " WHERE login_id = ?")
        ->execute($params);

    _portal_audit_write($pdo, 'center_profile_updated', $claims['login_id'], 'franchise',
        $claims['login_id'], 'Updated: ' . implode(', ', $changes),
        $claims['name'] ?? $claims['login_id']);

    $stmt = $pdo->prepare("SELECT name, email, whatsapp, photo FROM portal_users WHERE login_id = ?");
    $stmt->execute([$claims['login_id']]);
    $u = $stmt->fetch() ?: [];
    echo json_encode([
        'success'  => true,
        'photo'    => $u['photo'] ?? '',
        'name'     => $u['name'] ?? '',
        'email'    => $u['email'] ?? '',
        'whatsapp' => $u['whatsapp'] ?? '',
    ]);
    exit;
}

http_response_code(405);
echo json_encode(['error' => 'Method not allowed']);
