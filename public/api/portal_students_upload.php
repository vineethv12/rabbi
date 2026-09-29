<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Admin-Password');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit(0); }

require_once __DIR__ . '/portal_middleware.php';
require_once __DIR__ . '/student_levels_helper.php';

// ── GET: download the XLSX template ──────────────────────────────────────────
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    require __DIR__ . '/portal_student_template.php';
    exit;
}

// ── POST: upload CSV or XLSX and bulk-create students ─────────────────────────
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405); echo json_encode(['error' => 'Method not allowed']); exit;
}

$claims    = portal_auth_or_admin('franchise');
$center_id = ($claims['role'] === 'admin') ? trim($_POST['center_id'] ?? '') : $claims['center_id'];
if ($claims['role'] === 'admin') {
    if ($center_id === '') {
        http_response_code(400); echo json_encode(['error' => 'center_id is required']); exit;
    }
    $center_check = portal_db()->prepare("SELECT 1 FROM portal_users WHERE login_id = ? AND role = 'franchise' LIMIT 1");
    $center_check->execute([$center_id]);
    if (!$center_check->fetchColumn()) {
        http_response_code(400); echo json_encode(['error' => 'Target franchise center does not exist']); exit;
    }
}

if (empty($_FILES['file'])) {
    http_response_code(400); echo json_encode(['error' => 'No file uploaded']); exit;
}

$file     = $_FILES['file'];
$ext      = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
$tmp_path = $file['tmp_name'];

