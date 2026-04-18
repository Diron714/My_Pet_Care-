import pool from '../config/database.js';
import { saveBase64Image } from '../utils/imageUpload.js';

// =============================================
// CUSTOMER PET MANAGEMENT (Personal Pets)
// =============================================

// GET /api/customer-pets - Get customer's own pets
export const getCustomerPets = async (req, res) => {
    try {
        const userId = req.user.userId;

        // Get customer_id
        const [customers] = await pool.query('SELECT customer_id FROM customers WHERE user_id = ?', [userId]);
        if (customers.length === 0) {
            return res.status(404).json({ success: false, message: 'Customer profile not found' });
        }
        const customerId = customers[0].customer_id;

        const [pets] = await pool.query(
            `SELECT * FROM customer_pets WHERE customer_id = ? ORDER BY created_at DESC`,
            [customerId]
        );

        res.json({
            success: true,
            data: pets
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching customer pets',
            error: error.message
        });
    }
};

// GET /api/customer-pets/:id - Get single pet (owned by current customer)
export const getCustomerPetById = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;

        const [customers] = await pool.query('SELECT customer_id FROM customers WHERE user_id = ?', [userId]);
        if (customers.length === 0) {
            return res.status(404).json({ success: false, message: 'Customer profile not found' });
        }
        const customerId = customers[0].customer_id;

        const [pets] = await pool.query(
            `SELECT * FROM customer_pets WHERE customer_pet_id = ? AND customer_id = ? LIMIT 1`,
            [id, customerId]
        );

        if (pets.length === 0) {
            return res.status(404).json({ success: false, message: 'Pet not found or unauthorized' });
        }

        res.json({
            success: true,
            data: pets[0]
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching pet',
            error: error.message
        });
    }
};

// POST /api/customer-pets - Add a personal pet
export const addCustomerPet = async (req, res) => {
    try {
        const { name, species, breed, age, gender, image_url } = req.body;
        const userId = req.user.userId;

        const [customers] = await pool.query('SELECT customer_id FROM customers WHERE user_id = ?', [userId]);
        if (customers.length === 0) {
            return res.status(404).json({ success: false, message: 'Customer profile not found' });
        }
        const customerId = customers[0].customer_id;

        let dbImageUrl = image_url || null;
        if (image_url && typeof image_url === 'string' && image_url.startsWith('data:image')) {
            try {
                const savedPath = await saveBase64Image(image_url, 'customer-pets');
                if (savedPath) {
                    dbImageUrl = savedPath;
                }
            } catch (err) {
                console.error('Error saving customer pet image:', err);
                dbImageUrl = null;
            }
        }

        const [result] = await pool.query(
            `INSERT INTO customer_pets (customer_id, name, species, breed, age, gender, image_url)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [customerId, name, species, breed, age, gender, dbImageUrl]
        );

        res.status(201).json({
            success: true,
            message: 'Pet profile created successfully',
            data: { customer_pet_id: result.insertId }
        });
    } catch (error) {
        console.error('Error adding pet:', error);
        res.status(500).json({
            success: false,
            message: 'Error adding pet',
            error: error.message
        });
    }
};

// PUT /api/customer-pets/:id - Update pet profile
export const updateCustomerPet = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, species, breed, age, gender, image_url } = req.body;
        const userId = req.user.userId;

        const [customers] = await pool.query('SELECT customer_id FROM customers WHERE user_id = ?', [userId]);
        const customerId = customers[0]?.customer_id;
        if (!customerId) {
            return res.status(404).json({ success: false, message: 'Customer profile not found' });
        }

        let dbImageUrl = image_url;
        if (image_url && typeof image_url === 'string' && image_url.startsWith('data:image')) {
            try {
                const savedPath = await saveBase64Image(image_url, 'customer-pets');
                if (savedPath) {
                    dbImageUrl = savedPath;
                }
            } catch (err) {
                console.error('Error saving customer pet image (update):', err);
                dbImageUrl = null;
            }
        }

        const [result] = await pool.query(
            `UPDATE customer_pets SET 
        name = COALESCE(?, name),
        species = COALESCE(?, species),
        breed = COALESCE(?, breed),
        age = COALESCE(?, age),
        gender = COALESCE(?, gender),
        image_url = COALESCE(?, image_url),
        updated_at = NOW()
       WHERE customer_pet_id = ? AND customer_id = ?`,
            [name, species, breed, age, gender, dbImageUrl, id, customerId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Pet not found or unauthorized' });
        }

        res.json({ success: true, message: 'Pet updated successfully' });
    } catch (error) {
        console.error('Error updating pet:', error);
        res.status(500).json({ success: false, message: 'Error updating pet', error: error.message });
    }
};

// GET /api/customer-pets/:id/vaccinations
export const getPetVaccinations = async (req, res) => {
    try {
        const { id } = req.params;
        const [records] = await pool.query(
            `SELECT * FROM pet_vaccinations WHERE customer_pet_id = ? ORDER BY vaccination_date DESC`,
            [id]
        );
        res.json({ success: true, data: records });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching vaccinations', error: error.message });
    }
};

// POST /api/customer-pets/:id/vaccinations
export const addVaccinationRecord = async (req, res) => {
    try {
        const { id } = req.params;
        const { vaccine_name, vaccination_date, next_due_date, notes } = req.body;

        await pool.query(
            `INSERT INTO pet_vaccinations (customer_pet_id, vaccine_name, vaccination_date, next_due_date, notes)
       VALUES (?, ?, ?, ?, ?)`,
            [id, vaccine_name, vaccination_date, next_due_date || null, notes || null]
        );

        res.status(201).json({ success: true, message: 'Vaccination record added' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error adding vaccination', error: error.message });
    }
};

// GET /api/customer-pets/:id/feeding-schedules
export const getFeedingSchedules = async (req, res) => {
    try {
        const { id } = req.params;
        const [records] = await pool.query(
            `SELECT * FROM pet_feeding_schedules WHERE customer_pet_id = ? ORDER BY feeding_time ASC`,
            [id]
        );
        res.json({ success: true, data: records });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching feeding schedules', error: error.message });
    }
};

// POST /api/customer-pets/:id/feeding-schedules
export const addFeedingSchedule = async (req, res) => {
    try {
        const { id } = req.params;
        const { food_type, feeding_time, quantity, notes } = req.body;

        await pool.query(
            `INSERT INTO pet_feeding_schedules (customer_pet_id, food_type, feeding_time, quantity, notes)
       VALUES (?, ?, ?, ?, ?)`,
            [id, food_type, feeding_time, quantity || null, notes || null]
        );

        res.status(201).json({ success: true, message: 'Feeding schedule added' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error adding feeding schedule', error: error.message });
    }
};
