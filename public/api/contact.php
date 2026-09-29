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

$body    = json_decode(file_get_contents('php://input'), true);
$name    = isset($body['name'])    ? trim($body['name'])    : '';
$email   = isset($body['email'])   ? trim($body['email'])   : '';
$phone   = isset($body['phone'])   ? trim($body['phone'])   : '';
$city    = isset($body['city'])    ? trim($body['city'])    : '';
$program = isset($body['program']) ? trim($body['program']) : '';
$message = isset($body['message']) ? trim($body['message']) : '';

if ($name === '' || $phone === '') {
    http_response_code(400);
    echo json_encode(['error' => 'Full name and phone number are required.']);
    exit;
}

// ── Save to database first so nothing is lost ─────────────────────────────
require_once __DIR__ . '/../config.php';

$dbSaved = false;
try {
    $pdo = new PDO(
        "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4",
        DB_USER,
        DB_PASS,
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );

    $stmt = $pdo->prepare(
        "INSERT INTO enquiries (name, phone, email, city, program, message, source)
         VALUES (?, ?, ?, ?, ?, ?, 'website')"
    );
    $stmt->execute([$name, $phone, $email, $city, $program, $message]);
    $dbSaved = true;

} catch (Exception $e) {
    error_log("contact.php: DB insert failed — " . $e->getMessage());
}

// ── Send email notification ───────────────────────────────────────────────
$to      = 'indianabacusblr@gmail.com';
$subject = 'New Enquiry — Rabbi Global Academy';

$programLabels = [
    'abacus'    => 'Abacus Program',
    'vedic'     => 'Vedic Mathematics',
    'brain'     => 'Brain Development',
    'franchise' => 'Franchise Opportunity',
    'teacher'   => 'Teacher Training',
    'other'     => 'Other Inquiry',
];
$programLabel = $program !== '' ? ($programLabels[$program] ?? $program) : 'Not specified';

$mailBody = "New enquiry submitted via the Rabbi Global Academy website.\n\n"
          . "─────────────────────────────\n"
          . "Name    : {$name}\n"
          . "Phone   : {$phone}\n"
          . "Email   : " . ($email !== '' ? $email : 'Not provided') . "\n"
          . "City    : " . ($city  !== '' ? $city  : 'Not provided') . "\n"
          . "Interest: {$programLabel}\n"
          . "─────────────────────────────\n"
          . "Message :\n{$message}\n\n"
          . "─────────────────────────────\n"
          . "Submitted at: " . date('d M Y, h:i A') . " IST\n";

$scheme  = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
$rawHost = $_SERVER['HTTP_HOST'] ?? 'rabbiglobalacademy.com';
$host    = preg_replace('/[^a-zA-Z0-9.\-]/', '', strtok($rawHost, ':'));
if ($host === '') { $host = 'rabbiglobalacademy.com'; }

$headers = "From: website@{$host}\r\n";
if ($email !== '' && filter_var($email, FILTER_VALIDATE_EMAIL)) {
    $safeEmail = str_replace(["\r", "\n"], '', $email);
    $headers .= "Reply-To: {$safeEmail}\r\n";
}
$headers .= "X-Mailer: PHP/" . phpversion();

$sent = mail($to, $subject, $mailBody, $headers);

if (!$sent) {
    error_log("contact.php: mail() failed for enquiry from {$name} ({$phone})" . ($dbSaved ? " — saved to DB" : " — DB save also failed"));
}

// If neither DB nor email succeeded, tell the user to try another way
if (!$dbSaved && !$sent) {
    http_response_code(500);
    echo json_encode(['error' => 'Could not save your enquiry. Please call us directly or try again later.']);
    exit;
}

echo json_encode(['success' => true, 'message' => 'Thank you! We will get back to you shortly.']);
