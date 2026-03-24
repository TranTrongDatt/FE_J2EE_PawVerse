import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Package, Clock, CheckCircle, XCircle, Eye, ArrowRight, ShoppingBag, Truck, Calendar, Hash, Bone, PawPrint, ChevronRight } from 'lucide-react';
import { orderService } from '../../api/orderService';
import { formatPrice, formatDate } from '../../utils/formatters';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const statusConfig = {
  PENDING: { 
    label: 'CHỜ XÁC NHẬN', 
    color: 'bg-amber-50 text-amber-600 border-amber-100', 
    icon: Clock,
    description: 'Đơn hàng đang chờ PawVerse kiểm tra'
  },
  PROCESSING: { 
    label: 'ĐÃ XÁC NHẬN', 
    color: 'bg-blue-50 text-blue-600 border-blue-100', 
    icon: CheckCircle,
    description: 'Đơn hàng đang được chuẩn bị'
  },
  SHIPPED: { 
    label: 'ĐANG GIAO', 
    color: 'bg-purple-50 text-purple-600 border-purple-100', 
    icon: Truck,
    description: 'Shipper đang hỏa tốc mang quà đến Boss'
  },
  DELIVERED: { 
    label: 'ĐÃ GIAO', 
    color: 'bg-emerald-50 text-emerald-600 border-emerald-100', 
    icon: CheckCircle,
    description: 'Boss đã nhận được quà rồi Sen ơi!'
  },
  CANCELLED: { 
    label: 'ĐÃ HỦY', 
    color: 'bg-rose-50 text-rose-600 border-rose-100', 
    icon: XCircle,
    description: 'Đơn hàng đã bị hủy bỏ'
  },
};

