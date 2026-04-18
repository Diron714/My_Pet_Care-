import express from 'express';
import {
    getCustomerDashboard,
    getCustomerProfile,
    updateCustomerProfile,
    getLoyaltyInfo
} from '../controllers/customerController.js';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';

const router = express.Router();

router.use(authenticate);
router.use(requireRole('customer'));

router.get('/dashboard', getCustomerDashboard);
router.get('/profile', getCustomerProfile);
router.put('/profile', updateCustomerProfile);
router.get('/loyalty', getLoyaltyInfo);

export default router;
