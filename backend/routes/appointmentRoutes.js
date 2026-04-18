import express from 'express';
import {
    getAppointments,
    getAppointmentById,
    bookAppointment,
    updateAppointmentStatus,
    getAvailableSlots
} from '../controllers/appointmentController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

router.get('/', getAppointments);
router.get('/available-slots', getAvailableSlots);
router.get('/:id', getAppointmentById);
router.post('/', bookAppointment);
router.put('/:id/status', updateAppointmentStatus);

export default router;
