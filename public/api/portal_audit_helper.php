<?php
/**
 * portal_audit_helper.php
 * Shared helper — write audit events to MySQL portal_audit_log table.
 *
 * Columns (auto-migrated): id | action | actor_id | actor_role | actor_name | target | detail | changes | created_at
 *   actor_name — display name of the person who acted (center name, student name, etc.)
 *   detail     — human-readable one-liner
 *   changes    — JSON array of {field, old, new} diffs for update actions
 */

if (!function_exists('_portal_audit_ensure_table')) {
    function _portal_audit_ensure_table(PDO $pdo): void {
        static $done = false;
        if ($done) return;
        $done = true;
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS `portal_audit_log` (
                `id`         INT AUTO_INCREMENT PRIMARY KEY,
                `action`     VARCHAR(80)  NOT NULL,
                `actor_id`   VARCHAR(120) NOT NULL DEFAULT '',
                `actor_role` VARCHAR(30)  NOT NULL DEFAULT '',
                `actor_name` VARCHAR(255) NOT NULL DEFAULT '',
                `target`     VARCHAR(255) NOT NULL DEFAULT '',
                `detail`     TEXT NOT NULL DEFAULT '',
                `changes`    TEXT NOT NULL DEFAULT '',
                `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                INDEX `idx_action`     (`action`),
                INDEX `idx_actor_role` (`actor_role`),
                INDEX `idx_created_at` (`created_at`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        ");
        // Upgrade older schemas that lack the new columns
        try { $pdo->exec("ALTER TABLE portal_audit_log ADD COLUMN `actor_name` VARCHAR(255) NOT NULL DEFAULT '' AFTER `actor_role`"); } catch (Throwable $e) {}
        try { $pdo->exec("ALTER TABLE portal_audit_log ADD COLUMN `changes` TEXT NOT NULL DEFAULT '' AFTER `detail`"); } catch (Throwable $e) {}
    }
}

if (!function_exists('_portal_audit_write')) {
    /**
     * @param PDO    $pdo
     * @param string $action      e.g. student_created, student_updated, report_created
     * @param string $actor_id    login ID / center_id / 'admin'
     * @param string $actor_role  'admin' | 'franchise' | 'student'
     * @param string $target      what was acted on (enrollment_no, report id, etc.)
     * @param string $detail      human-readable one-liner
     * @param string $actor_name  display name of the actor (center name, student name…)
     * @param array  $changes     list of ['field'=>…,'old'=>…,'new'=>…] diffs
     */
    function _portal_audit_write(
        PDO    $pdo,
        string $action,
        string $actor_id,
        string $actor_role,
        string $target     = '',
        string $detail     = '',
        string $actor_name = '',
        array  $changes    = []
    ): void {
        try {
            _portal_audit_ensure_table($pdo);
            $changesJson = $changes ? json_encode($changes, JSON_UNESCAPED_UNICODE) : '';
            $pdo->prepare(
                "INSERT INTO portal_audit_log
                    (action, actor_id, actor_role, actor_name, target, detail, changes)
                 VALUES (?, ?, ?, ?, ?, ?, ?)"
            )->execute([$action, $actor_id, $actor_role, $actor_name, $target, $detail, $changesJson]);
        } catch (Throwable $e) {
            // Silently fail — audit must never break core operations
        }
    }
}

if (!function_exists('_portal_audit_diff')) {
    /**
     * Build a changes array from old vs. new associative arrays.
     * Only includes fields that actually changed; skips timestamps and IDs by default.
     */
    function _portal_audit_diff(array $old, array $new, array $skip = ['id','created_at','updated_at']): array {
        $diffs = [];
        foreach ($new as $field => $newVal) {
            if (in_array($field, $skip, true)) continue;
            $oldVal = $old[$field] ?? null;
            if ((string)$oldVal !== (string)$newVal) {
                $diffs[] = ['field' => $field, 'old' => (string)$oldVal, 'new' => (string)$newVal];
            }
        }
        return $diffs;
    }
}
