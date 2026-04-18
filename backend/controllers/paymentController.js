import pool from '../config/database.js';
import {
  createPaymentData,
  handlePaymentNotification,
  verifyPaymentStatus,
  getPayHereCheckoutUrl,
  PAYHERE_CONFIG
} from '../services/payhereService.js';

/**
 * POST /api/payments/payhere/initiate
 * Initiate PayHere payment for an order
 */
export const initiatePayment = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { order_id } = req.body;

    if (!order_id) {
      return res.status(400).json({
        success: false,
        message: 'Order ID is required'
      });
    }

    // Get order details
    const [orders] = await pool.query(
      `SELECT o.*, c.customer_id, u.first_name, u.last_name, u.email, u.phone
       FROM orders o
       JOIN customers c ON o.customer_id = c.customer_id
       JOIN users u ON c.user_id = u.user_id
       WHERE o.order_id = ? AND c.user_id = ?`,
      [order_id, userId]
    );

    if (orders.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    const order = orders[0];

    // Check if order is already paid
    if (order.payment_status === 'paid') {
      return res.status(400).json({
        success: false,
        message: 'Order is already paid'
      });
    }

    // Check if payment method is card (PayHere)
    if (order.payment_method !== 'card') {
      return res.status(400).json({
        success: false,
        message: 'PayHere payment is only available for card payments'
      });
    }

    // Get customer data
    const customerData = {
      first_name: order.first_name,
      last_name: order.last_name,
      email: order.email,
      phone: order.phone || ''
    };

    // Create payment data
    const paymentData = createPaymentData(order, customerData);

    // Check if notify URL is localhost and warn
    if (paymentData.notify_url && (paymentData.notify_url.includes('localhost') || paymentData.notify_url.includes('127.0.0.1'))) {
      console.warn('⚠️  PayHere Integration Warning:');
      console.warn('⚠️  Notify URL is localhost - PayHere cannot reach it!');
      console.warn('⚠️  This will cause "Unauthorized payment request" error.');
      console.warn('⚠️  Solution: Use ngrok (ngrok http 5000) and update BACKEND_URL in .env');
    }

    // Log payment data for debugging (remove in production)
    if (process.env.NODE_ENV === 'development') {
      console.log('PayHere Payment Data:', {
        merchant_id: paymentData.merchant_id,
        order_id: paymentData.order_id,
        amount: paymentData.amount,
        currency: paymentData.currency,
        hash: paymentData.hash.substring(0, 10) + '...',
        notify_url: paymentData.notify_url
      });
    }

    // Return payment data for frontend to submit to PayHere
    res.json({
      success: true,
      data: {
        payment_data: paymentData,
        checkout_url: getPayHereCheckoutUrl(),
        order_id: order.order_id,
        order_number: order.order_number
      }
    });
  } catch (error) {
    console.error('Initiate payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Error initiating payment',
      error: error.message
    });
  }
};

/**
 * POST /api/payments/payhere/notify
 * Handle PayHere payment notification (webhook)
 * This endpoint is called by PayHere after payment processing
 */
export const handleNotify = async (req, res) => {
  try {
    // PayHere sends data as form-encoded (application/x-www-form-urlencoded)
    // Express should parse it automatically, but we'll handle both formats
    const notificationData = req.body;

    console.log('PayHere notification received:', notificationData);

    // Handle the payment notification
    const result = await handlePaymentNotification(notificationData);

    if (result.success && result.verified) {
      // Return success response to PayHere
      res.status(200).send('OK');
    } else {
      // Return error response
      res.status(400).send('ERROR');
    }
  } catch (error) {
    console.error('Handle notify error:', error);
    // Still return 200 to PayHere to prevent retries
    res.status(200).send('ERROR');
  }
};

/**
 * GET /api/payments/payhere/return
 * Handle PayHere return URL (success/cancel redirect)
 */
