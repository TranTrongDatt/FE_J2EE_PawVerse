import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, ArrowLeft, Mail, KeyRound, CheckCircle, Eye, EyeOff, Dog, Cat, PawPrint, ShieldCheck, Bone } from 'lucide-react';
import toast from 'react-hot-toast';
import { authService } from '../../api/authService';

const emailSchema = z.object({
  email: z.string().email('Email không hợp lệ'),
});

const resetSchema = z.object({
  otp: z.string().length(6, 'Mã OTP gồm 6 chữ số'),
  newPassword: z.string()
    .min(6, 'Mật khẩu phải có ít nhất 6 ký tự'),
  confirmPassword: z.string(),
}).refine((d) => d.newPassword === d.confirmPassword, {
  message: 'Mật khẩu xác nhận không khớp',
  path: ['confirmPassword'],
});

// Step 1: email entry  Step 2: otp + new password  Step 3: success
export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [submittedEmail, setSubmittedEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const emailForm = useForm({
    resolver: zodResolver(emailSchema),
  });

  const resetForm = useForm({
    resolver: zodResolver(resetSchema),
  });

  const onSubmitEmail = async (data) => {
    setIsLoading(true);
    try {
      await authService.forgotPassword(data.email);
      setSubmittedEmail(data.email);
      setStep(2);
      toast.success('Mã OTP đã được gửi đến email của bạn!');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Không thể gửi email. Kiểm tra lại địa chỉ email.');
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmitReset = async (data) => {
    setIsLoading(true);
    try {
      await authService.resetPassword(submittedEmail, data.otp, data.newPassword);
      setStep(3);
      toast.success('Đặt lại mật khẩu thành công!');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Mã OTP không hợp lệ hoặc đã hết hạn');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setIsLoading(true);
    try {
      await authService.forgotPassword(submittedEmail);
      toast.success('Đã gửi lại mã OTP!');
    } catch (error) {
      toast.error('Không thể gửi lại. Thử lại sau.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white relative flex items-center justify-center py-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
      {/* Decorative Background Blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-5%] right-[-5%] w-[40vw] h-[40vw] bg-orange-100/30 rounded-full blur-[100px] opacity-40"></div>
        <div className="absolute bottom-[-5%] left-[-5%] w-[35vw] h-[35vw] bg-blue-50/40 rounded-full blur-[80px] opacity-30"></div>
        
        {/* Subtle Decorative Outlines */}
        <div className="absolute top-[20%] left-[5%] opacity-[0.03] rotate-12 scale-150">
          <Bone size={200} className="text-orange-900" />
        </div>
        <div className="absolute bottom-[20%] right-[3%] opacity-[0.03] -rotate-12 scale-150">
          <PawPrint size={180} className="text-orange-900" />
        </div>
      </div>

      <div className="max-w-md w-full relative z-10 animate-in fade-in zoom-in duration-700">
        {/* Glass Card Container */}
        <div className="bg-white/70 backdrop-blur-2xl border border-white/50 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] rounded-[2.5rem] p-8 md:p-10">
          <div className="mb-8">
            <div className="flex justify-center mb-6">
              <div className="relative group">
                <div className="absolute -inset-4 bg-blue-100/50 rounded-full blur-xl group-hover:bg-blue-200/50 transition-colors duration-500"></div>
                <div className="relative bg-white shadow-xl shadow-blue-100 w-16 h-16 rounded-2xl flex items-center justify-center text-3xl transform -rotate-12 group-hover:rotate-0 transition-transform duration-500">
                  🔐
                </div>
              </div>
            </div>
            
            <h2 className="text-center text-2xl font-black text-gray-900 tracking-tighter uppercase mb-6">
              KHÔI PHỤC <span className="block text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-orange-400">
                MẬT KHẨU
              </span>
            </h2>

            {/* Step indicator */}
            <div className="flex items-center justify-center gap-3">
              {[1, 2, 3].map((s) => (
                <div key={s} className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-sm font-black transition-all duration-500 ${
                    step > s ? 'bg-green-500 text-white shadow-lg shadow-green-200 rotate-12' :
                    step === s ? 'bg-orange-600 text-white shadow-lg shadow-orange-200 rotate-0 scale-110' :
                    'bg-gray-100 text-gray-400'
                  }`}>
                    {step > s ? <CheckCircle size={20} /> : s}
                  </div>
                  {s < 3 && <div className={`w-6 h-1 rounded-full transition-colors duration-500 ${step > s ? 'bg-green-500' : 'bg-gray-100'}`} />}
                </div>
              ))}
            </div>
          </div>

          {/* Step 1: Enter email */}
          {step === 1 && (
            <form className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500" onSubmit={emailForm.handleSubmit(onSubmitEmail)}>
              <p className="text-center text-[11px] font-bold text-gray-500 uppercase tracking-widest leading-relaxed">
                HÃY NHẬP EMAIL CỦA BẠN <br /> ĐỂ NHẬN MÃ XÁC THỰC OTP
              </p>
              
              <div className="group">
                <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 mb-2 ml-1">Địa chỉ Email</label>
                <div className="relative">
                  <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-orange-500 transition-colors" />
                  <input
                    {...emailForm.register('email')}
                    type="email"
                    className="w-full h-14 pl-12 pr-5 bg-white/50 border border-gray-200/50 rounded-2xl text-sm font-medium transition-all focus:outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500/50"
                    placeholder="example@email.com"
                  />
                </div>
                {emailForm.formState.errors.email && (
                  <p className="mt-1.5 text-[10px] font-bold text-red-500 uppercase tracking-wider ml-1">{emailForm.formState.errors.email.message}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="group relative w-full h-14 bg-gradient-to-r from-orange-600 to-orange-400 text-white text-xs font-black uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-orange-500/20 hover:shadow-orange-500/30 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 disabled:opacity-50 overflow-hidden"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {isLoading ? <><Loader2 className="animate-spin" size={18} /> Đang gửi...</> : 'Gửi mã xác nhận'}
                </span>
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
              </button>

              <div className="text-center pt-2">
                <Link to="/login" className="inline-flex items-center gap-2 text-[11px] font-black text-gray-400 hover:text-orange-600 uppercase tracking-widest transition-colors">
                  <ArrowLeft size={16} /> Quay lại đăng nhập
                </Link>
              </div>
            </form>
          )}

          {/* Step 2: Enter OTP + new password */}
          {step === 2 && (
            <form className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-500" onSubmit={resetForm.handleSubmit(onSubmitReset)}>
              <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-4 text-[11px] font-bold text-blue-700 leading-relaxed uppercase tracking-wider">
                MÃ OTP ĐÃ ĐƯỢC GỬI ĐẾN <span className="text-blue-900 block mt-1">{submittedEmail}</span>
              </div>

              <div className="group">
                <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 mb-2 ml-1">Mã xác thực OTP (6 chữ số)</label>
                <div className="relative">
                  <KeyRound size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-orange-500 transition-colors" />
                  <input
                    {...resetForm.register('otp')}
                    type="text"
                    maxLength={6}
                    className="w-full h-14 pl-12 pr-5 bg-white/50 border border-gray-200/50 rounded-2xl text-center text-lg tracking-[0.5em] font-black transition-all focus:outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500/50"
                    placeholder="000000"
                  />
                </div>
                {resetForm.formState.errors.otp && (
                  <p className="mt-1.5 text-[10px] font-bold text-red-500 uppercase tracking-wider ml-1">{resetForm.formState.errors.otp.message}</p>
                )}
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div className="group">
                  <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 mb-2 ml-1">Mật khẩu mới</label>
                  <div className="relative">
                    <input
                      {...resetForm.register('newPassword')}
                      type={showNewPassword ? 'text' : 'password'}
                      className="w-full h-12 px-5 bg-white/50 border border-gray-200/50 rounded-2xl text-sm font-medium transition-all focus:outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500/50"
                      placeholder="Ít nhất 6 ký tự"
                    />
                    <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-orange-500">
                      {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {resetForm.formState.errors.newPassword && (
                    <p className="mt-1.5 text-[10px] font-bold text-red-500 uppercase tracking-wider ml-1">{resetForm.formState.errors.newPassword.message}</p>
                  )}
                </div>

                <div className="group">
                  <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 mb-2 ml-1">Xác nhận mật khẩu</label>
                  <div className="relative">
                    <input
                      {...resetForm.register('confirmPassword')}
                      type={showConfirmPassword ? 'text' : 'password'}
                      className="w-full h-12 px-5 bg-white/50 border border-gray-200/50 rounded-2xl text-sm font-medium transition-all focus:outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500/50"
                      placeholder="Nhập lại mật khẩu mới"
                    />
                    <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-orange-500">
                      {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {resetForm.formState.errors.confirmPassword && (
                    <p className="mt-1.5 text-[10px] font-bold text-red-500 uppercase tracking-wider ml-1">{resetForm.formState.errors.confirmPassword.message}</p>
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="group relative w-full h-14 bg-gradient-to-r from-orange-600 to-orange-400 text-white text-xs font-black uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-orange-500/20 hover:shadow-orange-500/30 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 disabled:opacity-50 overflow-hidden"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {isLoading ? <><Loader2 className="animate-spin" size={18} /> Đang xử lý...</> : 'Cập nhật mật khẩu'}
                </span>
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
              </button>

              <div className="flex items-center justify-between px-1">
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={isLoading}
                  className="text-[10px] font-black text-orange-600 hover:text-orange-700 uppercase tracking-widest disabled:opacity-50 transition-colors"
                >
                  Gửi lại mã OTP
                </button>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex items-center gap-1 text-[10px] font-black text-gray-400 hover:text-gray-600 uppercase tracking-widest transition-colors"
                >
                  <ArrowLeft size={14} /> Dùng email khác
                </button>
              </div>
            </form>
          )}

          {/* Step 3: Success */}
          {step === 3 && (
            <div className="text-center py-6 animate-in fade-in zoom-in duration-700">
              <div className="relative inline-flex items-center justify-center w-20 h-20 bg-green-50 rounded-[2rem] border border-green-100 mb-6 group">
                <div className="absolute inset-0 bg-green-100 rounded-[2rem] blur-xl opacity-50 group-hover:opacity-100 transition-opacity"></div>
                <CheckCircle className="text-green-600 relative z-10 animate-bounce" size={40} />
              </div>
              
              <h3 className="text-xl font-black text-gray-900 mb-3 tracking-tighter uppercase">
                THÀNH CÔNG RỒI!
              </h3>
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.2em] leading-relaxed mb-8">
                MẬT KHẨU CỦA BẠN ĐÃ ĐƯỢC CẬP NHẬT. <br /> HÃY TIẾP TỤC TRẢI NGHIỆM PAWVERSE.
              </p>
              
              <button
                onClick={() => navigate('/login')}
                className="group relative w-full h-14 bg-gradient-to-r from-green-600 to-green-500 text-white text-xs font-black uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-green-500/20 hover:shadow-green-500/30 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 overflow-hidden"
              >
                <span className="relative z-10">Đăng nhập ngay</span>
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
