import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Home, 
  Sparkles, 
  Building2, 
  Clock, 
  MapPin, 
  Phone, 
  Mail, 
  X, 
  ChevronRight, 
  ChevronLeft, 
  PawPrint, 
  CalendarDays, 
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  ShieldAlert,
  Zap,
  Star,
  Dog,
  Cat,
  Bone,
  Heart,
  ArrowLeft
} from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import useAuthStore from '../../store/useAuthStore';
import bookingService from '../../api/bookingService';
import petService from '../../api/petService';
import PetProfileModal from '../../components/pet/PetProfileModal';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const SERVICE_MAP = {
  PET_HOTEL: { name: 'Pet Hotel', icon: Building2 },
  SPA_GROOMING: { name: 'Spa & Grooming', icon: Sparkles },
  HOME_SERVICE: { name: 'Home Service', icon: Home },
};

const services = [
  {
    id: 1,
    name: 'Pet Hotel',
    type: 'PET_HOTEL',
    icon: Building2,
    description: 'Dịch vụ lưu trú cao cấp cho thú cưng với phòng ốc tiện nghi, chăm sóc 24/7',
    image: '/Images/services/hotel.jpg',
    features: [
      'Phòng riêng biệt có máy lạnh',
      'Chăm sóc sức khỏe hàng ngày',
      'Camera giám sát 24/7',
      'Vui chơi và tập luyện',
      'Thức ăn dinh dưỡng cao cấp',
    ],
    pricing: [
      { label: 'Nhỏ (< 5kg)', price: '150.000đ/ngày' },
      { label: 'Vừa (5-15kg)', price: '200.000đ/ngày' },
      { label: 'Lớn (> 15kg)', price: '300.000đ/ngày' },
    ],
    locations: ['TP. Hồ Chí Minh', 'Hà Nội', 'Đà Nẵng'],
    needsAddress: false,
  },
  {
    id: 2,
    name: 'Spa & Grooming',
    type: 'SPA_GROOMING',
    icon: Sparkles,
    description: 'Dịch vụ spa và làm đẹp chuyên nghiệp cho thú cưng với đội ngũ groomer giàu kinh nghiệm',
    image: '/Images/services/spa.jpg',
    features: [
      'Tắm gội với sản phẩm cao cấp',
      'Cắt tỉa lông chuyên nghiệp',
      'Vệ sinh tai, móng, răng',
      'Massage thư giãn',
      'Nhuộm lông an toàn',
    ],
    pricing: [
      { label: 'Gói cơ bản', price: '150.000đ - 300.000đ' },
      { label: 'Gói cao cấp', price: '300.000đ - 500.000đ' },
      { label: 'Gói VIP', price: '500.000đ - 1.000.000đ' },
    ],
    locations: ['TP. Hồ Chí Minh', 'Hà Nội', 'Đà Nẵng', 'Cần Thơ'],
    needsAddress: false,
  },
  {
    id: 3,
    name: 'Home Service',
    type: 'HOME_SERVICE',
    icon: Home,
    description: 'Dịch vụ chăm sóc tại nhà tiện lợi, mang chuyên gia đến tận nơi',
    image: '/Images/services/home.jpg',
    features: [
      'Tắm gội tại nhà',
      'Khám sức khỏe định kỳ',
      'Tiêm phòng, tẩy giun',
      'Huấn luyện cơ bản',
      'Tư vấn dinh dưỡng',
    ],
    pricing: [
      { label: 'Tắm gội', price: '200.000đ - 400.000đ' },
      { label: 'Khám sức khỏe', price: '300.000đ - 500.000đ' },
      { label: 'Gói tổng hợp', price: '500.000đ - 1.000.000đ' },
    ],
    locations: ['TP. Hồ Chí Minh', 'Hà Nội'],
    needsAddress: true,
  },
];

