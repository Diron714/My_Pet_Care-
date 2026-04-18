import api from './api';

export const petService = {
  // Get all pets (with filters)
  getAll: async (params = {}) => {
    const response = await api.get('/pets', { params });
    return response.data;
  },

  // Get pet by ID
  getById: async (id) => {
    const response = await api.get(`/pets/${id}`);
    return response.data;
  },

  // Get customer's pets
  getCustomerPets: async () => {
    const response = await api.get('/customer-pets');
    return response.data;
  },

  // Create customer pet profile
  createCustomerPet: async (petData) => {
    const response = await api.post('/customer-pets', petData);
    return response.data;
  },

  // Update customer pet profile
  updateCustomerPet: async (id, petData) => {
    const response = await api.put(`/customer-pets/${id}`, petData);
    return response.data;
  },

  // Delete customer pet profile
  deleteCustomerPet: async (id) => {
    const response = await api.delete(`/customer-pets/${id}`);
    return response.data;
  },

  // Get pet vaccinations
  getVaccinations: async (petId) => {
    const response = await api.get(`/customer-pets/${petId}/vaccinations`);
    return response.data;
  },

  // Add vaccination
  addVaccination: async (petId, vaccinationData) => {
    const response = await api.post(`/customer-pets/${petId}/vaccinations`, vaccinationData);
    return response.data;
  },

  // Get feeding schedules
  getFeedingSchedules: async (petId) => {
    const response = await api.get(`/customer-pets/${petId}/feeding-schedules`,);
    return response.data;
  },

  // Add feeding schedule
  addFeedingSchedule: async (petId, scheduleData) => {
    const response = await api.post(`/customer-pets/${petId}/feeding-schedules`, scheduleData);
    return response.data;
  },
};

export default petService;

