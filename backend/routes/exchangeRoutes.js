import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import {
  getAllExchanges,
  createExchange,
  cancelExchange,
  approveExchange,
  rejectExchange,
  completeExchange
} from '../controllers/exchangeController.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Customer & Admin routes
router.get('/', getAllExchanges);

// Customer routes
router.post('/', requireRole(['customer']), createExchange);
router.delete('/:id', requireRole(['customer']), cancelExchange);

// Admin/Staff only routes
router.put('/:id/approve', requireRole(['admin']), approveExchange);
router.put('/:id/reject', requireRole(['admin']), rejectExchange);
router.put('/:id/complete', requireRole(['admin']), completeExchange);

export default router;