function BookingModal({ isOpen, onClose, initialService }) {
  const { user, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [step, setStep] = useState(1);
  const [showPetModal, setShowPetModal] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    serviceType: initialService?.type || '',
    packageLabel: '',
    hoTen: user?.fullName || '',
    soDienThoai: '',
    email: user?.email || '',
    location: '',
    diaChi: '',
    ngayGioDat: '',
    ghiChu: '',
    petId: null,
  });

  const selectedServiceData = services.find((s) => s.type === form.serviceType);

  const { data: petsData } = useQuery({
    queryKey: ['myPets'],
    queryFn: () => petService.getMyPets(),
    enabled: isOpen && isAuthenticated,
    select: (res) => res.data?.data || [],
  });
  const pets = petsData || [];

  const createBookingMutation = useMutation({
    mutationFn: (data) => bookingService.createBooking(data),
    onSuccess: () => {
      setBookingSuccess(true);
      queryClient.invalidateQueries({ queryKey: ['myBookings'] });
    },
    onError: (err) => {
      setError(err.response?.data?.message || 'Có lỗi xảy ra khi đặt lịch');
    },
  });

  const handleSubmit = () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    setError('');
    const payload = {
      hoTen: form.hoTen,
      soDienThoai: form.soDienThoai,
      email: form.email,
      serviceType: form.serviceType,
      ngayGioDat: form.ngayGioDat ? new Date(form.ngayGioDat).toISOString() : null,
      location: form.location,
      diaChi: form.diaChi || null,
      ghiChu: form.ghiChu ? `[${form.packageLabel}] ${form.ghiChu}` : form.packageLabel || null,
      petId: form.petId || null,
    };
    createBookingMutation.mutate(payload);
  };

  const canNext = () => {
    if (step === 1) return form.serviceType && form.packageLabel;
    if (step === 2) return form.hoTen && form.soDienThoai && form.email && form.location && form.ngayGioDat && (!selectedServiceData?.needsAddress || form.diaChi);
    if (step === 3) return true;
    return false;
  };

  const handleClose = () => {
    setStep(1);
    setBookingSuccess(false);
    setError('');
    setForm({ serviceType: '', packageLabel: '', hoTen: user?.fullName || '', soDienThoai: '', email: user?.email || '', location: '', diaChi: '', ngayGioDat: '', ghiChu: '', petId: null });
    onClose();
  };

  if (!isOpen) return null;

  if (bookingSuccess) {
    return (
      <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4 animate-in fade-in duration-300">
        <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-md p-10 text-center relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-green-500 to-emerald-400" />
          <div className="w-24 h-24 bg-green-50 rounded-[2rem] flex items-center justify-center mx-auto mb-6 relative">
            <CheckCircle2 size={48} className="text-green-600" />
            <div className="absolute -top-2 -right-2 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-md animate-bounce">
               <PawPrint size={16} className="text-green-600" />
            </div>
          </div>
          <h2 className="text-3xl font-black text-gray-900 mb-3 uppercase tracking-tighter">ĐẶT LỊCH THÀNH CÔNG!</h2>
          <p className="text-gray-500 font-bold text-[11px] uppercase tracking-widest mb-2 leading-relaxed">Email xác nhận đang trên đường tới Boss…</p>
          <p className="text-gray-400 text-[10px] mb-10 leading-relaxed uppercase tracking-widest">Đội ngũ chúng tôi sẽ chủ động liên hệ sớm nhất!</p>
          
          <div className="space-y-3">
             <button onClick={() => { handleClose(); navigate('/bookings'); }} className="w-full py-5 bg-gray-900 text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] shadow-xl hover:bg-orange-600 transition-all active:scale-95 flex items-center justify-center gap-2">
                XEM LỊCH SỬ DỊCH VỤ <ArrowRight size={16} />
             </button>
             <button onClick={handleClose} className="w-full py-5 bg-gray-50 text-gray-500 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] hover:bg-gray-100 transition-all">
                ĐÓNG CỬA SỔ
             </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4 animate-in fade-in zoom-in duration-300">
      <div className="bg-white rounded-[3.5rem] shadow-2xl w-full max-w-2xl max-h-[92vh] overflow-hidden flex flex-col relative group border border-white">
        {/* Header - Premium */}
        <div className="flex items-center justify-between p-8 border-b border-gray-50 bg-gray-50/50">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-orange-600 text-white rounded-2xl flex items-center justify-center shadow-xl shadow-orange-100">
              <CalendarDays size={28} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-gray-900 tracking-tighter uppercase leading-none">ĐẶT LỊCH DỊCH VỤ</h2>
              <div className="flex items-center gap-2 mt-2">
                 {[1, 2, 3].map((s) => (
                   <div key={s} className={`h-1.5 rounded-full transition-all duration-500 ${s === step ? 'w-8 bg-orange-600' : s < step ? 'w-3 bg-orange-200' : 'w-2 bg-gray-100'}`} />
                 ))}
                 <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">BƯỚC {step}/3</span>
              </div>
            </div>
          </div>
          <button onClick={handleClose} className="w-10 h-10 bg-white border border-gray-100 rounded-full flex items-center justify-center text-gray-400 hover:bg-red-50 hover:text-red-500 transition-all shadow-sm"><X size={20} /></button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          {step === 1 && (
            <div className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-500">
               <div>
                 <p className="text-[10px] font-black text-orange-500 uppercase tracking-[0.2em] mb-4">THÔNG TIN BAN ĐẦU</p>
                 <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight mb-6 flex items-center gap-3">
                   CHỌN DỊCH VỤ <PawPrint className="text-gray-200" size={24} />
                 </h3>
                 <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                   {services.map((svc) => {
                     const Icon = svc.icon;
                     const selected = form.serviceType === svc.type;
                     return (
                       <button
                         key={svc.type}
                         onClick={() => setForm({ ...form, serviceType: svc.type, packageLabel: '', location: '' })}
                         className={`relative p-6 rounded-[2rem] border-2 transition-all duration-500 group/svc overflow-hidden ${selected ? 'border-orange-600 bg-orange-600 text-white shadow-2xl shadow-orange-100 -translate-y-2' : 'border-gray-50 bg-gray-50/50 hover:border-orange-200 hover:bg-white'}`}
                       >
                         {selected && <div className="absolute top-[-20%] right-[-20%] w-24 h-24 bg-white/10 rounded-full opacity-50 blur-xl"></div>}
                         <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 transition-all duration-500 ${selected ? 'bg-white/20 text-white' : 'bg-white text-gray-400 shadow-sm group-hover/svc:scale-110'}`}>
                           <Icon size={28} />
                         </div>
                         <span className={`block text-xs font-black uppercase tracking-wider ${selected ? 'text-white' : 'text-gray-900'}`}>{svc.name}</span>
                         {selected && <div className="absolute top-3 right-3"><CheckCircle2 size={16} /></div>}
                       </button>
                     );
                   })}
                 </div>
               </div>

               {selectedServiceData && (
                 <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
                   <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight mb-6">CHỌN GÓI DỊCH VỤ</h3>
                   <div className="grid grid-cols-1 gap-3">
                     {selectedServiceData.pricing.map((pkg) => (
                       <button
                         key={pkg.label}
                         onClick={() => setForm({ ...form, packageLabel: pkg.label })}
                         className={`w-full flex items-center justify-between p-6 rounded-2xl border-2 transition-all duration-300 ${form.packageLabel === pkg.label ? 'border-orange-600 bg-orange-50/30' : 'border-gray-50 bg-gray-50/50 hover:border-orange-200 hover:bg-white'}`}
                       >
                         <div className="flex items-center gap-4">
                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${form.packageLabel === pkg.label ? 'border-orange-600 bg-orange-600' : 'border-gray-300'}`}>
                               {form.packageLabel === pkg.label && <div className="w-2 h-2 bg-white rounded-full"></div>}
                            </div>
                            <span className="font-black text-xs uppercase tracking-widest text-gray-900">{pkg.label}</span>
                         </div>
                         <span className="text-sm font-black text-orange-600 tabular-nums uppercase">{pkg.price}</span>
                       </button>
                     ))}
                   </div>
                 </div>
               )}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
               <div>
                 <p className="text-[10px] font-black text-orange-500 uppercase tracking-[0.2em] mb-4">THÔNG TIN LIÊN HỆ</p>
                 <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight mb-6">SEN TÊN LÀ GÌ NHỈ?</h3>
                 
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">HỌ VÀ TÊN SEN *</label>
                        <input
                          type="text"
                          autoComplete="name"
                          value={form.hoTen}
                          onChange={(e) => setForm({ ...form, hoTen: e.target.value })}
                          placeholder="Nhập tên của bạn…"
                          className="w-full px-8 py-4 bg-gray-50/50 border-2 border-transparent focus:border-orange-200 focus:bg-white focus:outline-none transition-all duration-300 rounded-2xl font-bold text-gray-900 placeholder:text-gray-300 focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:outline-none"
                        />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">SỐ ĐIỆN THOẠI *</label>
                       <input
                         type="tel"
                         autoComplete="tel"
                         inputMode="tel"
                         value={form.soDienThoai}
                         onChange={(e) => setForm({ ...form, soDienThoai: e.target.value })}
                         placeholder="09xx xxx xxx…"
                         className="w-full px-8 py-4 bg-gray-50/50 border-2 border-transparent focus:border-orange-200 focus:bg-white focus:outline-none transition-all duration-300 rounded-2xl font-bold text-gray-900 placeholder:text-gray-300 tabular-nums focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:outline-none"
                       />
                    </div>
                    <div className="md:col-span-2 space-y-2">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">EMAIL XÁC NHẬN *</label>
                       <input
                         type="email"
                         autoComplete="email"
                         value={form.email}
                         onChange={(e) => setForm({ ...form, email: e.target.value })}
                         placeholder="boss@example.com…"
                         className="w-full px-8 py-4 bg-gray-50/50 border-2 border-transparent focus:border-orange-200 focus:bg-white focus:outline-none transition-all duration-300 rounded-2xl font-bold text-gray-900 placeholder:text-gray-300 focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:outline-none"
                       />
                    </div>
                    
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">{selectedServiceData?.needsAddress ? 'THÀNH PHỐ *' : 'CHI NHÁNH *'}</label>
                       <select value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className="w-full px-8 py-4 bg-gray-50/50 border-2 border-transparent focus:border-orange-200 focus:bg-white focus:outline-none transition-all rounded-2xl font-bold text-gray-900 appearance-none">
                          <option value="">Chọn địa điểm</option>
                          {(selectedServiceData?.locations || []).map((loc) => <option key={loc} value={loc}>{loc}</option>)}
                       </select>
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">NGÀY GIỜ HẸN *</label>
                       <input
                         type="datetime-local"
                         value={form.ngayGioDat}
                         min={new Date().toISOString().slice(0, 16)}
                         onChange={(e) => setForm({ ...form, ngayGioDat: e.target.value })}
                         className="w-full px-8 py-4 bg-gray-50/50 border-2 border-transparent focus:border-orange-200 focus:bg-white focus:outline-none transition-all duration-300 rounded-2xl font-bold text-gray-900 focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:outline-none"
                       />
                    </div>

                    {selectedServiceData?.needsAddress && (
                      <div className="md:col-span-2 space-y-2">
                         <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">ĐỊA CHỈ NHÀ BẠN *</label>
                         <input
                           type="text"
                           autoComplete="street-address"
                           value={form.diaChi}
                           onChange={(e) => setForm({ ...form, diaChi: e.target.value })}
                           placeholder="Số nhà, đường, quận/huyện..."
                           className="w-full px-8 py-4 bg-gray-50/50 border-2 border-transparent focus:border-orange-200 focus:bg-white focus:outline-none transition-all duration-300 rounded-2xl font-bold text-gray-900 placeholder:text-gray-300 focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:outline-none"
                         />
                      </div>
                    )}

                    <div className="md:col-span-2 space-y-2">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">YÊU CẦU ĐẶC BIỆT</label>
                       <textarea
                         value={form.ghiChu}
                         onChange={(e) => setForm({ ...form, ghiChu: e.target.value })}
                         rows={2}
                         className="w-full px-8 py-4 bg-gray-50/50 border-2 border-transparent focus:border-orange-200 focus:bg-white focus:outline-none transition-all duration-300 rounded-[2rem] font-bold text-gray-900 placeholder:text-gray-300 resize-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:outline-none"
                         placeholder="Ví dụ: Boss nhà tui hơi kén ăn..."
                       />
                    </div>
                 </div>
               </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
               <div>
                  <p className="text-[10px] font-black text-orange-500 uppercase tracking-[0.2em] mb-4">PROFILE THÚ CƯNG</p>
                  <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight mb-6">BẠN SẼ DẮT AI ĐẾN?</h3>
                  
                  {pets.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <button
                        onClick={() => setForm({ ...form, petId: null })}
                        className={`group p-6 rounded-[2rem] border-2 transition-all duration-300 flex flex-col items-center text-center ${!form.petId ? 'border-orange-600 bg-orange-600 text-white shadow-xl shadow-orange-100' : 'border-gray-50 bg-gray-50/50 hover:bg-white hover:border-orange-200'}`}
                      >
                         <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-all duration-500 ${!form.petId ? 'bg-white/20 text-white' : 'bg-white text-gray-300 shadow-sm'}`}>
                           <Cat size={32} />
                         </div>
                         <span className="font-black text-[11px] uppercase tracking-widest leading-none mb-1">CHƯA CHỌN</span>
                         <span className="text-[9px] font-bold opacity-60 uppercase">DÙNG DỊCH VỤ CHUNG</span>
                      </button>

                      {pets.map((pet) => (
                        <button
                          key={pet.idPet}
                          onClick={() => setForm({ ...form, petId: pet.idPet })}
                          className={`p-6 rounded-[2rem] border-2 transition-all duration-300 flex flex-col items-center text-center relative overflow-hidden ${form.petId === pet.idPet ? 'border-orange-600 bg-orange-600 text-white shadow-xl shadow-orange-100' : 'border-gray-50 bg-gray-50/50 hover:bg-white hover:border-orange-200'}`}
                        >
                           <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-all duration-500 ${form.petId === pet.idPet ? 'bg-white/20 text-white' : 'bg-primary-50 text-orange-600 shadow-sm'}`}>
                             <PawPrint size={32} />
                           </div>
                           <span className="font-black text-sm uppercase tracking-tight leading-none mb-2">{pet.tenPet}</span>
                           <span className={`text-[9px] font-bold uppercase tracking-widest ${form.petId === pet.idPet ? 'text-white/80' : 'text-gray-400'}`}>
                             {pet.loaiPet}{pet.giong ? ` · ${pet.giong}` : ''}
                           </span>
                           {form.petId === pet.idPet && (
                             <div className="absolute top-4 right-4"><CheckCircle2 size={18} /></div>
                           )}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-16 bg-gray-50/50 rounded-[3rem] border-2 border-dashed border-gray-200 animate-in zoom-in duration-500">
                      <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm border border-gray-100">
                         <Dog size={48} className="text-gray-200" />
                      </div>
                      <p className="text-gray-900 font-black text-base uppercase tracking-tight mb-2">BẠN CHƯA CÓ PROFILE BOSS</p>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-8">HÃY TẠO PROFILE ĐỂ NHẬN ƯU ĐÃI RIÊNG NHÉ!</p>
                    </div>
                  )}

                  <button
                    onClick={() => setShowPetModal(true)}
                    className="w-full mt-6 py-5 bg-white border-2 border-dashed border-orange-200 text-orange-600 rounded-[2rem] hover:bg-orange-50 hover:border-orange-400 transition-all font-black text-[11px] uppercase tracking-[0.2em] flex items-center justify-center gap-3 active:scale-[0.98]"
                  >
                    <PawPrint size={18} />
                    TẠO PROFILE MỚI CHO BOSS
                  </button>
               </div>
            </div>
          )}

          {error && (
             <div className="mt-8 p-4 bg-red-50 rounded-2xl border border-red-100 flex items-center gap-3 animate-in shake duration-500">
                <ShieldAlert className="text-red-500 shrink-0" size={20} />
                <p className="text-[11px] font-black text-red-600 uppercase tracking-wider">{error}</p>
             </div>
          )}
        </div>

        {/* Footer - Floating Button Style */}
        <div className="p-8 border-t border-gray-50 flex items-center justify-between gap-6 bg-white/80 backdrop-blur-md">
          {step > 1 ? (
            <button onClick={() => setStep(step - 1)} className="flex items-center gap-2 px-8 py-5 text-gray-400 hover:text-gray-900 font-black text-[11px] uppercase tracking-[0.2em] transition-all">
              <ArrowLeft size={18} /> QUAY LẠI
            </button>
          ) : <div />}

          {step < 3 ? (
            <button
              onClick={() => setStep(step + 1)}
              disabled={!canNext()}
              className="flex items-center gap-4 px-10 py-5 bg-gray-900 text-white rounded-[1.5rem] font-black text-[11px] uppercase tracking-[0.2em] shadow-2xl shadow-gray-200 hover:bg-orange-600 hover:-translate-y-1 transition-all disabled:opacity-20 disabled:cursor-not-allowed group/next"
            >
              TIẾP THEO <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={createBookingMutation.isPending}
              className="px-12 py-5 bg-orange-600 text-white rounded-[1.5rem] font-black text-[11px] uppercase tracking-[0.2em] shadow-2xl shadow-orange-100 hover:bg-orange-500 hover:-translate-y-1 transition-all flex items-center gap-3 active:scale-95 group/confirm relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover/confirm:translate-x-[100%] transition-transform duration-1000 -skew-x-12" />
              {createBookingMutation.isPending ? (
                 <>
                   <LoadingSpinner size="sm" color="white" />
                   <span>ĐANG ĐẶT LỊCH…</span>
                 </>
              ) : (
                 <>
                   <CheckCircle2 size={20} />
                   <span>XÁC NHẬN ĐẶT LỊCH</span>
                 </>
              )}
            </button>
          )}
        </div>
      </div>

      <PetProfileModal isOpen={showPetModal} onClose={() => setShowPetModal(false)} />
    </div>
  );
}

