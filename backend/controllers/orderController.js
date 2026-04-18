import pool from '../config/database.js';
import { notifyUserRefresh } from '../services/socketService.js';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const PDFDocument = require('pdfkit');

// =============================================
// ORDER MANAGEMENT
// =============================================

// Generate unique order number
const generateOrderNumber = () => {
  const date = new Date();
  const year = date.getFullYear();
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `ORD-${year}-${random}`;
};

// GET /api/orders - Get orders (with filters for admin, own orders for customers)
export const getAllOrders = async (req, res) => {
  try {
    const { status, paymentStatus, dateFrom, dateTo, search, limit = 50, offset = 0 } = req.query;
    const userRole = String(req.user?.role || '').trim().toLowerCase();
    const userId = req.user.userId;
    
    let query = `
      SELECT o.*, 
             c.customer_id,
             u.first_name, u.last_name, u.email,
             (SELECT COUNT(*) FROM order_items oi WHERE oi.order_id = o.order_id) as items_count
      FROM orders o
      JOIN customers c ON o.customer_id = c.customer_id
      JOIN users u ON c.user_id = u.user_id
      WHERE 1=1
    `;
    const params = [];

    // If customer, only show their own orders
    if (userRole === 'customer') {
      query += ` AND c.user_id = ?`;
      params.push(userId);
    }

    if (status) {
      query += ` AND o.order_status = ?`;
      params.push(status);
    }

    if (paymentStatus) {
      query += ` AND o.payment_status = ?`;
      params.push(paymentStatus);
    }

    if (dateFrom) {
      query += ` AND DATE(o.created_at) >= ?`;
      params.push(dateFrom);
    }

    if (dateTo) {
      query += ` AND DATE(o.created_at) <= ?`;
      params.push(dateTo);
    }

    if (search) {
      query += ` AND (o.order_number LIKE ? OR u.first_name LIKE ? OR u.last_name LIKE ?)`;
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    query += ` ORDER BY o.created_at DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), parseInt(offset));

    const [orders] = await pool.query(query, params);

    // If there are orders and we are not in admin view (or just always for simplicity), fetch items
    if (orders.length > 0) {
      const orderIds = orders.map(o => o.order_id);
      const [allItems] = await pool.query(
        `SELECT order_id, item_type, item_id, item_name, quantity, unit_price, subtotal 
         FROM order_items 
         WHERE order_id IN (?)`,
        [orderIds]
      );

      // Group items by order_id
      const itemsMap = allItems.reduce((acc, item) => {
        if (!acc[item.order_id]) acc[item.order_id] = [];
        acc[item.order_id].push(item);
        return acc;
      }, {});

      // Attach items to each order
      orders.forEach(order => {
        order.items = itemsMap[order.order_id] || [];
      });
    }

    const num = (v) => {
      const n = parseFloat(v);
      return Number.isFinite(n) ? n : 0;
    };

    // Format response with nested customer object and items
    const formattedOrders = orders.map(order => ({
      order_id: order.order_id,
      order_number: order.order_number,
      customer_id: order.customer_id,
      customer: {
        user: {
          first_name: order.first_name,
          last_name: order.last_name,
          email: order.email
        }
      },
      total_amount: num(order.total_amount),
      discount_amount: num(order.discount_amount),
      loyalty_points_used: parseInt(order.loyalty_points_used, 10) || 0,
      final_amount: num(order.final_amount) || num(order.total_amount),
      shipping_address: order.shipping_address,
      payment_method: order.payment_method,
      payment_status: order.payment_status,
      order_status: order.order_status,
      items_count: order.items_count,
      items: order.items || [],
      created_at: order.created_at,
      updated_at: order.updated_at
    }));

    res.json({
      success: true,
      data: formattedOrders
    });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching orders',
      error: error.message
    });
  }
};

// GET /api/orders/:id - Get order by ID
export const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const userRole = String(req.user?.role || '').trim().toLowerCase();
    const userId = req.user.userId;

    let query = `
      SELECT o.*, 
             c.customer_id,
             u.first_name, u.last_name, u.email, u.phone
      FROM orders o
      JOIN customers c ON o.customer_id = c.customer_id
      JOIN users u ON c.user_id = u.user_id
      WHERE o.order_id = ?
    `;

    // If customer, verify they own this order
    if (userRole === 'customer') {
      query += ` AND c.user_id = ?`;
    }

    const params = userRole === 'customer' ? [id, userId] : [id];
    const [orders] = await pool.query(query, params);

    if (orders.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Order lines + live image/species/category (JOINs case-insensitive; name fallback from catalog)
    const [items] = await pool.query(
      `SELECT oi.order_item_id, oi.order_id, oi.item_type, oi.item_id,
              COALESCE(
                NULLIF(TRIM(oi.item_name), ''),
                NULLIF(TRIM(p.name), ''),
                NULLIF(TRIM(pr.name), ''),
                CASE
                  WHEN p.pet_id IS NOT NULL THEN NULLIF(TRIM(CONCAT_WS(' · ', NULLIF(p.species, ''), NULLIF(p.breed, ''))), '')
                END
              ) AS item_name,
              oi.quantity, oi.unit_price, oi.subtotal,
              CASE WHEN LOWER(TRIM(oi.item_type)) = 'pet' THEN p.image_url
                   WHEN LOWER(TRIM(oi.item_type)) = 'product' THEN pr.image_url END AS image_url,
              CASE WHEN LOWER(TRIM(oi.item_type)) = 'pet' THEN p.species END AS species,
              CASE WHEN LOWER(TRIM(oi.item_type)) = 'pet' THEN p.breed END AS breed,
              CASE WHEN LOWER(TRIM(oi.item_type)) = 'product' THEN pr.category END AS category
       FROM order_items oi
       LEFT JOIN pets p ON LOWER(TRIM(oi.item_type)) = 'pet' AND oi.item_id = p.pet_id
       LEFT JOIN products pr ON LOWER(TRIM(oi.item_type)) = 'product' AND oi.item_id = pr.product_id
       WHERE oi.order_id = ?`,
      [id]
    );

    const order = orders[0];
    const num = (v) => {
      const n = parseFloat(v);
      return Number.isFinite(n) ? n : 0;
    };
    const totalAmt = num(order.total_amount);
    const discountAmt = num(order.discount_amount);
    const finalAmt = num(order.final_amount);
    const loyaltyUsed = parseInt(order.loyalty_points_used, 10) || 0;

    res.json({
      success: true,
      data: {
        order_id: order.order_id,
        order_number: order.order_number,
        customer: {
          user: {
            first_name: order.first_name,
            last_name: order.last_name,
            email: order.email,
            phone: order.phone
          }
        },
        total_amount: totalAmt,
        discount_amount: discountAmt,
        loyalty_points_used: loyaltyUsed,
        final_amount: finalAmt || totalAmt,
        shipping_address: order.shipping_address,
        payment_method: order.payment_method,
        payment_status: order.payment_status,
        order_status: order.order_status,
        transaction_reference: order.transaction_reference,
        loyalty_points_earned: parseInt(order.loyalty_points_earned, 10) || 0,
        items: items.map((i) => ({
          ...i,
          quantity: parseInt(i.quantity, 10) || 0,
          unit_price: num(i.unit_price),
          subtotal: num(i.subtotal),
        })),
        created_at: order.created_at,
        updated_at: order.updated_at
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching order',
      error: error.message
    });
  }
};

// GET /api/orders/:id/invoice - Download order invoice as PDF
export const downloadInvoice = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const role = String(req.user?.role || '').trim().toLowerCase();

    let query = `
      SELECT o.*, 
             c.customer_id,
             u.first_name, u.last_name, u.email, u.phone
      FROM orders o
      JOIN customers c ON o.customer_id = c.customer_id
      JOIN users u ON c.user_id = u.user_id
      WHERE o.order_id = ?
    `;

    if (role === 'customer') {
      query += ` AND c.user_id = ?`;
    }

    const params = role === 'customer' ? [id, userId] : [id];
    const [orders] = await pool.query(query, params);

    if (orders.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    const order = orders[0];

    const [items] = await pool.query(
      `SELECT item_type, item_name, quantity, unit_price, subtotal
       FROM order_items
       WHERE order_id = ?`,
      [id]
    );

    const doc = new PDFDocument({ margin: 50 });
    const filename = `invoice-${order.order_number}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=\"${filename}\"`);
    doc.pipe(res);

    // Header
    doc.fontSize(22).text('My Pet Care+ - Invoice', { align: 'center' });
    doc.moveDown();

    // Order summary
    doc.fontSize(11);
    doc.text(`Invoice #: ${order.order_number}`);
    doc.text(`Invoice Date: ${String(order.created_at).slice(0, 10)}`);
    doc.moveDown();

    // Customer details
    doc.fontSize(12).text('Billed To', { underline: true });
    doc.fontSize(11);
    doc.text(`${order.first_name} ${order.last_name}`);
    if (order.phone) doc.text(`Phone: ${order.phone}`);
    doc.text(`Email: ${order.email}`);
    doc.moveDown();

    // Shipping details
    doc.fontSize(12).text('Shipping Address', { underline: true });
    doc.fontSize(11).text(order.shipping_address || 'N/A');
    doc.moveDown();

    // Items table header
    doc.fontSize(12).text('Order Items', { underline: true });
    doc.moveDown(0.5);

    const tableTop = doc.y;
    const itemTypeX = 50;
    const itemNameX = 120;
    const qtyX = 360;
    const unitPriceX = 410;
    const subtotalX = 480;

    doc.fontSize(10).text('Type', itemTypeX, tableTop, { bold: true });
    doc.text('Item', itemNameX, tableTop);
    doc.text('Qty', qtyX, tableTop, { width: 40, align: 'right' });
    doc.text('Unit Price', unitPriceX, tableTop, { width: 60, align: 'right' });
    doc.text('Subtotal', subtotalX, tableTop, { width: 60, align: 'right' });

    doc.moveTo(50, tableTop + 12).lineTo(550, tableTop + 12).stroke();

    let position = tableTop + 20;
    items.forEach((item) => {
      doc.fontSize(10)
        .text(item.item_type, itemTypeX, position)
        .text(item.item_name, itemNameX, position)
        .text(String(item.quantity), qtyX, position, { width: 40, align: 'right' })
        .text(Number(item.unit_price).toFixed(2), unitPriceX, position, { width: 60, align: 'right' })
        .text(Number(item.subtotal).toFixed(2), subtotalX, position, { width: 60, align: 'right' });
      position += 18;
    });

    doc.moveDown(2);

    // Totals summary
    const summaryX = 360;
    doc.fontSize(11);
    doc.text('Total:', summaryX, doc.y, { width: 120, align: 'right' });
    doc.text(Number(order.total_amount).toFixed(2), subtotalX, doc.y - 11, { width: 60, align: 'right' });

    doc.moveDown(0.5);
    doc.text('Discount:', summaryX, doc.y, { width: 120, align: 'right' });
    doc.text(Number(order.discount_amount).toFixed(2), subtotalX, doc.y - 11, { width: 60, align: 'right' });

    doc.moveDown(0.5);
    doc.text('Final Amount:', summaryX, doc.y, { width: 120, align: 'right' });
    doc.text(Number(order.final_amount).toFixed(2), subtotalX, doc.y - 11, { width: 60, align: 'right' });

    doc.moveDown(1.5);
    doc.fontSize(10).text(
      `Payment Method: ${order.payment_method} | Payment Status: ${order.payment_status}`,
      { align: 'left' }
    );

    doc.moveDown(2);
    doc.fontSize(9).fillColor('grey').text(
      'Thank you for shopping with My Pet Care+!',
      { align: 'center' }
    );

    doc.end();
  } catch (error) {
    console.error('Download invoice error:', error);
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: 'Error generating invoice',
        error: error.message
      });
    }
  }
};

