import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../config/jwt.js';
import pool from '../config/database.js';

// Store refresh token in database
export const storeRefreshToken = async (userId, refreshToken) => {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

  const [result] = await pool.query(
    `INSERT INTO refresh_tokens (user_id, refresh_token, expires_at)
     VALUES (?, ?, ?)`,
    [userId, refreshToken, expiresAt]
  );

  return result.insertId;
};

// Verify and get refresh token from database by tokenId
export const getRefreshToken = async (tokenId) => {
  const [rows] = await pool.query(
    `SELECT * FROM refresh_tokens
     WHERE token_id = ? AND is_revoked = FALSE AND expires_at > NOW()`,
    [tokenId]
  );

  if (rows.length === 0) {
    return null;
  }

  return rows[0];
};

// Get refresh token by token string
export const getRefreshTokenByToken = async (refreshToken) => {
  const [rows] = await pool.query(
    `SELECT * FROM refresh_tokens
     WHERE refresh_token = ? AND is_revoked = FALSE AND expires_at > NOW()`,
    [refreshToken]
  );

  if (rows.length === 0) {
    return null;
  }

  return rows[0];
};

// Revoke refresh token
export const revokeRefreshToken = async (tokenId) => {
  await pool.query(
    'UPDATE refresh_tokens SET is_revoked = TRUE WHERE token_id = ?',
    [tokenId]
  );
};

// Revoke all refresh tokens for a user
export const revokeAllUserTokens = async (userId) => {
  await pool.query(
    'UPDATE refresh_tokens SET is_revoked = TRUE WHERE user_id = ? AND is_revoked = FALSE',
    [userId]
  );
};

// Generate token pair
export const generateTokenPair = async (user) => {
  const accessPayload = {
    userId: user.user_id,
    email: user.email,
    role: user.role
  };

  const accessToken = generateAccessToken(accessPayload);

  // Generate a temporary refresh token first
  const tempRefreshPayload = {
    userId: user.user_id,
    type: 'refresh'
  };

  const tempRefreshToken = generateRefreshToken(tempRefreshPayload);

  // Store refresh token in database
  const tokenId = await storeRefreshToken(user.user_id, tempRefreshToken);

  // Generate final refresh token with tokenId
  const refreshPayload = {
    userId: user.user_id,
    tokenId: tokenId,
    type: 'refresh'
  };

  const refreshToken = generateRefreshToken(refreshPayload);

  // Update stored token with the final token
  await pool.query(
    'UPDATE refresh_tokens SET refresh_token = ? WHERE token_id = ?',
    [refreshToken, tokenId]
  );

  return { accessToken, refreshToken };
};

// Verify refresh token and return decoded data
export const verifyAndDecodeRefreshToken = (token) => {
  try {
    const decoded = verifyRefreshToken(token);
    return decoded;
  } catch (error) {
    throw new Error('Invalid or expired refresh token');
  }
};

// Cleanup expired tokens
export const cleanupExpiredTokens = async () => {
  await pool.query(
    'DELETE FROM refresh_tokens WHERE expires_at < NOW() OR is_revoked = TRUE'
  );
};

