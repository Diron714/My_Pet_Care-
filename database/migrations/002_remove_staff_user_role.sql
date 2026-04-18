-- Remove 'staff' from users.role: migrate existing staff users to admin, then shrink ENUM.
-- Run against your MySQL database (e.g. mypetcare_db) after backup.

USE mypetcare_db;

UPDATE users SET role = 'admin' WHERE role = 'staff';

ALTER TABLE users
  MODIFY COLUMN role ENUM('customer', 'doctor', 'admin') NOT NULL DEFAULT 'customer';
