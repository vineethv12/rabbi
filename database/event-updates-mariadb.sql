-- Rabbi Global Academy — Event registration database update
-- Run this ONLY for an existing Hostinger database after creating a backup.
-- A new installation should import the full database schema instead.
--
-- The current PHP API also applies these changes automatically when the
-- Events screen is opened. This manual script is useful only if the
-- Hostinger database user cannot run automatic ALTER TABLE statements.

ALTER TABLE events ADD COLUMN IF NOT EXISTS event_end_date DATE NULL AFTER event_date;
ALTER TABLE events ADD COLUMN IF NOT EXISTS image VARCHAR(500) NOT NULL DEFAULT '';
ALTER TABLE events ADD COLUMN IF NOT EXISTS model_question_paper_url VARCHAR(2000) NOT NULL DEFAULT '';

CREATE TABLE IF NOT EXISTS portal_event_template (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  event_id INT NULL,
  event_name VARCHAR(255) NOT NULL DEFAULT 'Event Registration',
  filename VARCHAR(255) NOT NULL,
  original_name VARCHAR(255) NOT NULL DEFAULT '',
  uploaded_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_event_template_event (event_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS portal_event_regs (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  event_id INT NULL,
  center_id VARCHAR(64) NOT NULL,
  event_name VARCHAR(255) NOT NULL DEFAULT 'Event Registration',
  filename VARCHAR(255) NOT NULL,
  original_name VARCHAR(255) NOT NULL DEFAULT '',
  uploaded_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  headers_json TEXT NULL,
  rows_json MEDIUMTEXT NULL,
  row_count INT NOT NULL DEFAULT 0,
  uploader_name VARCHAR(150) NULL,
  academy_name VARCHAR(255) NULL,
  city VARCHAR(100) NULL,
  KEY idx_center (center_id),
  KEY idx_event_regs_event (event_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

ALTER TABLE portal_event_template ADD COLUMN IF NOT EXISTS event_id INT NULL AFTER id;
ALTER TABLE portal_event_regs ADD COLUMN IF NOT EXISTS event_id INT NULL AFTER id;
ALTER TABLE portal_event_regs ADD COLUMN IF NOT EXISTS uploader_name VARCHAR(150) NULL AFTER row_count;
ALTER TABLE portal_event_regs ADD COLUMN IF NOT EXISTS academy_name VARCHAR(255) NULL AFTER uploader_name;
ALTER TABLE portal_event_regs ADD COLUMN IF NOT EXISTS city VARCHAR(100) NULL AFTER academy_name;

ALTER TABLE portal_event_template MODIFY id INT NOT NULL AUTO_INCREMENT;
CREATE UNIQUE INDEX IF NOT EXISTS uniq_event_template_event ON portal_event_template (event_id);
CREATE INDEX IF NOT EXISTS idx_event_regs_event ON portal_event_regs (event_id);