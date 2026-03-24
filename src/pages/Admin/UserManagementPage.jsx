import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Search, Shield, ShieldCheck, UserX, UserCheck, Users, Lock, Unlock,
  Eye, X, Clock, AlertTriangle, Crown, ChevronLeft, ChevronRight, ChevronDown, Sparkles, ArrowRight, Zap, Target,
  Mail, Phone, Calendar, MapPin, User
} from 'lucide-react';
import { adminService } from '../../api/adminService';
import { formatDate } from '../../utils/formatters';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';

const ROLE_TABS = [
  { key: '', label: 'Tất cả', icon: Users },
  { key: 'ADMIN', label: 'Admin', icon: Crown },
  { key: 'STAFF', label: 'Staff', icon: ShieldCheck },
  { key: 'USER', label: 'Khách hàng', icon: Users },
];

const ROLE_BADGE = {
  ADMIN: { bg: 'bg-indigo-50', border: 'border-indigo-100', text: 'text-indigo-600', label: 'Admin' },
  STAFF: { bg: 'bg-blue-50', border: 'border-blue-100', text: 'text-blue-600', label: 'Staff' },
  USER: { bg: 'bg-gray-50', border: 'border-gray-100', text: 'text-gray-600', label: 'User' },
};

const LOCK_OPTIONS = [
  { hours: 1, label: '1 giờ' },
  { hours: 6, label: '6 giờ' },
  { hours: 24, label: '24 giờ' },
  { hours: 72, label: '3 ngày' },
  { hours: 168, label: '7 ngày' },
  { hours: 999, label: 'Vĩnh viễn' },
];

// Custom PRO MAX Confirm Modal
function ConfirmModal({ isOpen, onClose, onConfirm, title, message, type = 'danger' }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gray-950/40 backdrop-blur-sm animate-in fade-in duration-300" onClick={onClose} />
      <div className="relative bg-white/95 backdrop-blur-2xl rounded-[2.5rem] border border-white shadow-[0_32px_64px_-16px_rgba(0,0,0,0.2)] w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-300">
        <div className={`h-2 w-full ${type === 'danger' ? 'bg-rose-500' : 'bg-orange-500'}`} />
        <div className="p-8 text-center">
          <div className={`w-20 h-20 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-xl ${type === 'danger' ? 'bg-rose-50 text-rose-500 shadow-rose-100' : 'bg-orange-50 text-orange-500 shadow-orange-100'}`}>
            {type === 'danger' ? <UserX size={36} /> : <Zap size={36} className="animate-pulse" />}
          </div>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.4em] mb-2 italic">Hệ thống PawVerse</p>
          <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tighter leading-tight mb-4">{title}</h3>
          <div className="bg-gray-50/80 rounded-2xl p-4 mb-8 border border-gray-100 text-[11px] font-bold text-gray-600 italic leading-relaxed">
            {message}
          </div>
          <div className="grid grid-cols-2 gap-3">
             <button onClick={onClose} className="py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-gray-600 hover:bg-gray-50 focus-visible:ring-4 focus-visible:ring-gray-100 outline-none transition-all font-black">Hủy bỏ</button>
             <button onClick={() => { onConfirm(); onClose(); }} className={`py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white shadow-xl focus-visible:ring-4 ${type === 'danger' ? 'bg-rose-600 focus-visible:ring-rose-200 hover:bg-rose-700' : 'bg-gray-950 focus-visible:ring-gray-200 hover:bg-orange-600'} outline-none transition-all active:scale-95 shadow-xl`}>Xác nhận</button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ====== STAT CARD ====== */
const StatCard = ({ title, value, icon: Icon, color, bgColor }) => (
  <div className="bg-white/80 backdrop-blur-xl rounded-[2rem] border border-white p-5 shadow-sm hover:shadow-md transition-all group overflow-hidden relative">
    <div className={`absolute -right-2 -bottom-2 ${color} opacity-5 group-hover:scale-110 transition-transform duration-500`}>
       <Icon size={80} />
    </div>
    <div className="flex items-center gap-4 relative z-10">
      <div className={`w-12 h-12 ${bgColor} rounded-2xl flex items-center justify-center shadow-inner`}>
        <Icon className={color} size={22} />
      </div>
      <div>
        <p className="text-2xl font-black text-gray-950 italic font-variant-numeric: tabular-nums tracking-tighter">{value ?? 0}</p>
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest italic">{title}</p>
      </div>
    </div>
  </div>
);

