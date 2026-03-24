import api from './axios';

export const userService = {
  // Get current user profile
  getCurrentUser: async () => {
    const response = await api.get('/api/user/profile');
    return response.data.data;
  },

  // Update user profile
  updateProfile: async (profileData) => {
    const response = await api.put('/api/user/profile', profileData);
    return response.data.data;
  },

  // Change password
  changePassword: async (passwordData) => {
    const response = await api.put('/api/user/change-password', passwordData);
    return response.data.data;
  },

  // Upload avatar
  uploadAvatar: async (file) => {
    const formData = new FormData();
    formData.append('avatar', file);
    const response = await api.post('/api/user/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.data;
  },

  // Delete avatar
  deleteAvatar: async () => {
    const response = await api.delete('/api/user/avatar');
    return response.data.data;
  },
};
