-- Superseded by 004_reminders_reminder_type_varchar.sql (VARCHAR avoids ENUM limits).
-- If you only run this file on an old DB, use 004 instead for a permanent fix.
ALTER TABLE reminders
  MODIFY COLUMN reminder_type ENUM('vaccination', 'medication', 'food', 'appointment', 'other') NOT NULL;
