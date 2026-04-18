import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import {
  getAllPreBookings,
  createPreBooking,
  cancelPreBooking,
  fulfillPreBooking,
  notifyCustomer
} from '../controllers/preBookingController.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Customer & Admin routes
router.get('/', getAllPreBookings);

// Customer routes
router.post('/', requireRole(['customer']), createPreBooking);
router.delete('/:id', requireRole(['customer']), cancelPreBooking);

// Admin/Staff only routes
router.put('/:id/fulfill', requireRole(['admin']), fulfillPreBooking);
router.post('/:id/notify', requireRole(['admin']), notifyCustomer);

export default router;

