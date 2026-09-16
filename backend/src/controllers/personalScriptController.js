/**
 * PersonalScript Controller
 * Orchestrates HTTP request/response for Hear-Yourself Script Training
 */

const fs = require('fs');
const personalScriptService = require('../services/personalScriptService');
const therapyProgressService = require('../services/therapyProgressService');
const voiceProfileService = require('../services/voiceProfileService');
const elevenLabsService = require('../services/elevenLabsService');
const cartesiaService = require('../services/cartesiaService');
const contextEngineService = require('../services/contextEngineService');
const { calculateCloseness } = require('../utils/closenessScorer');
const { sendSuccess, sendError } = require('../utils/responseFormatter');
const Patient = require('../models/Patient');
const Caregiver = require('../models/Caregiver');
const Doctor = require('../models/Doctor');

/**
 * Replicate existing patient access authorization pattern
 * @param {Object} user - Authenticated user from req.user
 * @param {String} patientId - Target patient ObjectId
 * @returns {Promise<Boolean>}
 */
const authorizeUserForPatient = async (user, patientId) => {
  if (!user || !user.id || !user.role) {
    return false;
  }

  const role = user.role.toLowerCase();
  const patient = await Patient.findById(patientId);
  if (!patient) {
    return false;
  }

  if (role === 'patient') {
    const userIdStr = user.id.toString();
    const isOwner = (patient.userId && patient.userId.toString() === userIdStr) ||
      (patient._id && patient._id.toString() === userIdStr) ||
      (patient.email && user.email && patient.email.toLowerCase() === user.email.toLowerCase());
    return Boolean(isOwner);
  }

  if (role === 'caregiver') {
    const caregiver = await Caregiver.findOne({
      $or: [
        { userId: user.id },
        { email: user.email ? user.email.toLowerCase() : null }
      ]
    });
    if (!caregiver) return false;

    const isAssigned = (Array.isArray(caregiver.assignedPatients) &&
      caregiver.assignedPatients.some((pId) => pId.toString() === patientId.toString())) ||
      (patient.assignedCaregiverId && patient.assignedCaregiverId.toString() === caregiver._id.toString());

    return Boolean(isAssigned);
  }

  if (role === 'doctor') {
    const doctor = await Doctor.findOne({
      $or: [
        { userId: user.id },
        { email: user.email ? user.email.toLowerCase() : null }
      ]
    });
    if (!doctor) return false;

    const isAssigned = patient.assignedDoctorId &&
      patient.assignedDoctorId.toString() === doctor._id.toString();

    return Boolean(isAssigned);
  }

  return false;
};

/**
 * POST /api/scripts
 * Create a new personal script for an authorized patient
 */
const createScript = async (req, res) => {
  try {
    const { patientId, text, category } = req.body;

    if (!patientId) {
      return sendError(res, 400, 'Patient ID is required.');
    }

    if (!text || typeof text !== 'string' || !text.trim()) {
      return sendError(res, 400, 'Script text is required and cannot be empty.');
    }

    const isAuthorized = await authorizeUserForPatient(req.user, patientId);
    if (!isAuthorized) {
      return sendError(res, 403, 'Unauthorized: You do not have permission to create scripts for this patient.');
    }

    const createdBy = {
      role: req.user.role.toLowerCase(),
      userId: req.user.id
    };

    const script = await personalScriptService.createScript({
      patientId,
      text: text.trim(),
      category: category || 'general',
      createdBy
    });

    return sendSuccess(res, 201, 'Personal script created successfully', script);
  } catch (error) {
    if (error.name === 'ValidationError') {
      return sendError(res, 400, 'Validation Error', error.errors);
    }
    return sendError(res, 500, 'Failed to create personal script', error.message);
  }
};

/**
 * GET /api/scripts/:patientId
 * Retrieve active personal scripts for an authorized patient
 */
const getScriptsByPatient = async (req, res) => {
  try {
    const { patientId } = req.params;

    if (!patientId) {
      return sendError(res, 400, 'Patient ID is required.');
    }

    const isAuthorized = await authorizeUserForPatient(req.user, patientId);
    if (!isAuthorized) {
      return sendError(res, 403, 'Unauthorized: You do not have permission to view scripts for this patient.');
    }

    const scripts = await personalScriptService.getScriptsByPatientId(patientId);
    return sendSuccess(res, 200, 'Personal scripts retrieved successfully', scripts);
  } catch (error) {
    if (error.message.includes('Invalid')) {
      return sendError(res, 400, error.message);
    }
    return sendError(res, 500, 'Failed to retrieve personal scripts', error.message);
  }
};

