import api from './api';

export const appointmentService = {
  // Get all appointments
  getAll: async (params = {}) => {
    const response = await api.get('/appointments', { params });
    return response.data;
  },

  // Get appointment by ID
  getById: async (id) => {
    const response = await api.get(`/appointments/${id}`);
    return response.data;
  },

  // Book appointment
  book: async (appointmentData) => {
    const response = await api.post('/appointments', appointmentData);
    return response.data;
  },

  // Cancel appointment
  cancel: async (id) => {
    const response = await api.put(`/appointments/${id}/status`, { status: 'cancelled' });
    return response.data;
  },

  // Get doctor schedule
  getDoctorSchedule: async (doctorId, date) => {
    const response = await api.get(`/doctors/${doctorId}/schedule`, {
      params: { date },
    });
    return response.data;
  },

  // Get available slots
  getAvailableSlots: async (doctorId, date) => {
    const response = await api.get(`/appointments/available-slots`, {
      params: { doctorId, date },
    });
    return response.data;
  },
};

export default appointmentService;

