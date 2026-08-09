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

  /**
   * Upload clean voice sample recording and trigger ElevenLabs Instant Voice Cloning
   * @param {FormData} formData - Contains 'audioSample', 'patientId', 'voiceName'
   */
  uploadAndCloneVoice: async (formData) => {
    const response = await apiClient.post('/voice-profiles/clone-voice', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 90000, // 90s timeout for audio upload and cloning
    });
    return response.data;
  },

  /**
   * Synthesize text in patient's cloned voice using eleven_v3
   * @param {Object} params - { patientId, text, language, emotion }
   * @returns {Promise<Blob>} Audio Blob for playback
   */
  synthesizeSpeech: async ({ patientId, text, language, emotion }) => {
    const response = await apiClient.post(
      '/voice-profiles/synthesize',
      { patientId, text, language, emotion },
      {
        responseType: 'blob',
        timeout: 45000,
      }
    );
    return response.data;
  },
  /**
   * Check whether Web Speech API (SpeechSynthesis) is available in browser
   * @returns {boolean}
   */
  isSpeechSynthesisSupported: () => {
    return typeof window !== 'undefined' && 'speechSynthesis' in window;
  },
};

export default voiceService;
