import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import {
  getAllProducts,
  getProductById,
  getProductsByCategory,
  createProduct,
  updateProduct,
  deleteProduct
} from '../controllers/productController.js';

const router = express.Router();

// Public routes
router.get('/', getAllProducts);
router.get('/category/:category', getProductsByCategory);
router.get('/:id', getProductById);

// Protected routes (Admin/Staff only)
router.post('/', authenticate, requireRole(['admin']), createProduct);
router.put('/:id', authenticate, requireRole(['admin']), updateProduct);
router.delete('/:id', authenticate, requireRole(['admin']), deleteProduct);

export default router;

