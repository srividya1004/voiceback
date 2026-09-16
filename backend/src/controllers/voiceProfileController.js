/**
 * VoiceProfile Controller
 * Handles HTTP request/response orchestration for Patient TTS audio synthesis profiles using VoiceProfile Service.
 */

const mongoose = require('mongoose');
const axios = require('axios');
const voiceProfileService = require('../services/voiceProfileService');
const elevenLabsService = require('../services/elevenLabsService');
const cartesiaService = require('../services/cartesiaService');
const { authorizeUserForPatient } = require('./personalScriptController');
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
 * Retrieve all VoiceProfile records (or filter by patientId)
 * @route GET /api/voice-profiles
 */
const getAllVoiceProfiles = async (req, res) => {
  try {
    const { patientId } = req.query;
    if (patientId) {
      const voiceProfile = await voiceProfileService.getByPatientId(patientId);
      return sendSuccess(res, 200, 'Voice profile retrieved successfully', voiceProfile ? [voiceProfile] : []);
    }
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
 * Handle Patient Voice Sample Upload & Cartesia Instant Voice Cloning
 * @route POST /api/voice-profiles/clone-voice
 */
const cloneVoiceSample = async (req, res) => {
  let authorizedPatientId = null;
  let patientDoc = null;

  try {
    if (!req.file) {
      return sendError(res, 400, 'Audio sample file is required for voice cloning.');
    }

    // Safety Rule: Zero reliance on req.body.patientId as authorization identity.
    // Resolve target patient strictly from authenticated req.user identity.
    if (!req.user || !req.user.id || !req.user.role) {
      return sendError(res, 401, 'Authentication required. No authorized user identity found.');
    }

    const userRole = req.user.role.toLowerCase();

    if (userRole === 'patient') {
      // Patient user: target patient is strictly their own profile resolved by user identity
      patientDoc = await Patient.findOne({
        $or: [
          { userId: req.user.id },
          { _id: mongoose.Types.ObjectId.isValid(req.user.id) ? req.user.id : null },
          ...(req.user.email ? [{ email: req.user.email.toLowerCase() }] : [])
        ]
      });
      if (!patientDoc) {
        return sendError(res, 404, 'No patient profile found linked to authenticated user account.');
      }
      authorizedPatientId = patientDoc._id.toString();
    } else if (userRole === 'caregiver' || userRole === 'doctor') {
      // Clinical users: must provide target patientId that they are explicitly authorized for
      const targetId = req.body.patientId;
      if (!targetId || !mongoose.Types.ObjectId.isValid(targetId)) {
        return sendError(res, 400, 'A valid patientId is required for clinical voice cloning management.');
      }
      patientDoc = await Patient.findById(targetId);
      if (!patientDoc) {
        return sendError(res, 404, `Patient with ID "${targetId}" not found.`);
      }
      // Authorization check occurs before any VoiceProfile read/write or Cartesia API call
      const isAuthorized = await authorizeUserForPatient(req.user, targetId);
      if (!isAuthorized) {
        return sendError(res, 403, 'Forbidden. You are not authorized to manage voice profiles for this patient.');
      }
      authorizedPatientId = patientDoc._id.toString();
    } else {
      return sendError(res, 403, 'Forbidden. Role not permitted to perform voice cloning.');
    }

    const patientLang = (patientDoc.preferredLanguage || '').toLowerCase().trim();
    const cloneLang = (patientLang.includes('kan') || patientLang === 'kn') ? 'kn'
      : (patientLang.includes('hin') || patientLang === 'hi') ? 'hi' : 'en';

    // Call Cartesia IVC Service with patient's native language for authentic vocal prosody
    const voiceId = await cartesiaService.createInstantVoiceClone({
      voiceName: req.body.voiceName || `VoiceBack_${patientDoc.fullName ? patientDoc.fullName.replace(/\s+/g, '_') : 'Patient'}_${authorizedPatientId}`,
      audioFilePath: req.file.path,
      language: cloneLang,
    });

    // Update or create VoiceProfile with authoritative provider 'cartesia'
    const voiceProfile = await voiceProfileService.updateOrCreateByPatientId(authorizedPatientId, {
      voiceId,
      voiceProvider: 'cartesia',
      status: 'Ready',
      lastClonedAt: new Date(),
    });

    return sendSuccess(res, 200, 'Voice profile cloned successfully', {
      _id: voiceProfile._id,
      patientId: voiceProfile.patientId,
      voiceId: voiceProfile.voiceId,
      voiceProvider: voiceProfile.voiceProvider,
      status: voiceProfile.status,
      lastClonedAt: voiceProfile.lastClonedAt,
    });
  } catch (error) {
    // Safety Rule: Never overwrite or destroy an existing valid voice profile because a new clone failed
    try {
      if (authorizedPatientId) {
        const existingProfile = await voiceProfileService.getByPatientId(authorizedPatientId);
        if (!existingProfile || existingProfile.status !== 'Ready' || !existingProfile.voiceId) {
          await voiceProfileService.updateOrCreateByPatientId(authorizedPatientId, {
            status: 'Failed',
            voiceId: '',
          });
        } else {
          console.log(`ℹ️ Preserved existing valid voice profile for patient "${authorizedPatientId}" after failed clone attempt.`);
        }
      }
    } catch (dbErr) {
      console.warn('Notice: Could not check/persist status to VoiceProfile:', dbErr.message);
    }
    return sendError(res, 400, 'Failed to clone patient voice sample: ' + error.message);
  }
};

/**
 * Handle Text-to-Speech Synthesis in Patient's Cloned Voice using Cartesia or ElevenLabs
 * @route POST /api/voice-profiles/synthesize
 */
const synthesizeSpeech = async (req, res) => {
  const { patientId, voiceId, text, language, emotion, speed } = req.body;

  if (!text || !text.trim()) {
    return sendError(res, 400, 'Text parameter is required for speech synthesis.');
  }

  let effectivePatientId = null;
  let authorizedPatientDoc = null;

  // 1. Strict Identity and Authorization Verification
  try {
    if (req.user && req.user.role) {
      const userRole = req.user.role.toLowerCase();
      if (userRole === 'patient') {
        // Patient user: target patient is strictly resolved from authenticated user identity
        authorizedPatientDoc = await Patient.findOne({
          $or: [
            { userId: req.user.id },
            { _id: mongoose.Types.ObjectId.isValid(req.user.id) ? req.user.id : null },
            ...(req.user.email ? [{ email: req.user.email.toLowerCase() }] : [])
          ]
        });
        if (!authorizedPatientDoc) {
          return sendError(res, 404, 'No patient profile found linked to authenticated user account.');
        }
        effectivePatientId = authorizedPatientDoc._id.toString();
      } else if (userRole === 'caregiver' || userRole === 'doctor') {
        if (!patientId || !mongoose.Types.ObjectId.isValid(patientId)) {
          return sendError(res, 400, 'A valid patientId is required for clinical speech synthesis.');
        }
        const isAuthorized = await authorizeUserForPatient(req.user, patientId);
        if (!isAuthorized) {
          return sendError(res, 403, 'Forbidden. You are not authorized to synthesize speech for this patient.');
        }
        authorizedPatientDoc = await Patient.findById(patientId);
        if (!authorizedPatientDoc) {
          return sendError(res, 404, `Patient with ID "${patientId}" not found.`);
        }
        effectivePatientId = authorizedPatientDoc._id.toString();
      } else {
        return sendError(res, 403, 'Forbidden. Role not permitted to perform speech synthesis.');
      }
    } else {
      return sendError(res, 401, 'Authentication required. No authorized user identity found.');
    }
  } catch (authError) {
    return sendError(res, 500, 'Authorization check failed: ' + authError.message);
  }

  // 2. Speech Synthesis Execution
  try {
    let targetVoiceId = voiceId || null;
    let patientGender = req.body.gender || 'female';
    let patientAgeGroup = req.body.ageGroup || (req.body.age ? elevenLabsService.resolveAgeGroup(req.body.age) : 'adult');
    let isClonedVoice = false;
    let voiceProfileDoc = null;

    if (!targetVoiceId) {
      try {
        if (authorizedPatientDoc) {
          if (authorizedPatientDoc.gender) patientGender = authorizedPatientDoc.gender;
          if (authorizedPatientDoc.age !== undefined && authorizedPatientDoc.age !== null) {
            patientAgeGroup = elevenLabsService.resolveAgeGroup(authorizedPatientDoc.age);
          }
        }

        if (effectivePatientId) {
          const profile = await voiceProfileService.getByPatientId(effectivePatientId);
          if (profile && profile.voiceId && profile.status === 'Ready') {
            targetVoiceId = profile.voiceId;
            voiceProfileDoc = profile;
            isClonedVoice = true;
          }
        }

        if (!targetVoiceId) {
          console.log(`ℹ️ No personal cloned voice found for patientId "${effectivePatientId}". Resolving to demographic profile preset (Gender: ${patientGender}, AgeGroup: ${patientAgeGroup}).`);
        }
      } catch (dbErr) {
        console.warn(`ℹ️ VoiceProfile/Patient lookup notice for patientId "${effectivePatientId}": ${dbErr.message}`);
      }
    } else {
      isClonedVoice = true;
      if (effectivePatientId) {
        try {
          voiceProfileDoc = await voiceProfileService.getByPatientId(effectivePatientId);
        } catch (e) {
          // ignore lookup failure
        }
      }
    }

    // Authoritative voiceProvider rule:
    // 'cartesia' -> Cartesia TTS only
    // 'elevenlabs' or missing -> ElevenLabs TTS
    const isCartesia = isClonedVoice && voiceProfileDoc?.voiceProvider === 'cartesia';
    const isElevenLabs = isClonedVoice && (voiceProfileDoc?.voiceProvider === 'elevenlabs' || !voiceProfileDoc?.voiceProvider);

    const apiKey = process.env.ELEVENLABS_API_KEY;
    let audioBuffer = null;
    let voiceProvider = 'elevenlabs_ivc';

    const isKannada = /[\u0C80-\u0CFF]/.test(text) || (language || '').toLowerCase().includes('kan') || (language || '').toLowerCase() === 'kn';

    // 1. Cartesia TTS (Patient Cloned Voice OR Native Indian Preset for Kannada)
    if (isCartesia || (isKannada && !isClonedVoice)) {
      // For cloned voice, use patient's targetVoiceId. For Kannada demographic preset, use Cartesia Indian native voice
      const effectiveCartesiaVoiceId = isClonedVoice
        ? targetVoiceId
        : (patientGender === 'male' ? 'cb9c954d-bcaa-43ed-82bf-aeb5e88a3cb5' : '4459a9a5-69d6-4680-b970-e13dc51845b6');

      try {
        audioBuffer = await cartesiaService.generateSpeech({
          voiceId: effectiveCartesiaVoiceId,
          text,
          language: isKannada ? 'kn' : (language || 'English'),
          emotion: emotion || 'neutral',
          speed: typeof speed === 'number' ? speed : undefined,
        });
        voiceProvider = isClonedVoice ? 'cartesia_tts' : 'cartesia_indian_preset';
      } catch (cartesiaErr) {
        console.warn(`ℹ️ Cartesia TTS notice (${cartesiaErr.message}) — attempting fluent Google Neural TTS fallback.`);
        isClonedVoice = false;
      }
    } else if (apiKey && (!isClonedVoice || isElevenLabs) && !isKannada) {
      // 2. ElevenLabs TTS (English Cloned Voice or English Demographic Preset)
      // ElevenLabs is used for English / Non-Kannada speech. ElevenLabs Voice ID MUST NEVER be sent to Cartesia
      const resolvedVoiceId = isClonedVoice
        ? targetVoiceId
        : elevenLabsService.resolveProfileVoiceId({
            gender: patientGender,
            ageGroup: patientAgeGroup,
          });

      try {
        audioBuffer = await elevenLabsService.generateSpeech({
          voiceId: resolvedVoiceId,
          text,
          language: language || 'English',
          emotion: emotion || 'neutral',
          speed: typeof speed === 'number' ? speed : undefined,
        });
        voiceProvider = isClonedVoice ? 'elevenlabs_tts' : 'elevenlabs_ivc';
      } catch (elevenErr) {
        console.warn(`ℹ️ ElevenLabs TTS notice (${elevenErr.message}) — attempting fluent Google Neural TTS fallback.`);
        isClonedVoice = false;
      }
    }

    // 3. Secondary High-Fidelity Synthesis Fallback: Google Neural TTS
    if (!audioBuffer || audioBuffer.length === 0) {
      try {
        audioBuffer = await elevenLabsService.fetchGoogleTtsAudioBuffer(text, language || 'English');
        voiceProvider = 'google_neural_tts';
        isClonedVoice = false;
        console.log(`✅ Streamed high-fidelity fallback human audio via Google Neural TTS (${audioBuffer.length} bytes) for: "${text.substring(0, 30)}..."`);
      } catch (googleErr) {
        console.warn(`ℹ️ Google Neural TTS fallback notice: ${googleErr.message}`);
      }
    }

    // 4. Stream audio if buffer obtained (Honest headers)
    if (audioBuffer && audioBuffer.length > 0) {
      // Safety Rule: Do not send clone ID in X-Resolved-Voice-Id when fallback audio is returned
      const resolvedVoiceHeader = isClonedVoice ? targetVoiceId : 'unavailable';
      res.setHeader('X-Voice-Provider', voiceProvider);
      res.setHeader('X-Resolved-Voice-Id', resolvedVoiceHeader);
      res.setHeader('X-Resolved-Age-Group', patientAgeGroup);
      res.setHeader('X-Resolved-Gender', patientGender);
      res.setHeader('X-Voice-Selection-Type', isClonedVoice ? 'cloned' : 'fallback');
      res.setHeader('Content-Type', 'audio/mpeg');
      res.setHeader('Content-Length', audioBuffer.length);
      res.setHeader('Accept-Ranges', 'bytes');
      return res.status(200).send(audioBuffer);
    }

    // 5. Tertiary Fallback: Native SpeechSynthesis notification
    res.setHeader('X-Voice-Provider', 'native_speech_fallback');
    res.setHeader('X-Resolved-Voice-Id', 'unavailable');
    res.setHeader('X-Voice-Selection-Type', 'fallback');
    return res.status(200).json({
      success: true,
      provider: 'native_speech_fallback',
      message: 'Cloud TTS providers offline. Client will use local browser speech.'
    });
  } catch (error) {
    console.warn(`ℹ️ Synthesis controller exception (${error.message}) — triggering client fallback.`);
    res.setHeader('X-Voice-Provider', 'native_speech_fallback');
    res.setHeader('X-Resolved-Voice-Id', 'unavailable');
    res.setHeader('X-Voice-Selection-Type', 'fallback');
    return res.status(200).json({
      success: true,
      provider: 'native_speech_fallback',
      message: `Speech synthesis notice: ${error.message}`
    });
  }
};

/**
 * Contextual speech reconstruction layer using Gemini 2.5 Flash
 * Corrects broken, unclear, or misspelled words from raw ASR transcripts while preserving patient meaning.
 * Falls back safely to raw transcript if Gemini fails, times out, or returns invalid data.
 * @param {string} rawTranscript - Raw transcript from speech recognition
 * @param {string} language - Target language code ('en', 'kn', 'hi')
 * @returns {Promise<string>} Reconstructed/corrected sentence
 */
const reconstructTranscriptWithGemini = async (rawTranscript, language = 'en') => {
  if (!rawTranscript || typeof rawTranscript !== 'string' || !rawTranscript.trim()) {
    return rawTranscript || '';
  }

  const cleanRaw = rawTranscript.trim();
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    console.warn('⚠️ GEMINI_API_KEY not configured. Returning raw ASR transcript.');
    return cleanRaw;
  }

  const normalizedLang = (language === 'kn' || language === 'Kannada' || /[\u0C80-\u0CFF]/.test(cleanRaw))
    ? 'kn'
    : (language === 'hi' || language === 'Hindi' || /[\u0900-\u097F]/.test(cleanRaw))
    ? 'hi'
    : 'en';

  const prompt = `You are an assistive speech reconstruction AI for the VoiceBack patient application.
A speech recognition (ASR) system captured a raw transcript of a patient's speech.

Reconstruction guidelines:
1. Correct broken, incomplete, unclear, or misspelled words into the most likely sentence the patient intended to say.
2. Preserve the patient's original meaning and intent.
3. Keep already-correct text unchanged whenever possible.
4. Format output as a complete, naturally punctuated sentence ending with appropriate punctuation (such as a period).
5. Support both English and Kannada workflows:
   - For Kannada input (in native script or Romanized transliteration such as "nanage neeru beku" or "oota beku"), output clean, natural, correct Kannada (e.g. "ನನಗೆ ನೀರು ಬೇಕು").
6. Avoid inventing symptoms, diagnoses, medicines, names, or other information not present or intended.
7. Never make a medical diagnosis or add medical advice.
8. If the meaning is completely uncertain, fragmented, or ambiguous, return the original raw transcript unchanged.
9. Return a JSON object with exactly one field: "correctedText".

Raw transcript: "${cleanRaw}"
Target language: "${normalizedLang}"

Output format:
{"correctedText": "..."}`;

  const models = [
    'gemini-2.5-flash',
    process.env.GEMINI_MODEL,
    'gemini-3.6-flash',
    'gemini-3.5-flash-lite'
  ].filter(Boolean);

  for (const model of models) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const response = await axios.post(
        url,
        {
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.1,
            responseMimeType: 'application/json',
            maxOutputTokens: 250
          }
        },
        { timeout: 4000 }
      );

      const rawJson = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (rawJson) {
        const parsed = JSON.parse(rawJson);
        if (parsed && typeof parsed.correctedText === 'string' && parsed.correctedText.trim()) {
          const result = parsed.correctedText.trim();
          console.log(`✅ [Gemini ASR Correction (${model})] "${cleanRaw}" -> "${result}"`);
          return result;
        }
      }
    } catch (modelErr) {
      console.warn(`[Gemini ASR Correction] Model ${model} unavailable (${modelErr.response?.data?.error?.message || modelErr.message}), trying fallback...`);
    }
  }

  // Graceful fallback to raw ASR transcript
  console.warn(`⚠️ [Gemini ASR Correction] All model attempts failed or timed out. Falling back to raw transcript: "${cleanRaw}"`);
  return cleanRaw;
};

/**
 * Handle Patient Speech Audio Transcription with ElevenLabs Scribe v2 + Gemini Reconstruction
 * Pipeline: Existing ASR -> Raw transcript -> Gemini Correction/Reconstruction -> Response display
 * @route POST /api/voice-profiles/transcribe
 */
const transcribeSpeech = async (req, res) => {
  try {
    if (!req.file) {
      return sendError(res, 400, 'Audio sample file is required for speech-to-text transcription.');
    }

    const { language } = req.body;

    // 1. Existing ASR generates raw transcript
    const rawTranscript = await elevenLabsService.transcribeSpeech({
      audioFilePath: req.file.path,
      language: language || 'kn'
    });

    // 2. Gemini 2.5 Flash Correction/Reconstruction Layer
    const correctedText = await reconstructTranscriptWithGemini(rawTranscript, language || 'kn');

    // 3. Return corrected text in format expected by existing display, preserving raw transcript metadata
    return sendSuccess(res, 200, 'Speech transcribed successfully', {
      text: correctedText,
      rawTranscript: rawTranscript,
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
  reconstructTranscriptWithGemini,
};

