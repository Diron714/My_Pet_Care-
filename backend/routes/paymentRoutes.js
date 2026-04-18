import express from 'express';
import { authenticate } from '../middleware/auth.js';
import {
  initiatePayment,
  handleNotify,
  handleReturn,
  verifyPayment,
  mockPaymentSuccess
} from '../controllers/paymentController.js';

const router = express.Router();

// Public route - PayHere will call this
router.post('/payhere/notify', handleNotify);

// Public route - PayHere redirects here after payment
router.get('/payhere/return', handleReturn);

// Protected routes - require authentication
router.post('/payhere/initiate', authenticate, initiatePayment);
router.post('/payhere/verify', authenticate, verifyPayment);
router.post('/mock-success', authenticate, mockPaymentSuccess);

export default router;

