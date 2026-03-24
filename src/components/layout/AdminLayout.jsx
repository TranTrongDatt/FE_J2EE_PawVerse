import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users,
  Activity,
  LogOut,
  Home,
  ShieldCheck,
  User,
  Settings,
  Sparkles
} from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import useAuthStore from '../../store/useAuthStore';
import useCartStore from '../../store/useCartStore';

const menuItems = [
  {
    title: 'Dashboard',
    path: '/admin',
    icon: LayoutDashboard,
  },
  {
    title: 'Quản lý tài khoản',
    path: '/admin/users',
    icon: Users,
  },
  {
    title: 'Lịch sử hoạt động',
    path: '/admin/activity-logs',
    icon: Activity,
  },
];

export default function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, logout } = useAuthStore();
  const { resetCart } = useCartStore();

  const handleLogout = () => {
    resetCart();
    queryClient.clear();
    localStorage.removeItem('auth-storage');
    logout();
    navigate('/');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-gray-900 font-sans selection:bg-blue-100 selection:text-blue-900 overflow-x-hidden">
      {/* Decorative Background Glows */}
      <div className="fixed inset-0 pointer-events-none z-0 opacity-[0.02]" aria-hidden="true">
        <div className="absolute top-[-5%] right-[-5%] w-[35%] h-[35%] bg-blue-600 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-5%] left-[-5%] w-[35%] h-[35%] bg-orange-500 rounded-full blur-[120px]" />
      </div>

      <div className="flex relative z-10 h-screen overflow-hidden">
        {/* Sidebar Container - Rigid, No Scroll */}
        <aside className="w-72 shrink-0 p-4 h-full">
          <div className="h-full bg-white/80 backdrop-blur-3xl rounded-[2.5rem] border border-white shadow-[0_32px_64px_-16px_rgba(0,0,0,0.06)] flex flex-col overflow-hidden relative group/sidebar">
            
            {/* Logo Section */}
            <div className="p-8 pb-4 shrink-0">
              <Link to="/admin" className="flex items-center gap-4 group/logo outline-none focus-visible:ring-4 focus-visible:ring-blue-100 rounded-2xl p-1">
                <div className="w-12 h-12 bg-gray-950 rounded-2xl flex items-center justify-center text-white shadow-2xl group-hover/logo:rotate-12 transition-transform duration-500 shrink-0">
                  <ShieldCheck size={24} className="text-orange-500" aria-hidden="true" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.4em] leading-none mb-1.5 italic font-black">PAWVERSE</p>
                  <h2 className="text-xl font-black text-gray-950 uppercase tracking-tighter italic leading-none truncate font-black">ROOT ADMIN</h2>
                </div>
              </Link>
            </div>

            {/* Navigation Section - Rigid/Non-scrollable */}
            <nav className="flex-1 p-4 space-y-1 overflow-hidden">
              <div className="px-4 mb-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] italic flex items-center gap-2">
                <Settings size={10} className="text-blue-600" /> QUẢN TRỊ CẤP CAO
              </div>
              
              <ul className="space-y-2" role="list">
                {menuItems.map((item) => {
                  const active = isActive(item.path);
                  return (
                    <li key={item.path} role="listitem">
                      <Link
                        to={item.path}
                        aria-current={active ? 'page' : undefined}
                        className={`group relative flex items-center gap-4 p-4 rounded-[1.25rem] transition-all duration-300 outline-none focus-visible:ring-4 focus-visible:ring-blue-100 ${
                          active 
                            ? 'bg-gray-950 text-white shadow-xl shadow-gray-400/20' 
                            : 'text-gray-500 hover:bg-blue-50/50 hover:text-gray-950'
                        }`}
                      >
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all duration-300 ${
                          active ? 'bg-blue-600 text-white rotate-6' : 'bg-gray-50 text-gray-400 group-hover:bg-blue-100 group-hover:text-blue-600'
                        }`}>
                          <item.icon size={20} aria-hidden="true" />
                        </div>
                        
                        <div className="flex-1 overflow-hidden">
                          <p className={`text-[12px] font-black uppercase tracking-tight leading-none ${active ? 'text-white' : 'text-gray-950'}`}>
                            {item.title}
                          </p>
                        </div>

                        {active && (
                          <div className="absolute right-4 w-1.5 h-1.5 bg-blue-500 rounded-full shadow-[0_0_12px_rgba(37,99,235,0.6)]" />
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>

            {/* Admin Profile Section - Bottom Section */}
            <div className="p-4 shrink-0 bg-gray-50/50">
               <div className="bg-white/40 p-4 rounded-3xl border border-white shadow-inner">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="relative shrink-0">
                      <div className="w-12 h-12 bg-gray-950 rounded-2xl flex items-center justify-center p-0.5 shadow-xl ring-2 ring-white">
                        <div className="w-full h-full bg-blue-100 rounded-[0.8rem] flex items-center justify-center text-blue-600 font-black text-lg italic">
                          {(user?.hoTen || user?.fullName || 'A').charAt(0).toUpperCase()}
                        </div>
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-blue-600 border-2 border-white rounded-full shadow-sm" aria-label="Đang hoạt động" />
                    </div>
                    
                    <div className="min-w-0">
                      <p className="text-[13px] font-black text-gray-950 uppercase tracking-tighter truncate leading-none mb-1 cursor-default">
                        {user?.hoTen || user?.fullName || 'Root Admin'}
                      </p>
                      <span className="text-[9px] font-extrabold text-blue-600/70 uppercase tracking-widest italic flex items-center gap-1">
                        Hệ thống ROOT
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <Link 
                      to="/" 
                      className="flex items-center justify-center gap-2 py-3 rounded-2xl bg-white border border-gray-100 text-[10px] font-black text-gray-500 uppercase tracking-widest hover:bg-gray-950 hover:text-white hover:border-gray-950 transition-all active:scale-95 outline-none focus-visible:ring-4 focus-visible:ring-gray-100"
                    >
                      <Home size={14} aria-hidden="true" /> Home
                    </Link>
                    <button 
                       onClick={handleLogout}
                       aria-label="Đăng xuất khỏi root"
                       className="flex items-center justify-center gap-2 py-3 rounded-2xl bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white transition-all active:scale-95 outline-none focus-visible:ring-4 focus-visible:ring-rose-100"
                    >
                       <LogOut size={14} aria-hidden="true" /> Exit
                    </button>
                  </div>
               </div>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 h-full overflow-y-auto relative custom-scrollbar">
          <div className="p-8 lg:p-12">
            <Outlet />
          </div>
        </main>
      </div>

      <style jsx="true">{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e2e2e2;
          border-radius: 20px;
        }
        .custom-scrollbar:hover::-webkit-scrollbar-thumb {
          background: #d1d1d1;
        }
      `}</style>
    </div>
  );
}
