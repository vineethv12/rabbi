<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Admin-Password');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit(0); }

require_once __DIR__ . '/portal_middleware.php';

$claims = portal_auth_or_admin();
$role   = $claims['role'] ?? '';
$pdo    = portal_db();
$method = $_SERVER['REQUEST_METHOD'];

define('VIDEO_DIR', __DIR__ . '/../uploads/videos/');
define('VIDEO_URL', '/uploads/videos/');

_purge_expired_videos($pdo);

// ── GET: list videos ─────────────────────────────────────────────────────────
if ($method === 'GET') {
    if ($role === 'admin') {
        $center_id_f = trim($_GET['center_id'] ?? '');
        if ($center_id_f) {
            $stmt = $pdo->prepare(
                "SELECT v.id, v.center_id, v.title, v.filename, v.uploaded_at, v.expires_at
                 FROM learning_videos v
                 WHERE v.center_id = ? AND v.expires_at > NOW()
                 ORDER BY v.uploaded_at DESC"
            );
            $stmt->execute([$center_id_f]);
        } else {
            $stmt = $pdo->query(
                "SELECT v.id, v.center_id, v.title, v.filename, v.uploaded_at, v.expires_at,
                        (SELECT COUNT(*) FROM learning_video_students m WHERE m.video_id = v.id) AS students_count
                 FROM learning_videos v WHERE v.expires_at > NOW()
                 ORDER BY v.uploaded_at DESC"
            );
        }
        $rows = $stmt->fetchAll();
        foreach ($rows as &$r) {
            $r['url'] = VIDEO_URL . $r['filename'];
            if (!isset($r['students_count'])) {
                $ms = $pdo->prepare(
                    "SELECT m.enrollment_no, s.name FROM learning_video_students m
                     LEFT JOIN students s ON s.enrollment_no = m.enrollment_no
                     WHERE m.video_id = ?"
                );
                $ms->execute([$r['id']]);
                $r['students'] = $ms->fetchAll();
            }
        }
        echo json_encode($rows);
        exit;
    }

    if ($role === 'student') {
        $stmt = $pdo->prepare(
            "SELECT v.id, v.title, v.filename, v.uploaded_at, v.expires_at
             FROM learning_videos v
             JOIN learning_video_students m ON m.video_id = v.id
             WHERE m.enrollment_no = ? AND v.expires_at > NOW()
             ORDER BY v.uploaded_at DESC"
        );
        $stmt->execute([$claims['login_id']]);
        $rows = $stmt->fetchAll();
        foreach ($rows as &$r) $r['url'] = VIDEO_URL . $r['filename'];
        echo json_encode($rows);
        exit;
    }

    if ($role === 'franchise') {
        $center_id = $claims['center_id'];
        $stmt = $pdo->prepare(
            "SELECT v.id, v.title, v.filename, v.uploaded_at, v.expires_at
             FROM learning_videos v
             WHERE v.center_id = ? AND v.expires_at > NOW()
             ORDER BY v.uploaded_at DESC"
        );
        $stmt->execute([$center_id]);
        $rows = $stmt->fetchAll();
        foreach ($rows as &$r) {
            $r['url'] = VIDEO_URL . $r['filename'];
            $ms = $pdo->prepare(
                "SELECT m.enrollment_no, s.name FROM learning_video_students m
                 LEFT JOIN students s ON s.enrollment_no = m.enrollment_no
                 WHERE m.video_id = ?"
            );
            $ms->execute([$r['id']]);
            $r['students'] = $ms->fetchAll();
        }
        echo json_encode($rows);
        exit;
    }

    http_response_code(403);
    echo json_encode(['error' => 'Access denied']);
    exit;
}