// POST /api/orders - Create new order from cart
export const createOrder = async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();

    const userId = req.user.userId;
    const { shipping_address, payment_method, loyalty_points_used = 0 } = req.body;

    // Get customer
    const [customers] = await connection.query(
      `SELECT customer_id, loyalty_points FROM customers WHERE user_id = ?`,
      [userId]
    );

    if (customers.length === 0) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: 'Customer profile not found'
      });
    }

    const customer = customers[0];

    // Get cart items
    const [cartItems] = await connection.query(
      `SELECT c.*, 
              COALESCE(
                NULLIF(TRIM(CASE WHEN c.item_type = 'pet' THEN p.name WHEN c.item_type = 'product' THEN pr.name END), ''),
                CASE WHEN c.item_type = 'pet' THEN NULLIF(TRIM(CONCAT_WS(' · ', NULLIF(p.species, ''), NULLIF(p.breed, ''))), '') END,
                CASE WHEN c.item_type = 'product' THEN pr.category END,
                'Unnamed Item'
              ) as item_name,
              CASE 
                WHEN c.item_type = 'pet' THEN p.price
                WHEN c.item_type = 'product' THEN pr.price
              END as price,
              CASE
                WHEN c.item_type = 'pet' THEN p.stock_quantity
                WHEN c.item_type = 'product' THEN pr.stock_quantity
              END as stock_quantity
       FROM carts c
       LEFT JOIN pets p ON c.item_type = 'pet' AND c.item_id = p.pet_id
       LEFT JOIN products pr ON c.item_type = 'product' AND c.item_id = pr.product_id
       WHERE c.customer_id = ?`,
      [customer.customer_id]
    );

    if (cartItems.length === 0) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: 'Cart is empty'
      });
    }

    // Calculate totals
    let totalAmount = 0;
    for (const item of cartItems) {
      const unitPrice = Number(item.price);
      const availableStock = Number(item.stock_quantity);
      const qty = Number(item.quantity);

      if (!Number.isFinite(unitPrice) || unitPrice <= 0) {
        await connection.rollback();
        return res.status(400).json({
          success: false,
          message: `Item is unavailable: ${item.item_name || 'Unknown item'}`
        });
      }

      if (!Number.isFinite(availableStock) || availableStock < qty) {
        await connection.rollback();
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for: ${item.item_name || 'Unknown item'}`
        });
      }

      totalAmount += item.price * item.quantity;
    }

    // Calculate discount from loyalty points (1 point = 1 LKR)
    const pointsDiscount = Math.min(loyalty_points_used, customer.loyalty_points, totalAmount * 0.2); // Max 20% discount
    const finalAmount = totalAmount - pointsDiscount;

    // Calculate loyalty points earned (1% of final amount)
    const pointsEarned = Math.floor(finalAmount * 0.01);

    // Create order
    const orderNumber = generateOrderNumber();
    
    // For PayHere (card) payments, set initial payment status as pending
    // For other methods, payment status depends on the method
    let initialPaymentStatus = 'pending';
    let initialOrderStatus = 'pending';
    
    if (payment_method === 'cash_on_delivery') {
      initialPaymentStatus = 'pending';
      initialOrderStatus = 'confirmed'; // COD orders are confirmed immediately
    } else if (payment_method === 'bank_transfer') {
      initialPaymentStatus = 'pending';
      initialOrderStatus = 'pending'; // Wait for manual confirmation
    } else if (payment_method === 'card') {
      // PayHere - will be updated via webhook
      initialPaymentStatus = 'pending';
      initialOrderStatus = 'pending';
    }
    
    const [orderResult] = await connection.query(
      `INSERT INTO orders (order_number, customer_id, total_amount, discount_amount, loyalty_points_used, 
                          final_amount, shipping_address, payment_method, payment_status, order_status, loyalty_points_earned)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [orderNumber, customer.customer_id, totalAmount, pointsDiscount, loyalty_points_used, 
       finalAmount, shipping_address, payment_method, initialPaymentStatus, initialOrderStatus, pointsEarned]
    );

    const orderId = orderResult.insertId;

    // Create order items
    for (const item of cartItems) {
      await connection.query(
        `INSERT INTO order_items (order_id, item_type, item_id, item_name, quantity, unit_price, subtotal)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          orderId,
          item.item_type,
          item.item_id,
          item.item_name || 'Unnamed Item',
          item.quantity,
          item.price,
          item.price * item.quantity,
        ]
      );

      // Update stock
      if (item.item_type === 'pet') {
        await connection.query(
          `UPDATE pets SET stock_quantity = stock_quantity - ? WHERE pet_id = ?`,
          [item.quantity, item.item_id]
        );
      } else {
        await connection.query(
          `UPDATE products SET stock_quantity = stock_quantity - ? WHERE product_id = ?`,
          [item.quantity, item.item_id]
        );
      }
    }

    // For PayHere payments, don't update loyalty points or clear cart until payment is confirmed
    // For other payment methods, update immediately
    if (payment_method !== 'card') {
      // Update customer loyalty points (only for non-PayHere payments)
      await connection.query(
        `UPDATE customers SET 
           loyalty_points = loyalty_points - ? + ?,
           total_spent = total_spent + ?
         WHERE customer_id = ?`,
        [pointsDiscount, pointsEarned, finalAmount, customer.customer_id]
      );

      // Clear cart
      await connection.query(
        `DELETE FROM carts WHERE customer_id = ?`,
        [customer.customer_id]
      );
    } else {
      // For PayHere, we'll clear cart and update loyalty points after payment confirmation
      // Just mark the order as created
    }

    // Create notification
    await connection.query(
      `INSERT INTO notifications (user_id, notification_type, title, message, related_id)
       VALUES (?, 'order', 'Order Placed', ?, ?)`,
      [userId, `Your order ${orderNumber} has been placed successfully!`, orderId]
    );

    await connection.commit();
    notifyUserRefresh(userId);

    // Return response based on payment method
    if (payment_method === 'card') {
      // For PayHere, return order info so frontend can initiate payment
      res.status(201).json({
        success: true,
        message: 'Order created. Please proceed with payment.',
        data: {
          order_id: orderId,
          order_number: orderNumber,
          final_amount: finalAmount,
          loyalty_points_earned: pointsEarned,
          requires_payment: true,
          payment_method: 'card'
        }
      });
    } else {
      // For other payment methods, order is complete
      res.status(201).json({
        success: true,
        message: 'Order created successfully',
        data: {
          order_id: orderId,
          order_number: orderNumber,
          final_amount: finalAmount,
          loyalty_points_earned: pointsEarned
        }
      });
    }
  } catch (error) {
    await connection.rollback();
    console.error('Create order error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating order',
      error: error.message
    });
  } finally {
    connection.release();
  }
};

// PUT /api/orders/:id/status - Update order status (Admin/Staff only)
export const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, payment_status } = req.body;

    const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
    const validPaymentStatuses = ['pending', 'paid', 'failed', 'refunded'];

    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid order status'
      });
    }

    if (payment_status && !validPaymentStatuses.includes(payment_status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment status'
      });
    }

    // Get order for notification
    const [orders] = await pool.query(
      `SELECT o.order_number, c.user_id 
       FROM orders o
       JOIN customers c ON o.customer_id = c.customer_id
       WHERE o.order_id = ?`,
      [id]
    );

    if (orders.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Update order
    let updateQuery = `UPDATE orders SET updated_at = NOW()`;
    const params = [];

    if (status) {
      updateQuery += `, order_status = ?`;
      params.push(status);
    }

    if (payment_status) {
      updateQuery += `, payment_status = ?`;
      params.push(payment_status);
    }

    updateQuery += ` WHERE order_id = ?`;
    params.push(id);

    await pool.query(updateQuery, params);

    // Create notification for customer
    if (status) {
      await pool.query(
        `INSERT INTO notifications (user_id, notification_type, title, message, related_id)
         VALUES (?, 'order', 'Order Update', ?, ?)`,
        [orders[0].user_id, `Your order ${orders[0].order_number} status has been updated to: ${status}`, id]
      );
      notifyUserRefresh(orders[0].user_id);
    }

    // Log action
    await pool.query(
      `INSERT INTO audit_logs (user_id, action_type, entity_type, entity_id, description)
       VALUES (?, 'UPDATE_STATUS', 'order', ?, ?)`,
      [req.user.userId, id, `Order status updated to: ${status || 'N/A'}, Payment: ${payment_status || 'N/A'}`]
    );

    res.json({
      success: true,
      message: 'Order status updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating order status',
      error: error.message
    });
  }
};

// PUT /api/orders/:id/cancel - Cancel order (Customer)
export const cancelOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const userRole = String(req.user?.role || '').trim().toLowerCase();

    // Get order
    const [orders] = await pool.query(
      `SELECT o.*, c.user_id 
       FROM orders o
       JOIN customers c ON o.customer_id = c.customer_id
       WHERE o.order_id = ?`,
      [id]
    );

    if (orders.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    const order = orders[0];

    // Verify ownership (customer can only cancel their own orders)
    if (userRole === 'customer' && order.user_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to cancel this order'
      });
    }

    // Check if order can be cancelled
    if (!['pending', 'confirmed'].includes(order.order_status)) {
      return res.status(400).json({
        success: false,
        message: 'Order cannot be cancelled at this stage'
      });
    }

    // Update order status
    await pool.query(
      `UPDATE orders SET order_status = 'cancelled', updated_at = NOW() WHERE order_id = ?`,
      [id]
    );

    // Restore stock
    const [items] = await pool.query(
      `SELECT * FROM order_items WHERE order_id = ?`,
      [id]
    );

    for (const item of items) {
      if (item.item_type === 'pet') {
        await pool.query(
          `UPDATE pets SET stock_quantity = stock_quantity + ? WHERE pet_id = ?`,
          [item.quantity, item.item_id]
        );
      } else {
        await pool.query(
          `UPDATE products SET stock_quantity = stock_quantity + ? WHERE product_id = ?`,
          [item.quantity, item.item_id]
        );
      }
    }

    res.json({
      success: true,
      message: 'Order cancelled successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error cancelling order',
      error: error.message
    });
  }
};

