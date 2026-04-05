import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import CartSyncProvider from '../CartSyncProvider';
import ChatBot from '../chatbot/ChatBot';
import MiniCartDrawer from '../common/MiniCartDrawer';
import MiniWishlistDrawer from '../common/MiniWishlistDrawer';

export default function MainLayout() {
  const { pathname, search } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname, search]);

  return (
    <CartSyncProvider>
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header />
        
        <main className="flex-1 pt-20">
          <Outlet />
        </main>

        <Footer />
        <ChatBot />
        <MiniCartDrawer />
        <MiniWishlistDrawer />
      </div>
    </CartSyncProvider>
  );
}
