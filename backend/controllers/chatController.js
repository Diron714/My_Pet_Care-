import pool from '../config/database.js';
import { emitChatMessage } from '../services/socketService.js';
import { checkChatRoomAccess } from '../utils/chatRoomAccess.js';

// =============================================
// CHAT MANAGEMENT
// =============================================

// GET /api/chat/rooms - Get chat rooms
export const getChatRooms = async (req, res) => {
  try {
    const userRole = String(req.user.role || '').trim().toLowerCase();
    const userId = req.user.userId;
    const { room_type } = req.query;

    let query = `
      SELECT cr.*,
             cu.first_name as customer_first_name, cu.last_name as customer_last_name,
             du.first_name as doctor_first_name, du.last_name as doctor_last_name,
             su.first_name as staff_first_name, su.last_name as staff_last_name,
             (SELECT COUNT(*) FROM chat_messages cm WHERE cm.room_id = cr.room_id AND cm.is_read = FALSE) as unread_count
      FROM chat_rooms cr
      JOIN customers c ON cr.customer_id = c.customer_id
      JOIN users cu ON c.user_id = cu.user_id
      LEFT JOIN doctors d ON cr.doctor_id = d.doctor_id
      LEFT JOIN users du ON d.user_id = du.user_id
      LEFT JOIN users su ON cr.staff_id = su.user_id
      WHERE cr.is_active = TRUE
    `;
    const params = [];

    // Filter based on user role
    // Admin/Staff should ONLY see customer_staff rooms based on user request "admin and customer only chat"
    if (userRole === 'admin' || userRole === 'staff') {
      query += ` AND cr.room_type = 'customer_staff'`;
    } else if (userRole === 'customer') {
      query += ` AND c.user_id = ?`;
      params.push(userId);
    }

    if (room_type && room_type !== 'all') {
      query += ` AND cr.room_type = ?`;
      params.push(room_type);
    }

    query += ` ORDER BY cr.updated_at DESC`;

    const [rooms] = await pool.query(query, params);

    // Format response
    const formattedRooms = rooms.map(r => ({
      room_id: r.room_id,
      room_type: r.room_type,
      is_active: r.is_active,
      appointment_id: r.appointment_id,
      order_id: r.order_id,
      doctor_id: r.doctor_id,
      staff_id: r.staff_id,
      unread_count: r.unread_count,
      customer: {
        user: {
          first_name: r.customer_first_name,
          last_name: r.customer_last_name
        }
      },
      doctor: r.doctor_id ? {
        user: {
          first_name: r.doctor_first_name,
          last_name: r.doctor_last_name
        }
      } : null,
      staff: r.staff_id ? {
        user: {
          first_name: r.staff_first_name,
          last_name: r.staff_last_name
        }
      } : null,
      created_at: r.created_at,
      updated_at: r.updated_at
    }));

    res.json({
      success: true,
      data: formattedRooms
    });
  } catch (error) {
    console.error('Get chat rooms error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching chat rooms',
      error: error.message
    });
  }
};

