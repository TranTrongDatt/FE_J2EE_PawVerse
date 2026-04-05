import { create } from 'zustand';

const useCartStore = create((set) => ({
  cartCount: 0,
  isCartDrawerOpen: false,
  
  setCartCount: (count) => set({ cartCount: count }),
  
  incrementCart: () => set((state) => ({ cartCount: state.cartCount + 1 })),
  
  decrementCart: () => set((state) => ({ cartCount: Math.max(0, state.cartCount - 1) })),
  
  resetCart: () => set({ cartCount: 0 }),

  openCartDrawer: () => set({ isCartDrawerOpen: true }),
  closeCartDrawer: () => set({ isCartDrawerOpen: false }),
}));

export const getCartTotalQuantity = (cart) =>
  cart?.items?.reduce((sum, item) => sum + (item.quantity || 1), 0) || 0;

export default useCartStore;
