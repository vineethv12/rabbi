<?php
header('Content-Type: application/json');
header('Cache-Control: no-store');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Admin-Password');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') exit;
require_once __DIR__ . '/portal_middleware.php';
require_once __DIR__ . '/student_levels_helper.php';
$claims = portal_auth_or_admin('franchise');
$method = $_SERVER['REQUEST_METHOD'];
function levels_error(int $status, string $message): never {
    http_response_code($status);
    echo json_encode(['error' => $message]);
    exit;
}
if (!in_array($method, ['GET', 'POST', 'PUT', 'DELETE'], true)) levels_error(405, 'Method not allowed');
if ($method !== 'GET' && $claims['role'] !== 'admin') levels_error(403, 'Only admins can manage levels.');
try {
    $pdo = portal_db();
    student_levels_ensure($pdo);
    if ($method !== 'GET') {
        $body = json_decode(file_get_contents('php://input'), true) ?? [];
        $id = (int)($body['id'] ?? 0);
        $name = trim($body['name'] ?? '');
        if (strcasecmp($name, 'Riser') === 0) $name = 'Rider';
        if ($method !== 'DELETE' && ($name === '' || mb_strlen($name) > 100)) {
            levels_error(400, 'Enter a level name between 1 and 100 characters.');
        }
        $pdo->beginTransaction();
        if ($method === 'POST') {
            $query = $pdo->prepare("SELECT * FROM student_levels WHERE name=? FOR UPDATE");
            $query->execute([$name]);
            $existing = $query->fetch(PDO::FETCH_ASSOC);
            if ($existing && $existing['active']) { $pdo->rollBack(); levels_error(409, 'That level already exists.'); }
            if ($existing) {
                $pdo->prepare("UPDATE student_levels SET active=1 WHERE id=?")->execute([$existing['id']]);
            } else {
                $order = (int)$pdo->query("SELECT COALESCE(MAX(sort_order),0)+1 FROM student_levels")->fetchColumn();
                $pdo->prepare("INSERT INTO student_levels (name, sort_order) VALUES (?, ?)")->execute([$name, $order]);
            }
        } else {
            $query = $pdo->prepare("SELECT * FROM student_levels WHERE id=? AND active=1 FOR UPDATE");
            $query->execute([$id]);
            $level = $query->fetch(PDO::FETCH_ASSOC);
            if (!$level) { $pdo->rollBack(); levels_error(404, 'Level not found.'); }
            if ($method === 'PUT') {
                $pdo->prepare("UPDATE student_levels SET name=? WHERE id=?")->execute([$name, $id]);
                $pdo->prepare("UPDATE students SET level=? WHERE level=?")->execute([$name, $level['name']]);
            } else {
                $query = $pdo->prepare("SELECT COUNT(*) FROM students WHERE level=?");
                $query->execute([$level['name']]);
                if ($query->fetchColumn() > 0) {
                    $pdo->rollBack();
                    levels_error(409, 'This level is assigned to students. Move those students to another level before deleting it.');
                }
                $pdo->prepare("UPDATE student_levels SET active=0 WHERE id=?")->execute([$id]);
            }
        }
        $pdo->commit();
    }
    $levels = $claims['role'] === 'admin'
        ? $pdo->query("SELECT l.id, l.name, COUNT(s.id) AS student_count
            FROM student_levels l LEFT JOIN students s
            ON s.level COLLATE utf8mb4_unicode_ci = l.name COLLATE utf8mb4_unicode_ci
            WHERE l.active=1 GROUP BY l.id,l.name,l.sort_order ORDER BY l.sort_order,l.id")->fetchAll(PDO::FETCH_ASSOC)
        : $pdo->query("SELECT id, name FROM student_levels WHERE active=1 ORDER BY sort_order,id")->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode(['levels' => $levels]);
} catch (Throwable $error) {
    if (isset($pdo) && $pdo->inTransaction()) $pdo->rollBack();
    if ($error instanceof PDOException && $error->getCode() === '23000') levels_error(409, 'That level already exists.');
    error_log('Student level operation failed: ' . $error->getMessage());
    levels_error(500, 'Unable to update levels. Please check the server logs.');
}