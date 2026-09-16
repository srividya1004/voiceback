import apiClient from './apiClient';

/**
 * VoiceBack Hear-Yourself Script Training API Service
 */
export const scriptService = {
  /**
   * Retrieve active personal scripts for a patient
   * @param {String} patientId
   * @returns {Promise<Array>}
   */
  getScripts: async (patientId) => {
    try {
      const response = await apiClient.get(`/scripts/${patientId}`);
      return response.data?.data || [];
    } catch (error) {
      console.warn('Failed to fetch personal scripts:', error.message);
      return [];
    }
  },

  /**
   * Create a new personal script
   * @param {String} patientId
   * @param {String} text
   * @param {String} [category]
   * @returns {Promise<Object>}
   */
  createScript: async (patientId, text, category = 'general') => {
    const response = await apiClient.post('/scripts', {
      patientId,
      text,
      category,
    });
    return response.data?.data || response.data;
  },

  /**
   * Soft-deactivate a personal script
   * @param {String} scriptId
   * @returns {Promise<Object>}
   */
  deleteScript: async (scriptId) => {
    const response = await apiClient.delete(`/scripts/${scriptId}`);
    return response.data?.data || response.data;
  },

  /**
   * Submit recorded practice audio attempt for analysis and voice playback
   * @param {String} scriptId
   * @param {Blob} audioBlob
   * @returns {Promise<Object>} Returns { rawTranscript, reconstructedText, closenessScore, audioBase64, isClonedVoice }
   */
  submitAttempt: async (scriptId, audioBlob) => {
    const formData = new FormData();
    formData.append('audioSample', audioBlob, 'patient_attempt.webm');

    const response = await apiClient.post(`/scripts/${scriptId}/attempt`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 60000,
    });

    return response.data?.data || response.data;
  },
};

export default scriptService;
