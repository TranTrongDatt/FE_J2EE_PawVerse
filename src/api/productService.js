import api from './axios';

export const productService = {
  // Get all products with filters and pagination
  getProducts: async (params = {}) => {
    const response = await api.get('/api/public/products', { params });
    return response.data.data;
  },

  // Get product by ID
  getProductById: async (id) => {
    const response = await api.get(`/api/public/products/${id}`);
    return response.data.data;
  },

  // Get featured products
  getFeaturedProducts: async (limit = 8) => {
    const response = await api.get('/api/public/products/featured', {
      params: { limit },
    });
    return response.data.data;
  },

  // Get products by category
  getProductsByCategory: async (categoryId, params = {}) => {
    const response = await api.get(`/api/public/products/category/${categoryId}`, {
      params,
    });
    return response.data.data;
  },

  // Get products by brand
  getProductsByBrand: async (brandId, params = {}) => {
    const response = await api.get(`/api/public/products/brand/${brandId}`, {
      params,
    });
    return response.data.data;
  },

  // Search products
  searchProducts: async (keyword, params = {}) => {
    const response = await api.get('/api/public/products/search', {
      params: { keyword, ...params },
    });
    return response.data.data;
  },

  // Get all categories
  getCategories: async () => {
    const response = await api.get('/api/public/categories');
    return response.data.data;
  },

  // Get all brands
  getBrands: async () => {
    const response = await api.get('/api/public/brands');
    return response.data.data;
  },

  // Get product reviews with optional rating filter
  getProductReviews: async (productId, params = {}) => {
    const response = await api.get(`/api/public/products/${productId}/reviews`, { params });
    return response.data.data;
  },

  // Get rating distribution stats for a product
  getReviewStats: async (productId) => {
    const response = await api.get(`/api/public/products/${productId}/reviews/stats`);
    return response.data.data;
  },

  // Check if user can review a product
  canReviewProduct: async (productId) => {
    const response = await api.get(`/api/user/reviews/can-review/${productId}`);
    return response.data.data;
  },

  // Get reviewed product IDs for a specific order
  getReviewedProducts: async (orderId) => {
    const response = await api.get(`/api/user/reviews/reviewed-products/${orderId}`);
    return response.data.data;
  },

  // Create a review
  createReview: async (reviewData) => {
    const response = await api.post('/api/user/reviews', reviewData);
    return response.data.data;
  },

  // Update a review (max 2 edits)
  updateReview: async (reviewId, reviewData) => {
    const response = await api.put(`/api/user/reviews/${reviewId}`, reviewData);
    return response.data.data;
  },

  // Delete a review (soft delete)
  deleteReview: async (reviewId) => {
    const response = await api.delete(`/api/user/reviews/${reviewId}`);
    return response.data.data;
  },

  // Staff reply to a review
  staffReplyReview: async (reviewId, replyData) => {
    const response = await api.post(`/api/staff/reviews/${reviewId}/reply`, replyData);
    return response.data.data;
  },

  // Get user's own reviews
  getUserReviews: async (params = {}) => {
    const response = await api.get('/api/user/reviews', { params });
    return response.data.data;
  },

  // Upload review media (images/videos)
  uploadReviewMedia: async (files) => {
    const formData = new FormData();
    files.forEach((file) => formData.append('files', file));
    const response = await api.post('/api/user/reviews/upload-media', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data.data;
  },
};