export default function OrdersPage() {
  const [filter, setFilter] = useState('ALL');

  const { data: ordersData, isLoading } = useQuery({
    queryKey: ['orders', filter],
    queryFn: () => orderService.getUserOrders({ 
      status: filter === 'ALL' ? undefined : filter 
    }),
  });

  if (isLoading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  const orders = ordersData?.content || [];

  return (
    <div className="bg-[#fcfdfd] min-h-screen py-16 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-[10%] right-[5%] opacity-[0.03] rotate-12 pointer-events-none">
        <ShoppingBag size={300} />
      </div>
      <div className="absolute bottom-[5%] left-[-5%] opacity-[0.02] -rotate-12 pointer-events-none">
        <Bone size={400} />
      </div>
      <div className="absolute top-[40%] left-[10%] opacity-[0.02] rotate-45 pointer-events-none">
        <PawPrint size={150} />
      </div>

      <div className="container mx-auto px-4 max-w-6xl relative z-10 pt-10">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-8 ml-2">
          <Link to="/" className="hover:text-orange-600 transition-colors">TRANG CHỦ</Link>
          <ChevronRight size={12} className="text-gray-300" />
          <span className="text-gray-900">ĐƠN HÀNG CỦA TÔI</span>
        </div>

        {/* Header Section */}
        <div className="mb-16">
          <h1 className="text-6xl font-black text-gray-900 uppercase tracking-tighter leading-none mb-4">
            ĐƠN HÀNG <span className="text-orange-600">CỦA TÔI</span>
          </h1>
          <p className="text-gray-400 font-bold text-xs uppercase tracking-[0.3em]">Theo dõi hành trình quà tặng của Boss</p>
        </div>

        {/* Filter Bar - Premium Dashboard Style */}
        <div className="bg-white/70 backdrop-blur-xl rounded-[2.5rem] border border-white p-3 shadow-xl shadow-gray-200/40 mb-12 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-2 min-w-max">
            {['ALL', 'PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'].map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                aria-pressed={filter === status}
                className={`px-8 py-4 rounded-3xl font-black text-[10px] uppercase tracking-widest transition-colors duration-300 focus-visible:ring-4 focus-visible:ring-orange-200 focus-visible:outline-none ${
                  filter === status
                    ? 'bg-orange-600 text-white shadow-lg shadow-orange-200 translate-y-[-2px]'
                    : 'text-gray-400 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                {status === 'ALL' ? 'TẤT CẢ ĐƠN' : statusConfig[status]?.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content Area */}
        {orders.length === 0 ? (
          <div className="bg-white rounded-[4rem] p-24 text-center border border-dashed border-gray-200 shadow-sm relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-gray-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
            <div className="relative z-10">
                <div className="w-32 h-32 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-8 group-hover:scale-110 transition-transform duration-500">
                    <Package size={64} className="text-gray-300 group-hover:text-orange-600 transition-colors duration-500" />
                </div>
                <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tighter mb-4">
                  CHƯA CÓ ĐƠN HÀNG NÀO!
                </h2>
                <p className="text-gray-400 font-bold text-sm uppercase tracking-widest mb-10 max-w-md mx-auto leading-relaxed">
                  {filter === 'ALL' 
                    ? 'Sen ơi, có vẻ như Boss vẫn đang chờ quà từ Sen đó. Hãy ghé cửa hàng ngay nhé!'
                    : `Hiện không có đơn hàng nào ở trạng thái ${statusConfig[filter]?.label.toLowerCase()} đâu Sen.`
                  }
                </p>
                <Link
                  to="/products"
                  className="inline-flex items-center gap-4 px-10 py-5 bg-gray-900 text-white rounded-full font-black text-xs uppercase tracking-[0.2em] hover:bg-orange-600 hover:shadow-2xl hover:shadow-orange-200 hover:translate-y-[-4px] focus-visible:ring-4 focus-visible:ring-orange-200 focus-visible:outline-none transition-all duration-300 group/btn"
                >
                  MUA SẮM NGAY <ArrowRight size={18} className="group-hover/btn:translate-x-2 transition-transform" />
                </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-8">
            {orders.map((order) => {
              const config = statusConfig[order.orderStatus] || statusConfig.PENDING;
              const StatusIcon = config.icon;

              return (
                <div key={order.orderId} className="group bg-white rounded-[3.5rem] border border-gray-100 p-2 shadow-sm hover:shadow-2xl hover:shadow-gray-200/60 transition-all duration-500">
                  <div className="bg-[#fcfdfd] rounded-[3rem] p-8 md:p-10 flex flex-col lg:flex-row gap-10">
                    
                    {/* INFO COLUMN */}
                    <div className="lg:w-1/3 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-gray-100 pb-8 lg:pb-0 lg:pr-10">
                        <div>
                            <div className="flex items-center gap-3 mb-6">
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${config.color}`}>
                                    <StatusIcon size={24} />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest leading-none mb-1">TRẠNG THÁI</p>
                                    <p className={`text-sm font-black tracking-tighter ${config.color.split(' ')[1]}`}>{config.label}</p>
                                </div>
                            </div>
                            
                            <div className="space-y-6">
                                <div>
                                    <div className="flex items-center gap-2 text-[10px] font-black text-gray-300 uppercase tracking-widest mb-1">
                                        <Hash size={12} /> MÃ ĐƠN HÀNG
                                    </div>
                                    <p className="text-xl font-black text-gray-900 tracking-tighter">#{order.orderNumber || order.orderId}</p>
                                </div>
                                <div>
                                    <div className="flex items-center gap-2 text-[10px] font-black text-gray-300 uppercase tracking-widest mb-1">
                                        <Calendar size={12} /> NGÀY ĐẶT
                                    </div>
                                    <p className="text-lg font-black text-gray-900 tracking-tighter">{order.orderDate ? formatDate(order.orderDate) : 'N/A'}</p>
                                </div>
                            </div>
                        </div>

                        <div className="mt-8 pt-8 border-t border-gray-50 uppercase tracking-tighter italic text-[10px] font-black text-gray-400">
                             {config.description}
                        </div>
                    </div>

                    {/* ITEMS COLUMN */}
                    <div className="flex-1 flex flex-col justify-between">
                        <div className="space-y-6">
                            {order.items?.slice(0, 2).map((item, idx) => (
                                <div key={idx} className="flex gap-6 items-center group/item">
                                    <div className="w-20 h-20 bg-white rounded-3xl p-1 shadow-sm border border-gray-50 overflow-hidden group-hover/item:scale-105 transition-transform">
                                        <img
                                            src={item.productImage || '/placeholder-product.jpg'}
                                            alt={item.productName}
                                            width={80}
                                            height={80}
                                            loading="lazy"
                                            className="w-full h-full object-cover rounded-2xl"
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-black text-gray-900 uppercase tracking-tighter line-clamp-1 group-hover/item:text-orange-600 transition-colors">
                                            {item.productName}
                                        </p>
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                            Số lượng: <span className="text-gray-900">{item.quantity}</span>
                                        </p>
                                    </div>
                                    <p className="text-lg font-black text-gray-900 tracking-tighter">{formatPrice(item.total || item.price * item.quantity)}</p>
                                </div>
                            ))}
                            
                            {order.items?.length > 2 && (
                                <div className="flex items-center gap-2 p-4 bg-gray-50/50 rounded-2xl text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] justify-center">
                                    VÀ <span className="text-orange-600">{order.items.length - 2} SẢN PHẨM KHÁC</span> ĐANG CHỜ ĐÓN
                                </div>
                            )}
                        </div>

                        <div className="mt-10 pt-8 border-t border-gray-100 flex flex-wrap items-end justify-between gap-6">
                            <div>
                                <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.3em] mb-1">TỔNG THANH TOÁN</p>
                                <p className="text-4xl font-black text-orange-600 tracking-tighter leading-none">
                                    {formatPrice(order.finalAmount || order.totalAmount)}
                                </p>
                            </div>
                            <Link
                                to={`/orders/${order.orderId}`}
                                className="px-10 py-5 bg-gray-900 text-white rounded-full font-black text-[10px] uppercase tracking-[0.2em] hover:bg-orange-600 hover:shadow-xl hover:shadow-orange-200 hover:translate-y-[-3px] focus-visible:ring-4 focus-visible:ring-orange-200 focus-visible:outline-none transition-all duration-300 flex items-center gap-3"
                            >
                                CHI TIẾT <ArrowRight size={14} />
                            </Link>
                        </div>
                    </div>

                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
