import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  broadcastNotification
} from '../controllers/notificationController.js';

const router = express.Router();

// Protected routes - require authentication
router.get('/', authenticate, getNotifications);
router.get('/unread', authenticate, getUnreadCount);
router.put('/:id/read', authenticate, markAsRead);
router.put('/read-all', authenticate, markAllAsRead);
router.delete('/:id', authenticate, deleteNotification);

// Admin only - broadcast notifications
router.post('/broadcast', authenticate, requireRole(['admin']), broadcastNotification);

export default router;