// POST /api/chat/rooms - Create chat room
export const createChatRoom = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { room_type, doctor_id, appointment_id, order_id } = req.body;

    if (!room_type) {
      return res.status(400).json({
        success: false,
        message: 'Room type is required'
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

    if (room_type === 'customer_doctor' || doctor_id) {
      return res.status(400).json({
        success: false,
        message: 'Doctor chat is not available. Use support chat to reach the admin team.',
      });
    }

    // Check for existing active room
    let existingQuery = `
      SELECT room_id FROM chat_rooms 
      WHERE customer_id = ? AND room_type = ? AND is_active = TRUE
    `;
    const existingParams = [customers[0].customer_id, room_type];

    if (doctor_id) {
      existingQuery += ` AND doctor_id = ?`;
      existingParams.push(doctor_id);
    }

    const [existing] = await pool.query(existingQuery, existingParams);

    if (existing.length > 0) {
      return res.json({
        success: true,
        message: 'Chat room already exists',
        data: { room_id: existing[0].room_id }
      });
    }

    // Create new room
    const [result] = await pool.query(
      `INSERT INTO chat_rooms (room_type, customer_id, doctor_id, appointment_id, order_id)
       VALUES (?, ?, ?, ?, ?)`,
      [room_type, customers[0].customer_id, doctor_id || null, appointment_id || null, order_id || null]
    );

    res.status(201).json({
      success: true,
      message: 'Chat room created',
      data: { room_id: result.insertId }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating chat room',
      error: error.message
    });
  }
};

// GET /api/chat/rooms/:id/messages - Get messages for a room
export const getChatMessages = async (req, res) => {
  try {
    const { id } = req.params;
    const { limit = 50, offset = 0 } = req.query;
    const userId = req.user.userId;
    const userRole = String(req.user?.role || '').trim().toLowerCase();

    const { allowed, notFound } = await checkChatRoomAccess(pool, id, userId, userRole);
    if (notFound) {
      return res.status(404).json({ success: false, message: 'Chat room not found' });
    }
    if (!allowed) {
      return res.status(403).json({ success: false, message: 'You do not have access to this chat room' });
    }

    const [messages] = await pool.query(
      `SELECT cm.*, u.first_name, u.last_name, u.role
       FROM chat_messages cm
       JOIN users u ON cm.sender_id = u.user_id
       WHERE cm.room_id = ?
       ORDER BY cm.created_at ASC
       LIMIT ? OFFSET ?`,
      [id, parseInt(limit), parseInt(offset)]
    );

    // Mark messages as read
    await pool.query(
      `UPDATE chat_messages SET is_read = TRUE, read_at = NOW()
       WHERE room_id = ? AND sender_id != ? AND is_read = FALSE`,
      [id, req.user.userId]
    );

    const formattedMessages = messages.map(m => ({
      message_id: m.message_id,
      room_id: m.room_id,
      sender_id: m.sender_id,
      message_text: m.message_text,
      is_read: !!m.is_read,
      read_at: m.read_at || null,
      sender: {
        first_name: m.first_name,
        last_name: m.last_name,
        role: m.role
      },
      created_at: m.created_at
    }));

    res.json({
      success: true,
      data: formattedMessages
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching messages',
      error: error.message
    });
  }
};

// POST /api/chat/rooms/:id/messages - Send message
export const sendMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const { messageText } = req.body;
    const userId = req.user.userId;
    const userRole = String(req.user?.role || '').trim().toLowerCase();

    if (!messageText || !messageText.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Message text is required'
      });
    }

    const { allowed, notFound } = await checkChatRoomAccess(pool, id, userId, userRole);
    if (notFound) {
      return res.status(404).json({ success: false, message: 'Chat room not found' });
    }
    if (!allowed) {
      return res.status(403).json({ success: false, message: 'You do not have access to this chat room' });
    }

    // Insert message
    const [result] = await pool.query(
      `INSERT INTO chat_messages (room_id, sender_id, message_text)
       VALUES (?, ?, ?)`,
      [id, userId, messageText.trim()]
    );

    const messageId = result.insertId;

    // Update room's updated_at
    await pool.query(
      `UPDATE chat_rooms SET updated_at = NOW() WHERE room_id = ?`,
      [id]
    );

    // Return full message so frontend can show sent/read status
    const [rows] = await pool.query(
      `SELECT cm.*, u.first_name, u.last_name, u.role
       FROM chat_messages cm
       JOIN users u ON cm.sender_id = u.user_id
       WHERE cm.message_id = ?`,
      [messageId]
    );

    const m = rows[0];
    const data = m ? {
      message_id: m.message_id,
      room_id: m.room_id,
      sender_id: m.sender_id,
      message_text: m.message_text,
      is_read: !!m.is_read,
      read_at: m.read_at || null,
      sender: {
        first_name: m.first_name,
        last_name: m.last_name,
        role: m.role
      },
      created_at: m.created_at
    } : { message_id: messageId };

    emitChatMessage(id, data);

    res.status(201).json({
      success: true,
      message: 'Message sent',
      data
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error sending message',
      error: error.message
    });
  }
};

// PUT /api/chat/messages/:id/read - Mark message as read
export const markMessageAsRead = async (req, res) => {
  try {
    const { id } = req.params;

    await pool.query(
      `UPDATE chat_messages SET is_read = TRUE, read_at = NOW()
       WHERE message_id = ?`,
      [id]
    );

    res.json({
      success: true,
      message: 'Message marked as read'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error marking message as read',
      error: error.message
    });
  }
};

// PUT /api/chat/rooms/:id/close - Close chat room (Admin/Staff)
export const closeChatRoom = async (req, res) => {
  try {
    const { id } = req.params;

    await pool.query(
      `UPDATE chat_rooms SET is_active = FALSE, updated_at = NOW()
       WHERE room_id = ?`,
      [id]
    );

    res.json({
      success: true,
      message: 'Chat room closed'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error closing chat room',
      error: error.message
    });
  }
};

