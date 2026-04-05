import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Loader2, Dog, Cat, PawPrint, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import ReCAPTCHA from 'react-google-recaptcha';
import { authService } from '../../api/authService';
import { cartService } from '../../api/cartService';
import useAuthStore from '../../store/useAuthStore';
import useCartStore, { getCartTotalQuantity } from '../../store/useCartStore';

const loginSchema = z.object({
  usernameOrEmail: z.string().min(1, 'Tên đăng nhập hoặc email không được để trống'),
  password: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự'),
});

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [captcha, setCaptcha] = useState(null); // { token, question }
  const [captchaAnswer, setCaptchaAnswer] = useState('');
  const [recaptchaToken, setRecaptchaToken] = useState(null);
  const recaptchaRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { setAuth } = useAuthStore();
  const { setCartCount } = useCartStore();

  const from = location.state?.from?.pathname || '/';

  useEffect(() => {
    const oauthError = searchParams.get('oauth_error');
    if (oauthError) {
      toast.error('Đăng nhập OAuth thất bại. Vui lòng thử lại hoặc kiểm tra kết nối mạng.');
    }
  }, [searchParams]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      const payload = { ...data, recaptchaToken };
      if (captcha) {
        payload.captchaToken = captcha.token;
        payload.captchaAnswer = captchaAnswer;
      }

      const response = await authService.login(payload);

      if (response.requiresCaptcha) {
        setCaptcha({ token: response.captchaToken, question: response.captchaQuestion });
        setCaptchaAnswer('');
        setIsLoading(false);
        return;
      }

      const user = {
        userId: response.userId,
        username: response.username,
        email: response.email,
        fullName: response.fullName,
        role: response.role,
      };
      setAuth(user, response.accessToken, response.refreshToken);
      setCaptcha(null);
      setCaptchaAnswer('');

      try {
        const cart = await cartService.getCart();
        setCartCount(getCartTotalQuantity(cart));
      } catch (error) {
        console.error('Failed to fetch cart:', error);
      }

      toast.success('Đăng nhập thành công!');

      if (user.role === 'ADMIN') {
        navigate('/admin', { replace: true });
      } else if (user.role === 'STAFF') {
        navigate('/staff', { replace: true });
      } else {
        navigate(from, { replace: true });
      }
    } catch (error) {
      const errData = error.response?.data;
      const newCaptcha = errData?.data;
      if (newCaptcha?.requiresCaptcha) {
        setCaptcha({ token: newCaptcha.captchaToken, question: newCaptcha.captchaQuestion });
        setCaptchaAnswer('');
      }
      toast.error(errData?.message || 'Đăng nhập thất bại');
    } finally {
      setIsLoading(false);
      recaptchaRef.current?.reset();
      setRecaptchaToken(null);
    }
  };

  const handleOAuthLogin = (provider) => {
    // Use relative URL - proxied by Vite to backend (port 8081)
    window.location.href = `/oauth2/authorization/${provider}`;
  };

  return (
    <div className="min-h-screen bg-white relative flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 overflow-hidden">
      {/* Decorative Background Blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] right-[-5%] w-[50vw] h-[50vw] bg-orange-100/40 rounded-full blur-[120px] opacity-50 animate-pulse"></div>
        <div className="absolute bottom-[-10%] left-[-5%] w-[45vw] h-[45vw] bg-blue-50/50 rounded-full blur-[100px] opacity-40 animate-pulse" style={{ animationDelay: '1s' }}></div>
        
        {/* Faint Decorative Icons */}
        <div className="absolute top-[15%] left-[8%] opacity-[0.04] rotate-12 scale-150">
          <Dog size={180} className="text-orange-900" />
        </div>
        <div className="absolute bottom-[20%] right-[10%] opacity-[0.04] -rotate-12 scale-150">
          <Cat size={200} className="text-orange-900" />
        </div>
        <div className="absolute top-[40%] right-[15%] opacity-[0.02] rotate-45">
          <PawPrint size={120} className="text-orange-900" />
        </div>
      </div>

      <div className="max-w-md w-full relative z-10 animate-in fade-in zoom-in duration-700">
        {/* Glass Card Container */}
        <div className="bg-white/70 backdrop-blur-2xl border border-white/50 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] rounded-[2.5rem] p-8 md:p-10">
          <div>
            <div className="flex justify-center mb-6">
              <div className="relative group">
                <div className="absolute -inset-4 bg-orange-100/50 rounded-full blur-xl group-hover:bg-orange-200/50 transition-colors duration-500"></div>
                <div className="relative bg-white shadow-xl shadow-orange-100 w-20 h-20 rounded-3xl flex items-center justify-center text-4xl transform -rotate-6 group-hover:rotate-0 transition-transform duration-500">
                  🐾
                </div>
              </div>
            </div>
            
            <h2 className="text-center text-3xl font-black text-gray-900 tracking-tighter uppercase mb-2">
              ĐĂNG NHẬP <span className="block text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-orange-400">
                PAWVERSE
              </span>
            </h2>
            <p className="text-center text-xs font-bold text-gray-500 uppercase tracking-widest leading-relaxed">
              CHÀO MỪNG TRỞ LẠI VỚI <br /> NGÔI NHÀ THÚ CƯNG 
            </p>
          </div>

          <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-5">
              <div className="group">
                <label htmlFor="usernameOrEmail" className="block text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 mb-2 ml-1">
                  Tên đăng nhập hoặc Email
                </label>
                <div className="relative">
                  <input
                    {...register('usernameOrEmail')}
                    type="text"
                    className="w-full h-14 px-5 bg-white/50 border border-gray-200/50 rounded-2xl text-sm font-medium transition-all focus:outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500/50 focus:bg-white"
                    placeholder="username hoặc email@example.com"
                  />
                </div>
                {errors.usernameOrEmail && (
                  <p className="mt-1.5 text-[11px] font-bold text-red-500 uppercase tracking-wider ml-1">{errors.usernameOrEmail.message}</p>
                )}
              </div>

              <div className="group">
                <label htmlFor="password" className="block text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 mb-2 ml-1">
                  Mật khẩu
                </label>
                <div className="relative">
                  <input
                    {...register('password')}
                    type={showPassword ? 'text' : 'password'}
                    className="w-full h-14 px-5 bg-white/50 border border-gray-200/50 rounded-2xl text-sm font-medium transition-all focus:outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500/50 focus:bg-white"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-gray-400 hover:text-orange-500 transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1.5 text-[11px] font-bold text-red-500 uppercase tracking-wider ml-1">{errors.password.message}</p>
                )}
              </div>
            </div>

            {captcha && (
              <div className="bg-orange-50/50 border border-orange-200/50 rounded-2xl p-4 animate-in fade-in slide-in-from-top-4 duration-500">
                <div className="flex items-center gap-2 mb-3">
                  <ShieldCheck size={16} className="text-orange-600" />
                  <p className="text-[10px] font-black uppercase tracking-widest text-orange-800">
                    Xác nhận bảo mật
                  </p>
                </div>
                <p className="text-xl font-black text-gray-900 mb-3 tracking-tighter">{captcha.question}</p>
                <input
                  type="number"
                  value={captchaAnswer}
                  onChange={(e) => setCaptchaAnswer(e.target.value)}
                  placeholder="Nhập kết quả..."
                  className="w-full h-12 px-4 bg-white/70 border border-orange-200/50 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-orange-500/30"
                  required
                />
              </div>
            )}

            <div className="flex items-center justify-between px-1">
              <div className="flex items-center group cursor-pointer">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded-lg transition-colors cursor-pointer"
                />
                <label htmlFor="remember-me" className="ml-2 block text-[11px] font-bold text-gray-600 uppercase tracking-wider cursor-pointer group-hover:text-gray-900 transition-colors">
                  Ghi nhớ tôi
                </label>
              </div>

              <div className="text-[11px] font-bold uppercase tracking-wider">
                <Link
                  to="/forgot-password"
                  className="text-orange-600 hover:text-orange-700 transition-colors"
                >
                  Quên mật khẩu?
                </Link>
              </div>
            </div>

            <div className="flex justify-center">
              <ReCAPTCHA
                ref={recaptchaRef}
                sitekey={import.meta.env.VITE_RECAPTCHA_SITE_KEY}
                onChange={(token) => setRecaptchaToken(token)}
                onExpired={() => setRecaptchaToken(null)}
                onErrored={() => setRecaptchaToken(null)}
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading || !recaptchaToken}
                className="group relative w-full h-14 bg-gradient-to-r from-orange-600 to-orange-400 text-white text-xs font-black uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-orange-500/20 hover:shadow-orange-500/30 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {isLoading ? (
                    <>
                      <Loader2 className="animate-spin" size={18} />
                      Đang xử lý...
                    </>
                  ) : (
                    'Đăng nhập ngay'
                  )}
                </span>
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
              </button>
            </div>

            <div className="mt-8 flex flex-col items-center gap-6">
              <div className="w-full flex items-center gap-4">
                <div className="flex-1 h-[1px] bg-gray-100"></div>
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">HOẶC TIẾP TỤC VỚI</span>
                <div className="flex-1 h-[1px] bg-gray-100"></div>
              </div>

              <div className="grid grid-cols-3 gap-3 w-full">
                {/* Google */}
                <button
                  type="button"
                  onClick={() => handleOAuthLogin('google')}
                  className="h-14 flex items-center justify-center border border-gray-100 rounded-2xl bg-white hover:bg-gray-50 hover:border-gray-200 hover:-translate-y-1 transition-all duration-300 shadow-sm"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#EA4335" d="M12.48 10.92v3.28h7.84c-.24 1.84-2.21 5.37-7.84 5.37-4.81 0-8.73-3.92-8.73-8.73s3.92-8.73 8.73-8.73c2.72 0 4.57 1.16 5.62 2.14l2.58-2.58C18.98 2.1 15.97 1 12.48 1 6.31 1 1.25 6.06 1.25 12.25s5.06 11.25 11.23 11.25c6.43 0 10.7-4.52 10.7-10.89 0-.73-.08-1.29-.17-1.69h-10.53z"/>
                  </svg>
                </button>
                
                {/* GitHub */}
                <button
                  type="button"
                  onClick={() => handleOAuthLogin('github')}
                  className="h-14 flex items-center justify-center border border-gray-100 rounded-2xl bg-white hover:bg-gray-50 hover:border-blue-200 hover:-translate-y-1 transition-all duration-300 shadow-sm"
                >
                  <svg className="w-5 h-5 text-[#181717]" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                  </svg>
                </button>

                {/* Discord */}
                <button
                  type="button"
                  onClick={() => handleOAuthLogin('discord')}
                  className="h-14 flex items-center justify-center border border-gray-100 rounded-2xl bg-white hover:bg-gray-50 hover:border-indigo-200 hover:-translate-y-1 transition-all duration-300 shadow-sm"
                >
                  <svg className="w-5 h-5 text-[#5865F2]" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z"/>
                  </svg>
                </button>
              </div>
            </div>
          </form>

          <p className="mt-10 text-center text-[11px] font-bold text-gray-500 uppercase tracking-widest">
            BẠN MỚI GHÉ THĂM?{' '}
            <Link to="/register" className="text-orange-600 hover:text-orange-700 transition-colors border-b-2 border-orange-200 hover:border-orange-500 pb-0.5">
              TẠO TÀI KHOẢN NGAY
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
