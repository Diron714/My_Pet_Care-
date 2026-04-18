import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import {
  getChatRooms,
  createChatRoom,
  getChatMessages,
  sendMessage,
  markMessageAsRead,
  closeChatRoom
} from '../controllers/chatController.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Chat is only for customers and admins (not doctors)
router.use((req, res, next) => {
  if (String(req.user?.role || '').trim().toLowerCase() === 'doctor') {
    return res.status(403).json({
      success: false,
      message: 'Chat is not available for doctor accounts',
    });
  }
  next();
});

// Chat room routes
router.get('/rooms', getChatRooms);
router.post('/rooms', createChatRoom);
router.get('/rooms/:id/messages', getChatMessages);
router.post('/rooms/:id/messages', sendMessage);
router.put('/rooms/:id/close', requireRole(['admin']), closeChatRoom);

// Message routes
router.put('/messages/:id/read', markMessageAsRead);

export default router;

