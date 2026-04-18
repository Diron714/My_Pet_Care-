import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import {
  getAllOrders,
  getOrderById,
  createOrder,
  updateOrderStatus,
  cancelOrder,
  downloadInvoice
} from '../controllers/orderController.js';

const router = express.Router();

// All order routes require authentication
router.use(authenticate);

// Customer & Admin routes
router.get('/', getAllOrders);
router.get('/:id/invoice', downloadInvoice);
router.get('/:id', getOrderById);
router.post('/', requireRole(['customer']), createOrder);
router.put('/:id/cancel', requireRole(['customer']), cancelOrder);

// Admin/Staff only routes
router.put('/:id/status', requireRole(['admin']), updateOrderStatus);

export default router;

