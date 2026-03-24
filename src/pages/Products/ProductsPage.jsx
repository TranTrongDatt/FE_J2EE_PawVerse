import { useState, useEffect, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSearchParams, Link } from 'react-router-dom';
import { Grid, List, Filter, ChevronDown, Star, ShoppingCart } from 'lucide-react';
import { productService } from '../../api/productService';
import { formatPrice } from '../../utils/formatters';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';
import { cartService } from '../../api/cartService';
import useCartStore from '../../store/useCartStore';

export default function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [showFilters, setShowFilters] = useState(true);
  const [localMinPrice, setLocalMinPrice] = useState('');
  const [localMaxPrice, setLocalMaxPrice] = useState('');

  const { incrementCart } = useCartStore();
  const [addingIds, setAddingIds] = useState(new Set());

  // Get filters from URL params
  const page = parseInt(searchParams.get('page') || '1');
  const categoryId = searchParams.get('categoryId') || '';
  const brandId = searchParams.get('brandId') || '';
  const keyword = searchParams.get('keyword') || '';
  const sortBy = searchParams.get('sortBy') || 'ngayTao';
  const sortDirection = searchParams.get('sortDirection') || 'DESC';
  const minPrice = searchParams.get('minPrice') || '';
  const maxPrice = searchParams.get('maxPrice') || '';

  // Sync local price state with URL params on mount/change
  useEffect(() => {
    setLocalMinPrice(minPrice);
    setLocalMaxPrice(maxPrice);
  }, [minPrice, maxPrice]);

  // Fetch products
  const { data: productsData, isLoading } = useQuery({
    queryKey: ['products', page, categoryId, brandId, keyword, sortBy, sortDirection, minPrice, maxPrice],
    queryFn: () => productService.getProducts({
      page: page - 1,
      size: 12,
      categoryId,
      brandId,
      keyword,
      sortBy,
      sortDirection,
      minPrice,
      maxPrice,
    }),
  });

  // Fetch categories
  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: productService.getCategories,
  });

  // Fetch brands
  const { data: brands } = useQuery({
    queryKey: ['brands'],
    queryFn: productService.getBrands,
  });

  const handleFilterChange = (key, value) => {
    const newParams = new URLSearchParams(searchParams);
    
    // Support object for multiple changes at once - CRITICAL for sorting
    if (typeof key === 'object') {
      Object.entries(key).forEach(([k, v]) => {
        if (v) newParams.set(k, v);
        else newParams.delete(k);
      });
    } else {
      if (value) {
        newParams.set(key, value);
      } else {
        newParams.delete(key);
      }
    }
    
    // Only reset to page 1 when filtering (not when changing page itself)
    if (key !== 'page' && (typeof key !== 'object' || key.page === undefined)) {
      newParams.set('page', '1');
    }
    setSearchParams(newParams);
  };

  const handleAddToCart = useCallback(async (productId) => {
    if (addingIds.has(productId)) return;
    setAddingIds(prev => new Set(prev).add(productId));
    try {
      await cartService.addToCart(productId, 1);
      // Fetch cart count from backend to get accurate count
      const cart = await cartService.getCart();
      const { setCartCount } = useCartStore.getState();
      setCartCount(cart?.items?.length || 0);
      queryClient.invalidateQueries(['cart']);
      toast.success('Đã thêm vào giỏ hàng!');
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Không thể thêm vào giỏ hàng');
    } finally {
      setAddingIds(prev => { const s = new Set(prev); s.delete(productId); return s; });
    }
  }, [addingIds]);

  const products = productsData?.content || [];
  const totalPages = productsData?.totalPages || 0;

  if (isLoading) {
    return <LoadingSpinner fullScreen />;
  }

  return (
    <div className="container mx-auto px-4 pt-32 pb-8">
      {/* Breadcrumb */}
      <div className="mb-6 text-sm text-gray-600">
        <Link to="/" className="hover:text-primary-600">Trang chủ</Link>
        <span className="mx-2">/</span>
        <span>Sản phẩm</span>
      </div>

      {/* Header & Tabs - UI/UX PRO MAX Optimized: Zero-Box Design */}
      <div className="bg-white/90 backdrop-blur-xl rounded-[2.5rem] shadow-2xl shadow-gray-200/50 border border-white p-1 mb-10 transition-all duration-300 relative z-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-4 py-2 overflow-visible">
          <div className="flex items-center gap-4 overflow-visible">
            <div className="flex items-center gap-4 overflow-x-auto no-scrollbar scrollbar-hide py-1 pr-2">
              <span className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] shrink-0">Sắp xếp theo:</span>
              <SortTab
                label="MỚI NHẤT"
                active={sortBy === 'ngayTao'}
                onClick={() => handleFilterChange({ sortBy: 'ngayTao', sortDirection: 'DESC' })}
              />
              <SortTab
                label="PHỔ BIẾN"
                active={sortBy === 'soLuongDaBan'}
                onClick={() => handleFilterChange({ sortBy: 'soLuongDaBan', sortDirection: 'DESC' })}
              />
            </div>

            <div className="relative group self-center z-[50]">
              <button className={`px-6 py-2.5 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all border-2 flex items-center gap-2 shrink-0 ${sortBy === 'giaBan' ? 'bg-primary-600 text-white border-primary-600 shadow-md shadow-primary-500/20' : 'bg-white text-gray-600 border-gray-100 hover:border-primary-600 hover:text-primary-600'
                }`}>
                Giá {sortBy === 'giaBan' && (sortDirection === 'ASC' ? '▲' : '▼')}
                <ChevronDown size={14} className={`transition-transform duration-300 ${sortBy === 'giaBan' ? '' : 'group-hover:rotate-180'}`} />
              </button>
              
              <div className="absolute top-full left-0 mt-3 w-52 bg-white/95 backdrop-blur-md rounded-[1.5rem] shadow-2xl border border-gray-50 py-3 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-[100] translate-y-4 group-hover:translate-y-0 pointer-events-none group-hover:pointer-events-auto">
                {/* Invisible Bridge - Keeps hover active across the mt-3 gap */}
                <div className="absolute -top-3 left-0 w-full h-3 bg-transparent pointer-events-auto" />
                
                <button 
                  onClick={() => handleFilterChange({ sortBy: 'giaBan', sortDirection: 'ASC' })} 
                  className="w-full text-left px-5 py-2.5 hover:bg-primary-50 hover:text-primary-600 text-[10px] font-black transition-colors uppercase tracking-widest relative z-[110]"
                >
                  GIÁ: THẤP ĐẾN CAO
                </button>
                <button 
                  onClick={() => handleFilterChange({ sortBy: 'giaBan', sortDirection: 'DESC' })} 
                  className="w-full text-left px-5 py-2.5 hover:bg-primary-50 hover:text-primary-600 text-[10px] font-black transition-colors uppercase tracking-widest relative z-[110]"
                >
                  GIÁ: CAO ĐẾN THẤP
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 pr-2">
            <div className="flex bg-gray-50/80 p-1.5 rounded-2xl border border-gray-100/50">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2.5 rounded-xl transition-all duration-300 ${viewMode === 'grid' ? 'bg-white text-primary-600 shadow-lg' : 'text-gray-400 hover:text-gray-600 hover:bg-white/50'}`}
              >
                <Grid size={18} />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2.5 rounded-xl transition-all duration-300 ${viewMode === 'list' ? 'bg-white text-primary-600 shadow-lg' : 'text-gray-400 hover:text-gray-600 hover:bg-white/50'}`}
              >
                <List size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Product count & Context information - Enhanced Visibility */}
      <div className="flex items-center justify-between mb-4 mt-2 px-6">
        <p className="text-[13px] font-black text-gray-600 uppercase tracking-[0.15em]">
          HIỂN THỊ <span className="text-primary-600 text-base">{products.length}</span> SẢN PHẨM TRONG CỬA HÀNG
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Filters Sidebar - Shopee Style Responsive Drawer needed or hidden on mobile */}
        <aside className={`${showFilters ? 'block' : 'hidden'} lg:block w-full lg:w-72 transition-all duration-500 shrink-0`}>
          <div className="bg-white/90 backdrop-blur-xl rounded-[2.5rem] shadow-2xl shadow-gray-200/50 border border-white p-6 space-y-8 sticky top-32">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Filter size={20} className="text-primary-600" />
                <h3 className="font-black text-xl text-gray-900 uppercase tracking-tight">Bộ lọc</h3>
              </div>
              <button onClick={() => setShowFilters(false)} className="lg:hidden text-gray-400">×</button>
            </div>

            {/* Categories */}
            <div>
              <h4 className="font-black text-sm text-gray-400 uppercase tracking-widest mb-4">Danh mục</h4>
              <div className="space-y-3">
                <FilterLink label="Tất cả sản phẩm" active={!categoryId} onClick={() => handleFilterChange('categoryId', '')} />
                {categories?.map((cat) => (
                  <FilterLink
                    key={cat.idCategory}
                    label={cat.tenCategory}
                    active={categoryId === cat.idCategory.toString()}
                    onClick={() => handleFilterChange('categoryId', cat.idCategory.toString())}
                  />
                ))}
              </div>
            </div>

            {/* Brands */}
            <div>
              <h4 className="font-black text-sm text-gray-400 uppercase tracking-widest mb-4">Thương hiệu</h4>
              <div className="flex flex-wrap gap-2">
                <BrandChip label="Tất cả" active={!brandId} onClick={() => handleFilterChange('brandId', '')} />
                {brands?.map((br) => (
                  <BrandChip
                    key={br.idBrand}
                    label={br.tenBrand}
                    active={brandId === br.idBrand.toString()}
                    onClick={() => handleFilterChange('brandId', br.idBrand.toString())}
                  />
                ))}
              </div>
            </div>

            {/* Price Range */}
            <div>
              <h4 className="font-black text-sm text-gray-400 uppercase tracking-widest mb-4">Khoảng giá</h4>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-gray-400 uppercase">Từ</span>
                    <input
                      type="number"
                      value={localMinPrice}
                      onChange={(e) => setLocalMinPrice(e.target.value)}
                      className="w-full pl-10 pr-3 py-3 bg-gray-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary-500 transition-all font-bold"
                      placeholder="0"
                    />
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-gray-400 uppercase">Đến</span>
                    <input
                      type="number"
                      value={localMaxPrice}
                      onChange={(e) => setLocalMaxPrice(e.target.value)}
                      className="w-full pl-10 pr-3 py-3 bg-gray-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary-500 transition-all font-bold"
                      placeholder="∞"
                    />
                  </div>
                </div>
                <button
                  onClick={() => {
                    const newParams = new URLSearchParams(searchParams);
                    localMinPrice ? newParams.set('minPrice', localMinPrice) : newParams.delete('minPrice');
                    localMaxPrice ? newParams.set('maxPrice', localMaxPrice) : newParams.delete('maxPrice');
                    newParams.set('page', '1');
                    setSearchParams(newParams);
                  }}
                  className="w-full py-3 bg-gray-900 text-white rounded-xl hover:bg-black transition-all text-xs font-black uppercase tracking-widest shadow-lg shadow-gray-200"
                >
                  ÁP DỤNG BỘ LỌC
                </button>
              </div>
            </div>

            {/* Rating Filter (New Shopee Style) */}
            <div>
              <h4 className="font-black text-sm text-gray-400 uppercase tracking-widest mb-4">Đánh giá</h4>
              <div className="space-y-2">
                {[5, 4, 3, 2, 1].map((stars) => (
                  <button key={stars} className="flex items-center gap-2 text-sm text-gray-600 hover:text-primary-600 transition-colors py-1 group w-full">
                    <div className="flex gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} size={14} className={i < stars ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'} />
                      ))}
                    </div>
                    <span className="font-medium group-hover:translate-x-1 transition-transform">{stars === 5 ? '' : 'trở lên'}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </aside>

        {/* Products Grid/List */}
        <main className="flex-1">
          {!showFilters && (
            <button
              onClick={() => setShowFilters(true)}
              className="mb-4 flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <Filter size={20} />
              Hiện bộ lọc
            </button>
          )}



          {products.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">Không tìm thấy sản phẩm nào</p>
            </div>
          ) : (
            <>
              <div className={viewMode === 'grid'
                ? 'grid grid-cols-2 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-8'
                : 'space-y-6'
              }>
                {products.map((product) => (
                  <ProductCard
                    key={product.idProduct}
                    product={product}
                    viewMode={viewMode}
                    onAddToCart={handleAddToCart}
                    isAdding={addingIds.has(product.idProduct)}
                  />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-8 flex justify-center gap-2">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                    <button
                      key={pageNum}
                      onClick={() => handleFilterChange('page', pageNum.toString())}
                      className={`px-4 py-2 rounded-lg ${pageNum === page
                          ? 'bg-primary-600 text-white'
                          : 'bg-white border border-gray-300 hover:bg-gray-50'
                        }`}
                    >
                      {pageNum}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}

function ProductCard({ product, viewMode, onAddToCart, isAdding = false }) {
  const rating = product.avgRating || 0;
  const reviewCount = product.totalReviews || 0;
  const soldCount = product.soLuongDaBan || 0; // TRỎ ĐÚNG TRƯỜNG soLuongDaBan TỪ API - Vui lòng kiểm tra cột so_luong_da_ban trong bảng product (SQL)

  if (viewMode === 'list') {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex gap-6 hover:shadow-xl transition-all duration-300 group">
        <div className="relative w-48 h-48 overflow-hidden rounded-xl shrink-0">
          <img
            src={product.thumbnailUrl || '/placeholder-product.jpg'}
            alt={product.tenProduct}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          />
          {product.giaGoc && product.giaGoc > product.giaBan && (
            <div className="absolute top-0 right-0 bg-primary-600 text-white text-[10px] font-black px-2 py-1 rounded-bl-lg uppercase">
              -{Math.round((1 - product.giaBan / product.giaGoc) * 100)}%
            </div>
          )}
        </div>

        <div className="flex-1 flex flex-col justify-between py-2">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 bg-primary-50 text-primary-600 text-[10px] font-black rounded uppercase tracking-wider">{product.brandName}</span>
            </div>
            <Link to={`/products/${product.idProduct}`}>
              <h3 className="font-black text-xl text-gray-900 group-hover:text-primary-600 transition-colors mb-2 line-clamp-1">
                {product.tenProduct}
              </h3>
            </Link>
            <p className="text-sm text-gray-500 mb-4 line-clamp-2 leading-relaxed">{product.moTa}</p>

            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    size={14}
                    className={i < Math.floor(rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'}
                  />
                ))}
              </div>
              <div className="h-4 w-px bg-gray-200" />
              <span className="text-[10px] text-gray-400 font-black uppercase tracking-widest">ĐÃ BÁN {soldCount}</span>
            </div>
          </div>

          <div className="flex gap-3">
            <Link
              to={`/products/${product.idProduct}`}
              className="px-6 py-3 bg-white text-gray-900 border-2 border-gray-200 rounded-2xl hover:border-gray-900 transition-all font-black text-[10px] uppercase tracking-widest active:scale-95 flex items-center gap-2"
            >
              CHI TIẾT
            </Link>
            <button
              onClick={() => onAddToCart(product.idProduct)}
              disabled={product.soLuongTonKho === 0 || isAdding}
              className="px-6 py-3 bg-primary-600 text-white rounded-2xl hover:bg-primary-700 disabled:bg-gray-100 disabled:text-gray-300 transition-all font-black text-[10px] uppercase tracking-widest shadow-lg shadow-primary-200 flex items-center gap-2 active:scale-95"
            >
              <ShoppingCart size={16} />
              {isAdding ? 'ĐANG THÊM...' : 'MUA NGAY'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl md:rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden hover:shadow-2xl hover:-translate-y-3 transition-all duration-500 group relative">
      <div className="relative h-40 md:h-72 overflow-hidden bg-gray-50">
        <Link to={`/products/${product.idProduct}`}>
          <img
            src={product.thumbnailUrl || '/placeholder-product.jpg'}
            alt={product.tenProduct}
            className="w-full h-full object-cover group-hover:scale-110 transition duration-700"
          />
        </Link>

        {/* Overlay Action Buttons - Smooth appearance on Hover */}
        <div className="absolute inset-0 bg-black/30 backdrop-blur-[4px] opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col items-center justify-center gap-3 p-6">
          <Link
            to={`/products/${product.idProduct}`}
            className="w-full py-3.5 bg-white text-gray-900 rounded-2xl font-black text-[10px] uppercase tracking-widest text-center hover:bg-gray-900 hover:text-white transition-all transform translate-y-6 group-hover:translate-y-0 shadow-xl"
          >
            XEM CHI TIẾT
          </Link>
          <button
            onClick={() => onAddToCart(product.idProduct)}
            disabled={product.soLuongTonKho === 0 || isAdding}
            className="w-full py-3.5 bg-primary-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-primary-700 transition-all transform translate-y-6 group-hover:translate-y-0 delay-75 shadow-xl disabled:bg-gray-400 active:scale-95"
          >
            {isAdding ? 'ĐANG THÊM...' : 'MUA NGAY'}
          </button>
        </div>

        {product.soLuongTonKho === 0 && (
          <div className="absolute inset-0 bg-white/70 backdrop-blur-sm flex items-center justify-center pointer-events-none z-10">
            <span className="text-gray-900 font-black uppercase tracking-widest text-xs border-2 border-gray-900 px-3 py-1">HẾT HÀNG</span>
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-5 left-5 flex flex-col gap-2 z-10">
          {product.giaGoc && product.giaGoc > product.giaBan && (
            <span className="bg-primary-600 text-white text-[10px] font-black px-2 py-1 rounded shadow-lg uppercase tracking-wider">
              SAVE {Math.round((1 - product.giaBan / product.giaGoc) * 100)}%
            </span>
          )}
          <span className="bg-white/95 backdrop-blur-md text-gray-900 text-[9px] font-black px-2 py-1 rounded shadow-sm uppercase tracking-widest border border-gray-100">{product.brandName}</span>
        </div>
      </div>

      <div className="p-3 md:p-6 flex flex-col">
        <Link to={`/products/${product.idProduct}`} className="block mb-2">
          <h3 className="font-black text-gray-900 group-hover:text-primary-600 transition-colors line-clamp-2 min-h-[2.5rem] md:min-h-[3rem] text-[10px] sm:text-xs md:text-base leading-tight uppercase tracking-tight">
            {product.tenProduct}
          </h3>
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-2 md:mb-4">
          <div className="flex gap-0.2 sm:gap-0.5">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                size={window.innerWidth < 768 ? 10 : 14}
                className={i < Math.floor(rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'}
              />
            ))}
          </div>
          <span className="text-[8px] md:text-[10px] text-gray-400 font-black uppercase tracking-widest">ĐÃ BÁN {soldCount}</span>
        </div>

        <div className="flex flex-col md:flex-row md:items-end gap-0.5 md:gap-2">
          <p className="text-sm sm:text-lg md:text-2xl font-black text-primary-600 leading-none">
            {formatPrice(product.giaBan)}
          </p>
          {product.giaGoc && product.giaGoc > product.giaBan && (
            <p className="text-[8px] md:text-sm text-gray-400 line-through mb-0.5 font-bold">{formatPrice(product.giaGoc)}</p>
          )}
        </div>
      </div>
    </div>
  );
}

// Helper Components for Shopee-style layout
function SortTab({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`px-6 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all duration-300 ${active
          ? 'bg-primary-600 text-white shadow-md shadow-primary-500/20'
          : 'bg-transparent text-gray-500 hover:text-gray-900 hover:bg-white/80'
        }`}
    >
      {label}
    </button>
  );
}

function FilterLink({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left flex items-center justify-between group py-1 ${active ? 'text-primary-600' : 'text-gray-600 hover:text-gray-900'
        }`}
    >
      <span className={`text-sm transition-all ${active ? 'font-black ml-2' : 'font-medium group-hover:ml-1'}`}>
        {active && <span className="inline-block w-1.5 h-1.5 bg-primary-600 rounded-full mr-2" />}
        {label}
      </span>
      {active && <ChevronDown size={14} className="-rotate-90" />}
    </button>
  );
}

function BrandChip({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${active
          ? 'bg-primary-50 text-primary-600 border-primary-200 border-2'
          : 'bg-white text-gray-500 border-gray-100 hover:border-gray-200'
        }`}
    >
      {label}
    </button>
  );
}

// UI/UX PRO MAX: Local Styles for seamless experience
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.innerHTML = `
    .no-scrollbar::-webkit-scrollbar {
      display: none;
    }
    .no-scrollbar {
      -ms-overflow-style: none;
      scrollbar-width: none;
    }
  `;
  document.head.appendChild(style);
}
