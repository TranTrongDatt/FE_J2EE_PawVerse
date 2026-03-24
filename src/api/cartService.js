import api from './axios';

export const cartService = {
  // Get user's cart
  getCart: async () => {
    const response = await api.get('/api/user/cart');
    return response.data.data;
  },

  // Add item to cart
  addToCart: async (productId, quantity = 1) => {
    const response = await api.post('/api/user/cart/add', {
      productId: productId,
      quantity: quantity,
    });
    return response.data.data;
  },

  // Update cart item quantity
  updateCartItem: async (cartItemId, quantity) => {
    const response = await api.put(`/api/user/cart/items/${cartItemId}`, {
      quantity: quantity,
    });
    return response.data.data;
  },

  // Remove item from cart
  removeFromCart: async (cartItemId) => {
    const response = await api.delete(`/api/user/cart/items/${cartItemId}`);
    return response.data.data;
  },

  // Clear cart
  clearCart: async () => {
    const response = await api.delete('/api/user/cart/clear');
    return response.data.data;
  },
};
