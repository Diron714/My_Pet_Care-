import pool from '../config/database.js';

// =============================================
// CUSTOMER PROFILE & DASHBOARD
// =============================================

// GET /api/customers/dashboard - Get customer dashboard data
export const getCustomerDashboard = async (req, res) => {
    try {
        const userId = req.user.userId;

        // Get customer_id and loyalty data
        const [customers] = await pool.query(
            `SELECT c.*, u.first_name, u.last_name 
             FROM customers c 
             JOIN users u ON c.user_id = u.user_id 
             WHERE c.user_id = ?`,
            [userId]
        );

        if (customers.length === 0) {
            return res.status(404).json({ success: false, message: 'Customer not found' });
        }

        const customer = customers[0];
        const customerId = customer.customer_id;

        // Get counts for stats
        const [orderStats] = await pool.query(
            `SELECT COUNT(*) as active_count FROM orders 
             WHERE customer_id = ? AND order_status NOT IN ('delivered', 'cancelled')`,
            [customerId]
        );

        const [appointmentStats] = await pool.query(
            `SELECT COUNT(*) as upcoming_count FROM appointments 
             WHERE customer_id = ? AND status IN ('pending', 'accepted') AND appointment_date >= CURDATE()`,
            [customerId]
        );

        const [notificationStats] = await pool.query(
            `SELECT COUNT(*) as unread_count FROM notifications 
             WHERE user_id = ? AND is_read = FALSE`,
            [userId]
        );

        // Get recent orders
        const [orders] = await pool.query(
            `SELECT order_id, order_number, total_amount, final_amount, order_status, created_at 
             FROM orders WHERE customer_id = ? ORDER BY created_at DESC LIMIT 3`,
            [customerId]
        );

        // Get upcoming appointments
        const [appointments] = await pool.query(
            `SELECT a.*, u_dr.first_name as doctor_first_name, u_dr.last_name as doctor_last_name, cp.name as pet_name
             FROM appointments a
             JOIN doctors d ON a.doctor_id = d.doctor_id
             JOIN users u_dr ON d.user_id = u_dr.user_id
             JOIN customer_pets cp ON a.customer_pet_id = cp.customer_pet_id
             WHERE a.customer_id = ? AND a.appointment_date >= CURDATE() AND a.status IN ('pending', 'accepted')
             ORDER BY a.appointment_date ASC, a.appointment_time ASC LIMIT 3`,
            [customerId]
        );

        // Get upcoming reminders
        const [reminders] = await pool.query(
            `SELECT * FROM reminders 
             WHERE customer_id = ? AND is_completed = FALSE AND reminder_date >= CURDATE()
             ORDER BY reminder_date ASC LIMIT 5`,
            [customerId]
        );

        res.json({
            success: true,
            data: {
                profile: {
                    first_name: customer.first_name,
                    last_name: customer.last_name,
                    loyalty_points: customer.loyalty_points,
                    loyalty_tier: customer.loyalty_tier,
                    total_spent: customer.total_spent
                },
                stats: {
                    activeOrders: orderStats[0].active_count,
                    upcomingAppointments: appointmentStats[0].upcoming_count,
                    unreadNotifications: notificationStats[0].unread_count,
                    loyaltyPoints: customer.loyalty_points,
                    loyaltyTier: customer.loyalty_tier
                },
                recent_orders: orders,
                upcoming_appointments: appointments,
                upcoming_reminders: reminders
            }
        });
    } catch (error) {
        console.error('Customer dashboard error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching dashboard data',
            error: error.message
        });
    }
};

// GET /api/customers/profile - Get customer profile
export const getCustomerProfile = async (req, res) => {
    try {
        const userId = req.user.userId;
        const [customers] = await pool.query(
            `SELECT c.*, u.first_name, u.last_name, u.email, u.phone 
             FROM customers c 
             JOIN users u ON c.user_id = u.user_id 
             WHERE c.user_id = ?`,
            [userId]
        );

        if (customers.length === 0) {
            return res.status(404).json({ success: false, message: 'Customer not found' });
        }

        res.json({ success: true, data: customers[0] });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching profile', error: error.message });
    }
};

// PUT /api/customers/profile - Update customer profile
export const updateCustomerProfile = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { first_name, last_name, phone } = req.body;

        // Update basic user info
        await pool.query(
            `UPDATE users SET 
                first_name = COALESCE(?, first_name),
                last_name = COALESCE(?, last_name),
                phone = COALESCE(?, phone),
                updated_at = NOW()
             WHERE user_id = ?`,
            [first_name, last_name, phone, userId]
        );

        res.json({ success: true, message: 'Profile updated successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error updating profile', error: error.message });
    }
};

// GET /api/customers/loyalty - Get loyalty details
export const getLoyaltyInfo = async (req, res) => {
    try {
        const userId = req.user.userId;
        const [customers] = await pool.query(
            `SELECT loyalty_points, loyalty_tier, total_spent FROM customers WHERE user_id = ?`,
            [userId]
        );

        if (customers.length === 0) {
            return res.status(404).json({ success: false, message: 'Customer not found' });
        }

        res.json({ success: true, data: customers[0] });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching loyalty info', error: error.message });
    }
};
