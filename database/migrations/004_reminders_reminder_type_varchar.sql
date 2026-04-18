-- Avoid ENUM drift: store reminder_type as VARCHAR (app validates allowed values)
ALTER TABLE reminders
  MODIFY COLUMN reminder_type VARCHAR(32) NOT NULL;
