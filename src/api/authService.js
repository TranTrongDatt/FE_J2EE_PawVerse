import api from './axios';

export const authService = {
  // Login with email/password
  login: async (credentials) => {
    const response = await api.post('/api/auth/login', credentials);
    return response.data.data;
  },

  // Register new user
  register: async (userData) => {
    const response = await api.post('/api/auth/register', userData);
    return response.data.data;
  },

  // Refresh access token
  refreshToken: async (refreshToken) => {
    const response = await api.post('/api/auth/refresh', { refreshToken });
    return response.data.data;
  },

  // Logout
  logout: async () => {
    const response = await api.post('/api/auth/logout');
    return response.data.data;
  },

  // Get current user profile
  getCurrentUser: async () => {
    const response = await api.get('/api/auth/me');
    return response.data.data;
  },

  // Forgot password
  forgotPassword: async (email) => {
    const response = await api.post('/api/auth/forgot-password', { email });
    return response.data.data;
  },

  // Reset password (confirm OTP + set new password)
  resetPassword: async (email, otp, newPassword) => {
    const response = await api.post(`/api/auth/reset-password/${encodeURIComponent(email)}`, {
      otp,
      newPassword,
    });
    return response.data.data;
  },

  // Change password
  changePassword: async (oldPassword, newPassword) => {
    const response = await api.post('/api/auth/change-password', {
      oldPassword,
      newPassword,
    });
    return response.data.data;
  },
};
