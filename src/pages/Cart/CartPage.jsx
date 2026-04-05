import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, Plus, Minus, ShoppingBag, ArrowLeft, ArrowRight, ChevronRight, PawPrint, Star, ShoppingCart, Truck, Dog, Cat, RotateCcw } from 'lucide-react';
import { cartService } from '../../api/cartService';
import { productService } from '../../api/productService';
import { formatPrice } from '../../utils/formatters';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';
import useCartStore, { getCartTotalQuantity } from '../../store/useCartStore';
import ConfirmModal from '../../components/common/ConfirmModal';

export default function CartPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { setCartCount } = useCartStore();
  const [addingIds, setAddingIds] = useState(new Set());
  const [isRemoveModalOpen, setIsRemoveModalOpen] = useState(false);
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);
  const [itemToRemove, setItemToRemove] = useState(null);

  const handleAddToCart = useCallback(async (productId) => {
    if (addingIds.has(productId)) return;
    setAddingIds(prev => new Set(prev).add(productId));
    try {
      await cartService.addToCart(productId, 1);
      const cart = await cartService.getCart();
      const { setCartCount: updateCount } = useCartStore.getState();
      updateCount(getCartTotalQuantity(cart));
      queryClient.invalidateQueries(['cart']);
      toast.success('Đã thêm vào giỏ hàng!');
      useCartStore.getState().openCartDrawer();
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Không thể thêm vào giỏ hàng');
    } finally {
      setAddingIds(prev => { const s = new Set(prev); s.delete(productId); return s; });
    }
  }, [addingIds, queryClient]);

  // Fetch cart
  const { data: cart, isLoading } = useQuery({
    queryKey: ['cart'],
    queryFn: cartService.getCart,
  });

  // Update cart item mutation
  const updateMutation = useMutation({
    mutationFn: ({ itemId, quantity }) => cartService.updateCartItem(itemId, quantity),
    onSuccess: () => {
      queryClient.invalidateQueries(['cart']);
      toast.success('Cập nhật giỏ hàng thành công');
    },
    onError: () => {
      toast.error('Không thể cập nhật giỏ hàng');
    },
  });

  // Remove cart item mutation
  const removeMutation = useMutation({
    mutationFn: (itemId) => cartService.removeFromCart(itemId),
    onSuccess: async () => {
      queryClient.invalidateQueries(['cart']);
      try {
        const updatedCart = await cartService.getCart();
        setCartCount(getCartTotalQuantity(updatedCart));
      } catch {
        setCartCount(Math.max(0, getCartTotalQuantity(cart) - 1));
      }
      setIsRemoveModalOpen(false);
      setItemToRemove(null);
      toast.success('Đã xóa sản phẩm khỏi giỏ hàng');
    },
    onError: () => {
      toast.error('Không thể xóa sản phẩm');
    },
  });

  // Clear cart mutation
  const clearMutation = useMutation({
    mutationFn: cartService.clearCart,
    onSuccess: () => {
      queryClient.invalidateQueries(['cart']);
      setCartCount(0);
      setIsClearModalOpen(false);
      toast.success('Đã xóa tất cả sản phẩm');
    },
  });

  const handleUpdateQuantity = (itemId, currentQty, change) => {
    const newQty = currentQty + change;
    if (newQty > 0) {
      updateMutation.mutate({ itemId, quantity: newQty });
    }
  };

  const handleRemoveItem = (itemId) => {
    setItemToRemove(itemId);
    setIsRemoveModalOpen(true);
  };

  const handleClearCart = () => {
    setIsClearModalOpen(true);
  };

  const { data: featuredProducts } = useQuery({
    queryKey: ['featured-products-cart'],
    queryFn: () => productService.getFeaturedProducts(4),
  });

  if (isLoading) {
    return <LoadingSpinner fullScreen />;
  }

  const items = cart?.items || [];
  const subtotal = cart?.totalAmount || items.reduce((sum, item) => sum + (item.subtotal || item.price * item.quantity), 0);
  const shippingFee = 30000; // Phí vận chuyển dự kiến (Theo logic backend HN/HCM)
  const total = subtotal + shippingFee;

  if (items.length === 0) {
    return (
      <div className="bg-[#fcfdfd] min-h-screen pt-32 pb-20 relative overflow-hidden">
        {/* Decorative Background - Synchronized with Checkout */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
          <div className="absolute top-[-5%] right-[-5%] w-[40vw] h-[40vw] bg-orange-100/30 rounded-full blur-[100px] opacity-40"></div>
          <div className="absolute bottom-[-5%] left-[-5%] w-[35vw] h-[35vw] bg-blue-50/40 rounded-full blur-[80px] opacity-30"></div>
          
          <div className="absolute top-[20%] left-[5%] opacity-[0.03] rotate-12">
            <Dog size={200} />
          </div>
          <div className="absolute bottom-[20%] right-[3%] opacity-[0.03] -rotate-12">
            <Cat size={180} />
          </div>
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-xl mx-auto text-center mb-16">
            <div className="bg-white/90 backdrop-blur-2xl rounded-[3rem] shadow-2xl shadow-orange-100/50 border border-white p-12 relative overflow-hidden group/empty animate-in fade-in zoom-in duration-700">
              {/* Decorative Paw Marks */}
              <div className="absolute top-10 right-10 text-orange-50 opacity-50 -rotate-12 group-hover/empty:rotate-12 transition-transform duration-1000">
                 <PawPrint size={100} />
              </div>
              <div className="absolute -bottom-10 -left-10 text-orange-50 opacity-50 rotate-45">
                 <PawPrint size={120} />
              </div>

              <div className="relative z-10">
                <div className="w-56 h-56 mx-auto mb-8 rounded-[2rem] overflow-hidden bg-orange-50 border-4 border-white shadow-xl">
                  <img 
                    src="/Images/cart/Corgi.png" 
                    alt="Empty Cart Corgi" 
                    className="w-full h-full object-cover group-hover/empty:scale-110 transition-transform duration-700"
                  />
                </div>
                
                <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-4 tracking-tight uppercase">
                  Giỏ hàng đang <span className="text-orange-500 underline decoration-orange-200 decoration-wavy text-4xl">"đói"</span> meo!
                </h2>
                
                <p className="text-gray-400 font-bold text-sm mb-10 leading-relaxed max-w-sm mx-auto uppercase tracking-wide">
                  Chưa có gì ở đây cả sen ơi! Hãy dạo 1 vòng xem sao nhé, các boss đang đợi quà đấy
                </p>
                
                <Link
                  to="/products"
                  className="inline-flex items-center gap-3 px-10 py-5 bg-orange-500 text-white rounded-[1.5rem] font-black text-xs uppercase tracking-[0.2em] shadow-lg shadow-orange-100 hover:bg-orange-600 hover:shadow-orange-200 hover:-translate-y-1 active:translate-y-0 transition-all duration-300 group/btn"
                >
                  Khám phá Pawverse ngay
                  <ArrowRight size={18} className="group-hover/btn:translate-x-1.5 transition-transform" />
                </Link>
              </div>
            </div>
          </div>

          {/* Recommendations System - Standard Product Card UI */}
          {(featuredProducts?.content || featuredProducts)?.length > 0 && (
            <div className="bg-gray-100/60 rounded-[3.5rem] py-16 px-6 md:px-10 animate-in slide-in-from-bottom-10 duration-1000 delay-300 border border-gray-200/30 w-full mt-24">
              <div className="max-w-6xl mx-auto">
                <div className="flex flex-col md:flex-row items-center justify-between mb-12 gap-4 px-2">
                  <div className="relative">
                    <h3 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tighter uppercase leading-none">CÓ THỂ SEN SẼ THÍCH!</h3>
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
                      onAddToCart={handleAddToCart}
                      isAdding={addingIds.has(product.idProduct)}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#fcfdfd] min-h-screen pt-32 pb-20 relative overflow-hidden">
      {/* Decorative Background - Synchronized with Checkout */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-5%] right-[-5%] w-[40vw] h-[40vw] bg-orange-100/30 rounded-full blur-[100px] opacity-40"></div>
        <div className="absolute bottom-[-5%] left-[-5%] w-[35vw] h-[35vw] bg-blue-50/40 rounded-full blur-[80px] opacity-30"></div>
        
        <div className="absolute top-[20%] left-[5%] opacity-[0.04] rotate-12">
          <Dog size={240} />
        </div>
        <div className="absolute bottom-[10%] right-[3%] opacity-[0.04] -rotate-12">
          <Cat size={220} />
        </div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Breadcrumb - Premium Minimalist */}
        <div className="max-w-7xl mx-auto mb-10 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
          <Link to="/" className="hover:text-orange-500 transition-colors">TRANG CHỦ</Link>
          <ChevronRight size={12} />
          <span className="text-gray-900">GIỎ HÀNG CỦA SEN</span>
        </div>

        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-10">
          {/* Main Cart Content */}
          <div className="flex-1 space-y-8 animate-in slide-in-from-left-10 duration-1000">
            <div className="flex items-end justify-between px-2">
              <div>
                <h1 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tighter uppercase leading-none">
                  GIỎ HÀNG <span className="text-orange-500">PAWVERSE</span>
                </h1>
                <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-3 flex items-center gap-2">
                  <ShoppingBag size={14} /> HIỆN CÓ {items.length} SẢN PHẨM TRONG TÚI
                </p>
              </div>
              
              <button
                onClick={handleClearCart}
                className="group flex items-center gap-2 px-6 py-3 bg-red-50 text-red-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all duration-300"
              >
                <Trash2 size={14} className="group-hover:rotate-12 transition-transform" />
                DỌN SẠCH TÚI
              </button>
            </div>

            <div className="space-y-4">
              {items.map((item) => (
                <div 
                  key={item.cartItemId} 
                  className="bg-white rounded-[2rem] p-4 md:p-6 shadow-xl shadow-gray-200/40 border border-white hover:shadow-2xl hover:border-orange-100 transition-all duration-500 group"
                >
                  <div className="flex flex-col md:flex-row items-center gap-6">
                    {/* Product Image - Scaled Down */}
                    <div className="relative shrink-0">
                       <Link to={`/products/${item.productId}`} className="block relative z-10">
                        <div className="w-24 h-24 md:w-28 md:h-28 rounded-2xl overflow-hidden bg-gray-50 border border-gray-100 group-hover:scale-105 transition-transform duration-500">
                          <img
                            src={item.productImage || '/placeholder-product.jpg'}
                            alt={item.productName}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </Link>
                      <div className="absolute -inset-2 bg-orange-100/30 rounded-[2rem] blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 -z-10"></div>
                    </div>

                    {/* Product Info - Scaled Down */}
                    <div className="flex-1 text-center md:text-left">
                      <div className="mb-1.5">
                         <span className="text-[9px] font-black text-orange-500 uppercase tracking-widest bg-orange-50 px-2 py-0.5 rounded-md">
                           Pet-Select
                         </span>
                      </div>
                      <Link
                        to={`/products/${item.productId}`}
                        className="text-base md:text-lg font-black text-gray-900 group-hover:text-orange-600 transition-colors tracking-tight leading-tight block mb-2 uppercase"
                      >
                        {item.productName}
                      </Link>
                      <div className="flex items-center justify-center md:justify-start gap-3">
                        <p className="text-orange-600 font-black text-lg md:text-xl tracking-tighter leading-none tabular-nums">
                          {formatPrice(item.price)}
                        </p>
                      </div>
                    </div>

                    {/* Quantity & Total - Scaled Down */}
                    <div className="flex flex-col items-center md:items-end gap-4 shrink-0 pt-4 md:pt-0 border-t md:border-t-0 border-gray-50 w-full md:w-auto">
                      <div className="flex items-center bg-gray-50 p-1 rounded-xl border border-gray-100 shadow-inner">
                        <button
                          onClick={() => handleUpdateQuantity(item.cartItemId, item.quantity, -1)}
                          disabled={item.quantity <= 1 || updateMutation.isPending}
                          className="w-8 h-8 flex items-center justify-center bg-white text-gray-400 rounded-lg hover:text-orange-600 hover:shadow-md transition-all active:scale-95 disabled:opacity-30 focus-visible:ring-2 focus-visible:ring-orange-500 outline-none"
                        >
                          <Minus size={14} />
                        </button>
                        <span className="w-10 text-center font-black text-base text-gray-900 tabular-nums">{item.quantity}</span>
                        <button
                          onClick={() => handleUpdateQuantity(item.cartItemId, item.quantity, 1)}
                          disabled={item.quantity >= item.availableStock || updateMutation.isPending}
                          className="w-8 h-8 flex items-center justify-center bg-white text-gray-400 rounded-lg hover:text-orange-600 hover:shadow-md transition-all active:scale-95 disabled:opacity-30 focus-visible:ring-2 focus-visible:ring-orange-500 outline-none"
                        >
                          <Plus size={14} />
                        </button>
                      </div>

                      <div className="flex flex-col items-center md:items-end">
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-0.5">TỔNG CỘNG:</p>
                        <p className="text-xl md:text-2xl font-black text-gray-900 tracking-tighter leading-none tabular-nums">
                          {formatPrice(item.subtotal || item.price * item.quantity)}
                        </p>
                      </div>

                      <button
                        onClick={() => handleRemoveItem(item.cartItemId)}
                        className="absolute top-4 right-4 md:static text-gray-300 hover:text-red-500 transition-colors p-1.5"
                        disabled={removeMutation.isPending}
                      >
                        <Trash2 size={18} strokeWidth={2.5} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <Link
              to="/products"
              className="inline-flex items-center gap-2 text-orange-600 font-black text-[10px] uppercase tracking-[0.2em] px-8 py-4 bg-white rounded-full shadow-lg border border-orange-100 hover:bg-orange-600 hover:text-white transition-all duration-300"
            >
              <ArrowLeft size={16} />
              TIẾP TỤC CHỌN QUÀ
            </Link>
          </div>

          {/* Sidebar - Order Summary Scaled Down */}
          <div className="lg:w-[360px] shrink-0 animate-in slide-in-from-right-10 duration-1000 delay-200">
            <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-gray-200/60 p-8 md:p-10 border-2 border-orange-50 relative overflow-hidden">
              <div className="relative z-10">
                <h2 className="text-xl md:text-2xl font-black text-gray-900 tracking-tighter uppercase mb-2">TỔNG ĐƠN HÀNG</h2>
                <div className="w-12 h-1 bg-orange-500 rounded-full mb-8" />

                <div className="space-y-4 mb-8">
                  <div className="flex justify-between items-center text-gray-500 text-[10px] font-black uppercase tracking-widest">
                    <span>TẠM TÍNH ({items.length} MÓN)</span>
                    <span className="text-gray-900 tabular-nums text-base font-black tracking-tight">{formatPrice(subtotal)}</span>
                  </div>
                  
                  <div className="flex justify-between items-center text-gray-500 text-[10px] font-black uppercase tracking-widest">
                    <span>PHÍ VẬN CHUYỂN</span>
                    <span className="tabular-nums text-base text-gray-900 font-black tracking-tight">
                      {formatPrice(shippingFee)}
                    </span>
                  </div>

                  <div className="pt-4 border-t border-gray-100 flex justify-between items-end">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5">TỔNG CỘNG</span>
                      <p className="text-gray-900 text-[8px] font-bold italic">Bao gồm VAT</p>
                    </div>
                    <span className="text-2xl md:text-3xl font-black text-orange-600 tracking-tighter tabular-nums">{formatPrice(total)}</span>
                  </div>
                </div>

                <button
                  onClick={() => navigate('/checkout')}
                  className="w-full py-4 bg-gray-900 text-white rounded-full font-black text-base hover:bg-orange-600 transition-all hover:scale-[1.02] active:scale-95 shadow-xl shadow-gray-300 flex items-center justify-center gap-2 mb-6 uppercase tracking-widest"
                >
                  THANH TOÁN NGAY
                  <ArrowRight size={18} />
                </button>

                <div className="space-y-3 px-1">
                  <div className="flex items-center gap-3">
                     <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center text-gray-400">
                        <ArrowLeft size={14} />
                     </div>
                     <span className="text-[9px] font-black text-gray-600 uppercase tracking-widest">ĐỔI TRẢ 7 NGÀY</span>
                  </div>
                  <div className="flex items-center gap-3">
                     <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center text-gray-400">
                        <ShoppingBag size={14} />
                     </div>
                     <span className="text-[9px] font-black text-gray-600 uppercase tracking-widest">CHÍNH HÃNG 100%</span>
                  </div>
                </div>
              </div>
            </div>
            
            <p className="mt-8 text-center text-gray-400 text-[9px] font-black uppercase tracking-[0.3em] leading-loose">
              PawVerse © 2026<br/>
              Dịch vụ chăm sóc thú cưng hàng đầu Việt Nam
            </p>
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={isRemoveModalOpen}
        onClose={() => setIsRemoveModalOpen(false)}
        onConfirm={() => removeMutation.mutate(itemToRemove)}
        title="XÓA SẢN PHẨM? 🛒"
        message="Bạn có chắc muốn xóa sản phẩm này khỏi giỏ hàng không?"
        confirmText="XÓA KHỎI GIỎ"
        cancelText="GIỮ LẠI"
        variant="danger"
        isLoading={removeMutation.isPending}
      />

      <ConfirmModal
        isOpen={isClearModalOpen}
        onClose={() => setIsClearModalOpen(false)}
        onConfirm={() => clearMutation.mutate()}
        title="DỌN SẠCH GIỎ HÀNG? 🧼"
        message="Bạn có chắc muốn xóa TẤT CẢ sản phẩm trong giỏ hàng không? Hành động này không thể hoàn tác!"
        confirmText="DỌN SẠCH NGAY"
        cancelText="SUY NGHĨ LẠI"
        variant="danger"
        isLoading={clearMutation.isPending}
      />
    </div>
  );
}
function CardProduct({ product, onAddToCart, isAdding = false }) {
  const rating = product.avgRating || 0;
  const soldCount = product.soLuongDaBan || 0;

  return (
    <div className="bg-white rounded-3xl md:rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden hover:shadow-2xl hover:-translate-y-3 transition-all duration-500 group relative flex flex-col h-full focus-within:ring-2 focus-within:ring-orange-500 outline-none">
      <div className="relative h-48 md:h-64 overflow-hidden bg-gray-50">
        <Link to={`/products/${product.idProduct}`} aria-label={`Xem chi tiết ${product.tenProduct}`}>
          <img
            src={product.thumbnailUrl || '/placeholder-product.jpg'}
            alt={product.tenProduct}
            className="w-full h-full object-cover group-hover:scale-110 transition duration-700"
            loading="lazy"
          />
        </Link>

        <div className="absolute inset-0 bg-black/30 backdrop-blur-[4px] opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col items-center justify-center gap-3 p-4">
          <Link
            to={`/products/${product.idProduct}`}
            className="w-full py-2.5 bg-white text-gray-900 rounded-xl font-black text-[9px] uppercase tracking-widest text-center hover:bg-gray-900 hover:text-white transition-all transform translate-y-4 group-hover:translate-y-0 shadow-xl"
          >
            XEM CHI TIẾT
          </Link>
          <button
            onClick={() => onAddToCart(product.idProduct)}
            disabled={product.soLuongTonKho === 0 || isAdding}
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
          <div className="flex gap-0.5">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                size={12}
                className={i < Math.floor(rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'}
              />
            ))}
          </div>
          <span className="text-[9px] text-gray-400 font-black uppercase tracking-widest">BÁN {soldCount}</span>
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
