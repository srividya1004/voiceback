import apiClient from './apiClient';

/**
 * VoiceBack Communication History API Service
 */
export const communicationService = {
  getHistory: async () => {
    try {
      const response = await apiClient.get('/communication-history');
      return response.data?.data || [];
    } catch (error) {
      console.warn('Failed to fetch communication history:', error.message);
      return [];
    }
  },

  createLog: async (logData) => {
    const response = await apiClient.post('/communication-history', logData);
    return response.data;
  },
};

export default communicationService;
