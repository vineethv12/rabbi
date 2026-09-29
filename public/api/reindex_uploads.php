<?php
// ── One-time recovery script ─────────────────────────────────────────────────
// Scans the uploads folders on the server and re-registers any file that is
// missing from the database (e.g. after a database reset). Safe to run
// multiple times — files already in the database are skipped.
//
// Usage: visit  https://yourdomain.com/api/reindex_uploads.php?password=YOUR_ADMIN_PASSWORD
// Delete this file from the server after running it.

header('Content-Type: application/json');

require_once __DIR__ . '/../config.php';

$password = $_GET['password'] ?? ($_SERVER['HTTP_X_ADMIN_PASSWORD'] ?? '');
if ($password !== ADMIN_PASSWORD) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized. Add ?password=... to the URL.']);
    exit;
}

$imageExts = ['jpg', 'jpeg', 'png', 'webp', 'gif'];
$videoExts = ['mp4', 'webm', 'mov', 'avi'];

try {
    $pdo = new PDO(
        "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4",
        DB_USER, DB_PASS,
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database connection failed']);
    exit;
}

$result = ['gallery_added' => [], 'home_added' => [], 'skipped_existing' => 0, 'skipped_unknown' => []];

// ── 1. Gallery: uploads/gallery/ → gallery_images ────────────────────────────
if (is_dir(UPLOAD_DIR)) {
    $existing = $pdo->query("SELECT filename FROM gallery_images")->fetchAll(PDO::FETCH_COLUMN);
    $existing = array_flip($existing);

    $ins = $pdo->prepare(
        "INSERT INTO gallery_images (year, caption, category, display_type, media_type, filename)
         VALUES (?, ?, ?, ?, ?, ?)"
    );

    foreach (scandir(UPLOAD_DIR) as $f) {
        if ($f === '.' || $f === '..' || !is_file(UPLOAD_DIR . $f)) continue;
        if (isset($existing[$f])) { $result['skipped_existing']++; continue; }

        $ext = strtolower(pathinfo($f, PATHINFO_EXTENSION));
        if (in_array($ext, $imageExts)) { $mediaType = 'image'; }
        elseif (in_array($ext, $videoExts)) { $mediaType = 'video'; }
        else { $result['skipped_unknown'][] = 'gallery/' . $f; continue; }

        // Filename format: <prefix>_<uniqid>.<ext>  where prefix is a year
        // (e.g. 2024_...) or a category name (e.g. Annual_Day_...)
        $base   = pathinfo($f, PATHINFO_FILENAME);
        $parts  = explode('_', $base);
        $unique = array_pop($parts); // trailing uniqid
        $prefix = implode('_', $parts);
        if ($prefix === '') $prefix = $unique;

        if (preg_match('/^(19|20)\d{2}$/', $prefix)) {
            $ins->execute([(int)$prefix, 'Gallery Item', 'General', 'year', $mediaType, $f]);
        } else {
            $category = trim(str_replace('_', ' ', $prefix));
            if ($category === '') $category = 'General';
            $ins->execute([null, 'Gallery Item', $category, 'category', $mediaType, $f]);
        }
        $result['gallery_added'][] = $f;
    }
}

// ── 2. Home images: uploads/home/ → home_images ──────────────────────────────
$homeDir = __DIR__ . '/../uploads/home/';
if (is_dir($homeDir)) {
    $existing = $pdo->query("SELECT filename FROM home_images")->fetchAll(PDO::FETCH_COLUMN);
    $existing = array_flip($existing);

    $sections = ['hero', 'gallery', 'awards', 'founders'];
    $sortNext = [];
    foreach ($sections as $s) {
        $stmt = $pdo->prepare("SELECT COALESCE(MAX(sort_order), 0) + 1 FROM home_images WHERE section = ?");
        $stmt->execute([$s]);
        $sortNext[$s] = (int)$stmt->fetchColumn();
    }

    $ins = $pdo->prepare("INSERT INTO home_images (section, filename, caption, sort_order) VALUES (?, ?, ?, ?)");

    $files = scandir($homeDir);
    sort($files); // stable order
    foreach ($files as $f) {
        if ($f === '.' || $f === '..' || !is_file($homeDir . $f)) continue;
        if (isset($existing[$f])) { $result['skipped_existing']++; continue; }

        $ext = strtolower(pathinfo($f, PATHINFO_EXTENSION));
        if (!in_array($ext, $imageExts)) { $result['skipped_unknown'][] = 'home/' . $f; continue; }

        $section = strtolower(explode('_', $f)[0]);
        if (!in_array($section, $sections)) { $result['skipped_unknown'][] = 'home/' . $f; continue; }

        $ins->execute([$section, $f, ucfirst($section) . ' Image', $sortNext[$section]]);
        $sortNext[$section]++;
        $result['home_added'][] = $f;
    }
}

$result['success'] = true;
$result['summary'] = count($result['gallery_added']) . ' gallery + ' . count($result['home_added']) . ' home images re-registered.';
echo json_encode($result, JSON_PRETTY_PRINT);
