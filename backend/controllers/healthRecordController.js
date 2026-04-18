import pool from '../config/database.js';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const PDFDocument = require('pdfkit');

// =============================================
// HEALTH RECORD MANAGEMENT
// =============================================

// GET /api/health-records - Get health records (Doctor view or Customer view)
export const getHealthRecords = async (req, res) => {
    try {
        const { petId, petName, customerName, dateFrom, dateTo, limit = 50, offset = 0 } = req.query;
        const { userId } = req.user;
        const role = String(req.user?.role || '').trim().toLowerCase();

        let query = `
            SELECT hr.*, 
                   cp.name        AS pet_name,
                   cp.species     AS pet_species,
                   cp.breed       AS pet_breed,
                   u_cu.first_name AS customer_first_name,
                   u_cu.last_name  AS customer_last_name,
                   u_dr.first_name AS dr_first_name,
                   u_dr.last_name  AS dr_last_name
            FROM health_records hr
            JOIN customer_pets cp ON hr.customer_pet_id = cp.customer_pet_id
            JOIN customers c      ON cp.customer_id = c.customer_id
            JOIN users u_cu       ON c.user_id = u_cu.user_id
            JOIN doctors d        ON hr.doctor_id = d.doctor_id
            JOIN users u_dr       ON d.user_id = u_dr.user_id
            WHERE 1=1
        `;
        const params = [];

        if (role === 'customer') {
            const [customers] = await pool.query('SELECT customer_id FROM customers WHERE user_id = ?', [userId]);
            if (!customers.length) {
                return res.status(404).json({ success: false, message: 'Customer profile not found' });
            }
            query += ` AND cp.customer_id = ?`;
            params.push(customers[0].customer_id);
        } else if (role === 'doctor') {
            const [doctors] = await pool.query('SELECT doctor_id FROM doctors WHERE user_id = ?', [userId]);
            if (!doctors.length) {
                return res.status(403).json({ success: false, message: 'Doctor profile not found' });
            }
            query += ` AND hr.doctor_id = ?`;
            params.push(doctors[0].doctor_id);
        }

        if (petId) {
            query += ` AND hr.customer_pet_id = ?`;
            params.push(petId);
        }

        if (petName) {
            query += ` AND cp.name LIKE ?`;
            params.push(`%${petName}%`);
        }

        if (customerName) {
            query += ` AND (u_cu.first_name LIKE ? OR u_cu.last_name LIKE ?)`;
            const nameTerm = `%${customerName}%`;
            params.push(nameTerm, nameTerm);
        }

        if (dateFrom) {
            query += ` AND hr.record_date >= ?`;
            params.push(dateFrom);
        }

        if (dateTo) {
            query += ` AND hr.record_date <= ?`;
            params.push(dateTo);
        }

        query += ` ORDER BY hr.record_date DESC LIMIT ? OFFSET ?`;
        params.push(parseInt(limit), parseInt(offset));

        const [records] = await pool.query(query, params);

        const formatted = records.map(r => ({
            record_id: r.record_id,
            appointment_id: r.appointment_id,
            customer_pet_id: r.customer_pet_id,
            doctor_id: r.doctor_id,
            diagnosis: r.diagnosis,
            prescription: r.prescription,
            treatment_notes: r.treatment_notes,
            record_date: r.record_date,
            created_at: r.created_at,
            updated_at: r.updated_at,
            customer_pet: {
                name: r.pet_name,
                species: r.pet_species,
                breed: r.pet_breed,
            },
            customer: {
                user: {
                    first_name: r.customer_first_name,
                    last_name: r.customer_last_name,
                },
            },
            doctor: {
                user: {
                    first_name: r.dr_first_name,
                    last_name: r.dr_last_name,
                },
            },
        }));

        res.json({
            success: true,
            data: formatted,
        });
    } catch (error) {
        console.error('Get health records error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching health records',
            error: error.message,
        });
    }
};

