import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import useAuthStore from '../../store/useAuthStore';
import useCartStore, { getCartTotalQuantity } from '../../store/useCartStore';
import toast from 'react-hot-toast';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { authService } from '../../api/authService';
import { cartService } from '../../api/cartService';

export default function OAuth2CallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const { setCartCount } = useCartStore();

  useEffect(() => {
    const handleOAuthCallback = async () => {
      const token = searchParams.get('token');
      const error = searchParams.get('error');

      if (error) {
        toast.error('Đăng nhập OAuth thất bại: ' + error);
        navigate('/login');
        return;
      }

      if (!token) {
        toast.error('Không nhận được token từ server');
        navigate('/login');
        return;
      }

      try {
        // Use the token as access token and fetch user info
        // Store token temporarily to make authenticated request
        localStorage.setItem('accessToken', token);
        
        // Fetch user profile with the token
        const userProfile = await authService.getCurrentUser();
        
        const user = {
          userId: userProfile.idUser,
          username: userProfile.username,
          email: userProfile.email,
          fullName: userProfile.fullName,
          role: userProfile.roleName,
        };

        // Set auth with the token (using access token as refresh token for now since OAuth doesn't provide refresh)
        setAuth(user, token, token);
        
        // Fetch cart count from backend to sync with database
        try {
          const cart = await cartService.getCart();
          setCartCount(getCartTotalQuantity(cart));
        } catch (error) {
          console.error('Failed to fetch cart:', error);
        }
        
        toast.success('Đăng nhập thành công!');
        
        // Role-based redirect
        if (user.role === 'ADMIN') {
          navigate('/admin');
        } else if (user.role === 'STAFF') {
          navigate('/staff');
        } else {
          navigate('/');
        }
      } catch (error) {
        console.error('OAuth callback error:', error);
        toast.error('Không thể lấy thông tin người dùng');
        localStorage.removeItem('accessToken');
        navigate('/login');
      }
    };

    handleOAuthCallback();
  }, [searchParams, navigate, setAuth]);

  return (
    <div className="min-h-screen bg-white relative flex items-center justify-center py-12 px-4 overflow-hidden">
      {/* Decorative Background Blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-5%] right-[-5%] w-[40vw] h-[40vw] bg-orange-100/30 rounded-full blur-[100px] opacity-40"></div>
        <div className="absolute bottom-[-5%] left-[-5%] w-[35vw] h-[35vw] bg-blue-50/40 rounded-full blur-[80px] opacity-30"></div>
      </div>

      <div className="max-w-md w-full relative z-10 text-center animate-in fade-in zoom-in duration-700">
        <div className="bg-white/70 backdrop-blur-2xl border border-white/50 shadow-2xl rounded-[2.5rem] p-12">
          <LoadingSpinner />
          <p className="mt-6 text-[11px] font-black text-gray-500 uppercase tracking-[0.3em]">
            Đang đồng bộ hóa <br /> <span className="text-orange-600">tài khoản của bạn...</span>
          </p>
        </div>
      </div>
    </div>
  );
}
