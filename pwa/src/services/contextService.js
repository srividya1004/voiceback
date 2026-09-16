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
  },
  /**
   * Interpret and contextually correct aphasic patient speech
   * @param {Object} params - { rawTranscript, language, context, previousUtterance }
   * @returns {Promise<Object>} Reconstruction and confirmation payload
   */
  correctSpeech: async ({ rawTranscript, language = 'en', context = '', previousUtterance = '' }) => {
    return contextService.reconstructSpeech({ rawTranscript, language, context, previousUtterance });
  },

  /**
   * Conservative speech reconstruction, ambiguity detection, and clarification check
   * @param {Object} params - { rawTranscript, language, context, previousUtterance }
   * @returns {Promise<Object>} Full reconstruction metadata
   */
  reconstructSpeech: async ({ rawTranscript, language = 'en', context = '', previousUtterance = '' }) => {
    try {
      const response = await apiClient.post('/context/reconstruct-speech', {
        rawTranscript,
        language,
        context,
        previousUtterance
      });
      return response.data?.data || null;
    } catch (error) {
      console.warn('AI speech reconstruction notice:', error.message);
      return null;
    }
  },

  /**
   * Generate dynamic response after patient confirmation
   * @param {Object} params - { confirmedText, intent, entities, language, context }
   * @returns {Promise<Object>} { responseText, intent, entities, language }
   */
  generateDynamicResponse: async ({ confirmedText, intent, entities = {}, language = 'en', context = '' }) => {
    try {
      const response = await apiClient.post('/context/dynamic-response', {
        confirmedText,
        intent,
        entities,
        language,
        context
      });
      return response.data?.data || { responseText: confirmedText, intent, entities, language };
    } catch (error) {
      console.warn('Dynamic response generation notice:', error.message);
      return { responseText: confirmedText, intent, entities, language };
    }
  },

  /**
   * Process speech through the Python FastAPI Speech Intelligence Pipeline
   * @param {Object} params - { text, language, targetLanguage, context }
   */
  processWithPythonPipeline: async ({ text, language = 'en', targetLanguage = 'en', context = '' }) => {
    try {
      const response = await apiClient.post('/context/python-pipeline', {
        text,
        language,
        target_language: targetLanguage,
        context
      });
      return response.data?.data || response.data;
    } catch (error) {
      console.warn('Python pipeline notice:', error.message);
      return null;
    }
  }
};

export default contextService;

