import {
  registerUser,
  verifyEmail,
  loginUser,
  forgotPassword,
  resetPassword,
  logoutUser,
  getUserWithProfile
} from '../services/authService.js';
import {
  verifyAndDecodeRefreshToken,
  generateTokenPair,
  revokeRefreshToken,
  getRefreshToken,
  getRefreshTokenByToken
} from '../services/jwtService.js';
import {
  registerSchema,
  loginSchema,
  verifyOTPSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  refreshTokenSchema
} from '../utils/validators.js';
import { authenticate } from '../middleware/auth.js';
import pool from '../config/database.js';

// Register new user
export const register = async (req, res, next) => {
  try {
    // Validate request
    const validatedData = registerSchema.parse(req.body);

    // Public registration always creates customer accounts
    const dataWithRole = { ...validatedData, role: 'customer' };

    // Register user
    const result = await registerUser(dataWithRole);

    res.status(201).json({
      success: true,
      message: 'Registration successful. OTP sent to email.',
      data: result
    });
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.errors
      });
    }

    if (error.message === 'Email already registered') {
      return res.status(409).json({
        success: false,
        message: error.message
      });
    }

    next(error);
  }
};

// Verify OTP
export const verifyOTP = async (req, res, next) => {
  try {
    // Validate request
    const validatedData = verifyOTPSchema.parse(req.body);

    // Verify OTP
    await verifyEmail(validatedData.email, validatedData.otpCode);

    res.json({
      success: true,
      message: 'Email verified successfully'
    });
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.errors
      });
    }

    if (error.message.includes('Invalid or expired OTP')) {
      return res.status(422).json({
        success: false,
        message: error.message
      });
    }

    next(error);
  }
};

// Login
export const login = async (req, res, next) => {
  try {
    // Validate request
    const validatedData = loginSchema.parse(req.body);

    // Login user
    const result = await loginUser(validatedData.email, validatedData.password);

    res.json({
      success: true,
      message: 'Login successful',
      data: result
    });
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.errors
      });
    }

    if (error.message.includes('Invalid') || error.message.includes('not found')) {
      return res.status(401).json({
        success: false,
        message: error.message
      });
    }

    if (error.message.includes('verify') || error.message.includes('deactivated')) {
      return res.status(403).json({
        success: false,
        message: error.message
      });
    }

    next(error);
  }
};

// Refresh token
export const refreshToken = async (req, res, next) => {
  try {
    // Validate request
    const validatedData = refreshTokenSchema.parse(req.body);

    // Verify refresh token
    const decoded = verifyAndDecodeRefreshToken(validatedData.refreshToken);

    // Get token from database
    let tokenRecord = await getRefreshTokenByToken(validatedData.refreshToken);
    
    // If not found by token string, try by tokenId from decoded
    if (!tokenRecord && decoded.tokenId) {
      tokenRecord = await getRefreshToken(decoded.tokenId);
    }
    
    if (!tokenRecord) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired refresh token'
      });
    }
    
    // Verify tokenId matches if present in decoded token
    if (decoded.tokenId && tokenRecord.token_id !== decoded.tokenId) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired refresh token'
      });
    }

    // Get user
    const user = await getUserWithProfile(decoded.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Generate new tokens
    const { accessToken, refreshToken: newRefreshToken } = await generateTokenPair(user);

    // Optionally revoke old token (token rotation)
    if (tokenRecord.token_id) {
      await revokeRefreshToken(tokenRecord.token_id);
    }

    res.json({
      success: true,
      data: {
        accessToken,
        refreshToken: newRefreshToken
      }
    });
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.errors
      });
    }

    if (error.message.includes('Invalid or expired')) {
      return res.status(401).json({
        success: false,
        message: error.message
      });
    }

    next(error);
  }
};

// Forgot password
export const forgotPasswordHandler = async (req, res, next) => {
  try {
    // Validate request
    const validatedData = forgotPasswordSchema.parse(req.body);

    // Send OTP
    await forgotPassword(validatedData.email);

    // Always return success (don't reveal if email exists)
    res.json({
      success: true,
      message: 'If the email exists, an OTP has been sent'
    });
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.errors
      });
    }

    if (error.message.includes('verify')) {
      return res.status(403).json({
        success: false,
        message: error.message
      });
    }

    next(error);
  }
};

// Reset password
export const resetPasswordHandler = async (req, res, next) => {
  try {
    // Validate request
    const validatedData = resetPasswordSchema.parse(req.body);

    // Reset password
    await resetPassword(
      validatedData.email,
      validatedData.otpCode,
      validatedData.newPassword
    );

    res.json({
      success: true,
      message: 'Password reset successful'
    });
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.errors
      });
    }

    if (error.message.includes('Invalid or expired OTP')) {
      return res.status(422).json({
        success: false,
        message: error.message
      });
    }

    if (error.message.includes('Password') || error.message.includes('reuse')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    next(error);
  }
};

// Logout
export const logout = async (req, res, next) => {
  try {
    // Get token ID from refresh token if available
    const { refreshToken } = req.body;
    let tokenId = null;

    if (refreshToken) {
      try {
        const decoded = verifyAndDecodeRefreshToken(refreshToken);
        const tokenRecord = await getRefreshToken(decoded.tokenId || decoded.userId);
        if (tokenRecord) {
          tokenId = tokenRecord.token_id;
        }
      } catch (error) {
        // Token invalid, but still allow logout
      }
    }

    // Logout user
    await logoutUser(tokenId);

    // Log logout action
    if (req.user?.userId) {
      await pool.query(
        `INSERT INTO audit_logs (user_id, action_type, entity_type, description)
         VALUES (?, 'logout', 'user', 'User logged out')`,
        [req.user.userId]
      );
    }

    res.json({
      success: true,
      message: 'Logout successful'
    });
  } catch (error) {
    next(error);
  }
};

// Get current user
export const getCurrentUser = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const user = await getUserWithProfile(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: {
        userId: user.user_id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
        profile: user.profile
      }
    });
  } catch (error) {
    next(error);
  }
};

