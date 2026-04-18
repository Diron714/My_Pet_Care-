import pool from '../config/database.js';
import crypto from 'crypto';

// Generate 6-digit OTP
export const generateOTP = () => {
  return crypto.randomInt(100000, 999999).toString();
};

// Store OTP in database
export const storeOTP = async (userId, email, otpType, expiryMinutes = 10) => {
  const otpCode = generateOTP();
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + expiryMinutes);

  // Invalidate old OTPs for this user/email
  await pool.query(
    'UPDATE otp_verifications SET is_used = TRUE WHERE email = ? AND otp_type = ? AND is_used = FALSE',
    [email, otpType]
  );

  // Insert new OTP
  const [result] = await pool.query(
    `INSERT INTO otp_verifications (user_id, email, otp_code, otp_type, expires_at)
     VALUES (?, ?, ?, ?, ?)`,
    [userId, email, otpCode, otpType, expiresAt]
  );

  return otpCode;
};

// Verify OTP
export const verifyOTP = async (email, otpCode, otpType) => {
  const [rows] = await pool.query(
    `SELECT * FROM otp_verifications
     WHERE email = ? AND otp_code = ? AND otp_type = ? AND is_used = FALSE AND expires_at > NOW()
     ORDER BY created_at DESC
     LIMIT 1`,
    [email, otpCode, otpType]
  );

  if (rows.length === 0) {
    return { valid: false, message: 'Invalid or expired OTP' };
  }

  // Mark OTP as used
  await pool.query(
    'UPDATE otp_verifications SET is_used = TRUE WHERE otp_id = ?',
    [rows[0].otp_id]
  );

  return { valid: true, userId: rows[0].user_id };
};

// Cleanup expired OTPs
export const cleanupExpiredOTPs = async () => {
  await pool.query(
    'DELETE FROM otp_verifications WHERE expires_at < NOW() AND is_used = FALSE'
  );
};

