import apiClient from './apiClient';

/**
 * VoiceBack Voice Profiles API Service
 */
export const voiceService = {
  getVoiceProfiles: async () => {
    try {
      const response = await apiClient.get('/voice-profiles');
      return response.data?.data || [];
    } catch (error) {
      console.warn('Failed to fetch voice profiles:', error.message);
      return [];
    }
  },

  createVoiceProfile: async (payload) => {
    const response = await apiClient.post('/voice-profiles', payload);
    return response.data;
  },
};

export default voiceService;
