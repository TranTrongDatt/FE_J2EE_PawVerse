import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Phone, 
  Mail, 
  PawPrint, 
  XCircle, 
  ChevronDown, 
  ChevronUp, 
  AlertCircle,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Dog,
  Cat,
  Bone,
  ArrowLeft,
  CheckCircle2,
  Trash2,
  Settings2,
  Zap,
  Star,
  Home
} from 'lucide-react';
import bookingService from '../../api/bookingService';
import useAuthStore from '../../store/useAuthStore';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const STATUS_MAP = {
  PENDING:         { label: 'Chờ xác nhận',       color: 'bg-yellow-50 text-yellow-600 border-yellow-200', icon: Clock },
  CONFIRMED:       { label: 'Đã xác nhận',        color: 'bg-blue-50 text-blue-600 border-blue-200',     icon: CheckCircle2 },
  CONTACTING:      { label: 'Đang liên hệ',       color: 'bg-indigo-50 text-indigo-600 border-indigo-200', icon: Phone },
  CONTACT_SUCCESS: { label: 'Thành công',         color: 'bg-purple-50 text-purple-600 border-purple-200', icon: Sparkles },
  COMPLETED:       { label: 'Hoàn thành',         color: 'bg-green-50 text-green-600 border-green-200',   icon: ShieldCheck },
  CANCELLED:       { label: 'Đã hủy',             color: 'bg-red-50 text-red-600 border-red-200',       icon: XCircle },
};

const SERVICE_MAP = {
  PET_HOTEL: 'Pet Hotel',
  SPA_GROOMING: 'Spa & Grooming',
  HOME_SERVICE: 'Home Service',
};

import ConfirmModal from '../../components/common/ConfirmModal';

