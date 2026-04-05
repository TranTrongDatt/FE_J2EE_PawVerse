import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { 
  Trash2, 
  ShoppingCart, 
  Heart, 
  ChevronRight, 
  ArrowRight, 
  PawPrint, 
  ShoppingBag,
  Dog,
  Cat,
  Zap,
  ArrowLeft,
  Star
} from 'lucide-react';
import { wishlistService } from '../../api/wishlistService';
import { cartService } from '../../api/cartService';
import { productService } from '../../api/productService';
import { formatPrice } from '../../utils/formatters';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';
import useCartStore, { getCartTotalQuantity } from '../../store/useCartStore';

export default function WishlistPage() {
  const queryClient = useQueryClient();
  const [addingIds, setAddingIds] = useState(new Set());

  // Fetch wishlist
  const { data: wishlist, isLoading } = useQuery({
    queryKey: ['wishlist'],
    queryFn: wishlistService.getWishlist,
  });

  // Fetch recommendations
  const { data: featuredProducts } = useQuery({
    queryKey: ['featured-products-wishlist'],
    queryFn: () => productService.getFeaturedProducts(4),
  });

  // Add to cart from card (general)
  const handleAddToCartGeneric = useCallback(async (productId) => {
    if (addingIds.has(productId)) return;
    setAddingIds(prev => new Set(prev).add(productId));
    try {
      await cartService.addToCart(productId, 1);
      const cart = await cartService.getCart();
      const { setCartCount } = useCartStore.getState();
      setCartCount(getCartTotalQuantity(cart));
      queryClient.invalidateQueries(['cart']);
      toast.success('Đã thêm vào giỏ hàng!');
      useCartStore.getState().openCartDrawer();
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Không thể thêm vào giỏ hàng');
    } finally {
      setAddingIds(prev => { const s = new Set(prev); s.delete(productId); return s; });
    }
  }, [addingIds, queryClient]);

  // Remove from wishlist mutation
  const removeMutation = useMutation({
    mutationFn: (itemId) => wishlistService.removeFromWishlist(itemId),
    onSuccess: () => {
      queryClient.invalidateQueries(['wishlist']);
      toast.success('Đã xóa khỏi danh sách yêu thích');
    },
    onError: () => {
      toast.error('Không thể xóa sản phẩm');
    },
  });

  // Add to cart from wishlist mutation
  const addToCartFromWishlistMutation = useMutation({
    mutationFn: (productId) => cartService.addToCart(productId, 1),
    onSuccess: async () => {
      const cart = await cartService.getCart();
      const { setCartCount } = useCartStore.getState();
      setCartCount(getCartTotalQuantity(cart));
      queryClient.invalidateQueries(['cart']);
      toast.success('Đã thêm vào giỏ hàng!');
      useCartStore.getState().openCartDrawer();
    },
    onError: () => {
      toast.error('Không thể thêm vào giỏ hàng');
    },
  });

  const handleRemove = (itemId) => {
    removeMutation.mutate(itemId);
  };

  const handleAddToCartFromWishlist = async (productId, wishlistItemId) => {
    await addToCartFromWishlistMutation.mutateAsync(productId);
    removeMutation.mutate(wishlistItemId);
  };

  if (isLoading) {
    return <LoadingSpinner fullScreen />;
  }

  const items = Array.isArray(wishlist) ? wishlist : (wishlist?.items || []);

  const EmptyState = () => (
    <div className="container mx-auto px-4 relative z-10">
      <div className="max-w-xl mx-auto text-center mb-16">
        <div className="bg-white/90 backdrop-blur-2xl rounded-[3rem] shadow-2xl shadow-gray-200/50 border border-white p-12 relative overflow-hidden group/empty animate-in fade-in zoom-in duration-700">
          <div className="absolute font-black text-orange-50/50 top-10 right-10 -rotate-12 group-hover/empty:rotate-12 transition-transform duration-1000">
             <Heart size={100} className="fill-orange-50" />
          </div>
          
          <div className="relative z-10">
            <div className="w-56 h-56 mx-auto mb-8 rounded-[2rem] overflow-hidden bg-orange-50 border-4 border-white shadow-xl relative">
              <img 
                src="/Images/cart/Corgi.png" 
                alt="Empty Wishlist Corgi" 
                width={224}
                height={224}
                loading="lazy"
                className="w-full h-full object-cover group-hover/empty:scale-110 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-orange-200/20 to-transparent" />
            </div>
            
            <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-4 tracking-tight uppercase leading-none [text-wrap:balance]">
              CHƯA CÓ <span className="text-orange-500">MÓN QUÀ</span> NÀO CẢ!
            </h2>
            
            <p className="text-gray-400 font-bold text-[10px] mb-10 leading-relaxed max-w-sm mx-auto uppercase tracking-[0.2em]">
              Danh sách yêu thích đang trống meo. Hãy tặng Boss những món quà ý nghĩa nhất nhé!
            </p>
            
            <Link
              to="/products"
              className="inline-flex items-center gap-3 px-10 py-5 bg-orange-600 text-white rounded-[1.5rem] font-black text-xs uppercase tracking-[0.2em] shadow-lg shadow-orange-100 hover:bg-orange-500 hover:shadow-orange-200 hover:-translate-y-1 transition-all duration-300 group/btn"
            >
              Ghé thăm cửa hàng ngay
              <ArrowRight size={18} className="group-hover/btn:translate-x-1.5 transition-transform" />
            </Link>
          </div>
        </div>
      </div>

      {/* Recommendations - Exactly like CartPage */}
      {(featuredProducts?.content || featuredProducts)?.length > 0 && (
        <div className="bg-white/50 backdrop-blur-sm rounded-[3.5rem] py-16 px-6 md:px-10 animate-in slide-in-from-bottom-10 duration-1000 delay-300 border border-white w-full mt-24 shadow-2xl shadow-gray-200/40">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row items-center justify-between mb-12 gap-4 px-2">
              <div className="relative">
                <h3 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tighter uppercase leading-none [text-wrap:balance]">CÓ THỂ SEN SẼ THÍCH!</h3>
                <div className="absolute -bottom-4 left-0 w-20 h-1.5 bg-orange-500 rounded-full" />
              </div>
              <Link to="/products" className="group/all text-[11px] font-black text-orange-600 uppercase tracking-[0.2em] px-6 py-2.5 rounded-full hover:bg-white transition-all duration-300 inline-flex items-center gap-2">
                XEM TẤT CẢ <ChevronRight size={14} className="group-hover/all:translate-x-1 transition-transform" />
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
              {(featuredProducts.content || featuredProducts).slice(0, 4).map(product => (
                <CardProduct 
                  key={product.idProduct} 
                  product={product} 
                  onAddToCart={handleAddToCartGeneric}
                  isAdding={addingIds.has(product.idProduct)}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="bg-[#fcfdfd] min-h-screen pt-32 pb-20 relative overflow-hidden">
      {/* Decorative Background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-5%] right-[-5%] w-[40vw] h-[40vw] bg-orange-100/30 rounded-full blur-[100px] opacity-40"></div>
        <div className="absolute bottom-[-5%] left-[-5%] w-[35vw] h-[35vw] bg-blue-50/40 rounded-full blur-[80px] opacity-30"></div>
        
        <div className="absolute top-[20%] left-[5%] opacity-[0.03] rotate-12">
          <Dog size={240} />
        </div>
        <div className="absolute bottom-[20%] right-[3%] opacity-[0.03] -rotate-12">
          <Cat size={200} />
        </div>
      </div>

      {items.length === 0 ? <EmptyState /> : (
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-7xl mx-auto">
            {/* Breadcrumb */}
            <nav className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-12">
              <Link to="/" className="hover:text-orange-500 transition-colors">TRANG CHỦ</Link>
              <ChevronRight size={12} />
              <span className="text-orange-600">DANH SÁCH YÊU THÍCH</span>
            </nav>

            {/* Header Title Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16 animate-in fade-in slide-in-from-left-8 duration-700">
              <div>
                 <h1 className="text-5xl md:text-6xl font-black text-gray-900 tracking-tighter uppercase mb-4 leading-none [text-wrap:balance]">
                   MÓN QUÀ <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-orange-400">
                     CHO BOSS
                   </span>
                 </h1>
                 <p className="text-gray-400 font-bold uppercase text-[10px] tracking-[0.3em] flex items-center gap-2">
                   <Heart size={14} className="text-red-500 fill-red-500" />
                   Lưu giữ {items.length} niềm vui nhỏ 🐾
                 </p>
              </div>
              
              <Link to="/products" className="flex items-center gap-2 text-gray-400 hover:text-orange-500 font-black text-[10px] uppercase tracking-widest transition-all hover:-translate-x-1 group">
                 <ArrowLeft size={16} className="group-hover:translate-x-[-2px] transition-transform" /> 
                 Tiếp tục mua sắm
              </Link>
            </div>

            {/* Wishlist Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {items.map((item, index) => (
                <div
                  key={item.wishlistId}
                  className="bg-white rounded-[2.5rem] shadow-2xl shadow-gray-200/40 border border-white overflow-hidden hover:shadow-orange-200/30 hover:-translate-y-4 transition-all duration-500 group relative flex flex-col animate-in fade-in slide-in-from-bottom-10 fill-mode-both"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="relative h-72 overflow-hidden bg-gray-50 flex items-center justify-center">
                    <Link to={`/products/${item.productId}`} className="w-full h-full">
                      <img
                        src={item.productImage || '/placeholder-product.jpg'}
                        alt={item.productName}
                        width={400}
                        height={400}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      />
                    </Link>
                    
                    {item.inStock === false && (
                      <div className="absolute inset-0 bg-white/70 backdrop-blur-sm flex items-center justify-center pointer-events-none z-10">
                        <span className="text-gray-900 font-black uppercase tracking-widest text-[10px] border-2 border-gray-900 px-3 py-1">HẾT HÀNG</span>
                      </div>
                    )}

                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        handleRemove(item.wishlistId);
                      }}
                      aria-label="Xóa sản phẩm khỏi danh sách yêu thích"
                      className="absolute top-5 right-5 p-3 bg-white/90 backdrop-blur-sm text-red-500 rounded-2xl shadow-xl hover:bg-red-500 hover:text-white transition-all transform hover:scale-110 active:scale-95 z-20 focus-visible:ring-2 focus-visible:ring-red-500 outline-none"
                      disabled={removeMutation.isPending}
                    >
                      <Trash2 size={20} />
                    </button>

                    <div className="absolute bottom-5 left-5 right-5 z-20 translate-y-2 group-hover:translate-y-0 transition-transform duration-500">
                      <div className="flex gap-2">
                         <div className="bg-white/90 backdrop-blur-md px-3 py-1 rounded-full border border-white/50 text-[8px] font-black text-orange-600 uppercase tracking-widest flex items-center gap-1 shadow-sm">
                           <Zap size={10} className="fill-orange-600" /> Best Gift
                         </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-8 flex flex-col flex-1">
                    <Link to={`/products/${item.productId}`} className="block mb-4">
                      <h3 className="font-black text-gray-900 text-sm md:text-base leading-tight uppercase tracking-tight line-clamp-2 group-hover:text-orange-600 transition-colors min-h-[3rem]">
                        {item.productName}
                      </h3>
                    </Link>

                    <div className="mb-8 mt-auto">
                      <div className="flex flex-col">
                         <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">GIÁ ƯU ĐÃI</p>
                         <p className="text-2xl font-black text-orange-600 tracking-tighter tabular-nums leading-none">
                           {formatPrice(item.salePrice || item.price)}
                         </p>
                         {item.salePrice && item.salePrice < item.price && (
                           <div className="flex items-center gap-2 mt-2">
                              <span className="text-xs text-gray-300 line-through font-bold tabular-nums">
                                {formatPrice(item.price)}
                              </span>
                              <span className="bg-green-50 text-green-600 text-[8px] font-black px-1.5 py-0.5 rounded tracking-widest uppercase">
                                 SAVE {Math.round((1 - item.salePrice/item.price) * 100)}%
                              </span>
                           </div>
                         )}
                      </div>
                    </div>

                    <button
                      onClick={() => handleAddToCartFromWishlist(item.productId, item.wishlistId)}
                      disabled={item.inStock === false || addToCartFromWishlistMutation.isPending}
                      aria-label="Thêm vào giỏ"
                      className="w-full py-5 bg-gray-900 text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] shadow-xl hover:bg-orange-600 hover:-translate-y-1 transition-all active:scale-[0.98] disabled:bg-gray-100 disabled:text-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-3 group/btn relative overflow-hidden focus-visible:ring-2 focus-visible:ring-orange-500 outline-none"
                    >
                      <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-1000 -skew-x-12" />
                      {addToCartFromWishlistMutation.isPending ? (
                         <LoadingSpinner size="sm" color="white" />
                      ) : (
                        <>
                          <ShoppingCart size={18} />
                          <span>THÊM VÀO GIỎ</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CardProduct({ product, onAddToCart, isAdding = false }) {
  const rating = product.avgRating || 0;

  return (
    <div className="bg-white rounded-3xl md:rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden hover:shadow-2xl hover:-translate-y-3 transition-all duration-500 group relative flex flex-col h-full focus-within:ring-2 focus-within:ring-orange-500 outline-none">
      <div className="relative h-48 md:h-64 overflow-hidden bg-gray-50 flex items-center justify-center">
        <Link to={`/products/${product.idProduct}`} aria-label={`Xem chi tiết ${product.tenProduct}`}>
          <img
            src={product.thumbnailUrl || '/placeholder-product.jpg'}
            alt={product.tenProduct}
            width={300}
            height={400}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-110 transition duration-700"
          />
        </Link>

        <div className="absolute inset-0 bg-black/30 backdrop-blur-[4px] opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col items-center justify-center gap-3 p-4">
          <Link
            to={`/products/${product.idProduct}`}
            aria-label={`Xem chi tiết sản phẩm ${product.tenProduct}`}
            className="w-full py-2.5 bg-white text-gray-900 rounded-xl font-black text-[9px] uppercase tracking-widest text-center hover:bg-gray-900 hover:text-white transition-all transform translate-y-4 group-hover:translate-y-0 shadow-xl"
          >
            XEM CHI TIẾT
          </Link>
          <button
            onClick={() => onAddToCart(product.idProduct)}
            disabled={product.soLuongTonKho === 0 || isAdding}
            aria-label="Mua sản phẩm này ngay"
            className="w-full py-2.5 bg-orange-600 text-white rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-orange-700 transition-all transform translate-y-4 group-hover:translate-y-0 delay-75 shadow-xl disabled:bg-gray-400 active:scale-95 focus-visible:ring-2 focus-visible:ring-white outline-none"
          >
            {isAdding ? 'ĐANG THÊM…' : 'MUA NGAY'}
          </button>
        </div>

        {product.soLuongTonKho === 0 && (
          <div className="absolute inset-0 bg-white/70 backdrop-blur-sm flex items-center justify-center pointer-events-none z-10">
            <span className="text-gray-900 font-black uppercase tracking-widest text-[10px] border-2 border-gray-900 px-2 py-0.5">HẾT HÀNG</span>
          </div>
        )}

        <div className="absolute top-4 left-4 flex flex-col gap-2 z-10">
          {product.giaGoc && product.giaGoc > product.giaBan && (
            <span className="bg-orange-600 text-white text-[9px] font-black px-2 py-0.5 rounded shadow-lg uppercase tracking-wider">
              -{Math.round((1 - product.giaBan / product.giaGoc) * 100)}%
            </span>
          )}
        </div>
      </div>

      <div className="p-4 md:p-6 flex flex-col flex-1">
        <Link to={`/products/${product.idProduct}`} className="block mb-2">
          <h3 className="font-black text-gray-900 group-hover:text-orange-600 transition-colors line-clamp-2 min-h-[2.5rem] text-[11px] md:text-sm leading-tight uppercase tracking-tight">
            {product.tenProduct}
          </h3>
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-3">
          <div className="flex gap-0.5" aria-label={`Đánh giá ${rating} sao`}>
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                size={12}
                className={i < Math.floor(rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'}
                aria-hidden="true"
              />
            ))}
          </div>
          <span className="text-[9px] text-gray-400 font-black uppercase tracking-widest tabular-nums">BÁN {product.soLuongDaBan || 0}</span>
        </div>

        <div className="mt-auto">
          <div className="flex flex-col md:flex-row md:items-end gap-1">
            <p className="text-base md:text-xl font-black text-orange-600 leading-none tabular-nums">
              {formatPrice(product.giaBan)}
            </p>
            {product.giaGoc && product.giaGoc > product.giaBan && (
              <p className="text-[10px] md:text-xs text-gray-400 line-through font-bold tabular-nums">
                {formatPrice(product.giaGoc)}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
