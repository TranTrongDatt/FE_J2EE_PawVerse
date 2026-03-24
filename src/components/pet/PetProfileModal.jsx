import { useState, useEffect } from 'react';
import { X, PawPrint, Plus, Pencil, Trash2, Dog, Cat } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import petService from '../../api/petService';
import useAuthStore from '../../store/useAuthStore';

const PET_TYPES = ['Chó', 'Mèo', 'Hamster', 'Thỏ', 'Chim', 'Khác'];
const GENDERS = ['Đực', 'Cái'];

export default function PetProfileModal({ isOpen, onClose, editPet = null }) {
  const { isAuthenticated } = useAuthStore();
  const queryClient = useQueryClient();
  const [view, setView] = useState(editPet ? 'form' : 'list');
  const [selectedPet, setSelectedPet] = useState(editPet);
  const [form, setForm] = useState({
    tenPet: '',
    loaiPet: '',
    giong: '',
    tuoi: '',
    gioiTinh: '',
    canNang: '',
  });

  const { data: petsData, isLoading } = useQuery({
    queryKey: ['myPets'],
    queryFn: () => petService.getMyPets(),
    enabled: isOpen && isAuthenticated,
    select: (res) => res.data?.data || [],
  });

  const pets = petsData || [];

  useEffect(() => {
    if (editPet) {
      setView('form');
      setSelectedPet(editPet);
      setForm({
        tenPet: editPet.tenPet || '',
        loaiPet: editPet.loaiPet || '',
        giong: editPet.giong || '',
        tuoi: editPet.tuoi || '',
        gioiTinh: editPet.gioiTinh || '',
        canNang: editPet.canNang || '',
      });
    } else {
      setView('list');
      resetForm();
    }
  }, [editPet, isOpen]);

  const resetForm = () => {
    setForm({ tenPet: '', loaiPet: '', giong: '', tuoi: '', gioiTinh: '', canNang: '' });
    setSelectedPet(null);
  };

  const createMutation = useMutation({
    mutationFn: (data) => petService.createPet(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myPets'] });
      resetForm();
      setView('list');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ petId, data }) => petService.updatePet(petId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myPets'] });
      resetForm();
      setView('list');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (petId) => petService.deletePet(petId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myPets'] });
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      ...form,
      tuoi: form.tuoi ? parseInt(form.tuoi) : null,
      canNang: form.canNang ? parseFloat(form.canNang) : null,
    };
    if (selectedPet) {
      updateMutation.mutate({ petId: selectedPet.idPet, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleEdit = (pet) => {
    setSelectedPet(pet);
    setForm({
      tenPet: pet.tenPet || '',
      loaiPet: pet.loaiPet || '',
      giong: pet.giong || '',
      tuoi: pet.tuoi || '',
      gioiTinh: pet.gioiTinh || '',
      canNang: pet.canNang || '',
    });
    setView('form');
  };

  const handleDelete = (petId) => {
    if (window.confirm('Bạn có chắc muốn xóa profile thú cưng này?')) {
      deleteMutation.mutate(petId);
    }
  };

  const getPetIcon = (loaiPet) => {
    if (loaiPet === 'Chó') return Dog;
    if (loaiPet === 'Mèo') return Cat;
    return PawPrint;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b bg-gradient-to-r from-primary-50 to-primary-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center">
              <PawPrint size={20} className="text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-800">
                {view === 'form' ? (selectedPet ? 'Chỉnh sửa thú cưng' : 'Thêm thú cưng mới') : 'Thú cưng của tôi'}
              </h2>
              <p className="text-xs text-gray-500">Quản lý profile thú cưng</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {view === 'list' ? (
            <div>
              {isLoading ? (
                <div className="text-center py-8 text-gray-500">Đang tải...</div>
              ) : pets.length === 0 ? (
                <div className="text-center py-12">
                  <PawPrint size={48} className="mx-auto text-gray-300 mb-3" />
                  <p className="text-gray-500 mb-1">Bạn chưa có profile thú cưng nào</p>
                  <p className="text-sm text-gray-400">Thêm thú cưng để đặt lịch dịch vụ nhanh hơn</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pets.map((pet) => {
                    const Icon = getPetIcon(pet.loaiPet);
                    return (
                      <div key={pet.idPet} className="flex items-center gap-4 p-4 border border-gray-200 rounded-xl hover:border-primary-300 transition group">
                        <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center flex-shrink-0">
                          <Icon size={24} className="text-primary-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-800 truncate">{pet.tenPet}</h3>
                          <p className="text-sm text-gray-500">
                            {pet.loaiPet}
                            {pet.giong && ` · ${pet.giong}`}
                            {pet.tuoi && ` · ${pet.tuoi} tuổi`}
                            {pet.gioiTinh && ` · ${pet.gioiTinh}`}
                          </p>
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                          <button onClick={() => handleEdit(pet)} className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition">
                            <Pencil size={16} />
                          </button>
                          <button onClick={() => handleDelete(pet.idPet)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <button
                onClick={() => { resetForm(); setView('form'); }}
                className="w-full mt-4 py-3 border-2 border-dashed border-primary-300 text-primary-600 rounded-xl hover:bg-primary-50 transition font-medium flex items-center justify-center gap-2"
              >
                <Plus size={18} />
                Thêm thú cưng mới
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Tên thú cưng */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tên thú cưng *</label>
                <input
                  type="text"
                  value={form.tenPet}
                  onChange={(e) => setForm({ ...form, tenPet: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="VD: Miu, Lucky..."
                  required
                />
              </div>

              {/* Loại thú cưng */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Loại thú cưng *</label>
                <select
                  value={form.loaiPet}
                  onChange={(e) => setForm({ ...form, loaiPet: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  required
                >
                  <option value="">Chọn loại</option>
                  {PET_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Giống */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Giống</label>
                  <input
                    type="text"
                    value={form.giong}
                    onChange={(e) => setForm({ ...form, giong: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="VD: Poodle, Munchkin..."
                  />
                </div>

                {/* Giới tính */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Giới tính</label>
                  <select
                    value={form.gioiTinh}
                    onChange={(e) => setForm({ ...form, gioiTinh: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="">Chọn</option>
                    {GENDERS.map((g) => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Tuổi */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tuổi</label>
                  <input
                    type="number"
                    min="0"
                    max="30"
                    value={form.tuoi}
                    onChange={(e) => setForm({ ...form, tuoi: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="VD: 2"
                  />
                </div>

                {/* Cân nặng */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cân nặng (kg)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={form.canNang}
                    onChange={(e) => setForm({ ...form, canNang: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="VD: 5.5"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { resetForm(); setView('list'); }}
                  className="flex-1 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
                >
                  Quay lại
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="flex-1 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition font-medium disabled:opacity-50"
                >
                  {(createMutation.isPending || updateMutation.isPending) ? 'Đang lưu...' : (selectedPet ? 'Cập nhật' : 'Thêm thú cưng')}
                </button>
              </div>

              {(createMutation.isError || updateMutation.isError) && (
                <p className="text-red-500 text-sm text-center">
                  {createMutation.error?.response?.data?.message || updateMutation.error?.response?.data?.message || 'Có lỗi xảy ra'}
                </p>
              )}
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
