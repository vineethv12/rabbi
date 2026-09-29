<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit(0); }
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

require_once __DIR__ . '/../config.php';

$body     = json_decode(file_get_contents('php://input'), true);
$password = isset($body['password']) ? $body['password'] : '';

if ($password === '' || $password !== ADMIN_PASSWORD) {
    http_response_code(401);
    echo json_encode(['error' => 'Invalid password']);
    exit;
}

echo json_encode(['success' => true]);
