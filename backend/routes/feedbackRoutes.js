import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import {
  getAllFeedback,
  createFeedback,
  updateFeedbackStatus,
  addAdminResponse,
  getItemFeedback
} from '../controllers/feedbackController.js';

const router = express.Router();

// Public route - get feedback for specific item
router.get('/item/:type/:id', getItemFeedback);

// Protected routes
router.get('/', authenticate, getAllFeedback);
router.post('/', authenticate, requireRole(['customer']), createFeedback);

// Admin only routes
router.put('/:id/status', authenticate, requireRole(['admin']), updateFeedbackStatus);
router.post('/:id/response', authenticate, requireRole(['admin']), addAdminResponse);

export default router;

