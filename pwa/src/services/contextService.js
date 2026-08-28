import apiClient from './apiClient';

/**
 * VoiceBack Context Service (Phase C)
 * Frontend API client for dynamic response option generation and semantic intent submission.
 */
export const contextService = {
  /**
   * Request dynamic context options for a caregiver question
   * @param {Object} params - { caregiverQuestion: string, language: 'en'|'kn'|'hi' }
   * @returns {Promise<Object>} Response object containing options array and metadata
   */
  generateOptions: async ({ caregiverQuestion, language = 'en' }) => {
    try {
      const response = await apiClient.post('/context/generate-options', {
        caregiverQuestion,
        language
      });
      return response.data?.data || { question: caregiverQuestion, language, options: [] };
    } catch (error) {
      console.warn('Failed to generate dynamic context options:', error.message);
      // Client-side fallback if backend call fails completely
      return {
        question: caregiverQuestion,
        language,
        intentContext: 'client_fallback',
        options: [
          { id: 'opt_yes', intent: 'YES', text: language === 'kn' ? 'ಹೌದು' : language === 'hi' ? 'हाँ' : 'Yes' },
          { id: 'opt_no', intent: 'NO', text: language === 'kn' ? 'ಇಲ್ಲ' : language === 'hi' ? 'नहीं' : 'No' },
          { id: 'opt_unsure', intent: 'UNSURE', text: language === 'kn' ? 'ನನಗೆ ಗೊತ್ತಿಲ್ಲ' : language === 'hi' ? 'मुझे नहीं पता' : "I don't know" },
          { id: 'opt_repeat', intent: 'REPEAT', text: language === 'kn' ? 'ದಯವಿಟ್ಟು ಇನ್ನೊಮ್ಮೆ ಹೇಳಿ' : language === 'hi' ? 'कृपया दोबारा कहें' : 'Please repeat' },
          { id: 'opt_help', intent: 'HELP', text: language === 'kn' ? 'ನನಗೆ ಸಹಾಯ ಬೇಕು' : language === 'hi' ? 'मुझे मदद चाहिए' : 'I need help' }
        ]
      };
    }
  },

  /**
   * Submit selected semantic intent or inferred EMG intent
   * @param {Object} payload - { patientId, semanticIntent, responseText, language, confidence, caregiverQuestion }
   * @returns {Promise<Object>} Submitted intent record
   */
  submitIntent: async (payload) => {
    try {
      const response = await apiClient.post('/context/submit-intent', payload);
      return response.data;
    } catch (error) {
      console.warn('Failed to submit semantic intent:', error.message);
      return { success: false, error: error.message };
    }
  }
};

export default contextService;
