import pool from '../config/database.js';

const REMINDER_TYPES = ['vaccination', 'medication', 'food', 'appointment', 'other'];

function normalizeReminderType(type) {
  if (type == null || typeof type !== 'string') return null;
  const t = type.trim().toLowerCase();
  return REMINDER_TYPES.includes(t) ? t : null;
}

// =============================================
// REMINDER MANAGEMENT
// =============================================

// GET /api/reminders - Get customer's reminders
export const getReminders = async (req, res) => {
    try {
        const userId = req.user.userId;

        const [customers] = await pool.query('SELECT customer_id FROM customers WHERE user_id = ?', [userId]);
        if (customers.length === 0) {
            return res.status(404).json({ success: false, message: 'Customer profile not found' });
        }
        const customerId = customers[0].customer_id;

        const [reminders] = await pool.query(
            `SELECT * FROM reminders WHERE customer_id = ? ORDER BY reminder_date ASC, reminder_time ASC`,
            [customerId]
        );

        res.json({
            success: true,
            data: reminders
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching reminders',
            error: error.message
        });
    }
};

// GET /api/reminders/upcoming - Get upcoming reminders
export const getUpcomingReminders = async (req, res) => {
    try {
        const userId = req.user.userId;

        const [customers] = await pool.query('SELECT customer_id FROM customers WHERE user_id = ?', [userId]);
        if (customers.length === 0) {
            return res.status(404).json({ success: false, message: 'Customer profile not found' });
        }
        const customerId = customers[0].customer_id;

        const [reminders] = await pool.query(
            `SELECT * FROM reminders 
             WHERE customer_id = ? AND is_completed = FALSE AND reminder_date >= CURDATE()
             ORDER BY reminder_date ASC, reminder_time ASC
             LIMIT 10`,
            [customerId]
        );

        res.json({
            success: true,
            data: reminders
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching upcoming reminders',
            error: error.message
        });
    }
};

// POST /api/reminders - Create new reminder
export const createReminder = async (req, res) => {
    try {
        const { reminder_type, title, description, reminder_date, reminder_time } = req.body;
        const userId = req.user.userId;

        const rt = normalizeReminderType(reminder_type);
        if (!rt) {
            return res.status(400).json({
                success: false,
                message: `Invalid reminder type. Use one of: ${REMINDER_TYPES.join(', ')}`,
            });
        }

        const [customers] = await pool.query('SELECT customer_id FROM customers WHERE user_id = ?', [userId]);
        if (customers.length === 0) {
            return res.status(404).json({ success: false, message: 'Customer profile not found' });
        }
        const customerId = customers[0].customer_id;

        const [result] = await pool.query(
            `INSERT INTO reminders (customer_id, reminder_type, title, description, reminder_date, reminder_time)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [customerId, rt, title, description || null, reminder_date, reminder_time || null]
        );

        res.status(201).json({
            success: true,
            message: 'Reminder created successfully',
            data: { reminder_id: result.insertId }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error creating reminder',
            error: error.message
        });
    }
};

// PUT /api/reminders/:id/complete - Mark reminder as completed
export const markAsCompleted = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;

        const [customers] = await pool.query('SELECT customer_id FROM customers WHERE user_id = ?', [userId]);
        if (customers.length === 0) {
            return res.status(404).json({ success: false, message: 'Customer profile not found' });
        }
        const customerId = customers[0].customer_id;

        const [result] = await pool.query(
            `UPDATE reminders SET is_completed = TRUE, completed_at = NOW() WHERE reminder_id = ? AND customer_id = ?`,
            [id, customerId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Reminder not found or unauthorized' });
        }

        res.json({ success: true, message: 'Reminder marked as completed' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error updating reminder', error: error.message });
    }
};

// DELETE /api/reminders/:id - Delete reminder
export const deleteReminder = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;

        const [customers] = await pool.query('SELECT customer_id FROM customers WHERE user_id = ?', [userId]);
        if (customers.length === 0) {
            return res.status(404).json({ success: false, message: 'Customer profile not found' });
        }
        const customerId = customers[0].customer_id;

        const [result] = await pool.query(
            `DELETE FROM reminders WHERE reminder_id = ? AND customer_id = ?`,
            [id, customerId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Reminder not found or unauthorized' });
        }

        res.json({ success: true, message: 'Reminder deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error deleting reminder', error: error.message });
    }
};

// PUT /api/reminders/:id - Update reminder details
export const updateReminder = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;

        const [customers] = await pool.query('SELECT customer_id FROM customers WHERE user_id = ?', [userId]);
        const customerId = customers[0]?.customer_id;

        if (!customerId) {
            return res.status(404).json({ success: false, message: 'Customer profile not found' });
        }

        const { reminder_type, title, description, reminder_date, reminder_time } = req.body;

        let typeForUpdate = null;
        if (reminder_type !== undefined && reminder_type !== null && String(reminder_type).trim() !== '') {
            const rt = normalizeReminderType(reminder_type);
            if (!rt) {
                return res.status(400).json({
                    success: false,
                    message: `Invalid reminder type. Use one of: ${REMINDER_TYPES.join(', ')}`,
                });
            }
            typeForUpdate = rt;
        }

        const [result] = await pool.query(
            `UPDATE reminders SET
                reminder_type = COALESCE(?, reminder_type),
                title = COALESCE(?, title),
                description = COALESCE(?, description),
                reminder_date = COALESCE(?, reminder_date),
                reminder_time = COALESCE(?, reminder_time),
                updated_at = NOW()
             WHERE reminder_id = ? AND customer_id = ?`,
            [typeForUpdate, title, description, reminder_date, reminder_time, id, customerId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Reminder not found or unauthorized' });
        }

        res.json({ success: true, message: 'Reminder updated successfully' });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error updating reminder',
            error: error.message
        });
    }
};