export default function ServicesPage() {
  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  const [selectedService, setSelectedService] = useState(null);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [bookingService, setBookingServiceState] = useState(null);

  const handleBookNow = (service) => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    setBookingServiceState(service);
    setBookingOpen(true);
  };

  return (
    <div className="bg-[#fcfdfd] min-h-screen relative overflow-hidden">
      {/* Decorative Signature Background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-5%] right-[-5%] w-[45vw] h-[45vw] bg-orange-100/30 rounded-full blur-[120px] opacity-40"></div>
        <div className="absolute bottom-[-5%] left-[-5%] w-[40vw] h-[40vw] bg-blue-50/40 rounded-full blur-[100px] opacity-30"></div>
        <div className="absolute top-[15%] left-[10%] opacity-[0.03] rotate-12"><Dog size={240} /></div>
        <div className="absolute bottom-[10%] right-[3%] opacity-[0.03] -rotate-12"><Cat size={200} /></div>
        <div className="absolute top-[40%] right-[10%] opacity-[0.02] -rotate-45"><Bone size={120} /></div>
      </div>

      <div className="relative z-10 pt-32 pb-24">
        {/* Premium Hero Section */}
        <section className="container mx-auto px-4 mb-24">
           <div className="max-w-4xl mx-auto text-center animate-in fade-in slide-in-from-top-10 duration-1000">
              <div className="inline-flex items-center gap-2 px-6 py-2 bg-orange-50 text-orange-600 rounded-full text-[10px] font-black uppercase tracking-[0.3em] mb-8 shadow-sm">
                 <Sparkles size={14} className="fill-orange-600" />
                 Dịch vụ 5 sao cho Boss
              </div>
              <h1 className="text-6xl md:text-8xl font-black text-gray-900 tracking-tighter uppercase mb-6 leading-none">
                 CHĂM SÓC <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-orange-400">TẬN TÂM</span>
              </h1>
              <p className="text-gray-400 font-bold uppercase text-xs md:text-sm tracking-[0.2em] max-w-2xl mx-auto leading-relaxed mb-12">
                 Chúng tôi mang đến những trải nghiệm tốt nhất, giúp Boss luôn vui khỏe và hạnh phúc mỗi ngày 🐾
              </p>
              
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                 <button
                   onClick={() => handleBookNow(null)}
                   className="px-12 py-6 bg-gray-900 text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] shadow-2xl shadow-gray-200 hover:bg-orange-600 hover:-translate-y-2 transition-all active:scale-95 group"
                 >
                   Đặt lịch ngay hôm nay <ArrowRight size={18} className="inline ml-2 group-hover:translate-x-1 transition-transform" />
                 </button>
                 <Link to="/products" className="px-12 py-6 bg-white text-gray-400 rounded-[2rem] font-black text-[10px] uppercase tracking-[0.2em] border border-gray-100 hover:text-orange-600 hover:border-orange-200 transition-all">
                    Xem sản phẩm Boss yêu
                 </Link>
              </div>
           </div>
        </section>

        {/* Services Grid - High-End Style */}
        <section className="container mx-auto px-4 py-20 relative">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80%] h-[1px] bg-gradient-to-r from-transparent via-gray-100 to-transparent"></div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-20">
            {services.map((service, index) => {
              const Icon = service.icon;
              return (
                <div
                  key={service.id}
                  className="bg-white rounded-[3.5rem] shadow-2xl shadow-gray-200/40 p-10 border border-white overflow-hidden hover:shadow-orange-100 hover:-translate-y-4 transition-all duration-700 group cursor-pointer animate-in fade-in slide-in-from-bottom-10 fill-mode-both relative"
                  style={{ animationDelay: `${index * 200}ms` }}
                  onClick={() => setSelectedService(service)}
                >
                  <div className="absolute top-0 right-0 w-40 h-40 bg-orange-50/50 rounded-bl-full opacity-20 group-hover:scale-125 transition-transform duration-1000 -mr-10 -mt-10 pointer-events-none"></div>
                  
                  <div className="w-20 h-20 bg-gray-50 rounded-[2rem] flex items-center justify-center mb-10 group-hover:bg-orange-600 group-hover:text-white group-hover:shadow-2xl group-hover:shadow-orange-200 transition-all duration-500 relative">
                    <Icon size={40} className="transition-transform group-hover:scale-110" />
                    <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-white text-orange-600 rounded-full flex items-center justify-center shadow-lg transform scale-0 group-hover:scale-100 transition-transform duration-500 delay-100">
                       <Heart size={16} className="fill-orange-600" />
                    </div>
                  </div>

                  <h3 className="text-3xl font-black text-gray-900 mb-4 tracking-tighter uppercase leading-none group-hover:text-orange-600 transition-colors">
                    {service.name}
                  </h3>
                  <p className="text-gray-400 font-bold text-[10px] uppercase leading-loose tracking-widest mb-10 min-h-[4rem]">
                    {service.description}
                  </p>

                  <div className="flex items-center justify-between pt-8 border-t border-gray-50">
                     <span className="text-[10px] font-black text-orange-600 uppercase tracking-widest bg-orange-50 px-3 py-1.5 rounded-full">Best Choice</span>
                     <button className="flex items-center gap-2 font-black text-[10px] uppercase tracking-widest text-gray-900 group-hover:translate-x-1 transition-transform">
                        Chi tiết <ChevronRight size={16} className="text-orange-600" />
                     </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Service Details Floating Panel */}
          {selectedService && (
            <div className="bg-white rounded-[4rem] shadow-2xl shadow-gray-300/40 p-10 md:p-16 mb-24 border border-white animate-in zoom-in slide-in-from-bottom-10 duration-700 relative group/panel overflow-hidden">
              <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-blue-50/30 rounded-full blur-[100px] -mr-48 -mt-48 transition-transform duration-1000 group-hover/panel:scale-110"></div>
              
              <button 
                onClick={() => setSelectedService(null)} 
                className="absolute top-10 right-10 w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-gray-400 hover:text-gray-900 hover:rotate-90 transition-all duration-300 shadow-sm focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:outline-none"
                aria-label="Đóng"
              >
                <X size={24} />
              </button>

              <div className="relative z-10 flex flex-col lg:flex-row gap-16">
                {/* Visual Side */}
                <div className="lg:w-1/2">
                   <div className="relative w-full aspect-[4/3] rounded-[3rem] overflow-hidden shadow-2xl">
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent z-10"></div>
                      <div className="absolute inset-0 bg-orange-600 group-hover/panel:scale-105 transition-transform duration-1000 flex items-center justify-center">
                         <selectedService.icon size={120} className="text-white opacity-20" />
                      </div>
                      <div className="absolute bottom-10 left-10 z-20">
                         <h2 className="text-5xl font-black text-white uppercase tracking-tighter leading-none mb-2">{selectedService.name}</h2>
                         <div className="flex items-center gap-2">
                           {[...Array(5)].map((_, i) => <Star key={i} size={14} className="text-orange-400 fill-orange-400" />)}
                           <span className="text-white/60 text-[10px] font-black tracking-widest ml-1 uppercase">4.9/5 RATING</span>
                         </div>
                      </div>
                   </div>

                   <div className="mt-12 grid grid-cols-2 gap-4">
                      <div className="p-6 bg-gray-50/50 rounded-[2rem] border border-gray-100">
                         <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">QUY TRÌNH</p>
                         <p className="text-[11px] font-black text-gray-900 uppercase tracking-tight">Chuẩn 5 Bước Chuyên Nghiệp</p>
                      </div>
                      <div className="p-6 bg-gray-50/50 rounded-[2rem] border border-gray-100">
                         <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">CAM KẾT</p>
                         <p className="text-[11px] font-black text-gray-900 uppercase tracking-tight">An Toàn Tuyệt Đối Cho Boss</p>
                      </div>
                   </div>
                </div>

                {/* Info Side */}
                <div className="lg:w-1/2 flex flex-col pt-4">
                   <div className="mb-12">
                     <h3 className="text-[11px] font-black text-orange-500 uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
                        <CheckCircle2 size={16} /> DỊCH VỤ BAO GỒM
                     </h3>
                     <ul className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                       {selectedService.features.map((feature, idx) => (
                         <li key={idx} className="flex items-center gap-4 group/li">
                           <div className="w-8 h-8 bg-green-50 text-green-600 rounded-xl flex items-center justify-center flex-shrink-0 group-hover/li:bg-green-600 group-hover/li:text-white transition-all transform scale-95 group-hover/li:scale-100 group-hover/li:rotate-12">
                             <CheckCircle2 size={16} />
                           </div>
                           <span className="text-gray-900 font-bold text-xs uppercase tracking-tight leading-tight">{feature}</span>
                         </li>
                       ))}
                     </ul>
                   </div>

                   <div className="mb-12">
                     <h3 className="text-[11px] font-black text-orange-500 uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
                        <MapPin size={16} /> KHU VỰC PHỤC VỤ
                     </h3>
                     <div className="flex flex-wrap gap-3">
                       {selectedService.locations.map((location, idx) => (
                         <span key={idx} className="px-6 py-2.5 bg-gray-100 text-gray-900 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm hover:bg-white hover:shadow-lg transition-all cursor-default">
                           {location}
                         </span>
                       ))}
                     </div>
                   </div>

                   <div className="mt-auto p-10 bg-gray-900 rounded-[3rem] text-white shadow-2xl relative overflow-hidden group/cta">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -mr-16 -mt-16 pointer-events-none"></div>
                      <div className="relative z-10">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 border-b border-white/10 pb-8">
                           <div>
                              <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em] mb-3 leading-none">BẢNG GIÁ ƯU ĐÃI</p>
                              <div className="space-y-3">
                                {selectedService.pricing.map((item, idx) => (
                                  <div key={idx} className="flex items-center justify-between gap-10">
                                    <span className="text-xs font-black uppercase tracking-widest text-white/70 italic">{item.label}</span>
                                    <span className="text-xs font-black text-orange-400 tabular-nums">{item.price}</span>
                                  </div>
                                ))}
                              </div>
                           </div>
                           <Zap size={48} className="text-white/5 rotate-12 shrink-0" />
                        </div>

                        <button
                          onClick={() => handleBookNow(selectedService)}
                          className="w-full py-6 bg-white text-gray-900 rounded-2xl font-black text-xs uppercase tracking-[0.3em] shadow-xl hover:bg-orange-600 hover:text-white transition-all transform active:scale-95 group/btn"
                        >
                          Đặt lịch hẹn ngay <ChevronRight size={18} className="inline ml-1 group-hover/btn:translate-x-1 transition-transform" />
                        </button>
                      </div>
                   </div>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Premium Badge CTA */}
        <section className="container mx-auto px-4 mb-32">
          {isAuthenticated && (
            <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-[4rem] p-12 md:p-16 flex flex-col md:flex-row items-center justify-between relative overflow-hidden group shadow-2xl">
               <div className="absolute top-[-50%] left-[-10%] w-[500px] h-[500px] bg-orange-500/10 rounded-full blur-[100px] transition-transform duration-1000 group-hover:scale-110"></div>
               <div className="absolute bottom-[-20%] right-[-5%] w-[300px] h-[300px] bg-blue-500/5 rounded-full blur-[80px]"></div>
               
               <div className="flex flex-col md:flex-row items-center gap-10 relative z-10 text-center md:text-left">
                  <div className="w-24 h-24 bg-white/10 backdrop-blur-md rounded-[2.5rem] flex items-center justify-center border border-white/20 group-hover:rotate-6 transition-transform duration-500">
                    <PawPrint size={48} className="text-orange-500" />
                  </div>
                  <div>
                    <h3 className="text-4xl font-black text-white uppercase tracking-tighter mb-3 leading-none italic">QUẢN LÝ BOSS YÊU?</h3>
                    <p className="text-white/40 font-bold text-[10px] uppercase tracking-widest leading-relaxed max-w-sm">Tạo profile thú cưng để chúng tôi ghi nhớ thói quen và ưu tiên lịch hẹn cho bạn 🐾</p>
                  </div>
               </div>

               <button
                 onClick={() => navigate('/my-pets')}
                 className="mt-10 md:mt-0 px-12 py-6 bg-orange-600 text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] shadow-2xl shadow-orange-900/40 hover:bg-white hover:text-gray-900 hover:-translate-y-2 transition-all relative z-10 active:scale-95 group/manage"
               >
                 Vào trang quản lý <ArrowRight size={18} className="inline ml-2 group-hover/manage:translate-x-1 transition-transform" />
               </button>
            </div>
          )}
        </section>

        {/* Detailed "Why Choose Us" Bubbles */}
        <section className="container mx-auto px-4">
           <div className="text-center mb-20 animate-in fade-in slide-in-from-bottom-5 duration-1000">
              <p className="text-[10px] font-black text-orange-500 uppercase tracking-[0.4em] mb-4">GIÁ TRỊ CỐT LÕI</p>
              <h2 className="text-5xl font-black text-gray-900 uppercase tracking-tighter mb-4 leading-none">TẠI SAO CHỌN <span className="text-orange-600 italic">PAWVERSE</span>?</h2>
              <p className="text-gray-400 font-bold text-[10px] uppercase tracking-[0.2em]">Cam kết dịch vụ chất lượng cao nhất cho gia đình của bạn 🐾</p>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { icon: Sparkles, title: 'CHUYÊN NGHIỆP', desc: 'Đội ngũ được đào tạo bài bản' },
                { icon: ShieldCheck, title: 'AN TOÀN', desc: 'Cam kết sức khỏe thú cưng' },
                { icon: Clock, title: 'NHANH CHÓNG', desc: 'Dịch vụ tận tâm 24/7' },
                { icon: MapPin, title: 'TIỆN LỢI', desc: 'Hỗ trợ nhiều khu vực' }
              ].map((item, idx) => (
                <div key={idx} className="bg-white/50 backdrop-blur-sm rounded-[3rem] p-10 border border-white text-center hover:bg-white hover:shadow-2xl hover:shadow-gray-200/50 hover:-translate-y-4 transition-all duration-500 group">
                   <div className="w-20 h-20 bg-gray-50 rounded-[2rem] flex items-center justify-center mx-auto mb-8 transition-all group-hover:bg-orange-600 group-hover:text-white group-hover:shadow-xl group-hover:rotate-6">
                      <item.icon size={36} />
                   </div>
                   <h3 className="font-black text-gray-900 text-sm uppercase tracking-widest mb-3 leading-none">{item.title}</h3>
                   <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-relaxed">{item.desc}</p>
                </div>
              ))}
           </div>
        </section>
      </div>

      {/* Booking Modal */}
      <BookingModal
        isOpen={bookingOpen}
        onClose={() => setBookingOpen(false)}
        initialService={bookingService}
      />

      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.02);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(0, 0, 0, 0.05);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(0, 0, 0, 0.1);
        }
      `}} />
    </div>
  );
}
