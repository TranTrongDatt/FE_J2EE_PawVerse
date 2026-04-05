import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft, Clock, CheckCircle, XCircle, Phone, Mail, MapPin,
  CalendarDays, PawPrint, ArrowRight, Ban, ShieldCheck, FileText,
  PhoneOff, AlertTriangle, User, Zap, Target, LayoutGrid, Heart
} from 'lucide-react';
import bookingService from '../../api/bookingService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';

const statusConfig = {
  PENDING:         { label: 'Chờ xác nhận',      bg: 'bg-amber-50', border: 'border-amber-100', text: 'text-amber-600', icon: Clock },
  CONFIRMED:       { label: 'Đã xác nhận',       bg: 'bg-blue-50', border: 'border-blue-100', text: 'text-blue-600', icon: CheckCircle },
  CONTACTING:      { label: 'Liên hệ',           bg: 'bg-indigo-50', border: 'border-indigo-100', text: 'text-indigo-600', icon: Phone },
  CONTACT_SUCCESS: { label: 'Liên hệ thành công', bg: 'bg-purple-50', border: 'border-purple-100', text: 'text-purple-600', icon: CheckCircle },
  COMPLETED:       { label: 'Hoàn thành',         bg: 'bg-emerald-50', border: 'border-emerald-100', text: 'text-emerald-600', icon: CheckCircle },
  CANCELLED:       { label: 'Đã hủy',             bg: 'bg-rose-50', border: 'border-rose-100', text: 'text-rose-600', icon: XCircle },
};

const SERVICE_MAP = {
  PET_HOTEL:    'Khách sạn Thú cưng',
  SPA_GROOMING: 'Spa & Cắt tỉa chuyên sâu',
  HOME_SERVICE: 'Dịch vụ chăm sóc tại gia',
};

const PROGRESS_STEPS = [
  { key: 'PENDING',    label: 'KHỞI TẠO', icon: Clock },
  { key: 'CONFIRMED',  label: 'TIẾP NHẬN',  icon: CheckCircle },
  { key: 'CONTACTING', label: 'LIÊN HỆ',      icon: Phone },
  { key: 'COMPLETED',  label: 'HOÀN THÀNH',   icon: ShieldCheck },
];

