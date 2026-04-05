import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ArrowRight } from 'lucide-react';
import { productService } from '../../api/productService';

function useDebounce(value, delay) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

function formatPrice(price) {
  if (!price) return '';
  return Number(price).toLocaleString('vi-VN') + 'đ';
}

export default function SearchSuggestions() {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(false);

  const debouncedQuery = useDebounce(query.trim(), 300);
  const navigate = useNavigate();
  const wrapperRef = useRef(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handler = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Fetch all categories & brands once for matching
  useEffect(() => {
    const load = async () => {
      try {
        const [cats, brs] = await Promise.all([
          productService.getCategories(),
          productService.getBrands(),
        ]);
        setCategories(cats || []);
        setBrands(brs || []);
      } catch { /* ignore */ }
    };
    load();
  }, []);

  // Fetch product suggestions when debounced query changes
  useEffect(() => {
    if (!debouncedQuery || debouncedQuery.length < 2) {
      setProducts([]);
      setOpen(false);
      return;
    }

    let cancelled = false;
    const fetchSuggestions = async () => {
      setLoading(true);
      try {
        const result = await productService.getProducts({
          keyword: debouncedQuery,
          size: 5,
          page: 0,
        });
        if (!cancelled) {
          setProducts(result?.content || []);
          setOpen(true);
        }
      } catch {
        if (!cancelled) setProducts([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchSuggestions();
    return () => { cancelled = true; };
  }, [debouncedQuery]);

  // Filter matching categories & brands locally
  const matchedCategories = debouncedQuery.length >= 2
    ? categories.filter((c) =>
        c.tenCategory?.toLowerCase().includes(debouncedQuery.toLowerCase())
      ).slice(0, 3)
    : [];

  const matchedBrands = debouncedQuery.length >= 2
    ? brands.filter((b) =>
        b.tenBrand?.toLowerCase().includes(debouncedQuery.toLowerCase())
      ).slice(0, 3)
    : [];

  const hasResults = products.length > 0 || matchedCategories.length > 0 || matchedBrands.length > 0;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) {
      setOpen(false);
      navigate(`/products?keyword=${encodeURIComponent(query.trim())}`);
    }
  };

  const goToProduct = (id) => {
    setOpen(false);
    setQuery('');
    navigate(`/products/${id}`);
  };

  const goToCategory = (id) => {
    setOpen(false);
    setQuery('');
    navigate(`/products?categoryId=${id}`);
  };

  const goToBrand = (id) => {
    setOpen(false);
    setQuery('');
    navigate(`/products?brandId=${id}`);
  };

  const goToAllResults = () => {
    setOpen(false);
    navigate(`/products?keyword=${encodeURIComponent(query.trim())}`);
  };

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <form onSubmit={handleSubmit} className="relative">
        <input
          type="text"
          placeholder="Tìm kiếm sản phẩm, danh mục, thương hiệu..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => { if (debouncedQuery.length >= 2 && hasResults) setOpen(true); }}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 transition"
        />
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
      </form>

      {/* Suggestions Dropdown */}
      {open && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 overflow-hidden max-h-[420px] overflow-y-auto">

          {loading && (
            <div className="px-4 py-3 text-sm text-gray-400 text-center">Đang tìm kiếm...</div>
          )}

          {!loading && !hasResults && debouncedQuery.length >= 2 && (
            <div className="px-4 py-6 text-center text-sm text-gray-500">
              Không tìm thấy kết quả cho "{debouncedQuery}"
            </div>
          )}

          {/* Category suggestions */}
          {matchedCategories.length > 0 && (
            <div>
              <p className="px-4 pt-3 pb-1 text-xs font-semibold text-gray-400 uppercase tracking-wider">Danh mục</p>
              {matchedCategories.map((cat) => (
                <button
                  key={`cat-${cat.idCategory}`}
                  onClick={() => goToCategory(cat.idCategory)}
                  className="flex items-center gap-3 w-full text-left px-4 py-2.5 hover:bg-primary-50 transition"
                >
                  <div className="w-8 h-8 rounded-lg bg-primary-100 flex items-center justify-center shrink-0">
                    <Search size={14} className="text-primary-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-800">{cat.tenCategory}</span>
                  <ArrowRight size={14} className="ml-auto text-gray-300" />
                </button>
              ))}
            </div>
          )}

          {/* Brand suggestions */}
          {matchedBrands.length > 0 && (
            <div>
              <p className="px-4 pt-3 pb-1 text-xs font-semibold text-gray-400 uppercase tracking-wider">Thương hiệu</p>
              {matchedBrands.map((brand) => (
                <button
                  key={`brand-${brand.idBrand}`}
                  onClick={() => goToBrand(brand.idBrand)}
                  className="flex items-center gap-3 w-full text-left px-4 py-2.5 hover:bg-primary-50 transition"
                >
                  <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center shrink-0">
                    <span className="text-xs font-bold text-orange-600">{brand.tenBrand?.charAt(0)}</span>
                  </div>
                  <span className="text-sm font-medium text-gray-800">{brand.tenBrand}</span>
                  <ArrowRight size={14} className="ml-auto text-gray-300" />
                </button>
              ))}
            </div>
          )}

          {/* Product suggestions */}
          {products.length > 0 && (
            <div>
              <p className="px-4 pt-3 pb-1 text-xs font-semibold text-gray-400 uppercase tracking-wider">Sản phẩm gợi ý</p>
              {products.map((product) => (
                <button
                  key={`prod-${product.idProduct}`}
                  onClick={() => goToProduct(product.idProduct)}
                  className="flex items-center gap-3 w-full text-left px-4 py-2.5 hover:bg-primary-50 transition"
                >
                  <img
                    src={product.thumbnailUrl || '/placeholder.png'}
                    alt={product.tenProduct}
                    className="w-10 h-10 rounded-lg object-cover border border-gray-200 shrink-0"
                    onError={(e) => { e.target.src = '/placeholder.png'; }}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 truncate">{product.tenProduct}</p>
                    <div className="flex items-center gap-2 text-xs">
                      {product.brandName && <span className="text-gray-400">{product.brandName}</span>}
                      <span className="text-primary-600 font-semibold">{formatPrice(product.giaBan)}</span>
                      {product.giaGoc && product.giaGoc > product.giaBan && (
                        <span className="text-gray-400 line-through">{formatPrice(product.giaGoc)}</span>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* See all results link */}
          {hasResults && (
            <button
              onClick={goToAllResults}
              className="w-full px-4 py-3 text-sm font-medium text-primary-600 hover:bg-primary-50 transition border-t border-gray-100 flex items-center justify-center gap-2"
            >
              Xem tất cả kết quả cho "{debouncedQuery}"
              <ArrowRight size={14} />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
