import { useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { X, ShoppingBag, ArrowRight, PawPrint, Trash2 } from 'lucide-react';
import { cartService } from '../../api/cartService';
import { formatPrice } from '../../utils/formatters';
import useCartStore from '../../store/useCartStore';

export default function MiniCartDrawer() {
  const navigate = useNavigate();
  const { isCartDrawerOpen, closeCartDrawer } = useCartStore();
  const drawerRef = useRef(null);

  const { data: cart } = useQuery({
    queryKey: ['cart'],
    queryFn: cartService.getCart,
    enabled: isCartDrawerOpen,
  });

  // Close on Escape key
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') closeCartDrawer();
    };
    if (isCartDrawerOpen) {
      document.addEventListener('keydown', handleKey);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [isCartDrawerOpen, closeCartDrawer]);

  // Close on navigation
  const handleNavigate = (path) => {
    closeCartDrawer();
    navigate(path);
  };

  const items = cart?.items || [];
  const subtotal = cart?.totalAmount || items.reduce((sum, item) => sum + (item.subtotal || item.price * item.quantity), 0);
  const totalQuantity = items.reduce((sum, item) => sum + (item.quantity || 1), 0);

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/40 backdrop-blur-sm z-[9998] transition-opacity duration-300 ${
          isCartDrawerOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={closeCartDrawer}
      />

      {/* Drawer */}
      <div
        ref={drawerRef}
        className={`fixed top-0 right-0 h-full w-full sm:w-[420px] bg-white z-[9999] shadow-2xl shadow-black/20 transform transition-transform duration-400 ease-[cubic-bezier(0.32,0.72,0,1)] flex flex-col ${
          isCartDrawerOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center">
              <ShoppingBag size={20} className="text-orange-500" />
            </div>
            <div>
              <h2 className="text-sm font-black text-gray-900 uppercase tracking-wider">Giỏ hàng</h2>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                {totalQuantity} sản phẩm
              </p>
            </div>
          </div>
          <button
            onClick={closeCartDrawer}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-gray-50 text-gray-400 hover:bg-red-50 hover:text-red-500 transition-all duration-200"
          >
            <X size={18} strokeWidth={2.5} />
          </button>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3 scrollbar-thin">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-6">
              <div className="w-24 h-24 bg-orange-50 rounded-[1.5rem] flex items-center justify-center mb-5">
                <PawPrint size={40} className="text-orange-200" />
              </div>
              <p className="text-sm font-black text-gray-900 uppercase tracking-wide mb-1">
                Giỏ hàng trống
              </p>
              <p className="text-[11px] text-gray-400 font-bold uppercase tracking-wider mb-6">
                Hãy thêm sản phẩm cho boss nhé!
              </p>
              <button
                onClick={() => handleNavigate('/products')}
                className="inline-flex items-center gap-2 px-6 py-3 bg-orange-500 text-white rounded-xl font-black text-[10px] uppercase tracking-[0.15em] hover:bg-orange-600 transition-colors"
              >
                Khám phá ngay
                <ArrowRight size={14} />
              </button>
            </div>
          ) : (
            items.map((item, index) => (
              <div
                key={item.cartItemId}
                className="flex gap-3.5 p-3 bg-gray-50/70 rounded-2xl hover:bg-orange-50/50 transition-colors duration-300 group"
                style={{ animationDelay: `${index * 60}ms` }}
              >
                {/* Image */}
                <button
                  onClick={() => handleNavigate(`/products/${item.productId}`)}
                  className="shrink-0 w-[72px] h-[72px] rounded-xl overflow-hidden bg-white border border-gray-100 group-hover:border-orange-200 transition-colors"
                >
                  <img
                    src={item.productImage || '/placeholder-product.jpg'}
                    alt={item.productName}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </button>

                {/* Info */}
                <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                  <div>
                    <button
                      onClick={() => handleNavigate(`/products/${item.productId}`)}
                      className="text-[12px] font-black text-gray-800 uppercase tracking-tight leading-tight line-clamp-2 text-left hover:text-orange-600 transition-colors"
                    >
                      {item.productName}
                    </button>
                  </div>
                  <div className="flex items-end justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-bold text-gray-400">SL:</span>
                      <span className="text-xs font-black text-gray-700 bg-white px-2 py-0.5 rounded-md border border-gray-100">
                        {item.quantity}
                      </span>
                    </div>
                    <p className="text-sm font-black text-orange-600 tracking-tighter tabular-nums">
                      {formatPrice(item.subtotal || item.price * item.quantity)}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-gray-100 px-6 py-5 space-y-4 bg-white">
            {/* Subtotal */}
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                Tạm tính
              </span>
              <span className="text-xl font-black text-gray-900 tracking-tighter tabular-nums">
                {formatPrice(subtotal)}
              </span>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => handleNavigate('/cart')}
                className="flex-1 py-3.5 bg-gray-100 text-gray-700 rounded-xl font-black text-[10px] uppercase tracking-[0.15em] hover:bg-gray-200 transition-colors text-center"
              >
                Xem giỏ hàng
              </button>
              <button
                onClick={() => handleNavigate('/checkout')}
                className="flex-1 py-3.5 bg-orange-500 text-white rounded-xl font-black text-[10px] uppercase tracking-[0.15em] hover:bg-orange-600 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-orange-200"
              >
                Thanh toán
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
