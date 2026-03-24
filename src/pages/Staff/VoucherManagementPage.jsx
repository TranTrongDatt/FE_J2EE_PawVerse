import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Ticket, Plus, Pencil, Trash2, ToggleLeft, ToggleRight,
  ChevronLeft, ChevronRight, X, Search, Sparkles, ArrowRight, Zap, Target, Shield, Clock, Gift, Percent, CreditCard, Ship
} from 'lucide-react';
import { adminService } from '../../api/adminService';
import toast from 'react-hot-toast';

const VOUCHER_TYPES = [
  { value: 'PERCENTAGE', label: 'Giảm theo %', icon: Percent },
  { value: 'FIXED_AMOUNT', label: 'Giảm cố định', icon: CreditCard },
  { value: 'FREE_SHIPPING', label: 'Miễn phí vận chuyển', icon: Ship },
];

const STATUS_CONFIG = {
  ACTIVE: { bg: 'bg-emerald-50', border: 'border-emerald-100', text: 'text-emerald-600', label: 'Đang hoạt động' },
  INACTIVE: { bg: 'bg-gray-50', border: 'border-gray-100', text: 'text-gray-500', label: 'Vô hiệu' },
  UPCOMING: { bg: 'bg-blue-50', border: 'border-blue-100', text: 'text-blue-600', label: 'Sắp áp dụng' },
  EXPIRED: { bg: 'bg-rose-50', border: 'border-rose-100', text: 'text-rose-600', label: 'Hết hạn' },
  EXHAUSTED: { bg: 'bg-orange-50', border: 'border-orange-100', text: 'text-orange-600', label: 'Hết lượt' },
};