export default function BookingHistoryPage() {
  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState('ALL');
  const [expandedId, setExpandedId] = useState(null);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [bookingToCancel, setBookingToCancel] = useState(null);

  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ['myBookings'],
    queryFn: bookingService.getMyBookings,
    enabled: isAuthenticated,
    select: (res) => res.data?.data || [],
  });

  const cancelMutation = useMutation({
    mutationFn: (bookingId) => bookingService.cancelBooking(bookingId),
    onSuccess: () => {
      queryClient.invalidateQueries(['myBookings']);
      setIsCancelModalOpen(false);
      setBookingToCancel(null);
      toast.success('Đã hủy đặt lịch thành công ✨');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Hủy đặt lịch thất bại rồi Sen ơi!');
    },
  });

  const handleCancelClick = (e, bookingId) => {
    e.stopPropagation();
    setBookingToCancel(bookingId);
    setIsCancelModalOpen(true);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#fcfdfd] flex items-center justify-center p-4">
        <div className="bg-white rounded-[3.5rem] shadow-2xl p-12 text-center max-w-md border border-gray-50 relative overflow-hidden group">
           <div className="absolute top-0 right-0 w-32 h-32 bg-orange-50 rounded-full blur-3xl -mr-16 -mt-16 opacity-50"></div>
           <div className="w-24 h-24 bg-gray-50 rounded-[2rem] flex items-center justify-center mx-auto mb-8 transition-transform group-hover:rotate-12 duration-500">
              <ShieldCheck size={48} className="text-gray-300" />
           </div>
           <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tighter mb-4 leading-none italic">DỪNG LẠI SEN ƠI!</h2>
           <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-10 leading-relaxed">Bạn cần đăng nhập để xem lịch sử đặt dịch vụ nhé 🐾</p>
           <button onClick={() => navigate('/login')} className="w-full py-5 bg-gray-900 text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] shadow-xl hover:bg-orange-600 transition-all active:scale-95 flex items-center justify-center gap-3">
             ĐĂNG NHẬP NGAY <ArrowRight size={18} />
           </button>
        </div>
      </div>
    );
  }

  const filtered = filter === 'ALL' ? bookings : bookings.filter((b) => b.bookingStatus === filter);

  const canCancel = (status) => !['COMPLETED', 'CANCELLED', 'CONTACT_SUCCESS'].includes(status);

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    const d = new Date(dateStr);
    return d.toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="bg-[#fcfdfd] min-h-screen py-12 relative overflow-hidden">
      {/* Decorative Signature Background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-5%] right-[-5%] w-[45vw] h-[45vw] bg-orange-100/30 rounded-full blur-[120px] opacity-40"></div>
        <div className="absolute bottom-[-5%] left-[-5%] w-[40vw] h-[40vw] bg-blue-50/40 rounded-full blur-[100px] opacity-30"></div>
        <div className="absolute top-[20%] left-[10%] opacity-[0.03] rotate-12"><Dog size={240} /></div>
        <div className="absolute bottom-[20%] right-[10%] opacity-[0.03] -rotate-12"><Cat size={200} /></div>
        <div className="absolute top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2 opacity-[0.01] rotate-45"><Bone size={400} /></div>
      </div>

      <div className="container mx-auto px-4 max-w-5xl relative z-10 pt-24 pb-20">
        <div className="flex flex-col md:flex-row items-center justify-between gap-10 mb-16 animate-in fade-in slide-in-from-top-10 duration-1000">
          <div className="text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-6 py-2 bg-orange-50 text-orange-600 rounded-full text-[10px] font-black uppercase tracking-[0.3em] mb-6 shadow-sm">
               <Sparkles size={14} className="fill-orange-600" />
               Lịch hẹn của Sen
            </div>
            <h1 className="text-6xl md:text-7xl font-black text-gray-900 tracking-tighter uppercase mb-4 leading-none">
               LỊCH SỬ <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-orange-400">DỊCH VỤ</span>
            </h1>
            <p className="text-gray-400 font-bold uppercase text-xs md:text-sm tracking-[0.2em] leading-relaxed">
               Theo dõi và quản lý những khoảnh khắc chăm sóc Boss 🐾
            </p>
          </div>
          <button
            onClick={() => navigate('/services')}
            className="flex items-center gap-4 px-10 py-6 bg-gray-900 text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] shadow-2xl shadow-gray-200 hover:bg-orange-600 hover:-translate-y-2 transition-all active:scale-95 group"
          >
            <Zap size={20} className="group-hover:text-yellow-400 fill-current" /> ĐẶT LÀM ĐẸP NGAY
          </button>
        </div>

        {/* Filter tabs - Premium Bubbles */}
        <div className="flex flex-wrap items-center gap-3 mb-10 animate-in fade-in slide-in-from-left-10 duration-700">
          <button
            onClick={() => setFilter('ALL')}
            className={`px-8 py-3 rounded-full text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${
              filter === 'ALL' 
              ? 'bg-orange-600 text-white shadow-xl shadow-orange-100 -translate-y-1' 
              : 'bg-white text-gray-400 hover:bg-gray-50 border border-gray-100'
            }`}
          >
            Tất cả <span className="opacity-60 ml-1 tabular-nums">({bookings.length})</span>
          </button>
          {Object.entries(STATUS_MAP).map(([key, val]) => {
            const count = bookings.filter((b) => b.bookingStatus === key).length;
            if (count === 0 && filter !== key) return null;
            return (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={`px-8 py-3 rounded-full text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${
                  filter === key 
                  ? 'bg-gray-900 text-white shadow-xl shadow-gray-200 -translate-y-1' 
                  : 'bg-white text-gray-400 hover:bg-gray-50 border border-gray-100'
                }`}
              >
                {val.label} <span className="opacity-60 ml-1 tabular-nums">({count})</span>
              </button>
            );
          })}
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-32 space-y-6">
            <LoadingSpinner size="xl" color="orange" />
            <p className="text-[10px] font-black text-orange-500 uppercase tracking-[0.4em] animate-pulse">ĐANG TÌM TÌM KIẾM HỒ SƠ…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-24 bg-white/60 backdrop-blur-md rounded-[4rem] border border-white shadow-2xl shadow-gray-200/50 relative overflow-hidden group animate-in zoom-in duration-700">
            <div className="absolute top-0 right-0 w-40 h-40 bg-orange-50 rounded-full blur-3xl -mr-20 -mt-20 opacity-50"></div>
            <div className="w-32 h-32 bg-gray-50 rounded-[3rem] flex items-center justify-center mx-auto mb-10 group-hover:bg-orange-50 transition-colors duration-500 relative">
               <Calendar size={64} className="text-gray-200 group-hover:text-orange-200 transition-colors" />
               <div className="absolute -top-2 -right-2 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-md animate-bounce">
                  <Star size={20} className="text-orange-400 fill-orange-400" />
               </div>
            </div>
            <h3 className="text-3xl font-black text-gray-900 uppercase tracking-tighter mb-4 leading-none italic">OẮT? TRỐNG TRƠN À SEN?</h3>
            <p className="text-gray-400 font-bold text-[10px] uppercase tracking-[0.2em] mb-12 max-w-sm mx-auto leading-relaxed">
               Dường như bạn chưa đặt dịch vụ nào cho Boss cả. Hãy trải nghiệm dịch vụ 5 sao ngay nhé!
            </p>
            <button
              onClick={() => navigate('/services')}
              className="px-12 py-6 bg-orange-600 text-white rounded-[2.5rem] font-black text-xs uppercase tracking-[0.3em] shadow-2xl shadow-orange-100 hover:bg-gray-900 hover:-translate-y-2 transition-all relative z-10 group/cta"
            >
              KHÁM PHÁ DỊCH VỤ <ArrowRight size={18} className="inline ml-2 group-hover/cta:translate-x-1 transition-transform" />
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {filtered.map((booking, index) => {
              const status = STATUS_MAP[booking.bookingStatus] || STATUS_MAP.PENDING;
              const isExpanded = expandedId === booking.idBooking;
              const StatusIcon = status.icon;
              
              return (
                <div 
                  key={booking.idBooking} 
                  className={`bg-white rounded-[3rem] shadow-2xl shadow-gray-200/40 border border-white transition-all duration-500 overflow-hidden group/card animate-in fade-in slide-in-from-bottom-10 fill-mode-both ${isExpanded ? 'ring-2 ring-orange-100 -translate-y-2' : 'hover:-translate-y-2 hover:shadow-orange-100/30'}`}
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  {/* Header Row */}
                  <div
                    role="button"
                    aria-expanded={isExpanded}
                    aria-controls={`booking-details-${booking.idBooking}`}
                    className="p-8 cursor-pointer flex flex-col md:flex-row items-center gap-8 relative select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-orange-500"
                    onClick={() => setExpandedId(isExpanded ? null : booking.idBooking)}
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        setExpandedId(isExpanded ? null : booking.idBooking);
                      }
                    }}
                  >
                    <div className="flex-shrink-0 relative">
                       <div className={`w-20 h-20 rounded-3xl flex items-center justify-center transition-all duration-500 ${isExpanded ? 'bg-orange-600 text-white rotate-6' : 'bg-gray-50 text-gray-400 group-hover/card:bg-orange-50 group-hover/card:text-orange-600'}`}>
                          <PawPrint size={36} aria-hidden="true" />
                       </div>
                       {!isExpanded && (
                         <div className="absolute -top-2 -right-2 w-8 h-8 bg-white border border-gray-100 rounded-full flex items-center justify-center shadow-lg transform -rotate-12 group-hover/card:rotate-0 transition-transform">
                            <StatusIcon size={14} className={status.textClass || 'text-orange-600'} aria-hidden="true" />
                         </div>
                       )}
                    </div>

                    <div className="flex-1 text-center md:text-left">
                       <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-2">
                          <h2 className="font-black text-gray-900 text-2xl uppercase tracking-tighter leading-none group-hover/card:text-orange-600 transition-colors">
                            {SERVICE_MAP[booking.serviceType] || booking.serviceType}
                          </h2>
                          <span className={`px-4 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border transition-colors ${status.color}`}>
                            {status.label}
                          </span>
                       </div>
                       <div className="flex items-center justify-center md:justify-start gap-4 text-[10px] font-black text-gray-300 uppercase tracking-widest tabular-nums">
                          <span>#{booking.idBooking}</span>
                          <span className="w-1.5 h-1.5 bg-gray-100 rounded-full" aria-hidden="true" />
                          <span>Mã đặt ngày: {formatDate(booking.ngayTao)}</span>
                       </div>
                    </div>

                    <div className="flex-shrink-0 flex items-center gap-4">
                       <div className="text-right hidden md:block">
                          <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest mb-1">NGÀY HẸN BOSS</p>
                          <p className="text-[13px] font-black text-gray-900 uppercase tracking-tight tabular-nums">{formatDate(booking.ngayGioDat)}</p>
                       </div>
                       <div className={`w-12 h-12 rounded-full border border-gray-50 flex items-center justify-center transition-all duration-500 ${isExpanded ? 'bg-gray-900 text-white rotate-180' : 'bg-white text-gray-300 group-hover/card:border-orange-200 group-hover/card:text-orange-600'}`}>
                          <ChevronDown size={24} aria-hidden="true" />
                       </div>
                    </div>
                  </div>

                  {/* Expanded Content */}
                  <div 
                    id={`booking-details-${booking.idBooking}`}
                    className={`grid transition-all duration-700 ease-in-out ${isExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}
                  >
                    <div className="overflow-hidden border-t border-gray-50 bg-gray-50/50">
                      <div className="p-10">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                           {/* Info Column 1 */}
                           <div className="space-y-6">
                              <p className="text-[10px] font-black text-orange-500 uppercase tracking-[0.2em] mb-4">THÔNG TIN ĐỊA ĐIỂM</p>
                              <div className="flex gap-4 group/item">
                                 <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center text-gray-400 group-hover/item:text-orange-600 group-hover/item:scale-110 transition-all shadow-sm">
                                    <MapPin size={20} />
                                 </div>
                                 <div>
                                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 leading-none">CHI NHÁNH</p>
                                    <p className="text-sm font-black text-gray-900 uppercase tracking-tight">{booking.location}</p>
                                 </div>
                              </div>
                              {booking.diaChi && (
                                <div className="flex gap-4 group/item">
                                   <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center text-gray-400 group-hover/item:text-orange-600 group-hover/item:scale-110 transition-all shadow-sm">
                                      <Home size={20} />
                                   </div>
                                   <div>
                                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 leading-none">ĐỊA CHỈ TẬN NƠI</p>
                                      <p className="text-sm font-black text-gray-900 uppercase tracking-tight">{booking.diaChi}</p>
                                   </div>
                                </div>
                              )}
                           </div>

                           {/* Info Column 2 */}
                           <div className="space-y-6">
                              <p className="text-[10px] font-black text-orange-500 uppercase tracking-[0.2em] mb-4">LIÊN HỆ SEN VÀ BOSS</p>
                              <div className="flex gap-4 group/item">
                                 <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center text-gray-400 group-hover/item:text-orange-600 group-hover/item:scale-110 transition-all shadow-sm">
                                    <Phone size={20} />
                                 </div>
                                 <div className="tabular-nums">
                                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 leading-none">HOTLINE SEN</p>
                                    <p className="text-sm font-black text-gray-900 uppercase tracking-tight">{booking.soDienThoai}</p>
                                 </div>
                              </div>
                              {booking.petName && (
                                <div className="flex gap-4 group/item">
                                   <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center text-gray-400 group-hover/item:text-orange-600 group-hover/item:scale-110 transition-all shadow-sm">
                                      <PawPrint size={20} />
                                   </div>
                                   <div>
                                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 leading-none">NHÂN VẬT CHÍNH</p>
                                      <p className="text-sm font-black text-gray-900 uppercase tracking-tight">{booking.petName}</p>
                                   </div>
                                </div>
                              )}
                           </div>

                           {/* Info Column 3 */}
                           <div className="space-y-6">
                              <p className="text-[10px] font-black text-orange-500 uppercase tracking-[0.2em] mb-4">GHI CHÚ CHI TIẾT</p>
                              <div className="bg-white p-6 rounded-[2rem] border border-gray-100 relative min-h-[100px]">
                                 <div className="absolute top-4 right-4 text-orange-100"><Settings2 size={24} /></div>
                                 <p className="text-xs font-bold text-gray-500 leading-relaxed italic">
                                    {booking.ghiChu ? `“${booking.ghiChu}”` : '“Trống trải quá, không có ghi chú gì nè Sen ơi! 🐾”'}
                                 </p>
                              </div>
                           </div>
                        </div>

                        {canCancel(booking.bookingStatus) && (
                          <div className="mt-12 pt-10 border-t border-gray-200/50 flex flex-col md:flex-row items-center justify-between gap-6">
                             <div className="flex items-center gap-4 bg-red-50 px-6 py-3 rounded-full border border-red-100">
                                <AlertCircle size={16} className="text-red-500" />
                                <p className="text-[9px] font-black text-red-600 uppercase tracking-widest">Sen lưu ý: Đã đặt thì đừng hủy nha Boss buồn lắm đó!</p>
                             </div>
                             <button
                               onClick={(e) => handleCancelClick(e, booking.idBooking)}
                               disabled={cancelMutation.isPending}
                               className="flex items-center gap-3 px-10 py-5 bg-gray-900 text-white rounded-[1.5rem] font-black text-[10px] uppercase tracking-[0.2em] shadow-xl hover:bg-red-600 hover:-translate-y-1 transition-all active:scale-95 disabled:opacity-50 group/cancel"
                             >
                               {cancelMutation.isPending ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <Trash2 size={16} className="group-hover:rotate-12 transition-transform" />}
                               HỦY LỊCH HẸN
                             </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
        onConfirm={() => cancelMutation.mutate(bookingToCancel)}
        title="HỦY LỊCH HẸN 🐾"
        message="Boss sẽ biến mất forever... à nhầm, lịch hẹn sẽ bị hủy mãi mãi. Bạn chắc chứ?"
        confirmText="HỦY LỊCH NGAY"
        cancelText="GIỮ LẠI"
        isLoading={cancelMutation.isPending}
      />

      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e5e7eb;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #d1d5db;
        }
      `}} />
    </div>
  );
}
