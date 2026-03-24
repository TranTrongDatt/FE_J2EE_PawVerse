import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { 
  Calendar, Clock, CheckCircle, XCircle, Phone, ChevronDown, ArrowRight, Ban, Eye, 
  Sparkles, Zap, Target, Shield, Layers, LayoutGrid, Search, Filter, Mail, MapPin, User
} from 'lucide-react';
import bookingService from '../../api/bookingService';
import toast from 'react-hot-toast';

const statusConfig = {
  PENDING:         { label: 'Chờ xác nhận',       bg: 'bg-amber-50', border: 'border-amber-100', text: 'text-amber-600', icon: Clock },
  CONFIRMED:       { label: 'Đã xác nhận',        bg: 'bg-blue-50', border: 'border-blue-100', text: 'text-blue-600', icon: CheckCircle },
  CONTACTING:      { label: 'Liên hệ',            bg: 'bg-indigo-50', border: 'border-indigo-100', text: 'text-indigo-600', icon: Phone },
  CONTACT_SUCCESS: { label: 'Liên hệ thành công', bg: 'bg-purple-50', border: 'border-purple-100', text: 'text-purple-600', icon: CheckCircle },
  COMPLETED:       { label: 'Hoàn thành',         bg: 'bg-emerald-50', border: 'border-emerald-100', text: 'text-emerald-600', icon: CheckCircle },
  CANCELLED:       { label: 'Đã hủy',             bg: 'bg-rose-50', border: 'border-rose-100', text: 'text-rose-600', icon: XCircle },
};

const SERVICE_MAP = {
  PET_HOTEL: 'Khách sạn Thú cưng',
  SPA_GROOMING: 'Spa & Cắt tỉa',
  HOME_SERVICE: 'Chăm sóc tại nhà',
};

const STATUS_TABS = ['PENDING', 'CONFIRMED', 'CONTACTING', 'CONTACT_SUCCESS', 'COMPLETED', 'CANCELLED'];

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
            {type === 'danger' ? <Ban size={36} /> : <Zap size={36} className="animate-pulse" />}
          </div>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.4em] mb-2 italic">Hệ thống Booking PawVerse</p>
          <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tighter leading-tight mb-4">{title}</h3>
          <div className="bg-gray-50/80 rounded-2xl p-4 mb-8 border border-gray-100 text-[11px] font-bold text-gray-600 italic leading-relaxed">
            {message}
          </div>
          <div className="grid grid-cols-2 gap-3">
             <button onClick={onClose} className="py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-gray-600 hover:bg-gray-50 focus-visible:ring-4 focus-visible:ring-gray-100 transition-all font-black outline-none">Hủy bỏ</button>
             <button onClick={() => { onConfirm(); onClose(); }} className={`py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white shadow-xl focus-visible:ring-4 transition-all active:scale-95 outline-none ${type === 'danger' ? 'bg-rose-600 focus-visible:ring-rose-200 shadow-rose-200 hover:bg-rose-700' : 'bg-gray-900 focus-visible:ring-gray-200 shadow-gray-200 hover:bg-orange-600'}`}>Xác nhận</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function getNextStatus(current) {
  const flow = { PENDING: 'CONFIRMED', CONFIRMED: 'CONTACTING', CONTACT_SUCCESS: 'COMPLETED' };
  return flow[current] || null;
}

function getNextStatusLabel(nextStatus) {
  const labels = {
    CONFIRMED: 'Chấp thuận lịch hẹn',
    CONTACTING: 'Khởi động liên lạc',
    COMPLETED: 'Nghiệm thu dịch vụ',
  };
  return labels[nextStatus] || statusConfig[nextStatus]?.label;
}

