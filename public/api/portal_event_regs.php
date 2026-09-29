<?php
// Portal event registration submissions — mirrors /api/portal_event_regs.php
// in the Node backend (api-server.js).
//   GET    → list submissions (franchise: own; admin: all)
//   POST   → franchise uploads a filled registration sheet (multipart: file)
//   DELETE → delete a submission (JSON body: id) or single rows (row_index / row_indexes)

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Admin-Password');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit(0); }

require_once __DIR__ . '/portal_middleware.php';
require_once __DIR__ . '/portal_audit_helper.php';
require_once __DIR__ . '/portal_event_helper.php';

$claims = portal_auth_or_admin();
$role   = $claims['role'] ?? '';
$pdo    = portal_db();
_ev_ensure_tables($pdo);
$method = $_SERVER['REQUEST_METHOD'];

function _ev_row_out(array $r, bool $includeRows = true): array {
    // Match the Node response shape (filename intentionally excluded)
    return [
        'id'            => (int)$r['id'],
        'event_id'      => isset($r['event_id']) ? (int)$r['event_id'] : null,
        'center_id'     => $r['center_id'],
        'event_name'    => $r['event_name'],
        'uploader_name' => $r['uploader_name'] ?? null,
        'academy_name'  => $r['academy_name'] ?? null,
        'city'          => $r['city'] ?? null,
        'original_name' => $r['original_name'],
        'uploaded_at'   => date('c', strtotime($r['uploaded_at'])),
        'headers'       => $includeRows && $r['headers_json'] !== null && $r['headers_json'] !== '' ? json_decode($r['headers_json'], true) : null,
        'rows'          => $includeRows && $r['rows_json'] !== null && $r['rows_json'] !== '' ? json_decode($r['rows_json'], true) : null,
        'count'         => (int)$r['row_count'],
    ];
}

// ── GET: list submissions ─────────────────────────────────────────────────────
if ($method === 'GET') {
    if ($role === 'admin') {
        if (!empty($_GET['summary'])) {
            $rows = $pdo->query(
                "SELECT event_id, COUNT(*) AS file_count, COALESCE(SUM(row_count), 0) AS row_count
                 FROM portal_event_regs
                 WHERE event_id IS NOT NULL
                 GROUP BY event_id"
            )->fetchAll();
            echo json_encode(array_map(fn($row) => [
                'event_id'   => (int)$row['event_id'],
                'file_count' => (int)$row['file_count'],
                'row_count'  => (int)$row['row_count'],
            ], $rows));
            exit;
        }

        $singleId = (int)($_GET['id'] ?? 0);
        if ($singleId > 0) {
            $stmt = $pdo->prepare("SELECT * FROM portal_event_regs WHERE id = ?");
            $stmt->execute([$singleId]);
            $row = $stmt->fetch();
            if (!$row) {
                http_response_code(404);
                echo json_encode(['error' => 'Submission not found']);
                exit;
            }
            echo json_encode(_ev_row_out($row, true));
            exit;
        }

        $eventId = (int)($_GET['event_id'] ?? 0);
        if ($eventId > 0) {
            $page = max(1, (int)($_GET['page'] ?? 1));
            $perPage = min(100, max(10, (int)($_GET['per_page'] ?? 25)));
            $offset = ($page - 1) * $perPage;
            $search = trim($_GET['search'] ?? '');
            $source = trim($_GET['source'] ?? '');
            $city = trim($_GET['city'] ?? '');

            $where = ['event_id = ?'];
            $params = [$eventId];
            if ($search !== '') {
                $where[] = "(original_name LIKE ? OR uploader_name LIKE ? OR academy_name LIKE ? OR city LIKE ? OR center_id LIKE ?)";
                $like = '%' . $search . '%';
                array_push($params, $like, $like, $like, $like, $like);
            }
            if ($source === 'public') {
                $where[] = "center_id = 'PUBLIC'";
            } elseif ($source === 'franchise') {
                $where[] = "center_id <> 'PUBLIC'";
            }
            if ($city !== '') {
                $where[] = 'city = ?';
                $params[] = $city;
            }
            $whereSql = implode(' AND ', $where);

            if (!empty($_GET['export']) && $_GET['export'] === 'combined') {
                $eventStmt = $pdo->prepare("SELECT title FROM events WHERE id = ?");
                $eventStmt->execute([$eventId]);
                $eventName = (string)($eventStmt->fetchColumn() ?: 'event');

                $exportStmt = $pdo->prepare(
                    "SELECT * FROM portal_event_regs
                     WHERE $whereSql
                     ORDER BY uploaded_at DESC, id DESC"
                );
                $exportStmt->execute($params);
                _ev_send_combined_registration_export($eventName, $exportStmt->fetchAll());
            }

            $countStmt = $pdo->prepare("SELECT COUNT(*) FROM portal_event_regs WHERE $whereSql");
            $countStmt->execute($params);
            $total = (int)$countStmt->fetchColumn();

            $listStmt = $pdo->prepare(
                "SELECT * FROM portal_event_regs
                 WHERE $whereSql
                 ORDER BY uploaded_at DESC, id DESC
                 LIMIT $perPage OFFSET $offset"
            );
            $listStmt->execute($params);
            $items = array_map(fn($row) => _ev_row_out($row, false), $listStmt->fetchAll());

            $statsStmt = $pdo->prepare(
                "SELECT COUNT(*) AS file_count,
                        COALESCE(SUM(row_count), 0) AS row_count,
                        SUM(center_id = 'PUBLIC') AS public_count,
                        SUM(center_id <> 'PUBLIC') AS franchise_count
                 FROM portal_event_regs WHERE event_id = ?"
            );
            $statsStmt->execute([$eventId]);
            $stats = $statsStmt->fetch();

            $cityStmt = $pdo->prepare(
                "SELECT DISTINCT city FROM portal_event_regs
                 WHERE event_id = ? AND city IS NOT NULL AND city <> ''
                 ORDER BY city"
            );
            $cityStmt->execute([$eventId]);

            echo json_encode([
                'items' => $items,
                'total' => $total,
                'page' => $page,
                'per_page' => $perPage,
                'cities' => $cityStmt->fetchAll(PDO::FETCH_COLUMN),
                'summary' => [
                    'file_count' => (int)($stats['file_count'] ?? 0),
                    'row_count' => (int)($stats['row_count'] ?? 0),
                    'public_count' => (int)($stats['public_count'] ?? 0),
                    'franchise_count' => (int)($stats['franchise_count'] ?? 0),
                ],
            ]);
            exit;
        }

        $stmt = $pdo->query("SELECT * FROM portal_event_regs ORDER BY uploaded_at DESC, id DESC");
    } elseif ($role === 'franchise') {
        $stmt = $pdo->prepare("SELECT * FROM portal_event_regs WHERE center_id = ? ORDER BY uploaded_at DESC, id DESC");
        $stmt->execute([$claims['center_id']]);
    } else {
        http_response_code(403);
        echo json_encode(['error' => 'Access denied']);
        exit;
    }
    echo json_encode(array_map('_ev_row_out', $stmt->fetchAll()));
    exit;
}

