import pool from '../config/database.js';

// =============================================
// OFFER MANAGEMENT
// =============================================

// GET /api/offers - Get all offers (active for public, all for admin)
export const getAllOffers = async (req, res) => {
  try {
    const userRole = String(req.user?.role || '').trim().toLowerCase();
    const { active } = req.query;
    
    let query = `SELECT * FROM offers WHERE 1=1`;
    const params = [];

    // For public/customer, only show active and valid offers
    if (!userRole || userRole === 'customer') {
      query += ` AND is_active = TRUE AND valid_from <= NOW() AND valid_until >= NOW()`;
    } else if (active === 'true') {
      query += ` AND is_active = TRUE`;
    } else if (active === 'false') {
      query += ` AND is_active = FALSE`;
    }

    query += ` ORDER BY created_at DESC`;

    const [offers] = await pool.query(query, params);

    res.json({
      success: true,
      data: offers
    });
  } catch (error) {
    console.error('Get offers error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching offers',
      error: error.message
    });
  }
};

// GET /api/offers/:id - Get offer by ID
export const getOfferById = async (req, res) => {
  try {
    const { id } = req.params;

    const [offers] = await pool.query(
      `SELECT * FROM offers WHERE offer_id = ?`,
      [id]
    );

    if (offers.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Offer not found'
      });
    }

    res.json({
      success: true,
      data: offers[0]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching offer',
      error: error.message
    });
  }
};

// POST /api/offers - Create new offer (Admin only)
export const createOffer = async (req, res) => {
  try {
    const { title, description, discount_type, discount_value, min_purchase, max_discount, valid_from, valid_until, is_active } = req.body;
    const created_by = req.user.userId;

    // Validate required fields
    if (!title || !discount_type || !discount_value || !valid_from || !valid_until) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    const validTypes = ['percentage', 'fixed_amount', 'loyalty_points'];
    if (!validTypes.includes(discount_type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid discount type'
      });
    }

    const [result] = await pool.query(
      `INSERT INTO offers (title, description, discount_type, discount_value, min_purchase, max_discount, valid_from, valid_until, is_active, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [title, description || null, discount_type, discount_value, min_purchase || 0, max_discount || null, valid_from, valid_until, is_active !== false, created_by]
    );

    // Log action
    await pool.query(
      `INSERT INTO audit_logs (user_id, action_type, entity_type, entity_id, description)
       VALUES (?, 'CREATE', 'offer', ?, ?)`,
      [created_by, result.insertId, `Created offer: ${title}`]
    );

    res.status(201).json({
      success: true,
      message: 'Offer created successfully',
      data: { offer_id: result.insertId }
    });
  } catch (error) {
    console.error('Create offer error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating offer',
      error: error.message
    });
  }
};

// PUT /api/offers/:id - Update offer (Admin only)
export const updateOffer = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, discount_type, discount_value, min_purchase, max_discount, valid_from, valid_until, is_active } = req.body;

    // Check if offer exists
    const [existing] = await pool.query(`SELECT offer_id FROM offers WHERE offer_id = ?`, [id]);
    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Offer not found'
      });
    }

    await pool.query(
      `UPDATE offers SET 
        title = COALESCE(?, title),
        description = COALESCE(?, description),
        discount_type = COALESCE(?, discount_type),
        discount_value = COALESCE(?, discount_value),
        min_purchase = COALESCE(?, min_purchase),
        max_discount = ?,
        valid_from = COALESCE(?, valid_from),
        valid_until = COALESCE(?, valid_until),
        is_active = COALESCE(?, is_active),
        updated_at = NOW()
       WHERE offer_id = ?`,
      [title, description, discount_type, discount_value, min_purchase, max_discount, valid_from, valid_until, is_active, id]
    );

    // Log action
    await pool.query(
      `INSERT INTO audit_logs (user_id, action_type, entity_type, entity_id, description)
       VALUES (?, 'UPDATE', 'offer', ?, ?)`,
      [req.user.userId, id, `Updated offer ID: ${id}`]
    );

    res.json({
      success: true,
      message: 'Offer updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating offer',
      error: error.message
    });
  }
};

// DELETE /api/offers/:id - Delete offer (Admin only)
export const deleteOffer = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if offer exists
    const [existing] = await pool.query(`SELECT title FROM offers WHERE offer_id = ?`, [id]);
    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Offer not found'
      });
    }

    await pool.query(`DELETE FROM offers WHERE offer_id = ?`, [id]);

    // Log action
    await pool.query(
      `INSERT INTO audit_logs (user_id, action_type, entity_type, entity_id, description)
       VALUES (?, 'DELETE', 'offer', ?, ?)`,
      [req.user.userId, id, `Deleted offer: ${existing[0].title}`]
    );

    res.json({
      success: true,
      message: 'Offer deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting offer',
      error: error.message
    });
  }
};

// POST /api/offers/:id/redeem - Redeem offer (Customer)
export const redeemOffer = async (req, res) => {
  try {
    const { id } = req.params;
    const { order_id } = req.body;
    const userId = req.user.userId;

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

    // Get offer
    const [offers] = await pool.query(
      `SELECT * FROM offers WHERE offer_id = ? AND is_active = TRUE AND valid_from <= NOW() AND valid_until >= NOW()`,
      [id]
    );

    if (offers.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Offer not found or expired'
      });
    }

    const offer = offers[0];

    // If an order is provided, ensure it belongs to the requesting customer.
    if (order_id) {
      const [orders] = await pool.query(
        `SELECT order_id FROM orders WHERE order_id = ? AND customer_id = ?`,
        [order_id, customers[0].customer_id]
      );
      if (orders.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Invalid order for this customer'
        });
      }
    }

    // Check if already redeemed
    const [existingRedemption] = await pool.query(
      `SELECT redemption_id FROM offer_redemptions WHERE offer_id = ? AND customer_id = ?`,
      [id, customers[0].customer_id]
    );

    if (existingRedemption.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Offer already redeemed'
      });
    }

    // Calculate discount
    let discountApplied = offer.discount_value;
    if (offer.max_discount && discountApplied > offer.max_discount) {
      discountApplied = offer.max_discount;
    }

    // Record redemption
    await pool.query(
      `INSERT INTO offer_redemptions (offer_id, customer_id, order_id, discount_applied)
       VALUES (?, ?, ?, ?)`,
      [id, customers[0].customer_id, order_id, discountApplied]
    );

    res.json({
      success: true,
      message: 'Offer redeemed successfully',
      data: { discount_applied: discountApplied }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error redeeming offer',
      error: error.message
    });
  }
};

