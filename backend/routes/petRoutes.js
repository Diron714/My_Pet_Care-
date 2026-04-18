import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import {
  getAllPets,
  getPetById,
  createPet,
  updatePet,
  deletePet,
  addPetImage
} from '../controllers/petController.js';

const router = express.Router();

// Public routes
router.get('/', getAllPets);
router.get('/:id', getPetById);

// Protected routes (Admin/Staff only)
router.post('/', authenticate, requireRole(['admin']), createPet);
router.put('/:id', authenticate, requireRole(['admin']), updatePet);
router.delete('/:id', authenticate, requireRole(['admin']), deletePet);
router.post('/:id/images', authenticate, requireRole(['admin']), addPetImage);

export default router;