function StatusDropdown({ booking, onStatusChange, isPending }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const isFinal = booking.bookingStatus === 'COMPLETED' || booking.bookingStatus === 'CANCELLED';
  const isContacting = booking.bookingStatus === 'CONTACTING';
  const nextStatus = getNextStatus(booking.bookingStatus);
  const canCancel = !isFinal;

  if (isFinal) return null;

  return (
    <div className="relative font-black italic uppercase" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        disabled={isPending}
        className="inline-flex items-center gap-2 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-blue-600 bg-blue-50 border border-blue-100 rounded-xl hover:bg-blue-600 hover:text-white focus-visible:ring-4 focus-visible:ring-blue-100 disabled:opacity-50 transition-all outline-none active:scale-95 shadow-sm"
      >
        Cập nhật logic
        <ChevronDown size={14} className={`transition-transform duration-300 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute right-0 mt-3 w-64 bg-white rounded-[2rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.15)] border border-gray-100 z-50 py-3 overflow-hidden animate-in zoom-in-95 duration-200 italic font-black">
          {nextStatus && (
            <button
              onClick={() => { onStatusChange(booking.idBooking, nextStatus); setOpen(false); }}
              className="flex items-center gap-3 w-full text-left px-5 py-3.5 text-[11px] font-black uppercase text-blue-600 hover:bg-blue-50 focus-visible:bg-blue-50 transition-all outline-none"
            >
              <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                 <ArrowRight size={16} />
              </div>
              {getNextStatusLabel(nextStatus)}
            </button>
          )}
          {isContacting && (
            <>
              <button
                onClick={() => { onStatusChange(booking.idBooking, 'CONTACT_SUCCESS'); setOpen(false); }}
                className="flex items-center gap-3 w-full text-left px-5 py-3.5 text-[11px] font-black uppercase text-purple-600 hover:bg-purple-50 focus-visible:bg-purple-50 transition-all outline-none"
              >
                <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center shrink-0">
                   <Target size={16} />
                </div>
                Đã chốt được lịch
              </button>
              <button
                onClick={() => { onStatusChange(booking.idBooking, 'CONTACT_FAIL'); setOpen(false); }}
                className="flex items-center gap-3 w-full text-left px-5 py-3.5 text-[11px] font-black uppercase text-amber-600 hover:bg-amber-50 focus-visible:bg-amber-50 transition-all outline-none"
              >
                <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
                   <Phone size={16} />
                </div>
                Thuê bao / Không nghe ({booking.contactFailCount || 0}/3)
              </button>
            </>
          )}
          {canCancel && (
            <div className="mt-2 pt-2 border-t border-gray-50 uppercase font-black italic">
              <button
                onClick={() => { onStatusChange(booking.idBooking, 'CANCELLED'); setOpen(false); }}
                className="flex items-center gap-3 w-full text-left px-5 py-3.5 text-[11px] font-black uppercase text-rose-500 hover:bg-rose-50 focus-visible:bg-rose-50 transition-all outline-none"
              >
                <div className="w-8 h-8 rounded-lg bg-rose-100 flex items-center justify-center shrink-0">
                   <Ban size={16} />
                </div>
                Hủy lịch (Drop Unit)
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function BookingManagementPage() {
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', onConfirm: null, type: 'danger' });

  const queryClient = useQueryClient();

  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ['staffBookings', statusFilter],
    queryFn: () => bookingService.getAllBookings({
      status: statusFilter === 'ALL' ? undefined : statusFilter,
    }),
    select: (res) => res.data?.data || [],
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ bookingId, status }) => bookingService.updateBookingStatus(bookingId, status),
    onSuccess: () => {
      queryClient.invalidateQueries(['staffBookings']);
      toast.success('GIAO THỨC TRẠNG THÁI ĐÃ ĐƯỢC CẬP NHẬT!', {
        icon: '⚡',
        style: { borderRadius: '15px', background: '#111', color: '#fff', fontSize: '11px', fontWeight: 'bold' }
      });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Không thể cập nhật trạng thái');
    },
  });

  const handleStatusChange = (bookingId, newStatus) => {
    if (newStatus === 'CONTACT_FAIL') {
      const booking = bookings.find((b) => b.idBooking === bookingId);
      const failCount = (booking?.contactFailCount || 0) + 1;
      const isAutoCancel = failCount >= 3;
      
      setConfirmModal({
        isOpen: true,
        title: 'GHI NHẬN LIÊN HỆ',
        message: isAutoCancel 
          ? `Lần thất bại thứ 3 cho ID #${bookingId}. Theo quy trình, lịch hẹn này sẽ bị HỦY TỰ ĐỘNG. Bạn có chắc chắn?`
          : `Ghi nhận lần liên hệ thất bại thứ ${failCount}/3 cho ID #${bookingId}.`,
        type: isAutoCancel ? 'danger' : 'warning',
        onConfirm: () => updateStatusMutation.mutate({ bookingId, status: newStatus })
      });
      return;
    }

    const label = newStatus === 'CANCELLED' ? 'HỦY LỊCH' : statusConfig[newStatus]?.label?.toUpperCase();
    setConfirmModal({
      isOpen: true,
      title: 'DUYỆT TIẾN ĐỘ',
      message: `Xác nhận chuyển trạng thái dịch vụ sang "${label}" cho thực thể #${bookingId}?`,
      type: newStatus === 'CANCELLED' ? 'danger' : 'warning',
      onConfirm: () => updateStatusMutation.mutate({ bookingId, status: newStatus })
    });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700 italic font-black uppercase font-black uppercase">
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
          <div className="flex items-center gap-2 mb-2 font-black italic uppercase">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600 shadow-sm shadow-indigo-100">
               <Calendar size={16} />
            </div>
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] italic leading-none">Vận hành lưu trú & Spa</span>
          </div>
          <h1 className="text-4xl font-black text-gray-950 uppercase tracking-tighter italic leading-none">
            Quản lý <span className="text-indigo-600 font-black not-italic">Lịch đặt</span>
          </h1>
          <p className="text-gray-500 mt-3 font-medium text-sm flex items-center gap-2 font-black italic">
            <Clock size={14} className="text-gray-300 font-black italic uppercase" />
            Đang giám sát <span className="text-gray-950 font-black italic underline decoration-indigo-200">{bookings.length}</span> phiên dịch vụ trong luồng
          </p>
        </div>
      </div>

      {/* Control Tabs PRO MAX */}
      <div className="bg-white/60 backdrop-blur-xl border border-white rounded-[2.5rem] p-2 shadow-sm overflow-x-auto custom-scrollbar font-black uppercase italic">
        <div className="flex min-w-max p-1 gap-1">
          {['ALL', ...STATUS_TABS].map((status) => {
            const active = statusFilter === status;
            const cfg = statusConfig[status] || { label: 'Tất cả', text: 'text-gray-600' };
            return (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-6 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 flex items-center gap-2.5 ${
                  active 
                    ? 'bg-indigo-950 text-white shadow-xl shadow-indigo-100 scale-[1.02]' 
                    : 'text-gray-400 hover:text-gray-900 hover:bg-white'
                } focus-visible:ring-4 focus-visible:ring-indigo-100 outline-none`}
              >
                {status !== 'ALL' && cfg.icon && <cfg.icon size={14} className={active ? 'text-indigo-400' : ''} />}
                {status === 'ALL' ? 'XEM TẤT CẢ' : cfg.label.toUpperCase()}
              </button>
            );
          })}
        </div>
      </div>

      {/* Table PRO MAX */}
      <div className="bg-white border border-gray-100 rounded-[2.5rem] shadow-sm overflow-hidden font-black uppercase italic">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
               <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-100 border-t-indigo-600 font-black italic uppercase" />
               <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest animate-pulse italic font-black uppercase">Đang liên kết với cơ sở dữ liệu booking...</p>
          </div>
        ) : (
          <div className="overflow-x-auto custom-scrollbar font-black uppercase italic">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100 font-black italic uppercase">
                  <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest italic font-black uppercase">Service UID</th>
                  <th className="px-6 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest italic font-black uppercase">Owner Identity</th>
                  <th className="px-6 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest italic font-black uppercase">Service Logic</th>
                  <th className="px-6 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest italic font-black uppercase">Time Scheduled</th>
                  <th className="px-6 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest italic font-black uppercase text-center">Protocol Status</th>
                  <th className="px-8 py-6 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest italic font-black uppercase italic">Operations</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 italic uppercase font-black">
                {bookings.map((booking) => {
                  const cfg = statusConfig[booking.bookingStatus] || statusConfig.PENDING;
                  const StatusIcon = cfg.icon;
                  const isCancelled = booking.bookingStatus === 'CANCELLED';

                  return (
                    <tr key={booking.idBooking} className={`group hover:bg-gray-50/80 transition-all duration-300 font-black ${isCancelled ? 'opacity-50' : ''}`}>
                      <td className="px-8 py-5">
                        <span className="font-mono font-black text-gray-950 bg-gray-50 px-3 py-1.5 rounded-xl text-[11px] border border-gray-100 shadow-sm italic font-black uppercase">
                          #{booking.idBooking}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                           <div className="w-9 h-9 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-500 font-black shrink-0">
                              <User size={16} />
                           </div>
                           <div className="min-w-0">
                              <p className="text-[13px] font-black text-gray-900 uppercase tracking-tight truncate max-w-[150px] italic">{booking.hoTen}</p>
                              <div className="flex items-center gap-1.5 text-gray-400">
                                 <Phone size={10} className="italic font-black uppercase" />
                                 <span className="text-[10px] font-bold italic">{booking.soDienThoai}</span>
                              </div>
                           </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-2">
                           <div className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse italic font-black uppercase" />
                           <span className="text-[12px] font-black text-gray-800 italic">{SERVICE_MAP[booking.serviceType] || booking.serviceType}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-2 text-gray-500 font-black uppercase italic">
                           <Clock size={14} className="text-gray-300 italic font-black uppercase" />
                           <span className="text-[11px] font-black font-variant-numeric: tabular-nums italic uppercase">{formatDate(booking.ngayGioDat)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-center font-black uppercase italic">
                         <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest italic border ${cfg.bg} ${cfg.border} ${cfg.text}`}>
                           <StatusIcon size={12} className={booking.bookingStatus === 'PENDING' ? 'animate-bounce' : ''} />
                           {cfg.label.toUpperCase()}
                         </span>
                      </td>
                      <td className="px-8 py-5 text-right font-black uppercase italic">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0 duration-500">
                          <Link
                            to={`/staff/bookings/${booking.idBooking}`}
                            className="w-10 h-10 flex items-center justify-center bg-white text-gray-400 hover:bg-gray-950 hover:text-white focus-visible:ring-4 focus-visible:ring-indigo-100 outline-none rounded-xl border border-gray-100 transition-all shadow-sm active:scale-95"
                            title="X-Ray View"
                          >
                            <Target size={18} />
                          </Link>
                          <StatusDropdown
                            booking={booking}
                            onStatusChange={handleStatusChange}
                            isPending={updateStatusMutation.isPending}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && bookings.length === 0 && (
          <div className="bg-white rounded-[3rem] border border-gray-100 py-32 text-center shadow-sm font-black uppercase italic">
             <div className="w-20 h-20 bg-gray-50 rounded-[2.5rem] flex items-center justify-center mx-auto mb-6 border border-gray-100 font-black uppercase italic">
                <Calendar size={32} className="text-gray-300 font-black italic uppercase" />
             </div>
             <p className="text-[11px] font-black text-gray-400 uppercase tracking-[0.3em] mb-1 italic">Vành đai dịch vụ trống</p>
             <p className="text-[9px] font-bold text-gray-300 italic">KHÔNG TÌM THẤY LỊCH HẸN NÀO TRONG PHÂN ĐOẠN NÀY</p>
          </div>
        )}
      </div>

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