const emptyForm = {
  maVoucher: '',
  tenVoucher: '',
  moTa: '',
  voucherType: 'PERCENTAGE',
  discountValue: '',
  discountPercentage: '',
  maxDiscountAmount: '',
  minOrderAmount: '',
  maxUsage: '',
  ngayBatDau: '',
  ngayKetThuc: '',
  isFirstTimeOnly: false,
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
          <div className={`w-20 h-20 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-xl ${type === 'danger' ? 'bg-rose-50 text-rose-500 shadow-rose-100' : 'bg-emerald-50 text-emerald-500 shadow-emerald-100'}`}>
            {type === 'danger' ? <Trash2 size={36} /> : <Zap size={36} className="animate-pulse" />}
          </div>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.4em] mb-2 italic">Hệ thống Chiến dịch PawVerse</p>
          <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tighter leading-tight mb-4">{title}</h3>
          <div className="bg-gray-50/80 rounded-2xl p-4 mb-8 border border-gray-100 text-[11px] font-bold text-gray-600 italic leading-relaxed">
            {message}
          </div>
          <div className="grid grid-cols-2 gap-3">
             <button onClick={onClose} className="py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-gray-600 hover:bg-gray-50 focus-visible:ring-4 focus-visible:ring-gray-100 outline-none transition-all font-black">Hủy bỏ</button>
             <button onClick={() => { onConfirm(); onClose(); }} className={`py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white shadow-xl focus-visible:ring-4 transition-all active:scale-95 outline-none ${type === 'danger' ? 'bg-rose-600 focus-visible:ring-rose-200 shadow-rose-200 hover:bg-rose-700' : 'bg-emerald-600 focus-visible:ring-emerald-200 shadow-emerald-200 hover:bg-emerald-700'}`}>Xác nhận</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function VoucherManagementPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  
  // Confirmation state
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', onConfirm: null, type: 'danger' });

  const { data, isLoading } = useQuery({
    queryKey: ['staff-vouchers', page],
    queryFn: () => adminService.getAllVouchers({ page, size: 10 }),
  });

  const vouchers = data?.content || [];
  const totalPages = data?.totalPages || 0;
  const totalElements = data?.totalElements || 0;

  const createMutation = useMutation({
    mutationFn: (data) => adminService.createVoucher(data),
    onSuccess: () => {
      toast.success('CHIẾN DỊCH ƯU ĐÃI ĐÃ KÍCH HOẠT!', {
        icon: '🎁',
        style: { borderRadius: '15px', background: '#111', color: '#fff', fontSize: '11px', fontWeight: 'bold' }
      });
      queryClient.invalidateQueries({ queryKey: ['staff-vouchers'] });
      closeModal();
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Lỗi khi tạo voucher'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => adminService.updateVoucher(id, data),
    onSuccess: () => {
      toast.success('CẬP NHẬT THÔNG TIN VOUCHER THÀNH CÔNG!', {
        icon: '🔄',
        style: { borderRadius: '15px', background: '#111', color: '#fff', fontSize: '11px', fontWeight: 'bold' }
      });
      queryClient.invalidateQueries({ queryKey: ['staff-vouchers'] });
      closeModal();
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Lỗi khi cập nhật'),
  });

  const toggleMutation = useMutation({
    mutationFn: (id) => adminService.toggleVoucherActive(id),
    onSuccess: () => {
      toast.success('ĐÃ THAY ĐỔI TRẠNG THÁI VẬN HÀNH!', {
        icon: '⚡',
        style: { borderRadius: '15px', background: '#111', color: '#fff', fontSize: '11px', fontWeight: 'bold' }
      });
      queryClient.invalidateQueries({ queryKey: ['staff-vouchers'] });
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Lỗi'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => adminService.deleteVoucher(id),
    onSuccess: () => {
      toast.success('ĐÃ THU HỒI VOUCHER KHỎI HỆ THỐNG!', {
        icon: '🗑️',
        style: { borderRadius: '15px', background: '#111', color: '#fff', fontSize: '11px', fontWeight: 'bold' }
      });
      queryClient.invalidateQueries({ queryKey: ['staff-vouchers'] });
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Không thể xóa voucher'),
  });

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEdit = (v) => {
    setEditingId(v.idVoucher);
    setForm({
      maVoucher: v.maVoucher,
      tenVoucher: v.tenVoucher,
      moTa: v.moTa || '',
      voucherType: v.voucherType,
      discountValue: v.discountValue || '',
      discountPercentage: v.discountPercentage || '',
      maxDiscountAmount: v.maxDiscountAmount || '',
      minOrderAmount: v.minOrderAmount || '',
      maxUsage: v.maxUsage || '',
      ngayBatDau: v.ngayBatDau || '',
      ngayKetThuc: v.ngayKetThuc || '',
      isFirstTimeOnly: v.isFirstTimeOnly || false,
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
    setForm(emptyForm);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      ...form,
      discountValue: form.discountValue ? Number(form.discountValue) : null,
      discountPercentage: form.discountPercentage ? Number(form.discountPercentage) : null,
      maxDiscountAmount: form.maxDiscountAmount ? Number(form.maxDiscountAmount) : null,
      minOrderAmount: form.minOrderAmount ? Number(form.minOrderAmount) : null,
      maxUsage: form.maxUsage ? Number(form.maxUsage) : null,
    };

    if (editingId) {
      updateMutation.mutate({ id: editingId, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleDelete = (v) => {
    setConfirmModal({
      isOpen: true,
      title: 'THU HỒI VOUCHER',
      message: `Bạn có chắc chắn muốn xóa mã "${v.maVoucher}"? Hành động này sẽ khiến khách hàng không thể áp dụng mã này nữa.`,
      type: 'danger',
      onConfirm: () => deleteMutation.mutate(v.idVoucher)
    });
  };

  const formatCurrency = (val) => {
    if (!val && val !== 0) return '—';
    return Number(val).toLocaleString('vi-VN') + 'đ';
  };

  const formatDate = (d) => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('vi-VN');
  };

  const formatDiscount = (v) => {
    if (v.voucherType === 'PERCENTAGE') return `${v.discountPercentage}%`;
    if (v.voucherType === 'FIXED_AMOUNT') return formatCurrency(v.discountValue);
    return 'Miễn phí Ship';
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4">
         <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-100 border-t-emerald-600" />
         <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest animate-pulse italic">Đang truy xuất kho ưu đãi...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700 font-black italic">
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
            <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600 shadow-sm shadow-emerald-100">
               <Ticket size={16} />
            </div>
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] italic leading-none">Khuyến mãi & Tri ân</span>
          </div>
          <h1 className="text-4xl font-black text-gray-950 uppercase tracking-tighter italic leading-none">
            Quản lý <span className="text-emerald-600 font-black not-italic">Voucher</span>
          </h1>
          <p className="text-gray-500 mt-3 font-medium text-sm flex items-center gap-2">
            <Gift size={14} className="text-gray-300" />
            Đang vận hành <span className="text-gray-950 font-black italic underline decoration-emerald-200">{totalElements}</span> chiến dịch giảm giá
          </p>
        </div>

        <button
          onClick={openCreate}
          className="group flex items-center gap-3 px-6 py-3 bg-gray-950 text-white rounded-2xl hover:bg-emerald-600 focus-visible:ring-4 focus-visible:ring-emerald-200 outline-none transition-all duration-500 shadow-xl shadow-gray-200 active:scale-95 overflow-hidden relative"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
          <Plus size={20} className="group-hover:rotate-90 transition-transform duration-500" />
          <span className="text-[11px] font-black uppercase tracking-[0.1em] italic">Thiết lập voucher mới</span>
        </button>
      </div>

      {/* Table PRO MAX */}
      <div className="bg-white border border-gray-100 rounded-[2.5rem] shadow-sm overflow-hidden font-black uppercase italic">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100 text-[10px] font-black text-gray-400 uppercase tracking-widest italic">
                <th className="px-8 py-6">Identity Code</th>
                <th className="px-6 py-6">Campaign Info</th>
                <th className="px-6 py-6">Tier Details</th>
                <th className="px-6 py-6 text-center">Efficiency</th>
                <th className="px-6 py-6">Timeframe</th>
                <th className="px-6 py-6 text-center">Status</th>
                <th className="px-8 py-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 italic uppercase font-black">
              {vouchers.map((v) => {
                const cfg = STATUS_CONFIG[v.status] || STATUS_CONFIG.INACTIVE;
                return (
                  <tr key={v.idVoucher} className={`group hover:bg-gray-50/80 transition-all duration-300 font-black italic ${!v.isActive ? 'opacity-50' : ''}`}>
                    <td className="px-8 py-5">
                      <span className="inline-block font-mono font-black text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-xl text-[11px] tracking-widest border border-indigo-100 shadow-sm animate-pulse">
                        {v.maVoucher}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <div className="min-w-[180px]">
                        <p className="text-[13px] font-black text-gray-900 uppercase tracking-tight truncate italic">{v.tenVoucher}</p>
                        <p className="text-[10px] font-medium text-gray-400 truncate italic italic leading-none mt-0.5">{VOUCHER_TYPES.find(t => t.value === v.voucherType)?.label}</p>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="font-black italic text-gray-900 text-[14px]">
                        {formatDiscount(v)}
                        {v.voucherType === 'PERCENTAGE' && v.maxDiscountAmount && (
                          <div className="text-[9px] text-gray-400 font-bold uppercase tracking-tighter italic">Cap: {formatCurrency(v.maxDiscountAmount)}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-5 text-center">
                       <div className="flex flex-col items-center gap-1 font-black italic uppercase">
                          <span className="text-[11px] text-gray-950 font-black italic font-variant-numeric: tabular-nums">{v.usedCount} / {v.maxUsage || '∞'}</span>
                          <div className="w-16 h-1 bg-gray-100 rounded-full overflow-hidden">
                             <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${Math.min(100, (v.usedCount / (v.maxUsage || 100)) * 100)}%` }} />
                          </div>
                          <span className="text-[8px] text-gray-400 font-black uppercase tracking-tighter italic">Conversions</span>
                       </div>
                    </td>
                    <td className="px-6 py-5 text-[10px] font-black text-gray-400 italic font-variant-numeric: tabular-nums leading-relaxed">
                      <div>{formatDate(v.ngayBatDau)}</div>
                      <div className="text-gray-300">to</div>
                      <div>{formatDate(v.ngayKetThuc)}</div>
                    </td>
                    <td className="px-6 py-5 text-center font-black italic">
                       <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest italic border ${cfg.bg} ${cfg.border} ${cfg.text}`}>
                         {v.status === 'ACTIVE' && <Zap size={12} className="animate-pulse" />}
                         {cfg.label}
                       </span>
                    </td>
                    <td className="px-8 py-5 text-right font-black italic uppercase">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0 duration-500">
                        <button
                          onClick={() => toggleMutation.mutate(v.idVoucher)}
                          className={`w-9 h-9 flex items-center justify-center rounded-xl border border-gray-100 focus-visible:ring-4 focus-visible:ring-emerald-100 outline-none transition-all shadow-sm active:scale-95 ${v.isActive ? 'bg-white text-emerald-500 hover:bg-emerald-50' : 'bg-white text-gray-300 hover:bg-gray-50'}`}
                          title={v.isActive ? 'Suspend' : 'Resume'}
                        >
                          {v.isActive ? <ToggleRight size={22} /> : <ToggleLeft size={22} />}
                        </button>
                        <button
                          onClick={() => openEdit(v)}
                          className="w-9 h-9 flex items-center justify-center bg-white text-blue-500 hover:bg-blue-600 hover:text-white focus-visible:ring-4 focus-visible:ring-blue-100 outline-none rounded-xl border border-gray-100 transition-all shadow-sm active:scale-95"
                          title="Modify"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(v)}
                          className="w-9 h-9 flex items-center justify-center bg-white text-rose-500 hover:bg-rose-600 hover:text-white focus-visible:ring-4 focus-visible:ring-rose-100 outline-none rounded-xl border border-gray-100 transition-all shadow-sm active:scale-95"
                          title="Withdraw"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination PRO MAX */}
        {!isLoading && totalPages > 1 && (
          <div className="flex items-center justify-between px-8 py-6 border-t border-gray-50 font-black italic">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest italic">
              Displaying <span className="text-gray-950 font-black italic">{vouchers.length}</span> campaign nodes // total {totalElements}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
                className="w-11 h-11 flex items-center justify-center bg-white border border-gray-100 rounded-2xl text-gray-400 hover:bg-emerald-950 hover:text-white focus-visible:ring-4 focus-visible:ring-emerald-100 outline-none transition-all disabled:opacity-30 active:scale-90 shadow-sm"
            >
              <ChevronLeft size={20} />
            </button>
              <div className="flex items-center gap-1.5 p-1.5 bg-gray-50 border border-gray-100 rounded-[1.5rem] italic font-black uppercase">
                 <span className="px-4 py-2 text-[10px] font-black text-gray-500 uppercase tracking-widest italic leading-none">Sector {page + 1} / {totalPages}</span>
              </div>
              <button
                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="w-11 h-11 flex items-center justify-center bg-white border border-gray-100 rounded-2xl text-gray-400 hover:bg-emerald-950 hover:text-white focus-visible:ring-4 focus-visible:ring-emerald-100 outline-none transition-all disabled:opacity-30 active:scale-90 shadow-sm"
            >
              <ChevronRight size={20} />
            </button>
            </div>
          </div>
        )}
      </div>

      {vouchers.length === 0 && !isLoading && (
        <div className="bg-white rounded-[3rem] border border-gray-100 py-32 text-center shadow-sm">
           <Zap size={48} className="mx-auto text-gray-200 mb-6" />
           <p className="text-[11px] font-black text-gray-400 uppercase tracking-[0.3em] italic">Vùng ưu đãi trống</p>
        </div>
      )}

      {/* Premium UI Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-950/60 backdrop-blur-sm animate-in fade-in duration-500" onClick={closeModal} />
          <div className="relative bg-white/95 backdrop-blur-2xl rounded-[3rem] border border-white shadow-[0_40px_120px_-20px_rgba(0,0,0,0.3)] w-full max-w-xl overflow-hidden flex flex-col animate-in slide-in-from-bottom-12 duration-700">
            
            <div className="flex items-center justify-between px-8 py-6 shrink-0 bg-gradient-to-b from-white/50 to-transparent italic font-black uppercase">
              <div>
                 <div className="flex items-center gap-2 mb-1">
                    <Sparkles size={12} className="text-emerald-500 italic font-black uppercase" />
                    <span className="text-[8px] font-black text-gray-400 uppercase tracking-[0.3em] italic leading-none">Campaign Configuration</span>
                 </div>
                 <h2 className="text-2xl font-black text-gray-950 uppercase tracking-tighter italic leading-none">
                   {editingId ? 'Chỉnh sửa' : 'Thiết lập'} <span className="text-emerald-600 font-black not-italic">Voucher</span>
                 </h2>
              </div>
              <button 
                onClick={closeModal} 
                className="w-10 h-10 flex items-center justify-center bg-gray-50 text-gray-400 hover:bg-gray-950 hover:text-white focus-visible:ring-4 focus-visible:ring-gray-100 outline-none rounded-xl transition-all duration-300 active:scale-90"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 pt-2 space-y-6 overflow-y-auto max-h-[78vh] custom-scrollbar italic font-black uppercase">
              <div className="grid grid-cols-2 gap-5">
                <div className="group">
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest italic mb-1.5 px-1 font-black uppercase italic">Mã nhận diện *</label>
                  <input
                    type="text"
                    name="maVoucher"
                    value={form.maVoucher}
                    onChange={(e) => setForm(f => ({ ...f, maVoucher: e.target.value.toUpperCase() }))}
                    disabled={!!editingId}
                    placeholder="VD: WELCOME100"
                    className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus-visible:ring-4 focus-visible:ring-emerald-100 outline-none transition-all text-sm font-black text-emerald-700 placeholder:text-gray-300 font-mono tracking-widest italic font-black uppercase"
                    required
                  />
                </div>
                <div className="group italic font-black uppercase">
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest italic mb-1.5 px-1">Chủ đề ưu đãi *</label>
                  <select
                    name="voucherType"
                    value={form.voucherType}
                    onChange={(e) => setForm(f => ({ ...f, voucherType: e.target.value }))}
                    className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus-visible:ring-4 focus-visible:ring-emerald-100 outline-none transition-all text-[11px] font-black uppercase text-gray-950 appearance-none cursor-pointer italic font-black uppercase"
                  >
                    {VOUCHER_TYPES.map(t => (
                      <option key={t.value} value={t.value}>{t.label.toUpperCase()}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="group">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest italic mb-1.5 px-1 font-black uppercase italic">Tên chiến dịch *</label>
                <input
                  type="text"
                  name="tenVoucher"
                  value={form.tenVoucher}
                  onChange={(e) => setForm(f => ({ ...f, tenVoucher: e.target.value }))}
                  placeholder="Tiêu đề hiển thị cho khách hàng…"
                  className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:bg-white focus-visible:ring-4 focus-visible:ring-emerald-100 outline-none transition-all text-sm font-black text-gray-950 italic font-black uppercase"
                  required
                />
              </div>

              <div className="group italic font-black uppercase">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest italic mb-1.5 px-1 font-black uppercase italic">Nội dung chi tiết</label>
                <textarea
                  name="moTa"
                  value={form.moTa}
                  onChange={(e) => setForm(f => ({ ...f, moTa: e.target.value }))}
                  rows={2}
                  className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:bg-white focus-visible:ring-4 focus-visible:ring-emerald-100 outline-none transition-all text-sm font-medium text-gray-700 resize-none italic font-black uppercase"
                />
              </div>

              <div className="grid grid-cols-2 gap-5 italic font-black uppercase">
                {form.voucherType === 'PERCENTAGE' ? (
                  <>
                    <div>
                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest italic mb-1.5 px-1 font-black uppercase italic font-black uppercase italic">Tỷ lệ giảm (%) *</label>
                      <input type="number" min="1" max="100"
                        name="discountPercentage"
                        value={form.discountPercentage}
                        onChange={(e) => setForm(f => ({ ...f, discountPercentage: e.target.value }))}
                        className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:bg-white focus-visible:ring-4 focus-visible:ring-emerald-100 outline-none transition-all text-sm font-black italic font-black uppercase italic"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest italic mb-1.5 px-1 font-black uppercase italic font-black uppercase italic">Giới hạn giảm (VND)</label>
                      <input type="number" min="0"
                        name="maxDiscountAmount"
                        value={form.maxDiscountAmount}
                        onChange={(e) => setForm(f => ({ ...f, maxDiscountAmount: e.target.value }))}
                        className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:bg-white focus-visible:ring-4 focus-visible:ring-emerald-100 outline-none transition-all text-sm font-black italic font-black uppercase italic"
                      />
                    </div>
                  </>
                ) : form.voucherType === 'FIXED_AMOUNT' && (
                  <div className="col-span-2">
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest italic mb-1.5 px-1 font-black uppercase italic font-black uppercase italic">Giá trị khấu trừ (VND) *</label>
                    <input type="number" min="1"
                      name="discountValue"
                      value={form.discountValue}
                      onChange={(e) => setForm(f => ({ ...f, discountValue: e.target.value }))}
                      className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:bg-white focus-visible:ring-4 focus-visible:ring-emerald-100 outline-none transition-all text-sm font-black italic font-black uppercase italic"
                      required
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-5 font-black uppercase italic">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest italic mb-1.5 px-1 font-black uppercase italic">Đơn tối thiểu (VND)</label>
                  <input type="number" min="0"
                    name="minOrderAmount"
                    value={form.minOrderAmount}
                    onChange={(e) => setForm(f => ({ ...f, minOrderAmount: e.target.value }))}
                    className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:bg-white focus-visible:ring-4 focus-visible:ring-emerald-100 outline-none transition-all text-sm font-black italic font-black uppercase italic"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest italic mb-1.5 px-1 font-black uppercase italic">Tổng lượt phát hành *</label>
                  <input type="number" min="1"
                    name="maxUsage"
                    value={form.maxUsage}
                    onChange={(e) => setForm(f => ({ ...f, maxUsage: e.target.value }))}
                    className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:bg-white focus-visible:ring-4 focus-visible:ring-emerald-100 outline-none transition-all text-sm font-black italic font-black uppercase italic"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-5 font-black uppercase italic">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest italic mb-1.5 px-1 font-black uppercase italic">Khai hỏa *</label>
                  <input type="date"
                    name="ngayBatDau"
                    value={form.ngayBatDau}
                    onChange={(e) => setForm(f => ({ ...f, ngayBatDau: e.target.value }))}
                    className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:bg-white focus-visible:ring-4 focus-visible:ring-emerald-100 outline-none transition-all text-sm font-black italic font-black uppercase italic"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest italic mb-1.5 px-1 font-black uppercase italic">Bế mạc *</label>
                  <input type="date"
                    name="ngayKetThuc"
                    value={form.ngayKetThuc}
                    onChange={(e) => setForm(f => ({ ...f, ngayKetThuc: e.target.value }))}
                    className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:bg-white focus-visible:ring-4 focus-visible:ring-emerald-100 outline-none transition-all text-sm font-black italic font-black uppercase italic"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center gap-4 bg-gray-50/80 p-5 rounded-2xl border border-gray-100 group italic font-black uppercase italic">
                <input type="checkbox"
                  id="first_timer"
                  checked={form.isFirstTimeOnly}
                  onChange={(e) => setForm(f => ({ ...f, isFirstTimeOnly: e.target.checked }))}
                  className="w-5 h-5 rounded border-gray-200 text-emerald-600 focus:ring-emerald-100 transition-all cursor-pointer font-black italic uppercase italic"
                />
                <label htmlFor="first_timer" className="text-[11px] font-black text-gray-950 uppercase tracking-wide cursor-pointer font-black italic uppercase italic">Độc quyền cho cư dân mới (First-time Unit)</label>
              </div>

              <div className="flex items-center gap-3 pt-4 font-black italic uppercase">
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="flex-1 py-4 bg-gray-950 text-white rounded-[1.5rem] text-[11px] font-black uppercase tracking-[0.1em] italic hover:bg-emerald-600 transition-all duration-300 shadow-xl active:scale-95 disabled:opacity-50 group/btn font-black italic uppercase italic"
                >
                  <div className="flex items-center justify-center gap-2">
                    {createMutation.isPending || updateMutation.isPending
                      ? 'Đang phát hành...'
                      : editingId
                      ? 'Áp dụng chỉnh sửa'
                      : 'Triển khai ưu đãi'}
                    <ArrowRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />
                  </div>
                </button>
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-gray-950 focus-visible:ring-4 focus-visible:ring-gray-100 outline-none transition-colors active:scale-95 italic font-black italic uppercase italic font-black uppercase italic"
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
