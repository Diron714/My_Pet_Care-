import express from 'express';
import {
    getAllDoctors,
    getDoctorById,
    getDoctorSchedule,
    updateDoctorProfile,
    getDoctorDashboard,
    getDoctorProfile,
    getMySchedule,
    createScheduleSlot,
    updateScheduleSlot,
    deleteScheduleSlot
} from '../controllers/doctorController.js';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';

const router = express.Router();

// Public routes
router.get('/', getAllDoctors);

// Doctor-only routes (must be defined before parameterized :id routes)
router.get('/dashboard', authenticate, requireRole('doctor'), getDoctorDashboard);
router.get('/profile', authenticate, requireRole('doctor'), getDoctorProfile);
router.put('/profile', authenticate, requireRole('doctor'), updateDoctorProfile);

router.get('/schedule', authenticate, requireRole('doctor'), getMySchedule);
router.post('/schedule', authenticate, requireRole('doctor'), createScheduleSlot);
router.put('/schedule/:id', authenticate, requireRole('doctor'), updateScheduleSlot);
router.delete('/schedule/:id', authenticate, requireRole('doctor'), deleteScheduleSlot);

// Public doctor-by-id routes
router.get('/:id', getDoctorById);
router.get('/:id/schedule', getDoctorSchedule);

export default router;
