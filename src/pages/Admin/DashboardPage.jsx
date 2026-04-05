import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Users, UserCheck, UserX, ShieldCheck, Shield, Clock, Sparkles, TrendingUp, Activity, LayoutGrid, ArrowRight, Crown, Zap, Target } from 'lucide-react';
import { adminService } from '../../api/adminService';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const StatCard = ({ title, value, icon: Icon, color, bgColor }) => (
  <div className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] border border-white p-7 shadow-sm hover:shadow-xl transition-all group overflow-hidden relative">
    <div className={`absolute -right-4 -bottom-4 ${color} opacity-5 group-hover:scale-110 group-hover:rotate-12 transition-all duration-700`}>
       <Icon size={120} />
    </div>
    <div className="flex flex-col gap-6 relative z-10 font-black italic">
      <div className={`w-14 h-14 ${bgColor} rounded-[1.5rem] flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform duration-500`}>
        <Icon className={color} size={28} />
      </div>
      <div>
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-1 italic">{title}</p>
        <div className="flex items-center gap-2">
           <p className="text-4xl font-black text-gray-950 uppercase tracking-tighter italic leading-none">{value}</p>
           <TrendingUp size={16} className="text-emerald-500 animate-pulse" />
        </div>
        {subtitle && <p className="text-[10px] font-bold text-gray-400 mt-3 italic uppercase tracking-tighter opacity-60">{subtitle}</p>}
      </div>
    </div>
  </div>
);

