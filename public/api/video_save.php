<?php
/**
 * video_save.php — Create or update a featured video lesson (Admin only)
 * POST JSON { id?, youtube_id, title, level, sort_order }
 */
declare(strict_types=1);
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type, X-Admin-Password");
header("Access-Control-Allow-Methods: POST, OPTIONS");
if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") { http_response_code(204); exit; }

require_once __DIR__ . '/portal_middleware.php';

function fail(int $code, string $msg): never {
    http_response_code($code);
    echo json_encode(["error" => $msg]);
    exit;
}

if ($_SERVER["REQUEST_METHOD"] !== "POST") fail(405, "Method not allowed");

/* ── Admin auth ─────────────────────────────────────────────────────────── */
require_once __DIR__ . '/../config.php';
$ADMIN_HASH = hash("sha256", ADMIN_PASSWORD);
$adminHdr   = $_SERVER["HTTP_X_ADMIN_PASSWORD"] ?? "";
if (hash("sha256", $adminHdr) !== $ADMIN_HASH) fail(401, "Unauthorized");

$body = json_decode(file_get_contents("php://input"), true) ?? [];

$youtubeId = trim($body["youtube_id"] ?? "");
$title     = trim($body["title"]      ?? "");
$level     = trim($body["level"]      ?? "Beginner");
$sortOrder = (int)($body["sort_order"] ?? 0);
$id        = (int)($body["id"]        ?? 0);

if ($youtubeId === "") fail(400, "youtube_id is required");
if ($title === "")     fail(400, "title is required");

$pdo = portal_db();

$pdo->exec("
    CREATE TABLE IF NOT EXISTS `featured_videos` (
        `id`         INT AUTO_INCREMENT PRIMARY KEY,
        `youtube_id` VARCHAR(20)  NOT NULL DEFAULT '',
        `title`      VARCHAR(255) NOT NULL DEFAULT '',
        `level`      VARCHAR(80)  NOT NULL DEFAULT '',
        `sort_order` INT          NOT NULL DEFAULT 0,
        INDEX `idx_sort` (`sort_order`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
");

if ($id > 0) {
    $stmt = $pdo->prepare("UPDATE featured_videos SET youtube_id=?, title=?, level=?, sort_order=? WHERE id=?");
    $stmt->execute([$youtubeId, $title, $level, $sortOrder, $id]);
    echo json_encode(["success" => true, "id" => $id]);
} else {
    if ($sortOrder === 0) {
        $max = (int)$pdo->query("SELECT COALESCE(MAX(sort_order),0) FROM featured_videos")->fetchColumn();
        $sortOrder = $max + 1;
    }
    $stmt = $pdo->prepare("INSERT INTO featured_videos (youtube_id, title, level, sort_order) VALUES (?,?,?,?)");
    $stmt->execute([$youtubeId, $title, $level, $sortOrder]);
    echo json_encode(["success" => true, "id" => (int)$pdo->lastInsertId()]);
}
