import express from 'express';
import {
    getHealthRecords,
    createHealthRecord,
    updateHealthRecord,
    getHealthRecordById,
    getHealthRecordsByPet,
    downloadHealthRecord
} from '../controllers/healthRecordController.js';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';

const router = express.Router();

router.use(authenticate);

router.get('/', getHealthRecords);
router.get('/pet/:id', getHealthRecordsByPet);
router.get('/:id/download', downloadHealthRecord);
router.get('/:id', getHealthRecordById);
router.post('/', requireRole('doctor'), createHealthRecord);
router.put('/:id', requireRole('doctor'), updateHealthRecord);

export default router;
