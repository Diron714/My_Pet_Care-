import pool from '../config/database.js';
import { notifyUserRefresh } from '../services/socketService.js';

// =============================================
// APPOINTMENT MANAGEMENT
// =============================================

// Helper: Generate unique appointment number
const generateAppointmentNumber = () => {
    const date = new Date();
    const year = date.getFullYear();
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `APT-${year}-${random}`;
};

// GET /api/appointments - Get appointments (with filters)
export const getAppointments = async (req, res) => {
    try {
        const { status, date, limit = 50, offset = 0 } = req.query;
        const { userId } = req.user;
        const role = String(req.user?.role || '').trim().toLowerCase();

        let query = `
      SELECT a.*, 
             u_dr.first_name as dr_first_name, u_dr.last_name as dr_last_name, d.specialization,
             u_cu.first_name as cu_first_name, u_cu.last_name as cu_last_name, u_cu.phone as cu_phone, u_cu.email as cu_email,
             p.name as pet_name, p.species, p.breed, p.age as pet_age, p.image_url as pet_image_url, p.gender as pet_gender
      FROM appointments a
      JOIN doctors d ON a.doctor_id = d.doctor_id
      JOIN users u_dr ON d.user_id = u_dr.user_id
      JOIN customers c ON a.customer_id = c.customer_id
      JOIN users u_cu ON c.user_id = u_cu.user_id
      JOIN customer_pets p ON a.customer_pet_id = p.customer_pet_id
      WHERE 1=1
    `;
        const params = [];

        if (role === 'customer') {
            const [customers] = await pool.query('SELECT customer_id FROM customers WHERE user_id = ?', [userId]);
            if (customers.length === 0) {
                return res.json({ success: true, data: [] });
            }
            query += ` AND a.customer_id = ?`;
            params.push(customers[0].customer_id);
        } else if (role === 'doctor') {
            const [doctors] = await pool.query('SELECT doctor_id FROM doctors WHERE user_id = ?', [userId]);
            if (doctors.length === 0) {
                return res.json({ success: true, data: [] });
            }
            query += ` AND a.doctor_id = ?`;
            params.push(doctors[0].doctor_id);
        }

        if (status) {
            query += ` AND a.status = ?`;
            params.push(status);
        }

        if (date) {
            query += ` AND a.appointment_date = ?`;
            params.push(date);
        }

        query += ` ORDER BY a.appointment_date DESC, a.appointment_time ASC LIMIT ? OFFSET ?`;
        params.push(parseInt(limit), parseInt(offset));

        const [rows] = await pool.query(query, params);

        // Shape rows so frontend gets doctor, customer, customer_pet
        const data = rows.map((a) => ({
            ...a,
            doctor: {
                user: { first_name: a.dr_first_name, last_name: a.dr_last_name },
                specialization: a.specialization,
            },
            customer: {
                user: { first_name: a.cu_first_name, last_name: a.cu_last_name, phone: a.cu_phone, email: a.cu_email },
            },
            customer_pet: {
                name: a.pet_name,
                species: a.species,
                breed: a.breed,
                age: a.pet_age,
                image_url: a.pet_image_url,
                gender: a.pet_gender,
            },
        }));

        res.json({
            success: true,
            data,
        });
    } catch (error) {
        console.error('Get appointments error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching appointments',
            error: error.message
        });
    }
};

