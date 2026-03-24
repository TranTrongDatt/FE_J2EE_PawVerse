import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  ArrowLeft, Package, MapPin, CreditCard, Clock, CheckCircle, XCircle, 
  Truck, ArrowRight, Ban, ShieldCheck, Download, Star, Bone, PawPrint, 
  ChevronRight, Hash, ReceiptText, User, Zap, AlertTriangle
} from 'lucide-react';
import { orderService } from '../../api/orderService';
import { adminService } from '../../api/adminService';
import { formatPrice, formatDate } from '../../utils/formatters';
import LoadingSpinner from '../../components/common/LoadingSpinner';
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

const paymentMethodLabels = {
  COD: 'Thanh toán khi nhận hàng (COD)',
  VNPAY: 'Thanh toán qua VNPay',
  MOMO: 'Thanh toán qua Ví MoMo',
};

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
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const location = useLocation();
  
  const isStaffView = location.pathname.startsWith('/staff') || location.pathname.startsWith('/admin');

  const [confirmModal, setConfirmModal] = useState({ isOpen: false, type: 'UPDATE', label: '', status: '' });

  const { data: order, isLoading } = useQuery({
    queryKey: ['order', id],
    queryFn: () => isStaffView ? adminService.getOrderById(id) : orderService.getOrderById(id),
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
                    <button onClick={() => adminService.downloadInvoice(id)} className="h-14 px-8 bg-emerald-600 text-white rounded-full font-black text-[10px] uppercase tracking-widest hover:bg-emerald-700 shadow-xl flex items-center gap-3">
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
                                            <p className="text-xs font-black text-gray-950 italic">Tổng: {formatPrice(item.total || item.price * item.quantity)}</p>
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
