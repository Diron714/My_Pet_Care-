import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import { disconnectSocket } from '../services/socket';

const AuthContext = createContext(null);

/** Normalize API/localStorage user so role checks work (MySQL ENUM casing, etc.). */
function normalizeUser(raw) {
  if (!raw || typeof raw !== 'object') return raw;
  const role = String(raw.role ?? '').trim().toLowerCase();
  return { ...raw, role: role || raw.role };
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in on mount
    const storedUser = localStorage.getItem('user');
    const accessToken = localStorage.getItem('accessToken');

    if (storedUser && accessToken) {
      try {
        const parsed = normalizeUser(JSON.parse(storedUser));
        setUser(parsed);
        localStorage.setItem('user', JSON.stringify(parsed));
      } catch (error) {
        console.error('Error parsing user data:', error);
        localStorage.removeItem('user');
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
      }
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      
      // Check if response has the expected structure
      if (!response.data || !response.data.success || !response.data.data) {
        return {
          success: false,
          message: 'Invalid response from server',
        };
      }

      const {
        accessToken,
        refreshToken,
        user: userData,
        mustVerifyEmail,
      } = response.data.data;

      if (!accessToken || !refreshToken || !userData) {
        return {
          success: false,
          message: 'Missing authentication data',
        };
      }

      const normalized = normalizeUser(userData);

      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('user', JSON.stringify(normalized));

      setUser(normalized);
      return {
        success: true,
        user: normalized,
        mustVerifyEmail: !!mustVerifyEmail,
      };
    } catch (error) {
      console.error('Login error:', error);
      
      // Provide helpful error messages
      let errorMessage = 'Login failed';
      
      if (error.code === 'ECONNREFUSED' || error.message?.includes('Network') || error.message?.includes('Failed to fetch')) {
        errorMessage = 'Cannot connect to server. Please make sure backend is running on port 5000.';
        console.error('💡 Backend server is not running!');
        console.error('💡 Start it with: cd backend && npm run dev');
      } else if (error.response) {
        errorMessage = error.response.data?.message || 'Login failed. Please check your credentials.';
      } else if (error.request) {
        errorMessage = 'No response from server. Please check if backend is running.';
        console.error('💡 Backend server is not running!');
        console.error('💡 Start it with: cd backend && npm run dev');
      } else {
        errorMessage = error.message || 'Login failed';
      }
      
      return {
        success: false,
        message: errorMessage,
      };
    }
  };

  const register = async (userData) => {
    try {
      const response = await api.post('/auth/register', userData);
      return { success: true, data: response.data.data };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Registration failed',
      };
    }
  };

  const logout = async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        await api.post('/auth/logout', { refreshToken });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      disconnectSocket();
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      setUser(null);
      window.location.href = '/login';
    }
  };

  const verifyOTP = async (email, otpCode, otpType) => {
    try {
      const response = await api.post('/auth/verify-otp', {
        email,
        otpCode,
        otpType,
      });
      return { success: true, data: response.data.data };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'OTP verification failed',
      };
    }
  };

  const forgotPassword = async (email) => {
    try {
      const response = await api.post('/auth/forgot-password', { email });
      return { success: true, data: response.data.data };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to send OTP',
      };
    }
  };

  const resetPassword = async (email, otpCode, newPassword, confirmPassword) => {
    try {
      const response = await api.post('/auth/reset-password', {
        email,
        otpCode,
        newPassword,
        confirmPassword,
      });
      return { success: true, data: response.data.data };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Password reset failed',
      };
    }
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    verifyOTP,
    forgotPassword,
    resetPassword,
    isAuthenticated: !!user,
    isCustomer: String(user?.role || '').toLowerCase() === 'customer',
    isDoctor: String(user?.role || '').toLowerCase() === 'doctor',
    isAdmin: ['admin', 'staff'].includes(String(user?.role || '').toLowerCase()),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