// GET /api/appointments/:id - Get single appointment (customer or doctor must own it)
export const getAppointmentById = async (req, res) => {
    try {
        const { id } = req.params;
        const { userId } = req.user;
        const role = String(req.user?.role || '').trim().toLowerCase();

        let query = `
      SELECT a.*,
             u_dr.first_name as dr_first_name, u_dr.last_name as dr_last_name, d.specialization,
             u_cu.first_name as cu_first_name, u_cu.last_name as cu_last_name, u_cu.phone as cu_phone, u_cu.email as cu_email,
             c.loyalty_tier as customer_loyalty_tier,
             p.name as pet_name, p.species, p.breed, p.age as pet_age, p.image_url as pet_image_url, p.gender as pet_gender
      FROM appointments a
      JOIN doctors d ON a.doctor_id = d.doctor_id
      JOIN users u_dr ON d.user_id = u_dr.user_id
      JOIN customers c ON a.customer_id = c.customer_id
      JOIN users u_cu ON c.user_id = u_cu.user_id
      JOIN customer_pets p ON a.customer_pet_id = p.customer_pet_id
      WHERE a.appointment_id = ?
    `;
        const params = [id];

        if (role === 'customer') {
            const [customers] = await pool.query('SELECT customer_id FROM customers WHERE user_id = ?', [userId]);
            if (customers.length === 0) {
                return res.status(404).json({ success: false, message: 'Appointment not found' });
            }
            query += ` AND a.customer_id = ?`;
            params.push(customers[0].customer_id);
        } else if (role === 'doctor') {
            const [doctors] = await pool.query('SELECT doctor_id FROM doctors WHERE user_id = ?', [userId]);
            if (doctors.length === 0) {
                return res.status(404).json({ success: false, message: 'Appointment not found' });
            }
            query += ` AND a.doctor_id = ?`;
            params.push(doctors[0].doctor_id);
        }
        // admin: no extra filter, can view any appointment

        const [appointments] = await pool.query(query, params);

        if (appointments.length === 0) {
            return res.status(404).json({ success: false, message: 'Appointment not found' });
        }

        const a = appointments[0];

        // Get latest health record (if any) linked to this appointment
        const [healthRecords] = await pool.query(
            `SELECT diagnosis, prescription, treatment_notes 
             FROM health_records 
             WHERE appointment_id = ? 
             ORDER BY record_date DESC, created_at DESC 
             LIMIT 1`,
            [id]
        );

        const latestRecord = healthRecords[0] || {};

        const data = {
            ...a,
            doctor: {
                user: { first_name: a.dr_first_name, last_name: a.dr_last_name },
                specialization: a.specialization,
            },
            customer: {
                user: { first_name: a.cu_first_name, last_name: a.cu_last_name, phone: a.cu_phone, email: a.cu_email },
                loyalty_tier: a.customer_loyalty_tier || null,
            },
            customer_pet: {
                name: a.pet_name,
                species: a.species,
                breed: a.breed,
                age: a.pet_age,
                image_url: a.pet_image_url,
                gender: a.pet_gender,
            },
            // Surface clinical summary fields for customer/doctor views
            // Prefer values stored directly on the appointment (latest edit),
            // fall back to latest health record only if appointment fields are empty.
            diagnosis: a.diagnosis || latestRecord.diagnosis || null,
            prescription: a.prescription || latestRecord.prescription || null,
            doctor_notes: a.doctor_notes || latestRecord.treatment_notes || null,
        };

        res.json({
            success: true,
            data,
        });
    } catch (error) {
        console.error('Get appointment by id error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching appointment',
            error: error.message,
        });
    }
};

