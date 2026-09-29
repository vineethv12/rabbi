<?php
/**
 * Shared helpers for portal event bulk registration (template + submissions).
 * Mirrors the Node backend behaviour (api-server.js) on PHP + MySQL.
 *
 * - Files are stored OUTSIDE the web root (../../event_files, next to
 *   .portal_secret) and only served through authenticated endpoints.
 * - Tables are auto-created on first use (same pattern as portal_audit_helper).
 */

require_once __DIR__ . '/portal_middleware.php';

function _ev_upload_dir(): string {
    $dir = __DIR__ . '/../../event_files';
    if (!is_dir($dir)) @mkdir($dir, 0755, true);
    return $dir;
}

function _ev_ensure_tables(PDO $pdo): void {
    static $done = false;
    if ($done) return;
    $done = true;
    try {
        $pdo->exec("CREATE TABLE IF NOT EXISTS `portal_event_template` (
            `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
            `event_id` INT NULL,
            `event_name` VARCHAR(255) NOT NULL DEFAULT 'Event Registration',
            `filename` VARCHAR(255) NOT NULL,
            `original_name` VARCHAR(255) NOT NULL DEFAULT '',
            `uploaded_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            UNIQUE KEY `uniq_event_template_event` (`event_id`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
        $pdo->exec("CREATE TABLE IF NOT EXISTS `portal_event_regs` (
            `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
            `event_id` INT NULL,
            `center_id` VARCHAR(64) NOT NULL,
            `event_name` VARCHAR(255) NOT NULL DEFAULT 'Event Registration',
            `filename` VARCHAR(255) NOT NULL,
            `original_name` VARCHAR(255) NOT NULL DEFAULT '',
            `uploaded_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            `headers_json` TEXT NULL,
            `rows_json` MEDIUMTEXT NULL,
            `row_count` INT NOT NULL DEFAULT 0,
            `uploader_name` VARCHAR(150) NULL,
            `academy_name` VARCHAR(255) NULL,
            `city` VARCHAR(100) NULL,
            KEY `idx_center` (`center_id`),
            KEY `idx_event_regs_event` (`event_id`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
        // Upgrade installations created by the earlier singleton-template version.
        $templateEventCol = $pdo->query("SHOW COLUMNS FROM portal_event_template LIKE 'event_id'")->fetch();
        if (!$templateEventCol) {
            $pdo->exec("ALTER TABLE portal_event_template ADD COLUMN event_id INT NULL AFTER id");
        }
        $regEventCol = $pdo->query("SHOW COLUMNS FROM portal_event_regs LIKE 'event_id'")->fetch();
        if (!$regEventCol) {
            $pdo->exec("ALTER TABLE portal_event_regs ADD COLUMN event_id INT NULL AFTER id");
        }
        foreach ([
            'uploader_name' => "ALTER TABLE portal_event_regs ADD COLUMN uploader_name VARCHAR(150) NULL AFTER row_count",
            'academy_name'  => "ALTER TABLE portal_event_regs ADD COLUMN academy_name VARCHAR(255) NULL AFTER uploader_name",
            'city'          => "ALTER TABLE portal_event_regs ADD COLUMN city VARCHAR(100) NULL AFTER academy_name",
        ] as $column => $sql) {
            $hasColumn = $pdo->query("SHOW COLUMNS FROM portal_event_regs LIKE '$column'")->fetch();
            if (!$hasColumn) $pdo->exec($sql);
        }
        $idCol = $pdo->query("SHOW COLUMNS FROM portal_event_template LIKE 'id'")->fetch();
        if ($idCol && stripos((string)($idCol['Extra'] ?? ''), 'auto_increment') === false) {
            $pdo->exec("ALTER TABLE portal_event_template MODIFY id INT NOT NULL AUTO_INCREMENT");
        }
        $templateIndex = $pdo->query("SHOW INDEX FROM portal_event_template WHERE Key_name = 'uniq_event_template_event'")->fetch();
        if (!$templateIndex) {
            $pdo->exec("ALTER TABLE portal_event_template ADD UNIQUE KEY uniq_event_template_event (event_id)");
        }
        $regIndex = $pdo->query("SHOW INDEX FROM portal_event_regs WHERE Key_name = 'idx_event_regs_event'")->fetch();
        if (!$regIndex) {
            $pdo->exec("ALTER TABLE portal_event_regs ADD KEY idx_event_regs_event (event_id)");
        }
        // Backfill old records only when an event title identifies exactly one event.
        // Use small prepared updates instead of a self-referencing UPDATE so this
        // works reliably on Hostinger's MySQL/MariaDB versions.
        $findEvent = $pdo->prepare("SELECT id FROM events WHERE title = ? ORDER BY id");
        $templateExists = $pdo->prepare("SELECT id FROM portal_event_template WHERE event_id = ? LIMIT 1");
        $setTemplateEvent = $pdo->prepare("UPDATE portal_event_template SET event_id = ? WHERE id = ? AND event_id IS NULL");
        foreach ($pdo->query("SELECT id, event_name FROM portal_event_template WHERE event_id IS NULL")->fetchAll() as $legacy) {
            $findEvent->execute([$legacy['event_name']]);
            $matches = $findEvent->fetchAll(PDO::FETCH_COLUMN);
            if (count($matches) !== 1) continue;
            $eventId = (int)$matches[0];
            $templateExists->execute([$eventId]);
            if (!$templateExists->fetch()) $setTemplateEvent->execute([$eventId, $legacy['id']]);
        }

        $setRegEvent = $pdo->prepare("UPDATE portal_event_regs SET event_id = ? WHERE id = ? AND event_id IS NULL");
        foreach ($pdo->query("SELECT id, event_name FROM portal_event_regs WHERE event_id IS NULL")->fetchAll() as $legacy) {
            $findEvent->execute([$legacy['event_name']]);
            $matches = $findEvent->fetchAll(PDO::FETCH_COLUMN);
            if (count($matches) === 1) $setRegEvent->execute([(int)$matches[0], $legacy['id']]);
        }
    } catch (Throwable $e) {
        error_log('Event registration schema upgrade failed: ' . $e->getMessage());
        throw $e;
    }
}

function _ev_col_index(string $col): int {
    $col   = strtoupper($col);
    $index = 0;
    for ($i = 0; $i < strlen($col); $i++) {
        $index = $index * 26 + (ord($col[$i]) - 64);
    }
    return $index - 1;
}

/** Parse an .xlsx file into a 2-D array of strings (first worksheet). */
function _ev_parse_xlsx(string $path): array {
    if (!class_exists('ZipArchive')) return [];
    $zip = new ZipArchive();
    if ($zip->open($path) !== true) return [];

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

    $sheet_xml = $zip->getFromName('xl/worksheets/sheet1.xml');
    $zip->close();
    if (!$sheet_xml) return [];
    $doc = @simplexml_load_string($sheet_xml);
    if (!$doc) return [];

    $rows = [];
    foreach ($doc->sheetData->row as $row) {
        $cells   = [];
        $max_col = 0;
        foreach ($row->c as $cell) {
            $ref = (string)$cell['r'];
            preg_match('/^([A-Z]+)/i', $ref, $m);
            $col_idx = _ev_col_index($m[1] ?? 'A');
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
        for ($i = 0; $i <= $max_col; $i++) $row_arr[] = $cells[$i] ?? '';
        $rows[] = $row_arr;
    }
    return $rows;
}

/**
 * Extract registration rows from a filled event sheet: find the header row
 * (contains "student name") and read data rows until an empty/total row.
 * Mirrors extractEventRows() in api-server.js.
 * @return array{headers: ?array, rows: array}
 */
function _ev_extract_rows(string $path): array {
    $all = _ev_parse_xlsx($path);
    if (!$all) return ['headers' => null, 'rows' => []];

    $h_idx = -1;
    foreach ($all as $i => $r) {
        foreach ((array)$r as $c) {
            if (preg_match('/student\s*name/i', (string)$c)) { $h_idx = $i; break 2; }
        }
    }
    if ($h_idx === -1) return ['headers' => null, 'rows' => []];

    $headers = array_map(fn($c) => trim((string)$c), $all[$h_idx]);
    $name_col = -1;
    foreach ($headers as $ci => $h) {
        if (preg_match('/student\s*name/i', $h)) { $name_col = $ci; break; }
    }

    $rows = [];
    for ($i = $h_idx + 1; $i < count($all); $i++) {
        $r = $all[$i] ?? [];
        $name = trim((string)($r[$name_col] ?? ''));
        if ($name === '') continue;
        if (preg_match('/^total/i', $name) || preg_match('/^sample\s/i', $name)) continue;
        $row = [];
        foreach ($headers as $ci => $_) $row[] = trim((string)($r[$ci] ?? ''));
        $rows[] = $row;
    }
    return ['headers' => $headers, 'rows' => $rows];
}

/** Validate an uploaded event file; returns [ok(bool), error(string)]. */
function _ev_validate_upload(array $file): array {
    if (!empty($file['error'])) return [false, 'Upload failed (error code ' . $file['error'] . ')'];
    if (($file['size'] ?? 0) > 10 * 1024 * 1024) return [false, 'File too large (max 10 MB)'];
    $ext = strtolower(pathinfo($file['name'] ?? '', PATHINFO_EXTENSION));
    if (!in_array($ext, ['xlsx', 'xls', 'csv'])) return [false, 'Only Excel (.xlsx/.xls) or CSV files are allowed'];
    return [true, ''];
}

/** Move an uploaded file into the event dir with a random name; returns filename or null. */
function _ev_store_upload(array $file): ?string {
    $ext = strtolower(pathinfo($file['name'] ?? '', PATHINFO_EXTENSION));
    $filename = 'event_' . round(microtime(true) * 1000) . '_' . bin2hex(random_bytes(4)) . '.' . $ext;
    $dest = _ev_upload_dir() . '/' . $filename;
    if (!move_uploaded_file($file['tmp_name'], $dest)) return null;
    return $filename;
}

/** Send a stored event file as an attachment download and exit. */
function _ev_send_file(string $filename, string $download_name, string $content_type = 'application/octet-stream'): void {
    $fp = _ev_upload_dir() . '/' . basename($filename);
    if (!is_file($fp)) {
        http_response_code(404);
        header('Content-Type: application/json');
        echo json_encode(['error' => 'File is missing on the server']);
        exit;
    }
    header('Content-Type: ' . $content_type);
    header('Content-Disposition: attachment; filename="' . str_replace('"', '', $download_name) . '"');
    header('Content-Length: ' . filesize($fp));
    header('Cache-Control: no-cache');
    readfile($fp);
    exit;
}

function _ev_xlsx_column_name(int $index): string {
    $name = '';
    do {
        $name = chr(65 + ($index % 26)) . $name;
        $index = intdiv($index, 26) - 1;
    } while ($index >= 0);
    return $name;
}

/** Create and send a minimal multi-sheet XLSX workbook without external packages. */
function _ev_send_combined_registration_export(string $eventName, array $uploads): void {
    if (!class_exists('ZipArchive')) {
        http_response_code(500);
        header('Content-Type: application/json');
        echo json_encode(['error' => 'Excel export is unavailable on this server']);
        exit;
    }

    $participantHeaders = [];
    foreach ($uploads as $upload) {
        $headers = json_decode($upload['headers_json'] ?? '[]', true);
        if (!is_array($headers)) continue;
        foreach ($headers as $header) {
            $header = trim((string)$header);
            if ($header !== '' && !in_array($header, $participantHeaders, true)) $participantHeaders[] = $header;
        }
    }

    $metadataHeaders = ['Upload ID', 'Source', 'Uploaded By', 'Academy', 'City', 'Uploaded At', 'Original File'];
    $combinedRows = [array_merge($metadataHeaders, $participantHeaders)];
    $summaryRows = [[
        'Upload ID', 'Source', 'Uploaded By', 'Academy', 'City',
        'Uploaded At', 'Original File', 'Participant Rows Detected'
    ]];

    foreach ($uploads as $upload) {
        $source = ($upload['center_id'] ?? '') === 'PUBLIC'
            ? 'Public website'
            : 'Franchise ' . ($upload['center_id'] ?? '—');
        $metadata = [
            (string)($upload['id'] ?? ''),
            $source,
            (string)($upload['uploader_name'] ?? ''),
            (string)($upload['academy_name'] ?? ''),
            (string)($upload['city'] ?? ''),
            (string)($upload['uploaded_at'] ?? ''),
            (string)($upload['original_name'] ?? ''),
        ];
        $summaryRows[] = array_merge($metadata, [(string)($upload['row_count'] ?? 0)]);

        $headers = json_decode($upload['headers_json'] ?? '[]', true);
        $rows = json_decode($upload['rows_json'] ?? '[]', true);
        if (!is_array($headers)) $headers = [];
        if (!is_array($rows) || count($rows) === 0) {
            $combinedRows[] = array_merge($metadata, array_fill(0, count($participantHeaders), ''));
            continue;
        }

        foreach ($rows as $row) {
            $byHeader = [];
            foreach ($headers as $index => $header) {
                $byHeader[trim((string)$header)] = (string)($row[$index] ?? '');
            }
            $participantValues = array_map(fn($header) => $byHeader[$header] ?? '', $participantHeaders);
            $combinedRows[] = array_merge($metadata, $participantValues);
        }
    }

    $makeSheetXml = function(array $rows): string {
        $xml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';
        $xml .= '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>';
        foreach ($rows as $rowIndex => $row) {
            $rowNumber = $rowIndex + 1;
            $xml .= '<row r="' . $rowNumber . '">';
            foreach ($row as $columnIndex => $value) {
                $cell = _ev_xlsx_column_name($columnIndex) . $rowNumber;
                $safe = htmlspecialchars((string)$value, ENT_XML1, 'UTF-8');
                $xml .= '<c r="' . $cell . '" t="inlineStr"><is><t xml:space="preserve">' . $safe . '</t></is></c>';
            }
            $xml .= '</row>';
        }
        return $xml . '</sheetData></worksheet>';
    };

    $tmp = tempnam(sys_get_temp_dir(), 'rga_event_export_') . '.xlsx';
    $zip = new ZipArchive();
    $zip->open($tmp, ZipArchive::CREATE | ZipArchive::OVERWRITE);
    $zip->addFromString('[Content_Types].xml',
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' .
        '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' .
        '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' .
        '<Default Extension="xml" ContentType="application/xml"/>' .
        '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>' .
        '<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>' .
        '<Override PartName="/xl/worksheets/sheet2.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>' .
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
        '<sheets><sheet name="Combined Registrations" sheetId="1" r:id="rId1"/><sheet name="Upload Summary" sheetId="2" r:id="rId2"/></sheets></workbook>'
    );
    $zip->addFromString('xl/_rels/workbook.xml.rels',
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' .
        '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' .
        '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>' .
        '<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet2.xml"/>' .
        '</Relationships>'
    );
    $zip->addFromString('xl/worksheets/sheet1.xml', $makeSheetXml($combinedRows));
    $zip->addFromString('xl/worksheets/sheet2.xml', $makeSheetXml($summaryRows));
    $zip->close();

    $safeName = preg_replace('/[^A-Za-z0-9_-]+/', '_', $eventName) ?: 'event';
    header('Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    header('Content-Disposition: attachment; filename="' . $safeName . '_combined_registrations.xlsx"');
    header('Content-Length: ' . filesize($tmp));
    header('Cache-Control: no-cache');
    readfile($tmp);
    @unlink($tmp);
    exit;
}
