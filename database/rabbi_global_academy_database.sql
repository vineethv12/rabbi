-- ============================================================
--  Rabbi Global Academy — Complete Database (clean, all-in-one)
--  All tables + every migration already merged in. Run ONCE on a
--  fresh database: phpMyAdmin → [your DB] → SQL tab → paste → Go
--  Hostinger: hPanel → Databases → phpMyAdmin
--  Safe to re-run: every statement uses IF NOT EXISTS.
-- ============================================================

SET FOREIGN_KEY_CHECKS = 0;
SET NAMES utf8mb4;

-- ────────────────────────────────────────────────────────────
-- 1. PORTAL USERS (franchise + student login accounts)
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `portal_users` (
    `id`             INT AUTO_INCREMENT PRIMARY KEY,
    `login_id`       VARCHAR(100) NOT NULL UNIQUE,
    `name`           VARCHAR(255) NOT NULL,
    `password_hash`  VARCHAR(255) NOT NULL,
    `plain_password` VARCHAR(255) NULL DEFAULT NULL,
    `role`           ENUM('franchise','student') NOT NULL,
    `center_id`      VARCHAR(100) NOT NULL DEFAULT '',
    `email`          VARCHAR(255) NOT NULL DEFAULT '',
    `created_at`     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_role`      (`role`),
    INDEX `idx_center_id` (`center_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ────────────────────────────────────────────────────────────
-- 2. STUDENTS (full enrollment records)
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `students` (
    `id`             INT AUTO_INCREMENT PRIMARY KEY,
    `enrollment_no`  VARCHAR(100) NOT NULL UNIQUE,
    `name`           VARCHAR(255) NOT NULL,
    `center_id`      VARCHAR(100) NOT NULL DEFAULT '',
    `level`          VARCHAR(100) NOT NULL DEFAULT '',
    `status`         ENUM('active','inactive') NOT NULL DEFAULT 'active',
    `join_date`      DATE NULL,
    `dob`            DATE NULL,
    `father_name`    VARCHAR(255) NOT NULL DEFAULT '',
    `mother_contact` VARCHAR(50)  NOT NULL DEFAULT '',
    `mobile`         VARCHAR(50)  NOT NULL DEFAULT '',
    `anniversary`    DATE NULL,
    `photo`          VARCHAR(255) NOT NULL DEFAULT '',
    `address`        TEXT NOT NULL DEFAULT '',
    `blood_group`    VARCHAR(10)  NOT NULL DEFAULT '',
    `gender`         VARCHAR(20)  NOT NULL DEFAULT '',
    `parent_name`    VARCHAR(255) NOT NULL DEFAULT '',
    `parent_contact` VARCHAR(50)  NOT NULL DEFAULT '',
    `email`          VARCHAR(255) NOT NULL DEFAULT '',
    `notes`          TEXT NOT NULL DEFAULT '',
    `reg_no`         VARCHAR(50)  NOT NULL DEFAULT '',
    `created_at`     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_center_id`     (`center_id`),
    INDEX `idx_status`        (`status`),
    INDEX `idx_enrollment_no` (`enrollment_no`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ────────────────────────────────────────────────────────────
-- 3. STUDENT REPORTS (attendance + skill metrics)
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `student_reports` (
    `id`                    INT AUTO_INCREMENT PRIMARY KEY,
    `enrollment_no`         VARCHAR(100) NOT NULL,
    `center_id`             VARCHAR(100) NOT NULL DEFAULT '',
    `report_date`           DATE NOT NULL,
    `attendance`            ENUM('present','absent') NOT NULL DEFAULT 'present',
    `sw_direct_view`        TINYINT NOT NULL DEFAULT 0,
    `sw_indirect_view`      TINYINT NOT NULL DEFAULT 0,
    `sw_right_hand_writing` TINYINT NOT NULL DEFAULT 0,
    `sw_left_hand_writing`  TINYINT NOT NULL DEFAULT 0,
    `number_drop`           INT NOT NULL DEFAULT 0,
    `decimal_drop`          INT NOT NULL DEFAULT 0,
    `pagework_type`         ENUM('class','homework') NOT NULL DEFAULT 'class',
    `book_a_page`           INT NOT NULL DEFAULT 0,
    `book_b_page`           INT NOT NULL DEFAULT 0,
    `hw_book_a_page`        INT NOT NULL DEFAULT 0,
    `hw_book_b_page`        INT NOT NULL DEFAULT 0,
    `activity`              TEXT NOT NULL DEFAULT '',
    `created_at`            DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at`            DATETIME NULL DEFAULT NULL,
    INDEX `idx_enrollment_no` (`enrollment_no`),
    INDEX `idx_center_id`     (`center_id`),
    INDEX `idx_report_date`   (`report_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ────────────────────────────────────────────────────────────
-- 4. EVENTS (competitions & academy events)
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `events` (
    `id`             INT AUTO_INCREMENT PRIMARY KEY,
    `event_date`     DATE NULL,
    `month`          VARCHAR(20)  NOT NULL DEFAULT '',
    `day`            VARCHAR(10)  NOT NULL DEFAULT '',
    `date_range`     VARCHAR(100) NOT NULL DEFAULT '',
    `badge`          VARCHAR(50)  NOT NULL DEFAULT '',
    `status_label`   VARCHAR(50)  NOT NULL DEFAULT '',
    `status_type`    ENUM('open','soon','early','closed') NOT NULL DEFAULT 'soon',
    `title`          VARCHAR(255) NOT NULL,
    `subtitle`       VARCHAR(255) NOT NULL DEFAULT '',
    `description`    TEXT NOT NULL DEFAULT '',
    `venue`          VARCHAR(255) NOT NULL DEFAULT '',
    `format`         VARCHAR(100) NOT NULL DEFAULT '',
    `participants`   VARCHAR(100) NOT NULL DEFAULT '',
    `register_url`   VARCHAR(500) NOT NULL DEFAULT '',
    `register_label` VARCHAR(100) NOT NULL DEFAULT '',
    `brochure_url`   VARCHAR(500) NOT NULL DEFAULT '',
    `model_question_paper_url` VARCHAR(2000) NOT NULL DEFAULT '',
    `deadline`       VARCHAR(100) NOT NULL DEFAULT '',
    `is_active`      TINYINT(1) NOT NULL DEFAULT 1,
    `created_at`     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_is_active`  (`is_active`),
    INDEX `idx_event_date` (`event_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ────────────────────────────────────────────────────────────
-- 5. NEWS / UPDATES / STORIES (home page feed + admin manager)
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `news` (
    `id`         INT AUTO_INCREMENT PRIMARY KEY,
    `title`      VARCHAR(255) NOT NULL,
    `category`   VARCHAR(40)  NOT NULL DEFAULT 'News',
    `news_date`  DATE NULL,
    `summary`    TEXT NULL,
    `body`       MEDIUMTEXT NULL,
    `image`      VARCHAR(255) NULL,
    `video`      VARCHAR(255) NULL DEFAULT NULL,
    `link_url`   VARCHAR(500) NULL,
    `is_active`  TINYINT(1) NOT NULL DEFAULT 1,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_active`   (`is_active`),
    INDEX `idx_newsdate` (`news_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ────────────────────────────────────────────────────────────
-- 6. GALLERY IMAGES & VIDEOS (website photo/video gallery)
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `gallery_images` (
    `id`           INT AUTO_INCREMENT PRIMARY KEY,
    `year`         INT NULL DEFAULT NULL,
    `caption`      VARCHAR(255) NOT NULL DEFAULT '',
    `category`     VARCHAR(100) NOT NULL DEFAULT 'General',
    `display_type` ENUM('year','category') NOT NULL DEFAULT 'year',
    `media_type`   ENUM('image','video') NOT NULL DEFAULT 'image',
    `filename`     VARCHAR(255) NOT NULL,
    `uploaded_at`  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_year`       (`year`),
    INDEX `idx_media_type` (`media_type`),
    INDEX `idx_category`   (`category`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ────────────────────────────────────────────────────────────
-- 7. HOME IMAGES (hero / gallery / awards / founders sections)
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `home_images` (
    `id`          INT AUTO_INCREMENT PRIMARY KEY,
    `section`     ENUM('hero','gallery','awards','founders') NOT NULL,
    `filename`    VARCHAR(255) NOT NULL,
    `caption`     VARCHAR(255) NOT NULL DEFAULT '',
    `sort_order`  INT NOT NULL DEFAULT 0,
    `uploaded_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_section` (`section`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ────────────────────────────────────────────────────────────
-- 8. ENQUIRIES (contact / enroll form leads)
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `enquiries` (
    `id`           INT AUTO_INCREMENT PRIMARY KEY,
    `name`         VARCHAR(255) NOT NULL,
    `phone`        VARCHAR(50)  NOT NULL,
    `email`        VARCHAR(255) NOT NULL DEFAULT '',
    `city`         VARCHAR(100) NOT NULL DEFAULT '',
    `program`      VARCHAR(50)  NOT NULL DEFAULT '',
    `message`      TEXT NOT NULL DEFAULT '',
    `source`       VARCHAR(100) NOT NULL DEFAULT 'website',
    `status`       ENUM('new','contacted','resolved') NOT NULL DEFAULT 'new',
    `submitted_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_status`       (`status`),
    INDEX `idx_program`      (`program`),
    INDEX `idx_submitted_at` (`submitted_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ────────────────────────────────────────────────────────────
-- 9. PORTAL NOTIFICATIONS (admin → centers/students, center → students)
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `portal_notifications` (
    `id`                   INT AUTO_INCREMENT PRIMARY KEY,
    `scope`                ENUM('all_centers','all_students','center_students','student') NOT NULL,
    `target_center_id`     VARCHAR(100) NOT NULL DEFAULT '',
    `target_enrollment_no` VARCHAR(100) NOT NULL DEFAULT '',
    `title`                VARCHAR(255) NOT NULL,
    `message`              TEXT NOT NULL,
    `sender_role`          ENUM('admin','franchise') NOT NULL DEFAULT 'admin',
    `sender_id`            VARCHAR(100) NOT NULL DEFAULT '',
    `created_at`           DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_scope`             (`scope`),
    INDEX `idx_target_center_id`  (`target_center_id`),
    INDEX `idx_target_enrollment` (`target_enrollment_no`),
    INDEX `idx_created_at`        (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ────────────────────────────────────────────────────────────
-- 10. NOTIFICATION READS (per-user read receipts)
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `notification_reads` (
    `id`              INT AUTO_INCREMENT PRIMARY KEY,
    `notification_id` INT NOT NULL,
    `login_id`        VARCHAR(100) NOT NULL,
    `read_at`         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY `uq_notif_user` (`notification_id`, `login_id`),
    INDEX `idx_login_id` (`login_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ────────────────────────────────────────────────────────────
-- 11. LEARNING VIDEOS (temporary videos shared by franchise)
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `learning_videos` (
    `id`          INT AUTO_INCREMENT PRIMARY KEY,
    `center_id`   VARCHAR(100) NOT NULL,
    `title`       VARCHAR(255) NOT NULL DEFAULT 'Learning Video',
    `filename`    VARCHAR(255) NOT NULL,
    `uploaded_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `expires_at`  DATETIME NOT NULL,
    INDEX `idx_center_id`  (`center_id`),
    INDEX `idx_expires_at` (`expires_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ────────────────────────────────────────────────────────────
-- 12. LEARNING VIDEO STUDENTS (which students can see which video)
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `learning_video_students` (
    `id`            INT AUTO_INCREMENT PRIMARY KEY,
    `video_id`      INT NOT NULL,
    `enrollment_no` VARCHAR(100) NOT NULL,
    UNIQUE KEY `uq_video_student` (`video_id`, `enrollment_no`),
    INDEX `idx_enrollment_no` (`enrollment_no`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ────────────────────────────────────────────────────────────
-- 13. PASSWORD RESET TOKENS (forgot-password flow)
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `password_reset_tokens` (
    `id`         INT AUTO_INCREMENT PRIMARY KEY,
    `token`      VARCHAR(64)  NOT NULL UNIQUE,
    `email`      VARCHAR(255) NOT NULL,
    `expires_at` DATETIME NOT NULL,
    `used`       TINYINT(1) NOT NULL DEFAULT 0,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_token` (`token`),
    INDEX `idx_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ────────────────────────────────────────────────────────────
-- 14. FRANCHISES (website "Our Centers" list, managed in /admin)
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `franchises` (
    `id`         INT AUTO_INCREMENT PRIMARY KEY,
    `academy`    VARCHAR(255) NOT NULL,
    `head`       VARCHAR(255) NOT NULL,
    `area`       VARCHAR(255) NOT NULL DEFAULT '',
    `city`       VARCHAR(100) NOT NULL DEFAULT '',
    `photo`      VARCHAR(500) NOT NULL DEFAULT '',
    `sort_order` INT NOT NULL DEFAULT 0,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_sort_order` (`sort_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ────────────────────────────────────────────────────────────
-- 15. PORTAL AUDIT LOG (all admin / franchise / student actions)
-- ────────────────────────────────────────────────────────────
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================
--  UPGRADE PATCH — only needed if your database ALREADY EXISTS
--  from an older version. Safe to run multiple times.
--  (Skip this entire section on a fresh database.)
-- ============================================================

ALTER TABLE `portal_users`
    ADD COLUMN IF NOT EXISTS `plain_password` VARCHAR(255) NULL DEFAULT NULL AFTER `password_hash`;

ALTER TABLE `students`
    ADD COLUMN IF NOT EXISTS `father_name`    VARCHAR(255) NOT NULL DEFAULT '' AFTER `dob`,
    ADD COLUMN IF NOT EXISTS `mother_contact` VARCHAR(50)  NOT NULL DEFAULT '' AFTER `father_name`,
    ADD COLUMN IF NOT EXISTS `mobile`         VARCHAR(50)  NOT NULL DEFAULT '' AFTER `mother_contact`,
    ADD COLUMN IF NOT EXISTS `anniversary`    DATE NULL AFTER `mobile`,
    ADD COLUMN IF NOT EXISTS `photo`          VARCHAR(255) NOT NULL DEFAULT '' AFTER `anniversary`,
    ADD COLUMN IF NOT EXISTS `address`        TEXT NOT NULL DEFAULT '' AFTER `photo`,
    ADD COLUMN IF NOT EXISTS `blood_group`    VARCHAR(10)  NOT NULL DEFAULT '' AFTER `address`,
    ADD COLUMN IF NOT EXISTS `gender`         VARCHAR(20)  NOT NULL DEFAULT '' AFTER `blood_group`,
    ADD COLUMN IF NOT EXISTS `parent_name`    VARCHAR(255) NOT NULL DEFAULT '' AFTER `gender`,
    ADD COLUMN IF NOT EXISTS `parent_contact` VARCHAR(50)  NOT NULL DEFAULT '' AFTER `parent_name`,
    ADD COLUMN IF NOT EXISTS `email`          VARCHAR(255) NOT NULL DEFAULT '' AFTER `parent_contact`,
    ADD COLUMN IF NOT EXISTS `notes`          TEXT NOT NULL DEFAULT '' AFTER `email`,
    ADD COLUMN IF NOT EXISTS `reg_no`         VARCHAR(50)  NOT NULL DEFAULT '' AFTER `notes`;

ALTER TABLE `student_reports`
    ADD COLUMN IF NOT EXISTS `hw_book_a_page` INT NOT NULL DEFAULT 0 AFTER `book_b_page`,
    ADD COLUMN IF NOT EXISTS `hw_book_b_page` INT NOT NULL DEFAULT 0 AFTER `hw_book_a_page`,
    ADD COLUMN IF NOT EXISTS `updated_at`     DATETIME NULL DEFAULT NULL AFTER `created_at`;

ALTER TABLE `news`
    ADD COLUMN IF NOT EXISTS `video` VARCHAR(255) NULL DEFAULT NULL AFTER `image`;

ALTER TABLE `gallery_images`
    ADD COLUMN IF NOT EXISTS `display_type` ENUM('year','category') NOT NULL DEFAULT 'year' AFTER `category`,
    ADD COLUMN IF NOT EXISTS `media_type`   ENUM('image','video') NOT NULL DEFAULT 'image' AFTER `display_type`,
    MODIFY COLUMN `year` INT NULL DEFAULT NULL;

ALTER TABLE `home_images`
    MODIFY COLUMN `section` ENUM('hero','gallery','awards','founders') NOT NULL;

ALTER TABLE `portal_audit_log`
    ADD COLUMN IF NOT EXISTS `actor_name` VARCHAR(255) NOT NULL DEFAULT '' AFTER `actor_role`,
    ADD COLUMN IF NOT EXISTS `changes`    TEXT NOT NULL DEFAULT '' AFTER `detail`;

-- ============================================================
--  DONE — 15 tables, fully up to date.
--
--  Next steps:
--  1. Edit public/config.php with your real DB credentials
--  2. Upload the site files to public_html/ (see DEPLOY.md)
--  3. Ensure public_html/uploads/ exists with permission 755
-- ============================================================
