import api from './axios';

export const orderService = {
  // Create new order
  createOrder: async (orderData) => {
    const response = await api.post('/api/user/orders', orderData);
    return response.data.data;
  },

  // Get user's orders
  getUserOrders: async (params = {}) => {
    const response = await api.get('/api/user/orders', { params });
    return response.data.data;
  },

  // Get order by ID
  getOrderById: async (orderId) => {
    const response = await api.get(`/api/user/orders/${orderId}`);
    return response.data.data;
  },

  // Cancel order
  cancelOrder: async (orderId) => {
    const response = await api.put(`/api/user/orders/${orderId}/cancel`);
    return response.data.data;
  },

  // Download invoice PDF (only for DELIVERED orders)
  downloadInvoice: async (orderId) => {
    const response = await api.get(`/api/user/orders/${orderId}/invoice`, {
      responseType: 'blob',
    });
    return response.data;
  },

  // Apply coupon
  applyCoupon: async (code) => {
    const response = await api.post('/api/user/coupons/apply', { code });
    return response.data.data;
  },
};
