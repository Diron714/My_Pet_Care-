-- Add image_url to doctors table for profile photo
-- Run once: ALTER TABLE doctors ADD COLUMN image_url VARCHAR(500) NULL AFTER is_available;
-- If you get "Duplicate column" error, the column already exists.
ALTER TABLE doctors ADD COLUMN image_url VARCHAR(500) NULL AFTER is_available;
