import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ShoppingCart, Heart, User, Menu, Shield, PawPrint, CalendarCheck, Bell, Check, ArrowRight, X } from 'lucide-react';
import { useQueryClient, useQuery, useMutation } from '@tanstack/react-query';
import useAuthStore from '../../store/useAuthStore';
import useCartStore from '../../store/useCartStore';
import SearchSuggestions from '../common/SearchSuggestions';
import { notificationService } from '../../api/notificationService';
import logo from '../../../Images/headerandfooter/Logo.png';
import hero2 from '../../assets/hero2.png';

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [showCat, setShowCat] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const notifRef = useRef(null);
  const menuScrollRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      // Threshold at 600px (Hero section bottom)
      if (window.scrollY > 600) {
        setShowCat(false);
      } else {
        setShowCat(true);
      }
    };

    if (location.pathname === '/') {
      window.addEventListener('scroll', handleScroll);
      // Initialize state on mount/transition
      handleScroll();
    } else {
      setShowCat(false);
    }

    return () => window.removeEventListener('scroll', handleScroll);
  }, [location.pathname]);

  const { user, isAuthenticated, logout } = useAuthStore();
  const { cartCount, resetCart } = useCartStore();

  // Notification queries (only when authenticated)
  const { data: unreadData } = useQuery({
    queryKey: ['notifications-unread-count'],
    queryFn: notificationService.getUnreadCount,
    enabled: isAuthenticated,
    refetchInterval: 30000, // Poll every 30s
  });

  const { data: notifData } = useQuery({
    queryKey: ['notifications-list'],
    queryFn: () => notificationService.getNotifications({ page: 0, size: 8 }),
    enabled: isAuthenticated && showNotifDropdown,
  });

  const markAllReadMutation = useMutation({
    mutationFn: notificationService.markAllAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-list'] });
    },
  });

  const unreadCount = unreadData?.count || 0;
  const notifications = notifData?.content || [];

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const formatNotifTime = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const now = new Date();
    const diff = now - d;
    if (diff < 60000) return 'Vừa xong';
    if (diff < 3600000) return `${Math.floor(diff / 60000)} phút trước`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} giờ trước`;
    return d.toLocaleDateString('vi-VN');
  };

  const handleLogout = () => {
    // Clear cart store
    resetCart();

    // Clear all React Query cache (profile, cart, orders, etc.)
    queryClient.clear();

    // Clear zustand persist storage completely
    localStorage.removeItem('auth-storage');

    // Call logout to clear auth state
    logout();

    navigate('/');
  };

  // Check user roles
  const isAdmin = user?.role === 'ADMIN';
  const isStaff = user?.role === 'STAFF';
  const dashboardLink = isAdmin ? '/admin' : isStaff ? '/staff' : null;
  const dashboardLabel = isAdmin ? 'Admin' : isStaff ? 'Staff' : '';

  return (
    <>
      <header className="fixed top-2 md:top-6 left-1/2 -translate-x-1/2 w-[98%] lg:w-[90%] max-w-7xl z-50">
        <div className="bg-white/95 backdrop-blur-lg border border-white/60 shadow-[0_12px_40px_rgba(0,0,0,0.12)] rounded-full px-4 md:px-12 py-1.5 md:py-3 transition-all duration-300 hover:shadow-primary-100/20">
          <div className="flex items-center justify-between h-10 md:h-16 lg:h-20">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2 group transition-all duration-300 lg:-ml-4 shrink-0">
              <img 
                src={logo} 
                alt="PawVerse Logo" 
                className="h-7 md:h-12 lg:h-16 w-auto group-hover:scale-105 transition-transform duration-300 drop-shadow-sm object-contain" 
                style={{ imageRendering: '-webkit-optimize-contrast' }}
              />
            </Link>

            {/* Navigation - Hidden on iPad Pro and below */}
            <nav className="hidden 2xl:flex items-center space-x-12 ml-6 lg:ml-12">
              <Link to="/" className="text-gray-900 hover:text-primary-600 transition-colors font-black text-base uppercase tracking-wider">
                Trang chủ
              </Link>
              <Link to="/products" className="text-gray-900 hover:text-primary-600 transition-colors font-black text-base uppercase tracking-wider">
                Sản phẩm
              </Link>
              <Link to="/services" className="text-gray-900 hover:text-primary-600 transition-colors font-black text-base uppercase tracking-wider">
                Dịch vụ
              </Link>
            </nav>

            {/* Sticky Hanging Cat (hero2) ONLY ON HOMEPAGE with Swallow Logic */}
            {location.pathname === '/' && (
              <div className={`absolute left-[45%] -translate-x-1/2 w-72 pointer-events-none hidden 2xl:block z-[60] transition-all duration-700 ease-in-out ${
                showCat ? 'top-20 opacity-100' : 'top-[-100px] opacity-0'
              }`}>
                 <img src={hero2} alt="Hanging Cat" className="w-full h-auto drop-shadow-2xl transition-all duration-700 hover:rotate-2" />
              </div>
            )}

            {/* Search with Suggestions - Now visible on Mobile Portrait too to fill the gap */}
            <div className="flex items-center flex-1 min-w-[100px] max-w-lg mx-2 sm:mx-4 lg:mx-10">
              <SearchSuggestions />
            </div>

            {/* Icons */}
            <div className="flex items-center space-x-2 sm:space-x-4 lg:space-x-8">
              {/* Dashboard Panel - Visible to Admin and Staff */}
              {isAuthenticated && dashboardLink && (
                <Link
                  to={dashboardLink}
                  className="relative text-gray-700 hover:text-primary-600 transition-colors group"
                  title={`Trang quản lý ${dashboardLabel}`}
                >
                  <div className="flex items-center space-x-1">
                    <Shield size={20} className={`sm:w-7 sm:h-7 ${isAdmin ? 'text-primary-600' : 'text-emerald-600'}`} />
                    <span className="hidden 2xl:inline text-sm font-black text-gray-900 ml-1">
                      {dashboardLabel}
                    </span>
                  </div>
                </Link>
              )}

              {/* Wishlist - Now visible on Mobile Portrait */}
              {isAuthenticated && (
                <Link to="/wishlist" className="relative text-gray-700 hover:text-primary-600 transition-colors block" title="Danh sách yêu thích">
                  <Heart size={20} className="sm:w-7 sm:h-7" />
                </Link>
              )}
              {/* Cart */}
              <Link to="/cart" className="relative text-gray-700 hover:text-primary-600 transition-colors" title="Giỏ hàng">
                <ShoppingCart size={20} className="sm:w-7 sm:h-7" />
                {cartCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 sm:-top-2 sm:-right-2 bg-primary-600 text-white text-[8px] sm:text-[10px] font-black rounded-full h-4 w-4 sm:h-6 sm:w-6 flex items-center justify-center border-2 border-white shadow-sm">
                    {cartCount}
                  </span>
                )}
              </Link>
              {/* User Menu - Visible on all screens to fill the header */}
              {isAuthenticated ? (
                <div className="relative group block">
                  <button className="flex items-center space-x-1 sm:space-x-3 text-gray-700 hover:text-primary-600 transition-colors">
                    <User size={20} className="sm:w-7 sm:h-7" />
                    <span className="hidden 2xl:inline font-black text-sm">{user?.fullName || user?.username}</span>
                  </button>
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                    {/* Dashboard Link in dropdown for Admin/Staff */}
                    {dashboardLink && (
                      <>
                        <Link to={dashboardLink} className={`flex items-center space-x-2 px-4 py-2 hover:bg-gray-50 transition-colors font-medium ${isAdmin ? 'text-primary-600' : 'text-emerald-600'}`}>
                          <Shield size={18} />
                          <span>Trang quản lý</span>
                        </Link>
                        <hr className="my-2" />
                      </>
                    )}
                    <Link to="/profile" className="block px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors">
                      Thông tin cá nhân
                    </Link>
                    <Link to="/orders" className="block px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors">
                      Đơn hàng của tôi
                    </Link>
                    <Link to="/bookings" className="px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors flex items-center gap-2">
                      <CalendarCheck size={16} />
                      Lịch sử đặt dịch vụ
                    </Link>
                    <Link to="/my-pets" className="px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors flex items-center gap-2">
                      <PawPrint size={16} />
                      Thú cưng của tôi
                    </Link>
                    <Link to="/wishlist" className="block px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors md:hidden">
                      Danh sách yêu thích
                    </Link>
                    <hr className="my-2" />
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 transition-colors"
                    >
                      Đăng xuất
                    </button>
                  </div>
                </div>
              ) : (
                <Link to="/login" className="flex items-center justify-center bg-primary-600 text-white rounded-full hover:bg-primary-700 transition-all duration-300 font-bold text-[10px] sm:text-sm px-3 sm:px-6 py-1.5 sm:py-2 block">
                  Đăng nhập
                </Link>
              )}
              {/* Notifications Bell */}
              {isAuthenticated && (
                <div className="relative" ref={notifRef}>
                  <button
                    onClick={() => setShowNotifDropdown(!showNotifDropdown)}
                    className="relative text-gray-700 hover:text-primary-600 transition-colors"
                    title="Thông báo"
                  >
                    <Bell size={20} className="sm:w-7 sm:h-7" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-black rounded-full h-6 w-6 flex items-center justify-center border-2 border-white shadow-sm">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </button>

                  {/* Notification Dropdown */}
                  {showNotifDropdown && (
                    <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden z-50">
                      <div className="flex items-center justify-between px-4 py-3 border-b bg-gray-50">
                        <h4 className="font-semibold text-sm text-gray-800">Thông báo</h4>
                        {unreadCount > 0 && (
                          <button
                            onClick={() => markAllReadMutation.mutate()}
                            className="text-xs text-primary-600 hover:text-primary-700 flex items-center gap-1"
                          >
                            <Check size={12} /> Đọc tất cả
                          </button>
                        )}
                      </div>
                      <div className="max-h-80 overflow-y-auto">
                        {notifications.length === 0 ? (
                          <div className="py-8 text-center text-gray-400 text-sm">
                            <Bell size={32} className="mx-auto mb-2 text-gray-300" />
                            Chưa có thông báo
                          </div>
                        ) : (
                          notifications.map((n) => (
                            <div
                              key={n.idNotification}
                              className={`px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition cursor-pointer ${!n.isRead ? 'bg-primary-50/50' : ''
                                }`}
                            >
                              <p className={`text-sm ${!n.isRead ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>
                                {n.subject}
                              </p>
                              <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.content}</p>
                              <p className="text-[10px] text-gray-400 mt-1">{formatNotifTime(n.createdAt)}</p>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Tablet/iPad Pro Menu Toggle */}
              <button 
                onClick={() => setIsMenuOpen(true)}
                className="2xl:hidden p-2 text-gray-700 hover:text-primary-600 transition-colors"
              >
                <Menu size={20} className="sm:w-7 sm:h-7" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Sidebar / Drawer */}
      <div className={`fixed inset-0 z-[100] transition-all duration-500 overflow-hidden ${isMenuOpen ? 'visible' : 'invisible'}`}>
        {/* Backdrop */}
        <div 
          className={`absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-500 ${isMenuOpen ? 'opacity-100' : 'opacity-0'}`}
          onClick={() => setIsMenuOpen(false)}
        />
        
        {/* Sidebar Content */}
        <div className={`absolute top-0 right-0 h-full w-[85%] max-w-sm bg-white shadow-2xl transition-transform duration-500 ease-out flex flex-col ${isMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}>
          {/* Header in Sidebar */}
          <div className="flex items-center justify-between px-8 py-6 border-b border-gray-100 bg-white">
            <Link to="/" onClick={() => setIsMenuOpen(false)} className="flex items-center">
               <img src={logo} alt="Logo" className="h-10 w-auto object-contain" />
            </Link>
            <button 
              onClick={() => setIsMenuOpen(false)}
              className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-400 hover:text-red-500 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto" ref={menuScrollRef}>
            {/* Mobile Search */}
            <div className="px-6 py-8 border-b border-gray-100">
               <SearchSuggestions />
            </div>

            {/* Mobile Navigation */}
            <nav className="p-6 space-y-2">
              <MobileNavLink to="/" label="Trang chủ" onClick={() => setIsMenuOpen(false)} />
              <MobileNavLink to="/products" label="Sản phẩm" onClick={() => setIsMenuOpen(false)} />
              <MobileNavLink to="/services" label="Dịch vụ" onClick={() => setIsMenuOpen(false)} />
            </nav>

            {/* User Section in Sidebar */}
            <div className="p-6 border-t border-gray-100 bg-gray-50/30">
              {isAuthenticated ? (
                <div className="space-y-4">
                  <div className="flex items-center space-x-4 mb-6">
                    <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center text-primary-600">
                       <User size={24} />
                    </div>
                    <div>
                      <p className="font-black text-gray-900 leading-tight">{user?.fullName || user?.username}</p>
                      <p className="text-xs text-gray-400 font-bold uppercase">{user?.role}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-2">
                    {dashboardLink && (
                      <Link to={dashboardLink} onClick={() => setIsMenuOpen(false)} className="flex items-center space-x-3 p-3 rounded-xl bg-primary-50 text-primary-700 font-black">
                        <Shield size={20} />
                        <span>Trang quản lý</span>
                      </Link>
                    )}
                    <SidebarLink to="/profile" icon={<User size={18} />} label="Hồ sơ cá nhân" onClick={() => setIsMenuOpen(false)} />
                    <SidebarLink to="/orders" icon={<ShoppingCart size={18} />} label="Đơn hàng" onClick={() => setIsMenuOpen(false)} />
                    <SidebarLink to="/bookings" icon={<CalendarCheck size={18} />} label="Lịch dịch vụ" onClick={() => setIsMenuOpen(false)} />
                    <SidebarLink to="/my-pets" icon={<PawPrint size={18} />} label="Thú cưng" onClick={() => setIsMenuOpen(false)} />
                    <button 
                      onClick={() => {
                        setIsMenuOpen(false);
                        handleLogout();
                      }}
                      className="flex items-center space-x-3 p-3 rounded-xl text-red-500 font-black hover:bg-red-50 transition-colors mt-4 w-full"
                    >
                      <X size={20} />
                      <span>Đăng xuất</span>
                    </button>
                  </div>
                </div>
              ) : (
                <Link 
                  to="/login" 
                  onClick={() => setIsMenuOpen(false)}
                  className="w-full py-4 bg-primary-600 text-white rounded-2xl font-black text-center block shadow-lg shadow-primary-500/30"
                >
                  ĐĂNG NHẬP NGAY
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function MobileNavLink({ to, label, onClick }) {
  return (
    <Link 
      to={to} 
      onClick={onClick}
      className="flex items-center justify-between p-4 rounded-2xl hover:bg-gray-50 text-gray-700 hover:text-primary-600 transition-all font-black text-lg uppercase tracking-widest"
    >
      <span>{label}</span>
      <ArrowRight size={20} className="opacity-0 group-hover:opacity-100 transition-opacity" />
    </Link>
  );
}

function SidebarLink({ to, icon, label, onClick }) {
  return (
    <Link 
      to={to} 
      onClick={onClick}
      className="flex items-center space-x-3 p-3 rounded-xl text-gray-600 hover:bg-gray-50 hover:text-primary-600 transition-all font-bold"
    >
      <span className="p-2 bg-white shadow-sm border border-gray-100 rounded-lg">{icon}</span>
      <span>{label}</span>
    </Link>
  );
}
