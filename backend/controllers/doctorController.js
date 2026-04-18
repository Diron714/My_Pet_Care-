import pool from '../config/database.js';

const getOrCreateDoctorIdByUserId = async (userId) => {
    const [doctors] = await pool.query('SELECT doctor_id FROM doctors WHERE user_id = ?', [userId]);
    if (doctors.length > 0) {
        return doctors[0].doctor_id;
    }

    await pool.query(
        `INSERT INTO doctors (user_id, specialization, consultation_fee, is_available)
         VALUES (?, 'General', 1500, TRUE)`,
        [userId]
    );

    const [created] = await pool.query('SELECT doctor_id FROM doctors WHERE user_id = ?', [userId]);
    if (created.length === 0) {
        throw new Error('Failed to create doctor profile');
    }
    return created[0].doctor_id;
};

// =============================================
// DOCTOR MANAGEMENT
// =============================================

// GET /api/doctors - Get all doctors
export const getAllDoctors = async (req, res) => {
    try {
        const { specialization, search, available } = req.query;

        let query = `
      SELECT d.*, u.first_name, u.last_name, u.email, u.phone
      FROM doctors d
      JOIN users u ON d.user_id = u.user_id
      WHERE u.is_active = TRUE
    `;
        const params = [];

        if (available === 'true') {
            query += ` AND d.is_available = TRUE`;
        }

        if (specialization) {
            query += ` AND d.specialization = ?`;
            params.push(specialization);
        }

        if (search) {
            query += ` AND (u.first_name LIKE ? OR u.last_name LIKE ? OR d.specialization LIKE ?)`;
            const searchTerm = `%${search}%`;
            params.push(searchTerm, searchTerm, searchTerm);
        }

        query += ` ORDER BY d.rating DESC`;

        const [doctors] = await pool.query(query, params);

        res.json({
            success: true,
            data: doctors
        });
    } catch (error) {
        console.error('Get doctors error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching doctors',
            error: error.message
        });
    }
};

// GET /api/doctors/:id - Get doctor by ID
export const getDoctorById = async (req, res) => {
    try {
        const { id } = req.params;

        const [doctors] = await pool.query(
            `SELECT d.*, u.first_name, u.last_name, u.email, u.phone
       FROM doctors d
       JOIN users u ON d.user_id = u.user_id
       WHERE d.doctor_id = ?`,
            [id]
        );

        if (doctors.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Doctor not found'
            });
        }

        res.json({
            success: true,
            data: doctors[0]
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching doctor',
            error: error.message
        });
    }
};

// GET /api/doctors/:id/schedule - Get doctor schedule (public)
export const getDoctorSchedule = async (req, res) => {
    try {
        const { id } = req.params;

        const [schedules] = await pool.query(
            `SELECT * FROM doctor_schedules WHERE doctor_id = ? AND is_active = TRUE ORDER BY FIELD(day_of_week, 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'), start_time`,
            [id]
        );

        res.json({
            success: true,
            data: schedules
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching doctor schedule',
            error: error.message
        });
    }
};

// GET /api/doctors/profile - Get current doctor profile (Doctor only)
export const getDoctorProfile = async (req, res) => {
    try {
        const userId = req.user.userId;

        const [doctors] = await pool.query(
            `SELECT d.*, u.first_name, u.last_name, u.email, u.phone
       FROM doctors d
       JOIN users u ON d.user_id = u.user_id
       WHERE d.user_id = ?`,
            [userId]
        );

        if (doctors.length === 0) {
            // If a doctor record doesn't exist for this user yet, create a basic profile
            // so that newly promoted doctors can use the profile management page.
            const [insertResult] = await pool.query(
                `INSERT INTO doctors (user_id, specialization, consultation_fee, is_available)
                 VALUES (?, 'General', 1500, TRUE)`,
                [userId]
            );

            if (!insertResult.affectedRows) {
                return res.status(404).json({
                    success: false,
                    message: 'Doctor profile not found'
                });
            }

            const [newDoctors] = await pool.query(
                `SELECT d.*, u.first_name, u.last_name, u.email, u.phone
           FROM doctors d
           JOIN users u ON d.user_id = u.user_id
           WHERE d.user_id = ?`,
                [userId]
            );

            if (newDoctors.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Doctor profile not found'
                });
            }

            return res.json({
                success: true,
                data: newDoctors[0]
            });
        }

        res.json({
            success: true,
            data: doctors[0]
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching doctor profile',
            error: error.message
        });
    }
};

