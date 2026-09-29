<?php
function event_resource_ensure(PDO $pdo): void {
    if (!$pdo->query("SHOW COLUMNS FROM events LIKE 'model_question_paper_url'")->fetch()) {
        try {
            $pdo->exec("ALTER TABLE events ADD COLUMN model_question_paper_url VARCHAR(2000) NOT NULL DEFAULT ''");
        } catch (PDOException $error) {
            // Another request may have applied the same migration.
            if (!$pdo->query("SHOW COLUMNS FROM events LIKE 'model_question_paper_url'")->fetch()) throw $error;
        }
    }
}