import { useParams, Link, useLocation } from 'react-router-dom';
import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  ArrowLeft, Package, MapPin, CreditCard, Clock, CheckCircle, XCircle, 
  Truck, ArrowRight, Ban, ShieldCheck, Download, Star, Bone, PawPrint, 
  ChevronRight, Hash, ReceiptText, User, Zap, AlertTriangle, X, MessageSquare,
  ImagePlus, Film, Trash2, Smile
} from 'lucide-react';
import { orderService } from '../../api/orderService';
import { adminService } from '../../api/adminService';
import { productService } from '../../api/productService';
import { formatPrice, formatDate } from '../../utils/formatters';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import useAuthStore from '../../store/useAuthStore';
import toast from 'react-hot-toast';

const statusConfig = {
  PENDING: { 
    label: 'CHỜ XÁC NHẬN', 
    color: 'bg-amber-50 text-amber-600 border-amber-100', 
    icon: Clock,
    description: 'Đơn hàng đang chờ PawVerse kiểm tra'
  },
  CONFIRMED: { 
    label: 'ĐÃ XÁC NHẬN', 
    color: 'bg-blue-50 text-blue-600 border-blue-100', 
    icon: ShieldCheck,
    description: 'Đơn hàng đã được xác nhận và đang chờ xử lý'
  },
  PROCESSING: { 
    label: 'ĐANG CHUẨN BỊ', 
    color: 'bg-indigo-50 text-indigo-600 border-indigo-100', 
    icon: Package,
    description: 'Đơn hàng đang được đóng gói cẩn thận'
  },
  SHIPPED: { 
    label: 'ĐANG GIAO', 
    color: 'bg-purple-50 text-purple-600 border-purple-100', 
    icon: Truck,
    description: 'Shipper đang hỏa tốc mang quà đến cho Boss'
  },
  DELIVERED: { 
    label: 'ĐÃ GIAO', 
    color: 'bg-emerald-50 text-emerald-600 border-emerald-100', 
    icon: CheckCircle,
    description: 'Giao hàng thành công! Boss đã có quà mới'
  },
  CANCELLED: { 
    label: 'ĐÃ HỦY', 
    color: 'bg-rose-50 text-rose-600 border-rose-100', 
    icon: XCircle,
    description: 'Đơn hàng này đã bị hủy bỏ'
  },
};

const STATUS_FLOW = ['PENDING', 'CONFIRMED', 'SHIPPING', 'DELIVERED'];

function getNextStatus(current) {
  const idx = STATUS_FLOW.indexOf(current);
  if (idx === -1 || idx >= STATUS_FLOW.length - 1) return null;
  return STATUS_FLOW[idx + 1];
}

