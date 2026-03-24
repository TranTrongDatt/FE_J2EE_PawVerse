import api from './axios';

export const notificationService = {
  getNotifications: async (params = {}) => {
    const response = await api.get('/api/user/notifications', { params });
    return response.data.data;
  },

  getUnreadCount: async () => {
    const response = await api.get('/api/user/notifications/unread-count');
    return response.data.data;
  },

  markAllAsRead: async () => {
    const response = await api.put('/api/user/notifications/mark-all-read');
    return response.data;
  },

  markAsRead: async (id) => {
    const response = await api.put(`/api/user/notifications/${id}/mark-read`);
    return response.data;
  },
};