// PUT /api/doctors/profile - Update doctor profile (Doctor only)
export const updateDoctorProfile = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { specialization, qualifications, experience_years, consultation_fee, is_available, image_url } = req.body;

        let dbImageUrl = image_url;
        if (image_url && typeof image_url === 'string' && image_url.startsWith('data:image')) {
            try {
                const { saveBase64Image } = await import('../utils/imageUpload.js');
                const savedPath = await saveBase64Image(image_url, 'doctors');
                if (savedPath) dbImageUrl = savedPath;
            } catch (err) {
                console.error('Error saving doctor profile image:', err);
            }
        }

        const [result] = await pool.query(
            `UPDATE doctors SET 
        specialization = COALESCE(?, specialization),
        qualifications = COALESCE(?, qualifications),
        experience_years = COALESCE(?, experience_years),
        consultation_fee = COALESCE(?, consultation_fee),
        is_available = COALESCE(?, is_available),
        image_url = COALESCE(?, image_url),
        updated_at = NOW()
       WHERE user_id = ?`,
            [specialization, qualifications, experience_years, consultation_fee, is_available, dbImageUrl, userId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Doctor profile not found'
            });
        }

        res.json({
            success: true,
            message: 'Profile updated successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error updating doctor profile',
            error: error.message
        });
    }
};

// GET /api/doctors/dashboard - Doctor dashboard stats
export const getDoctorDashboard = async (req, res) => {
    try {
        const userId = req.user.userId;
        const doctorId = await getOrCreateDoctorIdByUserId(userId);

        // Stats queries
        const [totalAppointments] = await pool.query('SELECT COUNT(*) as count FROM appointments WHERE doctor_id = ?', [doctorId]);
        const [upcomingAppointments] = await pool.query('SELECT COUNT(*) as count FROM appointments WHERE doctor_id = ? AND appointment_date >= CURDATE() AND status = "accepted"', [doctorId]);
        const [pendingRequests] = await pool.query('SELECT COUNT(*) as count FROM appointments WHERE doctor_id = ? AND status = "pending"', [doctorId]);
        const [totalPatients] = await pool.query('SELECT COUNT(DISTINCT customer_id) as count FROM appointments WHERE doctor_id = ?', [doctorId]);

        res.json({
            success: true,
            data: {
                total_appointments: totalAppointments[0].count,
                upcoming_appointments: upcomingAppointments[0].count,
                pending_requests: pendingRequests[0].count,
                total_patients: totalPatients[0].count
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching dashboard stats',
            error: error.message
        });
    }
};

// =============================================
// DOCTOR SCHEDULE MANAGEMENT (Doctor only)
// =============================================

// GET /api/doctors/schedule - Get schedules for logged-in doctor
export const getMySchedule = async (req, res) => {
    try {
        const userId = req.user.userId;
        const doctorId = await getOrCreateDoctorIdByUserId(userId);

        const [schedules] = await pool.query(
            `SELECT * FROM doctor_schedules WHERE doctor_id = ? ORDER BY FIELD(day_of_week, 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'), start_time`,
            [doctorId]
        );

        res.json({
            success: true,
            data: schedules
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching schedules',
            error: error.message
        });
    }
};

// POST /api/doctors/schedule - Create schedule slot
export const createScheduleSlot = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { day_of_week, start_time, end_time, slot_duration = 30, is_active = true } = req.body;
        const doctorId = await getOrCreateDoctorIdByUserId(userId);

        const [result] = await pool.query(
            `INSERT INTO doctor_schedules (doctor_id, day_of_week, start_time, end_time, slot_duration, is_active)
       VALUES (?, ?, ?, ?, ?, ?)`,
            [doctorId, day_of_week, start_time, end_time, slot_duration, !!is_active]
        );

        res.status(201).json({
            success: true,
            message: 'Schedule slot created successfully',
            data: { schedule_id: result.insertId }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error creating schedule slot',
            error: error.message
        });
    }
};

// PUT /api/doctors/schedule/:id - Update schedule slot
export const updateScheduleSlot = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { id } = req.params;
        const { day_of_week, start_time, end_time, slot_duration, is_active } = req.body;
        const doctorId = await getOrCreateDoctorIdByUserId(userId);

        const [result] = await pool.query(
            `UPDATE doctor_schedules SET
        day_of_week = COALESCE(?, day_of_week),
        start_time = COALESCE(?, start_time),
        end_time = COALESCE(?, end_time),
        slot_duration = COALESCE(?, slot_duration),
        is_active = COALESCE(?, is_active),
        updated_at = NOW()
       WHERE schedule_id = ? AND doctor_id = ?`,
            [day_of_week, start_time, end_time, slot_duration, is_active, id, doctorId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Schedule slot not found' });
        }

        res.json({
            success: true,
            message: 'Schedule slot updated successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error updating schedule slot',
            error: error.message
        });
    }
};

// DELETE /api/doctors/schedule/:id - Delete schedule slot
export const deleteScheduleSlot = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { id } = req.params;
        const doctorId = await getOrCreateDoctorIdByUserId(userId);

        const [result] = await pool.query(
            `DELETE FROM doctor_schedules WHERE schedule_id = ? AND doctor_id = ?`,
            [id, doctorId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Schedule slot not found' });
        }

        res.json({
            success: true,
            message: 'Schedule slot deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error deleting schedule slot',
            error: error.message
        });
    }
};