// Custom PRO MAX Confirm Modal
function ConfirmModal({ isOpen, onClose, onConfirm, title, message, type = 'danger' }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gray-950/40 backdrop-blur-sm animate-in fade-in duration-300" onClick={onClose} />
      <div className="relative bg-white/95 backdrop-blur-2xl rounded-[2.5rem] border border-white shadow-[0_32px_64px_-16px_rgba(0,0,0,0.2)] w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-300">
        <div className={`h-2 w-full ${type === 'danger' ? 'bg-rose-500' : 'bg-orange-500'}`} />
        <div className="p-8 text-center Italics font-black uppercase">
          <div className={`w-20 h-20 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-xl ${type === 'danger' ? 'bg-rose-50 text-rose-500 shadow-rose-100' : 'bg-orange-50 text-orange-500 shadow-orange-100'}`}>
            {type === 'danger' ? <Ban size={36} /> : <Zap size={36} className="animate-pulse" />}
          </div>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.4em] mb-2 italic">Hệ thống Booking PawVerse</p>
          <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tighter leading-tight mb-4 italic">{title}</h3>
          <div className="bg-gray-50/80 rounded-2xl p-4 mb-8 border border-gray-100 text-[11px] font-bold text-gray-600 italic leading-relaxed">
            {message}
          </div>
          <div className="grid grid-cols-2 gap-3">
             <button onClick={onClose} className="py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-all font-black italic">Hủy bỏ</button>
             <button onClick={() => { onConfirm(); onClose(); }} className={`py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white shadow-xl transition-all active:scale-95 italic ${type === 'danger' ? 'bg-rose-600 shadow-rose-200 hover:bg-rose-700 font-black' : 'bg-gray-900 shadow-gray-200 hover:bg-orange-600 font-black'}`}>Xác nhận</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function getProgressIndex(status) {
  if (status === 'CONTACT_SUCCESS') return 2;
  return PROGRESS_STEPS.findIndex((s) => s.key === status);
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function BookingProgressBar({ booking }) {
  const currentStatus = booking.bookingStatus;
  const isCancelled = currentStatus === 'CANCELLED';
  const currentIdx = getProgressIndex(currentStatus);
  const contactDone = currentStatus === 'CONTACT_SUCCESS' || currentStatus === 'COMPLETED';
  const failCount = booking.contactFailCount || 0;

  return (
    <div className="mt-10 italic font-black uppercase">
      <div className="flex items-center justify-between mb-8 italic">
         <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.3em] font-black italic">Trình trạng xử lý (Process Stream)</h3>
         <div className="px-3 py-1 bg-gray-50 rounded-lg text-[9px] font-black text-gray-400 italic">SYSTEM_VERIFIED_PROTOCOL</div>
      </div>

      {isCancelled ? (
        <div className="flex items-center gap-4 p-6 bg-rose-50/50 rounded-[2rem] border border-rose-100 shadow-sm shadow-rose-100 font-black italic uppercase italic">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-rose-600 text-white shrink-0 shadow-lg shadow-rose-200 italic font-black">
            <Ban size={24} />
          </div>
          <div>
            <p className="text-xl font-black text-rose-700 italic font-black italic">DỊCH VỤ ĐÃ BỊ HỦY (DROPPED)</p>
            <p className="text-[10px] font-bold text-rose-500 mt-1 uppercase tracking-widest italic font-black italic">
              {failCount >= 3
                ? `Tự động ngắt kết nối do không hồi âm sau ${failCount} lần liên lạc`
                : 'Phiên xử lý này đã bị đình chỉ bởi quản trị viên'}
            </p>
          </div>
        </div>
      ) : (
        <div className="relative px-4 font-black italic uppercase">
          <div className="flex items-start justify-between mb-2 relative z-10 font-black italic">
            {PROGRESS_STEPS.map((step, idx) => {
              const isCurrent = idx === currentIdx && !contactDone;
              const isDone = currentIdx > idx || (idx === 2 && contactDone);
              const StepIcon = step.icon;

              return (
                <div key={step.key} className="flex flex-col items-center group font-black italic" style={{ flex: 1 }}>
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border-2 transition-all duration-500 shadow-sm ${
                    isDone
                      ? 'bg-indigo-600 border-indigo-600 text-white shadow-indigo-100 rotate-6 scale-110'
                      : isCurrent
                        ? 'bg-white border-indigo-500 text-indigo-600 ring-4 ring-indigo-50 animate-pulse'
                        : 'bg-white border-gray-100 text-gray-300'
                  }`}>
                    {isDone ? <CheckCircle size={22} className="italic font-black" /> : <StepIcon size={20} className="italic font-black" />}
                  </div>
                  <p className={`text-[10px] mt-4 text-center font-black uppercase tracking-widest italic ${
                    isDone || isCurrent ? 'text-indigo-600' : 'text-gray-300'
                  }`}>
                    {step.label}
                  </p>
                </div>
              );
            })}
          </div>
          <div className="absolute top-7 left-0 right-0 flex px-16 h-1 font-black italic" style={{ zIndex: 0 }}>
            {PROGRESS_STEPS.slice(0, -1).map((_, idx) => {
              const filled = currentIdx > idx || (idx === 2 && contactDone);
              return (
                <div key={idx} className="flex-1 h-full mx-1 font-black italic">
                  <div className={`h-full rounded-full transition-all duration-1000 ${filled ? 'bg-indigo-600 shadow-[0_0_10px_rgba(79,70,229,0.3)]' : 'bg-gray-100'}`} />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {failCount > 0 && currentStatus !== 'CANCELLED' && (
        <div className={`mt-10 p-5 rounded-[2rem] border italic font-black uppercase ${failCount >= 2 ? 'bg-rose-50 border-rose-100 shadow-rose-50 shadow-lg' : 'bg-amber-50 border-amber-100 shadow-amber-50 shadow-lg'}`}>
          <div className="flex items-center gap-3 mb-2 font-black italic">
            <AlertTriangle size={18} className={failCount >= 2 ? 'text-rose-500 animate-bounce' : 'text-amber-500 animate-pulse'} />
            <span className={`text-xs font-black uppercase tracking-widest italic ${failCount >= 2 ? 'text-rose-700' : 'text-amber-700'}`}>
              Cảnh báo liên hệ: {failCount}/3 lần thất bại
            </span>
          </div>
          <p className={`text-[10px] font-bold italic ${failCount >= 2 ? 'text-rose-600' : 'text-amber-600'}`}>
            {failCount >= 2
              ? 'PROTOCOL CRITICAL: THÊM 1 LẦN THẤT BẠI NỮA SẼ TỰ ĐỘNG DROPPED ĐỐI TƯỢNG!'
              : 'HỆ THỐNG ĐÃ PHÁT EMAIL NHẮC NHỞ TỰ ĐỘNG ĐẾN MAILBOX KHÁCH HÀNG.'}
          </p>
        </div>
      )}
    </div>
  );
}

function StaffStatusActions({ booking, onStatusChange, onContactFail, isPending }) {
  const { bookingStatus, contactFailCount = 0 } = booking;
  const isFinal = bookingStatus === 'COMPLETED' || bookingStatus === 'CANCELLED';
  const canCancel = !isFinal;

  if (isFinal) {
    return (
      <div className="bg-gray-50/50 rounded-2xl p-5 border border-gray-100 italic font-black uppercase">
        <div className="flex items-center gap-3 text-gray-400 italic">
          <ShieldCheck size={20} className="italic font-black" />
          <span className="text-[10px] font-black uppercase tracking-widest italic font-black">
            PROTOCOL LOCKED // PHIÊN ĐÃ KẾT THÚC
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 font-black italic uppercase">
      {bookingStatus === 'PENDING' && (
        <button
          onClick={() => onStatusChange('CONFIRMED')}
          disabled={isPending}
          className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-indigo-600 text-white rounded-[1.5rem] hover:bg-gray-950 transition-all font-black text-[11px] uppercase tracking-widest shadow-xl shadow-indigo-100 active:scale-95 italic font-black"
        >
          <Target size={18} className="italic font-black" />
          Xác nhận thực thể
        </button>
      )}

      {bookingStatus === 'CONFIRMED' && (
        <button
          onClick={() => onStatusChange('CONTACTING')}
          disabled={isPending}
          className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-indigo-600 text-white rounded-[1.5rem] hover:bg-gray-950 transition-all font-black text-[11px] uppercase tracking-widest shadow-xl shadow-indigo-100 active:scale-95 italic font-black"
        >
          <Phone size={18} className="italic font-black" />
          Mở luồng liên lạc
        </button>
      )}

      {bookingStatus === 'CONTACTING' && (
        <div className="space-y-3 font-black italic uppercase font-black">
          <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.3em] ml-2 italic">Signal Feedback:</p>
          <button
            onClick={() => onStatusChange('CONTACT_SUCCESS')}
            disabled={isPending}
            className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-emerald-600 text-white rounded-[1.5rem] hover:bg-gray-950 transition-all font-black text-[11px] uppercase tracking-widest shadow-xl shadow-emerald-100 active:scale-95 italic font-black"
          >
            <CheckCircle size={18} className="italic font-black" />
            Liên hệ thành công
          </button>
          <button
            onClick={() => onContactFail()}
            disabled={isPending}
            className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-white border border-rose-100 text-rose-500 rounded-[1.5rem] hover:bg-rose-50 transition-all font-black text-[11px] uppercase tracking-widest shadow-sm active:scale-95 italic font-black"
          >
            <PhoneOff size={18} className="italic font-black" />
            Thất bại ({contactFailCount}/3)
          </button>
        </div>
      )}

      {bookingStatus === 'CONTACT_SUCCESS' && (
        <button
          onClick={() => onStatusChange('COMPLETED')}
          disabled={isPending}
          className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-emerald-600 text-white rounded-[1.5rem] hover:bg-gray-950 transition-all font-black text-[11px] uppercase tracking-widest shadow-xl shadow-emerald-100 active:scale-95 italic font-black"
        >
          <ShieldCheck size={18} className="italic font-black" />
          Hoàn tất & Lưu trữ
        </button>
      )}

      {canCancel && (
        <div className="pt-2 italic font-black uppercase font-black">
          <button
            onClick={() => onStatusChange('CANCELLED')}
            disabled={isPending}
            className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-rose-50 text-rose-600 rounded-[1.5rem] hover:bg-rose-600 hover:text-white transition-all font-black text-[10px] uppercase tracking-widest italic font-black"
          >
            <Ban size={16} className="italic font-black" />
            Hủy dịch vụ (Drop Unit)
          </button>
        </div>
      )}
    </div>
  );
}

export default function BookingDetailPage() {
  const { id } = useParams();
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', onConfirm: null, type: 'danger' });
  const queryClient = useQueryClient();

  const { data: booking, isLoading } = useQuery({
    queryKey: ['staffBooking', id],
    queryFn: () => bookingService.getBookingById(id),
    select: (res) => res.data?.data,
  });

  const updateStatusMutation = useMutation({
    mutationFn: (status) => bookingService.updateBookingStatus(id, status),
    onSuccess: (_, status) => {
      queryClient.invalidateQueries(['staffBooking', id]);
      queryClient.invalidateQueries(['staffBookings']);
      if (status === 'CONTACT_FAIL') {
        toast('Ghi nhận liên hệ thất bại. Protocol nhắc nhở đã được phát tán.', { 
           icon: '⚠️', 
           style: { borderRadius: '15px', background: '#111', color: '#fff', fontSize: '11px', fontWeight: 'black', fontStyle: 'italic' } 
        });
      } else {
        toast.success('GIAO THỨC TRẠNG THÁI ĐÃ ĐƯỢC CẬP NHẬT!', {
          icon: '⚡',
          style: { borderRadius: '15px', background: '#111', color: '#fff', fontSize: '11px', fontWeight: 'black', fontStyle: 'italic' }
        });
      }
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Không thể cập nhật trạng thái');
    },
  });

  const handleStatusChange = (newStatus) => {
    const label = newStatus === 'CANCELLED' ? 'HỦY LỊCH' : statusConfig[newStatus]?.label?.toUpperCase();
    setConfirmModal({
      isOpen: true,
      title: 'DUYỆT TIẾN ĐỘ',
      message: `Xác nhận chuyển trạng thái dịch vụ sang "${label}" cho thực thể #${id}?`,
      type: newStatus === 'CANCELLED' ? 'danger' : 'warning',
      onConfirm: () => updateStatusMutation.mutate(newStatus)
    });
  };

  const handleContactFail = () => {
    const failCount = (booking?.contactFailCount || 0) + 1;
    const isAutoCancel = failCount >= 3;
    
    setConfirmModal({
      isOpen: true,
      title: 'GHI NHẬN LIÊN HỆ',
      message: isAutoCancel 
        ? `Lần thất bại thứ 3 cho ID #${id}. Theo quy trình, lịch hẹn này sẽ bị HỦY TỰ ĐỘNG. Bạn có chắc chắn?`
        : `Ghi nhận lần liên hệ thất bại thứ ${failCount}/3 cho ID #${id}. Protocol nhắc nhở sẽ được gửi.`,
      type: isAutoCancel ? 'danger' : 'warning',
      onConfirm: () => updateStatusMutation.mutate('CONTACT_FAIL')
    });
  };

  if (isLoading) return <LoadingSpinner fullScreen />;

  if (!booking) {
    return (
      <div className="text-center py-48 font-black italic uppercase">
        <h2 className="text-3xl font-black text-gray-950 mb-6 italic">Protocol Metadata Not Found</h2>
        <Link to="/staff/bookings" className="text-indigo-600 hover:text-indigo-700 italic font-black uppercase">
          Quay lại danh sách →
        </Link>
      </div>
    );
  }

  const config = statusConfig[booking.bookingStatus] || statusConfig.PENDING;
  const StatusIcon = config.icon;

  return (
    <div className="space-y-10 animate-in fade-in duration-700 italic font-black uppercase">
      <ConfirmModal 
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        type={confirmModal.type}
      />

      {/* Back Button */}
      <Link
        to="/staff/bookings"
        className="inline-flex items-center gap-3 text-gray-400 hover:text-gray-950 transition-all font-black text-[10px] uppercase tracking-widest italic"
      >
        <ArrowLeft size={16} />
        Dữ liệu nguồn / Vận hành Booking
      </Link>

      {/* Booking Header PRO MAX */}
      <div className="bg-white/40 backdrop-blur-xl rounded-[3rem] border border-white p-10 shadow-sm relative overflow-hidden font-black italic">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50/50 rounded-full blur-[100px] -mr-32 -mt-32 pointer-events-none italic font-black" />
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 relative z-10 font-black italic">
          <div>
            <div className="flex items-center gap-3 mb-3 italic">
               <span className="px-3 py-1 bg-gray-950 text-white text-[10px] font-black italic italic font-black italic">BOOKING TRACE</span>
               <span className="font-mono text-gray-400 text-[11px] font-black italic">SESSION_LOG_#{booking.idBooking}</span>
            </div>
            <h1 className="text-5xl font-black text-gray-950 tracking-tighter italic leading-none uppercase italic">
              Chi tiết <span className="text-indigo-600 font-black">Lịch hẹn</span>
            </h1>
            <p className="text-gray-400 mt-4 text-[11px] font-black uppercase tracking-widest italic italic font-black italic">
              INITIALIZED AT: <span className="text-gray-950 italic">{formatDate(booking.ngayTao)}</span>
            </p>
          </div>
          
          <div className={`px-8 py-5 rounded-[2rem] border transition-all duration-500 flex items-center gap-4 shadow-sm italic font-black ${config.bg} ${config.border} ${config.text}`}>
             <div className="w-12 h-12 rounded-2xl bg-white/50 backdrop-blur-md flex items-center justify-center italic">
                <StatusIcon size={24} className={booking.bookingStatus === 'PENDING' ? 'animate-bounce' : ''} />
             </div>
             <div className="italic">
               <p className="text-[10px] font-black uppercase tracking-[0.2em] italic opacity-60">Status Protocol</p>
               <p className="text-xl font-black uppercase italic">{config.label.toUpperCase()}</p>
             </div>
          </div>
        </div>

        {/* Progress Bar */}
        <BookingProgressBar booking={booking} />
      </div>

      {/* Main Content Grid PRO MAX */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 font-black italic uppercase">
        {/* Left: Main Info */}
        <div className="lg:col-span-2 space-y-8 font-black italic uppercase italic">
          {/* Service Info */}
          <div className="bg-white rounded-[2.5rem] border border-gray-100 p-8 shadow-sm font-black italic uppercase italic">
            <div className="flex items-center gap-3 mb-8 italic">
               <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 shadow-sm italic font-black italic">
                  <CalendarDays size={20} className="italic font-black italic" />
               </div>
               <h2 className="text-xl font-black text-gray-950 italic">Thông số <span className="text-indigo-600">Dịch vụ</span></h2>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-8 gap-x-12 italic">
              <div className="space-y-1 italic font-black uppercase">
                <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest italic font-black">Service Category</p>
                <p className="text-[15px] font-black text-gray-950 italic font-black">{SERVICE_MAP[booking.serviceType] || booking.serviceType}</p>
              </div>
              <div className="space-y-1 italic font-black uppercase italic">
                <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest italic font-black">Node Location</p>
                <p className="text-[15px] font-black text-gray-950 italic font-black uppercase italic">{booking.location}</p>
              </div>
              <div className="space-y-1 font-black italic uppercase italic">
                <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest italic font-black uppercase italic">Scheduled Time</p>
                <div className="flex items-center gap-2 italic">
                   <Clock size={16} className="text-indigo-400 font-black italic uppercase italic font-black uppercase italic" />
                   <p className="text-[15px] font-black text-gray-950 font-variant-numeric: tabular-nums italic font-black uppercase italic font-black uppercase italic">{formatDate(booking.ngayGioDat)}</p>
                </div>
              </div>
              {booking.diaChi && (
                <div className="space-y-1 font-black italic uppercase italic font-black uppercase italic">
                  <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest font-black italic uppercase italic font-black uppercase italic">Deployment Address</p>
                  <p className="text-[12px] font-black text-gray-950 leading-relaxed italic font-black uppercase italic font-black uppercase italic font-black uppercase italic">{booking.diaChi}</p>
                </div>
              )}
            </div>

            {booking.ghiChu && (
              <div className="mt-8 pt-8 border-t border-gray-50 italic">
                <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-3 italic font-black uppercase italic font-black uppercase italic">Internal Transmission / Ghi chú</p>
                <div className="bg-gray-50/50 rounded-2xl p-6 border border-gray-100 italic">
                  <p className="text-[13px] font-bold text-gray-700 italic leading-relaxed italic font-black uppercase italic font-black uppercase italic font-black uppercase italic">{booking.ghiChu}</p>
                </div>
              </div>
            )}
          </div>

          {/* Customer & Pet Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 italic">
             {/* Customer Info */}
             <div className="bg-white rounded-[2.5rem] border border-gray-100 p-8 shadow-sm italic font-black uppercase italic font-black uppercase italic">
                <div className="flex items-center gap-3 mb-8 italic font-black uppercase italic">
                   <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 shadow-sm font-black italic uppercase italic font-black uppercase italic">
                      <User size={20} className="font-black italic uppercase italic" />
                   </div>
                   <h2 className="text-xl font-black text-gray-950 italic">Thông tin <span className="text-blue-600">Khách</span></h2>
                </div>
                
                <div className="space-y-6 italic">
                  <div className="flex items-center gap-4 italic">
                    <div className="w-14 h-14 bg-blue-950 rounded-2xl flex items-center justify-center text-white font-black text-xl italic shadow-lg shadow-blue-100 italic font-black uppercase italic font-black uppercase italic">
                       {booking.hoTen?.charAt(0)?.toUpperCase()}
                    </div>
                    <div className="italic">
                      <p className="text-lg font-black text-gray-950 tracking-tight italic">{booking.hoTen}</p>
                      <p className="text-[10px] font-black text-blue-500 uppercase tracking-[0.2em] italic">Identity Verified</p>
                    </div>
                  </div>
                  
                  <div className="space-y-3 pt-2 italic">
                     <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100 italic">
                        <Phone size={14} className="text-gray-400 italic" />
                        <span className="text-xs font-black text-gray-950 italic">{booking.soDienThoai}</span>
                     </div>
                     <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100 italic">
                        <Mail size={14} className="text-gray-400 italic font-black uppercase italic font-black uppercase italic font-black uppercase italic" />
                        <span className="text-xs font-black text-gray-950 italic">{booking.email}</span>
                     </div>
                  </div>
                </div>
             </div>

             {/* Pet Info */}
             <div className="bg-white rounded-[2.5rem] border border-gray-100 p-8 shadow-sm italic font-black uppercase italic font-black uppercase italic font-black uppercase italic">
                <div className="flex items-center gap-3 mb-8 italic">
                   <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600 shadow-sm font-black italic uppercase italic font-black uppercase italic font-black uppercase italic">
                      <PawPrint size={20} className="font-black italic uppercase italic font-black uppercase italic" />
                   </div>
                   <h2 className="text-xl font-black text-gray-950 italic">Đối tượng <span className="text-orange-600">Boss</span></h2>
                </div>

                {booking.petName ? (
                   <div className="space-y-6 italic">
                     <div className="flex items-center gap-4 italic">
                        <div className="w-14 h-14 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-center overflow-hidden shadow-sm italic">
                           {booking.petAvatarUrl ? (
                             <img src={booking.petAvatarUrl} className="w-full h-full object-cover italic font-black uppercase italic font-black uppercase italic" />
                           ) : (
                             <PawPrint size={24} className="text-orange-300 font-black italic uppercase italic font-black uppercase italic" />
                           )}
                        </div>
                        <div className="italic">
                           <p className="text-lg font-black text-gray-950 tracking-tight italic">{booking.petName}</p>
                           <p className="text-[10px] font-black text-orange-500 uppercase tracking-[0.2em] italic font-black uppercase italic">Subject Profile</p>
                        </div>
                     </div>
                     <div className="grid grid-cols-2 gap-4 italic font-black uppercase italic font-black uppercase italic font-black uppercase italic font-black uppercase italic font-black uppercase italic font-black uppercase italic font-black uppercase italic">
                        <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 italic font-black uppercase italic">
                           <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1 italic">Type</p>
                           <p className="text-[11px] font-black text-gray-900 italic">{booking.petType || 'UNKNOWN'}</p>
                        </div>
                        <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 italic font-black uppercase italic">
                           <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1 italic">Breed</p>
                           <p className="text-[11px] font-black text-gray-900 italic font-black uppercase italic">{booking.petBreed || 'UNKNOWN'}</p>
                        </div>
                     </div>
                   </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-10 opacity-30 italic font-black uppercase italic font-black uppercase italic font-black uppercase italic font-black uppercase italic">
                     <Heart size={32} className="mb-2 italic" />
                     <p className="text-[10px] font-black uppercase tracking-widest italic font-black uppercase italic">No Pet Profile Linked</p>
                  </div>
                )}
             </div>
          </div>
        </div>

        {/* Right: Sidebar PRO MAX */}
        <div className="space-y-8 font-black italic uppercase font-black uppercase italic font-black uppercase italic font-black uppercase italic">
          {/* Dispatch Control Panel */}
          <div className="bg-white rounded-[2.5rem] border-2 border-indigo-100 p-8 shadow-xl shadow-indigo-100/20 italic font-black uppercase italic font-black uppercase italic font-black uppercase italic">
            <div className="flex items-center gap-3 mb-8 font-black italic">
               <div className="w-10 h-10 rounded-xl bg-indigo-950 flex items-center justify-center text-white shadow-lg italic font-black uppercase italic font-black uppercase italic">
                  <Zap size={18} className="italic font-black uppercase italic font-black uppercase italic font-black uppercase italic" />
               </div>
               <h3 className="text-lg font-black text-gray-950 italic">Dispatch <span className="text-indigo-600">Control</span></h3>
            </div>
            
            <StaffStatusActions
              booking={booking}
              onStatusChange={handleStatusChange}
              onContactFail={handleContactFail}
              isPending={updateStatusMutation.isPending}
            />
          </div>

          {/* Session Overview Card */}
          <div className="bg-gray-950 rounded-[2.5rem] p-8 text-white shadow-2xl italic font-black uppercase italic font-black uppercase italic font-black uppercase italic">
            <h3 className="text-[11px] font-black text-gray-500 uppercase tracking-[0.3em] mb-8 italic">Session Briefing</h3>
            <div className="space-y-5 italic font-black uppercase italic font-black uppercase italic font-black uppercase italic font-black uppercase italic font-black uppercase italic font-black uppercase italic font-black uppercase italic">
              <div className="flex justify-between items-center italic">
                <span className="text-[10px] font-bold text-gray-500 tracking-wider font-black italic">TRACE_UID</span>
                <span className="text-[12px] font-black font-mono italic">#{booking.idBooking}</span>
              </div>
              <div className="flex justify-between items-center italic">
                <span className="text-[10px] font-bold text-gray-500 tracking-wider font-black italic">PROTOCOL</span>
                <span className="text-[11px] font-black italic uppercase">{booking.serviceType}</span>
              </div>
              <div className="flex justify-between items-center italic">
                <span className="text-[10px] font-bold text-gray-500 tracking-wider font-black italic">SEGMENT</span>
                <span className="text-[11px] font-black italic">{booking.location.toUpperCase()}</span>
              </div>
              <div className="flex justify-between items-center italic">
                <span className="text-[10px] font-bold text-gray-500 tracking-wider font-black italic">LOCKED_TIME</span>
                <span className="text-[11px] font-black italic font-variant-numeric: tabular-nums font-black italic">{formatDate(booking.ngayGioDat)}</span>
              </div>
              
              <div className="pt-5 mt-5 border-t border-white/10 flex justify-between items-center italic font-black uppercase italic font-black uppercase italic font-black uppercase italic font-black uppercase italic font-black uppercase italic font-black uppercase italic font-black uppercase italic">
                <span className="text-[10px] font-bold text-gray-500 tracking-wider font-black italic">CURRENT_STATE</span>
                <span className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] italic border ${config.text} ${config.border} bg-white/5 font-black italic uppercase italic font-black uppercase italic font-black uppercase italic font-black uppercase italic font-black uppercase italic font-black uppercase italic`}>
                  {config.label.toUpperCase()}
                </span>
              </div>
              
              {booking.contactFailCount > 0 && (
                <div className="flex justify-between items-center italic">
                  <span className="text-[10px] font-bold text-rose-400 tracking-wider italic">CONTACT_DROPS</span>
                  <span className="text-[12px] font-black text-rose-400 italic font-black uppercase italic font-black uppercase italic font-black uppercase italic font-black uppercase italic font-black uppercase italic font-black uppercase italic">{booking.contactFailCount}/3</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <style jsx="true">{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
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
