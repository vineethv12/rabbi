<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Admin-Password');
header('Cache-Control: no-store');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') exit;
require_once __DIR__ . '/portal_middleware.php';
$claims = portal_auth_or_admin('franchise');
$method = $_SERVER['REQUEST_METHOD'];
function template_error(int $status, string $message): never {
    http_response_code($status);
    echo json_encode(['error' => $message]);
    exit;
}
if (!in_array($method, ['GET', 'POST'], true)) template_error(405, 'Method not allowed');
if ($method === 'POST' && $claims['role'] !== 'admin') template_error(403, 'Only admins can upload a student template.');

try {
    $pdo = portal_db();
    $pdo->exec("CREATE TABLE IF NOT EXISTS portal_student_template (
        id TINYINT PRIMARY KEY,
        original_name VARCHAR(255) NOT NULL,
        mime_type VARCHAR(100) NOT NULL,
        file_content MEDIUMBLOB NOT NULL,
        uploaded_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
    if ($method === 'POST') {
        $file = $_FILES['file'] ?? null;
        if (!$file || $file['error'] !== UPLOAD_ERR_OK) template_error(400, 'Choose a file that uploaded successfully.');
        if ($file['size'] <= 0 || $file['size'] > 5 * 1024 * 1024) template_error(400, 'Template must be between 1 byte and 5 MB.');
        $name = basename(str_replace('\\', '/', $file['name']));
        $name = preg_replace('/[\x00-\x1F\x7F]/', '', $name);
        if (strlen($name) > 240) template_error(400, 'Please shorten the filename.');
        $extension = strtolower(pathinfo($name, PATHINFO_EXTENSION));
        if (!in_array($extension, ['xlsx', 'csv'], true)) template_error(400, 'Upload an Excel (.xlsx) or CSV (.csv) template.');
        if ($extension === 'xlsx') {
            if (!class_exists('ZipArchive')) template_error(503, 'The PHP ZIP extension must be enabled to upload Excel templates.');
            $zip = new ZipArchive();
            if ($zip->open($file['tmp_name']) !== true) template_error(400, 'This is not a valid Excel workbook.');
            $valid = $zip->locateName('[Content_Types].xml') !== false &&
                $zip->locateName('xl/workbook.xml') !== false &&
                $zip->locateName('xl/worksheets/sheet1.xml') !== false;
            $zip->close();
            if (!$valid) template_error(400, 'The workbook must contain a worksheet.');
        } else {
            $handle = fopen($file['tmp_name'], 'r');
            $headers = fgetcsv($handle);
            fclose($handle);
            if (!$headers || count($headers) < 11) template_error(400, 'CSV templates need the 11 student columns in the order shown.');
        }
        $mime = $extension === 'xlsx'
            ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' : 'text/csv';
        $statement = $pdo->prepare("INSERT INTO portal_student_template (id, original_name, mime_type, file_content)
            VALUES (1, ?, ?, ?) ON DUPLICATE KEY UPDATE original_name=VALUES(original_name),
            mime_type=VALUES(mime_type), file_content=VALUES(file_content), uploaded_at=CURRENT_TIMESTAMP");
        $statement->execute([$name, $mime, file_get_contents($file['tmp_name'])]);
    }
    if ($method === 'POST' || isset($_GET['meta'])) {
        $template = $pdo->query("SELECT original_name, OCTET_LENGTH(file_content) AS size, uploaded_at
            FROM portal_student_template WHERE id=1")->fetch(PDO::FETCH_ASSOC);
        echo json_encode(['template' => $template ?: null]);
        exit;
    }
    $template = $pdo->query("SELECT * FROM portal_student_template WHERE id=1")->fetch(PDO::FETCH_ASSOC);
    if (!$template) template_error(404, 'No student template has been uploaded yet. Ask an admin to upload one.');
    header('Content-Type: ' . $template['mime_type']);
    header('X-Content-Type-Options: nosniff');
    header("Content-Disposition: attachment; filename=\"student_template." .
        pathinfo($template['original_name'], PATHINFO_EXTENSION) .
        "\"; filename*=UTF-8''" . rawurlencode($template['original_name']));
    header('Content-Length: ' . strlen($template['file_content']));
    echo $template['file_content'];
} catch (Throwable $error) {
    error_log('Student template operation failed: ' . $error->getMessage());
    template_error(500, 'Unable to access the student template. Please check the server logs.');
}