import crypto from 'crypto';
import pool from '../config/database.js';
import { notifyUserRefresh } from './socketService.js';

// PayHere Configuration
const getBackendUrl = () => {
  return process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 5000}`;
};

const PAYHERE_CONFIG = {
  merchantId: process.env.PAYHERE_MERCHANT_ID || '1234392',
  merchantSecret: process.env.PAYHERE_SECRET || 'MzQ5MDY2NjEzMjI4MTc4NzU5OTkxNTcyNjUxMjA3NzA1NzQxMDAw',
  appId: process.env.PAYHERE_APP_ID || '4OVybqJH3Ng4JH5Ex4ziQy3TZ',
  appSecret: process.env.PAYHERE_APP_SECRET || '4jo3SGrx50g8RiILaA0ofX4jo3RtWJ75U8LKY0df6Hh7',
  sandbox: process.env.PAYHERE_SANDBOX !== 'false', // Default to sandbox
  baseUrl: process.env.PAYHERE_SANDBOX !== 'false' 
    ? 'https://sandbox.payhere.lk' 
    : 'https://www.payhere.lk',
  get notifyUrl() {
    // In development, if using localhost, use a public webhook testing service
    // For production, use your actual domain
    if (process.env.PAYHERE_NOTIFY_URL) {
      return process.env.PAYHERE_NOTIFY_URL;
    }
    
    const backendUrl = getBackendUrl();
    
    // If localhost, warn and use a placeholder (PayHere will reject, but you'll see the error)
    // For actual testing, use ngrok or a public URL
    if (backendUrl.includes('localhost') || backendUrl.includes('127.0.0.1')) {
      console.warn('⚠️  WARNING: PayHere cannot reach localhost URLs!');
      console.warn('⚠️  For testing, use ngrok: ngrok http 5000');
      console.warn('⚠️  Then update BACKEND_URL in .env with the ngrok URL');
      // Still return localhost URL so you can see the error, but PayHere will reject it
      return `${backendUrl}/api/payments/payhere/notify`;
    }
    
    return `${backendUrl}/api/payments/payhere/notify`;
  },
  returnUrl: process.env.PAYHERE_RETURN_URL || `${process.env.FRONTEND_URL || 'http://localhost:5173'}/customer/orders`,
  cancelUrl:
    process.env.PAYHERE_CANCEL_URL ||
    `${process.env.FRONTEND_URL || 'http://localhost:5173'}/customer/checkout?payment=cancelled`
};

/**
 * Generate PayHere payment hash for security
 * @param {Object} params - Payment parameters
 * @returns {string} - MD5 hash
 */
export const generatePaymentHash = (params) => {
  const {
    merchant_id,
    order_id,
    amount,
    currency,
    merchant_secret
  } = params;

  // Ensure all values are strings
  const merchantIdStr = String(merchant_id);
  const orderIdStr = String(order_id);
  const amountStr = String(amount);
  const currencyStr = String(currency);
  const secretStr = String(merchant_secret);

  // PayHere expects: MD5(merchant_id + order_id + amount + currency + MD5(merchant_secret).toUpperCase())
  const secretHash = crypto.createHash('md5').update(secretStr).digest('hex').toUpperCase();
  const hashString = `${merchantIdStr}${orderIdStr}${amountStr}${currencyStr}${secretHash}`;
  
  // Log hash string for debugging (without secret)
  if (process.env.NODE_ENV === 'development') {
    console.log('Hash String (using hashed secret):', `${merchantIdStr}${orderIdStr}${amountStr}${currencyStr}${secretHash.substring(0, 5)}...`);
  }
  
  const hash = crypto.createHash('md5').update(hashString).digest('hex').toUpperCase();
  
  return hash;
};

/**
 * Verify PayHere payment hash
 * @param {Object} params - Payment parameters from PayHere
 * @returns {boolean} - True if hash is valid
 */
export const verifyPaymentHash = (params) => {
  const {
    merchant_id,
    order_id,
    payhere_amount,
    payhere_currency,
    status_code,
    md5sig
  } = params;

  const merchantSecret = PAYHERE_CONFIG.merchantSecret;
  const secretHash = crypto.createHash('md5').update(merchantSecret).digest('hex').toUpperCase();
  const hashString = `${merchant_id}${order_id}${payhere_amount}${payhere_currency}${status_code}${secretHash}`;
  const calculatedHash = crypto.createHash('md5').update(hashString).digest('hex').toLowerCase();

  // PayHere sends hash in md5sig, compare case-insensitively
  return calculatedHash.toLowerCase() === md5sig.toLowerCase();
};

/**
 * Create payment data for PayHere checkout
 * @param {Object} orderData - Order information
 * @param {Object} customerData - Customer information
 * @returns {Object} - Payment data ready for PayHere
 */
export const createPaymentData = (orderData, customerData) => {
  const {
    order_id,
    order_number,
    final_amount
  } = orderData;

  const {
    first_name,
    last_name,
    email,
    phone
  } = customerData;

  // Convert final_amount to number (database returns Decimal/string)
  const amount = parseFloat(final_amount) || 0;
  const amountString = amount.toFixed(2);

  // Generate hash for payment (PayHere expects merchant_id as string in hash)
  const merchantId = String(PAYHERE_CONFIG.merchantId);
  
  // Validate merchant secret exists
  if (!PAYHERE_CONFIG.merchantSecret) {
    throw new Error('PayHere merchant secret is not configured');
  }
  
  const hash = generatePaymentHash({
    merchant_id: merchantId,
    order_id: order_number,
    amount: amountString,
    currency: 'LKR',
    merchant_secret: PAYHERE_CONFIG.merchantSecret
  });
  
  // PayHere payment data - all fields must be strings
  const paymentData = {
    merchant_id: merchantId,
    return_url: PAYHERE_CONFIG.returnUrl,
    cancel_url: PAYHERE_CONFIG.cancelUrl,
    notify_url: PAYHERE_CONFIG.notifyUrl,
    order_id: String(order_number),
    items: `Order ${order_number}`,
    currency: 'LKR',
    amount: amountString,
    first_name: String(first_name || 'Customer'),
    last_name: String(last_name || 'Name'),
    email: String(email || ''),
    phone: String(phone || ''),
    address: '',
    city: '',
    country: 'Sri Lanka',
    hash: hash
  };

  // Log payment data for debugging (without sensitive data)
  if (process.env.NODE_ENV === 'development') {
    console.log('PayHere Payment Data (sanitized):', {
      ...paymentData,
      hash: hash.substring(0, 10) + '...'
    });
  }

  return paymentData;
};

/**
 * Verify payment status with PayHere API
 * @param {string} orderId - PayHere order ID
 * @returns {Promise<Object>} - Payment status from PayHere
 */
export const verifyPaymentStatus = async (orderId) => {
  try {
    const authString = Buffer.from(`${PAYHERE_CONFIG.appId}:${PAYHERE_CONFIG.appSecret}`).toString('base64');
    
    const response = await fetch(`${PAYHERE_CONFIG.baseUrl}/merchant/v1/payment/search`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authString}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        order_id: orderId
      })
    });

    if (!response.ok) {
      throw new Error(`PayHere API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error verifying payment status:', error);
    throw error;
  }
};

