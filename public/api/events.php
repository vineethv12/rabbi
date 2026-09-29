<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');

require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/portal_event_helper.php';
require_once __DIR__ . '/event_resource_helper.php';

$isAdmin = (($_SERVER['HTTP_X_ADMIN_PASSWORD'] ?? '') === ADMIN_PASSWORD);

try {
    $pdo = new PDO(
        "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4",
        DB_USER,
        DB_PASS,
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );
    _ev_ensure_tables($pdo);
    event_resource_ensure($pdo);

    $hasEnd = $pdo->query("SHOW COLUMNS FROM events LIKE 'event_end_date'")->fetch();
    if (!$hasEnd) {
        try { $pdo->exec("ALTER TABLE events ADD COLUMN event_end_date DATE NULL AFTER event_date"); }
        catch (Exception $e) { /* concurrent add or no ALTER privilege */ }
    }
    $hasImg = $pdo->query("SHOW COLUMNS FROM events LIKE 'image'")->fetch();
    if (!$hasImg) {
        try { $pdo->exec("ALTER TABLE events ADD COLUMN image VARCHAR(500) NOT NULL DEFAULT ''"); }
        catch (Exception $e) { /* concurrent add or no ALTER privilege */ }
    }

    if ($isAdmin) {
        $sql =
            "SELECT e.id, e.month, e.day, e.date_range, e.badge, e.status_label, e.status_type,
                    e.title, e.subtitle, e.description, e.venue, e.format, e.participants,
                    e.register_url, e.register_label, e.brochure_url, e.deadline, e.event_date,
                    e.event_end_date, e.image, e.is_active, e.model_question_paper_url,
                    CASE WHEN t.id IS NULL THEN 0 ELSE 1 END AS has_registration_template,
                    t.original_name AS registration_template_name,
                    t.uploaded_at AS registration_template_uploaded_at
             FROM events e
             LEFT JOIN portal_event_template t ON t.event_id = e.id
             ORDER BY COALESCE(e.event_date, '9999-12-31') ASC, e.id ASC";
    } else {
        $sql =
            "SELECT e.id, e.month, e.day, e.date_range, e.badge, e.status_label, e.status_type,
                    e.title, e.subtitle, e.description, e.venue, e.format, e.participants,
                    e.register_url, e.register_label, e.brochure_url, e.deadline, e.event_date,
                    e.event_end_date, e.image, e.is_active, e.model_question_paper_url,
                    CASE
                        WHEN t.id IS NULL THEN 0
                        WHEN e.deadline IS NOT NULL AND e.deadline <> '' AND e.deadline < CURDATE() THEN 0
                        ELSE 1
                    END AS has_registration_template,
                    t.original_name AS registration_template_name
             FROM events e
             LEFT JOIN portal_event_template t ON t.event_id = e.id
             WHERE e.is_active = 1
               AND (e.event_date IS NULL OR COALESCE(e.event_end_date, e.event_date) >= CURDATE())
             ORDER BY COALESCE(e.event_date, '9999-12-31') ASC, e.id ASC";
    }

    $stmt = $pdo->query($sql);
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    foreach ($rows as &$r) {
        $r['id']        = (int)$r['id'];
        $r['is_active'] = (int)$r['is_active'];
        $r['has_registration_template'] = (int)$r['has_registration_template'];
    }

    echo json_encode($rows);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database error']);
}