/**
 * DELETE /api/scripts/:scriptId
 * Soft-deactivate a personal script after verifying patient authorization
 */
const deleteScript = async (req, res) => {
  try {
    const { scriptId } = req.params;

    if (!scriptId) {
      return sendError(res, 400, 'Script ID is required.');
    }

    const script = await personalScriptService.getScriptById(scriptId);
    if (!script || !script.isActive) {
      return sendError(res, 404, 'Personal script not found or already inactive.');
    }

    const isAuthorized = await authorizeUserForPatient(req.user, script.patientId);
    if (!isAuthorized) {
      return sendError(res, 403, 'Unauthorized: You do not have permission to delete this script.');
    }

    const deactivated = await personalScriptService.deactivateScript(scriptId);
    return sendSuccess(res, 200, 'Personal script deactivated successfully', deactivated);
  } catch (error) {
    if (error.message.includes('not found')) {
      return sendError(res, 404, error.message);
    }
    if (error.message.includes('Invalid')) {
      return sendError(res, 400, error.message);
    }
    return sendError(res, 500, 'Failed to deactivate personal script', error.message);
  }
};

/**
 * POST /api/scripts/:scriptId/attempt
 * Core feature: Process a patient's spoken practice attempt against a PersonalScript
 */
const submitScriptAttempt = async (req, res) => {
  const audioFile = req.file;

  try {
    const { scriptId } = req.params;

    if (!scriptId) {
      return sendError(res, 400, 'Script ID is required.');
    }

    // 1. Load PersonalScript
    const script = await personalScriptService.getScriptById(scriptId);
    if (!script || !script.isActive) {
      return sendError(res, 404, 'Personal script not found or is inactive.');
    }

    // 2. Authorize authenticated user for script.patientId
    const isAuthorized = await authorizeUserForPatient(req.user, script.patientId);
    if (!isAuthorized) {
      return sendError(res, 403, 'Unauthorized: You do not have permission to practice this script.');
    }

    // 3. Verify uploaded audio file exists
    if (!audioFile || !audioFile.path) {
      return sendError(res, 400, 'Practice audio sample file is required.');
    }

    // 4. Transcribe using existing ElevenLabs Scribe v2 STT
    let rawTranscript = '';
    try {
      rawTranscript = await elevenLabsService.transcribeSpeech({
        audioFilePath: audioFile.path,
        language: 'auto'
      });
    } catch (sttErr) {
      console.warn('⚠️ Script training STT notice:', sttErr.message);
      return sendError(res, 422, 'Could not transcribe speech from audio recording. Please try speaking again.');
    }

    const cleanRawTranscript = (rawTranscript || '').trim();
    if (!cleanRawTranscript) {
      return sendError(res, 422, 'No audible speech was detected in the recording. Please speak clearly into the microphone.');
    }

    // 5. Reconstruct intended sentence using existing contextEngineService.correctAphasicSpeech
    let reconstructedText = cleanRawTranscript;
    let detectedLanguage = 'en';

    try {
      const reconResult = await contextEngineService.correctAphasicSpeech({
        rawTranscript: cleanRawTranscript,
        context: script.text
      });

      if (reconResult && (reconResult.reconstructedText || reconResult.correctedText)) {
        reconstructedText = (reconResult.reconstructedText || reconResult.correctedText).trim();
      }
      if (reconResult && reconResult.language) {
        detectedLanguage = reconResult.language;
      }
    } catch (reconErr) {
      console.warn('⚠️ Script training reconstruction notice, falling back to raw transcript:', reconErr.message);
      reconstructedText = cleanRawTranscript;
    }

    // 6. Calculate closeness score between target PersonalScript.text and reconstructedText
    const closenessScore = calculateCloseness(script.text, reconstructedText);

    // 7. Resolve patient voice using existing patientId -> VoiceProfile -> resolveProfileVoiceId
    const patientDoc = await Patient.findById(script.patientId);
    const patientGender = patientDoc?.gender || 'female';
    const patientAgeGroup = patientDoc?.age ? elevenLabsService.resolveAgeGroup(patientDoc.age) : 'adult';

    let isClonedVoice = false;
    let customVoiceId = null;
    let profileDoc = null;

    try {
      const profile = await voiceProfileService.getByPatientId(script.patientId);
      if (profile && profile.voiceId && profile.status === 'Ready') {
        customVoiceId = profile.voiceId;
        profileDoc = profile;
        isClonedVoice = true;
      }
    } catch (profErr) {
      console.warn('Voice profile lookup notice for script attempt:', profErr.message);
    }

    const targetVoiceId = elevenLabsService.resolveProfileVoiceId({
      customVoiceId: isClonedVoice ? customVoiceId : null,
      gender: patientGender,
      ageGroup: patientAgeGroup
    });

    // 8. Generate TTS audio with strict authoritative provider check
    let audioBuffer = null;
    const normLang = detectedLanguage === 'kn' ? 'Kannada' : detectedLanguage === 'hi' ? 'Hindi' : 'English';

    const isCartesiaVoice = isClonedVoice && profileDoc?.voiceProvider === 'cartesia';
    let scriptVoiceProvider = isCartesiaVoice ? 'cartesia_tts' : (isClonedVoice ? 'elevenlabs_tts' : 'elevenlabs_demographic');

    try {
      if (isCartesiaVoice) {
        // Cartesia Voice ID MUST NEVER be sent to ElevenLabs
        audioBuffer = await cartesiaService.generateSpeech({
          voiceId: customVoiceId,
          text: reconstructedText,
          language: normLang,
          emotion: 'neutral'
        });
      } else {
        // ElevenLabs Voice ID MUST NEVER be sent to Cartesia
        audioBuffer = await elevenLabsService.generateSpeech({
          voiceId: targetVoiceId,
          text: reconstructedText,
          language: normLang,
          emotion: 'neutral'
        });
      }
    } catch (ttsErr) {
      console.warn('TTS notice during script training attempt, attempting fallback:', ttsErr.message);
      // On primary failure, honestly flip isClonedVoice to false
      isClonedVoice = false;
      try {
        audioBuffer = await elevenLabsService.fetchGoogleTtsAudioBuffer(reconstructedText, detectedLanguage);
        scriptVoiceProvider = 'google_neural_tts';
      } catch (fallbackErr) {
        console.warn('Fallback TTS notice:', fallbackErr.message);
        scriptVoiceProvider = 'none';
      }
    }

    if (!audioBuffer || audioBuffer.length === 0) {
      isClonedVoice = false;
      scriptVoiceProvider = 'none';
    }

    // 9. Save attempt to TherapyProgress
    try {
      await therapyProgressService.recordScriptAttempt({
        patientId: script.patientId,
        scriptId: script._id,
        attemptRawTranscript: cleanRawTranscript,
        attemptReconstructedText: reconstructedText,
        closenessScore
      });
    } catch (dbErr) {
      console.warn('Notice: Could not persist script training attempt to TherapyProgress:', dbErr.message);
    }

    // 10. Convert audio to Base64 data URL for single-delivery playback
    const audioBase64 = audioBuffer && audioBuffer.length > 0
      ? `data:audio/mpeg;base64,${audioBuffer.toString('base64')}`
      : null;

    return sendSuccess(res, 200, 'Script attempt processed successfully', {
      rawTranscript: cleanRawTranscript,
      reconstructedText,
      closenessScore,
      audioBase64,
      isClonedVoice: Boolean(audioBuffer && isClonedVoice),
      voiceProvider: audioBuffer ? scriptVoiceProvider : 'none'
    });
  } catch (error) {
    return sendError(res, 500, 'Failed to process script attempt', error.message);
  } finally {
    // 11. Privacy cleanup: Immediately delete temporary uploaded audio file from disk
    if (audioFile && audioFile.path) {
      try {
        if (fs.existsSync(audioFile.path)) {
          fs.unlinkSync(audioFile.path);
        }
      } catch (cleanupErr) {
        console.warn('Warning: Failed to cleanup temporary attempt audio file:', cleanupErr.message);
      }
    }
  }
};

module.exports = {
  createScript,
  getScriptsByPatient,
  deleteScript,
  submitScriptAttempt,
  authorizeUserForPatient
};
