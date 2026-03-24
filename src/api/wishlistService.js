import api from './axios';

export const wishlistService = {
  // Get user's wishlist
  getWishlist: async () => {
    const response = await api.get('/api/user/wishlist');
    return response.data.data;
  },

  // Add to wishlist
  addToWishlist: async (productId) => {
    const response = await api.post('/api/user/wishlist/add', { productId: productId });
    return response.data.data;
  },

  // Remove from wishlist
  removeFromWishlist: async (wishlistItemId) => {
    const response = await api.delete(`/api/user/wishlist/items/${wishlistItemId}`);
    return response.data.data;
  },

  // Check if product is in wishlist
  isInWishlist: async (productId) => {
    const response = await api.get(`/api/user/wishlist/check/${productId}`);
    return response.data.data;
  },
};