// ── POST: upload a video ──────────────────────────────────────────────────────
if ($method === 'POST') {
    if ($role !== 'franchise' && $role !== 'admin') {
        http_response_code(403);
        echo json_encode(['error' => 'Access denied']);
        exit;
    }

    // Admin must supply center_id in POST data
    $center_id = ($role === 'admin')
        ? trim($_POST['center_id'] ?? '')
        : $claims['center_id'];

    if ($role === 'admin' && !$center_id) {
        http_response_code(400);
        echo json_encode(['error' => 'center_id is required']);
        exit;
    }

    if (empty($_FILES['file']) || ($_FILES['file']['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) {
        http_response_code(400);
        echo json_encode(['error' => 'No video file uploaded']);
        exit;
    }

    $title = trim($_POST['title'] ?? '');

    $students = [];
    if (isset($_POST['students'])) {
        if (is_array($_POST['students'])) {
            $students = $_POST['students'];
        } else {
            $decoded  = json_decode($_POST['students'], true);
            $students = is_array($decoded) ? $decoded : array_filter(array_map('trim', explode(',', $_POST['students'])));
        }
    }
    $students = array_values(array_unique(array_filter(array_map('trim', $students))));
    if (!$students) {
        http_response_code(400);
        echo json_encode(['error' => 'Select at least one student']);
        exit;
    }

    $f   = $_FILES['file'];
    $ext = strtolower(pathinfo($f['name'], PATHINFO_EXTENSION));
    if (!in_array($ext, ['mp4', 'webm', 'mov', 'm4v', 'ogg'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Video must be MP4, WEBM, MOV, M4V or OGG']);
        exit;
    }
    if ($f['size'] > 200 * 1024 * 1024) {
        http_response_code(400);
        echo json_encode(['error' => 'Video must be under 200 MB']);
        exit;
    }

    if (!is_dir(VIDEO_DIR)) @mkdir(VIDEO_DIR, 0775, true);
    $fname = 'vid_' . date('YmdHis') . '_' . bin2hex(random_bytes(4)) . '.' . $ext;
    if (!move_uploaded_file($f['tmp_name'], VIDEO_DIR . $fname)) {
        http_response_code(500);
        echo json_encode(['error' => 'Could not save the video file']);
        exit;
    }

    try {
        $pdo->beginTransaction();
        $stmt = $pdo->prepare(
            "INSERT INTO learning_videos (center_id, title, filename, expires_at)
             VALUES (?, ?, ?, DATE_ADD(NOW(), INTERVAL 3 DAY))"
        );
        $stmt->execute([$center_id, $title ?: 'Learning Video', $fname]);
        $video_id = (int)$pdo->lastInsertId();

        $map = $pdo->prepare("INSERT INTO learning_video_students (video_id, enrollment_no) VALUES (?, ?)");
        $own = $pdo->prepare("SELECT id FROM students WHERE enrollment_no = ? AND center_id = ?");
        $mapped = 0;
        foreach ($students as $en) {
            $own->execute([$en, $center_id]);
            if ($own->fetch()) { $map->execute([$video_id, $en]); $mapped++; }
        }
        if ($mapped === 0) {
            $pdo->rollBack();
            @unlink(VIDEO_DIR . $fname);
            http_response_code(400);
            echo json_encode(['error' => 'None of the selected students belong to the specified center']);
            exit;
        }
        $pdo->commit();
        echo json_encode(['success' => true, 'id' => $video_id, 'students_count' => $mapped]);
    } catch (Exception $e) {
        if ($pdo->inTransaction()) $pdo->rollBack();
        @unlink(VIDEO_DIR . $fname);
        http_response_code(500);
        echo json_encode(['error' => 'Failed to save video: ' . $e->getMessage()]);
    }
    exit;
}

// ── DELETE: remove a video ────────────────────────────────────────────────────
if ($method === 'DELETE') {
    if ($role !== 'franchise' && $role !== 'admin') {
        http_response_code(403);
        echo json_encode(['error' => 'Access denied']);
        exit;
    }
    $body = json_decode(file_get_contents('php://input'), true) ?? [];
    $id   = (int)($body['id'] ?? 0);
    if (!$id) { http_response_code(400); echo json_encode(['error' => 'id is required']); exit; }

    if ($role === 'franchise') {
        $center_id = $claims['center_id'];
        $stmt = $pdo->prepare("SELECT filename FROM learning_videos WHERE id = ? AND center_id = ?");
        $stmt->execute([$id, $center_id]);
    } else {
        $stmt = $pdo->prepare("SELECT filename FROM learning_videos WHERE id = ?");
        $stmt->execute([$id]);
    }
    $row = $stmt->fetch();
    if (!$row) { http_response_code(404); echo json_encode(['error' => 'Video not found']); exit; }

    $pdo->prepare("DELETE FROM learning_video_students WHERE video_id = ?")->execute([$id]);
    $pdo->prepare("DELETE FROM learning_videos WHERE id = ?")->execute([$id]);
    @unlink(VIDEO_DIR . $row['filename']);

    echo json_encode(['success' => true]);
    exit;
}

http_response_code(405);
echo json_encode(['error' => 'Method not allowed']);

// ── Helpers ───────────────────────────────────────────────────────────────────
function _purge_expired_videos(PDO $pdo): void {
    try {
        $rows = $pdo->query("SELECT id, filename FROM learning_videos WHERE expires_at < NOW()")->fetchAll();
        if (!$rows) return;
        $ids = array_column($rows, 'id');
        foreach ($rows as $r) @unlink(VIDEO_DIR . $r['filename']);
        $in = implode(',', array_fill(0, count($ids), '?'));
        $pdo->prepare("DELETE FROM learning_video_students WHERE video_id IN ($in)")->execute($ids);
        $pdo->prepare("DELETE FROM learning_videos WHERE id IN ($in)")->execute($ids);
    } catch (Exception $e) { /* ignore purge errors */ }
}
