import pool from '../config/database.js';

// =============================================
// FEEDBACK MANAGEMENT
// =============================================

// GET /api/feedback - Get all feedback (with filters for admin)
export const getAllFeedback = async (req, res) => {
  try {
    const { type, status, rating, limit = 50, offset = 0 } = req.query;
    const userRole = String(req.user?.role || '').trim().toLowerCase();
    const userId = req.user.userId;
    
    let query = `
      SELECT f.*, 
             u.first_name, u.last_name,
             CASE 
               WHEN f.feedback_type = 'product' THEN p.name
               WHEN f.feedback_type = 'doctor' THEN CONCAT('Dr. ', du.first_name, ' ', du.last_name)
               ELSE 'Service'
             END as item_name
      FROM feedback f
      JOIN customers c ON f.customer_id = c.customer_id
      JOIN users u ON c.user_id = u.user_id
      LEFT JOIN products p ON f.feedback_type = 'product' AND f.item_id = p.product_id
      LEFT JOIN doctors d ON f.feedback_type = 'doctor' AND f.item_id = d.doctor_id
      LEFT JOIN users du ON d.user_id = du.user_id
      WHERE 1=1
    `;
    const params = [];

    // If customer, only show their own feedback
    if (userRole === 'customer') {
      query += ` AND c.user_id = ?`;
      params.push(userId);
    }

    if (type) {
      query += ` AND f.feedback_type = ?`;
      params.push(type);
    }

    if (status) {
      query += ` AND f.status = ?`;
      params.push(status);
    }

    if (rating) {
      query += ` AND f.rating = ?`;
      params.push(parseInt(rating));
    }

    query += ` ORDER BY f.created_at DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), parseInt(offset));

    const [feedbacks] = await pool.query(query, params);

    // Format response
    const formattedFeedback = feedbacks.map(f => ({
      feedback_id: f.feedback_id,
      feedback_type: f.feedback_type,
      item_id: f.item_id,
      item_name: f.item_name,
      rating: f.rating,
      comment: f.comment,
      status: f.status,
      admin_response: f.admin_response,
      customer: {
        user: {
          first_name: f.first_name,
          last_name: f.last_name
        }
      },
      created_at: f.created_at,
      updated_at: f.updated_at
    }));

    res.json({
      success: true,
      data: formattedFeedback
    });
  } catch (error) {
    console.error('Get feedback error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching feedback',
      error: error.message
    });
  }
};

// POST /api/feedback - Submit feedback (Customer)
export const createFeedback = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { feedback_type, item_id, rating, comment } = req.body;
    const validTypes = ['service', 'product', 'doctor'];

    // Validate
    if (!feedback_type || !rating || (feedback_type !== 'service' && !item_id)) {
      return res.status(400).json({
        success: false,
        message: 'Feedback type, item ID, and rating are required'
      });
    }
    if (!validTypes.includes(feedback_type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid feedback type'
      });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5'
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

    if (feedback_type === 'product') {
      const [products] = await pool.query(
        `SELECT product_id FROM products WHERE product_id = ?`,
        [item_id]
      );
      if (products.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Product not found'
        });
      }
    }

    if (feedback_type === 'doctor') {
      const [doctors] = await pool.query(
        `SELECT doctor_id FROM doctors WHERE doctor_id = ?`,
        [item_id]
      );
      if (doctors.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Doctor not found'
        });
      }
    }

    const [result] = await pool.query(
      `INSERT INTO feedback (customer_id, feedback_type, item_id, rating, comment, status)
       VALUES (?, ?, ?, ?, ?, 'pending')`,
      [customers[0].customer_id, feedback_type, item_id, rating, comment || null]
    );

    res.status(201).json({
      success: true,
      message: 'Feedback submitted successfully',
      data: { feedback_id: result.insertId }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error submitting feedback',
      error: error.message
    });
  }
};

// PUT /api/feedback/:id/status - Update feedback status (Admin)
export const updateFeedbackStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['pending', 'approved', 'rejected'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    // Get feedback for updating doctor rating
    const [feedbacks] = await pool.query(
      `SELECT * FROM feedback WHERE feedback_id = ?`,
      [id]
    );

    if (feedbacks.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Feedback not found'
      });
    }

    await pool.query(
      `UPDATE feedback SET status = ?, updated_at = NOW() WHERE feedback_id = ?`,
      [status, id]
    );

    // If approved and it's doctor feedback, update doctor rating
    const feedback = feedbacks[0];
    if (status === 'approved' && feedback.feedback_type === 'doctor') {
      // Calculate new average rating
      const [avgRating] = await pool.query(
        `SELECT AVG(rating) as avg_rating, COUNT(*) as total_reviews
         FROM feedback
         WHERE feedback_type = 'doctor' AND item_id = ? AND status = 'approved'`,
        [feedback.item_id]
      );

      await pool.query(
        `UPDATE doctors SET rating = ?, total_reviews = ? WHERE doctor_id = ?`,
        [avgRating[0].avg_rating || 0, avgRating[0].total_reviews || 0, feedback.item_id]
      );
    }

    res.json({
      success: true,
      message: `Feedback ${status} successfully`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating feedback status',
      error: error.message
    });
  }
};

// POST /api/feedback/:id/response - Add admin response
export const addAdminResponse = async (req, res) => {
  try {
    const { id } = req.params;
    const { adminResponse } = req.body;

    if (!adminResponse) {
      return res.status(400).json({
        success: false,
        message: 'Admin response is required'
      });
    }

    await pool.query(
      `UPDATE feedback SET admin_response = ?, updated_at = NOW() WHERE feedback_id = ?`,
      [adminResponse, id]
    );

    res.json({
      success: true,
      message: 'Response added successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error adding response',
      error: error.message
    });
  }
};

// GET /api/feedback/item/:type/:id - Get feedback for a specific item (Public)
export const getItemFeedback = async (req, res) => {
  try {
    const { type, id } = req.params;

    const [feedbacks] = await pool.query(
      `SELECT f.*, u.first_name, u.last_name
       FROM feedback f
       JOIN customers c ON f.customer_id = c.customer_id
       JOIN users u ON c.user_id = u.user_id
       WHERE f.feedback_type = ? AND f.item_id = ? AND f.status = 'approved'
       ORDER BY f.created_at DESC`,
      [type, id]
    );

    // Calculate average rating
    const [avgRating] = await pool.query(
      `SELECT AVG(rating) as average, COUNT(*) as count
       FROM feedback
       WHERE feedback_type = ? AND item_id = ? AND status = 'approved'`,
      [type, id]
    );

    res.json({
      success: true,
      data: {
        feedbacks: feedbacks.map(f => ({
          ...f,
          customer: { user: { first_name: f.first_name, last_name: f.last_name } }
        })),
        averageRating: avgRating[0].average || 0,
        totalReviews: avgRating[0].count || 0
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching feedback',
      error: error.message
    });
  }
};

