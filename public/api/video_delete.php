<?php
/**
 * video_delete.php — Delete a featured video lesson (Admin only)
 * POST JSON { id }
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
$id   = (int)($body["id"] ?? 0);
if ($id <= 0) fail(400, "id is required");

$pdo = portal_db();
$stmt = $pdo->prepare("DELETE FROM featured_videos WHERE id = ?");
$stmt->execute([$id]);

if ($stmt->rowCount() === 0) fail(404, "Video not found");
echo json_encode(["success" => true]);