// Custom PRO MAX Confirm Modal
function ConfirmModal({ isOpen, onClose, onConfirm, orderId, nextStatusLabel, type }) {
  if (!isOpen) return null;

  const isCancel = type === 'CANCEL';

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-gray-950/40 backdrop-blur-sm animate-in fade-in duration-300" 
        onClick={onClose} 
      />
      <div className="relative bg-white/95 backdrop-blur-2xl rounded-[2.5rem] border border-white shadow-[0_32px_64px_-16px_rgba(0,0,0,0.2)] w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-300">
        <div className={`h-2 w-full ${isCancel ? 'bg-rose-500' : 'bg-orange-500'}`} />
        
        <div className="p-8 text-center">
          <div className={`w-20 h-20 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-xl ${isCancel ? 'bg-rose-50 bg-opacity-50 text-rose-500 shadow-rose-100' : 'bg-orange-50 text-orange-500 shadow-orange-100'}`}>
            {isCancel ? <Ban size={36} /> : <Zap size={36} className="animate-pulse" />}
          </div>
          
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.4em] mb-2 italic">Hệ thống PawVerse</p>
          <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tighter leading-tight mb-4">
            {isCancel ? 'HỦY GIAO DỊCH' : 'CẬP NHẬT TRẠNG THÁI'}
          </h3>
          
          <div className="bg-gray-50/80 rounded-2xl p-4 mb-8 border border-gray-100 font-bold italic text-gray-600 text-[11px] leading-relaxed">
             Xác nhận thay đổi trang thái đơn <span className="text-gray-950 font-black not-italic">#{orderId}</span> sang:<br/>
             <span className={`text-sm font-black uppercase tracking-widest mt-2 block ${isCancel ? 'text-rose-600' : 'text-orange-600'}`}>
               {nextStatusLabel}
             </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
             <button 
               onClick={onClose}
               className="py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-all outline-none"
             >
               Để sau
             </button>
             <button 
               onClick={() => { onConfirm(); onClose(); }}
               className={`py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white shadow-xl transition-all active:scale-95 outline-none ${isCancel ? 'bg-rose-600 shadow-rose-200 hover:bg-rose-700' : 'bg-gray-900 shadow-gray-200 hover:bg-orange-600'}`}
             >
               Xác nhận
             </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function OrderProgressBar({ currentStatus }) {
  const isCancelled = currentStatus === 'CANCELLED';
  const currentIdx = STATUS_FLOW.indexOf(currentStatus);

  return (
    <div className="mt-12 py-10 px-8 bg-white/50 backdrop-blur-md rounded-[3rem] border border-white/50 shadow-inner">
      <div className="flex items-center justify-between relative mb-4">
        {isCancelled ? (
          <div className="flex items-center gap-4 w-full justify-center">
            <div className="w-16 h-16 rounded-[2rem] bg-rose-50 flex items-center justify-center text-rose-600 shadow-xl shadow-rose-100 animate-bounce">
                <XCircle size={32} />
            </div>
            <div className="text-center">
                <p className="text-2xl font-black text-rose-600 uppercase tracking-tighter">ĐƠN HÀNG ĐÃ HỦY</p>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Hành trình tạm dừng tại đây</p>
            </div>
          </div>
        ) : (
          <>
            <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-100 -translate-y-1/2 rounded-full overflow-hidden">
                <div 
                    className="h-full bg-orange-600 transition-all duration-1000 ease-out"
                    style={{ width: `${(currentIdx / (STATUS_FLOW.length - 1)) * 100}%` }}
                ></div>
            </div>

            {STATUS_FLOW.map((status, idx) => {
              const isCompleted = currentIdx >= idx;
              const isCurrent = currentIdx === idx;
              const StepIcon = statusConfig[status]?.icon || Package;

              return (
                <div key={status} className="flex flex-col items-center relative z-10">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border-2 transition-all duration-500 transform ${
                    isCompleted
                      ? 'bg-orange-600 border-orange-600 text-white shadow-xl shadow-orange-200'
                      : 'bg-white border-gray-100 text-gray-300'
                  } ${isCurrent ? 'scale-125 rotate-6' : ''}`}>
                    {isCompleted ? <CheckCircle size={24} /> : <StepIcon size={24} />}
                  </div>
                  <div className="absolute top-16 whitespace-nowrap text-center">
                    <p className={`text-[10px] font-black uppercase tracking-widest ${
                      isCompleted ? 'text-gray-900' : 'text-gray-300'
                    }`}>
                      {statusConfig[status]?.label}
                    </p>
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
}

function ReviewModal({ isOpen, onClose, onSubmit, productName, isPending }) {
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [mediaFiles, setMediaFiles] = useState([]);
  const [mediaPreviews, setMediaPreviews] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const textareaRef = useRef(null);

  const EMOJI_LIST = [
    '😀','😊','😍','🥰','😘','😎','🤩','😂','🤣','😅',
    '😢','😭','😤','😡','🤔','😱','🥺','😴','🤢','🤮',
    '👍','👎','👏','🙏','💪','✌️','🤝','❤️','💕','💖',
    '⭐','🌟','✨','🔥','💯','🎉','🎊','🏆','👑','💎',
    '🐶','🐱','🐾','🦴','🐕','🐈','🐰','🐹','🐦','🐟',
    '🛍️','📦','🚚','✅','❌','⚠️','💰','🎁','🛒','📱',
  ];

  const insertEmoji = (emoji) => {
    const textarea = textareaRef.current;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newComment = comment.slice(0, start) + emoji + comment.slice(end);
      setComment(newComment);
      setTimeout(() => {
        textarea.focus();
        textarea.selectionStart = textarea.selectionEnd = start + emoji.length;
      }, 0);
    } else {
      setComment(prev => prev + emoji);
    }
  };

  if (!isOpen) return null;

  const handleAddFiles = (e) => {
    const files = Array.from(e.target.files);
    if (mediaFiles.length + files.length > 5) {
      toast.error('Tối đa 5 file ảnh/video');
      return;
    }
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/webm'];
    const validFiles = files.filter(f => {
      if (!allowedTypes.includes(f.type)) {
        toast.error(`${f.name}: Định dạng không hợp lệ`);
        return false;
      }
      const isVideo = f.type.startsWith('video/');
      const maxSize = isVideo ? 30 * 1024 * 1024 : 5 * 1024 * 1024;
      if (f.size > maxSize) {
        toast.error(`${f.name}: Vượt quá ${isVideo ? '30MB' : '5MB'}`);
        return false;
      }
      return true;
    });

    const newFiles = [...mediaFiles, ...validFiles];
    setMediaFiles(newFiles);

    const newPreviews = validFiles.map(f => ({
      url: URL.createObjectURL(f),
      type: f.type.startsWith('video/') ? 'video' : 'image',
      name: f.name,
    }));
    setMediaPreviews(prev => [...prev, ...newPreviews]);
    e.target.value = '';
  };

  const removeFile = (index) => {
    URL.revokeObjectURL(mediaPreviews[index].url);
    setMediaFiles(prev => prev.filter((_, i) => i !== index));
    setMediaPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!comment.trim()) {
      toast.error('Vui lòng nhập nội dung đánh giá');
      return;
    }

    let mediaUrls = [];
    if (mediaFiles.length > 0) {
      setUploading(true);
      try {
        mediaUrls = await productService.uploadReviewMedia(mediaFiles);
      } catch (err) {
        toast.error(err?.response?.data?.message || 'Upload ảnh/video thất bại');
        setUploading(false);
        return;
      }
      setUploading(false);
    }

    onSubmit({ rating, comment, mediaUrls });
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gray-950/40 backdrop-blur-sm animate-in fade-in duration-300" onClick={onClose} />
      <div className="relative bg-white/95 backdrop-blur-2xl rounded-[2.5rem] border border-white shadow-[0_32px_64px_-16px_rgba(0,0,0,0.2)] w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-300 max-h-[90vh] overflow-y-auto">
        <div className="h-2 w-full bg-amber-500" />
        <div className="p-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600 shadow-lg shadow-amber-100">
                <Star size={24} />
              </div>
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">ĐÁNH GIÁ SẢN PHẨM</p>
                <p className="text-sm font-black text-gray-900 tracking-tight italic truncate max-w-[280px]">{productName}</p>
              </div>
            </div>
            <button onClick={onClose} className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all">
              <X size={18} />
            </button>
          </div>

          <div className="mb-6">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-3">CHỌN SỐ SAO</p>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="transition-all duration-200 hover:scale-125 active:scale-90"
                >
                  <Star
                    size={36}
                    className={`${
                      star <= (hoverRating || rating)
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-gray-200'
                    } transition-colors`}
                  />
                </button>
              ))}
              <span className="ml-3 self-center text-lg font-black text-gray-900 italic">{hoverRating || rating}/5</span>
            </div>
          </div>

          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">NỘI DUNG ĐÁNH GIÁ</p>
              <button
                type="button"
                onClick={() => setShowEmojiPicker(prev => !prev)}
                className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
                  showEmojiPicker ? 'bg-amber-100 text-amber-600' : 'bg-gray-50 text-gray-400 hover:text-amber-500 hover:bg-amber-50'
                }`}
                title="Chọn emoji"
              >
                <Smile size={16} />
              </button>
            </div>

            {showEmojiPicker && (
              <div className="mb-3 p-3 bg-white rounded-2xl border border-gray-100 shadow-lg shadow-gray-100/50 max-h-40 overflow-y-auto">
                <div className="grid grid-cols-10 gap-1">
                  {EMOJI_LIST.map((emoji, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => insertEmoji(emoji)}
                      className="w-8 h-8 flex items-center justify-center text-lg rounded-lg hover:bg-amber-50 hover:scale-125 transition-all active:scale-90"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <textarea
              ref={textareaRef}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Chia sẻ trải nghiệm của bạn về sản phẩm... 🐾"
              rows={4}
              maxLength={5000}
              className="w-full px-5 py-4 rounded-2xl border border-gray-100 bg-gray-50/50 text-sm text-gray-900 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-300 resize-none transition-all"
            />
            <p className="text-right text-[10px] font-bold text-gray-300 mt-1">{comment.length}/5000</p>
          </div>

          <div className="mb-6">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-3">ẢNH / VIDEO <span className="text-gray-300">(không bắt buộc, tối đa 5)</span></p>
            
            <div className="flex flex-wrap gap-3">
              {mediaPreviews.map((preview, idx) => (
                <div key={idx} className="relative w-20 h-20 rounded-xl overflow-hidden border border-gray-100 group">
                  {preview.type === 'video' ? (
                    <div className="w-full h-full bg-gray-900 flex items-center justify-center">
                      <Film size={24} className="text-white" />
                    </div>
                  ) : (
                    <img src={preview.url} alt="" className="w-full h-full object-cover" />
                  )}
                  <button
                    onClick={() => removeFile(idx)}
                    className="absolute top-1 right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 size={10} className="text-white" />
                  </button>
                </div>
              ))}

              {mediaFiles.length < 5 && (
                <label className="w-20 h-20 rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center cursor-pointer hover:border-amber-300 hover:bg-amber-50/50 transition-all">
                  <ImagePlus size={20} className="text-gray-300" />
                  <span className="text-[8px] font-bold text-gray-300 mt-1">THÊM</span>
                  <input
                    type="file"
                    multiple
                    accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm"
                    onChange={handleAddFiles}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={onClose}
              className="py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-all"
            >
              Để sau
            </button>
            <button
              onClick={handleSubmit}
              disabled={isPending || uploading || !comment.trim()}
              className="py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white bg-amber-500 shadow-xl shadow-amber-200 hover:bg-amber-600 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? 'ĐANG TẢI...' : isPending ? 'ĐANG GỬI...' : 'GỬI ĐÁNH GIÁ'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function StaffStatusActions({ order, onStatusChange, isPending }) {
  const nextStatus = getNextStatus(order.orderStatus);
  const isFinal = order.orderStatus === 'DELIVERED' || order.orderStatus === 'CANCELLED';
  const canCancel = !isFinal;

  if (isFinal) {
    return (
      <div className="p-6 bg-emerald-50 rounded-[2.5rem] border border-emerald-100 flex items-center gap-3 text-emerald-600">
        <CheckCircle size={20} />
        <span className="text-xs font-black uppercase tracking-widest">HOÀN TẤT ĐƠN HÀNG</span>
      </div>
    );
  }

  const nextLabels = {
    CONFIRMED: { text: 'XÁC NHẬN ĐƠN HÀNG', desc: 'Xác nhận chuẩn bị hàng' },
    SHIPPING: { text: 'BẮT ĐẦU GIAO HÀNG', desc: 'Bàn giao vận chuyển' },
    DELIVERED: { text: 'HOÀN TẤT ĐƠN HÀNG', desc: 'Xác nhận đã nhận hàng' },
  };

  return (
    <div className="space-y-4">
      {nextStatus && (
        <button
          onClick={() => onStatusChange(nextStatus)}
          disabled={isPending}
          className="w-full h-16 bg-gray-900 text-white rounded-[1.5rem] font-black text-xs uppercase tracking-widest hover:bg-orange-600 transition-all shadow-xl hover:-translate-y-1 flex items-center justify-center gap-3 active:scale-95"
        >
          <ArrowRight size={18} />
          {nextLabels[nextStatus]?.text || statusConfig[nextStatus]?.label}
        </button>
      )}
      {canCancel && (
        <button
          onClick={() => onStatusChange('CANCELLED')}
          disabled={isPending}
          className="w-full h-14 border-2 border-rose-100 text-rose-600 rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest hover:bg-rose-50 transition-all flex items-center justify-center gap-2 active:scale-95"
        >
          <Ban size={16} />
          HỦY BỎ ĐƠN HÀNG
        </button>
      )}
    </div>
  );
}

export default function OrderDetailPage() {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const location = useLocation();
  
  const isStaffView = location.pathname.startsWith('/staff') || location.pathname.startsWith('/admin');
  const { isAuthenticated } = useAuthStore();

  const [confirmModal, setConfirmModal] = useState({ isOpen: false, type: 'UPDATE', label: '', status: '' });
  const [reviewModal, setReviewModal] = useState({ isOpen: false, productId: null, productName: '' });

  const { data: order, isLoading } = useQuery({
    queryKey: ['order', id],
    queryFn: () => isStaffView ? adminService.getOrderById(id) : orderService.getOrderById(id),
  });

  // Fetch which products in this order have already been reviewed
  const { data: reviewedProductIds = [] } = useQuery({
    queryKey: ['reviewed-products', id],
    queryFn: () => productService.getReviewedProducts(id),
    enabled: !!order && order.orderStatus === 'DELIVERED' && isAuthenticated && !isStaffView,
  });

  const reviewMutation = useMutation({
    mutationFn: (data) => productService.createReview(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['order', id]);
      queryClient.invalidateQueries(['reviewed-products', id]);
      setReviewModal({ isOpen: false, productId: null, productName: '' });
      toast.success('ĐÁNH GIÁ THÀNH CÔNG! CẢM ƠN BẠN 🎉', {
        icon: '⭐',
        style: { borderRadius: '15px', background: '#111', color: '#fff', fontSize: '11px', fontWeight: 'bold' }
      });
    },
    onError: (err) => toast.error(err?.response?.data?.message || 'Không thể gửi đánh giá'),
  });

  const cancelMutation = useMutation({
    mutationFn: () => orderService.cancelOrder(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['order', id]);
      queryClient.invalidateQueries(['orders']);
      toast.success('HỦY ĐƠN HÀNG THÀNH CÔNG', {
        icon: '🛑',
        style: { borderRadius: '15px', background: '#111', color: '#fff', fontSize: '11px', fontWeight: 'bold' }
      });
    },
    onError: () => toast.error('Không thể hủy đơn hàng vào lúc này'),
  });

  const updateStatusMutation = useMutation({
    mutationFn: (status) => adminService.updateOrderStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries(['order', id]);
      queryClient.invalidateQueries(['admin-orders']);
      toast.success('CẬP NHẬT TRẠNG THÁI THÀNH CÔNG!', {
        icon: '✅',
        style: { borderRadius: '15px', background: '#111', color: '#fff', fontSize: '11px', fontWeight: 'bold' }
      });
    },
    onError: () => toast.error('Cập nhật thất bại'),
  });

  const handleConfirmAction = () => {
    if (confirmModal.type === 'CANCEL') {
      cancelMutation.mutate();
    } else {
      updateStatusMutation.mutate(confirmModal.status);
    }
  };

  const showConfirm = (type, status, label) => {
    setConfirmModal({ isOpen: true, type, label, status });
  };

  if (isLoading) return <div className="min-h-[80vh] flex items-center justify-center"><LoadingSpinner /></div>;

  if (!order) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-10 bg-[#fcfdfd]">
        <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-6"><XCircle size={48} className="text-gray-300" /></div>
        <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tighter mb-4">KHÔNG TÌM THẤY ĐƠN HÀNG</h2>
        <Link to={isStaffView ? '/staff/orders' : '/orders'} className="flex items-center gap-2 font-black text-xs uppercase tracking-widest text-orange-600 hover:text-orange-700">
           <ArrowLeft size={16} /> QUAY LẠI DANH SÁCH
        </Link>
      </div>
    );
  }

  const config = statusConfig[order.orderStatus] || statusConfig.PENDING;
  const StatusIcon = config.icon;
  const canUserCancel = order.orderStatus === 'PENDING';

  return (
    <div className="bg-[#fcfdfd] min-h-screen relative overflow-hidden">
      <ConfirmModal 
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
        onConfirm={handleConfirmAction}
        orderId={order.orderNumber || order.orderId}
        nextStatusLabel={confirmModal.label}
        type={confirmModal.type}
      />

      <ReviewModal
        isOpen={reviewModal.isOpen}
        onClose={() => setReviewModal({ isOpen: false, productId: null, productName: '' })}
        onSubmit={({ rating, comment, mediaUrls }) => reviewMutation.mutate({ productId: reviewModal.productId, rating, comment, mediaUrls })}
        productName={reviewModal.productName}
        isPending={reviewMutation.isPending}
      />

      <div className="absolute top-[5%] right-[-5%] opacity-[0.02] rotate-12 pointer-events-none"><Package size={400} /></div>
      <div className="absolute bottom-[10%] left-[-5%] opacity-[0.03] -rotate-12 pointer-events-none"><Bone size={350} /></div>

      <div className="container mx-auto px-4 max-w-6xl relative z-10 py-16">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
            <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
                   <Link to={isStaffView ? '/staff/orders' : '/orders'} className="hover:text-orange-600 transition-colors">
                     {isStaffView ? 'QUẢN LÝ ĐƠN HÀNG' : 'ĐƠN HÀNG CỦA TÔI'}
                   </Link>
                   <ChevronRight size={12} className="text-gray-300" />
                   <span className="text-gray-900 tracking-tighter">ORDER: #{order.orderNumber || order.orderId}</span>
                </div>
                <h1 className="text-5xl lg:text-7xl font-black text-gray-900 uppercase tracking-tighter leading-none italic">
                    CHI TIẾT <span className="text-orange-600 not-italic">ĐƠN QUÀ</span>
                </h1>
            </div>

            <div className="flex items-center gap-3">
                 {order.orderStatus === 'DELIVERED' && (
                    <button
                      onClick={async () => {
                        try {
                          const blob = isStaffView
                            ? await adminService.downloadInvoice(id)
                            : await orderService.downloadInvoice(id);
                          const url = URL.createObjectURL(blob);
                          const link = document.createElement('a');
                          link.href = url;
                          link.download = `hoadon-${order.orderNumber || order.orderId}.pdf`;
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);
                          URL.revokeObjectURL(url);
                          toast.success('Xuất hóa đơn thành công!');
                        } catch {
                          toast.error('Không thể xuất hóa đơn PDF');
                        }
                      }}
                      className="h-14 px-8 bg-emerald-600 text-white rounded-full font-black text-[10px] uppercase tracking-widest hover:bg-emerald-700 shadow-xl flex items-center gap-3"
                    >
                      <Download size={18} /> XUẤT HÓA ĐƠN PDF
                    </button>
                 )}
                 {!isStaffView && canUserCancel && (
                    <button onClick={() => showConfirm('CANCEL', 'CANCELLED', 'HỦY GIAO DỊCH')} className="h-14 px-8 border-2 border-rose-100 text-rose-600 rounded-full font-black text-[10px] uppercase tracking-widest hover:bg-rose-50">
                      HỦY ĐƠN HÀNG
                    </button>
                 )}
            </div>
        </div>

        <div className="bg-white rounded-[4rem] border border-gray-100 p-2 shadow-sm mb-12">
            <div className="bg-[#fcfdfd] rounded-[3.5rem] p-10 md:p-16">
                <div className="flex flex-wrap items-center justify-between gap-10">
                    <div className="flex items-center gap-6">
                        <div className={`w-20 h-20 rounded-[2rem] flex items-center justify-center border shadow-xl ${config.color}`}>
                            <StatusIcon size={32} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.3em] mb-1 italic">MÃ TRẠNG THÁI</p>
                            <h2 className={`text-3xl font-black tracking-tighter italic ${config.color.split(' ')[1]}`}>{config.label}</h2>
                            <p className="text-xs font-bold text-gray-400 mt-1 uppercase italic tracking-widest">{config.description}</p>
                        </div>
                    </div>
                    <div className="flex gap-10 border-l border-gray-100 pl-10">
                         <div>
                            <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.3em] mb-1 italic">NGÀY ĐẶT</p>
                            <p className="text-xl font-black text-gray-900 tracking-tighter italic">{order.orderDate ? formatDate(order.orderDate) : 'N/A'}</p>
                         </div>
                    </div>
                </div>
                <OrderProgressBar currentStatus={order.orderStatus} />
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            <div className="lg:col-span-8 space-y-8">
                <div className="bg-white rounded-[3.5rem] border border-gray-100 p-2 shadow-sm">
                    <div className="bg-[#fcfdfd] rounded-[3rem] p-10">
                        <div className="flex items-center gap-4 mb-10">
                            <div className="w-12 h-12 bg-gray-950 rounded-2xl flex items-center justify-center text-white shadow-xl rotate-3"><Package size={24} className="text-orange-500" /></div>
                            <h3 className="text-2xl font-black text-gray-950 uppercase tracking-tighter italic">SẢN PHẨM ĐÃ CHỌN</h3>
                        </div>
                        <div className="space-y-4">
                            {order.items?.map((item, idx) => (
                                <div key={idx} className="group flex gap-6 p-6 rounded-[2.5rem] border border-gray-50 bg-white hover:border-orange-100 transition-all duration-500">
                                    <div className="w-32 h-32 rounded-[2rem] overflow-hidden bg-gray-50 border border-gray-100 shrink-0">
                                        <img src={item.productImage || '/placeholder-product.jpg'} alt={item.productName} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                    </div>
                                    <div className="flex-1 flex flex-col justify-between py-2">
                                        <div className="flex justify-between items-start">
                                            <h4 className="text-xl font-black text-gray-950 uppercase tracking-tighter italic">{item.productName}</h4>
                                            <p className="text-xl font-black text-orange-600 tracking-tighter italic">{formatPrice(item.price)}</p>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-50 px-3 py-1 rounded-full">SỐ LƯỢNG: {item.quantity}</span>
                                            <div className="flex items-center gap-3">
                                                {!isStaffView && isAuthenticated && order.orderStatus === 'DELIVERED' && (
                                                    reviewedProductIds.includes(item.productId) ? (
                                                      <span className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 text-[10px] font-black uppercase tracking-widest">
                                                        <CheckCircle size={12} /> ĐÃ ĐÁNH GIÁ
                                                      </span>
                                                    ) : (
                                                      <button
                                                        onClick={() => setReviewModal({ isOpen: true, productId: item.productId, productName: item.productName })}
                                                        className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-amber-50 text-amber-600 border border-amber-100 text-[10px] font-black uppercase tracking-widest hover:bg-amber-100 hover:border-amber-200 transition-all active:scale-95"
                                                      >
                                                        <Star size={12} className="fill-amber-400" /> ĐÁNH GIÁ
                                                      </button>
                                                    )
                                                )}
                                                <p className="text-xs font-black text-gray-950 italic">Tổng: {formatPrice(item.total || item.price * item.quantity)}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <div className="lg:col-span-4 space-y-8">
                {isStaffView && (
                    <div className="bg-white rounded-[3.5rem] border-2 border-blue-600/10 p-2 shadow-sm">
                        <div className="bg-blue-50/20 rounded-[3rem] p-8">
                            <h3 className="text-lg font-black text-blue-900 uppercase tracking-widest italic mb-6 flex items-center gap-2">
                              <ShieldCheck size={20} /> QUẢN TRỊ VIÊN
                            </h3>
                            <StaffStatusActions 
                                order={order} 
                                onStatusChange={(s) => showConfirm('UPDATE', s, statusConfig[s]?.label)}
                                isPending={updateStatusMutation.isPending} 
                            />
                        </div>
                    </div>
                )}
                
                <div className="bg-gray-950 rounded-[3.5rem] p-2 shadow-2xl">
                    <div className="bg-gray-900 rounded-[3rem] p-10 text-white border border-gray-800">
                        <h3 className="text-xl font-black uppercase tracking-tighter italic mb-10 flex items-center gap-3">
                           <ReceiptText size={20} className="text-orange-500" /> TỔNG KẾT ĐƠN
                        </h3>
                        <div className="space-y-4 mb-10 pb-10 border-b border-white/5">
                            <div className="flex justify-between text-[10px] font-black text-gray-500 uppercase tracking-widest">
                                <span>TẠM TÍNH</span>
                                <span className="text-white italic">{formatPrice(order.totalAmount)}</span>
                            </div>
                            <div className="flex justify-between text-[10px] font-black text-gray-500 uppercase tracking-widest">
                                <span>PHÍ SHIP</span>
                                <span className="text-white italic">{formatPrice(order.shippingFee || 0)}</span>
                            </div>
                        </div>
                        <div className="text-center">
                            <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.4em] mb-2">THỰC CHI TẾ</p>
                            <p className="text-5xl font-black text-orange-500 tracking-tighter italic">{formatPrice(order.finalAmount)}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}
