import { useState, useEffect } from 'react';
import { X, Download, FileSpreadsheet, RefreshCw, CheckSquare, Square, ChevronDown, Sparkles, LayoutDashboard, Clock, ShoppingCart, Users, Package, DollarSign, Activity } from 'lucide-react';
import { adminService } from '../../api/adminService';
import toast from 'react-hot-toast';

const REPORT_TYPES = [
  { value: 'PRODUCTS', label: 'Thống kê sản phẩm', icon: <Package size={20} />, desc: 'Danh sách, doanh thu, tồn kho' },
  { value: 'ORDERS', label: 'Doanh số đơn hàng', icon: <ShoppingCart size={20} />, desc: 'Đã thanh toán, trạng thái...' },
  { value: 'CUSTOMERS', label: 'Khách hàng chi tiêu', icon: <Users size={20} />, desc: 'Top chi tiêu, số đơn hàng...' },
  { value: 'REVENUE', label: 'Doanh thu định kỳ', icon: <DollarSign size={20} />, desc: 'Báo cáo doanh thu theo tháng' },
];

const LIMITS = [
  { value: 10, label: 'TOP 10' },
  { value: 20, label: 'TOP 20' },
  { value: 50, label: 'TOP 50' },
  { value: 100, label: 'TOP 100' },
  { value: 0, label: 'TẤT CẢ' },
];

const SORT_OPTIONS = {
  PRODUCTS: [
    { value: 'idProduct', label: 'ID' },
    { value: 'tenProduct', label: 'Tên sản phẩm' },
    { value: 'giaBan', label: 'Giá bán' },
    { value: 'soLuongTonKho', label: 'Tồn kho' },
    { value: 'soLuongDaBan', label: 'Số lượng bán' },
    { value: 'avgRating', label: 'Đánh giá' },
    { value: 'ngayTao', label: 'Ngày tạo' },
  ],
  ORDERS: [
    { value: 'idOrder', label: 'ID' },
    { value: 'tongTienCuoiCung', label: 'Tổng thanh toán' },
    { value: 'ngayTao', label: 'Ngày đặt' },
    { value: 'orderStatus', label: 'Trạng thái' },
  ],
  CUSTOMERS: [
    { value: 'idUser', label: 'ID' },
    { value: 'fullName', label: 'Họ tên' },
    { value: 'totalOrders', label: 'Số đơn hàng' },
    { value: 'totalSpent', label: 'Tổng chi tiêu' },
    { value: 'ngayTao', label: 'Ngày đăng ký' },
  ],
  REVENUE: [
    { value: 'period', label: 'Kỳ' },
    { value: 'revenue', label: 'Doanh thu' },
    { value: 'orderCount', label: 'Số đơn hàng' },
  ],
};

const ALL_COLUMNS = {
  PRODUCTS: {
    idProduct: 'ID',
    tenProduct: 'Tên sản phẩm',
    categoryName: 'Danh mục',
    brandName: 'Thương hiệu',
    giaBan: 'Giá bán',
    giaGoc: 'Giá gốc',
    soLuongTonKho: 'Tồn kho',
    soLuongDaBan: 'Đã bán',
    revenue: 'Doanh thu ước tính',
    avgRating: 'Đánh giá TB',
    totalReviews: 'Số đánh giá',
    isEnabled: 'Trạng thái',
    isFeatured: 'Nổi bật',
    ngayTao: 'Ngày tạo',
  },
  ORDERS: {
    idOrder: 'ID',
    maOrder: 'Mã đơn hàng',
    customerName: 'Khách hàng',
    email: 'Email',
    soDienThoai: 'Số điện thoại',
    tongTienSanPham: 'Tổng tiền SP',
    phiVanChuyen: 'Phí vận chuyển',
    tienGiamGia: 'Giảm giá',
    tongTienCuoiCung: 'Tổng thanh toán',
    orderStatus: 'Trạng thái',
    paymentMethod: 'Phương thức TT',
    paymentStatus: 'TT thanh toán',
    diaChiGiaoHang: 'Địa chỉ',
    ngayTao: 'Ngày đặt',
  },
  CUSTOMERS: {
    idUser: 'ID',
    fullName: 'Họ tên',
    email: 'Email',
    soDienThoai: 'Số điện thoại',
    totalOrders: 'Số đơn hàng',
    totalSpent: 'Tổng chi tiêu',
    roleName: 'Vai trò',
    locked: 'Trạng thái',
    ngayTao: 'Ngày đăng ký',
  },
  REVENUE: {
    period: 'Kỳ',
    revenue: 'Doanh thu',
    orderCount: 'Số đơn hàng',
    avgOrderValue: 'TB/đơn',
  },
};

