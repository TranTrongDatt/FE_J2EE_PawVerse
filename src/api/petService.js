import api from './axios';

const petService = {
  getMyPets: () => api.get('/api/user/pets'),

  getPetById: (petId) => api.get(`/api/user/pets/${petId}`),

  createPet: (data) => api.post('/api/user/pets', data),

  updatePet: (petId, data) => api.put(`/api/user/pets/${petId}`, data),

  deletePet: (petId) => api.delete(`/api/user/pets/${petId}`),

  uploadPetAvatar: (petId, file) => {
    const formData = new FormData();
    formData.append('avatar', file);
    return api.post(`/api/user/pets/${petId}/avatar`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  deletePetAvatar: (petId) => api.delete(`/api/user/pets/${petId}/avatar`),
};

export default petService;
