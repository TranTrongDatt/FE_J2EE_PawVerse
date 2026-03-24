import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit, Trash2, FolderTree, X, Sparkles, ImagePlus, ArrowRight, Layers, LayoutGrid, Zap } from 'lucide-react';
import { adminService } from '../../api/adminService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';

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
          <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tighter leading-tight mb-4">{title}</h3>
          <div className="bg-gray-50/80 rounded-2xl p-4 mb-8 border border-gray-100 text-[11px] font-bold text-gray-600 italic leading-relaxed">
            {message}
          </div>
          <div className="grid grid-cols-2 gap-3">
             <button onClick={onClose} className="py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-gray-600 hover:bg-gray-50 focus-visible:ring-4 focus-visible:ring-gray-100 outline-none transition-all">Hủy bỏ</button>
             <button onClick={() => { onConfirm(); onClose(); }} className={`py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white shadow-xl focus-visible:ring-4 ${type === 'danger' ? 'bg-rose-600 focus-visible:ring-rose-200 hover:bg-rose-700' : 'bg-gray-950 focus-visible:ring-gray-200 hover:bg-orange-600'} outline-none transition-all active:scale-95 shadow-xl`}>Xác nhận</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CategoryManagementPage() {
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({ tenCategory: '', moTa: '', hinhAnh: '', trangThai: 'Hoạt động' });
  
  // Confirmation state
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', onConfirm: null, type: 'danger' });

  const queryClient = useQueryClient();

  const { data: categories, isLoading } = useQuery({
    queryKey: ['admin-categories'],
    queryFn: adminService.getAllCategories,
  });

  const createMutation = useMutation({
    mutationFn: (data) => adminService.createCategory(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-categories']);
      toast.success('DANH MỤC ĐÃ ĐƯỢC NIÊM YẾT!', {
        icon: '📁',
        style: { borderRadius: '15px', background: '#111', color: '#fff', fontSize: '11px', fontWeight: 'bold' }
      });
      handleCloseModal();
    },
    onError: () => toast.error('Không thể tạo danh mục'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => adminService.updateCategory(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-categories']);
      toast.success('CẬP NHẬT DANH MỤC THÀNH CÔNG!', {
        icon: '🔄',
        style: { borderRadius: '15px', background: '#111', color: '#fff', fontSize: '11px', fontWeight: 'bold' }
      });
      handleCloseModal();
    },
    onError: () => toast.error('Không thể cập nhật danh mục'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => adminService.deleteCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-categories']);
      toast.success('ĐÃ XÓA DANH MỤC KHỎI HỆ THỐNG!', {
        icon: '🗑️',
        style: { borderRadius: '15px', background: '#111', color: '#fff', fontSize: '11px', fontWeight: 'bold' }
      });
    },
    onError: () => toast.error('Không thể xóa danh mục do có sản phẩm liên kết'),
  });

  const handleOpenModal = (category = null) => {
    if (category) {
      setEditingCategory(category);
      setFormData({
        tenCategory: category.tenCategory,
        moTa: category.moTa || '',
        hinhAnh: category.hinhAnh || '',
        trangThai: category.trangThai || 'Hoạt động',
      });
    } else {
      setEditingCategory(null);
      setFormData({ tenCategory: '', moTa: '', hinhAnh: '', trangThai: 'Hoạt động' });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingCategory(null);
    setFormData({ tenCategory: '', moTa: '', hinhAnh: '', trangThai: 'Hoạt động' });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingCategory) {
      updateMutation.mutate({ id: editingCategory.idCategory, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDelete = (category) => {
    setConfirmModal({
      isOpen: true,
      title: 'XÓA DANH MỤC',
      message: `Bạn có chắc chắn muốn xóa danh mục “${category.tenCategory}”? Hành động này không thể hoàn tác nếu danh mục không có sản phẩm.`,
      type: 'danger',
      onConfirm: () => deleteMutation.mutate(category.idCategory)
    });
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4">
         <div className="animate-spin rounded-full h-12 w-12 border-4 border-orange-100 border-t-orange-500" />
         <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest animate-pulse italic">Đang tải cấu trúc danh mục...</p>
      </div>
    );
  }

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
               <LayoutGrid size={16} />
            </div>
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] italic">Cấu trúc & Phân loại</span>
          </div>
          <h1 className="text-4xl font-black text-gray-950 uppercase tracking-tighter italic leading-none">
            Quản lý <span className="text-orange-500 font-black not-italic">Danh mục</span>
          </h1>
          <p className="text-gray-500 mt-3 font-medium text-sm flex items-center gap-2">
            <Layers size={14} className="text-gray-300" />
            Đang quản lý <span className="text-gray-950 font-black italic underline decoration-orange-200">{categories?.length ?? 0}</span> danh mục chính
          </p>
        </div>

        <button
          onClick={() => handleOpenModal()}
          className="group flex items-center gap-3 px-6 py-3 bg-gray-950 text-white rounded-2xl hover:bg-orange-600 focus-visible:ring-4 focus-visible:ring-orange-200 outline-none transition-all duration-500 shadow-xl shadow-gray-200 active:scale-95 overflow-hidden relative"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
          <Plus size={20} className="group-hover:rotate-90 transition-transform duration-500" />
          <span className="text-[11px] font-black uppercase tracking-[0.1em] italic">Thêm danh mục mới</span>
        </button>
      </div>

      {/* Categories Grid - Optimized PRO MAX */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories?.map((category) => (
          <div key={category.idCategory} className="group bg-white rounded-[2.5rem] border border-gray-100 p-6 hover:shadow-[0_32px_64px_-16px_rgba(0,0,0,0.06)] hover:border-orange-100 transition-all duration-500 relative overflow-hidden">
            {/* Background Decoration */}
            <div className="absolute -right-4 -bottom-4 text-gray-50 opacity-0 group-hover:opacity-100 group-hover:scale-110 transition-all duration-700 -rotate-12 pointer-events-none">
               <FolderTree size={160} />
            </div>

            <div className="flex items-start justify-between mb-6 relative z-10">
              <div className="w-16 h-16 bg-gray-50 rounded-[1.5rem] flex items-center justify-center overflow-hidden border border-gray-100 group-hover:border-orange-200 group-hover:scale-105 transition-all duration-500 shadow-inner">
                {category.hinhAnh ? (
                  <img src={category.hinhAnh} alt={category.tenCategory} width={64} height={64} className="w-full h-full object-cover" />
                ) : (
                  <FolderTree className="text-gray-300 group-hover:text-orange-500 transition-colors" size={28} />
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleOpenModal(category)}
                  className="w-9 h-9 flex items-center justify-center bg-white text-blue-500 hover:bg-blue-600 hover:text-white focus-visible:ring-4 focus-visible:ring-blue-100 outline-none rounded-xl border border-gray-100 transition-all shadow-sm active:scale-95"
                  title="Hiệu chỉnh"
                >
                  <Edit size={16} />
                </button>
                <button
                  onClick={() => handleDelete(category)}
                  disabled={deleteMutation.isPending}
                  className="w-9 h-9 flex items-center justify-center bg-white text-rose-500 hover:bg-rose-600 hover:text-white focus-visible:ring-4 focus-visible:ring-rose-100 outline-none rounded-xl border border-gray-100 transition-all shadow-sm active:scale-95 disabled:opacity-50"
                  title="Gỡ bỏ"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>

            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-[17px] font-black text-gray-900 uppercase tracking-tight group-hover:text-orange-600 transition-colors italic leading-tight">{category.tenCategory}</h3>
                <span className={`text-[9px] px-2 py-0.5 rounded-lg font-black uppercase tracking-widest italic ${
                  category.trangThai === 'Hoạt động' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                }`}>
                  {category.trangThai}
                </span>
              </div>
              <p className="text-gray-400 text-[11px] font-medium italic line-clamp-2 min-h-[32px] leading-relaxed">
                {category.moTa || 'Không có mô tả chi tiết cho danh mục này.'}
              </p>
              
              <div className="mt-6 pt-5 border-t border-gray-50 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                   <LayoutGrid size={14} className="text-gray-300" />
                   <span className="text-[11px] font-black text-gray-900 italic font-variant-numeric: tabular-nums">
                     {category.productCount || 0} <span className="text-[10px] text-gray-400 uppercase font-bold not-italic ml-0.5 tracking-tighter">Products</span>
                   </span>
                </div>
                <div className="text-[9px] font-black text-gray-300 uppercase italic tracking-widest">ID: {category.idCategory}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {categories?.length === 0 && (
        <div className="bg-white/60 backdrop-blur-xl rounded-[3rem] border border-gray-100 py-32 text-center shadow-sm">
          <div className="w-24 h-24 rounded-[2.5rem] bg-gray-50 flex items-center justify-center mx-auto mb-6 border border-gray-100">
             <FolderTree size={40} className="text-gray-300" />
          </div>
          <p className="text-[11px] font-black text-gray-400 uppercase tracking-[0.3em] italic leading-none">Cơ sở dữ liệu danh mục trống</p>
        </div>
      )}

      {/* Premium UI Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-950/60 backdrop-blur-sm animate-in fade-in duration-500" onClick={handleCloseModal} />
          <div className="relative bg-white/95 backdrop-blur-2xl rounded-[3rem] border border-white shadow-[0_40px_120px_-20px_rgba(0,0,0,0.3)] w-full max-w-lg overflow-hidden flex flex-col animate-in slide-in-from-bottom-12 duration-700">
            
            <div className="flex items-center justify-between px-8 py-6 shrink-0 bg-gradient-to-b from-white/50 to-transparent">
              <div>
                 <div className="flex items-center gap-2 mb-1">
                    <Sparkles size={12} className="text-orange-500" />
                    <span className="text-[8px] font-black text-gray-400 uppercase tracking-[0.3em] italic leading-none">Hành động thực thi</span>
                 </div>
                 <h2 className="text-2xl font-black text-gray-950 uppercase tracking-tighter italic leading-none">
                   {editingCategory ? 'Chỉnh sửa' : 'Thêm mới'} <span className="text-orange-500 font-black not-italic">Danh mục</span>
                 </h2>
              </div>
              <button 
                onClick={handleCloseModal} 
                className="w-10 h-10 flex items-center justify-center bg-gray-50 text-gray-400 hover:bg-gray-950 hover:text-white focus-visible:ring-4 focus-visible:ring-gray-200 outline-none rounded-xl transition-all duration-300 active:scale-90"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 pt-2 space-y-6 overflow-y-auto max-h-[70vh] custom-scrollbar">
              <div className="space-y-5">
                <div className="group">
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest italic mb-1.5 px-1">Tên danh mục <span className="text-orange-500 font-black italic">*</span></label>
                  <input
                    type="text"
                    name="tenCategory"
                    value={formData.tenCategory}
                    onChange={(e) => setFormData({ ...formData, tenCategory: e.target.value })}
                    required
                    placeholder="VD: Thức ăn cho Chó, Phụ kiện Mèo..."
                    className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:bg-white focus-visible:ring-4 focus-visible:ring-orange-100 outline-none transition-all text-sm font-black text-gray-950 placeholder:font-medium placeholder:italic placeholder:text-gray-300 italic"
                  />
                </div>

                <div className="group">
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest italic mb-1.5 px-1 font-black">Mô tả tóm tắt</label>
                  <textarea
                    name="moTa"
                    value={formData.moTa}
                    onChange={(e) => setFormData({ ...formData, moTa: e.target.value })}
                    rows={3}
                    placeholder="Nhập vài dòng mô tả cho danh mục này..."
                    className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:bg-white focus-visible:ring-4 focus-visible:ring-orange-100 outline-none transition-all text-sm font-medium text-gray-900 resize-none placeholder:italic placeholder:text-gray-300 shadow-inner italic"
                  />
                </div>

                <div className="group">
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest italic mb-1.5 px-1 font-black italic">Hình ảnh minh họa (URL)</label>
                  <div className="flex gap-3">
                    <div className="flex-1 relative">
                      <input
                        type="text"
                        value={formData.hinhAnh}
                        onChange={(e) => setFormData({ ...formData, hinhAnh: e.target.value })}
                        placeholder="URL hình ảnh từ Cloudinary/Firebase..."
                        className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:bg-white focus:ring-4 focus:ring-orange-100 transition-all text-[11px] font-medium italic"
                      />
                    </div>
                    <div className="w-14 h-14 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-center shrink-0 overflow-hidden shadow-inner font-black">
                      {formData.hinhAnh ? (
                        <img src={formData.hinhAnh} alt="" width={56} height={56} className="w-full h-full object-cover" />
                      ) : (
                        <ImagePlus size={18} className="text-gray-200" />
                      )}
                    </div>
                  </div>
                </div>

                <div className="group font-black uppercase italic">
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest italic mb-1.5 px-1">Trạng thái vận hành</label>
                  <select
                    name="trangThai"
                    value={formData.trangThai}
                    onChange={(e) => setFormData({ ...formData, trangThai: e.target.value })}
                    className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:bg-white focus-visible:ring-4 focus-visible:ring-orange-100 outline-none transition-all text-[11px] font-black uppercase text-gray-950 appearance-none cursor-pointer italic"
                  >
                    <option value="Hoạt động">HOẠT ĐỘNG BÌNH THƯỜNG</option>
                    <option value="Ngưng hoạt động">TẠM NGƯNG KINH DOANH</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-4 font-black italic uppercase">
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="flex-1 py-4 bg-gray-950 text-white rounded-[1.5rem] text-[11px] font-black uppercase tracking-[0.1em] italic hover:bg-orange-600 focus-visible:ring-4 focus-visible:ring-orange-500 outline-none transition-all duration-300 shadow-xl active:scale-95 disabled:opacity-50 group/btn"
                >
                  <div className="flex items-center justify-center gap-2">
                    {createMutation.isPending || updateMutation.isPending
                      ? 'Đang thực thi lệnh...'
                      : editingCategory
                      ? 'Lưu thay đổi'
                      : 'Xác nhận tạo danh mục'}
                    <ArrowRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />
                  </div>
                </button>
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-gray-950 focus-visible:ring-4 focus-visible:ring-gray-100 outline-none transition-colors active:scale-95 italic font-black"
                >
                  Hủy bỏ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
