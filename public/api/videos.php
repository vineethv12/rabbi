<?php
/**
 * videos.php — Featured Lessons (Admin, read-only public endpoint)
 * GET → returns all video records sorted by sort_order ASC
 */
declare(strict_types=1);
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type, X-Admin-Password");
header("Access-Control-Allow-Methods: GET, OPTIONS");
if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") { http_response_code(204); exit; }

require_once __DIR__ . '/portal_middleware.php';

function fail(int $code, string $msg): never {
    http_response_code($code);
    echo json_encode(["error" => $msg]);
    exit;
}

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

if ($_SERVER["REQUEST_METHOD"] !== "GET") fail(405, "Method not allowed");

$rows = $pdo->query("SELECT id, youtube_id, title, level, sort_order FROM featured_videos ORDER BY sort_order ASC, id ASC")->fetchAll();
echo json_encode(array_values($rows));
