/**
 * VoiceProfile Controller
 * Handles HTTP request/response orchestration for Patient TTS audio synthesis profiles using VoiceProfile Service.
 */

const voiceProfileService = require('../services/voiceProfileService');
const elevenLabsService = require('../services/elevenLabsService');
const { Patient } = require('../models');
const { sendSuccess, sendError } = require('../utils/responseFormatter');

/**
 * Create a new VoiceProfile record
 * @route POST /api/voice-profiles
 */
const createVoiceProfile = async (req, res) => {
  try {
    const voiceProfile = await voiceProfileService.create(req.body);
    return sendSuccess(res, 201, 'Voice profile created successfully', voiceProfile);
  } catch (error) {
    if (error.name === 'ValidationError') {
      return sendError(res, 400, 'Validation Error', error.errors);
    }
    return sendError(res, 500, 'Failed to create voice profile', error.message);
  }
};

/**
 * Retrieve all VoiceProfile records
 * @route GET /api/voice-profiles
 */
const getAllVoiceProfiles = async (req, res) => {
  try {
    const voiceProfiles = await voiceProfileService.getAll();
    return sendSuccess(res, 200, 'Voice profiles retrieved successfully', voiceProfiles);
  } catch (error) {
    return sendError(res, 500, 'Failed to retrieve voice profiles', error.message);
  }
};

/**
 * Retrieve a single VoiceProfile by ObjectId
 * @route GET /api/voice-profiles/:id
 */
const getVoiceProfileById = async (req, res) => {
  try {
    const { id } = req.params;
    const voiceProfile = await voiceProfileService.getById(id);
    return sendSuccess(res, 200, 'Voice profile retrieved successfully', voiceProfile);
  } catch (error) {
    if (error.message.includes('Invalid')) {
      return sendError(res, 400, error.message);
    }
    if (error.message.includes('not found')) {
      return sendError(res, 404, error.message);
    }
    return sendError(res, 500, 'Failed to retrieve voice profile', error.message);
  }
};

/**
 * Update a VoiceProfile record by ObjectId
 * @route PUT /api/voice-profiles/:id
 */
const updateVoiceProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const voiceProfile = await voiceProfileService.update(id, req.body);
    return sendSuccess(res, 200, 'Voice profile updated successfully', voiceProfile);
  } catch (error) {
    if (error.name === 'ValidationError' || error.message.includes('Invalid')) {
      return sendError(res, 400, error.message, error.errors);
    }
    if (error.message.includes('not found')) {
      return sendError(res, 404, error.message);
    }
    return sendError(res, 500, 'Failed to update voice profile', error.message);
  }
};

/**
 * Delete a VoiceProfile record by ObjectId
 * @route DELETE /api/voice-profiles/:id
 */
const deleteVoiceProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const voiceProfile = await voiceProfileService.delete(id);
    return sendSuccess(res, 200, 'Voice profile deleted successfully', voiceProfile);
  } catch (error) {
    if (error.message.includes('Invalid')) {
      return sendError(res, 400, error.message);
    }
    if (error.message.includes('not found')) {
      return sendError(res, 404, error.message);
    }
    return sendError(res, 500, 'Failed to delete voice profile', error.message);
  }
};

/**
 * Handle Patient Voice Sample Upload & ElevenLabs Instant Voice Cloning
 * @route POST /api/voice-profiles/clone-voice
 */
const cloneVoiceSample = async (req, res) => {
  try {
    if (!req.file) {
      return sendError(res, 400, 'Audio sample file is required for voice cloning.');
    }

    const { patientId, voiceName } = req.body;
    let targetPatientId = patientId;

    // If patientId not provided, search for first patient or create/link default
    if (!targetPatientId) {
      const firstPatient = await Patient.findOne();
      if (firstPatient) {
        targetPatientId = firstPatient._id;
      }
    }

    if (!targetPatientId) {
      return sendError(res, 400, 'Patient ID is required for voice cloning.');
    }

    // Call ElevenLabs IVC Service (automatically cleans up local temp file)
    const voiceId = await elevenLabsService.createInstantVoiceClone({
      voiceName: voiceName || `VoiceBack_Patient_${targetPatientId}`,
      audioFilePath: req.file.path,
    });

    // Update or create VoiceProfile for this patient
    const voiceProfile = await voiceProfileService.updateOrCreateByPatientId(targetPatientId, {
      voiceId,
      status: 'Ready',
      lastClonedAt: new Date(),
    });

    return sendSuccess(res, 200, 'Voice profile cloned successfully', {
      _id: voiceProfile._id,
      patientId: voiceProfile.patientId,
      status: voiceProfile.status,
      lastClonedAt: voiceProfile.lastClonedAt,
    });
  } catch (error) {
    return sendError(res, 500, 'Failed to clone patient voice sample', error.message);
  }
};

