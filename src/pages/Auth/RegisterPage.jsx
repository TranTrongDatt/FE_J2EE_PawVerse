import { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Loader2, Dog, Cat, PawPrint, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import ReCAPTCHA from 'react-google-recaptcha';
import { authService } from '../../api/authService';
import { getPasswordStrength } from '../../utils/validators';

const registerSchema = z.object({
  username: z.string().min(3, 'Tên đăng nhập phải có ít nhất 3 ký tự')
    .regex(/^[a-zA-Z0-9_]+$/, 'Tên đăng nhập chỉ chứa chữ cái, số và dấu gạch dưới'),
  fullName: z.string().min(2, 'Họ tên phải có ít nhất 2 ký tự'),
  email: z.string().email('Email không hợp lệ'),
  soDienThoai: z.string().regex(/^(0|\+84)[3|5|7|8|9][0-9]{8}$/, 'Số điện thoại không hợp lệ'),
  password: z.string().min(8, 'Mật khẩu phải có ít nhất 8 ký tự')
    .regex(/[A-Z]/, 'Phải có ít nhất 1 chữ hoa')
    .regex(/[a-z]/, 'Phải có ít nhất 1 chữ thường')
    .regex(/[0-9]/, 'Phải có ít nhất 1 chữ số'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Mật khẩu xác nhận không khớp',
  path: ['confirmPassword'],
});

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [recaptchaToken, setRecaptchaToken] = useState(null);
  const recaptchaRef = useRef(null);
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(registerSchema),
  });

  const password = watch('password', '');
  const passwordStrength = getPasswordStrength(password);

  const onSubmit = async (data) => {
    if (!recaptchaToken) {
      toast.error('Vui lòng xác thực reCAPTCHA');
      return;
    }
    setIsLoading(true);
    try {
      await authService.register({ ...data, recaptchaToken });
      toast.success('Đăng ký thành công! Vui lòng đăng nhập.');
      navigate('/login');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Đăng ký thất bại');
    } finally {
      setIsLoading(false);
      recaptchaRef.current?.reset();
      setRecaptchaToken(null);
    }
  };

  return (
    <div className="min-h-screen bg-white relative flex items-center justify-center py-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
      {/* Decorative Background Blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] left-[-5%] w-[50vw] h-[50vw] bg-blue-100/30 rounded-full blur-[120px] opacity-40 animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-5%] w-[45vw] h-[45vw] bg-orange-100/30 rounded-full blur-[100px] opacity-50 animate-pulse" style={{ animationDelay: '1.5s' }}></div>
        
        {/* Faint Decorative Icons */}
        <div className="absolute top-[10%] right-[10%] opacity-[0.03] -rotate-12 scale-150">
          <Dog size={220} className="text-orange-900" />
        </div>
        <div className="absolute bottom-[10%] left-[8%] opacity-[0.03] rotate-12 scale-150">
          <Cat size={240} className="text-orange-900" />
        </div>
      </div>

      <div className="max-w-xl w-full relative z-10 animate-in fade-in zoom-in duration-700">
        {/* Glass Card Container */}
        <div className="bg-white/70 backdrop-blur-2xl border border-white/50 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] rounded-[3rem] p-8 md:p-12">
          <div>
            <div className="flex justify-center mb-6">
              <div className="relative group">
                <div className="absolute -inset-4 bg-orange-100/50 rounded-full blur-xl group-hover:bg-orange-200/50 transition-colors duration-500"></div>
                <div className="relative bg-white shadow-xl shadow-orange-100 w-20 h-20 rounded-3xl flex items-center justify-center text-4xl transform rotate-6 group-hover:rotate-0 transition-transform duration-500">
                  🐕
                </div>
              </div>
            </div>
            
            <h2 className="text-center text-3xl font-black text-gray-900 tracking-tighter uppercase mb-2">
              THAM GIA <span className="block text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-orange-400">
                PAWVERSE
              </span>
            </h2>
            <p className="text-center text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-8">
              KHỞI ĐẦU HÀNH TRÌNH HẠNH PHÚC CỦA THÚ CƯNG
            </p>
          </div>

          <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="group">
                <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 mb-2 ml-1">Tên đăng nhập</label>
                <input
                  {...register('username')}
                  type="text"
                  className="w-full h-12 px-5 bg-white/50 border border-gray-200/50 rounded-2xl text-sm font-medium transition-all focus:outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500/50"
                  placeholder="pawverse_user"
                />
                {errors.username && <p className="mt-1 text-[10px] font-bold text-red-500 uppercase tracking-wider ml-1">{errors.username.message}</p>}
              </div>

              <div className="group">
                <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 mb-2 ml-1">Họ và tên</label>
                <input
                  {...register('fullName')}
                  type="text"
                  className="w-full h-12 px-5 bg-white/50 border border-gray-200/50 rounded-2xl text-sm font-medium transition-all focus:outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500/50"
                  placeholder="Nguyễn Văn A"
                />
                {errors.fullName && <p className="mt-1 text-[10px] font-bold text-red-500 uppercase tracking-wider ml-1">{errors.fullName.message}</p>}
              </div>

              <div className="group">
                <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 mb-2 ml-1">Email</label>
                <input
                  {...register('email')}
                  type="email"
                  className="w-full h-12 px-5 bg-white/50 border border-gray-200/50 rounded-2xl text-sm font-medium transition-all focus:outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500/50"
                  placeholder="contact@pawverse.vn"
                />
                {errors.email && <p className="mt-1 text-[10px] font-bold text-red-500 uppercase tracking-wider ml-1">{errors.email.message}</p>}
              </div>

              <div className="group">
                <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 mb-2 ml-1">Số điện thoại</label>
                <input
                  {...register('soDienThoai')}
                  type="tel"
                  className="w-full h-12 px-5 bg-white/50 border border-gray-200/50 rounded-2xl text-sm font-medium transition-all focus:outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500/50"
                  placeholder="091 ••• ••••"
                />
                {errors.soDienThoai && <p className="mt-1 text-[10px] font-bold text-red-500 uppercase tracking-wider ml-1">{errors.soDienThoai.message}</p>}
              </div>

              <div className="group">
                <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 mb-2 ml-1">Mật khẩu</label>
                <div className="relative">
                  <input
                    {...register('password')}
                    type={showPassword ? 'text' : 'password'}
                    className="w-full h-12 px-5 bg-white/50 border border-gray-200/50 rounded-2xl text-sm font-medium transition-all focus:outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500/50"
                    placeholder="••••••••"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-orange-500">
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {password && (
                  <div className="mt-2 px-1">
                    <div className="h-1 w-full bg-gray-100 rounded-full overflow-hidden">
                      <div className={`h-full ${passwordStrength.color} transition-all duration-500`} style={{ width: `${(passwordStrength.level === 'weak' ? 33 : passwordStrength.level === 'medium' ? 66 : 100)}%` }} />
                    </div>
                  </div>
                )}
                {errors.password && <p className="mt-1 text-[10px] font-bold text-red-500 uppercase tracking-wider ml-1">{errors.password.message}</p>}
              </div>

              <div className="group">
                <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 mb-2 ml-1">Xác nhận mật khẩu</label>
                <div className="relative">
                  <input
                    {...register('confirmPassword')}
                    type={showConfirmPassword ? 'text' : 'password'}
                    className="w-full h-12 px-5 bg-white/50 border border-gray-200/50 rounded-2xl text-sm font-medium transition-all focus:outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500/50"
                    placeholder="••••••••"
                  />
                  <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-orange-500">
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.confirmPassword && <p className="mt-1 text-[10px] font-bold text-red-500 uppercase tracking-wider ml-1">{errors.confirmPassword.message}</p>}
              </div>
            </div>

            <div className="pt-4 flex flex-col gap-6">
              {/* reCAPTCHA */}
              <div className="flex justify-center">
                <ReCAPTCHA
                  ref={recaptchaRef}
                  sitekey={import.meta.env.VITE_RECAPTCHA_SITE_KEY}
                  onChange={(token) => setRecaptchaToken(token)}
                  onExpired={() => setRecaptchaToken(null)}
                  onErrored={() => setRecaptchaToken(null)}
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="group relative w-full h-14 bg-gradient-to-r from-orange-600 to-orange-400 text-white text-xs font-black uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-orange-500/20 hover:shadow-orange-500/30 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 disabled:opacity-50 overflow-hidden"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {isLoading ? <><Loader2 className="animate-spin" size={18} /> Đang tạo tài khoản...</> : 'Bắt đầu ngay'}
                </span>
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
              </button>

              <div className="flex flex-col items-center gap-4">
                <p className="text-[10px] font-bold text-gray-400 text-center uppercase tracking-widest leading-relaxed max-w-xs">
                  BẰNG VIỆC ĐĂNG KÝ, BẠN ĐỒNG Ý VỚI <Link to="/terms" className="text-orange-600 hover:text-orange-700 underline underline-offset-4">ĐIỀU KHOẢN</Link> VÀ <Link to="/privacy" className="text-orange-600 hover:text-orange-700 underline underline-offset-4">CHÍNH SÁCH</Link> CỦA CHÚNG TÔI
                </p>

                <div className="h-8 w-[1px] bg-gray-100"></div>

                <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">
                  ĐÃ CÓ TÀI KHOẢN?{' '}
                  <Link to="/login" className="text-orange-600 hover:text-orange-700 border-b-2 border-orange-200 hover:border-orange-500 pb-0.5 transition-all">
                    ĐĂNG NHẬP
                  </Link>
                </p>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