// ── POST: franchise uploads a filled sheet ────────────────────────────────────
if ($method === 'POST') {
    if ($role !== 'franchise') {
        http_response_code(403);
        echo json_encode(['error' => 'Only franchise centers can submit registrations']);
        exit;
    }
    if (empty($_FILES['file'])) {
        http_response_code(400);
        echo json_encode(['error' => 'No file uploaded']);
        exit;
    }
    [$ok, $err] = _ev_validate_upload($_FILES['file']);
    if (!$ok) { http_response_code(400); echo json_encode(['error' => $err]); exit; }
    $event_id = (int)($_POST['event_id'] ?? 0);
    if ($event_id <= 0) {
        http_response_code(400);
        echo json_encode(['error' => 'Select an event']);
        exit;
    }
    $tmplStmt = $pdo->prepare(
        "SELECT t.event_name FROM portal_event_template t
         JOIN events e ON e.id = t.event_id
         WHERE t.event_id = ? AND e.is_active = 1
           AND (e.deadline IS NULL OR e.deadline = '' OR e.deadline >= CURDATE())"
    );
    $tmplStmt->execute([$event_id]);
    $tmpl = $tmplStmt->fetch();
    if (!$tmpl) {
        http_response_code(403);
        echo json_encode(['error' => 'Registration is not available for this event']);
        exit;
    }

    $original = $_FILES['file']['name'] ?? '';
    $ext      = strtolower(pathinfo($original, PATHINFO_EXTENSION));

    // Parse rows out of .xlsx files (same as Node: only xlsx is parsed)
    $parsed = ['headers' => null, 'rows' => []];
    if ($ext === 'xlsx') {
        try { $parsed = _ev_extract_rows($_FILES['file']['tmp_name']); } catch (Throwable $e) { }
    }

    $filename = _ev_store_upload($_FILES['file']);
    if (!$filename) { http_response_code(500); echo json_encode(['error' => 'Could not save uploaded file']); exit; }

    $event_name = $tmpl['event_name'];
    $count = count($parsed['rows']);

    $pdo->prepare(
        "INSERT INTO portal_event_regs
            (event_id, center_id, event_name, filename, original_name, uploaded_at, headers_json, rows_json, row_count)
         VALUES (?, ?, ?, ?, ?, NOW(), ?, ?, ?)"
    )->execute([
        $event_id,
        $claims['center_id'],
        $event_name,
        $filename,
        $original,
        $parsed['headers'] !== null ? json_encode($parsed['headers'], JSON_UNESCAPED_UNICODE) : null,
        json_encode($parsed['rows'], JSON_UNESCAPED_UNICODE),
        $count,
    ]);
    $id = (int)$pdo->lastInsertId();

    _portal_audit_write($pdo, 'event_regs_uploaded', (string)$claims['center_id'], 'franchise',
        "\"$event_name\" ($count row(s))", "File: $original");

    echo json_encode(['success' => true, 'id' => $id, 'count' => $count, 'parsed' => $parsed['headers'] !== null]);
    exit;
}

