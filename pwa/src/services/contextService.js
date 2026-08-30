import apiClient from './apiClient';
import { generateDynamicResponses } from '../components/ConversationModeModule';

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
      const dynamicChoices = generateDynamicResponses(caregiverQuestion, language === 'kn' ? 'Kannada' : language === 'hi' ? 'Hindi' : 'English');
      return {
        question: caregiverQuestion,
        language,
        intentContext: 'dynamic_fallback',
        options: dynamicChoices.map((choiceText, index) => ({
          id: `opt_${index + 1}`,
          intent: `INTENT_${index + 1}`,
          text: choiceText
        }))
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
