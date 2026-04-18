import pool from '../config/database.js';

/**
 * ENUM reminder_type breaks when the app adds types (e.g. "other") before SQL migrations run.
 * Migrate to VARCHAR once so inserts always work.
 */
export async function ensureRemindersReminderTypeColumn() {
  try {
    const [rows] = await pool.query(
      `SELECT DATA_TYPE
       FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE()
         AND TABLE_NAME = 'reminders'
         AND COLUMN_NAME = 'reminder_type'`
    );
    const col = rows[0];
    if (!col) return;
    if (String(col.DATA_TYPE).toLowerCase() === 'enum') {
      await pool.query(
        `ALTER TABLE reminders MODIFY COLUMN reminder_type VARCHAR(32) NOT NULL`
      );
      console.log('✅ reminders.reminder_type: ENUM → VARCHAR(32) (supports all reminder types)');
    }
  } catch (e) {
    console.warn('⚠️ reminders.reminder_type check/migrate skipped:', e.message);
  }
}