if (!in_array($ext, ['csv', 'xlsx', 'txt'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Only CSV (.csv) or Excel (.xlsx) files are supported']);
    exit;
}

// Parse into rows
try {
    if ($ext === 'xlsx') {
        $all_rows = _parse_xlsx($tmp_path);
    } else {
        $all_rows = _parse_csv($tmp_path);
    }
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode(['error' => 'Could not read file: ' . $e->getMessage()]);
    exit;
}

if (count($all_rows) <= 1) {
    http_response_code(400);
    echo json_encode(['error' => 'The file has no data rows. Add students below the header row and re-upload.']);
    exit;
}

$data_rows = array_slice($all_rows, 1); // skip header

$pdo     = portal_db();
student_levels_ensure($pdo);
$added   = [];
$skipped = [];

foreach ($data_rows as $i => $row) {
    $row_num        = $i + 2;
    // Columns: Name, Father Name, Mother Name, DOB, Mobile, Gender, Blood Group,
    //          Address, Level, Email (optional), Anniversary (optional)
    $name           = trim($row[0] ?? '');
    $father_name    = trim($row[1] ?? '');
    $mother_contact = trim($row[2] ?? '');
    $dob_raw        = trim($row[3] ?? '');
    $mobile         = trim($row[4] ?? '');
    $gender         = trim($row[5] ?? '');
    $blood_group    = trim($row[6] ?? '');
    $address        = trim($row[7] ?? '');
    $level          = trim($row[8] ?? 'Beginner') ?: 'Beginner';
    $email          = trim($row[9] ?? '');
    $anniv_raw      = trim($row[10] ?? '');

    $req = [];
    if (!$name)           $req[] = 'Name';
    if (!$father_name)    $req[] = 'Father Name';
    if (!$mother_contact) $req[] = 'Mother Name';
    if (!$dob_raw)        $req[] = 'Date of Birth';
    if (!$mobile)         $req[] = 'Mobile';
    if (!$gender)         $req[] = 'Gender';
    if ($req) {
        $skipped[] = ['row' => $row_num, 'name' => $name ?: '(blank)', 'reason' => 'Missing: ' . implode(', ', $req)];
        continue;
    }

    $dob_obj = _parse_date($dob_raw);
    if (!$dob_obj) {
        $skipped[] = ['row' => $row_num, 'name' => $name, 'reason' => "Invalid Date of Birth: \"$dob_raw\" — use DD/MM/YYYY"];
        continue;
    }

    $dob_fmt  = $dob_obj->format('Y-m-d');
    $def_pass = '123456';
    $level = student_level_name($pdo, $level);
    if (!$level) {
        $skipped[] = ['row' => $row_num, 'name' => $name, 'reason' => 'Choose an available student level.'];
        continue;
    }

    $anniv_fmt = null;
    if ($anniv_raw) {
        $a = _parse_date($anniv_raw);
        if ($a) $anniv_fmt = $a->format('Y-m-d');
    }

    $join_date = date('Y-m-d');

    try {
        $pdo->beginTransaction();

        // Insert with PENDING placeholder — auto_increment id guarantees uniqueness
        $stmt = $pdo->prepare(
            "INSERT INTO students
               (enrollment_no, name, center_id, level, status, join_date, dob,
                father_name, mother_contact, mobile, anniversary, address, blood_group, gender, email)
             VALUES ('PENDING', ?, ?, ?, 'active', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
        );
        $stmt->execute([$name, $center_id, $level, $join_date, $dob_fmt,
                        $father_name, $mother_contact, $mobile, $anniv_fmt, $address, $blood_group, $gender, $email]);
        $student_id = (int)$pdo->lastInsertId();
        $pass_hash  = password_hash($def_pass, PASSWORD_DEFAULT);

        $upd   = $pdo->prepare("UPDATE students SET enrollment_no = ? WHERE id = ?");
        $stmt2 = $pdo->prepare(
            "INSERT INTO portal_users (login_id, name, password_hash, plain_password, role, center_id, email)
             VALUES (?, ?, ?, ?, 'student', ?, ?)"
        );

        // Generate <FIRSTNAME>-<NN>, retrying on the rare collision from a concurrent create.
        $enrollment_no = null;
        for ($attempt = 0; ; $attempt++) {
            $enrollment_no = portal_generate_enrollment_no($pdo, $center_id, $name);
            try {
                $upd->execute([$enrollment_no, $student_id]);
                $stmt2->execute([$enrollment_no, $name, $pass_hash, $def_pass, $center_id, $email]);
                break;
            } catch (PDOException $e) {
                if (str_contains($e->getMessage(), 'Duplicate') && $attempt < 5) continue;
                throw $e;
            }
        }

        $pdo->commit();
        $added[] = [
            'row'              => $row_num,
            'name'             => $name,
            'enrollment_no'    => $enrollment_no,
            'default_password' => $def_pass,
        ];
    } catch (Exception $e) {
        $pdo->rollBack();
        $msg = str_contains($e->getMessage(), 'Duplicate') ? 'Duplicate entry — skipped' : $e->getMessage();
        $skipped[] = ['row' => $row_num, 'name' => $name, 'reason' => $msg];
    }
}

echo json_encode([
    'success'       => true,
    'added_count'   => count($added),
    'skipped_count' => count($skipped),
    'added'         => $added,
    'skipped'       => $skipped,
]);

// ── Helpers ───────────────────────────────────────────────────────────────────

function _parse_csv(string $path): array {
    $handle = fopen($path, 'r');
    if (!$handle) throw new Exception('Cannot open file');
    $rows = [];
    while (($row = fgetcsv($handle)) !== false) {
        if (count(array_filter($row)) > 0) $rows[] = $row;
    }
    fclose($handle);
    return $rows;
}

/**
 * Minimal XLSX parser using ZipArchive + SimpleXML.
 * Supports shared strings and inline strings.
 */
function _parse_xlsx(string $path): array {
    if (!class_exists('ZipArchive')) {
        throw new Exception('ZipArchive extension not available — please upload a CSV file instead');
    }
    $zip = new ZipArchive();
    if ($zip->open($path) !== true) throw new Exception('Cannot open XLSX file');

    // Load shared strings
    $shared = [];
    $ss_xml = $zip->getFromName('xl/sharedStrings.xml');
    if ($ss_xml) {
        $ss = @simplexml_load_string($ss_xml);
        if ($ss) {
            foreach ($ss->si as $si) {
                if (isset($si->t)) {
                    $shared[] = (string)$si->t;
                } else {
                    $text = '';
                    foreach ($si->r as $r) $text .= (string)$r->t;
                    $shared[] = $text;
                }
            }
        }
    }

    // Find first sheet
    $sheet_name = 'xl/worksheets/sheet1.xml';
    $sheet_xml  = $zip->getFromName($sheet_name);
    $zip->close();

    if (!$sheet_xml) throw new Exception('Cannot find worksheet in XLSX file');

    $doc = @simplexml_load_string($sheet_xml);
    if (!$doc) throw new Exception('Cannot parse worksheet XML');

    $rows = [];
    foreach ($doc->sheetData->row as $row) {
        $cells   = [];
        $max_col = 0;
        foreach ($row->c as $cell) {
            $ref     = (string)$cell['r'];
            preg_match('/^([A-Z]+)/i', $ref, $m);
            $col_idx = _xlsx_col_index($m[1] ?? 'A');
            $max_col = max($max_col, $col_idx);

            $type = (string)$cell['t'];
            if ($type === 's') {
                $val = $shared[(int)(string)$cell->v] ?? '';
            } elseif ($type === 'inlineStr') {
                $val = (string)$cell->is->t;
            } elseif ($type === 'str') {
                $val = (string)$cell->v;
            } else {
                $val = (string)$cell->v;
            }
            $cells[$col_idx] = $val;
        }
        if (empty($cells)) continue;
        $row_arr = [];
        for ($i = 0; $i <= $max_col; $i++) {
            $row_arr[] = $cells[$i] ?? '';
        }
        $rows[] = $row_arr;
    }
    return $rows;
}

function _xlsx_col_index(string $col): int {
    $col   = strtoupper($col);
    $index = 0;
    for ($i = 0; $i < strlen($col); $i++) {
        $index = $index * 26 + (ord($col[$i]) - 64);
    }
    return $index - 1;
}

function _parse_date(string $s): ?DateTime {
    $s = trim($s);
    if ($s === '' || $s === '0') return null;

    // Excel stores dates as numeric serials (e.g. 45400 = 2024-04-18).
    // Convert: Unix timestamp = (serial - 25569) * 86400
    // Excel epoch is effectively Dec 30, 1899 (offset 25569 days from Unix epoch Jan 1, 1970).
    // Guard: 1 < serial < 2958466 (dates between Jan 2, 1900 and Dec 31, 9999)
    if (is_numeric($s) && !str_contains($s, '/') && !str_contains($s, '-') && !str_contains($s, '.')) {
        $serial = (float)$s;
        if ($serial > 1 && $serial < 2958466) {
            $ts = (int)(($serial - 25569) * 86400);
            $dt = new DateTime();
            $dt->setTimestamp($ts);
            return $dt;
        }
    }

    foreach (['d/m/Y', 'Y-m-d', 'd-m-Y', 'd.m.Y'] as $fmt) {
        $d = DateTime::createFromFormat($fmt, $s);
        if ($d && $d->format($fmt) === $s) return $d;
    }
    $ts = strtotime($s);
    if ($ts !== false) return (new DateTime())->setTimestamp($ts);
    return null;
}

/**
 * Generate a minimal valid XLSX template file (binary string).
 * Uses ZipArchive + XML — no external libraries needed.
 */
function _generate_xlsx_template(): string {
    if (!class_exists('ZipArchive')) {
        // Fallback: send CSV with xlsx extension note
        throw new Exception('ZipArchive not available');
    }

    $tmp = tempnam(sys_get_temp_dir(), 'rga_tpl_') . '.xlsx';

    $zip = new ZipArchive();
    $zip->open($tmp, ZipArchive::CREATE | ZipArchive::OVERWRITE);

    $zip->addFromString('[Content_Types].xml',
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' .
        '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' .
        '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' .
        '<Default Extension="xml" ContentType="application/xml"/>' .
        '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>' .
        '<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>' .
        '</Types>'
    );

    $zip->addFromString('_rels/.rels',
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' .
        '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' .
        '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>' .
        '</Relationships>'
    );

    $zip->addFromString('xl/workbook.xml',
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' .
        '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">' .
        '<sheets><sheet name="Students" sheetId="1" r:id="rId1"/></sheets>' .
        '</workbook>'
    );

    $zip->addFromString('xl/_rels/workbook.xml.rels',
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' .
        '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' .
        '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>' .
        '</Relationships>'
    );

    $template_rows = [
        ['Name', 'Father Name', 'Mother Name', 'Date of Birth (DD/MM/YYYY)', 'Mobile', 'Gender', 'Blood Group', 'Address', 'Level', 'Email (optional)', 'Anniversary (DD/MM/YYYY, optional)'],
        ['Arjun Kumar',  'Ramesh Kumar', 'Sunita Kumar', '15/04/2016', '9876543211', 'Male',   'B+', '12 MG Road, Bengaluru', 'Beginner', '',                  ''],
        ['Priya Sharma', 'Anil Sharma',  'Meena Sharma', '22/08/2015', '9876543213', 'Female', 'O+', '45 Park St, Bengaluru', 'Starter',  'priya@example.com', '10/02/2008'],
    ];

    $alpha  = range('A', 'Z');
    $xml    = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';
    $xml   .= '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>';
    foreach ($template_rows as $ri => $row) {
        $rn   = $ri + 1;
        $xml .= "<row r=\"$rn\">";
        foreach ($row as $ci => $val) {
            $col  = $alpha[$ci];
            $safe = htmlspecialchars((string)$val, ENT_XML1, 'UTF-8');
            $xml .= "<c r=\"{$col}{$rn}\" t=\"inlineStr\"><is><t>{$safe}</t></is></c>";
        }
        $xml .= '</row>';
    }
    $xml .= '</sheetData></worksheet>';

    $zip->addFromString('xl/worksheets/sheet1.xml', $xml);
    $zip->close();

    $contents = file_get_contents($tmp);
    @unlink($tmp);
    return $contents;
}
