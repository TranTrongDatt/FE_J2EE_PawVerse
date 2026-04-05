import { useEffect } from 'react';
import useAuthStore from '../store/useAuthStore';
import useCartStore, { getCartTotalQuantity } from '../store/useCartStore';
import { cartService } from '../api/cartService';

export default function CartSyncProvider({ children }) {
  const { isAuthenticated } = useAuthStore();
  const { setCartCount } = useCartStore();

  useEffect(() => {
    const syncCartCount = async () => {
      if (isAuthenticated) {
        try {
          const cart = await cartService.getCart();
          setCartCount(getCartTotalQuantity(cart));
        } catch (error) {
          console.error('Failed to sync cart count:', error);
          setCartCount(0);
        }
      } else {
        setCartCount(0);
      }
    };

    syncCartCount();
  }, [isAuthenticated, setCartCount]);

  return children;
}
