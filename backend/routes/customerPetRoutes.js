import express from 'express';
import {
    getCustomerPets,
    getCustomerPetById,
    addCustomerPet,
    updateCustomerPet,
    getPetVaccinations,
    addVaccinationRecord,
    getFeedingSchedules,
    addFeedingSchedule
} from '../controllers/customerPetController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

router.get('/', getCustomerPets);
router.post('/', addCustomerPet);
router.get('/:id', getCustomerPetById);
router.put('/:id', updateCustomerPet);
router.get('/:id/vaccinations', getPetVaccinations);
router.post('/:id/vaccinations', addVaccinationRecord);
router.get('/:id/feeding-schedules', getFeedingSchedules);
router.post('/:id/feeding-schedules', addFeedingSchedule);

export default router;
