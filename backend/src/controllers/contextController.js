/**
 * VoiceBack Phase C - Context Controller
 * Handles HTTP request/response orchestration for dynamic context options generation
 * and patient / future EMG semantic intent submissions.
 */

const contextEngineService = require('../services/contextEngineService');
const communicationHistoryService = require('../services/communicationHistoryService');
const { sendSuccess, sendError } = require('../utils/responseFormatter');

/**
 * Generate dynamic response options for a caregiver question
 * @route POST /api/context/generate-options
 */
const generateOptions = async (req, res) => {
  try {
    const { caregiverQuestion, language = 'en' } = req.body || {};

    if (!caregiverQuestion || typeof caregiverQuestion !== 'string' || !caregiverQuestion.trim()) {
      return sendError(res, 400, 'caregiverQuestion is required and must be a non-empty string');
    }

    const result = await contextEngineService.generateResponseOptions({
      question: caregiverQuestion.trim(),
      language: (language || 'en').toLowerCase()
    });

    return sendSuccess(res, 200, 'Dynamic response options generated successfully', result);
  } catch (error) {
    console.error('Error in generateOptions:', error);
    return sendError(res, 500, 'Failed to generate context options', error.message);
  }
};

/**
 * Submit semantic intent selected by patient or inferred by future EMG
 * @route POST /api/context/submit-intent
 */
const submitIntent = async (req, res) => {
  try {
    const {
      patientId,
      semanticIntent,
      responseText,
      language = 'en',
      confidence = 1.0,
      caregiverQuestion = '',
      attemptType = 'ContextSelect'
    } = req.body || {};

    if (!patientId) {
      return sendError(res, 400, 'patientId is required');
    }

    if (!semanticIntent || !responseText) {
      return sendError(res, 400, 'semanticIntent and responseText are required');
    }

    // Persist event in CommunicationHistory database
    const historyData = {
      patientId,
      attemptType: ['ContextSelect', 'EMGInference'].includes(attemptType) ? attemptType : 'ContextSelect',
      recognizedText: responseText,
      confidenceScore: typeof confidence === 'number' ? confidence : 1.0,
      semanticIntent: (semanticIntent || '').toUpperCase(),
      language: ['en', 'kn', 'hi'].includes(language) ? language : 'en',
      caregiverQuestion: caregiverQuestion || ''
    };

    const historyRecord = await communicationHistoryService.create(historyData);

    return sendSuccess(res, 201, 'Semantic intent submitted and logged successfully', {
      semanticIntent: historyRecord.semanticIntent,
      responseText: historyRecord.recognizedText,
      language: historyRecord.language,
      patientId: historyRecord.patientId,
      recordId: historyRecord._id,
      timestamp: historyRecord.createdAt || historyRecord.timestamp
    });
  } catch (error) {
    console.error('Error in submitIntent:', error);
    if (error.name === 'ValidationError' || error.message.includes('Invalid')) {
      return sendError(res, 400, error.message, error.errors);
    }
    return sendError(res, 500, 'Failed to submit semantic intent', error.message);
  }
};

module.exports = {
  generateOptions,
  submitIntent
};
