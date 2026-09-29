<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: X-Admin-Password, Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit(0); }

require_once __DIR__ . '/../config.php';

$password = $_SERVER['HTTP_X_ADMIN_PASSWORD'] ?? '';
if ($password !== ADMIN_PASSWORD) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}

try {
    $pdo = new PDO(
        "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4",
        DB_USER,
        DB_PASS,
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );

    // ── POST: update status ─────────────────────────────────────────────────
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $body   = json_decode(file_get_contents('php://input'), true);
        $id     = isset($body['id'])     ? (int)$body['id']      : 0;
        $status = isset($body['status']) ? trim($body['status'])  : '';

        if ($id <= 0 || !in_array($status, ['new', 'contacted', 'resolved'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Invalid id or status']);
            exit;
        }

        $stmt = $pdo->prepare("UPDATE enquiries SET status = ? WHERE id = ?");
        $stmt->execute([$status, $id]);
        echo json_encode(['success' => true]);
        exit;
    }

    // ── GET: list enquiries with optional filters ───────────────────────────
    $where  = [];
    $params = [];

    $program  = trim($_GET['program']   ?? '');
    $status   = trim($_GET['status']    ?? '');
    $dateFrom = trim($_GET['date_from'] ?? '');
    $dateTo   = trim($_GET['date_to']   ?? '');

    if ($program !== '') {
        $where[]  = 'program = ?';
        $params[] = $program;
    }
    if ($status !== '') {
        $where[]  = 'status = ?';
        $params[] = $status;
    }
    if ($dateFrom !== '') {
        $where[]  = 'DATE(submitted_at) >= ?';
        $params[] = $dateFrom;
    }
    if ($dateTo !== '') {
        $where[]  = 'DATE(submitted_at) <= ?';
        $params[] = $dateTo;
    }

    $sql = 'SELECT * FROM enquiries';
    if ($where) { $sql .= ' WHERE ' . implode(' AND ', $where); }
    $sql .= ' ORDER BY submitted_at DESC';

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));

} catch (Exception $e) {
    error_log("enquiries.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'A server error occurred. Please try again.']);
}
