<?php
function student_levels_ensure(PDO $pdo): void {
    $pdo->exec("CREATE TABLE IF NOT EXISTS student_levels (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL UNIQUE,
        sort_order INT NOT NULL DEFAULT 0,
        active TINYINT NOT NULL DEFAULT 1
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
    $pdo->exec("CREATE TABLE IF NOT EXISTS student_level_migrations (
        name VARCHAR(100) PRIMARY KEY
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
    $pdo->beginTransaction();
    try {
        $migration = $pdo->prepare("INSERT IGNORE INTO student_level_migrations (name) VALUES (?)");
        $migration->execute(['initial_catalog']);
        if ($migration->rowCount()) {
            $insert = $pdo->prepare("INSERT IGNORE INTO student_levels (name, sort_order) VALUES (?, ?)");
            $defaults = ['Beginner', 'Starter', 'Mover', 'Rider', 'Racer', 'Flyer', 'Achiever', 'Star'];
            foreach ($defaults as $order => $name) $insert->execute([$name, $order]);
            $pdo->exec("UPDATE students SET level='Rider' WHERE level='Riser'");
            $existing = $pdo->query("SELECT DISTINCT level FROM students WHERE TRIM(level)<>''")->fetchAll(PDO::FETCH_COLUMN);
            foreach ($existing as $order => $name) $insert->execute([trim($name), count($defaults) + $order]);
        }
        $pdo->commit();
    } catch (Throwable $error) {
        $pdo->rollBack();
        throw $error;
    }
}

function student_level_name(PDO $pdo, string $name): ?string {
    $name = trim($name);
    if (strcasecmp($name, 'Riser') === 0) $name = 'Rider';
    $query = $pdo->prepare("SELECT name FROM student_levels WHERE name=? AND active=1");
    $query->execute([$name]);
    return $query->fetchColumn() ?: null;
}