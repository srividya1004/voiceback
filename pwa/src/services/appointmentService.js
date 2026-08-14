import apiClient from './apiClient';

/**
 * VoiceBack Appointment API Service
 */
export const appointmentService = {
  getAppointments: async () => {
    try {
      const response = await apiClient.get('/appointments');
      return response.data?.data || [];
    } catch (error) {
      console.warn('Failed to fetch appointments:', error.message);
      return [];
    }
  },

  createAppointment: async (payload) => {
    const response = await apiClient.post('/appointments', payload);
    return response.data;
  },

  updateAppointment: async (id, payload) => {
    const response = await apiClient.put(`/appointments/${id}`, payload);
    return response.data;
  },
};

export default appointmentService;
