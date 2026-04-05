import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { User, Mail, Phone, MapPin, Camera, Edit2, Save, X, ShieldCheck, CheckCircle, KeyRound, Bone, PawPrint, ChevronRight, Hash, Star } from 'lucide-react';
import { userService } from '../../api/userService';
import { authService } from '../../api/authService';
import api from '../../api/axios';
import useAuthStore from '../../store/useAuthStore';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';

const profileSchema = z.object({
  fullName: z.string().min(2, 'Họ tên phải có ít nhất 2 ký tự'),
  soDienThoai: z.string().regex(/^(0|\+84)[3|5|7|8|9][0-9]{8}$/, 'Số điện thoại không hợp lệ'),
  diaChi: z.string().optional(),
  phuongXa: z.string().optional(),
  quanHuyen: z.string().optional(),
  tinhThanhPho: z.string().optional(),
  email: z.string().email('Email không hợp lệ'),
});

export default function ProfilePage() {
  const [isEditing, setIsEditing] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [showVerifyForm, setShowVerifyForm] = useState(false);
  const [verifyOtp, setVerifyOtp] = useState('');
  const queryClient = useQueryClient();
  const { updateUser } = useAuthStore();

  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: authService.getCurrentUser,
    staleTime: 0,
  });

  const isOAuthUser = !!profile?.oauthProvider;

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    resolver: zodResolver(profileSchema),
    values: {
      fullName: profile?.fullName || '',
      soDienThoai: profile?.soDienThoai || '',
      diaChi: profile?.diaChi || '',
      phuongXa: profile?.phuongXa || '',
      quanHuyen: profile?.quanHuyen || '',
      tinhThanhPho: profile?.tinhThanhPho || '',
      email: profile?.email || '',
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: (data) => userService.updateProfile(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries(['profile']);
      updateUser(data);
      setIsEditing(false);
      toast.success('Cập nhật thông tin thành công!');
    },
    onError: () => {
      toast.error('Cập nhật thất bại');
    },
  });

  const uploadAvatarMutation = useMutation({
    mutationFn: (file) => userService.uploadAvatar(file),
    onSuccess: (data) => {
      queryClient.invalidateQueries(['profile']);
      updateUser({ avatar: data.avatarUrl });
      setAvatarPreview(null);
      toast.success('Cập nhật ảnh đại diện thành công!');
    },
    onError: () => {
      toast.error('Upload ảnh thất bại');
    },
  });

  const sendVerificationMutation = useMutation({
    mutationFn: () => api.post('/api/auth/email/send-verification'),
    onSuccess: () => {
      setShowVerifyForm(true);
      toast.success('Mã xác thực đã được gửi đến email của bạn!');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Gửi mã xác thực thất bại');
    },
  });

  const confirmVerificationMutation = useMutation({
    mutationFn: (otp) => api.post('/api/auth/email/confirm-verification', { otp }),
    onSuccess: () => {
      queryClient.invalidateQueries(['profile']);
      setShowVerifyForm(false);
      setVerifyOtp('');
      toast.success('Xác thực email thành công! 🎉');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Xác thực thất bại');
    },
  });

  const onSubmitProfile = (data) => {
    updateProfileMutation.mutate(data);
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Kích thước ảnh không được vượt quá 5MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => setAvatarPreview(reader.result);
      reader.readAsDataURL(file);
      uploadAvatarMutation.mutate(file);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    reset();
  };

  if (isLoading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="bg-[#fcfdfd] min-h-screen py-16 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-[10%] right-[10%] opacity-[0.03] rotate-45 pointer-events-none"><Bone size={320} /></div>
      <div className="absolute bottom-[5%] left-[5%] opacity-[0.02] -rotate-12 pointer-events-none"><PawPrint size={240} /></div>

      <div className="container mx-auto px-4 max-w-6xl relative z-10 pt-10">
        
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-8 ml-2 text-center lg:text-left justify-center lg:justify-start">
           <span>TRANG CHỦ</span>
           <ChevronRight size={12} className="text-gray-300" />
           <span className="text-gray-900">THÔNG TIN CÁ NHÂN</span>
        </div>

        <div className="mb-16 text-center lg:text-left">
          <h1 className="text-5xl lg:text-7xl font-black text-gray-900 uppercase tracking-tighter leading-none mb-4">
            THÔNG TIN <span className="text-orange-600">CỦA SEN</span>
          </h1>
          <p className="text-gray-400 font-bold text-xs uppercase tracking-[0.3em]">Quản lý thông tin để nhận đãi ngộ tốt nhất</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          {/* LEFT: AVATAR CARD */}
          <div className="lg:col-span-4">
            <div className="sticky top-32 group bg-white rounded-[3.5rem] border border-gray-100 p-2 shadow-sm hover:shadow-2xl hover:shadow-orange-200/20 transition-all duration-500">
                <div className="bg-[#fcfdfd] rounded-[3rem] p-10 flex flex-col items-center">
                    <div className="relative group/avatar cursor-pointer mb-8">
                        <div className="w-52 h-52 lg:w-44 lg:h-44 xl:w-52 xl:h-52 rounded-full p-2 bg-gradient-to-tr from-orange-600/20 to-orange-100/10 shadow-inner group-hover/avatar:scale-105 transition-transform duration-500">
                            <div className="w-full h-full rounded-full overflow-hidden bg-white border-2 border-white shadow-xl">
                                {avatarPreview || profile?.avatar ? (
                                    <img
                                        src={avatarPreview || profile.avatar}
                                        alt="Avatar"
                                        width={200}
                                        height={200}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-gray-50 text-gray-300">
                                        <User size={64} />
                                    </div>
                                )}
                            </div>
                        </div>
                        <label 
                            className="absolute bottom-2 right-2 w-14 h-14 bg-gray-900 text-white rounded-full flex items-center justify-center hover:bg-orange-600 transition-colors cursor-pointer shadow-xl scale-90 group-hover/avatar:scale-110 focus-within:ring-4 focus-within:ring-orange-200"
                            title="Thay đổi ảnh đại diện"
                        >
                            <Camera size={22} aria-hidden="true" />
                            <span className="sr-only">Tải ảnh đại diện mới</span>
                            <input type="file" className="hidden" accept="image/*" onChange={handleAvatarChange} disabled={uploadAvatarMutation.isPending} />
                        </label>
                        {uploadAvatarMutation.isPending && (
                            <div className="absolute inset-0 bg-white/60 backdrop-blur-sm rounded-full flex items-center justify-center">
                                <LoadingSpinner />
                            </div>
                        )}
                    </div>

                    <div className="text-center space-y-4 w-full">
                        <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tighter leading-none">{profile?.fullName}</h2>
                        
                        <div className="flex items-center justify-center gap-2">
                             <div className={`px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                                profile?.roleName === 'ADMIN' 
                                    ? 'bg-purple-50 text-purple-600 border-purple-100' 
                                    : 'bg-orange-50 text-orange-600 border-orange-100'
                             }`}>
                                {profile?.roleName === 'ADMIN' ? 'HỘI TRƯỞNG' : 'SEN VIP'}
                             </div>
                             {profile?.emailVerified && (
                                <div className="px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center gap-1">
                                    <ShieldCheck size={12} /> ĐÃ XÁC MINH
                                </div>
                             )}
                        </div>
                        
                        <div className="pt-6 border-t border-gray-100 flex items-center justify-between w-full px-4">
                             <div className="text-center">
                                <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-1">CẤP ĐỘ</p>
                                <p className="text-xl font-black text-gray-900 tracking-tighter italic">DIAMOND</p>
                             </div>
                             <div className="w-px h-8 bg-gray-100"></div>
                             <div className="text-center">
                                <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-1">BOSS</p>
                                <p className="text-xl font-black text-gray-900 tracking-tighter">03</p>
                             </div>
                        </div>
                    </div>
                </div>
            </div>
          </div>

          {/* RIGHT: FORMS */}
          <div className="lg:col-span-8 space-y-10">
            
            {/* PERSONAL INFO FORM */}
            <div className="bg-white rounded-[4rem] border border-gray-100 p-2 shadow-sm relative overflow-hidden group">
                <div className="bg-[#fcfdfd] rounded-[3.5rem] p-8 md:p-12 lg:p-16">
                    <div className="flex items-center justify-between mb-12">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-orange-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-orange-200">
                                <User size={28} />
                            </div>
                            <h3 className="text-3xl font-black text-gray-900 uppercase tracking-tighter">HỒ SƠ CỦA SEN</h3>
                        </div>
                        {!isEditing ? (
                            <button
                                onClick={() => setIsEditing(true)}
                                className="group flex items-center gap-2 px-8 py-4 bg-gray-900 text-white rounded-full font-black text-[10px] uppercase tracking-widest hover:bg-orange-600 focus-visible:ring-4 focus-visible:ring-orange-200 focus-visible:outline-none transition-colors shadow-xl hover:shadow-orange-200 hover:translate-y-[-3px]"
                            >
                                <Edit2 size={14} className="group-hover:rotate-12 transition-transform" /> CHỈNH SỬA
                            </button>
                        ) : (
                            <button
                                onClick={handleCancelEdit}
                                className="px-8 py-4 border border-gray-100 rounded-full font-black text-[10px] uppercase tracking-widest text-gray-400 hover:text-gray-900 hover:bg-gray-50 focus-visible:ring-4 focus-visible:ring-gray-100 focus-visible:outline-none transition-colors"
                            >
                                <X size={14} className="inline mr-2" /> HỦY BỎ
                            </button>
                        )}
                    </div>

                    <form onSubmit={handleSubmit(onSubmitProfile)} className="space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <ProfileInput icon={User} label="HỌ VÀ TÊN" placeholder="Nhập tên của Sen" register={register('fullName')} disabled={!isEditing} error={errors.fullName} autoComplete="name" />
                            <ProfileInput icon={Mail} label="EMAIL CỦA SEN" register={register('email')} disabled={true} note="Email cố định để nhận ưu đãi" type="email" autoComplete="email" />
                            <ProfileInput icon={Phone} label="SỐ ĐIỆN THOẠI" placeholder="0xxxxxxxxx" register={register('soDienThoai')} disabled={!isEditing} error={errors.soDienThoai} type="tel" autoComplete="tel" />
                            <ProfileInput icon={MapPin} label="ĐỊA CHỈ TẠI GIA" placeholder="Số nhà, tên đường..." register={register('diaChi')} disabled={!isEditing} autoComplete="street-address" />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-gray-50">
                            <ProfileInput label="PHƯỜNG/XÃ" placeholder="..." register={register('phuongXa')} disabled={!isEditing} />
                            <ProfileInput label="QUẬN/HUYỆN" placeholder="..." register={register('quanHuyen')} disabled={!isEditing} />
                            <ProfileInput label="TỈNH/THÀNH PHỐ" placeholder="..." register={register('tinhThanhPho')} disabled={!isEditing} />
                        </div>

                        {isEditing && (
                            <div className="pt-8">
                                <button
                                    type="submit"
                                    disabled={updateProfileMutation.isPending}
                                    className="w-full py-6 bg-orange-600 text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] flex items-center justify-center gap-4 hover:shadow-2xl hover:shadow-orange-200 hover:translate-y-[-5px] focus-visible:ring-4 focus-visible:ring-orange-200 focus-visible:outline-none transition-all disabled:opacity-50"
                                >
                                    <Save size={20} />
                                    {updateProfileMutation.isPending ? 'ĐANG LƯU THÔNG TIN…' : 'LƯU HỒ SƠ SEN'}
                                </button>
                            </div>
                        )}
                    </form>
                </div>
            </div>

            {/* SECURITY & VERIFICATION */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                {/* Email Verification Card */}
                <div className="bg-white rounded-[3.5rem] border border-gray-100 p-2 shadow-sm overflow-hidden flex flex-col h-full">
                    <div className="bg-[#fcfdfd] rounded-[3rem] p-8 md:p-10 flex-1 flex flex-col">
                        <div className="flex items-center gap-4 mb-8">
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border shadow-sm ${profile?.emailVerified ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>
                                <ShieldCheck size={24} />
                            </div>
                            <h4 className="text-xl font-black text-gray-900 uppercase tracking-tighter">BẢO MẬT EMAIL</h4>
                        </div>
                        
                        <div className="flex-1">
                            {profile?.emailVerified ? (
                                <div className="space-y-4">
                                    <p className="text-xs font-black text-gray-400 uppercase tracking-widest leading-relaxed">
                                        Email của Sen đã được bảo vệ tuyệt đối. Ưu đãi 10% cho lần mua đầu tiên đã khả dụng!
                                    </p>
                                    <div className="flex items-center gap-2 text-emerald-600 text-sm font-black italic">
                                        <CheckCircle size={14} /> SECURITY CLEARANCE GRANTED
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    <p className="text-xs font-black text-gray-400 uppercase tracking-widest leading-relaxed">
                                        Xác thực email để nhận ngay <span className="text-orange-600 italic">VOUCHER 10%</span> cho đơn hàng đầu tiên. 
                                    </p>
                                    
                                    {!showVerifyForm ? (
                                        <button
                                            onClick={() => sendVerificationMutation.mutate()}
                                            disabled={sendVerificationMutation.isPending}
                                            className="w-full py-4 bg-gray-900 text-white rounded-full font-black text-[10px] uppercase tracking-widest hover:bg-orange-600 focus-visible:ring-4 focus-visible:ring-orange-200 focus-visible:outline-none transition-colors disabled:opacity-50"
                                        >
                                            {sendVerificationMutation.isPending ? 'ĐANG GỬI MÃ…' : 'GỬI MÃ XÁC THỰC'}
                                        </button>
                                    ) : (
                                        <div className="space-y-4">
                                            <input
                                                value={verifyOtp}
                                                onChange={(e) => setVerifyOtp(e.target.value)}
                                                placeholder="MÃ 6 CHỮ SỐ"
                                                maxLength={6}
                                                inputMode="numeric"
                                                pattern="[0-9]*"
                                                aria-label="Nhập mã xác thực OTP"
                                                className="w-full py-4 bg-white border-2 border-orange-100 rounded-2xl focus:outline-none focus:border-orange-600 text-center font-black text-xl tracking-[0.5em] text-gray-900"
                                            />
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => confirmVerificationMutation.mutate(verifyOtp)}
                                                    disabled={confirmVerificationMutation.isPending || verifyOtp.length !== 6}
                                                    className="flex-1 py-3 bg-orange-600 text-white rounded-full font-black text-[10px] uppercase tracking-widest hover:shadow-lg hover:shadow-orange-200 focus-visible:ring-4 focus-visible:ring-orange-200 focus-visible:outline-none transition-all disabled:opacity-50"
                                                >
                                                    {confirmVerificationMutation.isPending ? 'ĐANG XÁC THỰC…' : 'XÁC NHẬN'}
                                                </button>
                                                <button 
                                                    onClick={() => setShowVerifyForm(false)} 
                                                    className="px-4 py-3 bg-gray-50 text-gray-400 rounded-full hover:bg-gray-100 focus-visible:ring-4 focus-visible:ring-gray-100 focus-visible:outline-none transition-colors"
                                                    aria-label="Hủy xác thực"
                                                >
                                                    <X size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Password Info Card */}
                {!isOAuthUser && (
                    <div className="group bg-white rounded-[3.5rem] border border-gray-100 p-2 shadow-sm overflow-hidden flex flex-col h-full hover:shadow-xl transition-all duration-500">
                        <div className="bg-[#fcfdfd] rounded-[3rem] p-8 md:p-10 flex-1 flex flex-col justify-between">
                            <div>
                                <div className="flex items-center gap-4 mb-8">
                                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-blue-50 text-blue-600 border border-blue-100 shadow-sm">
                                        <KeyRound size={24} />
                                    </div>
                                    <h4 className="text-xl font-black text-gray-900 uppercase tracking-tighter">QUẢN LÝ MẬT KHẨU</h4>
                                </div>
                                <p className="text-xs font-black text-gray-400 uppercase tracking-widest leading-relaxed max-w-[200px] mb-8">
                                    Dùng tính năng "Quên mật khẩu" tại trang đăng nhập để đặt lại khóa an toàn nhé Sen.
                                </p>
                            </div>
                            <a
                                href="/forgot-password"
                                className="group/link flex items-center justify-between p-5 bg-white border border-gray-50 rounded-[1.5rem] hover:border-blue-200 transition-all"
                            >
                                <span className="text-[10px] font-black text-gray-900 uppercase tracking-widest">ĐỔI MẬT KHẨU</span>
                                <ChevronRight size={18} className="text-blue-600 group-hover/link:translate-x-2 transition-transform" />
                            </a>
                        </div>
                    </div>
                )}
            </div>
            
            <div className="flex items-center gap-3 p-6 bg-gradient-to-r from-orange-600 to-orange-400 rounded-[2.5rem] text-white overflow-hidden relative group/tips shadow-xl shadow-orange-100">
                 <div className="absolute top-[-50%] right-[-10%] w-40 h-40 bg-white/10 rounded-full blur-2xl group-hover/tips:scale-150 transition-transform duration-1000"></div>
                 <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center shrink-0">
                    <Star size={20} className="fill-white" />
                 </div>
                 <p className="text-[10px] font-black uppercase tracking-widest leading-none">Mẹo: Cập nhật địa chỉ chính xác giúp Shipper hỏa tốc mang quà đến cho Boss nhanh hơn 30%!</p>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

function ProfileInput({ icon: Icon, label, placeholder, register, disabled, error, note, type = "text", autoComplete }) {
    const inputId = `profile-${register.name}`;
    return (
        <div className="space-y-2">
            <label 
                htmlFor={inputId}
                className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2 cursor-pointer"
            >
                {Icon && <Icon size={12} />} {label}
            </label>
            <div className="relative group/input">
                <input
                    {...register}
                    id={inputId}
                    type={type}
                    autoComplete={autoComplete}
                    disabled={disabled}
                    placeholder={placeholder}
                    spellCheck={type === "text" || type === "textarea"}
                    className={`w-full px-8 py-5 rounded-[1.5rem] font-black text-sm tracking-tight transition-colors duration-300 ${
                        disabled 
                            ? 'bg-gray-50/50 text-gray-400 border border-gray-50/50' 
                            : 'bg-white border-2 border-gray-100 focus:border-orange-600 focus:outline-none focus-visible:ring-4 focus-visible:ring-orange-100 shadow-sm hover:border-orange-100'
                    }`}
                />
                {note && !disabled && <p className="mt-2 text-[9px] font-black text-gray-300 uppercase tracking-widest ml-4">{note}</p>}
                {error && <p className="mt-2 text-[10px] font-black text-rose-600 uppercase tracking-widest ml-4 italic">{error.message}</p>}
            </div>
        </div>
    );
}
