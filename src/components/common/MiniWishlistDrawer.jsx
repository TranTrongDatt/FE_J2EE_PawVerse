import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Heart, ArrowRight, PawPrint, Trash2, ShoppingCart } from 'lucide-react';
import { wishlistService } from '../../api/wishlistService';
import { formatPrice } from '../../utils/formatters';
import useWishlistStore from '../../store/useWishlistStore';
import toast from 'react-hot-toast';

export default function MiniWishlistDrawer() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isWishlistDrawerOpen, closeWishlistDrawer } = useWishlistStore();
  const drawerRef = useRef(null);

  const { data: wishlistItems } = useQuery({
    queryKey: ['wishlist'],
    queryFn: wishlistService.getWishlist,
    enabled: isWishlistDrawerOpen,
  });

  const removeFromWishlistMutation = useMutation({
    mutationFn: (itemId) => wishlistService.removeFromWishlist(itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wishlist'] });
      queryClient.invalidateQueries({ queryKey: ['wishlist-check'] });
      toast.success('Đã xóa khỏi yêu thích 💔');
    },
    onError: () => toast.error('Không thể xóa sản phẩm'),
  });

  // Close on Escape key
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') closeWishlistDrawer();
    };
    if (isWishlistDrawerOpen) {
      document.addEventListener('keydown', handleKey);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [isWishlistDrawerOpen, closeWishlistDrawer]);

  const handleNavigate = (path) => {
    closeWishlistDrawer();
    navigate(path);
  };

  const items = wishlistItems || [];

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/40 backdrop-blur-sm z-[9998] transition-opacity duration-300 ${
          isWishlistDrawerOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={closeWishlistDrawer}
      />

      {/* Drawer */}
      <div
        ref={drawerRef}
        className={`fixed top-0 right-0 h-full w-full sm:w-[420px] bg-white z-[9999] shadow-2xl shadow-black/20 transform transition-transform duration-400 ease-[cubic-bezier(0.32,0.72,0,1)] flex flex-col ${
          isWishlistDrawerOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-pink-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-pink-50 rounded-xl flex items-center justify-center">
              <Heart size={20} className="text-pink-500 fill-pink-500" />
            </div>
            <div>
              <h2 className="text-sm font-black text-gray-900 uppercase tracking-wider">Yêu thích</h2>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                {items.length} sản phẩm
              </p>
            </div>
          </div>
          <button
            onClick={closeWishlistDrawer}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-gray-50 text-gray-400 hover:bg-red-50 hover:text-red-500 transition-all duration-200"
          >
            <X size={18} strokeWidth={2.5} />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3 scrollbar-thin">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-6">
              <div className="w-24 h-24 bg-pink-50 rounded-[1.5rem] flex items-center justify-center mb-5">
                <PawPrint size={40} className="text-pink-200" />
              </div>
              <p className="text-sm font-black text-gray-900 uppercase tracking-wide mb-1">
                Chưa có sản phẩm yêu thích
              </p>
              <p className="text-[11px] text-gray-400 font-bold uppercase tracking-wider mb-6">
                Hãy thả tim cho sản phẩm bạn thích nhé! 💕
              </p>
              <button
                onClick={() => handleNavigate('/products')}
                className="inline-flex items-center gap-2 px-6 py-3 bg-pink-500 text-white rounded-xl font-black text-[10px] uppercase tracking-[0.15em] hover:bg-pink-600 transition-colors"
              >
                Khám phá ngay
                <ArrowRight size={14} />
              </button>
            </div>
          ) : (
            items.map((item, index) => (
              <div
                key={item.wishlistItemId || item.id || index}
                className="flex gap-3.5 p-3 bg-gray-50/70 rounded-2xl hover:bg-pink-50/50 transition-colors duration-300 group"
                style={{ animationDelay: `${index * 60}ms` }}
              >
                {/* Image */}
                <button
                  onClick={() => handleNavigate(`/products/${item.productId}`)}
                  className="shrink-0 w-[72px] h-[72px] rounded-xl overflow-hidden bg-white border border-gray-100 group-hover:border-pink-200 transition-colors"
                >
                  <img
                    src={item.productImage || item.thumbnailUrl || '/placeholder-product.jpg'}
                    alt={item.productName}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </button>

                {/* Info */}
                <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                  <button
                    onClick={() => handleNavigate(`/products/${item.productId}`)}
                    className="text-[12px] font-black text-gray-800 uppercase tracking-tight leading-tight line-clamp-2 text-left hover:text-pink-600 transition-colors"
                  >
                    {item.productName}
                  </button>
                  <div className="flex items-end justify-between">
                    <p className="text-sm font-black text-pink-600 tracking-tighter tabular-nums">
                      {formatPrice(item.productPrice || item.price)}
                    </p>
                    <button
                      onClick={() => removeFromWishlistMutation.mutate(item.wishlistItemId || item.id)}
                      disabled={removeFromWishlistMutation.isPending}
                      className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-300 hover:bg-red-50 hover:text-red-500 transition-all"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-pink-50 px-6 py-5 space-y-4 bg-white">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                Tổng cộng
              </span>
              <span className="text-lg font-black text-gray-900 tracking-tighter tabular-nums">
                {items.length} sản phẩm
              </span>
            </div>

            <button
              onClick={() => handleNavigate('/wishlist')}
              className="w-full py-3.5 bg-pink-500 text-white rounded-xl font-black text-[10px] uppercase tracking-[0.15em] hover:bg-pink-600 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-pink-200"
            >
              Xem danh sách yêu thích
              <ArrowRight size={14} />
            </button>
          </div>
        )}
      </div>
    </>
  );
}
