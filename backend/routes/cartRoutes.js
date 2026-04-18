import express from 'express';
import { authenticate } from '../middleware/auth.js';
import pool from '../config/database.js';

const router = express.Router();

// Get cart items (requires auth)
router.get('/', authenticate, async (req, res) => {
  try {
    const userId = req.user.userId;

    // Get customer
    const [customers] = await pool.query(
      `SELECT customer_id FROM customers WHERE user_id = ?`,
      [userId]
    );

    if (customers.length === 0) {
      return res.json({ success: true, data: [] });
    }

    // Get cart items with details
    const [cartItems] = await pool.query(
      `SELECT c.cart_id, c.item_type, c.item_id, c.quantity,
              CASE 
                WHEN c.item_type = 'pet' THEN p.name
                WHEN c.item_type = 'product' THEN pr.name
              END as name,
              CASE 
                WHEN c.item_type = 'pet' THEN p.name
                WHEN c.item_type = 'product' THEN pr.name
              END as item_name,
              CASE 
                WHEN c.item_type = 'pet' THEN p.price
                WHEN c.item_type = 'product' THEN pr.price
              END as price,
              CASE 
                WHEN c.item_type = 'pet' THEN p.price
                WHEN c.item_type = 'product' THEN pr.price
              END as unitPrice,
              CASE 
                WHEN c.item_type = 'pet' THEN p.image_url
                WHEN c.item_type = 'product' THEN pr.image_url
              END as image_url,
              CASE 
                WHEN c.item_type = 'pet' THEN p.stock_quantity
                WHEN c.item_type = 'product' THEN pr.stock_quantity
              END as stock_quantity,
              CASE WHEN c.item_type = 'pet' THEN p.species END as species,
              CASE WHEN c.item_type = 'pet' THEN p.breed END as breed,
              CASE WHEN c.item_type = 'pet' THEN p.age END as pet_age,
              CASE WHEN c.item_type = 'product' THEN pr.category END as category
       FROM carts c
       LEFT JOIN pets p ON c.item_type = 'pet' AND c.item_id = p.pet_id
       LEFT JOIN products pr ON c.item_type = 'product' AND c.item_id = pr.product_id
       WHERE c.customer_id = ?`,
      [customers[0].customer_id]
    );

    res.json({
      success: true,
      data: cartItems
    });
  } catch (error) {
    console.error('Get cart error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving cart',
      error: error.message
    });
  }
});

// Add item to cart (requires auth)
router.post('/add', authenticate, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { itemType, itemId, quantity = 1 } = req.body;

    if (!itemType || !itemId) {
      return res.status(400).json({
        success: false,
        message: 'Item type and ID are required'
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

    // Check if item already in cart
    const [existing] = await pool.query(
      `SELECT cart_id, quantity FROM carts 
       WHERE customer_id = ? AND item_type = ? AND item_id = ?`,
      [customers[0].customer_id, itemType, itemId]
    );

    if (existing.length > 0) {
      // Update quantity
      await pool.query(
        `UPDATE carts SET quantity = quantity + ?, updated_at = NOW() WHERE cart_id = ?`,
        [quantity, existing[0].cart_id]
      );

      return res.json({
        success: true,
        message: 'Cart updated successfully',
        data: { cart_id: existing[0].cart_id }
      });
    }

    // Add new item
    const [result] = await pool.query(
      `INSERT INTO carts (customer_id, item_type, item_id, quantity)
       VALUES (?, ?, ?, ?)`,
      [customers[0].customer_id, itemType, itemId, quantity]
    );

    res.status(201).json({
      success: true,
      message: 'Item added to cart successfully',
      data: { cart_id: result.insertId }
    });
  } catch (error) {
    console.error('Add to cart error:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding to cart',
      error: error.message
    });
  }
});

// Update cart item (requires auth)
router.put('/:cartId', authenticate, async (req, res) => {
  try {
    const { cartId } = req.params;
    const { quantity } = req.body;
    const userId = req.user.userId;

    if (!quantity || quantity < 1) {
      return res.status(400).json({
        success: false,
        message: 'Invalid quantity'
      });
    }

    // Verify ownership
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

    await pool.query(
      `UPDATE carts SET quantity = ?, updated_at = NOW() 
       WHERE cart_id = ? AND customer_id = ?`,
      [quantity, cartId, customers[0].customer_id]
    );

    res.json({
      success: true,
      message: 'Cart item updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating cart',
      error: error.message
    });
  }
});

// Clear cart (requires auth)
router.delete('/clear', authenticate, async (req, res) => {
  try {
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

    await pool.query(
      `DELETE FROM carts WHERE customer_id = ?`,
      [customers[0].customer_id]
    );

    res.json({
      success: true,
      message: 'Cart cleared successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error clearing cart',
      error: error.message
    });
  }
});

// Remove item from cart (requires auth)
router.delete('/:cartId', authenticate, async (req, res) => {
  try {
    const { cartId } = req.params;
    const userId = req.user.userId;

    // Verify ownership
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

    await pool.query(
      `DELETE FROM carts WHERE cart_id = ? AND customer_id = ?`,
      [cartId, customers[0].customer_id]
    );

    res.json({
      success: true,
      message: 'Item removed from cart successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error removing from cart',
      error: error.message
    });
  }
});

export default router;

