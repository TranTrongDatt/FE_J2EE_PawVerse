import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { Star, ShoppingCart, Heart, Minus, Plus, Truck, Shield, RotateCcw, Edit3, Trash2, MessageSquare, AlertTriangle, Eye, EyeOff, CheckCircle, PawPrint, BadgeCheck, Gift, ShieldCheck, Leaf, Smile } from 'lucide-react';
import { productService } from '../../api/productService';
import { cartService } from '../../api/cartService';
import { wishlistService } from '../../api/wishlistService';
import { formatPrice, formatDate } from '../../utils/formatters';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';
import useCartStore, { getCartTotalQuantity } from '../../store/useCartStore';
import useAuthStore from '../../store/useAuthStore';
import useWishlistStore from '../../store/useWishlistStore';

export default function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  
  const { setCartCount } = useCartStore();
  const { isAuthenticated, user } = useAuthStore();

  // Review state
  const [ratingFilter, setRatingFilter] = useState(null);
  const [reviewPage, setReviewPage] = useState(0);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [hoverRating, setHoverRating] = useState(0);
  const [editingReview, setEditingReview] = useState(null);
  // eslint-disable-next-line no-unused-vars
  const [revealedReviews, setRevealedReviews] = useState(new Set());
  // eslint-disable-next-line no-unused-vars
  const [staffReplyText, setStaffReplyText] = useState('');
  // eslint-disable-next-line no-unused-vars
  const [replyingTo, setReplyingTo] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const reviewTextareaRef = useRef(null);

  const EMOJI_LIST = [
    '😀','😊','😍','🥰','😘','😎','🤩','😂','🤣','😅',
    '😢','😭','😤','😡','🤔','😱','🥺','😴','🤢','🤮',
    '👍','👎','👏','🙏','💪','✌️','🤝','❤️','💕','💖',
    '⭐','🌟','✨','🔥','💯','🎉','🎊','🏆','👑','💎',
    '🐶','🐱','🐾','🦴','🐕','🐈','🐰','🐹','🐦','🐟',
    '🛍️','📦','🚚','✅','❌','⚠️','💰','🎁','🛒','📱',
  ];

  const insertReviewEmoji = (emoji) => {
    const textarea = reviewTextareaRef.current;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newComment = reviewComment.slice(0, start) + emoji + reviewComment.slice(end);
      setReviewComment(newComment);
      setTimeout(() => {
        textarea.focus();
        textarea.selectionStart = textarea.selectionEnd = start + emoji.length;
      }, 0);
    } else {
      setReviewComment(prev => prev + emoji);
    }
  };

  // eslint-disable-next-line no-unused-vars
  const isStaff = user?.role === 'STAFF' || user?.role === 'ADMIN';

  // Fetch product details
  const { data: product, isLoading } = useQuery({
    queryKey: ['product', id],
    queryFn: () => productService.getProductById(id),
  });

  // Fetch product reviews with filter
  const { data: reviewsData } = useQuery({
    queryKey: ['reviews', id, ratingFilter, reviewPage],
    queryFn: () => productService.getProductReviews(id, { rating: ratingFilter, page: reviewPage, size: 10 }),
    enabled: !!id,
  });

  const reviews = reviewsData?.content || [];
  // eslint-disable-next-line no-unused-vars
  const totalPages = reviewsData?.totalPages || 0;

  // Fetch rating distribution stats
  const { data: reviewStats } = useQuery({
    queryKey: ['review-stats', id],
    queryFn: () => productService.getReviewStats(id),
    enabled: !!id,
  });

  // Check if user can review
  const { data: canReview } = useQuery({
    queryKey: ['can-review', id],
    queryFn: () => productService.canReviewProduct(id),
    enabled: isAuthenticated && !!id,
  });

  // Create review mutation
  const createReviewMutation = useMutation({
    mutationFn: (data) => productService.createReview(data),
    onSuccess: () => {
      toast.success('Đánh giá thành công!');
      queryClient.invalidateQueries({ queryKey: ['reviews', id] });
      queryClient.invalidateQueries({ queryKey: ['review-stats', id] });
      queryClient.invalidateQueries({ queryKey: ['can-review', id] });
      queryClient.invalidateQueries({ queryKey: ['product', id] });
      resetReviewForm();
    },
    onError: (err) => toast.error(err?.response?.data?.message || 'Không thể đánh giá'),
  });

  // Update review mutation
  const updateReviewMutation = useMutation({
    mutationFn: ({ reviewId, data }) => productService.updateReview(reviewId, data),
    onSuccess: () => {
      toast.success('Cập nhật đánh giá thành công!');
      queryClient.invalidateQueries({ queryKey: ['reviews', id] });
      queryClient.invalidateQueries({ queryKey: ['review-stats', id] });
      queryClient.invalidateQueries({ queryKey: ['product', id] });
      resetReviewForm();
    },
    onError: (err) => toast.error(err?.response?.data?.message || 'Không thể cập nhật đánh giá'),
  });

  // Delete review mutation
  const deleteReviewMutation = useMutation({
    mutationFn: (reviewId) => productService.deleteReview(reviewId),
    onSuccess: () => {
      toast.success('Xóa đánh giá thành công!');
      queryClient.invalidateQueries({ queryKey: ['reviews', id] });
      queryClient.invalidateQueries({ queryKey: ['review-stats', id] });
      queryClient.invalidateQueries({ queryKey: ['can-review', id] });
      queryClient.invalidateQueries({ queryKey: ['product', id] });
    },
    onError: (err) => toast.error(err?.response?.data?.message || 'Không thể xóa đánh giá'),
  });

  // Staff reply mutation
  // eslint-disable-next-line no-unused-vars
  const staffReplyMutation = useMutation({
    mutationFn: ({ reviewId, reply }) => productService.staffReplyReview(reviewId, { reply }),
    onSuccess: () => {
      toast.success('Phản hồi thành công!');
      queryClient.invalidateQueries({ queryKey: ['reviews', id] });
      setReplyingTo(null);
      setStaffReplyText('');
    },
    onError: (err) => toast.error(err?.response?.data?.message || 'Không thể phản hồi'),
  });

  const resetReviewForm = () => {
    setShowReviewForm(false);
    setEditingReview(null);
    setReviewRating(5);
    setReviewComment('');
    setHoverRating(0);
  };

  const handleSubmitReview = () => {
    if (!reviewComment.trim()) {
      toast.error('Vui lòng nhập nội dung đánh giá');
      return;
    }
    if (editingReview) {
      updateReviewMutation.mutate({ reviewId: editingReview.reviewId, data: { rating: reviewRating, comment: reviewComment } });
    } else {
      createReviewMutation.mutate({ productId: parseInt(id), rating: reviewRating, comment: reviewComment });
    }
  };

  const handleEditReview = (review) => {
    setEditingReview(review);
    setReviewRating(review.rating);
    setReviewComment(review.comment);
    setShowReviewForm(true);
  };

  const handleDeleteReview = (reviewId) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa đánh giá này?')) {
      deleteReviewMutation.mutate(reviewId);
    }
  };

  // eslint-disable-next-line no-unused-vars
  const toggleRevealReview = (reviewId) => {
    setRevealedReviews(prev => {
      const next = new Set(prev);
      if (next.has(reviewId)) next.delete(reviewId);
      else next.add(reviewId);
      return next;
    });
  };

  // Update page title for SEO
  useEffect(() => {
    if (product) {
      document.title = `${product.tenProduct} | PawVerse - Thế giới thú cưng`;
    }
  }, [product]);

  // Redirect if product is disabled
  useEffect(() => {
    if (product && product.isEnabled === false) {
      toast.error('Sản phẩm này hiện không khả dụng');
      navigate('/', { replace: true });
    }
  }, [product, navigate]);

  // Check if product is in wishlist
  const { data: inWishlist } = useQuery({
    queryKey: ['wishlist-check', id],
    queryFn: () => wishlistService.isInWishlist(id),
    enabled: isAuthenticated,
  });

  // Add to wishlist mutation
  const addToWishlistMutation = useMutation({
    mutationFn: () => wishlistService.addToWishlist(product.idProduct),
    onSuccess: () => {
      queryClient.invalidateQueries(['wishlist']);
      queryClient.invalidateQueries(['wishlist-check', id]);
      toast.success('Đã thêm vào danh sách yêu thích! 💖');
      useWishlistStore.getState().openWishlistDrawer();
    },
    onError: () => {
      toast.error('Không thể thêm vào danh sách yêu thích');
    },
  });

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      toast.error('Vui lòng đăng nhập để thêm vào giỏ hàng');
      navigate('/login');
      return;
    }
    if (isAddingToCart) return;
    setIsAddingToCart(true);
    try {
      await cartService.addToCart(product.idProduct, quantity);
      const cart = await cartService.getCart();
      setCartCount(getCartTotalQuantity(cart));
      queryClient.invalidateQueries(['cart']);
      toast.success(`Đã thêm ${quantity} sản phẩm vào giỏ hàng!`);
      useCartStore.getState().openCartDrawer();
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Không thể thêm vào giỏ hàng');
    } finally {
      setIsAddingToCart(false);
    }
  };

  const handleToggleWishlist = () => {
    if (!isAuthenticated) {
      toast.error('Vui lòng đăng nhập để thêm vào danh sách yêu thích');
      navigate('/login');
      return;
    }
    addToWishlistMutation.mutate();
  };

  const handleBuyNow = async () => {
    if (isAddingToCart) return;
    try {
      await handleAddToCart();
    } catch {
      // handleAddToCart already shows error toast
    }
  };

  // Fetch related products
  const { data: relatedProducts } = useQuery({
    queryKey: ['related-products', product?.idCategory, product?.idProduct],
    queryFn: () => productService.getProductsByCategory(product?.idCategory, { size: 4 }),
    enabled: !!product?.idCategory,
  });

  const [showStickyBar, setShowStickyBar] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollThreshold = 800;
      setShowStickyBar(window.scrollY > scrollThreshold);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (isLoading) {
    return <LoadingSpinner fullScreen />;
  }

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Không tìm thấy sản phẩm</h2>
        <Link to="/products" className="text-primary-600 hover:text-primary-700">
          Quay lại danh sách sản phẩm
        </Link>
      </div>
    );
  }

  // Build images array
  const images = product.imageUrls && product.imageUrls.length > 0
    ? product.imageUrls
    : [product.thumbnailUrl || '/placeholder-product.jpg'];

  const avgRating = product.avgRating || 0;
  const totalReviews = product.totalReviews || 0;

  return (
    <div className="bg-[#f8fafc] min-h-screen pt-32 pb-12 relative">
      <div className="container mx-auto px-4">
        {/* Breadcrumb */}
        <div className="mb-8 flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.2em] text-gray-400">
          <Link to="/" className="hover:text-primary-600 transition-colors">Trang chủ</Link>
          <span className="opacity-30">/</span>
          <Link to="/products" className="hover:text-primary-600 transition-colors">Sản phẩm</Link>
          <span className="opacity-30">/</span>
          <span className="text-gray-900 truncate max-w-[200px]">{product.tenProduct}</span>
        </div>

        {/* Main Product Card */}
        <div className="bg-white/90 backdrop-blur-2xl rounded-[3rem] shadow-2xl shadow-orange-100/50 border border-white p-6 md:p-12 mb-12 relative overflow-hidden group/main-card">
          {/* Decorative Pet Blobs */}
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary-100/40 rounded-full blur-[90px] pointer-events-none group-hover/main-card:bg-primary-200/50 transition-colors duration-1000" />
          <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-orange-50/50 rounded-full blur-[80px] pointer-events-none" />
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 relative z-10 items-start">
            {/* Gallery Section */}
            <div className="space-y-4">
              <div className="relative w-full max-w-[440px] mx-auto rounded-[2rem] overflow-hidden bg-white border border-orange-50 shadow-inner group/gallery">
                <img
                  src={images[selectedImage]}
                  alt={product.tenProduct}
                  className="w-full h-auto object-contain p-2 transition-transform duration-700 group-hover/gallery:scale-105"
                />
                {product.giaGoc && product.giaGoc > product.giaBan && (
                  <div className="absolute top-5 left-5 bg-orange-500 text-white text-[9px] font-black px-3 py-1.5 rounded-xl shadow-lg uppercase tracking-widest z-20 flex items-center gap-1.5">
                    <Gift size={10} />
                    SALE {Math.round((1 - product.giaBan / product.giaGoc) * 100)}%
                  </div>
                )}
              </div>
              
              {images.length > 1 && (
                <div className="flex gap-4 overflow-x-auto no-scrollbar py-2 px-1 justify-center">
                  {images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedImage(idx)}
                      aria-label={`Xem ảnh sản phẩm ${idx + 1}`}
                      className={`relative w-20 h-20 rounded-2xl overflow-hidden shrink-0 transition-[transform,opacity,border-color] duration-500 border-2 ${
                        selectedImage === idx 
                          ? 'border-orange-500 scale-105 shadow-xl shadow-orange-200 z-10' 
                          : 'border-white hover:border-orange-100 opacity-60 hover:opacity-100'
                      }`}
                    >
                      <img src={img} alt="" className="w-full h-full object-cover" width="80" height="80" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Content Section */}
            <div className="flex flex-col h-full justify-center">
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-3">
                  <span className="px-3 py-1 bg-orange-50 text-orange-600 text-[9px] font-black rounded-lg uppercase tracking-widest border border-orange-100 shadow-sm">
                    <span className="flex items-center gap-1"><PawPrint size={10} /> {product.brandName || 'PAWVERSE BRAND'}</span>
                  </span>
                  {product.soLuongTonKho > 0 && (
                    <span className="px-3 py-1 bg-green-50 text-green-600 text-[9px] font-black rounded-lg uppercase tracking-widest border border-green-100">
                      CÒN HÀNG
                    </span>
                  )}
                </div>
                
                <h1 className="text-3xl md:text-4xl font-black text-gray-900 leading-[1.2] mb-4 tracking-tight">
                  {product.tenProduct}
                </h1>
                
                <div className="flex items-center gap-5">
                  <div className="flex items-center gap-1.5 bg-gradient-to-r from-orange-400 to-orange-500 text-white px-4 py-1.5 rounded-xl shadow-md">
                    <Star size={12} className="fill-current" />
                    <span className="text-xs font-black">{avgRating.toFixed(1)}</span>
                  </div>
                  <div className="h-6 w-px bg-gray-100" />
                  <div className="flex flex-col">
                    <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-0.5">YÊU THÍCH BỞI:</span>
                    <span className="text-[10px] font-black text-gray-900 uppercase">
                      {totalReviews} SEN ĐÁNH GIÁ <span className="mx-1.5 text-gray-200">|</span> {product.soLuongDaBan || 0} BẠN ĐÃ MUA
                    </span>
                  </div>
                </div>
              </div>

              {/* Softer Warm Price Section */}
              <div className="mb-6 p-8 bg-orange-50 rounded-[2rem] border border-orange-100 relative overflow-hidden group/price">
                <div className="absolute top-0 right-0 w-24 h-24 bg-orange-200/20 blur-[50px] pointer-events-none" />
                <div className="flex items-end gap-3 mb-3">
                  <p className="text-5xl font-black text-orange-600 tracking-tighter">
                    {formatPrice(product.giaBan)}
                  </p>
                  {product.giaGoc && product.giaGoc > product.giaBan && (
                    <p className="text-lg text-orange-300 line-through mb-1.5 font-bold opacity-80">
                      {formatPrice(product.giaGoc)}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 py-2 px-4 bg-white rounded-xl w-fit shadow-sm border border-orange-50">
                   <BadgeCheck size={14} className="text-green-500" />
                   <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest leading-none">Chính hãng & An toàn cho thú cưng</span>
                </div>
              </div>

              {/* Action Area */}
              {product.soLuongTonKho > 0 && (
                <div className="space-y-6">
                  <div className="flex items-center gap-6">
                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">SỐ LƯỢNG CHO BÉ:</span>
                    <div className="flex items-center bg-white border border-orange-100 rounded-xl p-1 shadow-sm">
                      <button
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        aria-label="Giảm số lượng"
                        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-orange-50 transition-[background-color,transform] text-orange-600 active:scale-90"
                      >
                        <Minus size={14} strokeWidth={3} />
                      </button>
                      <span className="w-10 text-center font-black text-xl text-gray-900">{quantity}</span>
                      <button
                        onClick={() => setQuantity(Math.min(product.soLuongTonKho, quantity + 1))}
                        aria-label="Tăng số lượng"
                        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-orange-50 transition-[background-color,transform] text-orange-600 active:scale-90"
                      >
                        <Plus size={14} strokeWidth={3} />
                      </button>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={handleAddToCart}
                      disabled={product.soLuongTonKho === 0 || isAddingToCart}
                      className="flex-[2] py-4 bg-orange-500 text-white rounded-2xl hover:bg-orange-600 disabled:bg-gray-200 transition-[background-color,transform,opacity] duration-500 font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-orange-100 active:scale-95 group/btn overflow-hidden relative"
                    >
                      <ShoppingCart size={16} className="relative z-10" />
                      <span className="relative z-10">{isAddingToCart ? 'ĐANG THÊM…' : 'THÊM VÀO GIỎ'}</span>
                    </button>
                    <button
                      onClick={handleBuyNow}
                      disabled={product.soLuongTonKho === 0 || isAddingToCart}
                      className="flex-1 py-4 bg-gray-900 text-white rounded-2xl hover:bg-black disabled:bg-gray-400 transition-[background-color,transform,opacity] duration-500 font-black text-[11px] uppercase tracking-widest shadow-lg active:scale-95"
                    >
                      MUA NGAY
                    </button>
                    <button 
                      onClick={handleToggleWishlist}
                      disabled={addToWishlistMutation.isPending}
                      aria-label={inWishlist ? 'Xóa khỏi yêu thích' : 'Thêm vào yêu thích'}
                      className={`w-12 h-12 flex items-center justify-center border rounded-2xl transition-[background-color,border-color,color,transform] duration-500 active:scale-90 ${
                        inWishlist 
                          ? 'bg-red-50 border-red-100 text-red-500 shadow-md' 
                          : 'bg-white border-orange-100 text-orange-300 hover:border-red-500 hover:text-red-500'
                      }`}
                    >
                      <Heart size={20} className={inWishlist ? 'fill-current' : ''} />
                    </button>
                  </div>
                </div>
              )}

              {/* Pet Trust Section */}
              <div className="grid grid-cols-3 gap-4 mt-8 pt-6 border-t border-orange-50">
                <TrustItem icon={<Truck size={18} />} label="GIAO HÀNG" sub="Trong 2h" />
                <TrustItem icon={<BadgeCheck size={18} />} label="UY TÍN" sub="Chính hãng" />
                <TrustItem icon={<Heart size={18} />} label="AN TOÀN" sub="Kiểm định" />
              </div>
            </div>
          </div>
        </div>

        {/* Full Description & Specs - Streamlined for data integrity */}
        <div className="bg-white/90 backdrop-blur-2xl rounded-[3rem] shadow-2xl shadow-orange-100/50 border border-white p-10 md:p-14 mb-16 relative overflow-hidden group/desc">
          <div className="flex items-center gap-4 mb-12 pb-6 border-b border-orange-50 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-orange-100/20 blur-[60px] pointer-events-none" />
            <div className="w-10 h-10 bg-orange-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-orange-100">
               <PawPrint size={18} />
            </div>
            <h2 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tighter uppercase leading-none">MÔ TẢ SẢN PHẨM</h2>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 lg:gap-20">
            <div className="lg:col-span-2 space-y-12">
              <div className="prose prose-lg max-w-none text-gray-600 leading-relaxed font-medium">
                <div className="relative mb-12">
                  <span className="absolute -left-6 top-0 w-1.5 h-full bg-orange-100 rounded-full" />
                  <p className="text-xl leading-[1.8] first-letter:text-6xl first-letter:font-black first-letter:text-orange-500 first-letter:mr-4 first-letter:float-left first-letter:mt-2">
                    {product.moTa}
                  </p>
                </div>

                {/* Filling the space with Brand Values */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-orange-50/50">
                   <div className="flex items-start gap-4 p-5 rounded-2xl bg-orange-50/40 border border-white hover:border-orange-100 transition-all group/val">
                      <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center text-orange-500 shadow-sm group-hover/val:scale-110 transition-transform">
                         <ShieldCheck size={24} />
                      </div>
                      <div>
                         <h5 className="font-black text-gray-900 text-xs uppercase tracking-widest mb-1.5">An toàn tuyệt đối</h5>
                         <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight leading-relaxed line-clamp-2">Kiểm chứng nghiêm ngặt bởi đội ngũ bác sĩ thú y PawVerse</p>
                      </div>
                   </div>
                   <div className="flex items-start gap-4 p-5 rounded-2xl bg-orange-50/40 border border-white hover:border-orange-100 transition-all group/val">
                      <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center text-orange-500 shadow-sm group-hover/val:scale-110 transition-transform">
                         <Leaf size={24} />
                      </div>
                      <div>
                         <h5 className="font-black text-gray-900 text-xs uppercase tracking-widest mb-1.5">Tự nhiên 100%</h5>
                         <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight leading-relaxed line-clamp-2">Nguồn gốc rõ ràng, không chất bảo quản gây hại cho bé</p>
                      </div>
                   </div>
                </div>
              </div>
            </div>
            
            <div className="relative group/specs">
              <div className="absolute inset-0 bg-orange-50/30 rounded-[2.5rem] blur-2xl group-hover/specs:bg-orange-100/30 transition-colors" />
              <div className="relative space-y-8 bg-white/40 backdrop-blur-sm p-8 rounded-[2.5rem] border border-orange-50 h-fit shadow-xl shadow-orange-100/20">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 bg-orange-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-orange-100">
                    <PawPrint size={14} />
                  </div>
                  <h4 className="text-[10px] font-black text-gray-900 uppercase tracking-widest">Thông số sản phẩm</h4>
                </div>
                
                <div className="space-y-5">
                  <SpecRow label="Mã sản phẩm" value={`#PV-${product.idProduct}`} />
                  <SpecRow label="Thương hiệu" value={product.brandName || 'PawVerse'} />
                  <SpecRow label="Danh mục" value={product.categoryName} />
                  <SpecRow label="Tình trạng" 
                    value={product.soLuongTonKho > 0 ? "Còn hàng cho bé" : "Đã hết hàng"} 
                    success={product.soLuongTonKho > 0} 
                  />
                </div>

                <div className="pt-6 border-t border-orange-100/50 mt-4 px-2">
                   <div className="flex items-center gap-2 text-[8px] font-black text-orange-300 uppercase tracking-widest leading-tight">
                      <BadgeCheck size={10} /> Cam kết chất lượng PawVerse
                   </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Related Products - UI/UX PRO MAX Addition */}
        {relatedProducts?.content?.length > 0 && (
          <div className="mb-24">
            <div className="flex items-end justify-between mb-12">
              <div>
                <span className="text-[11px] font-black text-primary-600 uppercase tracking-[0.3em] mb-3 block">Có thể bạn quan tâm</span>
                <h2 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tighter">SẢN PHẨM KHÁC</h2>
              </div>
              <Link to="/products" className="px-8 py-4 bg-white text-gray-900 rounded-2xl font-black text-[10px] uppercase tracking-widest border-2 border-gray-100 hover:border-gray-900 transition-all">
                 XEM TẤT CẢ
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {relatedProducts.content.filter(p => p.idProduct !== product.idProduct).slice(0, 4).map(item => (
                <Link key={item.idProduct} to={`/products/${item.idProduct}`} className="group/item">
                  <div className="bg-white rounded-[2rem] p-4 shadow-xl shadow-gray-100/50 border border-gray-50 hover:shadow-2xl hover:-translate-y-3 transition-all duration-500">
                    <div className="aspect-square rounded-[1.5rem] overflow-hidden mb-6 bg-gray-50">
                      <img src={item.thumbnailUrl} alt={item.tenProduct} className="w-full h-full object-cover group-hover/item:scale-110 transition-transform duration-700" />
                    </div>
                    <h3 className="font-black text-gray-900 mb-2 line-clamp-1 group-hover/item:text-primary-600 transition-colors uppercase text-sm tracking-tight">{item.tenProduct}</h3>
                    <div className="flex items-center justify-between">
                      <p className="font-black text-primary-600 text-lg tracking-tighter">{formatPrice(item.giaBan)}</p>
                      <div className="flex items-center gap-1 text-[10px] font-black text-gray-300">
                        <Star size={10} className="fill-yellow-400 text-yellow-400" />
                        <span>{item.avgRating?.toFixed(1) || '5.0'}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Reviews Section - Compact & Pro Max Pet Vibe */}
        <div className="bg-white/95 backdrop-blur-2xl rounded-[2.5rem] shadow-2xl shadow-orange-100/30 border border-white p-8 md:p-12 mb-16 relative overflow-hidden group/reviews">
          <div className="absolute top-0 right-0 w-64 h-64 bg-orange-100/20 blur-[100px] pointer-events-none" />
          
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-12 relative z-10">
            <div>
              <div className="flex items-center gap-2 mb-2">
                 <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center text-white shadow-xl shadow-orange-100">
                    <MessageSquare size={14} />
                 </div>
                 <h2 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tighter uppercase">SEN NÓI GÌ?</h2>
              </div>
              <p className="text-gray-400 font-bold text-[9px] uppercase tracking-widest pl-10">Phản hồi của bạn giúp PawVerse hoàn thiện hơn mỗi ngày</p>
            </div>
            {isAuthenticated && canReview && !showReviewForm && (
              <button
                onClick={() => { resetReviewForm(); setShowReviewForm(true); }}
                className="px-8 py-4 bg-gray-900 text-white rounded-2xl hover:bg-orange-600 transition-all duration-500 font-black text-[10px] uppercase tracking-widest shadow-xl active:scale-95 flex items-center gap-2 group/btn"
              >
                <Edit3 size={16} className="group-hover/btn:rotate-12 transition-transform" /> 
                GỬI PHẢN HỒI
              </button>
            )}
          </div>
          
          <div className="flex flex-col lg:flex-row items-stretch gap-10 mb-12 pb-12 border-b border-orange-50 relative z-10">
            <div className="flex flex-col items-center justify-center text-center p-8 bg-orange-50/50 rounded-[2.5rem] min-w-[220px] border border-orange-100 relative overflow-hidden group/stats">
              <div className="absolute inset-0 bg-orange-500 opacity-0 group-hover/stats:opacity-5 transition-opacity" />
              <div className="relative mb-1">
                 <div className="absolute -top-4 -right-4 text-orange-200 opacity-50">
                    <PawPrint size={32} />
                 </div>
                 <p className="text-6xl font-black text-orange-600 tracking-tighter relative z-10">
                   {reviewStats?.avgRating?.toFixed?.(1) || avgRating.toFixed(1)}
                 </p>
              </div>
              <div className="flex items-center gap-1 mb-3">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={16}
                    className={i < Math.floor(reviewStats?.avgRating || avgRating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'} />
                ))}
              </div>
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{reviewStats?.totalReviews || totalReviews} ĐÁNH GIÁ</p>
            </div>

            <div className="flex-1 space-y-3 py-1">
              {[5, 4, 3, 2, 1].map((star) => {
                const count = reviewStats?.distribution?.[star] || 0;
                const total = reviewStats?.totalReviews || 1;
                const pct = total > 0 ? (count / total) * 100 : 0;
                return (
                  <button key={star}
                    onClick={() => { setRatingFilter(ratingFilter === star ? null : star); setReviewPage(0); }}
                    aria-label={`Lọc đánh giá ${star} sao`}
                    className={`flex items-center gap-5 w-full group py-1 transition-all ${ratingFilter === star ? 'translate-x-2' : ''}`}
                  >
                    <div className="flex items-center gap-1.5 min-w-[60px]">
                      <span className="text-xs font-black text-gray-900">{star}</span>
                      <Star size={12} className="fill-orange-400 text-orange-400" />
                    </div>
                    <div className="flex-1 bg-gray-50 rounded-full h-2.5 overflow-hidden border border-gray-100">
                      <div className="bg-orange-400 h-full rounded-full transition-all duration-1000 shadow-sm" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-[9px] font-black text-gray-400 w-10 text-right">{Math.round(pct)}%</span>
                  </button>
                );
              })}
            </div>
          </div>

          {showReviewForm && (
            <div className="mb-12 p-8 bg-orange-50/50 rounded-[2.5rem] border-2 border-orange-100 relative animate-in zoom-in-95 duration-500 overflow-hidden">
               <div className="absolute -bottom-8 -right-8 text-orange-200 opacity-20 rotate-12">
                  <PawPrint size={150} />
               </div>
               <div className="relative z-10 font-sans">
                 <h3 className="text-lg font-black text-gray-900 mb-6 uppercase tracking-tighter flex items-center gap-2">
                    <Edit3 size={16} /> {editingReview ? 'CẬP NHẬT PHẢN HỒI' : 'VIẾT PHẢN HỒI MỚI'}
                 </h3>
                 <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                    <div className="bg-white p-5 rounded-2xl border border-orange-100 shadow-sm">
                       <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-3">ĐÁNH GIÁ:</p>
                        <div className="flex items-center gap-2">
                           {[1, 2, 3, 4, 5].map((star) => (
                             <button 
                               key={star} 
                               onMouseEnter={() => setHoverRating(star)} 
                               onMouseLeave={() => setHoverRating(0)} 
                               onClick={() => setReviewRating(star)} 
                               aria-label={`Đánh giá ${star} sao`}
                               className="transition-all hover:scale-110"
                             >
                               <Star size={24} className={star <= (hoverRating || reviewRating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-100'} />
                             </button>
                           ))}
                        </div>
                    </div>
                     <div className="md:col-span-3 bg-white p-5 rounded-2xl border border-orange-100 shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                          <label htmlFor="review-desc" className="text-[9px] font-black text-gray-400 uppercase tracking-widest cursor-pointer">NHẬN XÉT CHI TIẾT:</label>
                          <button
                            type="button"
                            onClick={() => setShowEmojiPicker(prev => !prev)}
                            className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
                              showEmojiPicker ? 'bg-amber-100 text-amber-600' : 'bg-gray-50 text-gray-400 hover:text-amber-500 hover:bg-amber-50'
                            }`}
                            title="Chọn emoji"
                          >
                            <Smile size={14} />
                          </button>
                        </div>

                        {showEmojiPicker && (
                          <div className="mb-3 p-3 bg-white rounded-xl border border-gray-100 shadow-md max-h-36 overflow-y-auto">
                            <div className="grid grid-cols-10 gap-1">
                              {EMOJI_LIST.map((emoji, i) => (
                                <button
                                  key={i}
                                  type="button"
                                  onClick={() => insertReviewEmoji(emoji)}
                                  className="w-7 h-7 flex items-center justify-center text-base rounded-lg hover:bg-amber-50 hover:scale-125 transition-all active:scale-90"
                                >
                                  {emoji}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        <textarea
                         id="review-desc"
                         ref={reviewTextareaRef}
                         value={reviewComment}
                         onChange={(e) => setReviewComment(e.target.value)}
                         placeholder="Hãy chia sẻ trải nghiệm của bạn và bé với sản phẩm này nhé…"
                         rows={3}
                         className="w-full bg-gray-50 border-none rounded-xl px-4 py-3 focus:bg-white outline-none transition-all text-sm text-gray-600"
                        />
                     </div>
                 </div>
                 <div className="flex justify-end gap-4">
                    <button onClick={resetReviewForm} className="px-6 py-3 text-[10px] font-black uppercase text-gray-400 hover:text-red-500 transition-colors">HỦY BỎ</button>
                    <button 
                      onClick={handleSubmitReview} 
                      disabled={createReviewMutation.isPending || updateReviewMutation.isPending}
                      className="px-10 py-3 bg-gray-900 text-white rounded-xl font-black text-[10px] uppercase shadow-lg shadow-gray-200 hover:bg-black disabled:bg-gray-400 transition-all min-w-[140px]"
                    >
                      {createReviewMutation.isPending || updateReviewMutation.isPending ? 'ĐANG GỬI…' : 'GỬI NGAY'}
                    </button>
                 </div>
               </div>
            </div>
          )}

          <div className="space-y-8 relative z-10">
            {reviews.length > 0 ? (
              reviews.map((review) => {
                const isOwner = user?.idUser === review.userId;
                return (
                  <div key={review.reviewId} className="group/review pb-8 border-b border-orange-50 last:border-0 animate-in fade-in slide-in-from-bottom-2 duration-500">
                    <div className="flex gap-5">
                      <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center font-black text-lg text-white shadow-lg shrink-0 group-hover/review:rotate-6 transition-transform">
                        {(review.userFullName || 'U').charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <h4 className="font-black text-sm text-gray-900 uppercase tracking-tight truncate max-w-[150px]">{review.userFullName || review.userName}</h4>
                            <div className="h-4 w-px bg-gray-200" />
                            <div className="flex items-center gap-0.5">
                              {[...Array(5)].map((_, i) => (
                                <Star key={i} size={10} className={i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-100'} />
                              ))}
                            </div>
                          </div>
                          {isOwner && (
                            <div className="flex items-center gap-2 opacity-0 group-hover/review:opacity-100 transition-all">
                              <button onClick={() => handleEditReview(review)} aria-label="Chỉnh sửa đánh giá" className="text-gray-300 hover:text-orange-600 transition-colors"><Edit3 size={14} /></button>
                              <button onClick={() => handleDeleteReview(review.reviewId)} aria-label="Xóa đánh giá" className="text-gray-300 hover:text-red-500 transition-colors"><Trash2 size={14} /></button>
                            </div>
                          )}
                        </div>
                        <p className="text-gray-600 text-sm leading-relaxed mb-4 bg-gray-50/50 p-4 rounded-2xl border border-transparent group-hover/review:border-orange-50 group-hover/review:bg-white transition-all">
                           {review.comment}
                        </p>

                        {review.mediaUrls && review.mediaUrls.length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-4">
                            {review.mediaUrls.map((url, mIdx) => {
                              const isVideo = url.match(/\.(mp4|webm)$/i);
                              return isVideo ? (
                                <video key={mIdx} src={`http://localhost:8081${url}`} controls className="w-32 h-32 rounded-xl object-cover border border-gray-100 bg-black" />
                              ) : (
                                <a key={mIdx} href={`http://localhost:8081${url}`} target="_blank" rel="noopener noreferrer">
                                  <img src={`http://localhost:8081${url}`} alt="" className="w-20 h-20 rounded-xl object-cover border border-gray-100 hover:border-orange-200 transition-colors cursor-pointer" />
                                </a>
                              );
                            })}
                          </div>
                        )}

                        <span className="text-[9px] font-bold text-gray-300 uppercase tracking-widest">{formatDate(review.createdAt)}</span>
                        
                        {review.staffReply && (
                          <div className="mt-4 p-5 bg-gray-900 rounded-2xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/10 blur-[30px]" />
                            <span className="text-[8px] font-black text-orange-400 uppercase tracking-widest block mb-2 flex items-center gap-1.5">
                               <MessageSquare size={10} /> PHẢN HỒI TỪ PAWVERSE
                            </span>
                            <p className="text-gray-400 text-xs leading-relaxed italic">{review.staffReply}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-16 bg-orange-50/30 border-2 border-dashed border-orange-100 rounded-[3rem]">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-md">
                   <Star size={24} className="text-orange-200" />
                </div>
                <p className="text-gray-500 font-bold uppercase tracking-widest text-xs mb-1">Chưa có phản hồi nào</p>
                <p className="text-gray-400 text-[10px]">Hãy là người đầu tiên bóc tem và đánh giá siêu phẩm này nhé!</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* PRO MAX: Sticky Buy Bar */}
      <div className={`fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-2xl border-t border-orange-100 shadow-[0_-15px_60px_rgba(234,88,12,0.1)] transform transition-all duration-700 px-6 py-4 ${showStickyBar ? 'translate-y-0' : 'translate-y-full'}`}>
        <div className="container mx-auto flex items-center justify-between gap-8">
          <div className="hidden md:flex items-center gap-5 flex-1">
            <div className="w-14 h-14 rounded-2xl overflow-hidden shadow-md border border-orange-50 shrink-0 bg-white">
               <img src={images[0]} alt="" className="w-full h-full object-contain p-2" />
            </div>
            <div className="flex-1 overflow-hidden">
               <h4 className="font-black text-gray-900 text-base line-clamp-1 uppercase tracking-tighter">{product.tenProduct}</h4>
               <div className="flex items-center gap-4">
                   <p className="font-black text-orange-600">{formatPrice(product.giaBan)}</p>
                   <div className="h-3 w-px bg-gray-200" />
                   <div className="flex items-center gap-1">
                      <Star size={12} className="fill-yellow-400 text-yellow-400" />
                      <span className="text-xs font-black text-gray-400">{avgRating.toFixed(1)}</span>
                   </div>
               </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4 w-full md:w-auto">
             <div className="hidden sm:flex items-center bg-orange-50 rounded-xl p-0.5 border border-orange-100/50">
                <button onClick={() => setQuantity(Math.max(1, quantity - 1))} aria-label="Giảm số lượng" className="w-9 h-9 flex items-center justify-center hover:bg-white text-orange-600 rounded-lg transition-all active:scale-90"><Minus size={14} /></button>
                <span className="w-10 text-center font-black text-lg text-gray-900">{quantity}</span>
                <button onClick={() => setQuantity(Math.min(product.soLuongTonKho, quantity + 1))} aria-label="Tăng số lượng" className="w-9 h-9 flex items-center justify-center hover:bg-white text-orange-600 rounded-lg transition-all active:scale-90"><Plus size={14} /></button>
             </div>
             <button 
               onClick={handleAddToCart}
               disabled={product.soLuongTonKho === 0 || isAddingToCart}
               className="flex-1 md:flex-none px-8 py-3.5 bg-orange-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all shadow-lg active:scale-95 shadow-orange-200 flex items-center gap-2"
             >
               <ShoppingCart size={14} /> {isAddingToCart ? 'ĐANG THÊM…' : 'THÊM VÀO GIỎ'}
             </button>
             <button 
               onClick={handleBuyNow}
               disabled={product.soLuongTonKho === 0 || isAddingToCart}
               className="flex-1 md:flex-none px-8 py-3.5 bg-gray-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-black disabled:bg-gray-400 disabled:cursor-not-allowed transition-all shadow-lg active:scale-95"
             >
               {isAddingToCart ? 'ĐANG THÊM…' : 'MUA NGAY'}
             </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Sophisticated Helper Components
function TrustItem({ icon, label, sub }) {
  return (
    <div className="flex flex-col items-center text-center group cursor-default">
      <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-orange-500 mb-3 shadow-lg shadow-orange-100 group-hover:bg-orange-500 group-hover:text-white transition-all duration-500 transform group-hover:-translate-y-1.5 border border-orange-50">
        {icon}
      </div>
      <p className="text-[10px] font-black text-gray-900 uppercase tracking-widest mb-1">{label}</p>
      <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity duration-500">{sub}</p>
    </div>
  );
}

function SpecRow({ label, value, success }) {
  return (
    <div className="flex items-center justify-between py-4 border-b border-gray-100 last:border-0 group/spec">
      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest group-hover/spec:text-gray-900 transition-colors">{label}</span>
      <span className={`text-sm font-bold ${success ? 'text-green-600' : 'text-gray-900'}`}>{value}</span>
    </div>
  );
}

