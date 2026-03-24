import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { 
  Package, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Eye, 
  ChevronDown, 
  Truck, 
  ArrowRight, 
  Ban,
  Filter,
  Search,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  ShoppingCart,
  DollarSign,
  Calendar,
  MoreVertical,
  Activity,
  Sparkles,
  CreditCard,
  Users as UsersIcon,
  AlertTriangle,
  Zap
} from 'lucide-react';
import { adminService } from '../../api/adminService';
import { formatPrice, formatDate } from '../../utils/formatters';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';

const statusConfig = {
  PENDING: { 
    label: 'Chờ xác nhận', 
    color: 'text-amber-500 bg-amber-50', 
    border: 'border-amber-100',
    glow: 'shadow-[0_0_10px_rgba(245,158,11,0.2)]',
    icon: Clock 
  },
  CONFIRMED: { 
    label: 'Đã xác nhận', 
    color: 'text-blue-500 bg-blue-50', 
    border: 'border-blue-100',
    glow: 'shadow-[0_0_10px_rgba(59,130,246,0.2)]',
    icon: CheckCircle 
  },
  SHIPPING: { 
    label: 'Đang giao', 
    color: 'text-purple-500 bg-purple-50', 
    border: 'border-purple-100',
    glow: 'shadow-[0_0_10px_rgba(168,85,247,0.2)]',
    icon: Truck 
  },
  DELIVERED: { 
    label: 'Đã giao', 
    color: 'text-emerald-500 bg-emerald-50', 
    border: 'border-emerald-100',
    glow: 'shadow-[0_0_10px_rgba(16,185,129,0.2)]',
    icon: CheckCircle 
  },
  CANCELLED: { 
    label: 'Đã hủy', 
    color: 'text-rose-500 bg-rose-50', 
    border: 'border-rose-100',
    glow: 'shadow-[0_0_10px_rgba(244,63,94,0.2)]',
    icon: XCircle 
  },
};

const STATUS_FLOW = ['PENDING', 'CONFIRMED', 'SHIPPING', 'DELIVERED'];

function getNextStatus(current) {
  const idx = STATUS_FLOW.indexOf(current);
  if (idx === -1 || idx >= STATUS_FLOW.length - 1) return null;
  return STATUS_FLOW[idx + 1];
}

function getNextStatusLabel(nextStatus) {
  const labels = {
    CONFIRMED: 'Xác nhận xử lý',
    SHIPPING: 'Bàn giao vận chuyển',
    DELIVERED: 'Xác nhận hoàn tất',
  };
  return labels[nextStatus] || statusConfig[nextStatus]?.label;
}