/**
 * Handle Text-to-Speech Synthesis in Patient's Cloned Voice using eleven_v3
 * @route POST /api/voice-profiles/synthesize
 */
const synthesizeSpeech = async (req, res) => {
  try {
    const { patientId, voiceId, text, language, emotion } = req.body;

    if (!text || !text.trim()) {
      return sendError(res, 400, 'Text parameter is required for speech synthesis.');
    }

    let targetVoiceId = voiceId || null;
    let patientGender = req.body.gender || 'female';
    let patientAgeGroup = req.body.ageGroup || 'adult';

    if (!targetVoiceId && patientId) {
      try {
        const patientDoc = await Patient.findById(patientId);
        if (patientDoc) {
          if (patientDoc.gender) patientGender = patientDoc.gender;
          if (patientDoc.age) {
            patientAgeGroup = patientDoc.age < 18 ? 'child' : patientDoc.age < 35 ? 'young' : patientDoc.age > 60 ? 'senior' : 'adult';
          }
        }

        const profile = await voiceProfileService.getByPatientId(patientId);
        if (profile && profile.voiceId && profile.status === 'Ready') {
          targetVoiceId = profile.voiceId;
        }
      } catch (dbErr) {
        console.warn(`ℹ️ VoiceProfile/Patient lookup skipped for patientId "${patientId}": ${dbErr.message}`);
      }
    }

    // Resolve target voice ID based on patient profile (IVC custom voice -> age/gender natural premade pool)
    targetVoiceId = elevenLabsService.resolveProfileVoiceId({
      customVoiceId: targetVoiceId,
      gender: patientGender,
      ageGroup: patientAgeGroup,
    });



    // Call ElevenLabs TTS Service (returns MP3 Buffer)
    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
      res.setHeader('X-Voice-Provider', 'native_speech_fallback');
      return res.status(200).json({
        success: true,
        provider: 'native_speech_fallback',
        message: 'ElevenLabs API key is unconfigured. Client will fall back to native speech provider.'
      });
    }

    const audioBuffer = await elevenLabsService.generateSpeech({
      voiceId: targetVoiceId,
      text,
      language: language || 'English',
      emotion: emotion || 'neutral',
    });

    res.setHeader('X-Voice-Provider', 'elevenlabs_ivc');
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Content-Length', audioBuffer.length);
    res.setHeader('Accept-Ranges', 'bytes');
    return res.status(200).send(audioBuffer);
  } catch (error) {
    console.warn(`ℹ️ ElevenLabs TTS notice (${error.message}) — triggering client fallback.`);
    res.setHeader('X-Voice-Provider', 'native_speech_fallback');
    return res.status(200).json({
      success: true,
      provider: 'native_speech_fallback',
      message: `ElevenLabs TTS notice: ${error.message}`
    });
  }
};

/**
 * Handle Patient Speech Audio Transcription using ElevenLabs Scribe v2
 * @route POST /api/voice-profiles/transcribe
 */
const transcribeSpeech = async (req, res) => {
  try {
    if (!req.file) {
      return sendError(res, 400, 'Audio sample file is required for speech-to-text transcription.');
    }

    const { language } = req.body;
    const transcript = await elevenLabsService.transcribeSpeech({
      audioFilePath: req.file.path,
      language: language || 'kn'
    });

    return sendSuccess(res, 200, 'Speech transcribed successfully', {
      text: transcript,
    });
  } catch (error) {
    return sendError(res, 500, 'Speech recognition failed', error.message);
  }
};

module.exports = {
  create: createVoiceProfile,
  getAll: getAllVoiceProfiles,
  getById: getVoiceProfileById,
  update: updateVoiceProfile,
  delete: deleteVoiceProfile,
  cloneVoiceSample,
  synthesizeSpeech,
  transcribeSpeech,
};