/**
 * Handle PayHere payment notification
 * @param {Object} notificationData - Data from PayHere notify URL
 * @returns {Promise<Object>} - Processed notification result
 */
export const handlePaymentNotification = async (notificationData) => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    let paymentNotifyUserId = null;

    const {
      merchant_id,
      order_id,
      payhere_amount,
      payhere_currency,
      status_code,
      md5sig,
      method,
      status_message
    } = notificationData;

    // Verify hash
    if (!verifyPaymentHash(notificationData)) {
      await connection.rollback();
      return {
        success: false,
        message: 'Invalid payment hash',
        verified: false
      };
    }

    // Find order by order_number
    const [orders] = await connection.query(
      `SELECT * FROM orders WHERE order_number = ?`,
      [order_id]
    );

    if (orders.length === 0) {
      await connection.rollback();
      return {
        success: false,
        message: 'Order not found',
        verified: false
      };
    }

    const order = orders[0];

    // Check if amount matches
    const expectedAmount = parseFloat(order.final_amount).toFixed(2);
    const receivedAmount = parseFloat(payhere_amount).toFixed(2);

    if (expectedAmount !== receivedAmount) {
      await connection.rollback();
      return {
        success: false,
        message: 'Amount mismatch',
        verified: false
      };
    }

    // Update order based on status
    let paymentStatus = 'pending';
    let orderStatus = order.order_status;

    if (status_code === 2) {
      // Payment successful
      paymentStatus = 'paid';
      if (order.order_status === 'pending') {
        orderStatus = 'confirmed';
      }
    } else if (status_code === 0 || status_code === -1 || status_code === -2) {
      // Payment failed/cancelled
      paymentStatus = 'failed';
    }

    // Update order
    await connection.query(
      `UPDATE orders 
       SET payment_status = ?, 
           order_status = ?,
           transaction_reference = ?,
           updated_at = NOW()
       WHERE order_id = ?`,
      [paymentStatus, orderStatus, md5sig, order.order_id]
    );

    // Get customer user_id for notification
    const [customers] = await connection.query(
      `SELECT user_id, loyalty_points FROM customers WHERE customer_id = ?`,
      [order.customer_id]
    );

    if (customers.length > 0 && paymentStatus === 'paid') {
      const customer = customers[0];
      
      // Update loyalty points (deduct used, add earned)
      await connection.query(
        `UPDATE customers SET 
           loyalty_points = loyalty_points - ? + ?,
           total_spent = total_spent + ?
         WHERE customer_id = ?`,
        [
          order.loyalty_points_used || 0,
          order.loyalty_points_earned || 0,
          order.final_amount,
          order.customer_id
        ]
      );

      // Clear cart (in case it wasn't cleared during order creation)
      await connection.query(
        `DELETE FROM carts WHERE customer_id = ?`,
        [order.customer_id]
      );

      // Create success notification
      await connection.query(
        `INSERT INTO notifications (user_id, notification_type, title, message, related_id)
         VALUES (?, 'order', 'Payment Successful', ?, ?)`,
        [
          customer.user_id,
          `Your payment for order ${order.order_number} has been confirmed!`,
          order.order_id
        ]
      );
      paymentNotifyUserId = customer.user_id;
    }

    await connection.commit();
    if (paymentNotifyUserId != null) notifyUserRefresh(paymentNotifyUserId);

    return {
      success: true,
      verified: true,
      order_id: order.order_id,
      payment_status: paymentStatus,
      order_status: orderStatus,
      message: status_message || 'Payment processed'
    };
  } catch (error) {
    await connection.rollback();
    console.error('Error handling payment notification:', error);
    throw error;
  } finally {
    connection.release();
  }
};

/**
 * Get PayHere checkout URL
 * @returns {string} - PayHere checkout URL
 */
export const getPayHereCheckoutUrl = () => {
  // PayHere sandbox checkout URL
  return `${PAYHERE_CONFIG.baseUrl}/pay/checkout`;
};

// Export PAYHERE_CONFIG as named export (functions are already exported above)
export { PAYHERE_CONFIG };

// Default export for backward compatibility
export default {
  generatePaymentHash,
  verifyPaymentHash,
  createPaymentData,
  verifyPaymentStatus,
  handlePaymentNotification,
  getPayHereCheckoutUrl,
  PAYHERE_CONFIG
};

