import { create } from 'zustand';

const useWishlistStore = create((set) => ({
  isWishlistDrawerOpen: false,
  openWishlistDrawer: () => set({ isWishlistDrawerOpen: true }),
  closeWishlistDrawer: () => set({ isWishlistDrawerOpen: false }),
}));

export default useWishlistStore;
