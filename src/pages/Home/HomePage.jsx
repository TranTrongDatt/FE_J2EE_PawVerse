import { useState, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ShoppingCart, Star, ArrowRight, Truck, Shield, RotateCcw, Headphones, PawPrint, Quote, MoveLeft, MoveRight, Heart, Bone, Zap, Dog, Cat } from 'lucide-react';
import { productService } from '../../api/productService';
import { formatPrice } from '../../utils/formatters';
import { cartService } from '../../api/cartService';
import useCartStore, { getCartTotalQuantity } from '../../store/useCartStore';
import useAuthStore from '../../store/useAuthStore';
import toast from 'react-hot-toast';

import hero from '../../assets/hero.png';
import newsletterDog from '../../../Images/service/dog2.png';
import blog1 from '../../../Images/news/img-1.png';
import blog2 from '../../../Images/news/img-2.png';
import blog3 from '../../../Images/news/img-3.png';
import avatar1 from '../../../Images/customer/ImgJackTo.png';
import avatar2 from '../../../Images/customer/ImgJackNho.png';

// Import category images
import ThucAnHat from '../../../Images/categories/ThucAnHat.png';
import Pate from '../../../Images/categories/Pate.png';
import PhuKien from '../../../Images/categories/PhuKien.png';
import DoChoi from '../../../Images/categories/DoChoi.png';
import VeSinh from '../../../Images/categories/VeSinh.png';
import DungCu from '../../../Images/categories/DungCu.png';
import BanhThuong from '../../../Images/categories/BanhThuong.png';
import ThucPhamChucNang from '../../../Images/categories/ThucPhamChucNang.png';

const CATEGORY_STYLES = {
  'Thức ăn hạt': { img: ThucAnHat, bg: 'bg-emerald-50/60' },
  'Pate': { img: Pate, bg: 'bg-emerald-50/80' },
  'Phụ kiện': { img: PhuKien, bg: 'bg-rose-50/70' },
  'Đồ chơi': { img: DoChoi, bg: 'bg-amber-50/70' },
  'Vệ sinh': { img: VeSinh, bg: 'bg-cyan-50/70' },
  'Dụng cụ': { img: DungCu, bg: 'bg-indigo-50/70' },
  'Bánh thưởng': { img: BanhThuong, bg: 'bg-orange-50/70' },
  'Thực phẩm chức năng': { img: ThucPhamChucNang, bg: 'bg-teal-50/70' },
  'DEFAULT': { img: ThucAnHat, bg: 'bg-slate-100/50' }
};

