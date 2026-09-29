<?php
/**
 * portal_audit.php — Audit Log (Admin Read, MySQL-backed)
 * GET ?action=&role=&search=&date_from=&date_to=&page=1&per_page=50
 */
declare(strict_types=1);
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Admin-Password");
header("Access-Control-Allow-Methods: GET, OPTIONS");
if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") { http_response_code(204); exit; }

require_once __DIR__ . '/portal_middleware.php';

function fail(int $code, string $msg): never {
    http_response_code($code);
    echo json_encode(["error" => $msg]);
    exit;
}

if ($_SERVER["REQUEST_METHOD"] !== "GET") fail(405, "Method not allowed");

/* ── Auth: admin header OR admin JWT ─────────────────────────────────────── */
require_once __DIR__ . '/../config.php';
$ADMIN_HASH = hash("sha256", ADMIN_PASSWORD);
$adminOk    = false;
$adminHdr   = $_SERVER["HTTP_X_ADMIN_PASSWORD"] ?? "";
if (hash("sha256", $adminHdr) === $ADMIN_HASH) {
    $adminOk = true;
} else {
    $auth = $_SERVER["HTTP_AUTHORIZATION"] ?? "";
    if (preg_match("/^Bearer\s+(.+)$/i", $auth, $m)) {
        $claims = portal_jwt_verify($m[1]);
        if ($claims && ($claims["role"] ?? "") === "admin") $adminOk = true;
    }
}
if (!$adminOk) fail(401, "Admin access required");

/* ── Connect to DB ───────────────────────────────────────────────────────── */
$pdo = portal_db();

/* ── Ensure audit table exists (auto-create / migrate) ──────────────────── */
require_once __DIR__ . '/portal_audit_helper.php';
_portal_audit_ensure_table($pdo);

/* ── Filters ─────────────────────────────────────────────────────────────── */
$actionFilter = trim($_GET["action"]    ?? "");
$roleFilter   = trim($_GET["role"]      ?? "");
$search       = trim($_GET["search"]    ?? "");
$dateFrom     = trim($_GET["date_from"] ?? "");
$dateTo       = trim($_GET["date_to"]   ?? "");
$page         = max(1, (int)($_GET["page"]     ?? 1));
$perPage      = min(100, max(10, (int)($_GET["per_page"] ?? 50)));
$offset       = ($page - 1) * $perPage;

$where  = [];
$params = [];

if ($actionFilter !== "") { $where[] = "action = ?";      $params[] = $actionFilter; }
if ($roleFilter   !== "") { $where[] = "actor_role = ?";  $params[] = $roleFilter; }
if ($search       !== "") {
    $where[] = "(actor_id LIKE ? OR target LIKE ? OR detail LIKE ?)";
    $like = "%{$search}%";
    $params[] = $like; $params[] = $like; $params[] = $like;
}
if ($dateFrom !== "") { $where[] = "created_at >= ?"; $params[] = $dateFrom . " 00:00:00"; }
if ($dateTo   !== "") { $where[] = "created_at <= ?"; $params[] = $dateTo   . " 23:59:59"; }

$whereSQL = $where ? "WHERE " . implode(" AND ", $where) : "";

/* ── Count ───────────────────────────────────────────────────────────────── */
$cnt = $pdo->prepare("SELECT COUNT(*) FROM portal_audit_log $whereSQL");
$cnt->execute($params);
$total = (int)$cnt->fetchColumn();

/* ── Data ────────────────────────────────────────────────────────────────── */
$stmt = $pdo->prepare(
    "SELECT id, action, actor_id, actor_role, actor_name, target, detail, changes, created_at
       FROM portal_audit_log
      $whereSQL
      ORDER BY id DESC
      LIMIT $perPage OFFSET $offset"
);
$stmt->execute($params);
$data = $stmt->fetchAll();

/* Normalise created_at to ISO string */
foreach ($data as &$row) {
    if ($row['created_at']) {
        $row['created_at'] = (new DateTime($row['created_at']))->format('c');
    }
}
unset($row);

echo json_encode(["data" => $data, "total" => $total, "page" => $page, "per_page" => $perPage]);