export default function ExportReportModal({ isOpen, onClose }) {
  const [reportType, setReportType] = useState('PRODUCTS');
  const [limit, setLimit] = useState(0);
  const [sortBy, setSortBy] = useState('');
  const [sortDirection, setSortDirection] = useState('DESC');
  const [selectedColumns, setSelectedColumns] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const cols = ALL_COLUMNS[reportType];
    if (cols) setSelectedColumns(Object.keys(cols));
    const sortOpts = SORT_OPTIONS[reportType];
    if (sortOpts?.length > 0) setSortBy(sortOpts[0].value);
  }, [reportType]);

  if (!isOpen) return null;

  const toggleColumn = (key) => {
    setSelectedColumns((prev) =>
      prev.includes(key) ? prev.filter((c) => c !== key) : [...prev, key]
    );
  };

  const selectAllColumns = () => setSelectedColumns(Object.keys(ALL_COLUMNS[reportType]));
  const deselectAllColumns = () => setSelectedColumns([]);

  const handleExport = async () => {
    if (selectedColumns.length === 0) {
      toast.error('Vui lòng chọn ít nhất 1 cột dữ liệu');
      return;
    }
    setLoading(true);
    try {
      const blob = await adminService.exportReport({
        reportType,
        limit: limit || null,
        sortBy,
        sortDirection,
        columns: selectedColumns,
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `bao-cao-${reportType.toLowerCase()}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success('Xuất báo cáo thành công!');
    } catch {
      toast.error('Không thể xuất báo cáo');
    } finally {
      setLoading(false);
    }
  };

  const currentColumns = ALL_COLUMNS[reportType] || {};
  const currentSortOptions = SORT_OPTIONS[reportType] || [];
  const currentReportInfo = REPORT_TYPES.find((r) => r.value === reportType);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm transition-opacity duration-300" 
        onClick={onClose}
        aria-hidden="true"
      />
      
      <div 
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className="relative bg-white/95 backdrop-blur-2xl rounded-[2.5rem] shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden border border-white"
      >
        
        {/* Header Section */}
        <div className="relative p-8 border-b border-gray-50 flex items-center justify-between shrink-0 overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-orange-50 rounded-full -mr-16 -mt-16 blur-3xl opacity-50" />
          <div className="relative z-10 flex items-center gap-4">
            <div className="w-14 h-14 bg-gray-900 rounded-2xl flex items-center justify-center shadow-xl rotate-3">
              <FileSpreadsheet className="text-orange-500" size={28} aria-hidden="true" />
            </div>
            <div>
              <div className="flex items-center gap-2 text-[8px] font-black text-gray-400 uppercase tracking-[0.4em] mb-1">
                <Activity size={12} className="text-orange-600" aria-hidden="true" /> VẬN HÀNH HỆ THỐNG
              </div>
              <h2 id="modal-title" className="text-2xl font-black text-gray-900 uppercase tracking-tighter italic leading-none">
                XUẤT BÁO CÁO <span className="text-orange-600 font-black not-italic">EXCEL</span>
              </h2>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2.5 hover:bg-gray-100 rounded-2xl transition hover:rotate-90 duration-300 focus-visible:ring-4 focus-visible:ring-orange-100 outline-none"
            aria-label="Đóng cửa sổ"
          >
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        {/* Body Section Scrollable */}
        <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
          
          {/* 1. Report Type */}
          <section>
            <label id="label-report-type" className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">
              <Sparkles size={12} className="text-orange-400" aria-hidden="true" /> 1. CHỌN LOẠI DỮ LIỆU
            </label>
            <div className="grid grid-cols-2 gap-3" role="radiogroup" aria-labelledby="label-report-type">
              {REPORT_TYPES.map((rt) => (
                <button
                  key={rt.value}
                  onClick={() => setReportType(rt.value)}
                  role="radio"
                  aria-checked={reportType === rt.value}
                  className={`group relative flex items-start gap-4 p-4 rounded-2xl border transition-all duration-300 outline-none focus-visible:ring-4 focus-visible:ring-orange-100 ${
                    reportType === rt.value
                      ? 'bg-gray-900 border-gray-900 shadow-xl'
                      : 'bg-white border-gray-100 hover:border-orange-200 hover:bg-orange-50/10'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                    reportType === rt.value ? 'bg-orange-500 text-white' : 'bg-gray-50 text-gray-400 group-hover:bg-orange-100 group-hover:text-orange-600'
                  }`}>
                    {rt.icon}
                  </div>
                  <div className="text-left">
                    <p className={`text-[11px] font-black uppercase tracking-tight mb-0.5 ${reportType === rt.value ? 'text-white' : 'text-gray-900'}`}>
                      {rt.label}
                    </p>
                    <p className={`text-[9px] font-bold italic leading-tight ${reportType === rt.value ? 'text-gray-400' : 'text-gray-400'}`}>
                      {rt.desc}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </section>

          {/* 2 & 3 & 4. Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <section>
              <label id="label-limit" className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 block">2. GIỚI HẠN DỮ LIỆU</label>
              <div className="flex flex-wrap gap-2" role="group" aria-labelledby="label-limit">
                {LIMITS.map((l) => (
                  <button
                    key={l.value}
                    onClick={() => setLimit(l.value)}
                    aria-pressed={limit === l.value}
                    className={`px-3 py-2 rounded-xl text-[10px] font-black tracking-widest transition-all outline-none focus-visible:ring-4 focus-visible:ring-orange-100 ${
                      limit === l.value
                        ? 'bg-orange-600 text-white shadow-lg shadow-orange-100'
                        : 'bg-gray-50 text-gray-400 border border-gray-100 hover:bg-gray-100'
                    }`}
                  >
                    {l.label}
                  </button>
                ))}
              </div>
            </section>

            <section className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label htmlFor="select-sort" className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 block">3. TIÊU CHÍ SẮP XẾP</label>
                  <div className="relative group">
                    <select
                      id="select-sort"
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="w-full pl-4 pr-10 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-4 focus:ring-orange-50 transition-all text-[11px] font-black text-gray-900 italic appearance-none cursor-pointer"
                    >
                      {currentSortOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label.toUpperCase()}</option>
                      ))}
                    </select>
                    <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 group-hover:text-orange-500 pointer-events-none transition-colors" />
                  </div>
                </div>
                <div>
                  <label id="label-direction" className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 block">4. CHIỀU SẮP XẾP</label>
                  <div className="flex bg-gray-50 p-1 rounded-xl gap-1" role="group" aria-labelledby="label-direction">
                    <button
                      onClick={() => setSortDirection('ASC')}
                      aria-pressed={sortDirection === 'ASC'}
                      className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all outline-none focus-visible:ring-4 focus-visible:ring-orange-100 ${
                        sortDirection === 'ASC' ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'
                      }`}
                    >
                      TĂNG DẦN
                    </button>
                    <button
                      onClick={() => setSortDirection('DESC')}
                      aria-pressed={sortDirection === 'DESC'}
                      className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all outline-none focus-visible:ring-4 focus-visible:ring-orange-100 ${
                        sortDirection === 'DESC' ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'
                      }`}
                    >
                      GIẢM DẦN
                    </button>
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* 5. Column Selection */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <label id="label-columns" className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                5. CẤU HÌNH CỘT DỮ LIỆU ({selectedColumns.length}/{Object.keys(currentColumns).length})
              </label>
              <div className="flex gap-4">
                <button onClick={selectAllColumns} className="text-[9px] font-black text-orange-600 uppercase tracking-widest hover:scale-105 transition-transform outline-none focus-visible:underline">Chọn tất cả</button>
                <button onClick={deselectAllColumns} className="text-[9px] font-black text-gray-400 uppercase tracking-widest hover:text-gray-600 outline-none focus-visible:underline">Bỏ chọn</button>
              </div>
            </div>
            <div 
              className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-4 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200 custom-scrollbar"
              role="group"
              aria-labelledby="label-columns"
            >
              {Object.entries(currentColumns).map(([key, label]) => {
                const checked = selectedColumns.includes(key);
                return (
                  <button
                    key={key}
                    onClick={() => toggleColumn(key)}
                    aria-pressed={checked}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-left transition-all outline-none focus-visible:ring-4 focus-visible:ring-orange-100 ${
                      checked ? 'bg-white text-orange-600 shadow-sm ring-1 ring-orange-100' : 'bg-white/40 text-gray-500 hover:bg-white'
                    }`}
                  >
                    {checked ? (
                      <CheckSquare size={14} className="text-orange-500 shrink-0" aria-hidden="true" />
                    ) : (
                      <Square size={14} className="text-gray-300 shrink-0" aria-hidden="true" />
                    )}
                    <span className="text-[10px] font-bold uppercase tracking-tight truncate">{label}</span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Analysis Snippet */}
          <div className="bg-orange-50 rounded-3xl p-5 border border-orange-100" role="status">
            <div className="flex gap-4 items-start">
              <div className="w-8 h-8 bg-orange-200 rounded-full flex items-center justify-center shrink-0">
                <LayoutDashboard size={16} className="text-orange-700" aria-hidden="true" />
              </div>
              <div>
                <p className="text-[10px] font-black text-orange-900 uppercase tracking-widest mb-1">Cấu hình báo cáo hiện tại</p>
                <p className="text-[11px] font-bold text-orange-700 italic leading-relaxed">
                  Xuất <strong>{currentReportInfo?.label.toUpperCase()}</strong>, {' '}
                  {limit > 0 ? `lọc TOP ${limit}` : 'toàn bộ bản ghi'}, {' '}
                  theo tiêu chí <strong>{currentSortOptions.find(s => s.value === sortBy)?.label.toUpperCase() || sortBy}</strong>{' '}
                  với <strong>{selectedColumns.length}</strong> chỉ số đã chọn.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Section */}
        <div className="p-8 border-t border-gray-50 bg-gray-50/30 flex items-center justify-end gap-4 shrink-0 overflow-hidden relative">
          <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" aria-hidden="true" />
          <button
            onClick={onClose}
            className="px-8 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest text-gray-400 hover:text-gray-600 transition-colors focus-visible:underline outline-none"
          >
            Hủy bỏ
          </button>
          <button
            onClick={handleExport}
            disabled={loading || selectedColumns.length === 0}
            aria-busy={loading}
            className="relative overflow-hidden px-8 py-3 bg-gray-900 text-white rounded-xl font-black text-[11px] uppercase tracking-widest flex items-center gap-3 shadow-2xl shadow-gray-900/40 hover:bg-orange-600 transition-all duration-300 disabled:opacity-30 disabled:pointer-events-none group active:scale-95 outline-none focus-visible:ring-4 focus-visible:ring-orange-200"
          >
            {loading ? (
              <><RefreshCw size={16} className="animate-spin text-orange-500" aria-hidden="true" /> Vui lòng đợi...</>
            ) : (
              <>
                <Download size={16} className="group-hover:-translate-y-1 transition-transform" aria-hidden="true" />
                Xác nhận xuất Excel
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
