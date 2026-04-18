import pool from '../config/database.js';
import { notifyUserRefresh } from '../services/socketService.js';

// =============================================
// PRE-BOOKING MANAGEMENT
// =============================================

// GET /api/pre-bookings - Get pre-bookings
export const getAllPreBookings = async (req, res) => {
  try {
    const { status, limit = 50, offset = 0 } = req.query;
    const userRole = String(req.user?.role || '').trim().toLowerCase();
    const userId = req.user.userId;
    
    let query = `
      SELECT pb.*, 
             u.first_name, u.last_name,
             CASE 
               WHEN pb.item_type = 'pet' THEN p.name
               WHEN pb.item_type = 'product' THEN pr.name
               ELSE 'Unknown'
             END as item_name
      FROM pre_bookings pb
      JOIN customers c ON pb.customer_id = c.customer_id
      JOIN users u ON c.user_id = u.user_id
      LEFT JOIN pets p ON pb.item_type = 'pet' AND pb.item_id = p.pet_id
      LEFT JOIN products pr ON pb.item_type = 'product' AND pb.item_id = pr.product_id
      WHERE 1=1
    `;
    const params = [];

    // If customer, only show their own pre-bookings
    if (userRole === 'customer') {
      query += ` AND c.user_id = ?`;
      params.push(userId);
    }

    if (status && status !== 'all') {
      query += ` AND pb.status = ?`;
      params.push(status);
    }

    query += ` ORDER BY pb.created_at DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), parseInt(offset));

    const [preBookings] = await pool.query(query, params);

    // Format response
    const formattedPreBookings = preBookings.map(pb => ({
      pre_booking_id: pb.pre_booking_id,
      item_type: pb.item_type,
      item_id: pb.item_id,
      item_name: pb.item_name,
      quantity: pb.quantity,
      status: pb.status,
      notes: pb.notes || null,
      customer: {
        user: {
          first_name: pb.first_name,
          last_name: pb.last_name
        }
      },
      fulfilled_at: pb.fulfilled_at,
      notified_at: pb.notified_at,
      created_at: pb.created_at,
      updated_at: pb.updated_at
    }));

    res.json({
      success: true,
      data: formattedPreBookings
    });
  } catch (error) {
    console.error('Get pre-bookings error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching pre-bookings',
      error: error.message
    });
  }
};

// POST /api/pre-bookings - Create pre-booking (Customer)
export const createPreBooking = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { item_type, item_id, quantity, notes } = req.body;

    // Validate required fields
    if (!item_type || !item_id) {
      return res.status(400).json({
        success: false,
        message: 'Item type and ID are required'
      });
    }

    const validTypes = ['pet', 'product'];
    if (!validTypes.includes(item_type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid item type'
      });
    }

    // Get customer
    const [customers] = await pool.query(
      `SELECT customer_id FROM customers WHERE user_id = ?`,
      [userId]
    );

    if (customers.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Customer profile not found'
      });
    }

    // Check if item exists
    let itemExists = false;
    if (item_type === 'pet') {
      const [pets] = await pool.query(`SELECT pet_id FROM pets WHERE pet_id = ?`, [item_id]);
      itemExists = pets.length > 0;
    } else {
      const [products] = await pool.query(`SELECT product_id FROM products WHERE product_id = ?`, [item_id]);
      itemExists = products.length > 0;
    }

    if (!itemExists) {
      return res.status(404).json({
        success: false,
        message: 'Item not found'
      });
    }

    // Check for existing pre-booking
    const [existing] = await pool.query(
      `SELECT pre_booking_id FROM pre_bookings 
       WHERE customer_id = ? AND item_type = ? AND item_id = ? AND status = 'pending'`,
      [customers[0].customer_id, item_type, item_id]
    );

    if (existing.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Pre-booking already exists for this item'
      });
    }

    const [result] = await pool.query(
      `INSERT INTO pre_bookings (customer_id, item_type, item_id, quantity, notes, status)
       VALUES (?, ?, ?, ?, ?, 'pending')`,
      [customers[0].customer_id, item_type, item_id, quantity || 1, notes || null]
    );

    res.status(201).json({
      success: true,
      message: 'Pre-booking created successfully',
      data: { pre_booking_id: result.insertId }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating pre-booking',
      error: error.message
    });
  }
};

// DELETE /api/pre-bookings/:id - Cancel pre-booking (Customer)
export const cancelPreBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    // Get customer
    const [customers] = await pool.query(
      `SELECT customer_id FROM customers WHERE user_id = ?`,
      [userId]
    );
    if (customers.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Customer profile not found'
      });
    }

    // Verify ownership and status
    const [preBookings] = await pool.query(
      `SELECT * FROM pre_bookings WHERE pre_booking_id = ? AND customer_id = ?`,
      [id, customers[0].customer_id]
    );

    if (preBookings.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Pre-booking not found'
      });
    }

    if (preBookings[0].status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Can only cancel pending pre-bookings'
      });
    }

    await pool.query(
      `UPDATE pre_bookings SET status = 'cancelled', updated_at = NOW() WHERE pre_booking_id = ?`,
      [id]
    );

    res.json({
      success: true,
      message: 'Pre-booking cancelled successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error cancelling pre-booking',
      error: error.message
    });
  }
};

// PUT /api/pre-bookings/:id/fulfill - Fulfill pre-booking (Admin)
export const fulfillPreBooking = async (req, res) => {
  try {
    const { id } = req.params;

    // Get pre-booking
    const [preBookings] = await pool.query(
      `SELECT pb.*, c.user_id
       FROM pre_bookings pb
       JOIN customers c ON pb.customer_id = c.customer_id
       WHERE pb.pre_booking_id = ?`,
      [id]
    );

    if (preBookings.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Pre-booking not found'
      });
    }

    if (preBookings[0].status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Can only fulfill pending pre-bookings'
      });
    }

    await pool.query(
      `UPDATE pre_bookings SET status = 'fulfilled', fulfilled_at = NOW(), updated_at = NOW()
       WHERE pre_booking_id = ?`,
      [id]
    );

    // Notify customer
    await pool.query(
      `INSERT INTO notifications (user_id, notification_type, title, message, related_id)
       VALUES (?, 'pre_booking', 'Pre-Booking Fulfilled', 'Your pre-booked item is now available!', ?)`,
      [preBookings[0].user_id, id]
    );
    notifyUserRefresh(preBookings[0].user_id);

    // Log action
    await pool.query(
      `INSERT INTO audit_logs (user_id, action_type, entity_type, entity_id, description)
       VALUES (?, 'FULFILL', 'pre_booking', ?, 'Fulfilled pre-booking')`,
      [req.user.userId, id]
    );

    res.json({
      success: true,
      message: 'Pre-booking fulfilled and customer notified'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fulfilling pre-booking',
      error: error.message
    });
  }
};

// POST /api/pre-bookings/:id/notify - Send notification to customer (Admin)
export const notifyCustomer = async (req, res) => {
  try {
    const { id } = req.params;

    // Get pre-booking
    const [preBookings] = await pool.query(
      `SELECT pb.*, c.user_id,
              CASE 
                WHEN pb.item_type = 'pet' THEN p.name
                WHEN pb.item_type = 'product' THEN pr.name
                ELSE 'Unknown'
              END as item_name
       FROM pre_bookings pb
       JOIN customers c ON pb.customer_id = c.customer_id
       LEFT JOIN pets p ON pb.item_type = 'pet' AND pb.item_id = p.pet_id
       LEFT JOIN products pr ON pb.item_type = 'product' AND pb.item_id = pr.product_id
       WHERE pb.pre_booking_id = ?`,
      [id]
    );

    if (preBookings.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Pre-booking not found'
      });
    }

    // Update notified timestamp
    await pool.query(
      `UPDATE pre_bookings SET notified_at = NOW(), updated_at = NOW()
       WHERE pre_booking_id = ?`,
      [id]
    );

    // Send notification
    await pool.query(
      `INSERT INTO notifications (user_id, notification_type, title, message, related_id)
       VALUES (?, 'pre_booking', 'Pre-Booking Update', ?, ?)`,
      [preBookings[0].user_id, `Update on your pre-booking for ${preBookings[0].item_name}`, id]
    );
    notifyUserRefresh(preBookings[0].user_id);

    res.json({
      success: true,
      message: 'Customer notified successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error notifying customer',
      error: error.message
    });
  }
};