export const handleReturn = async (req, res) => {
  try {
    const {
      order_id,
      payment_id,
      status_code,
      status_message
    } = req.query;

    if (!order_id) {
      return res.redirect(`${PAYHERE_CONFIG.returnUrl}?error=missing_order_id`);
    }

    // Find order
    const [orders] = await pool.query(
      `SELECT * FROM orders WHERE order_number = ?`,
      [order_id]
    );

    if (orders.length === 0) {
      return res.redirect(`${PAYHERE_CONFIG.returnUrl}?error=order_not_found`);
    }

    const order = orders[0];

    // Redirect based on status
    if (status_code === '2') {
      // Payment successful
      return res.redirect(`${PAYHERE_CONFIG.returnUrl}/${order.order_id}?payment=success`);
    } else {
      // Payment failed or cancelled
      return res.redirect(`${PAYHERE_CONFIG.cancelUrl}?payment=failed&order_id=${order.order_id}&message=${encodeURIComponent(status_message || 'Payment failed')}`);
    }
  } catch (error) {
    console.error('Handle return error:', error);
    return res.redirect(`${PAYHERE_CONFIG.returnUrl}?error=server_error`);
  }
};

/**
 * POST /api/payments/payhere/verify
 * Verify payment status manually
 */
export const verifyPayment = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { order_id } = req.body;

    if (!order_id) {
      return res.status(400).json({
        success: false,
        message: 'Order ID is required'
      });
    }

    // Get order
    const [orders] = await pool.query(
      `SELECT o.*, c.user_id
       FROM orders o
       JOIN customers c ON o.customer_id = c.customer_id
       WHERE o.order_id = ? AND c.user_id = ?`,
      [order_id, userId]
    );

    if (orders.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    const order = orders[0];

    // Verify with PayHere API
    const paymentStatus = await verifyPaymentStatus(order.order_number);

    // Update order if payment status changed
    if (paymentStatus.status_code === 2 && order.payment_status !== 'paid') {
      await pool.query(
        `UPDATE orders 
         SET payment_status = 'paid',
             order_status = CASE WHEN order_status = 'pending' THEN 'confirmed' ELSE order_status END,
             updated_at = NOW()
         WHERE order_id = ?`,
        [order.order_id]
      );
    }

    res.json({
      success: true,
      data: {
        order_id: order.order_id,
        payment_status: paymentStatus.status_code === 2 ? 'paid' : 'pending',
        payhere_status: paymentStatus
      }
    });
  } catch (error) {
    console.error('Verify payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Error verifying payment',
      error: error.message
    });
  }
};

/**
 * POST /api/payments/mock-success
 * Manually mark an order as paid (DRY/Development only)
 */
export const mockPaymentSuccess = async (req, res) => {
  try {
    if (process.env.NODE_ENV !== 'development') {
      return res.status(404).json({
        success: false,
        message: 'Not found'
      });
    }

    const userId = req.user.userId;
    const { order_id } = req.body;

    if (!order_id) {
      return res.status(400).json({
        success: false,
        message: 'Order ID is required'
      });
    }

    // Get order
    const [orders] = await pool.query(
      `SELECT o.*, c.user_id
       FROM orders o
       JOIN customers c ON o.customer_id = c.customer_id
       WHERE o.order_id = ? AND c.user_id = ?`,
      [order_id, userId]
    );

    if (orders.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    const order = orders[0];

    // Check if order is already paid
    if (order.payment_status === 'paid') {
      return res.status(400).json({
        success: false,
        message: 'Order is already paid'
      });
    }

    // Manual update
    await pool.query(
      `UPDATE orders 
       SET payment_status = 'paid',
           order_status = CASE WHEN order_status = 'pending' THEN 'confirmed' ELSE order_status END,
           updated_at = NOW()
       WHERE order_id = ?`,
      [order.order_id]
    );

    console.log(`[DEV] Order ${order.order_number} marked as PAID via mock success`);

    res.json({
      success: true,
      message: 'Payment simulated successfully'
    });
  } catch (error) {
    console.error('Mock success error:', error);
    res.status(500).json({
      success: false,
      message: 'Error simulating payment',
      error: error.message
    });
  }
};