// POST /api/health-records - Create health record (Doctor only)
export const createHealthRecord = async (req, res) => {
    try {
        const { appointment_id, customer_pet_id, diagnosis, prescription, treatment_notes, record_date } = req.body;
        const userId = req.user.userId;

        // Get doctor_id
        const [doctors] = await pool.query('SELECT doctor_id FROM doctors WHERE user_id = ?', [userId]);
        if (doctors.length === 0) {
            return res.status(403).json({ success: false, message: 'Only doctors can create health records' });
        }
        const doctorId = doctors[0].doctor_id;

        const [result] = await pool.query(
            `INSERT INTO health_records (appointment_id, customer_pet_id, doctor_id, diagnosis, prescription, treatment_notes, record_date)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [appointment_id || null, customer_pet_id, doctorId, diagnosis, prescription, treatment_notes, record_date || new Date().toISOString().split('T')[0]]
        );

        res.status(201).json({
            success: true,
            message: 'Health record created successfully',
            data: { record_id: result.insertId }
        });
    } catch (error) {
        console.error('Create health record error:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating health record',
            error: error.message
        });
    }
};

// PUT /api/health-records/:id - Update health record (Doctor only, own records)
export const updateHealthRecord = async (req, res) => {
    try {
        const { id } = req.params;
        const { appointment_id, customer_pet_id, diagnosis, prescription, treatment_notes, record_date } = req.body;
        const userId = req.user.userId;

        const [doctors] = await pool.query('SELECT doctor_id FROM doctors WHERE user_id = ?', [userId]);
        if (doctors.length === 0) {
            return res.status(403).json({ success: false, message: 'Only doctors can update health records' });
        }
        const doctorId = doctors[0].doctor_id;

        const [existing] = await pool.query(
            'SELECT record_id, doctor_id FROM health_records WHERE record_id = ?',
            [id]
        );
        if (existing.length === 0) {
            return res.status(404).json({ success: false, message: 'Health record not found' });
        }
        if (existing[0].doctor_id !== doctorId) {
            return res.status(403).json({ success: false, message: 'You can only update your own health records' });
        }

        await pool.query(
            `UPDATE health_records SET
                appointment_id = ?, customer_pet_id = ?, diagnosis = ?, prescription = ?,
                treatment_notes = ?, record_date = ?, updated_at = CURRENT_TIMESTAMP
             WHERE record_id = ?`,
            [appointment_id || null, customer_pet_id, diagnosis, prescription, treatment_notes, record_date || new Date().toISOString().split('T')[0], id]
        );

        res.json({
            success: true,
            message: 'Health record updated successfully',
            data: { record_id: parseInt(id, 10) }
        });
    } catch (error) {
        console.error('Update health record error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating health record',
            error: error.message
        });
    }
};

// GET /api/health-records/:id - Get record details
export const getHealthRecordById = async (req, res) => {
    try {
        const { id } = req.params;
        const [records] = await pool.query(
            `SELECT hr.*, 
                    cp.name  AS pet_name,
                    cp.species AS pet_species,
                    cp.breed AS pet_breed,
                    u_cu.first_name AS customer_first_name,
                    u_cu.last_name  AS customer_last_name,
                    u_dr.first_name AS dr_first_name,
                    u_dr.last_name  AS dr_last_name
             FROM health_records hr
             JOIN customer_pets cp ON hr.customer_pet_id = cp.customer_pet_id
             JOIN customers c      ON cp.customer_id = c.customer_id
             JOIN users u_cu       ON c.user_id = u_cu.user_id
             JOIN doctors d        ON hr.doctor_id = d.doctor_id
             JOIN users u_dr       ON d.user_id = u_dr.user_id
             WHERE hr.record_id = ?`,
            [id]
        );

        if (records.length === 0) {
            return res.status(404).json({ success: false, message: 'Health record not found' });
        }

        const r = records[0];
        const formatted = {
            record_id: r.record_id,
            appointment_id: r.appointment_id,
            customer_pet_id: r.customer_pet_id,
            doctor_id: r.doctor_id,
            diagnosis: r.diagnosis,
            prescription: r.prescription,
            treatment_notes: r.treatment_notes,
            record_date: r.record_date,
            created_at: r.created_at,
            updated_at: r.updated_at,
            customer_pet: {
                name: r.pet_name,
                species: r.pet_species,
                breed: r.pet_breed,
            },
            customer: {
                user: {
                    first_name: r.customer_first_name,
                    last_name: r.customer_last_name,
                },
            },
            doctor: {
                user: {
                    first_name: r.dr_first_name,
                    last_name: r.dr_last_name,
                },
            },
        };

        res.json({ success: true, data: formatted });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching record details', error: error.message });
    }
};

// GET /api/health-records/:id/download - Download health record as PDF (Customer: own records only)
export const downloadHealthRecord = async (req, res) => {
    try {
        const { id } = req.params;
        const { userId } = req.user;
        const role = String(req.user?.role || '').trim().toLowerCase();

        let query = `
            SELECT hr.*,
                   cp.name AS pet_name, cp.species AS pet_species, cp.breed AS pet_breed, cp.customer_id AS pet_customer_id,
                   u_cu.first_name AS customer_first_name, u_cu.last_name AS customer_last_name,
                   u_dr.first_name AS dr_first_name, u_dr.last_name AS dr_last_name
            FROM health_records hr
            JOIN customer_pets cp ON hr.customer_pet_id = cp.customer_pet_id
            JOIN customers c ON cp.customer_id = c.customer_id
            JOIN users u_cu ON c.user_id = u_cu.user_id
            JOIN doctors d ON hr.doctor_id = d.doctor_id
            JOIN users u_dr ON d.user_id = u_dr.user_id
            WHERE hr.record_id = ?
        `;
        const params = [id];

        if (role === 'customer') {
            const [customers] = await pool.query('SELECT customer_id FROM customers WHERE user_id = ?', [userId]);
            if (!customers.length) {
                return res.status(404).json({ success: false, message: 'Customer profile not found' });
            }
            query += ` AND cp.customer_id = ?`;
            params.push(customers[0].customer_id);
        }

        const [records] = await pool.query(query, params);
        if (records.length === 0) {
            return res.status(404).json({ success: false, message: 'Health record not found' });
        }

        const r = records[0];
        const doc = new PDFDocument({ margin: 50 });
        const filename = `health-record-${id}.pdf`;

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        doc.pipe(res);

        doc.fontSize(20).text('My Pet Care+ - Health Record', { align: 'center' });
        doc.moveDown();
        doc.fontSize(10).text(`Record Date: ${String(r.record_date).slice(0, 10)}`, { continued: false });
        doc.text(`Pet: ${r.pet_name} (${r.pet_species}${r.pet_breed ? `, ${r.pet_breed}` : ''})`);
        doc.text(`Owner: ${r.customer_first_name} ${r.customer_last_name}`);
        doc.text(`Doctor: Dr. ${r.dr_first_name} ${r.dr_last_name}`);
        doc.moveDown();

        if (r.diagnosis) {
            doc.fontSize(12).text('Diagnosis', { underline: true });
            doc.fontSize(10).text(r.diagnosis);
            doc.moveDown();
        }
        if (r.prescription) {
            doc.fontSize(12).text('Prescription', { underline: true });
            doc.fontSize(10).text(r.prescription);
            doc.moveDown();
        }
        if (r.treatment_notes) {
            doc.fontSize(12).text('Treatment Notes', { underline: true });
            doc.fontSize(10).text(r.treatment_notes);
        }

        doc.end();
    } catch (error) {
        console.error('Download health record error:', error);
        if (!res.headersSent) {
            res.status(500).json({ success: false, message: 'Error downloading record', error: error.message });
        }
    }
};

// GET /api/health-records/pet/:id - Get records for a specific pet
export const getHealthRecordsByPet = async (req, res) => {
    try {
        const { id } = req.params;
        const { userId } = req.user;
        const role = String(req.user?.role || '').trim().toLowerCase();

        let query = `
            SELECT hr.*,
                   cp.name  AS pet_name,
                   cp.species AS pet_species,
                   cp.breed AS pet_breed,
                   u_cu.first_name AS customer_first_name,
                   u_cu.last_name  AS customer_last_name,
                   u_dr.first_name AS dr_first_name,
                   u_dr.last_name  AS dr_last_name
            FROM health_records hr
            JOIN customer_pets cp ON hr.customer_pet_id = cp.customer_pet_id
            JOIN customers c      ON cp.customer_id = c.customer_id
            JOIN users u_cu       ON c.user_id = u_cu.user_id
            JOIN doctors d        ON hr.doctor_id = d.doctor_id
            JOIN users u_dr       ON d.user_id = u_dr.user_id
            WHERE hr.customer_pet_id = ?
        `;
        const params = [id];

        if (role === 'customer') {
            const [customers] = await pool.query('SELECT customer_id FROM customers WHERE user_id = ?', [userId]);
            if (!customers.length) {
                return res.status(404).json({ success: false, message: 'Customer profile not found' });
            }
            query += ` AND cp.customer_id = ?`;
            params.push(customers[0].customer_id);
        } else if (role === 'doctor') {
            const [doctors] = await pool.query('SELECT doctor_id FROM doctors WHERE user_id = ?', [userId]);
            if (!doctors.length) {
                return res.status(403).json({ success: false, message: 'Doctor profile not found' });
            }
            query += ` AND hr.doctor_id = ?`;
            params.push(doctors[0].doctor_id);
        }

        query += ` ORDER BY hr.record_date DESC`;

        const [records] = await pool.query(query, params);

        const formatted = records.map(r => ({
            record_id: r.record_id,
            appointment_id: r.appointment_id,
            customer_pet_id: r.customer_pet_id,
            doctor_id: r.doctor_id,
            diagnosis: r.diagnosis,
            prescription: r.prescription,
            treatment_notes: r.treatment_notes,
            record_date: r.record_date,
            created_at: r.created_at,
            updated_at: r.updated_at,
            customer_pet: {
                name: r.pet_name,
                species: r.pet_species,
                breed: r.pet_breed,
            },
            customer: {
                user: {
                    first_name: r.customer_first_name,
                    last_name: r.customer_last_name,
                },
            },
            doctor: {
                user: {
                    first_name: r.dr_first_name,
                    last_name: r.dr_last_name,
                },
            },
        }));

        res.json({
            success: true,
            data: formatted,
        });
    } catch (error) {
        console.error('Get health records by pet error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching health records',
            error: error.message,
        });
    }
};
