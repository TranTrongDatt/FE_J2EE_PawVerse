import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  PawPrint, 
  Plus, 
  Edit2, 
  Trash2, 
  Camera, 
  X, 
  Save, 
  ArrowLeft, 
  AlertCircle, 
  Dog, 
  Cat, 
  Rabbit, 
  Bird, 
  Heart, 
  Calendar, 
  Weight, 
  Settings2, 
  ChevronRight, 
  TrendingUp, 
  Sparkles, 
  ArrowRight, 
  ShieldCheck, 
  Star, 
  Bone 
} from 'lucide-react';
import ConfirmModal from '../../components/common/ConfirmModal';
import petService from '../../api/petService';
import useAuthStore from '../../store/useAuthStore';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const PET_TYPES = [
  { value: 'Chó', label: 'Chó', icon: Dog },
  { value: 'Mèo', label: 'Mèo', icon: Cat },
  { value: 'Hamster', label: 'Chuột', icon: PawPrint },
  { value: 'Thỏ', label: 'Thỏ', icon: Rabbit },
  { value: 'Chim', label: 'Chim', icon: Bird },
  { value: 'Khác', label: 'Khác', icon: PawPrint },
];

const GENDERS = ['Đực', 'Cái', 'Không rõ'];

export default function PetProfilePage() {
  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [view, setView] = useState('list'); // list | form | detail
  const [editingPet, setEditingPet] = useState(null);
  const [selectedPet, setSelectedPet] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);
  const [alertConfig, setAlertConfig] = useState({ title: '', message: '' });
  const [petToDelete, setPetToDelete] = useState(null);

  const initialForm = {
    tenPet: '',
    loaiPet: 'Chó',
    giong: '',
    tuoi: '',
    gioiTinh: 'Đực',
    canNang: '',
  };
  const [form, setForm] = useState(initialForm);

  const { data: pets = [], isLoading } = useQuery({
    queryKey: ['myPets'],
    queryFn: petService.getMyPets,
    enabled: isAuthenticated,
    select: (res) => res.data?.data || [],
  });

  const createMutation = useMutation({
    mutationFn: (data) => petService.createPet(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['myPets']);
      toast.success('Chào mừng Boss gia nhập PawVerse! 🐾');
      setView('list');
      setForm(initialForm);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Thêm thất bại rồi Sen ơi!'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ petId, data }) => petService.updatePet(petId, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['myPets']);
      toast.success('Hồ sơ Boss đã được cập nhật! ✨');
      setView('list');
      setEditingPet(null);
      setForm(initialForm);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Cập nhật thất bại'),
  });

  const deleteMutation = useMutation({
    mutationFn: (petId) => petService.deletePet(petId),
    onSuccess: () => {
      queryClient.invalidateQueries(['myPets']);
      setIsDeleteModalOpen(false);
      setPetToDelete(null);
      toast.success('Đã chia tay Boss... 😿');
      setView('list');
      setSelectedPet(null);
    },
    onError: (err) => {
      setIsDeleteModalOpen(false);
      const errorMsg = err.response?.data?.message || '';
      if (errorMsg.includes('foreign key constraint fails') || errorMsg.includes('service_bookings')) {
        setAlertConfig({
          title: "KHÔNG THỂ XÓA BOSS! 🐾",
          message: "Ối Sen ơi! Boss này đang có lịch hẹn dịch vụ hoặc dữ liệu liên quan khác trên hệ thống.\n\nSen vui lòng kiểm tra và hủy các lịch hẹn của Boss trước khi xóa hồ sơ nhé!"
        });
        setIsAlertModalOpen(true);
      } else {
        toast.error(errorMsg || 'Xóa thất bại rồi Sen ơi!');
      }
    },
  });

  const avatarMutation = useMutation({
    mutationFn: ({ petId, file }) => petService.uploadPetAvatar(petId, file),
    onSuccess: (res) => {
      const avatarUrl = res.data?.data;
      queryClient.invalidateQueries(['myPets']);
      if (selectedPet && avatarUrl) setSelectedPet({ ...selectedPet, anhPet: avatarUrl });
      toast.success('Boss trông thật bảnh! 📸');
    },
    onError: () => toast.error('Upload ảnh thất bại rồi!'),
  });

  const handleDeleteClick = (petId) => {
    setPetToDelete(petId);
    setIsDeleteModalOpen(true);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#fcfdfd] flex items-center justify-center p-4">
        <div className="bg-white rounded-[3.5rem] shadow-2xl p-12 text-center max-w-md border border-gray-50 relative overflow-hidden group">
           <div className="absolute top-0 right-0 w-32 h-32 bg-orange-50 rounded-full blur-3xl -mr-16 -mt-16 opacity-50"></div>
           <div className="w-24 h-24 bg-gray-50 rounded-[2rem] flex items-center justify-center mx-auto mb-8 transition-transform group-hover:rotate-12 duration-500">
              <ShieldCheck size={48} className="text-gray-300" />
           </div>
           <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tighter mb-4 leading-none">DỪNG LẠI SEN ƠI!</h2>
           <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-10 leading-relaxed">Bạn cần đăng nhập để xem hồ sơ của các Boss nhé 🐾</p>
           <button onClick={() => navigate('/login')} className="w-full py-5 bg-gray-900 text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] shadow-xl hover:bg-orange-600 transition-all active:scale-95 flex items-center justify-center gap-3">
             ĐĂNG NHẬP NGAY <ArrowRight size={18} />
           </button>
        </div>
      </div>
    );
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.tenPet.trim()) { toast.error('Boss phải có tên chứ! 🐾'); return; }
    const data = {
      ...form,
      tuoi: form.tuoi ? parseInt(form.tuoi) : null,
      canNang: form.canNang ? parseFloat(form.canNang) : null,
    };
    if (editingPet) {
      updateMutation.mutate({ petId: editingPet.idPet, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const openEdit = (pet) => {
    setEditingPet(pet);
    setForm({
      tenPet: pet.tenPet || '',
      loaiPet: pet.loaiPet || 'Chó',
      giong: pet.giong || '',
      tuoi: pet.tuoi?.toString() || '',
      gioiTinh: pet.gioiTinh || 'Đực',
      canNang: pet.canNang?.toString() || '',
    });
    setView('form');
  };

  const openDetail = (pet) => {
    setSelectedPet(pet);
    setView('detail');
  };

  const handleAvatarChange = (petId, e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error('Ảnh to quá Boss không load nổi! (Max 5MB)'); return; }
    avatarMutation.mutate({ petId, file });
  };

  const getPetIcon = (type) => {
    const found = PET_TYPES.find((p) => p.value === type);
    return found ? found.icon : PawPrint;
  };

  // ===== DETAIL VIEW =====
  if (view === 'detail' && selectedPet) {
    const PetIcon = getPetIcon(selectedPet.loaiPet);
    return (
      <div className="bg-[#fcfdfd] min-h-screen py-12 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-[10%] left-[5%] opacity-[0.02] rotate-12"><Dog size={200} /></div>
        <div className="absolute bottom-[5%] right-[5%] opacity-[0.02] -rotate-12"><Cat size={180} /></div>

        <div className="container mx-auto px-4 max-w-4xl relative z-10 pt-20">
          <button onClick={() => { setView('list'); setSelectedPet(null); }} className="group flex items-center gap-2 text-gray-400 hover:text-gray-900 mb-10 transition-colors font-black text-[10px] uppercase tracking-[0.2em]">
            <div className="w-10 h-10 bg-white border border-gray-100 rounded-full flex items-center justify-center group-hover:bg-gray-50 transition-all shadow-sm">
               <ArrowLeft size={18} />
            </div>
            QUAY LẠI DANH SÁCH
          </button>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            {/* Left: Premium Avatar Card */}
            <div className="lg:col-span-4">
               <div className="bg-white rounded-[3.5rem] shadow-2xl shadow-gray-200/50 p-10 text-center border border-white relative overflow-hidden group/avatar">
                 <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-orange-500 to-orange-300"></div>
                 <div className="relative inline-block mt-4">
                   <div className="w-44 h-44 rounded-[3rem] overflow-hidden bg-gray-50 mx-auto border-8 border-white shadow-xl relative group">
                     {selectedPet.anhPet ? (
                       <img src={selectedPet.anhPet} alt={selectedPet.tenPet} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                     ) : (
                       <div className="w-full h-full flex items-center justify-center bg-orange-50/50">
                         <PetIcon size={64} className="text-orange-200" />
                       </div>
                     )}
                     <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <p className="text-white font-black text-[8px] uppercase tracking-widest">ĐỔI ẢNH</p>
                     </div>
                   </div>

                   <label className="absolute -bottom-2 -right-2 w-12 h-12 bg-orange-600 text-white rounded-2xl flex items-center justify-center cursor-pointer hover:bg-orange-500 transition-all shadow-lg shadow-orange-100 border-4 border-white active:scale-90 group/cam">
                     <Camera size={20} className="group-hover/cam:rotate-12 transition-transform" />
                     <input type="file" className="hidden" accept="image/*" onChange={(e) => handleAvatarChange(selectedPet.idPet, e)} disabled={avatarMutation.isPending} />
                   </label>
                 </div>

                 <div className="mt-8 mb-10">
                   <h2 className="text-4xl font-black text-gray-900 uppercase tracking-tighter leading-none mb-2">{selectedPet.tenPet}</h2>
                   <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-orange-50 text-orange-600 rounded-full text-[9px] font-black uppercase tracking-widest">
                      <Star size={10} className="fill-orange-600" /> {selectedPet.loaiPet}
                   </div>
                 </div>

                 <div className="grid grid-cols-2 gap-3 pt-8 border-t border-gray-50">
                   <button onClick={() => openEdit(selectedPet)} className="flex items-center justify-center gap-2 py-4 bg-gray-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-orange-600 transition-all shadow-xl shadow-gray-100">
                     <Edit2 size={14} /> SỬA
                   </button>
                       <button
                         onClick={() => handleDeleteClick(selectedPet.idPet)}
                         className="flex-1 py-5 bg-red-600 text-white rounded-[2rem] font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-red-100 hover:bg-red-700 hover:-translate-y-1 transition-all flex items-center justify-center gap-2 group/del"
                       >
                          <Trash2 size={16} className="group-hover:rotate-12 transition-transform" /> XÓA
                       </button>
                 </div>
               </div>
            </div>

            {/* Right: Info Cards */}
            <div className="lg:col-span-8 space-y-6">
              <div className="bg-white rounded-[3.5rem] shadow-2xl shadow-gray-200/50 p-12 border border-white">
                <div className="flex items-center justify-between mb-10">
                   <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tighter tracking-tight flex items-center gap-3">
                     HỒ SƠ BOSS <PawPrint className="text-gray-100" size={28} />
                   </h3>
                   <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-200">
                      <Settings2 size={24} />
                   </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <PremiumInfoRow icon={Heart} label="TÊN GỌI" value={selectedPet.tenPet} />
                  <PremiumInfoRow icon={Sparkles} label="CHỦNG LOẠI" value={selectedPet.loaiPet} />
                  <PremiumInfoRow icon={TrendingUp} label="GIỐNG LOÀI" value={selectedPet.giong || 'BÍ MẬT 🤫'} />
                  <PremiumInfoRow icon={Calendar} label="TUỔI TÁC" value={selectedPet.tuoi ? `${selectedPet.tuoi} TUỔI` : 'BÍ MẬT 🤫'} className="tabular-nums" />
                  <PremiumInfoRow icon={Dog} label="GIỚI TÍNH" value={selectedPet.gioiTinh || 'CHƯA XÁC ĐỊNH'} />
                  <PremiumInfoRow icon={Weight} label="CÂN NẶNG" value={selectedPet.canNang ? `${selectedPet.canNang} KG` : 'SIÊU MẪU'} className="tabular-nums" />
                </div>
                
                {selectedPet.ngayTao && (
                  <div className="mt-12 pt-8 border-t border-gray-50 flex items-center justify-between">
                     <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em]">HỘ CHIẾU CẤP NGÀY</p>
                     <p className="text-[10px] font-black text-gray-900 uppercase tracking-widest leading-none bg-gray-50 px-4 py-2 rounded-full">
                       {new Date(selectedPet.ngayTao).toLocaleDateString('vi-VN')}
                     </p>
                  </div>
                )}
              </div>

              {/* Tips Section */}
              <div className="bg-gradient-to-r from-orange-600 to-orange-400 rounded-[3rem] p-10 text-white relative overflow-hidden group/tips">
                 <div className="absolute top-[-20%] right-[-10%] w-40 h-40 bg-white/10 rounded-full blur-2xl group-hover:scale-125 transition-transform duration-1000"></div>
                 <h4 className="text-xl font-black uppercase tracking-tighter mb-2 flex items-center gap-2 italic">LỜI KHUYÊN TỪ PAWVERSE <Bone size={20} className="fill-white" /></h4>
                 <p className="text-white/80 font-bold text-[10px] uppercase tracking-widest leading-relaxed max-w-lg">Đừng quên cập nhật cân nặng của Boss hàng tháng để chúng tôi tư vấn gói dinh dưỡng phù hợp nhất nhé!</p>
              </div>
            </div>
          </div>
        </div>

        <ConfirmModal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          onConfirm={() => deleteMutation.mutate(petToDelete)}
          title="XÓA HỒ SƠ BOSS? 😿"
          message="Boss sẽ biến mất mãi mãi đó Sen ơi? Toàn bộ dữ liệu của Boss sẽ không thể phục hồi!"
          confirmText="XÓA BOSS NGAY"
          cancelText="GIỮ LẠI"
          variant="danger"
          isLoading={deleteMutation.isPending}
        />
      <ConfirmModal
        isOpen={isAlertModalOpen}
        onClose={() => setIsAlertModalOpen(false)}
        title={alertConfig.title}
        message={alertConfig.message}
        variant="warning"
        confirmText="ĐÃ HIỂU"
      />
    </div>
    );
  }

  // ===== FORM VIEW =====
  if (view === 'form') {
    return (
      <div className="bg-[#fcfdfd] min-h-screen py-12 relative overflow-hidden">
        <div className="absolute top-[15%] right-[10%] opacity-[0.03] rotate-45"><Bone size={240} /></div>
        
        <div className="container mx-auto px-4 max-w-3xl relative z-10 pt-20">
          <button onClick={() => { setView('list'); setEditingPet(null); setForm(initialForm); }} className="group flex items-center gap-2 text-gray-400 hover:text-gray-900 mb-10 transition-colors font-black text-[10px] uppercase tracking-[0.2em]">
            <div className="w-10 h-10 bg-white border border-gray-100 rounded-full flex items-center justify-center group-hover:bg-gray-50 transition-all shadow-sm">
               <ArrowLeft size={18} />
            </div>
            QUAY LẠI
          </button>

          <div className="bg-white rounded-[4rem] shadow-2xl shadow-gray-200/50 p-12 md:p-16 border border-white">
            <h2 className="text-4xl font-black text-gray-900 uppercase tracking-tighter mb-10 leading-none">
              {editingPet ? 'CẬP NHẬT' : 'CHÀO MỪNG'} <span className="text-orange-600">BOSS</span> MỚI!
            </h2>
            
                        <form onSubmit={handleSubmit} className="space-y-10">
              <div className="space-y-2">
                 <label htmlFor="pet-name" className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-6">TÊN CỦA BOSS YÊU *</label>
                 <input
                   id="pet-name"
                   name="tenPet"
                   value={form.tenPet}
                   onChange={(e) => setForm({ ...form, tenPet: e.target.value })}
                   autoComplete="nickname"
                   placeholder="VD: Milu, Cỏ, Phô Mai…"
                   className="w-full px-10 py-5 bg-gray-50/50 border-2 border-transparent focus:border-orange-200 focus:bg-white focus:outline-none transition-all duration-300 rounded-[2rem] font-black text-gray-900 placeholder:text-gray-300 focus-visible:ring-2 focus-visible:ring-orange-500"
                   required
                 />
              </div>

              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-6 mb-4 block">PHÂN LOẠI BOSS</label>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                  {PET_TYPES.map((type) => {
                    const Icon = type.icon;
                    const selected = form.loaiPet === type.value;
                    return (
                      <button
                        key={type.value}
                        type="button"
                        onClick={() => setForm({ ...form, loaiPet: type.value })}
                        className={`group/btn p-4 rounded-[2rem] border-2 transition-all duration-300 flex flex-col items-center ${
                          selected ? 'border-orange-600 bg-orange-600 text-white shadow-xl shadow-orange-100 -translate-y-1' : 'border-gray-50 bg-gray-50/50 hover:bg-white hover:border-orange-200'
                        }`}
                      >
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-2 transition-all duration-500 ${selected ? 'bg-white/20 text-white' : 'bg-white text-gray-400 shadow-sm'}`}>
                           <Icon size={24} />
                        </div>
                        <span className={`text-[9px] font-black uppercase tracking-widest ${selected ? 'text-white' : 'text-gray-400 group-hover/btn:text-gray-900'}`}>{type.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                   <label htmlFor="pet-breed" className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-6">GIỐNG LOÀI</label>
                   <input
                     id="pet-breed"
                     name="giong"
                     value={form.giong}
                     onChange={(e) => setForm({ ...form, giong: e.target.value })}
                     autoComplete="off"
                     placeholder="VD: Corgi, Poodle, Mèo Ta…"
                     className="w-full px-10 py-5 bg-gray-50/50 border-2 border-transparent focus:border-orange-200 focus:bg-white focus:outline-none transition-all duration-300 rounded-[2rem] font-black text-gray-900 placeholder:text-gray-300 focus-visible:ring-2 focus-visible:ring-orange-500"
                   />
                </div>
                <div className="space-y-2">
                   <label htmlFor="pet-age" className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-6">TUỔI CỦA BOSS</label>
                   <input
                     id="pet-age"
                     name="tuoi"
                     type="number"
                     min="0"
                     max="30"
                     inputMode="numeric"
                     value={form.tuoi}
                     onChange={(e) => setForm({ ...form, tuoi: e.target.value })}
                     placeholder="Số năm tuổi…"
                     className="w-full px-10 py-5 bg-gray-50/50 border-2 border-transparent focus:border-orange-200 focus:bg-white focus:outline-none transition-all duration-300 rounded-[2rem] font-black text-gray-900 placeholder:text-gray-300 tabular-nums focus-visible:ring-2 focus-visible:ring-orange-500"
                   />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                   <label htmlFor="pet-gender" className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-6">GIỚI TÍNH BOSS</label>
                   <div className="relative">
                      <select
                        id="pet-gender"
                        name="gioiTinh"
                        value={form.gioiTinh}
                        onChange={(e) => setForm({ ...form, gioiTinh: e.target.value })}
                        className="w-full px-10 py-5 bg-gray-50/50 border-2 border-transparent focus:border-orange-200 focus:bg-white focus:outline-none transition-all rounded-[2rem] font-black text-gray-900 appearance-none"
                      >
                        {GENDERS.map((g) => <option key={g} value={g}>{g}</option>)}
                      </select>
                      <ChevronRight size={18} className="absolute right-8 top-1/2 -translate-y-1/2 text-gray-300 rotate-90 pointer-events-none" />
                   </div>
                </div>
                <div className="space-y-2">
                   <label htmlFor="pet-weight" className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-6">CÂN NẶNG (KG)</label>
                   <input
                     id="pet-weight"
                     name="canNang"
                     type="number"
                     min="0"
                     step="0.1"
                     inputMode="decimal"
                     value={form.canNang}
                     onChange={(e) => setForm({ ...form, canNang: e.target.value })}
                     placeholder="VD: 3.5, 10…"
                     className="w-full px-10 py-5 bg-gray-50/50 border-2 border-transparent focus:border-orange-200 focus:bg-white focus:outline-none transition-all duration-300 rounded-[2rem] font-black text-gray-900 placeholder:text-gray-300 tabular-nums focus-visible:ring-2 focus-visible:ring-orange-500"
                   />
                </div>
              </div>

              <div className="pt-6">
                 <button
                   type="submit"
                   disabled={createMutation.isPending || updateMutation.isPending}
                   className="w-full py-6 bg-gray-900 text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] shadow-2xl shadow-gray-200 hover:bg-orange-600 hover:-translate-y-2 transition-all disabled:opacity-50 flex items-center justify-center gap-3 relative overflow-hidden group/save"
                 >
                   <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover/save:translate-x-[100%] transition-transform duration-1000 -skew-x-12" />
                   <Save size={20} />
                   {(createMutation.isPending || updateMutation.isPending) ? 'ĐANG LƯU HỒ SƠ…' : editingPet ? 'CẬP NHẬT HỒ SƠ' : 'HOÀN TẤT THÊM BOSS'}
                 </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // ===== LIST VIEW =====
  return (
    <div className="bg-[#fcfdfd] min-h-screen py-12 relative overflow-hidden">
      {/* Decorative Signature Background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-5%] right-[-5%] w-[45vw] h-[45vw] bg-orange-100/30 rounded-full blur-[120px] opacity-40"></div>
        <div className="absolute bottom-[-5%] left-[-5%] w-[40vw] h-[40vw] bg-blue-50/40 rounded-full blur-[100px] opacity-30"></div>
        <div className="absolute top-[20%] left-[10%] opacity-[0.03] rotate-12"><Dog size={240} /></div>
        <div className="absolute bottom-[20%] right-[10%] opacity-[0.03] -rotate-12"><Cat size={200} /></div>
      </div>

      <div className="container mx-auto px-4 max-w-5xl relative z-10 pt-24 pb-20">
        <div className="flex flex-col md:flex-row items-center justify-between gap-10 mb-16 animate-in fade-in slide-in-from-top-10 duration-1000">
          <div className="text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-6 py-2 bg-orange-50 text-orange-600 rounded-full text-[10px] font-black uppercase tracking-[0.3em] mb-6 shadow-sm">
               <Sparkles size={14} className="fill-orange-600" />
               Gia đình Boss yêu
            </div>
            <h1 className="text-6xl md:text-7xl font-black text-gray-900 tracking-tighter uppercase mb-4 leading-none">
               THÚ CƯNG <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-orange-400">CỦA TÔI</span>
            </h1>
            <p className="text-gray-400 font-bold uppercase text-xs md:text-sm tracking-[0.2em] leading-relaxed">
               Nơi lưu giữ những thông tin quan trọng nhất của các Boss 🐾
            </p>
          </div>
          <button
            onClick={() => { setForm(initialForm); setEditingPet(null); setView('form'); }}
            className="flex items-center gap-4 px-10 py-6 bg-gray-900 text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] shadow-2xl shadow-gray-200 hover:bg-orange-600 hover:-translate-y-2 transition-all active:scale-95 group"
          >
            <Plus size={20} className="group-hover:rotate-90 transition-transform" /> THÊM BOSS MỚI
          </button>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-32 space-y-6">
            <LoadingSpinner size="xl" color="orange" />
            <p className="text-[10px] font-black text-orange-500 uppercase tracking-[0.4em] animate-pulse">ĐANG GỌI TÊN CÁC BOSS…</p>
          </div>
        ) : pets.length === 0 ? (
          <div className="text-center py-24 bg-white/60 backdrop-blur-md rounded-[4rem] border border-white shadow-2xl shadow-gray-200/50 relative overflow-hidden group animate-in zoom-in duration-700">
            <div className="absolute top-0 right-0 w-40 h-40 bg-orange-50 rounded-full blur-3xl -mr-20 -mt-20 opacity-50"></div>
            <div className="w-32 h-32 bg-gray-50 rounded-[3rem] flex items-center justify-center mx-auto mb-10 group-hover:bg-orange-50 transition-colors duration-500 relative">
               <PawPrint size={64} className="text-gray-200 group-hover:text-orange-200 transition-colors" />
               <div className="absolute -top-2 -right-2 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-md animate-bounce">
                  <Heart size={20} className="text-orange-400 fill-orange-400" />
               </div>
            </div>
            <h3 className="text-3xl font-black text-gray-900 uppercase tracking-tighter mb-4 leading-none italic">CHƯA CÓ BOSS NÀO NHỈ?</h3>
            <p className="text-gray-400 font-bold text-[10px] uppercase tracking-[0.2em] mb-12 max-w-sm mx-auto leading-relaxed">
               Hãy thêm profile cho thú cưng để chúng tớ phục vụ các Boss chuyên nghiệp hơn nhé!
            </p>
            <button
              onClick={() => { setForm(initialForm); setEditingPet(null); setView('form'); }}
              className="px-12 py-6 bg-orange-600 text-white rounded-[2.5rem] font-black text-xs uppercase tracking-[0.3em] shadow-2xl shadow-orange-100 hover:bg-gray-900 hover:-translate-y-2 transition-all relative z-10 group/cta"
            >
              THÊM BOSS ĐẦU TIÊN <ArrowRight size={18} className="inline ml-2 group-hover/cta:translate-x-1 transition-transform" />
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {pets.map((pet, index) => {
              const PetIcon = getPetIcon(pet.loaiPet);
              return (
                <div
                  key={pet.idPet}
                  onClick={() => openDetail(pet)}
                  className="bg-white rounded-[3.5rem] shadow-2xl shadow-gray-200/40 p-8 border border-white hover:shadow-orange-100 hover:-translate-y-4 transition-all duration-700 group cursor-pointer animate-in fade-in slide-in-from-bottom-10 fill-mode-both overflow-hidden relative"
                  style={{ animationDelay: `${index * 150}ms` }}
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-orange-50/50 rounded-bl-full opacity-20 group-hover:scale-125 transition-transform duration-1000 -mr-10 -mt-10 pointer-events-none"></div>
                  
                  <div className="h-56 bg-gray-50 rounded-[2.5rem] flex items-center justify-center relative mb-8 overflow-hidden border-4 border-white shadow-inner">
                    {pet.anhPet ? (
                      <img src={pet.anhPet} alt={pet.tenPet} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-orange-50/30 group-hover:bg-orange-50 transition-colors">
                        <PetIcon size={64} className="text-orange-200 group-hover:text-orange-300 transition-all group-hover:scale-110" />
                      </div>
                    )}
                    <div className="absolute top-4 right-4 group-hover:translate-x-2 group-hover:-translate-y-2 opacity-0 group-hover:opacity-100 transition-all duration-500">
                       <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center shadow-lg transform rotate-12">
                         <Heart size={20} className="text-orange-600 fill-orange-600" />
                       </div>
                    </div>
                  </div>

                  <div className="px-2">
                    <div className="flex items-center justify-between gap-4 mb-2">
                       <h3 className="font-black text-gray-900 text-2xl uppercase tracking-tighter leading-none group-hover:text-orange-600 transition-colors truncate">
                         {pet.tenPet}
                       </h3>
                       <span className="shrink-0 px-3 py-1 bg-gray-50 text-gray-400 group-hover:bg-orange-50 group-hover:text-orange-600 rounded-full text-[8px] font-black uppercase tracking-widest transition-all">
                         {pet.loaiPet}
                       </span>
                    </div>

                    <div className="flex items-center gap-3 text-[9px] font-black text-gray-300 uppercase tracking-widest mt-4 group-hover:text-gray-500 transition-colors">
                      {pet.giong && <span className="truncate">{pet.giong}</span>}
                      {pet.tuoi && (
                        <>
                          <span className="w-1 h-1 bg-gray-200 rounded-full"></span>
                          <span>{pet.tuoi} TUỔI</span>
                        </>
                      )}
                    </div>
                  </div>
                  
                  <div className="mt-8 pt-6 border-t border-gray-50 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-4 group-hover:translate-y-0">
                     <span className="text-[9px] font-black text-orange-600 uppercase tracking-widest">HỒ SƠ CHI TIẾT</span>
                     <ChevronRight size={18} className="text-orange-600" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={() => deleteMutation.mutate(petToDelete)}
        title="XÓA HỒ SƠ BOSS? 😿"
        message="Boss sẽ biến mất mãi mãi đó Sen ơi? Toàn bộ dữ liệu của Boss sẽ không thể phục hồi!"
        confirmText="XÓA BOSS NGAY"
        cancelText="GIỮ LẠI"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
      <ConfirmModal
        isOpen={isAlertModalOpen}
        onClose={() => setIsAlertModalOpen(false)}
        title={alertConfig.title}
        message={alertConfig.message}
        variant="warning"
        confirmText="ĐÃ HIỂU"
      />
    </div>
  );
}

function PremiumInfoRow({ icon: Icon, label, value, className = "" }) {
  return (
    <div className={`group/row flex items-center gap-6 p-6 bg-gray-50/50 rounded-[2rem] border border-transparent hover:border-orange-100 hover:bg-white transition-all duration-300 ${className}`}>
      <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm text-gray-400 group-hover/row:bg-orange-600 group-hover/row:text-white transition-all transform group-hover/row:rotate-6">
        <Icon size={28} />
      </div>
      <div>
        <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em] mb-1">{label}</p>
        <p className="text-lg font-black text-gray-900 uppercase tracking-tighter leading-none group-hover/row:text-orange-600 transition-colors">{value}</p>
      </div>
    </div>
  );
}
