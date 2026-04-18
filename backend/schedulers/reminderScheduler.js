import pool from '../config/database.js';
import { createNotification } from '../controllers/notificationController.js';

// Periodically scan reminders table and create in-app notifications
// so customers actually get "reminded" when a reminder is due.
export const startReminderScheduler = () => {
  const intervalMinutes = parseInt(process.env.REMINDER_CHECK_INTERVAL_MINUTES || '1', 10);
  const intervalMs = Math.max(intervalMinutes, 1) * 60 * 1000;

  const checkAndNotifyReminders = async () => {
    try {
      // Find due, not-completed reminders that don't yet have a corresponding
      // 'reminder' notification linked via related_id.
      const [rows] = await pool.query(
        `SELECT 
           r.reminder_id,
           r.reminder_type,
           r.title,
           r.description,
           r.reminder_date,
           r.reminder_time,
           u.user_id
         FROM reminders r
         JOIN customers c ON r.customer_id = c.customer_id
         JOIN users u ON c.user_id = u.user_id
         LEFT JOIN notifications n
           ON n.notification_type = 'reminder'
          AND n.related_id = r.reminder_id
         WHERE 
           r.is_completed = FALSE
           AND n.notification_id IS NULL
           AND (
             -- Reminders with a specific time: trigger when past-due, but only
             -- for a recent window so we don't spam very old records.
             (
               r.reminder_time IS NOT NULL
               AND TIMESTAMP(r.reminder_date, r.reminder_time) <= NOW()
               AND TIMESTAMP(r.reminder_date, r.reminder_time) >= NOW() - INTERVAL 1 DAY
             )
             OR
             -- Date-only reminders: treat as due on/after their date, within 1 day.
             (
               r.reminder_time IS NULL
               AND r.reminder_date <= CURDATE()
               AND r.reminder_date >= DATE_SUB(CURDATE(), INTERVAL 1 DAY)
             )
           )
         ORDER BY r.reminder_date ASC, r.reminder_time ASC
         LIMIT 100`
      );

      if (!rows || rows.length === 0) {
        return;
      }

      await Promise.all(
        rows.map(async (reminder) => {
          const when =
            reminder.reminder_time
              ? `${reminder.reminder_date} at ${reminder.reminder_time}`
              : `${reminder.reminder_date}`;

          const defaultTitle = 'Pet care reminder';
          const title = reminder.title || defaultTitle;

          const messageParts = [];

          if (reminder.reminder_type) {
            const prettyType = reminder.reminder_type.replace('_', ' ');
            messageParts.push(prettyType.charAt(0).toUpperCase() + prettyType.slice(1));
          } else {
            messageParts.push('You have a scheduled reminder');
          }

          messageParts.push(`scheduled for ${when}.`);

          if (reminder.description) {
            messageParts.push(reminder.description);
          }

          const message = messageParts.join(' ');

          await createNotification(
            reminder.user_id,
            'reminder',
            title,
            message,
            reminder.reminder_id
          );
        })
      );
    } catch (error) {
      // Log and continue; the scheduler should never crash the server.
      console.error('Reminder scheduler error:', error.message || error);
    }
  };

  // Run once on startup, then on an interval.
  checkAndNotifyReminders();
  setInterval(checkAndNotifyReminders, intervalMs);
};