// Custom PRO MAX Confirm Modal
function ConfirmModal({ isOpen, onClose, onConfirm, orderId, nextStatusLabel, status }) {
  if (!isOpen) return null;

  const isCancel = status === 'CANCELLED';

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
          
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.4em] mb-2 italic">Yêu cầu xác thực</p>
          <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tighter leading-tight mb-4 text-balance">
            {isCancel ? 'HỦY GIAO DỊCH' : 'CẬP NHẬT TRẠNG THÁI'}
          </h3>
          
          <div className="bg-gray-50/80 rounded-2xl p-4 mb-8 border border-gray-100">
             <p className="text-[11px] font-bold text-gray-600 leading-relaxed italic">
               Bạn đang thực hiện thay đổi trạng thái cho đơn hàng <span className="text-gray-950 font-black not-italic">#{orderId}</span> sang:
             </p>
             <p className={`text-sm font-black uppercase tracking-widest mt-2 ${isCancel ? 'text-rose-600' : 'text-orange-600'}`}>
               {nextStatusLabel}
             </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={onClose}
                className="py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-gray-600 hover:bg-gray-50 focus-visible:ring-4 focus-visible:ring-gray-100 transition-all outline-none"
              >
                Quay lại
              </button>
              <button 
                onClick={() => { onConfirm(); onClose(); }}
                className={`py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white shadow-xl focus-visible:ring-4 transition-all active:scale-95 outline-none ${isCancel ? 'bg-rose-600 focus-visible:ring-rose-200 shadow-rose-200 hover:bg-rose-700' : 'bg-gray-950 focus-visible:ring-gray-200 shadow-gray-200 hover:bg-orange-600'}`}
              >
                Xác nhận lệnh
              </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusDropdown({ order, onStatusChange, isPending }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const nextStatus = getNextStatus(order.orderStatus);
  const canCancel = order.orderStatus !== 'CANCELLED' && order.orderStatus !== 'DELIVERED';
  const isFinal = order.orderStatus === 'DELIVERED' || order.orderStatus === 'CANCELLED';

  if (isFinal) return null;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        disabled={isPending}
        className="group flex items-center gap-2 px-4 py-2 text-[10px] font-black text-blue-600 uppercase tracking-widest bg-blue-50/50 border border-blue-100 rounded-xl hover:bg-gray-950 hover:text-white hover:border-gray-950 focus-visible:ring-4 focus-visible:ring-blue-100 transition-all duration-300 disabled:opacity-50 active:scale-95 outline-none italic"
      >
        Cập nhật
        <ChevronDown size={12} className={`transition-transform duration-300 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-56 bg-white/95 backdrop-blur-xl rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-white/50 z-[100] p-1.5 animate-in fade-in zoom-in-95 duration-200">
          {nextStatus && (
            <button
              onClick={() => { onStatusChange(order.orderId, nextStatus); setOpen(false); }}
              className="flex items-center gap-3 w-full text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest text-blue-600 hover:bg-blue-50 hover:text-blue-700 focus-visible:bg-blue-50 focus-visible:text-blue-700 rounded-xl transition-colors outline-none italic"
            >
              <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              {getNextStatusLabel(nextStatus)}
            </button>
          )}
          {canCancel && (
            <>
              {nextStatus && <div className="h-px bg-gray-100 mx-2 my-1" />}
              <button
                onClick={() => { onStatusChange(order.orderId, 'CANCELLED'); setOpen(false); }}
                className="flex items-center gap-3 w-full text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest text-rose-500 hover:bg-rose-50 hover:text-rose-600 focus-visible:bg-rose-50 focus-visible:text-rose-600 rounded-xl transition-colors outline-none italic"
              >
                <Ban size={14} />
                Hủy giao dịch
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

const StatCard = ({ title, value, icon: Icon, color, trend }) => (
  <div className="relative bg-white/60 backdrop-blur-md p-6 rounded-[2rem] border border-white shadow-sm overflow-hidden group">
    <div className={`absolute top-0 right-0 w-24 h-24 ${color} opacity-[0.03] rounded-full -mr-12 -mt-12 transition-transform duration-700 group-hover:scale-150`} />
    <div className="relative z-10 flex items-center justify-between">
      <div className="space-y-1">
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] italic">{title}</p>
        <p className="text-2xl font-black text-gray-900 tracking-tight italic">{value}</p>
        {trend && (
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-500 italic">
            <TrendingUp size={10} /> {trend}
          </div>
        )}
      </div>
      <div className={`w-12 h-12 bg-white rounded-2xl shadow-sm border border-gray-50 flex items-center justify-center ${color.replace('bg-', 'text-')}`}>
        <Icon size={20} />
      </div>
    </div>
  </div>
);

export default function OrderManagementPage() {
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Confirmation state
  const [confirmingOrder, setConfirmingOrder] = useState(null);

  const queryClient = useQueryClient();

  const { data: ordersData, isLoading } = useQuery({
    queryKey: ['admin-orders', statusFilter, currentPage],
    queryFn: () => adminService.getAllOrders({
      page: currentPage,
      size: 10,
      status: statusFilter === 'ALL' ? undefined : statusFilter,
    }),
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }) => adminService.updateOrderStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-orders']);
      toast.success('Đồng bộ trạng thái vận chuyển thành công!', {
        icon: '🚀',
        style: { borderRadius: '15px', background: '#111', color: '#fff', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }
      });
    },
    onError: () => {
      toast.error('Giao tiếp máy chủ thất bại');
    },
  });

  const handleStatusChange = (orderId, newStatus) => {
    const label = newStatus === 'CANCELLED' ? 'HỦY GIAO DỊCH' : getNextStatusLabel(newStatus)?.toUpperCase();
    setConfirmingOrder({ id: orderId, status: newStatus, label });
  };

  const executeStatusChange = () => {
    if (confirmingOrder) {
      updateStatusMutation.mutate({ id: confirmingOrder.id, status: confirmingOrder.status });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-orange-100 border-t-orange-500" />
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest animate-pulse italic">Đang truy xuất dữ liệu vận hành…</p>
      </div>
    );
  }

  const orders = ordersData?.content || [];
  const totalPages = ordersData?.totalPages || 0;
  const filteredOrders = searchQuery 
    ? orders.filter(o => 
        o.orderNumber?.toLowerCase().includes(searchQuery.toLowerCase()) || 
        o.customerName?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : orders;

  return (
    <div className="space-y-8 pb-10">
      {/* Custom Modal */}
      <ConfirmModal 
        isOpen={!!confirmingOrder}
        onClose={() => setConfirmingOrder(null)}
        onConfirm={executeStatusChange}
        orderId={confirmingOrder?.id}
        nextStatusLabel={confirmingOrder?.label}
        status={confirmingOrder?.status}
      />

      {/* Header PRO MAX */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-[8px] font-black text-gray-400 uppercase tracking-[0.4em] mb-1">
            <Activity size={12} className="text-orange-500" /> Hệ thống vận hành
          </div>
          <h1 className="text-3xl font-black text-gray-950 uppercase tracking-tighter italic leading-none">
            Quản lý <span className="text-orange-500 font-black not-italic">Đơn hàng</span>
          </h1>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-2">Theo dõi và xử lý giao dịch khách hàng</p>
        </div>

        <div className="relative group w-full sm:w-72">
           <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-orange-500 transition-colors" />
           <input 
             type="text" 
             name="search"
             placeholder="TÌM MÃ ĐƠN, TÊN KHÁCH…"
             value={searchQuery}
             onChange={(e) => setSearchQuery(e.target.value)}
             className="w-full pl-12 pr-4 py-3.5 bg-white border border-gray-100 rounded-2xl text-[10px] font-black uppercase tracking-widest italic placeholder:text-gray-300 focus-visible:ring-4 focus-visible:ring-orange-100 focus:border-orange-200 transition-all outline-none"
           />
        </div>
      </div>

      {/* Stats Quick View */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
         <StatCard 
            title="Sẵn sàng xử lý" 
            value={orders.filter(o => o.orderStatus === 'PENDING').length} 
            icon={Clock} 
            color="bg-amber-500"
            trend="+2 đơn mới"
         />
         <StatCard 
            title="Đang vận chuyển" 
            value={orders.filter(o => o.orderStatus === 'SHIPPING').length} 
            icon={Truck} 
            color="bg-purple-500"
         />
         <StatCard 
            title="Hoàn tất hôm nay" 
            value={orders.filter(o => o.orderStatus === 'DELIVERED').length} 
            icon={CheckCircle} 
            color="bg-emerald-500"
            trend="+100% mục tiêu"
         />
         <StatCard 
            title="Dòng tiền ước tính" 
            value={formatPrice(orders.reduce((acc, curr) => acc + (curr.finalAmount || 0), 0))} 
            icon={DollarSign} 
            color="bg-orange-500"
         />
      </div>

      {/* Glassmorphism Navigation Tabs */}
      <div className="bg-white/40 backdrop-blur-md p-1.5 rounded-[1.8rem] border border-white shadow-sm flex flex-wrap gap-1">
        {['ALL', 'PENDING', 'CONFIRMED', 'SHIPPING', 'DELIVERED', 'CANCELLED'].map((status) => {
          const active = statusFilter === status;
          return (
            <button
              key={status}
              onClick={() => { setStatusFilter(status); setCurrentPage(0); }}
              className={`px-6 py-3 text-[10px] font-black uppercase tracking-widest italic transition-all duration-300 rounded-[1.3rem] ${
                active 
                  ? 'bg-gray-950 text-white shadow-lg shadow-gray-200 scale-105' 
                  : 'text-gray-400 hover:text-gray-900 hover:bg-white/50'
              } focus-visible:ring-4 focus-visible:ring-orange-100 outline-none`}
            >
              {status === 'ALL' ? 'Tất cả đơn' : statusConfig[status]?.label}
            </button>
          );
        })}
      </div>

      {/* Data Table PRO MAX */}
      <div className="bg-white/80 backdrop-blur-md rounded-[2.5rem] border border-white shadow-2xl shadow-gray-200/50 min-h-[500px] flex flex-col">
        <div className="flex-1 overflow-x-auto overflow-y-visible custom-scrollbar">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-gray-50/50">
                <th className="px-8 py-6 text-left shrink-0">
                   <div className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] italic">
                     <Package size={14} className="text-orange-500" /> Mã giao dịch
                   </div>
                </th>
                <th className="px-8 py-6 text-left">
                   <div className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] italic">
                     <UsersIcon size={14} /> Hồ sơ khách
                   </div>
                </th>
                <th className="px-8 py-6 text-left">
                   <div className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] italic">
                     <Calendar size={14} /> Thời gian
                   </div>
                </th>
                <th className="px-8 py-6 text-left">
                   <div className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] italic">
                     <CreditCard size={14} /> Giá trị đơn
                   </div>
                </th>
                <th className="px-8 py-6 text-left">
                   <div className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] italic">
                     <Activity size={14} /> Trạng thái
                   </div>
                </th>
                <th className="px-8 py-6 text-right text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] italic">Lệnh thực thi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50/80">
              {filteredOrders.map((order) => {
                const config = statusConfig[order.orderStatus] || statusConfig.PENDING;
                const StatusIcon = config.icon;

                return (
                  <tr key={order.orderId} className="group hover:bg-gray-50/50 transition-colors duration-300">
                    <td className="px-8 py-5">
                      <div className="flex flex-col">
                        <span className="text-sm font-black text-gray-950 tracking-tighter group-hover:text-orange-600 transition-colors italic">
                          #{order.orderNumber || order.orderId}
                        </span>
                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">ID: {order.orderId}</span>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-xs font-black text-gray-400 shadow-inner group-hover:bg-white transition-colors overflow-hidden">
                           {(order.customerName || '?').charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-xs font-black text-gray-950 uppercase tracking-tight">{order.customerName}</p>
                          <p className="text-[10px] font-bold text-gray-400 italic">+{order.customerPhone}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                       <p className="text-xs font-bold text-gray-600 italic">
                         {order.orderDate ? formatDate(order.orderDate) : 'N/A'}
                       </p>
                    </td>
                    <td className="px-8 py-5">
                      <p className="text-sm font-black text-gray-950 tracking-tight italic font-variant-numeric: tabular-nums">
                        {formatPrice(order.finalAmount)}
                      </p>
                    </td>
                    <td className="px-8 py-5">
                      <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest inline-flex items-center gap-2 border ${config.color} ${config.border} ${config.glow}`}>
                        <StatusIcon size={12} className="animate-pulse" />
                        {config.label}
                      </span>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center justify-end gap-3">
                        <Link
                          to={`/staff/orders/${order.orderId}`}
                          className="w-10 h-10 flex items-center justify-center bg-white text-gray-400 hover:bg-gray-950 hover:text-white focus-visible:ring-4 focus-visible:ring-orange-100 outline-none rounded-xl border border-gray-100 transition-all shadow-sm active:scale-95"
                          title="Xem chi tiết hồ sơ đơn hàng"
                        >
                          <Eye size={18} />
                        </Link>
                        <StatusDropdown
                          order={order}
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

        {filteredOrders.length === 0 && (
          <div className="text-center py-20 bg-gray-50/30">
            <div className="w-20 h-20 bg-white rounded-[2rem] shadow-xl border border-gray-100 flex items-center justify-center mx-auto mb-6 relative">
               <Package size={40} className="text-gray-200" />
               <Sparkles size={20} className="absolute -top-2 -right-2 text-orange-200" />
            </div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] italic">Hệ thống sẵn sàng - Chưa có dữ liệu phù hợp</p>
          </div>
        )}
      </div>

      {/* Pagination PRO MAX */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-8 py-6 bg-white/60 backdrop-blur-md rounded-[2rem] border border-white">
          <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest italic">
             Trang <span className="text-gray-950 font-variant-numeric: tabular-nums">{currentPage + 1}</span> / {totalPages}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => { setCurrentPage(Math.max(0, currentPage - 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              disabled={currentPage === 0}
              className="w-12 h-12 flex items-center justify-center bg-white border border-gray-100 rounded-2xl text-gray-400 hover:bg-gray-950 hover:text-white focus-visible:ring-4 focus-visible:ring-gray-200 transition-all disabled:opacity-30 outline-none active:scale-90"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={() => { setCurrentPage(Math.min(totalPages - 1, currentPage + 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              disabled={currentPage >= totalPages - 1}
              className="w-12 h-12 flex items-center justify-center bg-white border border-gray-100 rounded-2xl text-gray-400 hover:bg-gray-950 hover:text-white focus-visible:ring-4 focus-visible:ring-gray-200 transition-all disabled:opacity-30 outline-none active:scale-90"
            >
              <ChevronRight size={20} />
            </button>
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
