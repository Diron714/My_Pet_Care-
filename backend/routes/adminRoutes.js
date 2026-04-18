import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import {
  getDashboardStats,
  getDashboardChartData,
  getAllUsers,
  getUserById,
  createUser,
  updateUserStatus,
  updateUserRole,
  getReport,
  exportReport
} from '../controllers/adminController.js';

const router = express.Router();

// All routes require authentication and admin role
router.use(authenticate);
router.use(requireRole(['admin']));

// Dashboard (chart route before :id-style to avoid conflict)
router.get('/dashboard/chart', getDashboardChartData);
router.get('/dashboard', getDashboardStats);

// User Management
router.get('/users', getAllUsers);
router.post('/users', createUser);
router.get('/users/:id', getUserById);
router.put('/users/:id/status', updateUserStatus);
router.put('/users/:id/role', requireRole(['admin']), updateUserRole); // Only admin can change roles

// Reports
router.get('/reports/:type', getReport);
router.get('/reports/:type/export', exportReport);

export default router;

