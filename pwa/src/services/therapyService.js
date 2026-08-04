import apiClient from './apiClient';

/**
 * VoiceBack Therapy Progress API Service
 */
export const therapyService = {
  getTherapyProgress: async () => {
    try {
      const response = await apiClient.get('/therapy-progress');
      return response.data?.data || [];
    } catch (error) {
      console.warn('Failed to fetch therapy progress:', error.message);
      return [];
    }
  },

  createTherapySession: async (payload) => {
    const response = await apiClient.post('/therapy-progress', payload);
    return response.data;
  },
};

export default therapyService;
