<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');

require_once __DIR__ . '/../config.php';

try {
    $pdo = new PDO(
        "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4",
        DB_USER,
        DB_PASS,
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );

    $stmt = $pdo->query(
        "SELECT id, year, caption, category, display_type, media_type, filename, uploaded_at
         FROM gallery_images
         ORDER BY uploaded_at DESC"
    );
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $yearGroups     = [];
    $categoryGroups = [];

    foreach ($rows as $row) {
        $mediaType   = isset($row['media_type'])   ? $row['media_type']   : 'image';
        $displayType = isset($row['display_type']) ? $row['display_type'] : 'year';

        $item = [
            'id'          => (int)$row['id'],
            'src'         => UPLOAD_URL . $row['filename'],
            'caption'     => $row['caption'],
            'category'    => $row['category'],
            'media_type'  => $mediaType,
            'uploaded_at' => $row['uploaded_at'],
        ];

        if ($displayType === 'category') {
            $cat = $row['category'] ?: 'General';
            if (!isset($categoryGroups[$cat])) {
                $categoryGroups[$cat] = ['category' => $cat, 'items' => []];
            }
            $categoryGroups[$cat]['items'][] = $item;
        } else {
            $y = (int)$row['year'];
            if (!isset($yearGroups[$y])) {
                $yearGroups[$y] = ['year' => $y, 'items' => []];
            }
            $yearGroups[$y]['items'][] = $item;
        }
    }

    krsort($yearGroups);

    echo json_encode([
        'year_groups'     => array_values($yearGroups),
        'category_groups' => array_values($categoryGroups),
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database error. Check config.php credentials.']);
}
