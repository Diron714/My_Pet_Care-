import express from 'express';
import {
    getReminders,
    getUpcomingReminders,
    createReminder,
    markAsCompleted,
    deleteReminder,
    updateReminder
} from '../controllers/reminderController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

router.get('/', getReminders);
router.get('/upcoming', getUpcomingReminders);
router.post('/', createReminder);
router.put('/:id', updateReminder);
router.put('/:id/complete', markAsCompleted);
router.delete('/:id', deleteReminder);

export default router;
