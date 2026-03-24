import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  ShoppingCart, Users, Package, DollarSign, TrendingUp, AlertTriangle,
  Download, Clock, Truck, CheckCircle, XCircle, LayoutDashboard,
  Activity, Sparkles, Bone, PawPrint
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { adminService } from '../../api/adminService';
import { formatPrice } from '../../utils/formatters';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ExportReportModal from '../../components/admin/ExportReportModal';

const COLORS = ['#ea580c', '#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ec4899', '#06b6d4', '#ef4444'];

const ORDER_STATUS_MAP = {
  PENDING: { label: 'CHỜ XỬ LÝ', color: '#f59e0b', icon: Clock, bg: 'bg-amber-50' },
  PROCESSING: { label: 'ĐANG XỬ LÝ', color: '#3b82f6', icon: Package, bg: 'bg-blue-50' },
  SHIPPED: { label: 'ĐANG GIAO', color: '#8b5cf6', icon: Truck, bg: 'bg-purple-50' },
  DELIVERED: { label: 'ĐÃ GIAO', color: '#10b981', icon: CheckCircle, bg: 'bg-emerald-50' },
  CANCELLED: { label: 'ĐÃ HỦY', color: '#ef4444', icon: XCircle, bg: 'bg-rose-50' },
};

const StatCard = ({ title, value, subtitle, icon: Icon, color, bgColor }) => (
  <div className="group relative bg-white/80 backdrop-blur-md rounded-2xl p-6 border border-white shadow-lg shadow-gray-200/40 hover:shadow-xl transition-all duration-300 overflow-hidden" role="region" aria-label={title}>
    <div className="absolute top-0 right-0 w-24 h-24 bg-gray-50/50 rounded-full -mr-12 -mt-12 blur-2xl group-hover:scale-150 transition-transform duration-700" aria-hidden="true" />
    <div className="relative z-10 flex items-center justify-between">
      <div className="flex-1">
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{title}</p>
        <p className="text-2xl font-black text-gray-900 tracking-tight italic">{value}</p>
        {subtitle && (
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1 italic flex items-center gap-1">
            <Sparkles size={10} className="text-orange-400" aria-hidden="true" /> {subtitle}
          </p>
        )}
      </div>
      <div className={`w-12 h-12 ${bgColor} rounded-xl flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform`}>
        <Icon className={color} size={22} aria-hidden="true" />
      </div>
    </div>
  </div>
);

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-gray-900 border-none rounded-xl shadow-2xl p-3 text-[9px] font-black uppercase tracking-widest text-white" role="tooltip">
      <p className="text-gray-400 mb-2 border-b border-white/10 pb-1">{label}</p>
      {payload.map((item, i) => (
        <div key={i} className="flex items-center justify-between gap-4 mt-1">
          <span className="flex items-center gap-1.5">
            <div className="w-1 h-1 rounded-full" style={{ backgroundColor: item.color }} aria-hidden="true" />
            {item.name}:
          </span>
          <span className="text-orange-400">
            {typeof item.value === 'number' && item.value > 1000 ? formatPrice(item.value) : item.value}
          </span>
        </div>
      ))}
    </div>
  );
};

