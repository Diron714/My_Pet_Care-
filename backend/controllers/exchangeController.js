import pool from '../config/database.js';
import { notifyUserRefresh, notifyAdminsRefresh } from '../services/socketService.js';

// =============================================
// EXCHANGE REQUEST MANAGEMENT
// =============================================

// GET /api/exchanges - Get exchange requests
export const getAllExchanges = async (req, res) => {
  try {
    const { status, limit = 50, offset = 0 } = req.query;
    const userRole = String(req.user?.role || '').trim().toLowerCase();
    const userId = req.user.userId;
    
    let query = `
      SELECT e.*, 
             u.first_name, u.last_name,
             o.order_number,
             p.name as pet_name
      FROM exchange_requests e
      JOIN customers c ON e.customer_id = c.customer_id
      JOIN users u ON c.user_id = u.user_id
      JOIN orders o ON e.order_id = o.order_id
      JOIN pets p ON e.pet_id = p.pet_id
      WHERE 1=1
    `;
    const params = [];

    // If customer, only show their own exchanges
    if (userRole === 'customer') {
      query += ` AND c.user_id = ?`;
      params.push(userId);
    }

    if (status && status !== 'all') {
      query += ` AND e.status = ?`;
      params.push(status);
    }

    query += ` ORDER BY e.created_at DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), parseInt(offset));

    const [exchanges] = await pool.query(query, params);

    // Format response
    const formattedExchanges = exchanges.map(e => ({
      exchange_id: e.exchange_id,
      status: e.status,
      reason: e.reason,
      customer: {
        user: {
          first_name: e.first_name,
          last_name: e.last_name
        }
      },
      order: {
        order_number: e.order_number
      },
      pet: {
        name: e.pet_name
      },
      approved_at: e.approved_at,
      created_at: e.created_at,
      updated_at: e.updated_at
    }));

    res.json({
      success: true,
      data: formattedExchanges
    });
  } catch (error) {
    console.error('Get exchanges error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching exchange requests',
      error: error.message
    });
  }
};

// POST /api/exchanges - Create exchange request (Customer)
export const createExchange = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { order_id, pet_id, reason } = req.body;

    // Validate required fields
    if (!order_id || !pet_id || !reason) {
      return res.status(400).json({
        success: false,
        message: 'Order ID, Pet ID, and reason are required'
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

    // Verify the order belongs to this customer
    const [orders] = await pool.query(
      `SELECT order_id FROM orders WHERE order_id = ? AND customer_id = ?`,
      [order_id, customers[0].customer_id]
    );

    if (orders.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Order not found or does not belong to you'
      });
    }

    // Check if exchange already exists for this pet and order
    const [existing] = await pool.query(
      `SELECT exchange_id FROM exchange_requests WHERE order_id = ? AND pet_id = ? AND status != 'rejected'`,
      [order_id, pet_id]
    );

    if (existing.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Exchange request already exists for this pet'
      });
    }

    const [result] = await pool.query(
      `INSERT INTO exchange_requests (customer_id, order_id, pet_id, reason, status)
       VALUES (?, ?, ?, ?, 'pending')`,
      [customers[0].customer_id, order_id, pet_id, reason]
    );

    // Create notification for admin
    await pool.query(
      `INSERT INTO notifications (user_id, notification_type, title, message, related_id)
       SELECT user_id, 'system', 'New Exchange Request', 'A customer has requested a pet exchange', ?
       FROM users WHERE LOWER(TRIM(role)) IN ('admin', 'staff') AND is_active = TRUE`,
      [result.insertId]
    );
    await notifyAdminsRefresh();

    res.status(201).json({
      success: true,
      message: 'Exchange request submitted successfully',
      data: { exchange_id: result.insertId }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating exchange request',
      error: error.message
    });
  }
};

// DELETE /api/exchanges/:id - Cancel exchange request (Customer)
export const cancelExchange = async (req, res) => {
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
    const [exchanges] = await pool.query(
      `SELECT * FROM exchange_requests WHERE exchange_id = ? AND customer_id = ?`,
      [id, customers[0].customer_id]
    );

    if (exchanges.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Exchange request not found'
      });
    }

    if (exchanges[0].status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Can only cancel pending exchange requests'
      });
    }

    await pool.query(
      `DELETE FROM exchange_requests WHERE exchange_id = ?`,
      [id]
    );

    res.json({
      success: true,
      message: 'Exchange request cancelled successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error cancelling exchange request',
      error: error.message
    });
  }
};

// PUT /api/exchanges/:id/approve - Approve exchange (Admin)
export const approveExchange = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    // Get exchange
    const [exchanges] = await pool.query(
      `SELECT e.*, c.user_id as customer_user_id
       FROM exchange_requests e
       JOIN customers c ON e.customer_id = c.customer_id
       WHERE e.exchange_id = ?`,
      [id]
    );

    if (exchanges.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Exchange request not found'
      });
    }

    if (exchanges[0].status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Can only approve pending requests'
      });
    }

    await pool.query(
      `UPDATE exchange_requests SET status = 'approved', approved_by = ?, approved_at = NOW(), updated_at = NOW()
       WHERE exchange_id = ?`,
      [userId, id]
    );

    // Notify customer
    await pool.query(
      `INSERT INTO notifications (user_id, notification_type, title, message, related_id)
       VALUES (?, 'system', 'Exchange Request Approved', 'Your pet exchange request has been approved', ?)`,
      [exchanges[0].customer_user_id, id]
    );
    notifyUserRefresh(exchanges[0].customer_user_id);

    // Log action
    await pool.query(
      `INSERT INTO audit_logs (user_id, action_type, entity_type, entity_id, description)
       VALUES (?, 'APPROVE', 'exchange', ?, 'Approved exchange request')`,
      [userId, id]
    );

    res.json({
      success: true,
      message: 'Exchange request approved successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error approving exchange request',
      error: error.message
    });
  }
};

// PUT /api/exchanges/:id/reject - Reject exchange (Admin)
export const rejectExchange = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    // Get exchange
    const [exchanges] = await pool.query(
      `SELECT e.*, c.user_id as customer_user_id
       FROM exchange_requests e
       JOIN customers c ON e.customer_id = c.customer_id
       WHERE e.exchange_id = ?`,
      [id]
    );

    if (exchanges.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Exchange request not found'
      });
    }

    if (exchanges[0].status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Can only reject pending requests'
      });
    }

    await pool.query(
      `UPDATE exchange_requests SET status = 'rejected', updated_at = NOW()
       WHERE exchange_id = ?`,
      [id]
    );

    // Notify customer
    await pool.query(
      `INSERT INTO notifications (user_id, notification_type, title, message, related_id)
       VALUES (?, 'system', 'Exchange Request Rejected', 'Your pet exchange request has been rejected', ?)`,
      [exchanges[0].customer_user_id, id]
    );
    notifyUserRefresh(exchanges[0].customer_user_id);

    // Log action
    await pool.query(
      `INSERT INTO audit_logs (user_id, action_type, entity_type, entity_id, description)
       VALUES (?, 'REJECT', 'exchange', ?, 'Rejected exchange request')`,
      [userId, id]
    );

    res.json({
      success: true,
      message: 'Exchange request rejected'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error rejecting exchange request',
      error: error.message
    });
  }
};

// PUT /api/exchanges/:id/complete - Mark exchange as completed (Admin)
export const completeExchange = async (req, res) => {
  try {
    const { id } = req.params;

    const [exchanges] = await pool.query(
      `SELECT * FROM exchange_requests WHERE exchange_id = ?`,
      [id]
    );

    if (exchanges.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Exchange request not found'
      });
    }

    if (exchanges[0].status !== 'approved') {
      return res.status(400).json({
        success: false,
        message: 'Can only complete approved requests'
      });
    }

    await pool.query(
      `UPDATE exchange_requests SET status = 'completed', updated_at = NOW()
       WHERE exchange_id = ?`,
      [id]
    );

    res.json({
      success: true,
      message: 'Exchange completed successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error completing exchange',
      error: error.message
    });
  }
};