export default function DashboardPage() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin-dashboard-stats'],
    queryFn: adminService.getDashboardStats,
  });

  const { data: usersData } = useQuery({
    queryKey: ['admin-users-overview'],
    queryFn: () => adminService.getAllUsers({ page: 0, size: 50 }),
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-48 gap-4 font-black italic uppercase">
         <div className="animate-spin rounded-full h-14 w-14 border-4 border-gray-100 border-t-gray-900" />
         <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] animate-pulse">Initializing Command Center...</p>
      </div>
    );
  }

  const userList = usersData?.content || [];
  const totalUsers = stats?.totalUsers || userList.length || 0;
  const lockedUsers = userList.filter(u => u.locked).length;
  const adminCount = userList.filter(u => u.roleName === 'ADMIN').length;
  const staffCount = userList.filter(u => u.roleName === 'STAFF').length;
  const customerCount = userList.filter(u => u.roleName === 'USER').length;

  return (
    <div className="space-y-10 animate-in fade-in duration-700 font-black italic uppercase">
      {/* Premium Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 font-black italic">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-900 shadow-sm border border-gray-200">
               <Activity size={16} />
            </div>
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.4em] italic leading-none">Hệ thống Điều hành Tổng thể</span>
          </div>
          <h1 className="text-5xl font-black text-gray-950 uppercase tracking-tighter italic leading-none">
            PawVerse <span className="text-gray-400 font-black not-italic opacity-30">Admin</span> <span className="text-indigo-600 font-black">OS</span>
          </h1>
          <p className="text-gray-400 mt-4 font-bold text-sm flex items-center gap-2 uppercase tracking-tight italic font-black">
            <Target size={14} className="text-indigo-400 font-black italic" />
            Trạng thái máy chủ: <span className="text-emerald-500 font-black border-b border-emerald-100 italic">LIVE & STABLE</span>
          </p>
        </div>

        <div className="flex items-center gap-4 bg-white/60 backdrop-blur-md p-2 rounded-[2rem] border border-white shadow-sm font-black italic">
           <div className="flex -space-x-3 italic uppercase font-black">
              {userList.slice(0, 4).map((u, i) => (
                <div key={i} className="w-10 h-10 rounded-full border-4 border-white bg-gray-100 flex items-center justify-center text-[10px] font-black italic">
                   {u.avatar ? <img src={u.avatar} className="w-full h-full rounded-full object-cover" /> : u.fullName?.charAt(0)}
                </div>
              ))}
           </div>
           <div className="pr-4 italic font-black uppercase">
              <p className="text-[10px] font-black text-gray-950 italic">+{totalUsers} Operators</p>
              <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest italic leading-none">Global Network</p>
           </div>
        </div>
      </div>

      {/* Grid Stats PRO MAX */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Tổng tài khoản" value={totalUsers} icon={Users} color="text-indigo-600" bgColor="bg-indigo-50" subtitle="Tất cả định danh trong hệ thống" />
        <StatCard title="Quản trị viên" value={adminCount} icon={Crown} color="text-purple-600" bgColor="bg-purple-50" subtitle="Đặc quyền điều khiển luồng" />
        <StatCard title="Nhân viên vận hành" value={staffCount} icon={ShieldCheck} color="text-blue-600" bgColor="bg-blue-50" subtitle="Khối lượng nhân sự quản lý" />
        <StatCard title="Danh sách đen" value={lockedUsers} icon={UserX} color="text-rose-600" bgColor="bg-rose-50" subtitle="Đối tượng bị đình chỉ quyền lợi" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 font-black italic uppercase">
        {/* Core Distribution PRO MAX */}
        <div className="bg-white/40 backdrop-blur-xl rounded-[3rem] border border-white p-10 shadow-sm">
          <div className="flex items-center gap-3 mb-10 font-black italic uppercase">
             <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 italic">
                <LayoutGrid size={20} />
             </div>
             <h2 className="text-2xl font-black text-gray-950 uppercase tracking-tighter italic">Cơ cấu <span className="text-indigo-600">Quyền hạn</span></h2>
          </div>
          
          <div className="space-y-10">
            {[
              { label: 'Cư dân hệ thống (USER)', count: customerCount, total: totalUsers, color: 'bg-indigo-600', shadow: 'shadow-indigo-100', icon: Users },
              { label: 'Điều hành viên (STAFF)', count: staffCount, total: totalUsers, color: 'bg-blue-600', shadow: 'shadow-blue-100', icon: Shield },
              { label: 'Kiểm soát viên (ADMIN)', count: adminCount, total: totalUsers, color: 'bg-purple-600', shadow: 'shadow-purple-100', icon: Crown },
            ].map((role) => {
              const percentage = role.total > 0 ? (role.count / role.total) * 100 : 0;
              return (
                <div key={role.label} className="group italic uppercase font-black uppercase">
                  <div className="flex items-center justify-between mb-4 font-black italic uppercase italic font-black uppercase">
                    <div className="flex items-center gap-3 italic font-black uppercase">
                       <role.icon size={16} className="text-gray-400 group-hover:text-gray-900 transition-colors italic font-black uppercase" />
                       <span className="text-[11px] font-black text-gray-950 tracking-widest italic">{role.label}</span>
                    </div>
                    <span className="text-[11px] font-black text-gray-400 italic italic font-black uppercase italic font-black uppercase"><span className="text-gray-950 italic">{role.count}</span> PHIÊN</span>
                  </div>
                  <div className="relative h-2.5 bg-gray-100 rounded-full overflow-hidden italic font-black uppercase italic font-black uppercase">
                    <div
                      className={`${role.color} h-full rounded-full transition-all duration-1000 ${role.shadow} shadow-[0_0_15px_rgba(0,0,0,0.05)]`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Identities PRO MAX */}
        <div className="bg-white/40 backdrop-blur-xl rounded-[3rem] border border-white p-10 shadow-sm font-black italic uppercase italic">
          <div className="flex items-center justify-between mb-10 font-black italic uppercase italic">
             <div className="flex items-center gap-3 italic font-black uppercase italic font-black uppercase">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 italic font-black uppercase italic font-black uppercase">
                   <Zap size={20} className="animate-pulse font-black italic uppercase italic font-black uppercase" />
                </div>
                <h2 className="text-2xl font-black text-gray-950 uppercase tracking-tighter italic">Thực thể <span className="text-emerald-600">Mới</span></h2>
             </div>
             <Link to="/admin/users" className="group flex items-center gap-2 text-[10px] font-black text-gray-400 hover:text-gray-950 transition-all uppercase tracking-widest italic">
                Metadata Hub <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
             </Link>
          </div>

          <div className="space-y-4 font-black italic uppercase">
            {userList.slice(0, 5).map((u) => (
              <div key={u.idUser} className="group flex items-center justify-between p-4 bg-white/50 hover:bg-white hover:shadow-xl hover:shadow-gray-100 rounded-[2rem] border border-transparent hover:border-white transition-all duration-500 font-black italic">
                <div className="flex items-center gap-4 italic font-black uppercase italic">
                  <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-sm font-black text-gray-900 border border-gray-100 group-hover:rotate-3 group-hover:scale-110 transition-all duration-500 shadow-sm overflow-hidden font-black">
                    {u.avatar ? <img src={u.avatar} className="w-full h-full object-cover font-black" /> : u.fullName?.charAt(0) || '?'}
                  </div>
                  <div className="min-w-0 font-black">
                    <p className="font-black text-[13px] text-gray-950 uppercase tracking-tight italic">{u.fullName || u.username}</p>
                    <p className="text-[10px] font-bold text-gray-400 lowercase italic truncate max-w-[140px] font-black italic">{u.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 font-black italic uppercase">
                  <span className={`text-[8px] px-2.5 py-1 rounded-xl font-black uppercase tracking-widest italic border ${
                    u.roleName === 'ADMIN' ? 'bg-purple-50 text-purple-600 border-purple-100' :
                    u.roleName === 'STAFF' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                    'bg-indigo-50 text-indigo-600 border-indigo-100 font-black italic'
                  }`}>
                    {u.roleName}
                  </span>
                  {u.locked && <Lock size={12} className="text-rose-500 font-black italic uppercase italic font-black uppercase" />}
                </div>
              </div>
            ))}
            {userList.length === 0 && (
              <div className="py-20 text-center opacity-30 italic font-black uppercase italic">
                 <p className="text-[11px] font-black uppercase tracking-widest italic font-black uppercase italic">Waiting for incoming signals...</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Global Status Unit */}
      <div className="bg-gray-950 rounded-[3.5rem] p-12 text-white overflow-hidden relative font-black italic">
         <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-indigo-500/10 to-transparent pointer-events-none font-black italic uppercase font-black italic uppercase" />
         <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-indigo-600 blur-[120px] opacity-20 pointer-events-none font-black italic uppercase font-black italic uppercase" />
         
         <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-12 font-black italic uppercase">
            <div className="space-y-4 font-black italic uppercase font-black uppercase italic">
               <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-emerald-400 border border-white/10 font-black italic uppercase italic">
                  <ShieldCheck size={28} className="font-black italic uppercase italic" />
               </div>
               <div>
                  <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] mb-2 italic font-black uppercase italic font-black uppercase">Protection Layer</p>
                  <h4 className="text-lg font-black uppercase tracking-tight italic font-black uppercase italic font-black uppercase">Cyber Security active</h4>
                  <p className="text-xs font-medium text-gray-500 mt-2 italic font-black uppercase italic font-black uppercase">AES-256 Protocol encryption enabled for all identities</p>
               </div>
            </div>

            <div className="space-y-4 font-black italic uppercase font-black uppercase italic font-black uppercase italic">
               <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-blue-400 border border-white/10 font-black italic uppercase italic font-black uppercase italic">
                  <Users size={28} className="font-black italic uppercase italic font-black uppercase italic" />
               </div>
               <div>
                  <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] mb-2 italic font-black uppercase italic font-black uppercase italic">Population Hub</p>
                  <h4 className="text-lg font-black uppercase tracking-tight italic font-black uppercase italic font-black uppercase italic">{customerCount} Citizens ready</h4>
                  <p className="text-xs font-medium text-gray-500 mt-2 italic font-black uppercase italic font-black uppercase italic">Total digital resident footprint verified</p>
               </div>
            </div>

            <div className="space-y-4 font-black italic uppercase font-black uppercase italic font-black uppercase italic font-black uppercase italic">
               <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-rose-400 border border-white/10 font-black italic uppercase italic font-black uppercase italic font-black uppercase italic">
                  <UserX size={28} className="font-black italic uppercase italic font-black uppercase italic font-black uppercase italic" />
               </div>
               <div>
                  <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] mb-2 italic font-black uppercase italic font-black uppercase italic font-black uppercase italic font-black uppercase italic">Blacklist Protocol</p>
                  <h4 className="text-lg font-black uppercase tracking-tight italic font-black uppercase italic font-black uppercase">{lockedUsers} Entities isolated</h4>
                  <p className="text-xs font-medium text-gray-500 mt-2 italic font-black uppercase italic font-black uppercase italic font-black uppercase italic">Active risk mitigation in segment black-zone</p>
               </div>
            </div>
         </div>
      </div>

      <style jsx="true">{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-in {
          animation-fill-mode: forwards;
        }
        .fade-in {
          animation-name: fade-in;
        }
      `}</style>
    </div>
  );
}