// ── DELETE: remove a submission or individual rows ────────────────────────────
if ($method === 'DELETE') {
    $body = json_decode(file_get_contents('php://input'), true) ?: [];
    $id   = (int)($body['id'] ?? 0);
    if (!$id) { http_response_code(400); echo json_encode(['error' => 'id is required']); exit; }

    if ($role === 'admin') {
        $stmt = $pdo->prepare("SELECT * FROM portal_event_regs WHERE id = ?");
        $stmt->execute([$id]);
    } elseif ($role === 'franchise') {
        $stmt = $pdo->prepare("SELECT * FROM portal_event_regs WHERE id = ? AND center_id = ?");
        $stmt->execute([$id, $claims['center_id']]);
    } else {
        http_response_code(403);
        echo json_encode(['error' => 'Access denied']);
        exit;
    }
    $rec = $stmt->fetch();
    if (!$rec) { http_response_code(404); echo json_encode(['error' => 'Submission not found']); exit; }

    $actor_id = $role === 'admin' ? 'admin' : (string)$claims['center_id'];

    // Row-level delete: row_index (single) or row_indexes (array), 0-based
    // Only accept strictly numeric indexes; non-numeric values are dropped
    // (Node's parseInt→NaN filter) so they can't silently become index 0.
    $to_int = fn($x) => (is_int($x) || (is_string($x) && preg_match('/^-?\d+$/', trim($x)))) ? (int)$x : null;
    $row_indexes = null;
    if (isset($body['row_indexes']) && is_array($body['row_indexes'])) {
        $row_indexes = array_values(array_filter(array_map($to_int, $body['row_indexes']), fn($x) => $x !== null));
    } elseif (array_key_exists('row_index', $body) && $body['row_index'] !== null) {
        $v = $to_int($body['row_index']);
        $row_indexes = $v !== null ? [$v] : [];
    }

    if ($row_indexes !== null) {
        $rows = $rec['rows_json'] ? json_decode($rec['rows_json'], true) : null;
        $valid = is_array($rows) && count($row_indexes) > 0;
        if ($valid) {
            foreach ($row_indexes as $ri) {
                if ($ri < 0 || $ri >= count($rows)) { $valid = false; break; }
            }
        }
        if (!$valid) { http_response_code(400); echo json_encode(['error' => 'Invalid row index(es)']); exit; }

        $uniq = array_unique($row_indexes);
        rsort($uniq);
        foreach ($uniq as $ri) array_splice($rows, $ri, 1);
        $count = count($rows);

        $pdo->prepare("UPDATE portal_event_regs SET rows_json = ?, row_count = ? WHERE id = ?")
            ->execute([json_encode($rows, JSON_UNESCAPED_UNICODE), $count, $id]);

        _portal_audit_write($pdo, 'event_reg_row_deleted', $actor_id, $role,
            "\"{$rec['event_name']}\" (ID: $id)", count($uniq) . " row(s) removed · $count remaining");

        echo json_encode(['success' => true, 'count' => $count]);
        exit;
    }

    // Full submission delete
    $pdo->prepare("DELETE FROM portal_event_regs WHERE id = ?")->execute([$id]);
    @unlink(_ev_upload_dir() . '/' . basename($rec['filename']));

    _portal_audit_write($pdo, 'event_regs_deleted', $actor_id, $role,
        "\"{$rec['event_name']}\" (ID: $id)", "Center: {$rec['center_id']}");

    echo json_encode(['success' => true]);
    exit;
}

http_response_code(405);
echo json_encode(['error' => 'Method not allowed']);