/* ====== LOCK MODAL PRO MAX ====== */
function LockModal({ user, onClose, onConfirm, isPending }) {
  const [hours, setHours] = useState(999);
  return (
    <div className="fixed inset-0 z-[1001] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gray-950/60 backdrop-blur-sm animate-in fade-in duration-500" onClick={onClose} />
      <div className="relative bg-white rounded-[3rem] border border-white shadow-[0_40px_120px_-20px_rgba(0,0,0,0.3)] w-full max-w-md overflow-hidden flex flex-col animate-in zoom-in-95 duration-500">
        <div className="px-8 py-7 bg-white border-b border-gray-100 shrink-0">
          <div className="flex items-center justify-between">
            <div>
               <div className="flex items-center gap-2 mb-1">
                  <Lock size={12} className="text-rose-500" />
                  <span className="text-[8px] font-black text-gray-400 uppercase tracking-[0.3em] italic leading-none">Trung tâm Bảo mật</span>
               </div>
               <h2 className="text-2xl font-black text-gray-950 uppercase tracking-tighter italic leading-none">
                 Khóa <span className="text-rose-600 font-black not-italic">Tài khoản</span>
               </h2>
            </div>
            <button onClick={onClose} className="w-10 h-10 flex items-center justify-center bg-gray-50 text-gray-400 hover:bg-gray-950 hover:text-white focus-visible:ring-4 focus-visible:ring-gray-200 outline-none rounded-xl transition-all duration-300 active:scale-90"><X size={18} /></button>
          </div>
        </div>

        <div className="px-8 py-6 space-y-6">
          <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100">
             <div className="w-12 h-12 bg-white rounded-full border border-gray-100 flex items-center justify-center">
                {user.avatar ? (
                  <img src={user.avatar} className="w-full h-full rounded-full object-cover" width={48} height={48} alt="" />
                ) : <Users size={20} className="text-gray-300" />}
             </div>
             <div className="min-w-0">
                <p className="text-sm font-black text-gray-900 truncate uppercase italic">{user.fullName}</p>
                <p className="text-[10px] font-bold text-gray-400 truncate tracking-tight uppercase italic">{user.email}</p>
             </div>
          </div>

          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest italic mb-3 px-1">Thời hạn đình chỉ quyền lợi</label>
            <div className="grid grid-cols-3 gap-2 font-black italic">
              {LOCK_OPTIONS.map((opt) => (
                <button
                  key={opt.hours}
                  onClick={() => setHours(opt.hours)}
                  className={`px-3 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 border-2 ${
                    hours === opt.hours
                      ? 'bg-rose-50 border-rose-500 text-rose-700 shadow-inner'
                      : 'bg-white border-gray-50 text-gray-400 hover:bg-gray-50 hover:border-gray-100'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="px-8 py-6 bg-gray-50 border-t border-gray-100 flex items-center gap-3">
          <button
            onClick={() => onConfirm(user.idUser, hours)}
            disabled={isPending}
            className="flex-1 py-4 bg-rose-600 text-white rounded-[1.5rem] text-[11px] font-black uppercase tracking-[0.1em] italic hover:bg-rose-700 focus-visible:ring-4 focus-visible:ring-rose-200 outline-none transition-all duration-300 shadow-lg shadow-rose-200 active:scale-95 disabled:opacity-50"
          >
            {isPending ? 'Đang thực thi…' : 'Xác nhận đình chỉ'}
          </button>
          <button onClick={onClose} className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-gray-950 focus-visible:ring-4 focus-visible:ring-gray-100 outline-none transition-colors active:scale-95 italic">Hủy</button>
        </div>
      </div>
    </div>
  );
}

/* ====== USER DETAIL MODAL PRO MAX ====== */
function UserDetailModal({ user, onClose }) {
  if (!user) return null;
  const rb = ROLE_BADGE[user.roleName] || ROLE_BADGE.USER;
  
  const address = [user.tinhThanhPho, user.quanHuyen].filter(Boolean).join(', ');

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gray-950/60 backdrop-blur-md animate-in fade-in duration-500" onClick={onClose} />
      
      <div className="relative bg-white/95 backdrop-blur-3xl rounded-[3rem] border border-white shadow-[0_40px_120px_-20px_rgba(0,0,0,0.4)] w-full max-w-2xl max-h-[92vh] overflow-hidden flex flex-col animate-in slide-in-from-bottom-12 duration-700">
        
        {/* Premium Banner */}
        <div className="relative h-40 shrink-0 overflow-hidden">
           <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-slate-900 to-black" />
           {/* Abstract patterns */}
           <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_50%_120%,rgba(99,102,241,0.5),transparent)]" />
           <div className="absolute top-0 right-0 p-8 transform rotate-12 opacity-5 italic font-black text-8xl text-white select-none whitespace-nowrap">
              PAWVERSE ELITE OS
           </div>
           
           <button 
             onClick={onClose} 
             className="absolute top-6 right-6 w-12 h-12 flex items-center justify-center bg-white/10 hover:bg-white/20 focus-visible:ring-4 focus-visible:ring-white/20 outline-none text-white rounded-[1.25rem] backdrop-blur-md transition-all active:scale-90 z-20"
           >
             <X size={20} />
           </button>
        </div>

        {/* Content Area */}
        <div className="px-10 -mt-16 relative z-10 flex-1 overflow-y-auto custom-scrollbar pb-12">
          {/* Header Profile Section */}
          <div className="flex flex-col md:flex-row md:items-end gap-6 mb-12">
            <div className="relative shrink-0">
              <div className="absolute -inset-1 bg-white rounded-[2.5rem] shadow-2xl"></div>
              {user.avatar ? (
                <img src={user.avatar} alt="" width={120} height={120} className="relative w-32 h-32 rounded-[2.25rem] object-cover border-4 border-transparent" />
              ) : (
                <div className="relative w-32 h-32 bg-gray-50 rounded-[2.25rem] flex items-center justify-center text-4xl font-black text-indigo-200 border-4 border-transparent">
                  {user.fullName?.charAt(0) || 'U'}
                </div>
              )}
              {user.isFirstAdmin && (
                <div className="absolute -top-3 -right-3 w-10 h-10 rounded-2xl bg-gradient-to-br from-yellow-400 to-orange-500 border-4 border-white text-white flex items-center justify-center shadow-xl animate-bounce z-10">
                  <Crown size={16} fill="currentColor" />
                </div>
              )}
            </div>

            <div className="pb-2 space-y-1">
              <div className="flex flex-wrap items-center gap-3">
                <h4 className="text-3xl font-black text-gray-950 tracking-tighter uppercase italic">{user.fullName}</h4>
                <span className={`px-4 py-1.5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] italic border-2 shadow-sm ${rb.bg} ${rb.border} ${rb.text}`}>
                  {rb.label}
                </span>
              </div>
              <p className="text-sm font-black text-indigo-500/60 uppercase tracking-widest italic">Identity Identifier: @{user.username}</p>
            </div>
          </div>

          <div className="space-y-10 font-black italic">
            {/* Section: Core Data */}
            <div className="space-y-6">
               <div className="flex items-center gap-3 px-2">
                  <User size={14} className="text-indigo-500" />
                  <h5 className="text-[11px] font-black text-gray-900 uppercase tracking-[0.3em]">Thông tin cá nhân cơ bản</h5>
                  <div className="h-px bg-gray-100 flex-1" />
               </div>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <Field label="Tên đầy đủ" value={user.fullName} icon={User} />
                  <Field label="Địa chỉ Email" value={user.email} icon={Mail} />
                  <Field label="Số điện thoại" value={user.soDienThoai} icon={Phone} />
                  <Field label="Giới tính" value={user.gioiTinh} />
                  <Field label="Ngày sinh" value={user.ngaySinh} icon={Calendar} />
                  <Field label="Vị trí / Địa chỉ" value={address || 'CHƯA CẬP NHẬT'} icon={MapPin} />
               </div>
            </div>

            {/* Section: System Metadata */}
            <div className="space-y-6">
               <div className="flex items-center gap-3 px-2">
                  <Target size={14} className="text-indigo-500" />
                  <h5 className="text-[11px] font-black text-gray-900 uppercase tracking-[0.3em]">Dữ liệu hệ thống</h5>
                  <div className="h-px bg-gray-100 flex-1" />
               </div>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <Field label="Phương thức đăng ký" value={user.oauthProvider || 'Hệ thống'} />
                  <Field label="Ngày gia nhập" value={user.createdAt ? formatDate(user.createdAt) : 'N/A'} icon={Clock} />
                  <Field label="Trạng thái xác thực" value={user.emailVerified ? 'ĐÃ XÁC THỰC' : 'CHƯA XÁC THỰC'} />
                  <Field label="Số lần đăng nhập lỗi" value={user.failedLoginAttempts + ' LẦN'} />
               </div>
            </div>

            {/* Section: Access Status */}
            <div className={`rounded-[2.5rem] p-8 relative overflow-hidden group shadow-inner ${user.isLocked ? 'bg-rose-50/50 border border-rose-100' : 'bg-emerald-50/50 border border-emerald-100'}`}>
               <div className={`absolute -right-6 -bottom-6 opacity-[0.03] transition-transform duration-700 group-hover:scale-125 ${user.isLocked ? 'text-rose-950' : 'text-emerald-950'}`}>
                  {user.isLocked ? <Lock size={160} /> : <Unlock size={160} />}
               </div>
               
               <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="flex items-center gap-5">
                    <div className={`w-16 h-16 rounded-3xl flex items-center justify-center shadow-2xl shrink-0 ${user.isLocked ? 'bg-rose-600 text-white animate-pulse' : 'bg-emerald-600 text-white'}`}>
                       {user.isLocked ? <Lock size={28} /> : <Unlock size={28} />}
                    </div>
                    <div>
                       <p className={`text-[11px] font-black uppercase tracking-[0.3em] mb-1 ${user.isLocked ? 'text-rose-400' : 'text-emerald-400'}`}>Trạng thái bảo mật tài khoản</p>
                       <h3 className={`text-2xl font-black uppercase tracking-tighter ${user.isLocked ? 'text-rose-900' : 'text-emerald-900'}`}>
                          {user.isLocked ? 'Đã bị đình chỉ' : 'Quyền truy cập mở'}
                       </h3>
                    </div>
                  </div>
                  
                  {user.isLocked && (
                    <div className="p-4 bg-white/50 backdrop-blur-sm rounded-2xl border border-rose-100/50 min-w-[200px]">
                       <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest mb-2 border-b border-rose-100 pb-2">Thời hạn cấm thuật</p>
                       <div className="space-y-1.5 text-[11px] font-bold text-rose-700">
                          <p className="flex justify-between"><span>Lệnh:</span> <span>{user.lockTimeHours === 999 ? 'VĨNH VIỄN' : `${user.lockTimeHours} GIỜ`}</span></p>
                          {user.lockedUntil && <p className="flex justify-between"><span>Kết thúc:</span> <span>{formatDate(user.lockedUntil)}</span></p>}
                       </div>
                    </div>
                  )}
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, icon: Icon }) {
  return (
    <div className="group space-y-2">
      <div className="flex items-center gap-2 px-1">
        {Icon && <Icon size={10} className="text-gray-300 group-hover:text-indigo-500 transition-colors" />}
        <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] group-hover:text-indigo-600 transition-colors">{label}</p>
      </div>
      <div className="relative">
        <div className="absolute inset-0 bg-gray-50 rounded-2xl border border-gray-100/50 group-hover:bg-white group-hover:border-indigo-100 group-hover:shadow-lg group-hover:shadow-indigo-500/5 transition-all duration-300"></div>
        <div className="relative px-5 py-3 text-[12px] font-black text-gray-900 truncate italic">
          {value || 'CHƯA CẬP NHẬT'}
        </div>
      </div>
    </div>
  );
}

/* ====== MAIN PAGE ====== */
export default function UserManagementPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [lockTarget, setLockTarget] = useState(null);
  const [detailUser, setDetailUser] = useState(null);
  
  // Confirmation state
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', onConfirm: null, type: 'danger' });

  const queryClient = useQueryClient();

  const { data: stats } = useQuery({
    queryKey: ['admin-user-stats'],
    queryFn: adminService.getUserStats,
  });

  const { data: usersData, isLoading } = useQuery({
    queryKey: ['admin-users', currentPage, searchTerm, roleFilter, statusFilter],
    queryFn: () => adminService.getAllUsers({
      page: currentPage,
      size: 10,
      search: searchTerm || undefined,
      role: roleFilter || undefined,
      status: statusFilter || undefined,
    }),
  });

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    queryClient.invalidateQueries({ queryKey: ['admin-user-stats'] });
  };

  const updateRoleMutation = useMutation({
    mutationFn: ({ id, role }) => adminService.updateUserRole(id, role),
    onSuccess: () => { 
      invalidateAll(); 
      toast.success('NÂNG CẤP VAI TRÒ THÀNH CÔNG!', {
        icon: '👑',
        style: { borderRadius: '15px', background: '#111', color: '#fff', fontSize: '11px', fontWeight: 'bold' }
      }); 
    },
    onError: (err) => toast.error(err?.response?.data?.message || 'Không thể cập nhật vai trò'),
  });

  const lockMutation = useMutation({
    mutationFn: ({ id, hours }) => adminService.lockUser(id, hours),
    onSuccess: () => { 
      invalidateAll(); 
      setLockTarget(null); 
      toast.success('ĐÃ ĐÌNH CHỈ TÀI KHOẢN!', {
        icon: '🚫',
        style: { borderRadius: '15px', background: '#111', color: '#fff', fontSize: '11px', fontWeight: 'bold' }
      }); 
    },
    onError: (err) => toast.error(err?.response?.data?.message || 'Không thể khóa tài khoản'),
  });

  const unlockMutation = useMutation({
    mutationFn: (id) => adminService.unlockUser(id),
    onSuccess: () => { 
      invalidateAll(); 
      toast.success('KHÔI PHỤC TÀI KHOẢN THÀNH CÔNG!', {
        icon: '🔓',
        style: { borderRadius: '15px', background: '#111', color: '#fff', fontSize: '11px', fontWeight: 'bold' }
      }); 
    },
    onError: (err) => toast.error(err?.response?.data?.message || 'Không thể mở khóa tài khoản'),
  });

  const handleRoleChange = (user, newRole) => {
    if (user.isFirstAdmin) { toast.error('Quyền tối thượng không thể thay đổi'); return; }
    if (user.roleName === newRole) return;
    
    setConfirmModal({
      isOpen: true,
      title: 'THAY ĐỔI VAI TRÒ',
      message: `Bạn có chắc muốn chuyển vai trò của “${user.fullName}” sang ${newRole}? Điều này ảnh hưởng trực tiếp đến quyền truy cập.`,
      type: 'warning',
      onConfirm: () => updateRoleMutation.mutate({ id: user.idUser, role: newRole })
    });
  };

  const handleLockConfirm = (id, hours) => {
    lockMutation.mutate({ id, hours });
  };

  const handleUnlock = (user) => {
    setConfirmModal({
      isOpen: true,
      title: 'MỞ KHÓA TÀI KHOẢN',
      message: `Bạn có chắc muốn khôi phục quyền truy cập cho “${user.fullName}” ngay lập tức?`,
      type: 'warning',
      onConfirm: () => unlockMutation.mutate(user.idUser)
    });
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(0);
  };

  const handleTabChange = (key) => {
    setRoleFilter(key);
    setCurrentPage(0);
  };

  const users = usersData?.content || [];
  const totalPages = usersData?.totalPages || 0;
  const totalElements = usersData?.totalElements || 0;

  return (
    <div className="space-y-8 animate-in fade-in duration-700 font-black italic">
       {/* Global Confirm Modal */}
       <ConfirmModal 
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        type={confirmModal.type}
      />

      {/* Premium Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2 font-black italic uppercase">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600 shadow-sm shadow-indigo-100">
               <Users size={16} />
            </div>
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] italic leading-none">Cơ sở dữ liệu nhân khẩu học</span>
          </div>
          <h1 className="text-4xl font-black text-gray-950 uppercase tracking-tighter italic leading-none">
            Quản lý <span className="text-indigo-600 font-black not-italic">Người dùng</span>
          </h1>
          <p className="text-gray-500 mt-3 font-medium text-sm flex items-center gap-2 font-black italic">
            <ShieldCheck size={14} className="text-gray-300" />
            Hệ thống đang quản lý <span className="text-gray-950 font-black italic underline decoration-indigo-200">{totalElements}</span> tài khoản người dùng
          </p>
        </div>
      </div>

      {/* Stats PRO MAX */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatCard title="Tổng người dùng" value={stats?.totalUsers} icon={Users} color="text-indigo-600" bgColor="bg-indigo-50" />
        <StatCard title="Admin" value={stats?.totalAdmins} icon={Crown} color="text-purple-600" bgColor="bg-purple-50" />
        <StatCard title="Staff" value={stats?.totalStaff} icon={ShieldCheck} color="text-blue-600" bgColor="bg-blue-50" />
        <StatCard title="User" value={stats?.totalCustomers} icon={Users} color="text-emerald-600" bgColor="bg-emerald-50" />
        <StatCard title="Bị khóa" value={stats?.lockedUsers} icon={Lock} color="text-rose-600" bgColor="bg-rose-50" />
      </div>

      {/* Control Center */}
      <div className="bg-white/60 backdrop-blur-xl border border-white rounded-[2.5rem] p-6 shadow-sm">
         <div className="flex flex-col lg:flex-row gap-6 items-center">
            {/* Tabs */}
            <div className="flex items-center gap-2 p-1.5 bg-gray-100/50 border border-gray-100 rounded-2xl shrink-0 italic font-black">
              {ROLE_TABS.map((tab) => {
                const active = roleFilter === tab.key;
                return (
                  <button
                    key={tab.key}
                    onClick={() => handleTabChange(tab.key)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 focus-visible:ring-4 focus-visible:ring-indigo-100 outline-none ${
                      active ? 'bg-white text-indigo-600 shadow-md shadow-indigo-100' : 'text-gray-400 hover:text-gray-600'
                    }`}
                  >
                    <tab.icon size={12} className={active ? 'text-indigo-500' : ''} /> {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Search */}
            <form onSubmit={handleSearch} className="relative flex-1 w-full group italic font-black uppercase">
              <Search size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-indigo-500 transition-colors" />
              <input
                type="text"
                name="search"
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(0); }}
                placeholder="Truy vấn dữ liệu theo Tên, Email, Username…"
                className="w-full pl-14 pr-6 py-4 bg-gray-50/50 border-none rounded-2xl focus:ring-4 focus:ring-indigo-100 focus-visible:ring-4 focus-visible:ring-indigo-200 outline-none transition-all text-sm font-medium placeholder:text-gray-400 placeholder:italic italic font-black uppercase"
              />
            </form>

            <div className="shrink-0 font-black uppercase italic">
              <select
                name="status"
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(0); }}
                className="px-5 py-4 bg-gray-50/50 border border-gray-100 rounded-2xl text-[11px] font-black uppercase tracking-widest text-gray-950 focus:ring-4 focus:ring-indigo-100 focus-visible:ring-4 focus-visible:ring-indigo-200 outline-none transition-all appearance-none cursor-pointer italic font-black"
              >
                <option value="">TẤT CẢ TRẠNG THÁI</option>
                <option value="active">ĐANG HOẠT ĐỘNG</option>
                <option value="locked">TÀI KHOẢN BỊ KHÓA</option>
              </select>
            </div>
         </div>
      </div>

      {/* Table PRO MAX */}
      <div className="bg-white border border-gray-100 rounded-[2.5rem] shadow-sm overflow-hidden italic font-black">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
               <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-100 border-t-indigo-600" />
               <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest animate-pulse">Đang thẩm định danh sách…</p>
          </div>
        ) : (
          <div className="overflow-x-auto custom-scrollbar font-black uppercase italic">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100">
                  <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest italic">Họ tên & Tên đăng nhập</th>
                  <th className="px-6 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest italic">Email</th>
                  <th className="px-6 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest italic text-center">Vai trò</th>
                  <th className="px-6 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest italic text-center">Trạng thái</th>
                  <th className="px-6 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest italic">Ngày tham gia</th>
                  <th className="px-8 py-6 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest italic">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 italic">
                {users.map((user) => {
                  const rb = ROLE_BADGE[user.roleName] || ROLE_BADGE.USER;
                  const isProtected = user.isFirstAdmin;
                  return (
                    <tr key={user.idUser} className={`group hover:bg-gray-50/80 transition-all duration-300 font-black ${user.isLocked ? 'opacity-50 grayscale-[0.5]' : ''}`}>
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-4">
                          <div className="relative group/avatar shrink-0">
                            {user.avatar ? (
                              <img src={user.avatar} alt="" width={44} height={44} className="w-11 h-11 rounded-2xl object-cover border border-gray-100 shadow-sm group-hover/avatar:scale-110 transition-transform duration-500" />
                            ) : (
                              <div className="w-11 h-11 bg-gray-50 rounded-2xl flex items-center justify-center text-indigo-300 font-black text-sm border border-gray-100">
                                {user.fullName?.charAt(0) || 'U'}
                              </div>
                            )}
                            {isProtected && (
                              <div className="absolute -top-1.5 -right-1.5 p-1 bg-yellow-400 rounded-lg text-white shadow-md border-2 border-white">
                                <Crown size={10} fill="currentColor" />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                             <p className="text-[13px] font-black text-gray-900 uppercase tracking-tight truncate max-w-[160px] italic">{user.fullName}</p>
                             <p className="text-[10px] font-bold text-gray-400 italic">@{user.username}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-[11px] font-medium text-gray-600 lowercase tracking-tight italic">{user.email}</td>
                      <td className="px-6 py-5 text-center font-black italic">
                        {isProtected ? (
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest italic border ${rb.bg} ${rb.border} ${rb.text}`}>
                            <Crown size={12} fill="currentColor" /> ADMIN
                          </span>
                        ) : (
                          <div className="relative group/role">
                             <select
                                value={user.roleName}
                                onChange={(e) => handleRoleChange(user, e.target.value)}
                                disabled={updateRoleMutation.isPending}
                                className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border border-transparent cursor-pointer focus:ring-4 focus:ring-indigo-100 focus-visible:ring-4 focus-visible:ring-indigo-200 outline-none transition-all appearance-none italic ${rb.bg} ${rb.text}`}
                              >
                                <option value="USER">USER</option>
                                <option value="STAFF">STAFF</option>
                                <option value="ADMIN">ADMIN</option>
                              </select>
                              <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-0 group-hover/role:opacity-100 transition-opacity">
                                 <ChevronDown size={10} />
                              </div>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-5 text-center font-black italic">
                        {user.isLocked ? (
                          <div className="inline-flex flex-col items-center gap-1 font-black italic uppercase">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 text-rose-600 rounded-xl text-[9px] font-black uppercase tracking-widest italic border border-rose-100">
                              <Lock size={12} /> BỊ KHÓA
                            </span>
                            {user.lockTimeHours && (
                              <span className="text-[8px] font-black text-rose-400 uppercase italic">
                                {user.lockTimeHours === 999 ? 'VĨNH VIỄN' : `${user.lockTimeHours} GIỜ`}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-xl text-[9px] font-black uppercase tracking-widest italic border border-emerald-100 font-black italic uppercase">
                            <UserCheck size={12} /> ĐANG HOẠT ĐỘNG
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-5 text-[11px] font-black text-gray-400 italic font-variant-numeric: tabular-nums">
                        {user.createdAt ? formatDate(user.createdAt) : 'N/A'}
                      </td>
                      <td className="px-8 py-5 text-right font-black italic uppercase font-black uppercase">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0 duration-500">
                          <button
                            onClick={() => setDetailUser(user)}
                            className="w-10 h-10 flex items-center justify-center bg-white text-gray-400 hover:bg-indigo-50 hover:text-indigo-600 focus-visible:ring-4 focus-visible:ring-indigo-100 outline-none rounded-xl border border-gray-100 transition-all shadow-sm active:scale-95"
                            title="Chi tiết tài khoản"
                          >
                            <Target size={18} />
                          </button>
                          {!isProtected && (
                            user.isLocked ? (
                              <button
                                onClick={() => handleUnlock(user)}
                                disabled={unlockMutation.isPending}
                                className="w-10 h-10 flex items-center justify-center bg-white text-emerald-500 hover:bg-emerald-600 hover:text-white focus-visible:ring-4 focus-visible:ring-emerald-100 outline-none rounded-xl border border-gray-100 transition-all shadow-sm active:scale-95"
                                title="Khôi phục truy cập"
                              >
                                <Unlock size={18} />
                              </button>
                            ) : (
                              <button
                                onClick={() => setLockTarget(user)}
                                className="w-10 h-10 flex items-center justify-center bg-white text-rose-400 hover:bg-rose-600 hover:text-white focus-visible:ring-4 focus-visible:ring-rose-100 outline-none rounded-xl border border-gray-100 transition-all shadow-sm active:scale-95"
                                title="Khóa tài khoản"
                              >
                                <Lock size={18} />
                              </button>
                            )
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination PRO MAX */}
        {!isLoading && totalPages > 0 && (
          <div className="flex items-center justify-between px-8 py-6 border-t border-gray-50 italic">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest italic">
              Đang hiển thị <span className="text-gray-950 font-black italic">{users.length}</span> tài khoản // Tổng cộng {totalElements}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                disabled={currentPage === 0}
                className="w-11 h-11 flex items-center justify-center bg-white border border-gray-100 rounded-2xl text-gray-400 hover:bg-indigo-950 hover:text-white focus-visible:ring-4 focus-visible:ring-indigo-100 outline-none transition-all disabled:opacity-30 active:scale-90 shadow-sm"
              >
                <ChevronLeft size={20} />
              </button>
              
              <div className="flex items-center gap-1.5 p-1.5 bg-gray-50 border border-gray-100 rounded-[1.5rem] italic font-black uppercase">
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  let pageNum = i;
                  if (totalPages > 5) {
                    const start = Math.max(0, Math.min(currentPage - 2, totalPages - 5));
                    pageNum = start + i;
                  }
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`w-9 h-9 rounded-xl text-[10px] font-black transition-all focus-visible:ring-4 focus-visible:ring-indigo-100 outline-none ${
                        currentPage === pageNum
                          ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100'
                          : 'text-gray-400 hover:bg-white hover:text-gray-950'
                      }`}
                    >
                      {pageNum + 1}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
                disabled={currentPage >= totalPages - 1}
                className="w-11 h-11 flex items-center justify-center bg-white border border-gray-100 rounded-2xl text-gray-400 hover:bg-indigo-950 hover:text-white focus-visible:ring-4 focus-visible:ring-indigo-100 outline-none transition-all disabled:opacity-30 active:scale-90 shadow-sm"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Empty State */}
      {!isLoading && users.length === 0 && (
        <div className="bg-white rounded-[3rem] border border-gray-100 py-32 text-center opacity-40">
           <Zap size={48} className="mx-auto text-gray-300 mb-6" />
           <p className="text-[11px] font-black text-gray-400 uppercase tracking-[0.3em] mb-1 italic">Vùng dữ liệu trống</p>
           <p className="text-[9px] font-bold text-gray-300 italic uppercase">Không tìm thấy thực thể người dùng nào khớp với truy vấn</p>
        </div>
      )}

      {/* Modals */}
      {lockTarget && (
        <LockModal
          user={lockTarget}
          onClose={() => setLockTarget(null)}
          onConfirm={handleLockConfirm}
          isPending={lockMutation.isPending}
        />
      )}

      {detailUser && (
        <UserDetailModal user={detailUser} onClose={() => setDetailUser(null)} />
      )}

      <style jsx="true">{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
          height: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #f1f1f1;
          border-radius: 20px;
        }
        .custom-scrollbar:hover::-webkit-scrollbar-thumb {
          background: #e2e2e2;
        }
        .font-variant-numeric\\: { font-variant-numeric: tabular-nums; }
        
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes zoom-in-95 {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        @keyframes slide-in-bottom {
           from { transform: translateY(20px); opacity: 0; }
           to { transform: translateY(0); opacity: 1; }
        }
        .animate-in {
          animation-fill-mode: forwards;
        }
        .fade-in {
          animation-name: fade-in;
        }
        .zoom-in-95 {
          animation-name: zoom-in-95;
        }
        .slide-in-from-bottom-12 {
           animation-name: slide-in-bottom;
        }
      `}</style>
    </div>
  );
}
