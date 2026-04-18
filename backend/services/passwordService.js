import bcrypt from 'bcrypt';
import pool from '../config/database.js';

const SALT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS) || 10;

// Hash password
export const hashPassword = async (password) => {
  return await bcrypt.hash(password, SALT_ROUNDS);
};

// Compare password
export const comparePassword = async (password, hash) => {
  return await bcrypt.compare(password, hash);
};

// Check password history (prevent reuse of last 5 passwords)
export const checkPasswordHistory = async (userId, newPassword) => {
  const [rows] = await pool.query(
    `SELECT password_hash FROM password_history
     WHERE user_id = ?
     ORDER BY created_at DESC
     LIMIT 5`,
    [userId]
  );

  for (const row of rows) {
    const isMatch = await bcrypt.compare(newPassword, row.password_hash);
    if (isMatch) {
      return false; // Password was used before
    }
  }

  return true; // Password is new
};

// Save password to history
export const savePasswordHistory = async (userId, passwordHash) => {
  await pool.query(
    'INSERT INTO password_history (user_id, password_hash) VALUES (?, ?)',
    [userId, passwordHash]
  );

  // Keep only last 5 passwords
  const [rows] = await pool.query(
    'SELECT history_id FROM password_history WHERE user_id = ? ORDER BY created_at DESC LIMIT 5, 1',
    [userId]
  );

  if (rows.length > 0) {
    await pool.query(
      'DELETE FROM password_history WHERE user_id = ? AND history_id < ?',
      [userId, rows[0].history_id]
    );
  }
};

