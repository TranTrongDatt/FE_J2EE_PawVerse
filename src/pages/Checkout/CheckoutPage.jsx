import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  CreditCard, 
  Wallet, 
  CheckCircle, 
  ChevronRight, 
  MapPin, 
  Truck, 
  User, 
  Mail, 
  Phone, 
  ArrowLeft,
  ShieldCheck,
  ShoppingBag,
  Clock,
  ShieldAlert,
  Heart,
  Package,
  PawPrint,
  Bone,
  Dog,
  Cat,
  Zap,
  Ticket,
  Tag
} from 'lucide-react';
import { cartService } from '../../api/cartService';
import { orderService } from '../../api/orderService';
import { authService } from '../../api/authService';
import { formatPrice } from '../../utils/formatters';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';
import useAuthStore from '../../store/useAuthStore';

const shippingSchema = z.object({
  fullName: z.string().min(2, 'Họ tên phải có ít nhất 2 ký tự'),
  email: z.string().email('Email không hợp lệ'),
  phone: z.string().regex(/^(0|\+84)[3|5|7|8|9][0-9]{8}$/, 'Số điện thoại không hợp lệ'),
  shippingAddress: z.string().min(10, 'Địa chỉ phải có ít nhất 10 ký tự'),
  shippingCity: z.string().min(2, 'Vui lòng nhập thành phố'),
  shippingDistrict: z.string().min(1, 'Vui lòng nhập quận/huyện'),
  shippingWard: z.string().optional(),
  note: z.string().optional(),
});

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [paymentMethod, setPaymentMethod] = useState('COD');
  const [appliedVoucher, setAppliedVoucher] = useState(null);
  const [voucherInput, setVoucherInput] = useState('');

  const applyVoucherMutation = useMutation({
    mutationFn: (code) => orderService.applyCoupon(code),
    onSuccess: (voucher) => {
      setAppliedVoucher(voucher);
      toast.success(`Áp dụng mã ưu đãi ${voucher.code} thành công! 💎`, {
        style: { borderRadius: '15px', background: '#111', color: '#fff', fontSize: '12px', fontWeight: 'bold' }
      });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Mã giảm giá không hợp lệ hoặc đã hết hạn 🐾');
    },
  });

  // Fetch cart
  const { data: cart, isLoading } = useQuery({
    queryKey: ['cart'],
    queryFn: cartService.getCart,
  });

  // Fetch fresh profile for address fields
  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: authService.getCurrentUser,
  });

  // Form handling
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(shippingSchema),
    values: {
      fullName: profile?.fullName || user?.fullName || '',
      email: profile?.email || user?.email || '',
      phone: profile?.soDienThoai || user?.soDienThoai || '',
      shippingAddress: profile?.diaChi || user?.diaChi || '',
      shippingCity: profile?.tinhThanhPho || '',
      shippingDistrict: profile?.quanHuyen || '',
      shippingWard: profile?.phuongXa || '',
      note: '',
    },
  });

  // Create order mutation
  const createOrderMutation = useMutation({
    mutationFn: (orderData) => orderService.createOrder(orderData),
    onSuccess: (data) => {
      toast.success('Đặt hàng thành công!');
      navigate(`/orders/${data.orderId}`);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Đặt hàng thất bại');
    },
  });

  const onSubmit = async (data) => {
    if (!cart || cart.items?.length === 0) {
      toast.error('Giỏ hàng trống');
      return;
    }

    const orderData = {
      ...data,
      paymentMethod: paymentMethod,
      voucherCode: appliedVoucher?.code || null,
    };

    createOrderMutation.mutate(orderData);
  };

  if (isLoading) return <LoadingSpinner fullScreen />;

  if (!cart || cart.items?.length === 0) {
    navigate('/cart');
    return null;
  }

  const items = cart.items || [];
  const subtotal = cart.totalAmount || items.reduce((sum, item) => sum + (item.subtotal || item.price * item.quantity), 0);
  const shippingFee = 30000;
  
  const discountAmount = (() => {
    if (!appliedVoucher) return 0;
    if (appliedVoucher.voucherType === 'PERCENTAGE') {
      const pct = (subtotal * (appliedVoucher.discountPercentage || 0)) / 100;
      return appliedVoucher.maxDiscountAmount ? Math.min(pct, Number(appliedVoucher.maxDiscountAmount)) : pct;
    }
    if (appliedVoucher.voucherType === 'FIXED_AMOUNT') {
      return Math.min(Number(appliedVoucher.discountValue || 0), subtotal);
    }
    if (appliedVoucher.voucherType === 'FREE_SHIPPING') {
      return shippingFee;
    }
    return 0;
  })();
  
  const total = subtotal + shippingFee - discountAmount;

  return (
    <div className="bg-[#fcfdfd] min-h-screen pt-24 pb-20 relative overflow-hidden">
      {/* Decorative Blobs - Match HomePage Hero but subtler */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-5%] right-[-5%] w-[40vw] h-[40vw] bg-orange-100/30 rounded-full blur-[100px] opacity-40"></div>
        <div className="absolute bottom-[-5%] left-[-5%] w-[35vw] h-[35vw] bg-blue-50/40 rounded-full blur-[80px] opacity-30"></div>
        
        {/* Subtle Decorative Outlines */}
        <div className="absolute top-[20%] left-[5%] opacity-[0.03] rotate-12">
          <Dog size={200} />
        </div>
        <div className="absolute bottom-[20%] right-[3%] opacity-[0.03] -rotate-12">
          <Cat size={180} />
        </div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Modern Breadcrumb with Progress Steps */}
        <div className="max-w-7xl mx-auto mb-12">
          <nav className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-8 overflow-x-auto whitespace-nowrap pb-2 no-scrollbar">
            <Link to="/" className="hover:text-orange-500 transition-colors">TRANG CHỦ</Link>
            <ChevronRight size={12} className="shrink-0" />
            <Link to="/cart" className="hover:text-orange-500 transition-colors">GIỎ HÀNG</Link>
            <ChevronRight size={12} className="shrink-0" />
            <span className="text-orange-600">THANH TOÁN</span>
          </nav>

          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-6">
            <div className="animate-in fade-in slide-in-from-left-8 duration-700">
            <h1 className="text-5xl md:text-6xl font-black text-gray-900 tracking-tighter uppercase mb-3 leading-none [text-wrap:balance]">
              XÁC NHẬN <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-orange-400 relative inline-block">
                ĐƠN HÀNG
                <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 358 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                   <path d="M3 9C118.957 4.47226 235.163 3.52085 355 3" stroke="#F4A261" strokeWidth="4" strokeLinecap="round" />
                </svg>
              </span>
            </h1>
            <div className="flex items-center gap-6 mt-4">
              <p className="text-gray-400 font-bold uppercase text-[10px] tracking-[0.3em] flex items-center gap-2">
                <ShieldCheck size={14} className="text-green-500" />
                Giao dịch bảo mật 256-bit
              </p>
              <div className="h-4 w-[1px] bg-gray-200 hidden md:block"></div>
              <p className="text-gray-400 font-bold uppercase text-[10px] tracking-[0.3em] flex items-center gap-2 hidden md:flex">
                <Clock size={14} className="text-blue-500" />
                Xử lý trong vòng 2h
              </p>
            </div>
            </div>
            
            <Link to="/cart" className="flex items-center gap-2 text-gray-400 hover:text-orange-500 font-black text-[10px] uppercase tracking-widest transition-all hover:-translate-x-1 group">
               <ArrowLeft size={16} className="group-hover:translate-x-[-2px] transition-transform" /> 
               Quay lại giỏ hàng
            </Link>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10">
            {/* Left Column - Forms */}
            <div className="lg:col-span-8 space-y-8 animate-in fade-in slide-in-from-bottom-10 duration-700 delay-100">
              
              {/* Shipping Section */}
              <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-gray-200/50 p-8 md:p-12 border border-white relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-48 h-48 bg-orange-50/50 rounded-bl-full opacity-30 -mr-24 -mt-24 group-hover:scale-110 transition-transform duration-1000" />
                
                <div className="relative z-10">
                  <div className="flex items-center gap-4 mb-10">
                    <div className="w-12 h-12 bg-orange-600 text-white rounded-[1.25rem] flex items-center justify-center shadow-lg shadow-orange-200">
                      <MapPin size={24} />
                    </div>
                    <div>
                      <h2 className="text-2xl font-black text-gray-900 tracking-tight uppercase">THÔNG TIN GIAO HÀNG</h2>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">Vui lòng cung cấp địa chỉ chính xác 🐾</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Input Group Template */}
                    <div className="space-y-2">
                      <label htmlFor="fullName" className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4 flex items-center gap-2 cursor-pointer">
                        <User size={12} /> HỌ VÀ TÊN *
                      </label>
                      <input
                        {...register('fullName')}
                        id="fullName"
                        autoComplete="name"
                        placeholder="Nguyễn Văn A…"
                        className={`w-full px-8 py-5 bg-gray-50/50 border-2 rounded-[1.5rem] focus:outline-none transition-all font-bold text-gray-900 placeholder:text-gray-300 ${errors.fullName ? 'border-red-100 bg-red-50 focus:border-red-200' : 'border-transparent focus:border-orange-200 focus:bg-white focus:shadow-xl focus:shadow-orange-100/30'}`}
                      />
                      {errors.fullName && <p className="text-[10px] text-red-500 font-black ml-4 uppercase tracking-wider">{errors.fullName.message}</p>}
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="phone" className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4 flex items-center gap-2 cursor-pointer">
                        <Phone size={12} /> SỐ ĐIỆN THOẠI *
                      </label>
                      <input
                        {...register('phone')}
                        id="phone"
                        type="tel"
                        inputMode="tel"
                        autoComplete="tel"
                        placeholder="09xx xxx xxx…"
                        className={`w-full px-8 py-5 bg-gray-50/50 border-2 rounded-[1.5rem] focus:outline-none transition-all font-bold text-gray-900 placeholder:text-gray-300 tabular-nums ${errors.phone ? 'border-red-100 bg-red-50 focus:border-red-200' : 'border-transparent focus:border-orange-200 focus:bg-white focus:shadow-xl focus:shadow-orange-100/30'}`}
                      />
                      {errors.phone && <p className="text-[10px] text-red-500 font-black ml-4 uppercase tracking-wider">{errors.phone.message}</p>}
                    </div>

                    <div className="md:col-span-2 space-y-2">
                      <label htmlFor="email" className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4 flex items-center gap-2 cursor-pointer">
                        <Mail size={12} /> EMAIL NHẬN THÔNG BÁO *
                      </label>
                      <input
                        {...register('email')}
                        id="email"
                        type="email"
                        autoComplete="email"
                        spellCheck={false}
                        placeholder="van.a@example.com…"
                        className={`w-full px-8 py-5 bg-gray-50/50 border-2 rounded-[1.5rem] focus:outline-none transition-all font-bold text-gray-900 placeholder:text-gray-300 ${errors.email ? 'border-red-100 bg-red-50 focus:border-red-200' : 'border-transparent focus:border-orange-200 focus:bg-white focus:shadow-xl focus:shadow-orange-100/30'}`}
                      />
                      {errors.email && <p className="text-[10px] text-red-500 font-black ml-4 uppercase tracking-wider">{errors.email.message}</p>}
                    </div>

                    <div className="md:col-span-2 space-y-2">
                      <label htmlFor="shippingAddress" className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4 flex items-center gap-2 cursor-pointer">
                        <Truck size={12} /> ĐỊA CHỈ CHI TIẾT ĐỂ NHẬN HÀNG *
                      </label>
                      <input
                        {...register('shippingAddress')}
                        id="shippingAddress"
                        autoComplete="shipping address-line1"
                        placeholder="Số nhà, tên đường, khu vực……"
                        className={`w-full px-8 py-5 bg-gray-50/50 border-2 rounded-[1.5rem] focus:outline-none transition-all font-bold text-gray-900 placeholder:text-gray-300 ${errors.shippingAddress ? 'border-red-100 bg-red-50 focus:border-red-200' : 'border-transparent focus:border-orange-200 focus:bg-white focus:shadow-xl focus:shadow-orange-100/30'}`}
                      />
                      {errors.shippingAddress && <p className="text-[10px] text-red-500 font-black ml-4 uppercase tracking-wider">{errors.shippingAddress.message}</p>}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:col-span-2">
                      <div className="space-y-2">
                        <label htmlFor="shippingWard" className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4 cursor-pointer">PHƯỜNG/XÃ</label>
                        <input
                          {...register('shippingWard')}
                          id="shippingWard"
                          autoComplete="shipping address-level4"
                          placeholder="ABC…"
                          className="w-full px-6 py-4 bg-gray-50/50 border-2 border-transparent rounded-[1.25rem] focus:outline-none transition-all font-bold text-gray-800 focus:border-orange-200 focus:bg-white"
                        />
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="shippingDistrict" className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4 cursor-pointer">QUẬN/HUYỆN *</label>
                        <input
                          {...register('shippingDistrict')}
                          id="shippingDistrict"
                          autoComplete="shipping address-level3"
                          placeholder="XYZ…"
                          className={`w-full px-6 py-4 bg-gray-50/50 border-2 rounded-[1.25rem] focus:outline-none transition-all font-bold text-gray-800 ${errors.shippingDistrict ? 'border-red-100 bg-red-50' : 'border-transparent focus:border-orange-200 focus:bg-white'}`}
                        />
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="shippingCity" className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4 cursor-pointer">TỈNH/THÀNH *</label>
                        <input
                          {...register('shippingCity')}
                          id="shippingCity"
                          autoComplete="shipping address-level2"
                          placeholder="HCM…"
                          className={`w-full px-6 py-4 bg-gray-50/50 border-2 rounded-[1.25rem] focus:outline-none transition-all font-bold text-gray-800 ${errors.shippingCity ? 'border-red-100 bg-red-50' : 'border-transparent focus:border-orange-200 focus:bg-white'}`}
                        />
                      </div>
                    </div>

                    <div className="md:col-span-2 space-y-2">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">GHI CHÚ ĐƠN HÀNG</label>
                       <textarea
                         {...register('note')}
                         rows={3}
                         placeholder="Lời nhắn cho shipper hoặc về sản phẩm..."
                         className="w-full px-8 py-5 bg-gray-50/50 border-2 border-transparent rounded-[2rem] focus:outline-none transition-all font-bold text-gray-900 focus:border-orange-200 focus:bg-white resize-none"
                       />
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Section */}
              <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-gray-200/50 p-8 md:p-12 border border-white relative overflow-hidden group">
                 <div className="flex items-center gap-4 mb-10">
                    <div className="w-12 h-12 bg-blue-600 text-white rounded-[1.25rem] flex items-center justify-center shadow-lg shadow-blue-200">
                      <CreditCard size={24} />
                    </div>
                    <div>
                      <h2 className="text-2xl font-black text-gray-900 tracking-tight uppercase">PHƯƠNG THỨC THANH TOÁN</h2>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">Mọi thông tin đều được mã hóa 🔒</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* COD Option */}
                    <label className={`relative flex flex-col items-center justify-center p-8 border-2 rounded-[2rem] cursor-pointer transition-all duration-300 ${paymentMethod === 'COD' ? 'border-orange-600 bg-orange-50/50 ring-4 ring-orange-50' : 'border-gray-50 bg-gray-50/50 hover:bg-gray-100/50'}`}>
                      <input
                        type="radio"
                        name="payment"
                        value="COD"
                        checked={paymentMethod === 'COD'}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="hidden"
                      />
                      <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-4 transition-all duration-500 ${paymentMethod === 'COD' ? 'bg-orange-600 text-white shadow-lg' : 'bg-white text-gray-400 shadow-sm'}`}>
                        <Wallet size={26} />
                      </div>
                      <span className="font-black text-[11px] uppercase tracking-wider text-gray-900 mb-1 leading-none">TIỀN MẶT</span>
                      <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">KHI NHẬN HÀNG</span>
                      {paymentMethod === 'COD' && (
                        <div className="absolute top-4 right-4 text-orange-600">
                          <CheckCircle size={18} />
                        </div>
                      )}
                    </label>

                    {/* VNPAY (Soon) */}
                    <div className="relative flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-100 bg-gray-50/30 rounded-[2rem] opacity-60 cursor-not-allowed group">
                      <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center mb-4 text-gray-200">
                        <CreditCard size={26} />
                      </div>
                      <span className="font-black text-[11px] uppercase tracking-wider text-gray-400 mb-1 leading-none">VNPAY QR</span>
                      <span className="px-2 py-0.5 bg-gray-200 text-white text-[8px] font-black uppercase rounded-full">Sắp có</span>
                      <ShieldAlert className="absolute top-4 right-4 text-gray-200" size={18} />
                    </div>

                    {/* MOMO (Soon) */}
                    <div className="relative flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-100 bg-gray-50/30 rounded-[2rem] opacity-60 cursor-not-allowed group">
                      <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center mb-4 font-black text-gray-200 text-2xl italic leading-none">
                        M
                      </div>
                      <span className="font-black text-[11px] uppercase tracking-wider text-gray-400 mb-1 leading-none">VÍ MOMO</span>
                      <span className="px-2 py-0.5 bg-gray-200 text-white text-[8px] font-black uppercase rounded-full">Sắp có</span>
                    </div>
                  </div>
              </div>
            </div>

            {/* Right Column - Order Summary - Premium Receipt Style */}
            <div className="lg:col-span-4 self-start sticky top-32 animate-in fade-in slide-in-from-right-10 duration-700 delay-200">
              <div className="bg-gray-900 rounded-[3rem] shadow-2xl p-8 md:p-10 text-white relative overflow-hidden group">
                {/* Decorative Elements */}
                <div className="absolute top-[-20%] right-[-20%] w-64 h-64 bg-orange-500/10 rounded-full blur-[60px]" />
                <div className="absolute bottom-[-10%] left-[-10%] w-48 h-48 bg-blue-500/5 rounded-full blur-[50px]" />
                
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-10 border-b border-white/10 pb-8">
                     <div className="bg-orange-600 p-2 rounded-xl shadow-lg shadow-orange-600/20">
                       <ShoppingBag size={24} className="text-white" />
                     </div>
                     <h2 className="text-2xl font-black tracking-tighter uppercase italic leading-none">ĐƠN HÀNG CỦA BẠN</h2>
                  </div>

                  {/* List Items */}
                  <div className="space-y-6 mb-10 max-h-[380px] overflow-y-auto pr-3 custom-scrollbar">
                    {items.map((item) => (
                      <div key={item.cartItemId} className="flex gap-4 group/item">
                        <div className="w-16 h-16 shrink-0 rounded-2xl bg-white/5 p-1 border border-white/10 overflow-hidden relative group-hover/item:border-orange-500/50 transition-colors">
                           <img 
                            src={item.productImage || '/placeholder-product.jpg'} 
                            alt={item.productName} 
                            width={64}
                            height={64}
                            loading="lazy"
                            className="w-full h-full object-cover rounded-xl group-hover/item:scale-110 transition-transform duration-500" 
                           />
                           <div className="absolute -bottom-1 -right-1 bg-orange-600 text-[10px] font-black px-1.5 py-0.5 rounded-lg border border-gray-900 shadow-md tabular-nums">
                             x{item.quantity}
                           </div>
                        </div>
                        <div className="flex-1 min-w-0 py-1">
                          <p className="text-[11px] font-black uppercase tracking-tight text-white/90 line-clamp-2 leading-snug mb-1 group-hover/item:text-orange-400 transition-colors">
                            {item.productName}
                          </p>
                          <span className="text-sm font-black text-orange-500 tabular-nums">
                            {formatPrice(item.subtotal || item.price * item.quantity)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Price Breakdown */}
                  <div className="space-y-4 mb-10 pt-4">
                    <div className="flex justify-between items-center text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">
                       <span>TẠM TÍNH</span>
                       <span className="text-white text-base font-black tabular-nums">{formatPrice(subtotal)}</span>
                    </div>
                    <div className="flex justify-between items-center text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">
                       <span className="flex items-center gap-2"><Truck size={14} /> GIAO HÀNG TIÊU CHUẨN</span>
                       <span className="text-white text-base font-black tabular-nums">{formatPrice(shippingFee)}</span>
                    </div>

                    {/* Discount Code Input Section */}
                    <div className="pt-6 pb-2">
                       <div className="flex flex-col gap-3">
                         <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] ml-2 flex items-center gap-2">
                            <Ticket size={12} className="text-orange-500" /> MÃ GIẢM GIÁ / ƯU ĐÃI
                         </label>
                         <div className="relative group">
                           <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
                              <Tag size={14} className={`transition-colors duration-300 ${appliedVoucher ? 'text-orange-500' : 'text-white/20 group-focus-within:text-orange-400'}`} />
                           </div>
                           <input 
                             type="text"
                             value={appliedVoucher ? appliedVoucher.code : voucherInput}
                             onChange={(e) => setVoucherInput(e.target.value.toUpperCase())}
                             disabled={!!appliedVoucher || applyVoucherMutation.isPending}
                             placeholder="NHẬP MÃ TẠI ĐÂY…"
                             className={`w-full pl-14 pr-24 py-5 bg-white/5 border-2 rounded-[1.5rem] focus:outline-none transition-all font-black text-sm tracking-widest placeholder:text-white/10 ${appliedVoucher ? 'border-orange-500/50 text-orange-400 bg-orange-500/5' : 'border-white/5 focus:border-orange-500/30 focus:bg-white/10'}`}
                           />
                           
                           {appliedVoucher ? (
                             <button
                               type="button"
                               onClick={() => {
                                 setAppliedVoucher(null);
                                 setVoucherInput('');
                               }}
                               className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-rose-500 hover:text-white text-white/40 px-4 py-2 rounded-xl text-[10px] font-black transition-all active:scale-95 uppercase tracking-widest"
                             >
                               HỦY
                             </button>
                           ) : (
                             <button
                               type="button"
                               onClick={() => applyVoucherMutation.mutate(voucherInput)}
                               disabled={!voucherInput || applyVoucherMutation.isPending}
                               className="absolute right-3 top-1/2 -translate-y-1/2 bg-orange-600 hover:bg-orange-500 text-white px-5 py-2.5 rounded-xl text-[10px] font-black transition-all active:scale-95 shadow-lg shadow-orange-950/20 disabled:opacity-30 disabled:cursor-not-allowed uppercase tracking-widest group-hover:shadow-orange-600/20"
                             >
                               {applyVoucherMutation.isPending ? '…' : 'ÁP DỤNG'}
                             </button>
                           )}
                         </div>
                         {appliedVoucher && (
                           <div className="flex items-center gap-2 ml-4 animate-in slide-in-from-top-2">
                             <Zap size={10} className="text-orange-500 animate-pulse" />
                             <span className="text-[9px] font-black text-orange-500/80 uppercase tracking-widest">
                               ĐƯỢC GIẢM SIÊU CẤP TỪ PAWVERSE
                             </span>
                           </div>
                         )}
                       </div>
                    </div>
                    {discountAmount > 0 && (
                      <div className="flex justify-between items-center text-[10px] font-black text-orange-500 uppercase tracking-[0.2em] animate-in slide-in-from-left-4">
                         <span className="flex items-center gap-2 font-black italic">GIẢM GIÁ ƯU ĐÃI</span>
                         <span className="text-base font-black tabular-nums">-{formatPrice(discountAmount)}</span>
                      </div>
                    )}
                    
                    <div className="pt-8 border-t border-white/10 flex flex-col gap-2">
                       <div className="flex justify-between items-end">
                          <div className="flex flex-col">
                             <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em] mb-2 leading-none">TỔNG THANH TOÁN</span>
                             <span className="text-4xl md:text-5xl font-black text-orange-600 tracking-tighter italic leading-none tabular-nums">
                               {formatPrice(total)}
                             </span>
                          </div>
                          <PawPrint className="w-12 h-12 text-white/10 rotate-12 mb-1" />
                       </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={createOrderMutation.isPending}
                    className="w-full py-6 bg-gradient-to-r from-orange-600 to-orange-400 text-white rounded-[2rem] font-black text-lg uppercase tracking-[0.2em] shadow-[0_20px_40px_-10px_rgba(234,88,12,0.6)] hover:shadow-[0_25px_50px_-10px_rgba(234,88,12,0.8)] hover:-translate-y-1 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 group relative overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 -skew-x-12" />
                    {createOrderMutation.isPending ? (
                      <><LoadingSpinner size="sm" color="white" /> <span>ĐANG KHỞI TẠO…</span></>
                    ) : (
                      <><CheckCircle size={24} className="group-hover:rotate-12 transition-transform" /> <span>ĐẶT HÀNG NGAY</span></>
                    )}
                  </button>

                  <div className="mt-10 grid grid-cols-3 gap-3 border-t border-white/5 pt-8">
                     <div className="flex flex-col items-center gap-2 text-center group/badge">
                        <div className="p-2 bg-white/5 rounded-xl group-hover/badge:bg-white/10 transition-colors">
                           <ShieldCheck size={18} className="text-white/40" />
                        </div>
                        <span className="text-[7px] font-black text-white/30 uppercase tracking-widest">BẢO MẬT</span>
                     </div>
                     <div className="flex flex-col items-center gap-2 text-center group/badge">
                        <div className="p-2 bg-white/5 rounded-xl group-hover/badge:bg-white/10 transition-colors">
                           <Truck size={18} className="text-white/40" />
                        </div>
                        <span className="text-[7px] font-black text-white/30 uppercase tracking-widest">GIAO NHANH</span>
                     </div>
                     <div className="flex flex-col items-center gap-2 text-center group/badge">
                        <div className="p-2 bg-white/5 rounded-xl group-hover/badge:bg-white/10 transition-colors">
                           <Clock size={18} className="text-white/40" />
                        </div>
                        <span className="text-[7px] font-black text-white/30 uppercase tracking-widest">24/7 SUPPORT</span>
                     </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.2);
        }
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}} />
    </div>
  );
}