export default function HomePage() {
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuthStore();
  const [addingIds, setAddingIds] = useState(new Set());
  const [activeTab, setActiveTab] = useState('best'); // 'best' or 'latest'
  const categoryScrollRef = useMemo(() => ({ current: null }), []);
  const [activeCategoryIndex, setActiveCategoryIndex] = useState(0);
  const dragRef = useMemo(() => ({ 
    isDown: false, 
    startX: 0, 
    scrollLeft: 0, 
    velocity: 0, 
    lastX: 0, 
    rafId: null,
    moved: false 
  }), []);

  const { data: featuredProducts } = useQuery({
    queryKey: ['featuredProducts'],
    queryFn: () => productService.getFeaturedProducts(8),
  });

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: productService.getCategories,
  });

  const { data: latestProducts } = useQuery({
    queryKey: ['latestProducts'],
    queryFn: () => productService.getProducts({ page: 0, size: 8, sortBy: 'ngayTao', sortDirection: 'DESC' }),
  });

  const { data: bestSellingProducts } = useQuery({
    queryKey: ['bestSellingProducts'],
    queryFn: () => productService.getProducts({ page: 0, size: 8, sortBy: 'giaBan', sortDirection: 'DESC' }), // Use price as proxy for now
  });

  const cats = categories || [];

  // Triple categories for infinite loop effect
  const loopedCategories = useMemo(() => {
    if (!categories) return [];
    return [...categories, ...categories, ...categories];
  }, [categories]);

  // Handle automatic loop reset
  const handleCategoryScroll = (e) => {
    const el = e.target;
    const singleSectionWidth = el.scrollWidth / 3;
    
    // Calculate active index based on scroll position
    if (cats.length > 0) {
      const itemWidth = el.scrollWidth / (cats.length * 3);
      // We take the middle section for stable indexing
      const normalizedScroll = el.scrollLeft % singleSectionWidth;
      const currentIdx = Math.round(normalizedScroll / itemWidth) % cats.length;
      setActiveCategoryIndex(currentIdx);
    }
    
    if (el.scrollLeft >= singleSectionWidth * 2) {
      el.scrollLeft -= singleSectionWidth;
    } else if (el.scrollLeft <= 0) {
      el.scrollLeft += singleSectionWidth;
    }
  };

  const scrollToCategory = (index) => {
    if (categoryScrollRef.current && cats.length > 0) {
      const el = categoryScrollRef.current;
      const itemWidth = el.scrollWidth / (cats.length * 3);
      const singleSectionWidth = el.scrollWidth / 3;
      // Scroll to the item in the middle section
      const targetScroll = singleSectionWidth + (index * itemWidth);
      
      el.style.scrollBehavior = 'smooth';
      el.scrollLeft = targetScroll;
    }
  };

  const scrollCategories = (direction) => {
    if (categoryScrollRef.current) {
      const scrollAmount = 300;
      categoryScrollRef.current.style.scrollBehavior = 'smooth';
      categoryScrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  const applyMomentum = () => {
    if (!categoryScrollRef.current || Math.abs(dragRef.velocity) < 0.2) {
      if (categoryScrollRef.current) {
        categoryScrollRef.current.style.scrollSnapType = 'x mandatory';
      }
      return;
    }

    categoryScrollRef.current.scrollLeft -= dragRef.velocity;
    dragRef.velocity *= 0.95; // Friction

    dragRef.rafId = requestAnimationFrame(applyMomentum);
  };

  const onMouseDown = (e) => {
    dragRef.isDown = true;
    dragRef.moved = false;
    dragRef.startX = e.pageX - categoryScrollRef.current.offsetLeft;
    dragRef.scrollLeft = categoryScrollRef.current.scrollLeft;
    dragRef.lastX = e.pageX;
    dragRef.velocity = 0;
    
    cancelAnimationFrame(dragRef.rafId);
    
    categoryScrollRef.current.style.cursor = 'grabbing';
    categoryScrollRef.current.style.scrollBehavior = 'auto';
    categoryScrollRef.current.style.scrollSnapType = 'none';
  };

  const onMouseLeave = () => {
    if (!dragRef.isDown) return;
    dragRef.isDown = false;
    categoryScrollRef.current.style.cursor = 'grab';
    applyMomentum();
  };

  const onMouseUp = () => {
    if (!dragRef.isDown) return;
    dragRef.isDown = false;
    categoryScrollRef.current.style.cursor = 'grab';
    
    // If we didn't move much, it's just a click, otherwise prevent click-through
    if (dragRef.moved) {
      const preventClick = (event) => {
        event.preventDefault();
        event.stopImmediatePropagation();
      };
      categoryScrollRef.current.addEventListener('click', preventClick, { capture: true, once: true });
    }
    
    applyMomentum();
  };

  const onMouseMove = (e) => {
    if (!dragRef.isDown) return;
    e.preventDefault();
    
    const x = e.pageX - categoryScrollRef.current.offsetLeft;
    const walk = (x - dragRef.startX) * 1.5;
    
    // Tracking velocity based on last few frames
    const currentVelocity = (e.pageX - dragRef.lastX);
    dragRef.velocity = currentVelocity; 
    dragRef.lastX = e.pageX;
    
    if (Math.abs(walk) > 5) dragRef.moved = true;
    
    categoryScrollRef.current.scrollLeft = dragRef.scrollLeft - walk;
  };


  const handleAddToCart = useCallback(async (productId) => {
    if (!isAuthenticated) {
      toast.error('Vui lòng đăng nhập để thêm vào giỏ hàng');
      return;
    }
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
  }, [addingIds, isAuthenticated, queryClient]);

  const products = featuredProducts || [];
  const _latest = latestProducts?.content || [];

  return (
    <div className="bg-white min-h-screen">
      {/* Hero Section */}
      <section className="relative pt-24 pb-32 lg:pt-32 lg:pb-48 overflow-hidden bg-white">

        {/* Background Decorative Layer (Positive Z-stack) */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
          {/* Animated Blur Blobs */}
          <div className="absolute top-[-10%] right-[-10%] w-[50vw] h-[50vw] bg-primary-200/50 rounded-full blur-[120px] mix-blend-multiply opacity-60 animate-pulse"></div>
          <div className="absolute bottom-[-10%] left-[-10%] w-[40vw] h-[40vw] bg-blue-100/40 rounded-full blur-[100px] mix-blend-multiply opacity-50"></div>
          <div className="absolute top-[20%] left-[20%] w-[30vw] h-[30vw] bg-orange-100/30 rounded-full blur-[120px] mix-blend-multiply opacity-40"></div>

          {/* Denser Floating Icons - Mixed Themes (Bigger Sizes) */}
          {/* Left Side */}
          <div className="absolute top-[12%] left-[5%] opacity-30 animate-bounce-slow hidden md:block">
            <Heart size={56} className="text-primary-500 fill-primary-100 rotate-12" />
          </div>
          <div className="absolute top-[35%] left-[12%] opacity-25 animate-bounce-slow hidden md:block" style={{ animationDelay: '0.8s' }}>
            <Dog size={72} className="text-primary-600/35 rotate-12" />
          </div>
          <div className="absolute top-[60%] left-[3%] opacity-20 animate-bounce-slow hidden md:block" style={{ animationDelay: '1.5s' }}>
            <Bone size={76} className="text-gray-400/40 -rotate-45" />
          </div>
          <div className="absolute top-[82%] left-[10%] opacity-25 animate-bounce-slow hidden md:block" style={{ animationDelay: '2.2s' }}>
            <Cat size={64} className="text-orange-400/50 rotate-12" />
          </div>
          <div className="absolute top-[25%] left-[25%] opacity-15 animate-bounce-slow hidden md:block" style={{ animationDelay: '3s' }}>
            <PawPrint size={48} className="text-primary-600/30 rotate-45" />
          </div>

          {/* Right Side */}
          <div className="absolute top-[10%] right-[8%] opacity-30 animate-bounce-slow hidden md:block" style={{ animationDelay: '0.5s' }}>
            <Zap size={64} className="text-yellow-400 fill-yellow-100 -rotate-12" />
          </div>
          <div className="absolute top-[38%] right-[4%] opacity-20 animate-bounce-slow hidden md:block" style={{ animationDelay: '1.2s' }}>
            <Cat size={86} className="text-blue-400/30 -rotate-12" />
          </div>
          <div className="absolute top-[65%] right-[15%] opacity-25 animate-bounce-slow hidden md:block" style={{ animationDelay: '2s' }}>
            <Dog size={80} className="text-primary-500/25 rotate-12" />
          </div>
          <div className="absolute bottom-[15%] right-[6%] opacity-30 animate-bounce-slow hidden md:block" style={{ animationDelay: '2.8s' }}>
            <Heart size={68} className="text-red-400 fill-red-100 rotate-45" />
          </div>
          <div className="absolute top-[5%] right-[25%] opacity-15 animate-bounce-slow hidden md:block" style={{ animationDelay: '3.5s' }}>
            <Bone size={56} className="text-gray-300 rotate-90" />
          </div>
          <div className="absolute bottom-[40%] right-[25%] opacity-10 animate-bounce-slow hidden md:block" style={{ animationDelay: '4s' }}>
            <PawPrint size={96} className="text-gray-200 -rotate-12" />
          </div>
        </div>

        <div className="container mx-auto px-6 lg:px-10 relative z-10">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-20">
            <div className="lg:w-1/2 text-center lg:text-left">
              <div className="inline-flex px-10 py-4 bg-gradient-to-r from-primary-500/15 to-transparent text-primary-600 rounded-full text-sm md:text-base font-black uppercase tracking-[0.4em] mb-12 shadow-md border border-primary-100/50 backdrop-blur-sm animate-in fade-in slide-in-from-left duration-1000">
                Chào mừng tới PawVerse 🐾
              </div>
              <h1 className="mb-10 tracking-tight max-w-4xl mx-auto lg:mx-0 leading-[0.95]">
                <span className="block text-4xl md:text-6xl lg:text-7xl font-black text-gray-900 mb-2 animate-text-pulse">
                  A pet store
                </span>
                <span className="block text-4xl md:text-6xl lg:text-7xl font-black text-gray-500/80 mb-4 animate-text-pulse">
                  with everything
                </span>
                <span className="block text-5xl md:text-8xl lg:text-9xl font-black text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-orange-500 relative inline-block animate-primary-pulse drop-shadow-2xl py-2">
                  YOU NEED
                  <svg className="absolute -bottom-6 left-0 w-full" viewBox="0 0 358 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M3 9C118.957 4.47226 235.163 3.52085 355 3" stroke="#F4A261" strokeWidth="6" strokeLinecap="round" />
                  </svg>
                </span>
              </h1>
              <p className="text-lg md:text-2xl text-gray-500 mb-12 max-w-xl mx-auto lg:mx-0 leading-relaxed font-semibold">
                Nâng niu từng bước chân, nâng niu từng nhịp thở của thú yêu trong ngôi nhà của chúng ta. 🐾
              </p>
              <div className="flex flex-row items-center justify-center lg:justify-start gap-3 sm:gap-6">
                <Link
                  to="/products"
                  className="group px-6 py-4 md:px-12 md:py-6 bg-gray-900 text-white rounded-full font-black text-sm md:text-lg hover:bg-primary-600 transition-all duration-300 shadow-2xl shadow-gray-300 hover:scale-110 active:scale-95 cursor-pointer flex items-center gap-2 md:gap-3"
                >
                  MUA NGAY
                  <ShoppingCart size={18} className="md:w-5 md:h-5 group-hover:rotate-12 transition-transform" />
                </Link>
                <Link
                  to="/services"
                  className="px-6 py-4 md:px-12 md:py-6 bg-white text-gray-900 border-2 border-gray-100 rounded-full font-black text-sm md:text-lg hover:border-primary-600 hover:text-primary-600 transition-all duration-300 hover:shadow-2xl hover:scale-110 active:scale-95 cursor-pointer"
                >
                  DỊCH VỤ
                </Link>
              </div>
            </div>

            <div className="lg:w-1/2 relative mt-12 lg:mt-0 flex justify-center">
              {/* Hero Image Glow & Decoration */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-gradient-to-br from-primary-300/20 to-orange-200/20 rounded-full blur-[80px] z-0 animate-pulse"></div>

              <div className="relative animate-bounce-slow z-10">
                <img
                  src={hero}
                  alt="Pet Dog"
                  className="w-full h-auto max-w-[500px] lg:max-w-none lg:w-[120%] relative drop-shadow-[0_45px_65px_rgba(0,0,0,0.15)] object-contain"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      {cats.length > 0 && (
        <section className="w-full py-20 lg:py-32 bg-[#fafafa] mb-20 lg:mb-24 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary-100/30 rounded-full blur-[100px] -z-10 translate-x-1/2 -translate-y-1/2"></div>
          <div className="container mx-auto px-6">
            <div className="text-center mb-16 md:mb-20">
              <span className="text-primary-600 font-black tracking-[0.4em] text-sm md:text-base lg:text-lg uppercase mb-4 block">Khám phá</span>
              <h2 className="text-3xl md:text-5xl font-black text-gray-900">DANH MỤC SẢN PHẨM</h2>
              <div className="w-16 md:w-24 h-2 bg-primary-600 mx-auto mt-6 rounded-full"></div>
            </div>

            {/* Carousel Container with Absolute Controls */}
            <div className="relative group/carousel mt-10">
              {/* Side Floating Buttons - Left */}
              <div className="absolute -left-4 lg:-left-12 top-1/2 -translate-y-1/2 z-30 opacity-0 group-hover/carousel:opacity-100 transition-all duration-500 hover:scale-110">
                <button
                  onClick={() => scrollCategories('left')}
                  className="w-14 h-14 rounded-full bg-white/90 backdrop-blur-xl border border-white flex items-center justify-center text-primary-600 shadow-xl hover:bg-primary-600 hover:text-white transition-all duration-300 active:scale-90"
                >
                  <MoveLeft size={24} />
                </button>
              </div>

              {/* Side Floating Buttons - Right */}
              <div className="absolute -right-4 lg:-right-12 top-1/2 -translate-y-1/2 z-30 opacity-0 group-hover/carousel:opacity-100 transition-all duration-500 hover:scale-110">
                <button
                  onClick={() => scrollCategories('right')}
                  className="w-14 h-14 rounded-full bg-white/90 backdrop-blur-xl border border-white flex items-center justify-center text-primary-600 shadow-xl hover:bg-primary-600 hover:text-white transition-all duration-300 active:scale-90"
                >
                  <MoveRight size={24} />
                </button>
              </div>

              {/* Visual Fade Overlay */}
              <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-[#fafafa] via-[#fafafa]/50 to-transparent z-20 pointer-events-none"></div>
              <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-[#fafafa] via-[#fafafa]/50 to-transparent z-20 pointer-events-none"></div>

              {/* Infinite Scroll Wrapper */}
              <div
                ref={(el) => categoryScrollRef.current = el}
                onScroll={handleCategoryScroll}
                onMouseDown={onMouseDown}
                onMouseLeave={onMouseLeave}
                onMouseUp={onMouseUp}
                onMouseMove={onMouseMove}
                className="flex overflow-x-auto gap-8 pb-10 px-4 no-scrollbar snap-x snap-mandatory scroll-smooth relative z-10 cursor-grab active:cursor-grabbing select-none"
              >
                {loopedCategories.map((cat, idx) => (
                  <div key={`${cat.idCategory}-${idx}`} className="snap-center shrink-0">
                    <CategoryCardItem
                      cat={cat}
                      style={CATEGORY_STYLES[cat.tenCategory] || CATEGORY_STYLES['DEFAULT']}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Pagination Dots */}
            {cats.length > 0 && (
              <div className="flex justify-center gap-3 mt-12 animate-in fade-in slide-in-from-bottom duration-1000">
                {cats.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => scrollToCategory(idx)}
                    className={`h-3 rounded-full transition-all duration-500 hover:scale-110 active:scale-90 ${activeCategoryIndex === idx
                        ? 'w-10 bg-primary-600 shadow-lg shadow-primary-500/20'
                        : 'w-3 bg-gray-200 hover:bg-gray-300'
                      }`}
                    title={`Chuyển đến danh mục ${idx + 1}`}
                  />
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Featured Products */}
      {products.length > 0 && (
        <section className="bg-gray-50 py-12">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-gray-900">Sản phẩm nổi bật</h2>
              <Link to="/products" className="text-primary-600 hover:text-primary-700 flex items-center gap-1 font-medium">
                Xem tất cả <ArrowRight size={18} />
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
              {products.slice(0, 8).map((product) => (
                <ProductCard key={product.idProduct} product={product} onAddToCart={handleAddToCart} isAdding={addingIds.has(product.idProduct)} />
              ))}
            </div>
          </div>
        </section>
      )}



      {/* Unified Product Tabs Section */}
      <section className="bg-white py-20 lg:py-32 mb-20 lg:mb-24 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-gray-50/50 to-white -z-20"></div>
        <div className="container mx-auto px-6">
          <div className="flex flex-col items-center mb-16 text-center">
            <span className="text-primary-600 font-black tracking-[0.4em] text-sm md:text-base lg:text-lg uppercase mb-6 block animate-in fade-in slide-in-from-bottom duration-700">Bộ Sưu Tập Nổi Bật</span>
            <h2 className="text-3xl md:text-5xl lg:text-7xl font-black text-gray-900 mb-10 leading-tight">Sản Phẩm <br /> Cho Thú Cưng</h2>

            {/* Tabs Controller */}
            <div className="inline-flex bg-gray-100 p-1.5 md:p-2 rounded-full shadow-inner border border-gray-200">
              <button
                onClick={() => setActiveTab('best')}
                className={`px-6 md:px-10 py-3 md:py-4 rounded-full text-xs md:text-sm font-black transition-all duration-500 uppercase tracking-widest ${activeTab === 'best'
                  ? 'bg-white text-gray-900 shadow-xl scale-100'
                  : 'text-gray-400 hover:text-gray-600'
                  }`}
              >
                Bán Chạy Nhất
              </button>
              <button
                onClick={() => setActiveTab('latest')}
                className={`px-6 md:px-10 py-3 md:py-4 rounded-full text-xs md:text-sm font-black transition-all duration-500 uppercase tracking-widest ${activeTab === 'latest'
                  ? 'bg-white text-gray-900 shadow-xl scale-100'
                  : 'text-gray-400 hover:text-gray-600'
                  }`}
              >
                Hàng Mới Về
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-8 animate-in fade-in duration-700">
            {(activeTab === 'best' ? bestSellingProducts?.content : latestProducts?.content)?.slice(0, 8).map((product) => (
              <ProductCard
                key={product.idProduct}
                product={product}
                onAddToCart={handleAddToCart}
                isAdding={addingIds.has(product.idProduct)}
              />
            ))}
          </div>

          <div className="mt-16 md:mt-20 text-center">
            <Link
              to={activeTab === 'best' ? "/products?sortBy=giaBan&sortDirection=DESC" : "/products?sortBy=ngayTao&sortDirection=DESC"}
              className="inline-flex items-center gap-4 px-10 md:px-12 py-5 md:py-6 bg-gray-900 text-white rounded-full font-black text-sm md:text-base hover:bg-primary-600 transition-all hover:scale-105 active:scale-95 shadow-2xl shadow-gray-200"
            >
              XEM TẤT CẢ SẢN PHẨM
              <ArrowRight size={20} />
            </Link>
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="container mx-auto px-6 mb-20 lg:mb-32">
        <div className="bg-[#FDF2F0] rounded-[32px] md:rounded-[64px] overflow-hidden flex flex-col lg:flex-row items-center relative isolation shadow-2xl shadow-[#FDF2F0]/50 border border-white">
          <div className="p-8 md:p-20 lg:p-24 lg:w-3/5 z-10 text-center lg:text-left">
            <h2 className="text-3xl md:text-5xl lg:text-7xl font-black text-gray-900 mb-6 md:mb-8 leading-[1.2]">
              Đăng ký nhận <br /> tin tức ngay!
            </h2>
            <p className="text-gray-600 text-base md:text-lg lg:text-xl mb-8 md:mb-10 max-w-md mx-auto lg:mx-0 font-medium leading-relaxed">
              Đừng bỏ lỡ các ưu đãi hấp dẫn và kiến thức chăm sóc thú cưng bổ ích nhất. ✨
            </p>
            <form className="flex flex-col sm:flex-row gap-3 md:gap-4 max-w-lg mx-auto lg:mx-0">
              <input
                type="email"
                placeholder="Nhập email của bạn..."
                className="flex-1 px-8 md:px-10 py-4 md:py-6 rounded-full border-2 border-white focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all shadow-xl shadow-primary-200/20 text-base md:text-lg"
              />
              <button
                type="submit"
                className="px-8 md:px-10 py-4 md:py-6 bg-gray-900 text-white rounded-full font-black text-base md:text-lg hover:bg-primary-600 hover:shadow-2xl hover:shadow-primary-400/40 transition-all hover:scale-105 active:scale-95 cursor-pointer uppercase tracking-widest whitespace-nowrap"
              >
                Gửi ngay
              </button>
            </form>
          </div>
          <div className="lg:w-2/5 relative flex justify-center items-end h-full pt-12 lg:pt-0 overflow-hidden">
            <div className="absolute bottom-0 w-full h-[80%] bg-gradient-to-t from-primary-200/20 to-transparent -z-10"></div>
            <img
              src={newsletterDog}
              alt="Happy Dog"
              className="w-[80%] md:w-[60%] lg:w-[130%] max-w-none lg:-mr-20 animate-bounce-slow drop-shadow-2xl object-contain pointer-events-none"
            />
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 lg:py-32 bg-white mb-20 lg:mb-24 relative overflow-hidden">
        <div className="container mx-auto px-6">
          <div className="flex flex-col items-center mb-16 md:mb-20 text-center">
            <span className="px-8 md:px-10 py-3 md:py-4 bg-[#FDF2F0] text-[#F4A261] rounded-full text-sm md:text-base lg:text-lg font-black uppercase tracking-widest mb-8 shadow-md">
              ĐÁNH GIÁ
            </span>
            <h2 className="text-3xl md:text-5xl lg:text-6xl font-black text-gray-900 leading-tight">
              NHỮNG NGƯỜI IU THÚ CƯNG <br /> NÓI GÌ VỀ SỐP
            </h2>
          </div>

          <div className="max-w-6xl mx-auto flex flex-col lg:flex-row items-center gap-20">
            {/* Left: Large Highlight Image */}
            <div className="lg:w-1/2 relative">
              {/* Decorative Rings */}
              <div className="absolute inset-0 -m-8 border-[1px] border-[#F4A261]/20 rounded-full animate-spin-slow"></div>
              <div className="absolute inset-0 -m-4 border-[1px] border-[#F4A261]/40 rounded-full animate-reverse-spin-slow"></div>
              <div className="absolute inset-0 border-[3px] border-[#F4A261] rounded-full z-10"></div>

              <div className="relative w-full aspect-square rounded-full overflow-hidden border-[12px] border-white shadow-2xl">
                <img
                  src={avatar1}
                  alt="Featured Customer"
                  className="w-full h-full object-cover hover:scale-110 transition-transform duration-1000"
                />
              </div>
            </div>

            {/* Right: Content */}
            <div className="lg:w-1/2 relative">
              <Quote size={80} className="text-[#F4A261]/10 absolute -top-12 -left-12 rotate-180" />

              <div className="relative z-10">
                <p className="text-2xl lg:text-3xl text-gray-500 font-medium leading-relaxed mb-12 italic">
                  Dịch vụ spa và nhuộm lông cho bé Đom Đóm nhà mình quá tuyệt, bé được chăm sóc kỹ lưỡng mà tiệm thì đáng iu, thân thiện quá trời!
                </p>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-6">
                    <img
                      src={avatar2}
                      alt="Trịnh Trần Phương Tuấn"
                      className="w-20 h-20 rounded-full object-cover border-4 border-[#FDF2F0] shadow-xl"
                    />
                    <div>
                      <h4 className="text-2xl font-black text-gray-900">Trịnh Trần Phương Tuấn</h4>
                      <p className="text-gray-400 font-bold uppercase tracking-widest text-xs mt-1">Công nhân</p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <button className="w-14 h-14 rounded-full border-2 border-gray-100 flex items-center justify-center text-gray-400 hover:border-[#F4A261] hover:text-[#F4A261] transition-all group">
                      <MoveLeft size={24} className="group-hover:-translate-x-1 transition-transform" />
                    </button>
                    <button className="w-14 h-14 rounded-full border-2 border-gray-100 flex items-center justify-center text-gray-400 hover:border-[#F4A261] hover:text-[#F4A261] transition-all group">
                      <MoveRight size={24} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                  </div>
                </div>
              </div>

              <Quote size={80} className="text-[#F4A261]/10 absolute -bottom-12 -right-12" />
            </div>
          </div>
        </div>
      </section>


      {/* Latest News */}
      <section className="container mx-auto px-4 py-24 border-t border-gray-100">
        <div className="flex items-center justify-between mb-16">
          <h2 className="text-4xl font-black text-gray-900 uppercase">Tin tức nổi bật</h2>
          <Link to="/blog" className="text-primary-600 font-bold hover:underline">Xem thêm tin tức</Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
          <BlogCard
            image={blog1}
            author="Admin"
            date="20 Th03, 2026"
            title="Làm sao để chăm sóc mèo con mới về nhà lần đầu?"
            tag="NEWS"
          />
          <BlogCard
            image={blog2}
            author="PawVerse Team"
            date="18 Th03, 2026"
            title="Chế độ dinh dưỡng cân bằng cho chó năng động"
            tag="TIPS"
          />
          <BlogCard
            image={blog3}
            author="Admin"
            date="15 Th02, 2026"
            title="Sự kiện: Ngày hội Offline cộng đồng thú cưng PawVerse"
            tag="EVENTS"
          />
        </div>
      </section>
    </div>
  );
}

function TestimonialCard({ image, name, role, content }) {
  return (
    <div className="bg-primary-50/50 p-10 rounded-[40px] relative hover:shadow-2xl hover:shadow-primary-100 transition-all duration-500 group">
      <div className="flex items-center gap-6 mb-8">
        <img src={image} alt={name} className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-lg" />
        <div>
          <h4 className="text-xl font-bold text-gray-900">{name}</h4>
          <p className="text-primary-600 font-black text-base uppercase tracking-widest">{role}</p>
        </div>
      </div>
      <p className="text-gray-600 italic leading-relaxed text-lg">
        "{content}"
      </p>
      <div className="absolute top-10 right-10 opacity-10 group-hover:opacity-20 transition-opacity">
        <PawPrint size={48} />
      </div>
    </div>
  );
}

function BlogCard({ image, author, date, title, tag }) {
  return (
    <div className="group cursor-pointer bg-white rounded-[40px] p-6 border border-gray-50 hover:shadow-2xl transition-all duration-500 hover:-translate-y-2">
      <div className="relative rounded-[32px] overflow-hidden mb-6 aspect-[4/3]">
        <span className="absolute top-4 left-4 bg-gray-900/90 backdrop-blur-md text-white text-sm font-black px-6 py-3 rounded-full z-10 uppercase tracking-widest">
          {tag}
        </span>
        <img src={image} alt={title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" />
      </div>
      <div className="flex items-center gap-4 text-[10px] font-black text-gray-400 mb-4 uppercase tracking-[0.2em] px-2">
        <span>{author}</span>
        <span className="w-1.5 h-1.5 bg-primary-200 rounded-full"></span>
        <span>{date}</span>
      </div>
      <h3 className="text-2xl font-black text-gray-900 leading-tight group-hover:text-primary-600 transition-colors line-clamp-2 px-2">
        {title}
      </h3>
    </div>
  );
}

function ProductCard({ product, onAddToCart, isAdding = false }) {
  const rating = product.avgRating || 0;
  const brandName = product.brand?.tenBrand || "PawVerse";

  return (
    <div className="bg-white rounded-3xl shadow-[0_10px_30px_rgba(0,0,0,0.05)] overflow-hidden hover:shadow-2xl hover:shadow-primary-600/10 transition-all duration-500 group flex flex-col h-full border border-gray-50">
      <Link to={`/products/${product.idProduct}`} className="relative block overflow-hidden aspect-square">
        <img
          src={product.thumbnailUrl || (product.images?.[0]?.url ?
            (product.images[0].url.startsWith('http') ?
              product.images[0].url :
              `${product.images[0].url.startsWith('/') ? '' : '/'}${product.images[0].url}`) :
            hero)}
          alt={product.tenProduct}
          onError={(e) => { e.target.src = hero; }}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
        />
        {product.giaGoc && product.giaGoc > product.giaBan && (
          <span className="absolute top-4 left-4 bg-red-500 text-white text-[10px] font-black px-3 py-1.5 rounded-full z-10 shadow-lg">
            -{Math.round((1 - product.giaBan / product.giaGoc) * 100)}%
          </span>
        )}
        {product.soLuongTonKho === 0 && (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-20">
            <span className="text-gray-900 font-black tracking-widest uppercase text-sm border-2 border-gray-900 px-4 py-2">Hết hàng</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
      </Link>
      <div className="p-6 flex flex-col flex-1">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-black text-primary-600 uppercase tracking-[0.2em] bg-primary-50 px-4 py-2 rounded-lg">
            {brandName}
          </span>
          <div className="flex items-center gap-0.5">
            <Star size={12} className="fill-yellow-400 text-yellow-400" />
            <span className="text-xs font-bold text-gray-500">{rating.toFixed(1)}</span>
          </div>
        </div>
        <Link to={`/products/${product.idProduct}`} className="flex-1">
          <h3 className="font-bold text-gray-900 hover:text-primary-600 mb-3 line-clamp-2 leading-tight transition-colors">
            {product.tenProduct}
          </h3>
        </Link>
        <div className="mt-auto">
          <div className="flex items-baseline gap-3 mb-5">
            <p className="text-2xl font-black text-primary-600">{formatPrice(product.giaBan)}</p>
            {product.giaGoc && product.giaGoc > product.giaBan && (
              <p className="text-sm text-gray-400 line-through font-medium">{formatPrice(product.giaGoc)}</p>
            )}
          </div>
          <button
            onClick={() => onAddToCart(product.idProduct)}
            disabled={product.soLuongTonKho === 0 || isAdding}
            className="w-full py-4 bg-gray-900 text-white rounded-2xl hover:bg-primary-600 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-3 text-sm font-black transition-all hover:scale-[1.02] active:scale-95 shadow-xl shadow-gray-200"
          >
            <ShoppingCart size={18} />
            {isAdding ? 'Đang thêm...' : 'MUA NGAY'}
          </button>
        </div>
      </div>
    </div>
  );
}

function CategoryCardItem({ cat, style }) {
  return (
    <div
      className="group bg-white rounded-[40px] overflow-hidden transition-all duration-700 hover:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.15)] hover:-translate-y-3 border border-slate-50 flex flex-col h-[400px] w-[260px] md:w-[280px] shadow-sm relative isolate select-none"
    >
      {/* ATMOSPHERIC BLEED SECTION */}
      <div className="h-[55%] relative flex items-center justify-center overflow-hidden">
        {/* Blurry Bleed Background Layer */}
        <img
          src={style.img}
          alt=""
          draggable="false"
          className="absolute inset-0 w-full h-full object-cover blur-[40px] opacity-40 scale-150 transition-transform duration-1000 group-hover:scale-125"
        />
        {/* Sharp Foreground Image Layer (Safely Contained) */}
        <img
          src={style.img}
          alt={cat.tenCategory}
          draggable="false"
          className="relative z-10 w-full h-full object-contain p-8 group-hover:scale-110 transition-transform duration-1000 drop-shadow-2xl"
        />
        {/* Color Tint Overlay for depth */}
        <div className={`absolute inset-0 ${style.bg} mix-blend-multiply opacity-30`}></div>
      </div>

      {/* Premium Content Area */}
      <div className="px-8 py-7 flex flex-col justify-between flex-1 bg-white relative">
        <div className="flex items-center justify-between gap-4">
          <h3 className="text-lg md:text-xl font-black text-gray-900 group-hover:text-primary-600 transition-colors leading-[1.1] min-h-[50px] flex items-center">
            {cat.tenCategory}
          </h3>
          <Link
            to={`/products?categoryId=${cat.idCategory}`}
            className="shrink-0 w-10 h-10 rounded-full border border-primary-100 bg-white flex items-center justify-center text-primary-600 hover:bg-primary-600 hover:text-white hover:border-transparent transition-all duration-500 shadow-lg shadow-primary-500/5 z-20"
          >
            <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        <div className="mt-auto pt-5 border-t border-gray-50/50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-1 bg-primary-500/20 rounded-full overflow-hidden">
              <div className="h-full bg-primary-600 w-1/3 group-hover:w-full transition-all duration-700"></div>
            </div>
            <p className="text-gray-400 font-extrabold uppercase tracking-[0.2em] text-[10px]">
              {cat.productCount || 0} sản phẩm
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