// POST /api/appointments - Book new appointment
export const bookAppointment = async (req, res) => {
    try {
        const { doctor_id, customer_pet_id, appointment_date, appointment_time } = req.body;
        const userId = req.user.userId;

        // Get customer_id
        const [customers] = await pool.query('SELECT customer_id FROM customers WHERE user_id = ?', [userId]);
        if (customers.length === 0) {
            return res.status(400).json({ success: false, message: 'Customer profile not found' });
        }
        const customer_id = customers[0].customer_id;

        // Ensure the selected pet belongs to the current customer.
        const [ownedPets] = await pool.query(
            `SELECT customer_pet_id FROM customer_pets WHERE customer_pet_id = ? AND customer_id = ?`,
            [customer_pet_id, customer_id]
        );
        if (ownedPets.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Selected pet does not belong to your account'
            });
        }

        // Check if slot is taken
        const [existing] = await pool.query(
            `SELECT appointment_id FROM appointments 
       WHERE doctor_id = ? AND appointment_date = ? AND appointment_time = ? AND status NOT IN ('rejected', 'cancelled')`,
            [doctor_id, appointment_date, appointment_time]
        );

        if (existing.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'This time slot is already booked'
            });
        }

        // Get consultation fee
        const [doctors] = await pool.query('SELECT consultation_fee FROM doctors WHERE doctor_id = ?', [doctor_id]);
        if (doctors.length === 0) {
            return res.status(404).json({ success: false, message: 'Doctor not found' });
        }

        const appointment_number = generateAppointmentNumber();

        const [result] = await pool.query(
            `INSERT INTO appointments (appointment_number, customer_id, doctor_id, customer_pet_id, appointment_date, appointment_time, consultation_fee)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [appointment_number, customer_id, doctor_id, customer_pet_id, appointment_date, appointment_time, doctors[0].consultation_fee]
        );

        // Notification for doctor
        const [doctorUser] = await pool.query('SELECT user_id FROM doctors WHERE doctor_id = ?', [doctor_id]);
        if (doctorUser.length > 0) {
            await pool.query(
                `INSERT INTO notifications (user_id, notification_type, title, message, related_id)
       VALUES (?, 'appointment', 'New Appointment Request', ?, ?)`,
                [doctorUser[0].user_id, `You have a new appointment request (${appointment_number}) for ${appointment_date}`, result.insertId]
            );
            notifyUserRefresh(doctorUser[0].user_id);
        }

        res.status(201).json({
            success: true,
            message: 'Appointment booked successfully',
            data: { appointment_id: result.insertId, appointment_number }
        });
    } catch (error) {
        console.error('Book appointment error:', error);
        res.status(500).json({
            success: false,
            message: 'Error booking appointment',
            error: error.message
        });
    }
};

// PUT /api/appointments/:id/status - Update appointment status
export const updateAppointmentStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, doctor_notes } = req.body;
        const userId = req.user.userId;
        const role = String(req.user?.role || '').trim().toLowerCase();

        const [appointments] = await pool.query('SELECT a.*, c.user_id as customer_user_id FROM appointments a JOIN customers c ON a.customer_id = c.customer_id WHERE a.appointment_id = ?', [id]);
        if (appointments.length === 0) {
            return res.status(404).json({ success: false, message: 'Appointment not found' });
        }

        const appointment = appointments[0];

        // Status permissions
        if (role === 'doctor' && !['accepted', 'rejected', 'completed'].includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid status for doctor' });
        }
        if (role === 'customer' && status !== 'cancelled') {
            return res.status(400).json({ success: false, message: 'Invalid status for customer' });
        }

        // Ownership checks for non-admin updates.
        if (role === 'customer' && appointment.customer_user_id !== userId) {
            return res.status(403).json({ success: false, message: 'Not authorized to update this appointment' });
        }
        if (role === 'doctor') {
            const [doctors] = await pool.query('SELECT doctor_id FROM doctors WHERE user_id = ?', [userId]);
            if (doctors.length === 0 || doctors[0].doctor_id !== appointment.doctor_id) {
                return res.status(403).json({ success: false, message: 'Not authorized to update this appointment' });
            }
        }

        await pool.query(
            `UPDATE appointments SET status = ?, doctor_notes = COALESCE(?, doctor_notes), updated_at = NOW() WHERE appointment_id = ?`,
            [status, doctor_notes || null, id]
        );

        // Notification for customer
        await pool.query(
            `INSERT INTO notifications (user_id, notification_type, title, message, related_id)
       VALUES (?, 'appointment', 'Appointment Update', ?, ?)`,
            [appointment.customer_user_id, `Your appointment ${appointment.appointment_number} has been ${status}`, id]
        );
        notifyUserRefresh(appointment.customer_user_id);

        res.json({
            success: true,
            message: `Appointment ${status} successfully`
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error updating appointment',
            error: error.message
        });
    }
};

// GET /api/appointments/available-slots
export const getAvailableSlots = async (req, res) => {
    try {
        const { doctorId, date } = req.query;
        if (!doctorId || !date) {
            return res.status(400).json({ success: false, message: 'Doctor ID and date are required' });
        }

        const dayName = new Date(date).toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();

        // Get doctor schedule for this day
        const [schedules] = await pool.query(
            `SELECT * FROM doctor_schedules WHERE doctor_id = ? AND day_of_week = ? AND is_active = TRUE`,
            [doctorId, dayName]
        );

        if (schedules.length === 0) {
            return res.json({ success: true, data: [] });
        }

        // Get current bookings for this day
        const [bookings] = await pool.query(
            `SELECT appointment_time FROM appointments WHERE doctor_id = ? AND appointment_date = ? AND status NOT IN ('rejected', 'cancelled')`,
            [doctorId, date]
        );

        const bookedTimes = bookings.map(b => b.appointment_time.toString().slice(0, 5));

        // Generate slots (slot_duration in minutes; fallback 30 if missing)
        const slots = [];
        schedules.forEach(schedule => {
            const durationMinutes = schedule.slot_duration != null ? schedule.slot_duration : 30;
            const startTime = String(schedule.start_time).slice(0, 5);
            const endTime = String(schedule.end_time).slice(0, 5);
            let current = new Date(`2000-01-01T${startTime}:00`);
            const end = new Date(`2000-01-01T${endTime}:00`);

            while (current < end) {
                const timeStr = current.toTimeString().slice(0, 5);
                slots.push({
                    time: timeStr,
                    available: !bookedTimes.includes(timeStr)
                });
                current = new Date(current.getTime() + durationMinutes * 60000);
            }
        });

        res.json({
            success: true,
            data: slots
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching available slots',
            error: error.message
        });
    }
};