export default function StaffDashboardPage() {
  const [exportOpen, setExportOpen] = useState(false);

  const { data: stats, isLoading } = useQuery({
    queryKey: ['staff-dashboard-stats'],
    queryFn: adminService.getDashboardStats,
  });

  if (isLoading) {
    return <div className="min-h-[60vh] flex items-center justify-center"><LoadingSpinner /></div>;
  }

  const revenueChartData = (stats?.revenueLast7Days || []).map((d) => ({
    name: d.period?.slice(5) || '',
    'Doanh thu': Number(d.revenue) || 0,
    'Đơn hàng': d.orderCount || 0,
  }));

  const orderStatusData = [
    { name: 'CHỜ XỬ LÝ', value: stats?.pendingOrders || 0, color: '#f59e0b' },
    { name: 'ĐANG XỬ LÝ', value: stats?.processingOrders || 0, color: '#3b82f6' },
    { name: 'ĐANG GIAO', value: stats?.shippingOrders || 0, color: '#8b5cf6' },
    { name: 'ĐÃ GIAO', value: stats?.deliveredOrders || 0, color: '#10b981' },
    { name: 'ĐÃ HỦY', value: stats?.cancelledOrders || 0, color: '#ef4444' },
  ].filter((d) => d.value > 0);

  const categoryChartData = (stats?.categoryStats || [])
    .sort((a, b) => (Number(b.revenue) || 0) - (Number(a.revenue) || 0))
    .slice(0, 6)
    .map((c) => ({
      name: c.categoryName?.length > 12 ? c.categoryName.slice(0, 12) + '…' : c.categoryName,
      'Doanh thu': Number(c.revenue) || 0,
      'Sản phẩm': c.productCount || 0,
    }));

  const topProducts = stats?.topProducts || [];

  return (
    <div className="space-y-8 relative pb-10">
      {/* Decorative BG elements */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.01] z-[-1] overflow-hidden" aria-hidden="true">
        <div className="absolute top-[5%] left-[5%] rotate-12"><Bone size={200} /></div>
        <div className="absolute bottom-[5%] right-[2%] -rotate-12"><PawPrint size={150} /></div>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[8px] font-black text-gray-400 uppercase tracking-[0.4em] mb-1">
            <LayoutDashboard size={12} className="text-orange-600" aria-hidden="true" /> HỆ THỐNG ĐIỀU HÀNH
          </div>
          <h1 className="text-3xl font-black text-gray-900 uppercase tracking-tighter italic leading-none">
            PAWVERSE <span className="text-orange-600 font-black not-italic">DASHBOARD</span>
          </h1>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-2">Tổng quan hoạt động kinh doanh vận hành</p>
        </div>
        <button
          onClick={() => setExportOpen(true)}
          aria-label="Mở cửa sổ xuất báo cáo Excel"
          className="h-12 px-6 bg-gray-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-orange-600 transition-all shadow-lg flex items-center gap-2 focus-visible:ring-4 focus-visible:ring-orange-200 outline-none active:scale-95 duration-200"
        >
          <Download size={16} aria-hidden="true" /> XUẤT BÁO CÁO EXCEL
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="TỔNG DOANH THU"
          value={formatPrice(stats?.totalRevenue || 0)}
          subtitle="Từ đơn đã hoàn tất"
          icon={DollarSign}
          color="text-emerald-600"
          bgColor="bg-emerald-50"
        />
        <StatCard
          title="ĐƠN HÀNG"
          value={(stats?.totalOrders || 0).toLocaleString()}
          subtitle={`${stats?.pendingOrders || 0} đơn chờ Sen xử lý`}
          icon={ShoppingCart}
          color="text-blue-600"
          bgColor="bg-blue-50"
        />
        <StatCard
          title="SEN KẾT NỐI"
          value={(stats?.totalUsers || 0).toLocaleString()}
          subtitle="Tổng khách hàng hệ thống"
          icon={Users}
          color="text-purple-600"
          bgColor="bg-purple-50"
        />
        <StatCard
          title="DANH MỤC BOSS"
          value={(stats?.totalProducts || 0).toLocaleString()}
          subtitle={stats?.lowStockProducts > 0 ? `⚠ ${stats.lowStockProducts} mục hết hàng` : 'Nguồn hàng ổn định'}
          icon={Package}
          color="text-orange-600"
          bgColor="bg-orange-50"
        />
      </div>

      {/* Row 1: Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section className="lg:col-span-2 bg-white/80 backdrop-blur-md rounded-2xl p-6 border border-white shadow-lg shadow-gray-200/40">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-sm font-black text-gray-900 uppercase tracking-widest italic leading-none">BIỂU ĐỒ DOANH THU</h2>
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] mt-1 italic">Diễn biến 7 ngày gần nhất</p>
            </div>
            <TrendingUp size={20} className="text-emerald-500" aria-hidden="true" />
          </div>
          <div className="h-[280px] w-full min-w-0">
            <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={revenueChartData} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} aria-hidden="true" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 700 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 700 }} tickFormatter={(v) => v >= 1000000 ? `${(v / 1000000).toFixed(1)}M` : v >= 1000 ? `${(v / 1000).toFixed(0)}K` : v} />
                  <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="Doanh thu" stroke="#10b981" strokeWidth={3} fill="url(#colorRevenue)" animationDuration={1500} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="bg-white/80 backdrop-blur-md rounded-2xl p-6 border border-white shadow-lg shadow-gray-200/40">
          <h2 className="text-sm font-black text-gray-900 uppercase tracking-widest italic leading-none mb-2">QUY MÔ ĐƠN HÀNG</h2>
          <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] mb-8 italic">Phân bổ theo trạng thái</p>
          {orderStatusData.length > 0 ? (
            <>
              <div className="h-[180px] w-full min-w-0">
                <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie
                        data={orderStatusData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={75}
                        paddingAngle={4}
                        dataKey="value"
                        stroke="none"
                      >
                        {orderStatusData.map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
              </div>
              <div className="space-y-2 mt-4" role="list" aria-label="Chi tiết trạng thái đơn hàng">
                {orderStatusData.map((d, i) => (
                  <div key={i} className="flex items-center justify-between text-[10px] font-bold" role="listitem">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} aria-hidden="true" />
                      <span className="text-gray-500 uppercase tracking-widest">{d.name}</span>
                    </div>
                    <span className="text-gray-900">{d.value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-48 italic text-[10px] uppercase text-gray-400">CHƯA CÓ ĐƠN HÀNG</div>
          )}
        </section>
      </div>

      {/* Row 2: Analysis Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="bg-white/80 backdrop-blur-md rounded-2xl p-6 border border-white shadow-lg shadow-gray-200/40">
          <h2 className="text-sm font-black text-gray-900 uppercase tracking-widest italic leading-none mb-8">THỊ PHẦN THEO DANH MỤC</h2>
          {categoryChartData.length > 0 ? (
            <div className="h-[280px] w-full min-w-0">
              <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={categoryChartData} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} aria-hidden="true" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 8, fill: '#94a3b8', fontWeight: 900 }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 900 }} tickFormatter={(v) => v >= 1000000 ? `${(v / 1000000).toFixed(1)}M` : v >= 1000 ? `${(v / 1000).toFixed(0)}K` : v} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="Doanh thu" radius={[6, 6, 0, 0]} barSize={32}>
                      {categoryChartData.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex items-center justify-center h-64 italic text-[10px] uppercase text-gray-400">CHƯA CÓ DỮ LIỆU</div>
          )}
        </section>

        <section className="bg-white/80 backdrop-blur-md rounded-2xl p-6 border border-white shadow-lg shadow-gray-200/40">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-sm font-black text-gray-900 uppercase tracking-widest italic leading-none">SẢN PHẨM BOSS ƯA THÍCH</h2>
            <Sparkles size={16} className="text-yellow-500" aria-hidden="true" />
          </div>
          <div className="space-y-4" role="list" aria-label="Top 5 sản phẩm bán chạy">
            {topProducts.slice(0, 5).map((product, idx) => {
              const maxSold = topProducts[0]?.totalSold || 1;
              const pct = Math.round(((product.totalSold || 0) / maxSold) * 100);
              return (
                <div key={product.productId} className="group" role="listitem">
                  <div className="flex items-center gap-4">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-black italic text-white shadow-sm ${idx === 0 ? 'bg-orange-600' : idx === 1 ? 'bg-gray-800' : 'bg-gray-100 text-gray-400'
                      }`}>
                      {idx + 1}
                    </div>
                    {product.imageUrl && (
                      <img 
                        src={product.imageUrl} 
                        alt={product.productName} 
                        width={40}
                        height={40}
                        className="w-10 h-10 rounded-lg object-cover border border-gray-100 shadow-sm" 
                        onError={(e) => { e.target.style.display = 'none'; }} 
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-[11px] font-black text-gray-900 truncate uppercase tracking-tight">{product.productName}</p>
                        <span className="text-[10px] font-black text-emerald-600 italic">{formatPrice(product.revenue)}</span>
                      </div>
                      <div className="w-full bg-gray-50 rounded-full h-1 overflow-hidden" aria-hidden="true">
                        <div className="h-full bg-orange-500 rounded-full transition-all duration-1000" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            {topProducts.length === 0 && (
              <div className="text-center py-10 italic text-[10px] uppercase text-gray-400">CHƯA CÓ DỮ LIỆU</div>
            )}
          </div>
        </section>
      </div>

      {/* Row 3: History Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section className="lg:col-span-2 bg-white/80 backdrop-blur-md rounded-2xl border border-white shadow-lg shadow-gray-200/40 overflow-hidden">
          <div className="p-6 border-b border-gray-50 flex items-center justify-between">
            <h2 className="text-sm font-black text-gray-900 uppercase tracking-widest italic leading-none">KÝ SỰ ĐƠN HÀNG</h2>
            <Activity size={16} className="text-orange-600" aria-hidden="true" />
          </div>
          <div className="divide-y divide-gray-50" role="list" aria-label="Đơn hàng gần đây">
            {(stats?.recentOrders || []).slice(0, 5).map((order) => {
              const statusInfo = ORDER_STATUS_MAP[order.orderStatus] || { label: order.orderStatus, color: '#6b7280', icon: Clock, bg: 'bg-gray-50' };
              const StatusIcon = statusInfo.icon;
              return (
                <div key={order.orderId} className="flex items-center justify-between p-4 hover:bg-gray-50/50 transition-colors" role="listitem">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${statusInfo.bg}`}>
                      <StatusIcon size={16} style={{ color: statusInfo.color }} aria-hidden="true" />
                    </div>
                    <div>
                      <p className="text-[11px] font-black text-gray-900 tracking-tighter uppercase mb-0.5">
                        #{order.orderNumber || order.orderId}
                      </p>
                      <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest italic">{order.customerName}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[11px] font-black text-gray-900 italic mb-1">{formatPrice(order.finalAmount)}</p>
                    <span
                      className="text-[8px] font-black px-2.5 py-1 rounded-full border border-current opacity-70"
                      style={{ color: statusInfo.color }}
                    >
                      {statusInfo.label}
                    </span>
                  </div>
                </div>
              );
            })}
            {(!stats?.recentOrders || stats.recentOrders.length === 0) && (
              <div className="text-center py-10 italic text-[10px] uppercase text-gray-400">CHƯA CÓ ĐƠN HÀNG</div>
            )}
          </div>
        </section>

        <div className="space-y-6">
          <section className="bg-white/80 backdrop-blur-md rounded-2xl p-6 border border-white shadow-lg shadow-gray-200/40">
            <h3 className="text-[11px] font-black text-gray-500 uppercase tracking-widest mb-6 italic">CHI TIẾT VẬN HÀNH</h3>
            <div className="space-y-3" role="list" aria-label="Tóm tắt vận hành">
              {[
                { label: 'CHỜ XỬ LÝ', value: stats?.pendingOrders || 0, color: 'text-amber-600 bg-amber-50' },
                { label: 'ĐANG XỬ LÝ', value: stats?.processingOrders || 0, color: 'text-blue-600 bg-blue-50' },
                { label: 'ĐANG GIAO', value: stats?.shippingOrders || 0, color: 'text-purple-600 bg-purple-50' },
                { label: 'ĐÃ GIAO', value: stats?.deliveredOrders || 0, color: 'text-emerald-600 bg-emerald-50' },
                { label: 'ĐÃ HỦY', value: stats?.cancelledOrders || 0, color: 'text-red-600 bg-red-50' },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between" role="listitem">
                  <span className="text-[10px] font-bold text-gray-500 tracking-wider font-bold">{item.label}</span>
                  <span className={`text-[10px] font-black px-2.5 py-1 rounded-lg ${item.color}`}>
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          </section>

          {(stats?.lowStockProducts || 0) > 0 && (
            <div className="bg-rose-50 border border-rose-100 rounded-2xl p-5 animate-pulse shadow-xl shadow-rose-100/50" role="alert">
              <div className="flex items-start gap-4">
                <AlertTriangle className="text-rose-600 shrink-0 mt-0.5" size={20} aria-hidden="true" />
                <div>
                  <p className="text-[11px] font-black text-rose-900 uppercase tracking-tighter italic">CẢNH BÁO TỒN KHO</p>
                  <p className="text-[9px] font-bold text-rose-700 mt-2 uppercase tracking-wider leading-relaxed">
                    Có <strong>{stats.lowStockProducts}</strong> mục sắp cạn kiệt. Cần nhập hàng cho các Boss ngay!
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Export Modal */}
      <ExportReportModal isOpen={exportOpen} onClose={() => setExportOpen(false)} />
    </div>
  );
}
