<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-Admin-Password');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit(0); }

require_once __DIR__ . '/../config.php';

define('NEWS_UPLOAD_URL', '/uploads/news/');

$isAdmin = (($_SERVER['HTTP_X_ADMIN_PASSWORD'] ?? '') === ADMIN_PASSWORD);

try {
    $pdo = new PDO(
        "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4",
        DB_USER, DB_PASS,
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );

    $where = $isAdmin ? '' : 'WHERE is_active = 1';
    $sql =
        "SELECT id, title, category, news_date, summary, body, image, video, link_url, is_active, created_at
         FROM news $where
         ORDER BY COALESCE(news_date, '0000-00-00') DESC, id DESC";
    $stmt = $pdo->query($sql);
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $out = [];
    foreach ($rows as $r) {
        $out[] = [
            'id'         => (int)$r['id'],
            'title'      => $r['title'],
            'category'   => $r['category'],
            'date'       => $r['news_date'],
            'summary'    => $r['summary'],
            'body'       => $r['body'],
            'image'      => $r['image'] ? NEWS_UPLOAD_URL . $r['image'] : '',
            'video'      => !empty($r['video']) ? NEWS_UPLOAD_URL . $r['video'] : '',
            'link_url'   => $r['link_url'],
            'is_active'  => (int)$r['is_active'],
            'created_at' => $r['created_at'],
        ];
    }
    echo json_encode($out);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database error']);
}
