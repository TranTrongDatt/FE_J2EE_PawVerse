import api from './axios';

export const adminService = {
  // Product Management
  getAllProducts: async (params = {}) => {
    const response = await api.get('/api/admin/products', { params });
    return response.data.data;
  },

  createProduct: async (productData) => {
    const response = await api.post('/api/admin/products', productData);
    return response.data.data;
  },

  updateProduct: async (id, productData) => {
    const response = await api.put(`/api/admin/products/${id}`, productData);
    return response.data.data;
  },

  getProductById: async (id) => {
    const response = await api.get(`/api/public/products/${id}`);
    return response.data.data;
  },

  deleteProduct: async (id) => {
    const response = await api.delete(`/api/admin/products/${id}`);
    return response.data.data;
  },

  downloadImportTemplate: async () => {
    const response = await api.get('/api/admin/products/import/template', { responseType: 'blob' });
    return response.data;
  },

  previewImportExcel: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/api/admin/products/import/preview', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data.data;
  },

  confirmImportExcel: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/api/admin/products/import/confirm', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  toggleProductEnabled: async (id, isEnabled) => {
    const response = await api.put(`/api/admin/products/${id}`, { isEnabled });
    return response.data.data;
  },

  toggleProductFeatured: async (id, isFeatured) => {
    const response = await api.put(`/api/admin/products/${id}`, { isFeatured });
    return response.data.data;
  },

  // Order Management
  getAllOrders: async (params = {}) => {
    const response = await api.get('/api/admin/orders', { params });
    return response.data.data;
  },

  getOrderById: async (id) => {
    const response = await api.get(`/api/admin/orders/${id}`);
    return response.data.data;
  },

  updateOrderStatus: async (id, status) => {
    const response = await api.put(`/api/admin/orders/${id}/status`, { status });
    return response.data.data;
  },

  downloadInvoice: async (id) => {
    const response = await api.get(`/api/admin/orders/${id}/invoice`, { responseType: 'blob' });
    return response.data;
  },

  // User Management
  getAllUsers: async (params = {}) => {
    const response = await api.get('/api/admin/users', { params });
    return response.data.data;
  },

  getUserStats: async () => {
    const response = await api.get('/api/admin/users/stats');
    return response.data.data;
  },

  getUserById: async (id) => {
    const response = await api.get(`/api/admin/users/${id}`);
    return response.data.data;
  },

  updateUserRole: async (id, role) => {
    const response = await api.put(`/api/admin/users/${id}/role`, { role });
    return response.data.data;
  },

  lockUser: async (id, lockTimeHours = 999) => {
    const response = await api.put(`/api/admin/users/${id}/lock`, { lockTimeHours });
    return response.data;
  },

  unlockUser: async (id) => {
    const response = await api.put(`/api/admin/users/${id}/unlock`);
    return response.data;
  },

  toggleUserStatus: async (id) => {
    const response = await api.put(`/api/admin/users/${id}/toggle-status`);
    return response.data.data;
  },

  // Category Management
  getAllCategories: async () => {
    const response = await api.get('/api/admin/categories');
    return response.data.data;
  },

  createCategory: async (categoryData) => {
    const response = await api.post('/api/admin/categories', categoryData);
    return response.data.data;
  },

  updateCategory: async (id, categoryData) => {
    const response = await api.put(`/api/admin/categories/${id}`, categoryData);
    return response.data.data;
  },

  deleteCategory: async (id) => {
    const response = await api.delete(`/api/admin/categories/${id}`);
    return response.data.data;
  },

  // Brand Management
  getAllBrands: async () => {
    const response = await api.get('/api/admin/brands');
    return response.data.data;
  },

  createBrand: async (brandData) => {
    const response = await api.post('/api/admin/brands', brandData);
    return response.data.data;
  },

  updateBrand: async (id, brandData) => {
    const response = await api.put(`/api/admin/brands/${id}`, brandData);
    return response.data.data;
  },

  deleteBrand: async (id) => {
    const response = await api.delete(`/api/admin/brands/${id}`);
    return response.data.data;
  },

  // Analytics
  getDashboardStats: async () => {
    const response = await api.get('/api/admin/analytics/dashboard');
    return response.data.data;
  },

  getRevenueStats: async (params = {}) => {
    const response = await api.get('/api/admin/analytics/revenue', { params });
    return response.data.data;
  },

  getExportColumns: async () => {
    const response = await api.get('/api/admin/analytics/export/columns');
    return response.data.data;
  },

  exportReport: async (request) => {
    const response = await api.post('/api/admin/analytics/export', request, { responseType: 'blob' });
    return response.data;
  },

  // Activity Logs
  getActivityLogs: async (params = {}) => {
    const response = await api.get('/api/admin/activity-logs', { params });
    return response.data.data;
  },

  // Voucher Management (Staff)
  getAllVouchers: async (params = {}) => {
    const response = await api.get('/api/staff/vouchers', { params });
    return response.data.data;
  },

  getVoucherById: async (id) => {
    const response = await api.get(`/api/staff/vouchers/${id}`);
    return response.data.data;
  },

  createVoucher: async (data) => {
    const response = await api.post('/api/staff/vouchers', data);
    return response.data;
  },

  updateVoucher: async (id, data) => {
    const response = await api.put(`/api/staff/vouchers/${id}`, data);
    return response.data;
  },

  toggleVoucherActive: async (id) => {
    const response = await api.put(`/api/staff/vouchers/${id}/toggle-active`);
    return response.data;
  },

  deleteVoucher: async (id) => {
    const response = await api.delete(`/api/staff/vouchers/${id}`);
    return response.data;
  },
};
