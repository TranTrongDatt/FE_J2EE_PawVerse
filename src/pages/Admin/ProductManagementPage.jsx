import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  Package, 
  X, 
  Star, 
  ToggleLeft, 
  ToggleRight, 
  ImagePlus, 
  FileSpreadsheet,
  Filter,
  ArrowRight,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Layers,
  Archive,
  EyeOff,
  AlertTriangle,
  Zap,
  Ban
} from 'lucide-react';
import { adminService } from '../../api/adminService';
import { formatPrice } from '../../utils/formatters';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';
import ExcelImportModal from '../../components/admin/ExcelImportModal';

const EMPTY_FORM = {
  tenProduct: '',
  moTa: '',
  giaBan: '',
  giaGoc: '',
  soLuongTonKho: '',
  categoryId: '',
  brandId: '',
  isFeatured: false,
  isEnabled: true,
  imageUrls: ['', '', '', '', ''],
};

// Custom PRO MAX Confirm Modal
function ConfirmModal({ isOpen, onClose, onConfirm, title, message, type = 'danger' }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gray-950/40 backdrop-blur-sm animate-in fade-in duration-300" onClick={onClose} />
      <div className="relative bg-white/95 backdrop-blur-2xl rounded-[2.5rem] border border-white shadow-[0_32px_64px_-16px_rgba(0,0,0,0.2)] w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-300">
        <div className={`h-2 w-full ${type === 'danger' ? 'bg-rose-500' : 'bg-orange-500'}`} />
        <div className="p-8 text-center">
          <div className={`w-20 h-20 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-xl ${type === 'danger' ? 'bg-rose-50 text-rose-500 shadow-rose-100' : 'bg-orange-50 text-orange-500 shadow-orange-100'}`}>
            {type === 'danger' ? <Trash2 size={36} /> : <Zap size={36} className="animate-pulse" />}
          </div>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.4em] mb-2 italic">Hệ thống PawVerse</p>
          <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tighter leading-tight mb-4 text-balance">{title}</h3>
          <div className="bg-gray-50/80 rounded-2xl p-4 mb-8 border border-gray-100 text-[11px] font-bold text-gray-600 italic leading-relaxed">
            {message}
          </div>
          <div className="grid grid-cols-2 gap-3">
             <button onClick={onClose} className="py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-gray-600 hover:bg-gray-50 focus-visible:ring-4 focus-visible:ring-gray-100 outline-none transition-all">Hủy bỏ</button>
             <button onClick={() => { onConfirm(); onClose(); }} className={`py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white shadow-xl focus-visible:ring-4 ${type === 'danger' ? 'bg-rose-600 focus-visible:ring-rose-200 hover:bg-rose-700 shadow-rose-200' : 'bg-gray-950 focus-visible:ring-gray-200 hover:bg-orange-600 shadow-gray-200'} outline-none transition-all active:scale-95 shadow-xl`}>Xác nhận</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProductManagementPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [statusFilter, setStatusFilter] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [importModalOpen, setImportModalOpen] = useState(false);
  
  // Confirmation state
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', onConfirm: null, type: 'danger' });

  const queryClient = useQueryClient();

  const { data: productsData, isLoading } = useQuery({
    queryKey: ['admin-products', currentPage, searchTerm, statusFilter],
    queryFn: () => adminService.getAllProducts({
      page: currentPage,
      size: 10,
      keyword: searchTerm || undefined,
    }),
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['admin-categories'],
    queryFn: () => adminService.getAllCategories(),
  });

  const { data: brands = [] } = useQuery({
    queryKey: ['admin-brands'],
    queryFn: () => adminService.getAllBrands(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => adminService.createProduct(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-products']);
      toast.success('NIÊM YẾT SẢN PHẨM MỚI THÀNH CÔNG!', {
        icon: '💎',
        style: { borderRadius: '15px', background: '#111', color: '#fff', fontSize: '11px', fontWeight: 'bold' }
      });
      closeModal();
    },
    onError: (err) => toast.error(err?.response?.data?.message || 'Không thể thêm sản phẩm'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => adminService.updateProduct(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-products']);
      toast.success('CẬP NHẬT KHO HÀNG THÀNH CÔNG!', {
        icon: '🔄',
        style: { borderRadius: '15px', background: '#111', color: '#fff', fontSize: '11px', fontWeight: 'bold' }
      });
      closeModal();
    },
    onError: (err) => toast.error(err?.response?.data?.message || 'Không thể cập nhật sản phẩm'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => adminService.deleteProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-products']);
      toast.success('ĐÃ LOẠI BỎ SẢN PHẨM KHỎI HỆ THỐNG', {
        icon: '🗑️',
        style: { borderRadius: '15px', background: '#111', color: '#fff', fontSize: '11px', fontWeight: 'bold' }
      });
    },
    onError: () => toast.error('Không thể xóa sản phẩm do có ràng buộc dữ liệu'),
  });

  const toggleEnabledMutation = useMutation({
    mutationFn: ({ id, isEnabled }) => adminService.toggleProductEnabled(id, isEnabled),
    onMutate: async ({ id, isEnabled }) => {
      await queryClient.cancelQueries({ queryKey: ['admin-products'] });
      const prevQueries = queryClient.getQueriesData({ queryKey: ['admin-products'] });
      queryClient.setQueriesData({ queryKey: ['admin-products'] }, (old) => {
        if (!old?.content) return old;
        return { ...old, content: old.content.map(p => p.idProduct === id ? { ...p, isEnabled } : p) };
      });
      return { prevQueries };
    },
    onError: (_err, _vars, context) => {
      context?.prevQueries?.forEach(([key, data]) => queryClient.setQueryData(key, data));
      toast.error('Không thể thay đổi trạng thái');
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['admin-products'] }),
  });

  // eslint-disable-next-line no-unused-vars
  const toggleFeaturedMutation = useMutation({
    mutationFn: ({ id, isFeatured }) => adminService.toggleProductFeatured(id, isFeatured),
    onMutate: async ({ id, isFeatured }) => {
      await queryClient.cancelQueries({ queryKey: ['admin-products'] });
      const prevQueries = queryClient.getQueriesData({ queryKey: ['admin-products'] });
      queryClient.setQueriesData({ queryKey: ['admin-products'] }, (old) => {
        if (!old?.content) return old;
        return { ...old, content: old.content.map(p => p.idProduct === id ? { ...p, isFeatured } : p) };
      });
      return { prevQueries };
    },
    onError: (_err, _vars, context) => {
      context?.prevQueries?.forEach(([key, data]) => queryClient.setQueryData(key, data));
      toast.error('Không thể thay đổi trạng thái nổi bật');
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['admin-products'] }),
  });

  const openAddModal = () => {
    setEditingProduct(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  };

  const openEditModal = (product) => {
    setEditingProduct(product);
    const urls = product.imageUrls || [];
    const paddedUrls = [...urls, '', '', '', '', ''].slice(0, 5);
    setForm({
      tenProduct: product.tenProduct || '',
      moTa: product.moTa || '',
      giaBan: product.giaBan || '',
      giaGoc: product.giaGoc || '',
      soLuongTonKho: product.soLuongTonKho ?? '',
      categoryId: product.categoryId || '',
      brandId: product.brandId || '',
      isFeatured: product.isFeatured || false,
      isEnabled: product.isEnabled !== false,
      imageUrls: paddedUrls,
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingProduct(null);
    setForm(EMPTY_FORM);
  };

  const handleFormChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleImageUrlChange = (index, value) => {
    setForm((prev) => {
      const urls = [...prev.imageUrls];
      urls[index] = value;
      return { ...prev, imageUrls: urls };
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      tenProduct: form.tenProduct,
      moTa: form.moTa,
      giaBan: parseFloat(form.giaBan),
      giaGoc: form.giaGoc ? parseFloat(form.giaGoc) : null,
      soLuongTonKho: parseInt(form.soLuongTonKho),
      categoryId: parseInt(form.categoryId),
      brandId: parseInt(form.brandId),
      isFeatured: form.isFeatured,
      imageUrls: form.imageUrls.filter((u) => u && u.trim()),
    };
    if (editingProduct) {
      updateMutation.mutate({ id: editingProduct.idProduct, data: { ...payload, isEnabled: form.isEnabled } });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(0);
  };

  const handleDeleteClick = (product) => {
    setConfirmModal({
      isOpen: true,
      title: 'XÓA SẢN PHẨM',
      message: `Bạn có chắc chắn muốn xóa vĩnh viễn sản phẩm “${product.tenProduct}”? Hành động này không thể hoàn tác.`,
      type: 'danger',
      onConfirm: () => deleteMutation.mutate(product.idProduct)
    });
  };

  const allProducts = productsData?.content || [];
  const totalPages = productsData?.totalPages || 0;

  const filteredProducts = allProducts.filter((p) => {
    if (statusFilter === 'active') return p.isEnabled !== false;
    if (statusFilter === 'inactive') return p.isEnabled === false;
    return true;
  });

  const isMutating = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Global Confirm Modal */}
      <ConfirmModal 
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        type={confirmModal.type}
      />

      {/* Premium Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center text-orange-600 shadow-sm shadow-orange-100">
               <Package size={16} />
            </div>
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] italic">Kho vận & Sản phẩm</span>
          </div>
          <h1 className="text-4xl font-black text-gray-950 uppercase tracking-tighter italic leading-none">
            Quản lý <span className="text-orange-500 font-black not-italic">Sản phẩm</span>
          </h1>
          <p className="text-gray-500 mt-3 font-medium text-sm flex items-center gap-2">
            <Layers size={14} className="text-gray-300" />
            Đang quản lý <span className="text-gray-950 font-black italic underline decoration-orange-200">{productsData?.totalElements ?? 0}</span> mã hàng hóa trong hệ thống
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setImportModalOpen(true)}
            className="group flex items-center gap-2 px-5 py-3 bg-white border border-gray-100 text-gray-600 rounded-2xl hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200 focus-visible:ring-4 focus-visible:ring-emerald-200 outline-none transition-all duration-300 shadow-sm active:scale-95"
          >
            <div className="w-8 h-8 rounded-xl bg-gray-50 flex items-center justify-center group-hover:bg-emerald-100 transition-colors">
               <FileSpreadsheet size={18} />
            </div>
            <span className="text-[11px] font-black uppercase tracking-wider">Import Excel</span>
          </button>
          
          <button
            onClick={openAddModal}
            className="group flex items-center gap-3 px-6 py-3 bg-gray-950 text-white rounded-2xl hover:bg-orange-600 focus-visible:ring-4 focus-visible:ring-orange-200 outline-none transition-all duration-500 shadow-xl shadow-gray-200 active:scale-95 overflow-hidden relative"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
            <Plus size={20} className="group-hover:rotate-90 transition-transform duration-500" />
            <span className="text-[11px] font-black uppercase tracking-[0.1em] italic">Thêm sản phẩm mới</span>
          </button>
        </div>
      </div>

      {/* Control Center (Filters) */}
      <div className="bg-white/60 backdrop-blur-xl border border-white rounded-[2.5rem] p-6 shadow-[0_12px_40px_-12px_rgba(0,0,0,0.05)]">
        <div className="flex flex-col lg:flex-row gap-6 items-center">
          <form onSubmit={handleSearch} className="relative flex-1 w-full group">
            <Search size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-orange-500 transition-colors" />
            <input
              type="text"
              name="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Truy vấn kho hàng theo tên sản phẩm, mã vạch…"
              className="w-full pl-14 pr-6 py-4 bg-gray-50/50 border-none rounded-2xl focus:ring-4 focus:ring-orange-100 focus-visible:ring-4 focus-visible:ring-orange-200 outline-none transition-all text-sm font-medium placeholder:text-gray-400 placeholder:italic placeholder:font-medium"
            />
          </form>

          <div className="flex items-center gap-2 p-1.5 bg-gray-100/50 border border-gray-100 rounded-2xl shrink-0">
            {[
              { value: 'all', label: 'Tất cả', icon: Archive },
              { value: 'active', label: 'Đang bán', icon: Sparkles },
              { value: 'inactive', label: 'Đã ẩn', icon: EyeOff },
            ].map((opt) => (
              <button
                key={opt.value}
                onClick={() => setStatusFilter(opt.value)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${
                  statusFilter === opt.value
                    ? 'bg-white text-gray-900 shadow-md shadow-gray-200/50'
                    : 'text-gray-400 hover:text-gray-600'
                } focus-visible:ring-4 focus-visible:ring-orange-100 outline-none`}
              >
                <opt.icon size={12} className={statusFilter === opt.value ? 'text-orange-500' : ''} />
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Modern Data Table */}
      <div className="bg-white border border-gray-100 rounded-[2.5rem] shadow-[0_24px_48px_-12px_rgba(0,0,0,0.03)] overflow-hidden">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
             <div className="animate-spin rounded-full h-12 w-12 border-4 border-orange-100 border-t-orange-500" />
             <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest animate-pulse">Đang đồng bộ dữ liệu kho…</p>
          </div>
        ) : (
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100">
                  <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest italic text-[10px]">Hàng hóa & Mã số</th>
                  <th className="px-6 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest italic">Phân loại / Brand</th>
                  <th className="px-6 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest italic">Định giá bán</th>
                  <th className="px-6 py-6 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest italic">Tồn kho khả dụng</th>
                  <th className="px-6 py-6 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest italic">Trạng thái</th>
                  <th className="px-8 py-6 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest italic">Quản trị</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredProducts.map((product) => (
                  <tr key={product.idProduct} className={`group hover:bg-gray-50/80 transition-all duration-300 ${product.isEnabled === false ? 'opacity-50 grayscale-[0.5]' : ''}`}>
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-5">
                        <div className="relative group/thumb shrink-0">
                          {product.thumbnailUrl ? (
                            <img
                              src={product.thumbnailUrl}
                              alt={product.tenProduct}
                              width={64}
                              height={64}
                              className="w-16 h-16 object-cover rounded-2xl border border-gray-100 shadow-sm group-hover/thumb:scale-105 transition-transform duration-500"
                              onError={(e) => { e.target.style.display = 'none'; }}
                            />
                          ) : (
                            <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-300 border border-gray-100">
                              <Package size={24} />
                            </div>
                          )}
                          <div className={`absolute -top-1.5 -right-1.5 p-1 rounded-lg bg-white shadow-md border border-gray-50 ${product.isFeatured ? 'text-yellow-400 animate-bounce' : 'text-gray-200'}`}>
                             <Star size={12} fill={product.isFeatured ? 'currentColor' : 'none'} />
                          </div>
                        </div>
                        <div className="min-w-0">
                          <p className="font-black text-gray-900 text-[13px] uppercase tracking-tight truncate max-w-[200px] mb-1 group-hover:text-orange-600 transition-colors italic">{product.tenProduct}</p>
                          <div className="flex items-center gap-2 font-variant-numeric: tabular-nums">
                             <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded italic">OBJ: {product.idProduct}</span>
                             {product.isFeatured && (
                               <span className="text-[9px] font-black text-yellow-600 uppercase tracking-widest bg-yellow-50 px-1.5 py-0.5 rounded italic">Featured</span>
                             )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="inline-flex flex-col">
                        <span className="text-[11px] font-black text-gray-950 uppercase italic mb-1">{product.categoryName || 'Không xác định'}</span>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{product.brandName || 'O.E.M'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="font-variant-numeric: tabular-nums">
                        <p className="text-[14px] font-black text-gray-900 italic tracking-tighter">{formatPrice(product.giaBan)}</p>
                        {product.giaGoc && product.giaGoc > product.giaBan && (
                          <p className="text-[10px] text-gray-400 line-through font-bold opacity-60">{formatPrice(product.giaGoc)}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <div className="inline-flex flex-col items-center">
                        <div className={`text-sm font-black italic font-variant-numeric: tabular-nums ${
                          product.soLuongTonKho === 0 ? 'text-rose-600' :
                          product.soLuongTonKho < 10 ? 'text-orange-500' : 'text-emerald-600'
                        }`}>
                          {product.soLuongTonKho} <span className="text-[10px] uppercase font-bold not-italic ml-0.5">Unit</span>
                        </div>
                        {product.soLuongTonKho === 0 && (
                          <span className="text-[8px] font-black text-rose-500 uppercase tracking-widest mt-1 bg-rose-50 px-1.5 py-0.5 rounded whitespace-nowrap">Out of Stock</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <button
                        onClick={() => toggleEnabledMutation.mutate({ id: product.idProduct, isEnabled: !product.isEnabled })}
                        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest focus-visible:ring-4 outline-none transition-all ${
                          product.isEnabled !== false
                            ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white focus-visible:ring-emerald-200'
                            : 'bg-gray-100 text-gray-400 hover:bg-gray-800 hover:text-white focus-visible:ring-gray-200'
                        }`}
                      >
                        {product.isEnabled !== false ? (
                          <><ToggleRight size={14} /> HIỂN THỊ</>
                        ) : (
                          <><ToggleLeft size={14} /> TẠM ẨN</>
                        )}
                      </button>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity translate-x-4 group-hover:translate-x-0 duration-500">
                        <a
                          href={`/products/${product.idProduct}`}
                          target="_blank"
                          rel="noreferrer"
                          className="w-9 h-9 flex items-center justify-center bg-white text-gray-400 hover:bg-orange-50 hover:text-orange-600 rounded-xl border border-gray-100 focus-visible:ring-4 focus-visible:ring-orange-100 outline-none transition-all shadow-sm active:scale-95"
                          title="Xem trên Web"
                        >
                          <Eye size={16} />
                        </a>
                        <button
                          onClick={() => openEditModal(product)}
                          className="w-9 h-9 flex items-center justify-center bg-white text-blue-500 hover:bg-blue-600 hover:text-white rounded-xl border border-gray-100 focus-visible:ring-4 focus-visible:ring-blue-100 outline-none transition-all shadow-sm active:scale-95"
                          title="Hiệu chỉnh"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(product)}
                          disabled={deleteMutation.isPending}
                          className="w-9 h-9 flex items-center justify-center bg-white text-rose-400 hover:bg-rose-600 hover:text-white rounded-xl border border-gray-100 focus-visible:ring-4 focus-visible:ring-rose-200 outline-none transition-all shadow-sm active:scale-95 disabled:opacity-50"
                          title="Xóa vĩnh viễn"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!isLoading && filteredProducts.length === 0 && (
          <div className="flex flex-col items-center justify-center py-32 text-center opacity-40">
            <div className="w-20 h-20 rounded-[2rem] bg-gray-50 flex items-center justify-center mb-6 border border-gray-100">
               <Package size={40} className="text-gray-300" />
            </div>
            <p className="text-[11px] font-black text-gray-400 uppercase tracking-[0.3em] italic">Dữ liệu kho hàng trống</p>
          </div>
        )}
      </div>

      {/* Premium Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 py-6">
          <button
            onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
            disabled={currentPage === 0}
            className="w-12 h-12 flex items-center justify-center bg-white border border-gray-100 rounded-2xl text-gray-400 hover:bg-gray-950 hover:text-white transition-all focus-visible:ring-4 focus-visible:ring-gray-200 outline-none disabled:opacity-30 active:scale-90"
          >
            <ChevronLeft size={20} />
          </button>
          
          <div className="flex items-center gap-2 p-1.5 bg-white border border-gray-100 rounded-[1.5rem] shadow-sm font-variant-numeric: tabular-nums">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const start = Math.max(0, Math.min(currentPage - 2, totalPages - 5));
              const page = start + i;
              if (page < 0 || page >= totalPages) return null;
              return (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-9 h-9 rounded-xl text-xs font-black transition-all outline-none focus-visible:ring-4 focus-visible:ring-orange-100 ${
                    page === currentPage
                      ? 'bg-orange-500 text-white shadow-lg shadow-orange-200'
                      : 'text-gray-400 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  {page + 1}
                </button>
              );
            })}
          </div>

          <button
            onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
            disabled={currentPage >= totalPages - 1}
            className="w-12 h-12 flex items-center justify-center bg-white border border-gray-100 rounded-2xl text-gray-400 hover:bg-gray-950 hover:text-white transition-all focus-visible:ring-4 focus-visible:ring-gray-200 outline-none disabled:opacity-30 active:scale-90"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      )}

      {/* Premium Product Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-950/60 backdrop-blur-sm animate-in fade-in duration-500" onClick={closeModal} />
          <div className="relative bg-white/95 backdrop-blur-2xl rounded-[3rem] border border-white shadow-[0_40px_120px_-20px_rgba(0,0,0,0.3)] w-full max-w-4xl max-h-[92vh] overflow-hidden flex flex-col animate-in slide-in-from-bottom-12 duration-700">
            
            <div className="flex items-center justify-between px-8 py-6 shrink-0 bg-gradient-to-b from-white/50 to-transparent">
              <div>
                 <div className="flex items-center gap-2 mb-1">
                    <Sparkles size={12} className="text-orange-500" />
                    <span className="text-[8px] font-black text-gray-400 uppercase tracking-[0.3em] italic leading-none">Cơ sở dữ liệu sản phẩm</span>
                 </div>
                 <h2 className="text-2xl font-black text-gray-950 uppercase tracking-tighter italic leading-none text-balance">
                   {editingProduct ? 'Chỉnh sửa' : 'Tạo mới'} <span className="text-orange-500 font-black not-italic">Sản phẩm</span>
                 </h2>
              </div>
              <button 
                onClick={closeModal} 
                className="w-10 h-10 flex items-center justify-center bg-gray-50 text-gray-400 hover:bg-gray-950 hover:text-white focus-visible:ring-4 focus-visible:ring-gray-200 outline-none rounded-xl transition-all duration-300 active:scale-90"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto custom-scrollbar px-8 py-2 space-y-8">
              <section className="space-y-4">
                <div className="flex items-center gap-3">
                   <div className="h-0.5 flex-1 bg-gray-100" />
                   <span className="text-[9px] font-black text-gray-300 uppercase tracking-widest italic leading-none">Thông tin cơ bản</span>
                   <div className="h-0.5 flex-1 bg-gray-100" />
                </div>
                <div className="grid grid-cols-1 gap-4">
                  <div className="group">
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest italic mb-1.5 px-1 font-black italic uppercase">Tên hàng hóa <span className="text-orange-500">*</span></label>
                    <input
                      type="text"
                      name="tenProduct"
                      value={form.tenProduct}
                      onChange={(e) => handleFormChange('tenProduct', e.target.value)}
                      required
                      placeholder="VD: Thức ăn hạt Reflex Plus cho Mèo trưởng thành..."
                      className="w-full px-5 py-3.5 bg-gray-50 border border-gray-100 rounded-xl focus:bg-white focus-visible:ring-4 focus-visible:ring-orange-100 outline-none transition-all text-sm font-black text-gray-950 placeholder:font-medium placeholder:italic placeholder:text-gray-300 italic"
                    />
                  </div>
                  
                  <div className="group">
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest italic mb-1.5 px-1 font-black uppercase">Mô tả sản phẩm <span className="text-orange-500">*</span></label>
                    <textarea
                      name="moTa"
                      value={form.moTa}
                      onChange={(e) => handleFormChange('moTa', e.target.value)}
                      required
                      rows={3}
                      placeholder="Nhập đặc điểm, công dụng, thành phần…"
                      className="w-full px-5 py-3.5 bg-gray-50 border border-gray-100 rounded-xl focus:bg-white focus-visible:ring-4 focus-visible:ring-orange-100 outline-none transition-all text-sm font-medium text-gray-900 resize-none placeholder:italic placeholder:text-gray-300 shadow-inner italic"
                    />
                  </div>
                </div>
              </section>

              <section className="space-y-4">
                <div className="flex items-center gap-3">
                   <div className="h-0.5 flex-1 bg-gray-100" />
                   <span className="text-[9px] font-black text-gray-300 uppercase tracking-widest italic leading-none font-black italic">Định giá & Phân hạng</span>
                   <div className="h-0.5 flex-1 bg-gray-100" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest italic mb-1.5 px-1 font-black">Giá bán hiện tại (VNĐ) <span className="text-orange-500 font-black italic">*</span></label>
                    <div className="relative">
                      <input
                        type="number"
                        name="giaBan"
                        value={form.giaBan}
                        onChange={(e) => handleFormChange('giaBan', e.target.value)}
                        required
                        min="1"
                        className="w-full pl-6 pr-14 py-3.5 bg-gray-50 border border-gray-100 rounded-xl focus:bg-white focus-visible:ring-4 focus-visible:ring-orange-100 outline-none transition-all text-[14px] font-black italic tracking-tighter text-gray-950 font-variant-numeric: tabular-nums"
                      />
                      <span className="absolute right-5 top-1/2 -translate-y-1/2 text-[9px] font-black text-gray-400 uppercase">VND</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest italic mb-1.5 px-1 font-black uppercase italic">Giá niêm yết/Gốc</label>
                    <div className="relative">
                       <input
                        type="number"
                        name="giaGoc"
                        value={form.giaGoc}
                        onChange={(e) => handleFormChange('giaGoc', e.target.value)}
                        min="1"
                        className="w-full pl-6 pr-14 py-3.5 bg-gray-50 border border-gray-100 rounded-xl focus:bg-white focus-visible:ring-4 focus-visible:ring-gray-100 outline-none transition-all text-sm font-bold text-gray-400 font-variant-numeric: tabular-nums italic"
                      />
                      <span className="absolute right-5 top-1/2 -translate-y-1/2 text-[9px] font-black text-gray-300 uppercase italic">NIÊM YẾT</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-black">
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest italic mb-1.5 px-1 uppercase italic">Số lượng tồn <span className="text-orange-500">*</span></label>
                    <input
                      type="number"
                      name="soLuongTonKho"
                      value={form.soLuongTonKho}
                      onChange={(e) => handleFormChange('soLuongTonKho', e.target.value)}
                      required
                      min="0"
                      className="w-full px-5 py-3.5 bg-gray-50 border border-gray-100 rounded-xl focus:bg-white focus-visible:ring-4 focus-visible:ring-orange-100 outline-none transition-all text-sm font-black italic text-gray-950"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest italic mb-1.5 px-1 uppercase italic">Danh mục <span className="text-orange-500 font-black italic">*</span></label>
                    <select
                      name="categoryId"
                      value={form.categoryId}
                      onChange={(e) => handleFormChange('categoryId', e.target.value)}
                      required
                      className="w-full px-5 py-3.5 bg-gray-50 border border-gray-100 rounded-xl focus:bg-white focus-visible:ring-4 focus-visible:ring-orange-100 outline-none transition-all text-[11px] font-black uppercase text-gray-950 appearance-none cursor-pointer italic"
                    >
                      <option value="">-- Chọn --</option>
                      {categories.map((c) => (
                        <option key={c.idCategory} value={c.idCategory}>{c.tenCategory}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest italic mb-1.5 px-1 font-black italic">Thương hiệu <span className="text-orange-500">*</span></label>
                    <select
                      name="brandId"
                      value={form.brandId}
                      onChange={(e) => handleFormChange('brandId', e.target.value)}
                      required
                      className="w-full px-5 py-3.5 bg-gray-50 border border-gray-100 rounded-xl focus:bg-white focus-visible:ring-4 focus-visible:ring-orange-100 outline-none transition-all text-[11px] font-black uppercase text-gray-950 appearance-none cursor-pointer italic"
                    >
                      <option value="">-- Chọn --</option>
                      {brands.map((b) => (
                        <option key={b.idBrand} value={b.idBrand}>{b.tenBrand}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </section>

              <section className="bg-gray-50/80 p-5 rounded-[1.5rem] border border-gray-100 flex flex-wrap items-center gap-8 justify-center">
                <label className="flex items-center gap-3 cursor-pointer group outline-none focus-visible:ring-4 focus-visible:ring-orange-100 rounded-xl p-1">
                  <div className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all ${
                    form.isFeatured ? 'bg-orange-500 border-orange-500 text-white' : 'border-gray-200 group-hover:border-orange-500'
                  }`}>
                    {form.isFeatured && <Star size={12} fill="currentColor" />}
                  </div>
                  <input
                    type="checkbox"
                    className="hidden"
                    checked={form.isFeatured}
                    onChange={(e) => handleFormChange('isFeatured', e.target.checked)}
                  />
                  <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest group-hover:text-gray-950 transition-colors italic">Nổi bật</span>
                </label>

                {editingProduct && (
                   <label className="flex items-center gap-3 cursor-pointer group outline-none focus-visible:ring-4 focus-visible:ring-emerald-100 rounded-xl p-1">
                    <div className={`w-10 h-5 rounded-full relative transition-all duration-300 ${
                      form.isEnabled ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.3)]' : 'bg-gray-300'
                    }`}>
                       <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all duration-300 ${
                         form.isEnabled ? 'left-[22px]' : 'left-0.5'
                       }`} />
                    </div>
                    <input
                      type="checkbox"
                      className="hidden"
                      checked={form.isEnabled}
                      onChange={(e) => handleFormChange('isEnabled', e.target.checked)}
                    />
                    <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest group-hover:text-gray-950 transition-colors italic">Kích hoạt</span>
                  </label>
                )}
              </section>

              <section className="space-y-4">
                <div className="flex items-center gap-3">
                   <div className="h-0.5 flex-1 bg-gray-100" />
                   <span className="text-[9px] font-black text-gray-300 uppercase tracking-widest italic leading-none">Thư viện hình ảnh</span>
                   <div className="h-0.5 flex-1 bg-gray-100" />
                </div>
                
                <div className="grid grid-cols-1 gap-3">
                  {form.imageUrls.map((url, index) => (
                    <div key={index} className="flex items-stretch gap-3 group/img">
                      <div className="w-16 shrink-0 flex flex-col justify-center gap-0.5">
                         <span className="text-[9px] font-black text-gray-400 uppercase italic tracking-tighter">Img {index + 1}</span>
                         {index === 0 && <span className="text-[8px] font-black text-white bg-orange-500 px-1.5 py-0.5 rounded-md italic shadow-sm shadow-orange-100 uppercase scale-90 origin-left">Primary</span>}
                      </div>
                        <div className="flex-1 relative">
                          <input
                            type="url"
                            name={`imageUrl-${index}`}
                            value={url}
                            onChange={(e) => handleImageUrlChange(index, e.target.value)}
                            placeholder={`URL hình ảnh ${index + 1}…`}
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:bg-white focus-visible:ring-4 focus-visible:ring-orange-100 outline-none transition-all text-[11px] font-black italic"
                          />
                        </div>
                      <div className="w-14 h-11 bg-gray-50 rounded-xl border border-gray-100 overflow-hidden flex items-center justify-center shrink-0 shadow-inner group-hover/img:scale-105 transition-transform duration-300">
                        {url ? (
                          <img
                            src={url}
                            alt=""
                            width={56}
                            height={44}
                            className="w-full h-full object-cover"
                            onError={(e) => { e.target.style.display = 'none'; }}
                          />
                        ) : (
                          <ImagePlus size={14} className="text-gray-200" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </form>

            <div className="px-8 py-6 bg-white border-t border-gray-100 flex items-center justify-end gap-3 shrink-0">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-6 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-gray-950 focus-visible:ring-4 focus-visible:ring-gray-100 outline-none transition-colors active:scale-95 italic"
                >
                  Bỏ qua
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isMutating}
                  className="px-8 py-4 bg-gray-950 text-white rounded-[1.2rem] text-[11px] font-black uppercase tracking-[0.1em] italic hover:bg-orange-600 focus-visible:ring-4 focus-visible:ring-orange-500 outline-none transition-all duration-300 shadow-lg active:scale-95 disabled:opacity-50 relative group/btn"
                >
                   {isMutating ? (
                     <div className="flex items-center gap-2">
                       <LoadingSpinner size="sm" /> <span>Đang lưu…</span>
                     </div>
                   ) : (
                     <div className="flex items-center gap-2">
                       {editingProduct ? 'Cập nhật kho' : 'Niêm yết ngay'} <ArrowRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />
                     </div>
                   )}
                </button>
            </div>
          </div>
        </div>
      )}

      <ExcelImportModal
        isOpen={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        onImportSuccess={() => queryClient.invalidateQueries(['admin-products'])}
      />

      <style jsx="true">{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
          height: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #f1f1f1;
          border-radius: 20px;
        }
        .custom-scrollbar:hover::-webkit-scrollbar-thumb {
          background: #e2e2e2;
        }
        
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes zoom-in-95 {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .animate-in {
          animation-fill-mode: forwards;
        }
        .fade-in {
          animation-name: fade-in;
        }
        .zoom-in-95 {
          animation-name: zoom-in-95;
        }
      `}</style>
    </div>
  );
}
