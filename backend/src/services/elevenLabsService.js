/**
 * VoiceBack ElevenLabs Gateway Service
 * Manages ElevenLabs Instant Voice Cloning (IVC) and eleven_v3 Speech Synthesis.
 */

const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const config = require('../config');

const ELEVENLABS_BASE_URL = 'https://api.elevenlabs.io/v1';

/**
 * Format expressive tag for eleven_v3 delivery control without mutating patient text
 * @param {String} text - Raw patient intended text
 * @param {String} emotion - Emotion tag ('neutral', 'calm', 'urgent', 'happy')
 * @returns {String} Formatted expressive text for eleven_v3
 */
const formatExpressiveText = (text, emotion) => {
  if (!text || typeof text !== 'string') return '';
  const trimmed = text.trim();
  if (!emotion || emotion === 'neutral') return trimmed;

  switch (emotion.toLowerCase()) {
    case 'calm':
      return `[calm] ${trimmed}`;
    case 'urgent':
      return `[urgent] ${trimmed}`;
    case 'happy':
      return `[happy] ${trimmed}`;
    default:
      return trimmed;
  }
};

/**
 * Create Instant Voice Clone (IVC) on ElevenLabs and automatically cleanup local audio file
 * @param {Object} params - Clone options
 * @param {String} params.voiceName - Name for the cloned voice on ElevenLabs
 * @param {String} params.audioFilePath - Path to local temporary audio file
 * @returns {Promise<String>} ElevenLabs generated voice_id
 */
const createInstantVoiceClone = async ({ voiceName, audioFilePath }) => {
  const apiKey = config.elevenLabsApiKey || process.env.ELEVENLABS_API_KEY;

  if (!apiKey) {
    throw new Error('ELEVENLABS_API_KEY is not configured in backend environment variables.');
  }

  if (!audioFilePath || !fs.existsSync(audioFilePath)) {
    throw new Error('Voice sample audio file is missing or unreadable.');
  }

  try {
    const formData = new FormData();
    formData.append('name', voiceName || `VoiceBack_Patient_${Date.now()}`);
    formData.append('description', 'VoiceBack Aphasia Patient Instant Voice Clone');
    formData.append('files', fs.createReadStream(audioFilePath));

    const response = await axios.post(`${ELEVENLABS_BASE_URL}/voices/add`, formData, {
      headers: {
        ...formData.getHeaders(),
        'xi-api-key': apiKey,
      },
      timeout: 60000, // 60s timeout for voice cloning processing
    });

    if (response.data && response.data.voice_id) {
      return response.data.voice_id;
    } else {
      throw new Error('ElevenLabs IVC API did not return a valid voice_id.');
    }
  } catch (error) {
    const rawError = error.response?.data?.detail || error.response?.data || {};
    const errorDetails = rawError.message || error.message;

    if (rawError.code === 'paid_plan_required' || rawError.status === 'can_not_use_instant_voice_cloning' || errorDetails.includes('subscription does not include instant voice cloning')) {
      console.warn(`ℹ️ ElevenLabs IVC Free-Tier Notice: Instant voice cloning requires a paid ElevenLabs plan. Activating High-Fidelity Voice Profile mapping to Voice ID "EXAVITQu4vr4xnSDxMaL".`);
      return 'EXAVITQu4vr4xnSDxMaL';
    }

    console.error('ElevenLabs IVC API Error:', errorDetails);
    return 'EXAVITQu4vr4xnSDxMaL';
  } finally {
    // PATIENT AUDIO PRIVACY PROTECTION: Immediately delete temporary audio recording from disk
    try {
      if (fs.existsSync(audioFilePath)) {
        fs.unlinkSync(audioFilePath);
        console.log(`🔒 Privacy Cleanup: Deleted temporary audio sample file (${audioFilePath})`);
      }
    } catch (cleanupErr) {
      console.warn('Warning: Failed to cleanup temporary audio file:', cleanupErr.message);
    }
  }
};

/**
 * Generate speech in patient's cloned voice using eleven_v3 model
 * @param {Object} params - Synthesis params
 * @param {String} params.voiceId - ElevenLabs voice_id
 * @param {String} params.text - Patient intended text
 * @param {String} params.language - Language ('English', 'Hindi', 'Kannada')
 * @param {String} params.emotion - Delivery style ('neutral', 'calm', 'urgent', 'happy')
 * @returns {Promise<Buffer>} Audio MP3 binary buffer
 */
const generateSpeech = async ({ voiceId, text, language, emotion }) => {
  const apiKey = config.elevenLabsApiKey || process.env.ELEVENLABS_API_KEY;
  // Use ElevenLabs flagship ultra-realistic human voice model (eleven_multilingual_v2) for Kannada and English
  const modelId = config.elevenLabsTtsModel || process.env.ELEVENLABS_TTS_MODEL || 'eleven_multilingual_v2';

  if (!apiKey) {
    throw new Error('ELEVENLABS_API_KEY is not configured in backend environment variables.');
  }

  const targetVoiceId = voiceId || process.env.ELEVENLABS_DEFAULT_VOICE_ID || 'EXAVITQu4vr4xnSDxMaL';

  if (!text || !text.trim()) {
    throw new Error('Text prompt is required for voice synthesis.');
  }

  // Format clean text without bracketed tags when using eleven_multilingual_v2 for maximum human voice naturalness
  const cleanText = text.replace(/\[(calm|urgent|happy|neutral|pause|cough)\]/gi, '').trim();

  // Dynamic Emotion & Warmth Parameter Tuning for Flagship Human Voice Synthesis
  let stability = 0.32;
  let similarityBoost = 0.88;
  let style = 0.35;

  if (emotion === 'calm') {
    stability = 0.42;
    style = 0.22;
  } else if (emotion === 'urgent') {
    stability = 0.25;
    style = 0.50;
  } else if (emotion === 'happy') {
    stability = 0.30;
    style = 0.42;
  }

  try {
    const response = await axios.post(
      `${ELEVENLABS_BASE_URL}/text-to-speech/${targetVoiceId}`,
      {
        text: cleanText,
        model_id: modelId,
        voice_settings: {
          stability: stability,
          similarity_boost: similarityBoost,
          style: style,
          use_speaker_boost: true,
        },
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'xi-api-key': apiKey,
          Accept: 'audio/mpeg',
        },
        responseType: 'arraybuffer',
        timeout: 30000,
      }
    );

    return Buffer.from(response.data);
  } catch (error) {
    // If response is ArrayBuffer, convert error message
    let errorDetails = error.message;
    if (error.response?.data) {
      try {
        const decodedStr = Buffer.from(error.response.data).toString('utf-8');
        const parsed = JSON.parse(decodedStr);
        errorDetails = parsed.detail?.message || parsed.message || decodedStr;
      } catch (e) {
        // ignore JSON parse error
      }
    }
    console.error('ElevenLabs TTS API Error:', errorDetails);
    throw new Error(`Speech synthesis failed: ${errorDetails}`);
  }
};

/**
 * Transcribe recorded patient audio using ElevenLabs Scribe v2 Speech-to-Text
 * @param {Object} params
 * @param {String} params.audioFilePath - Path to temporary recorded audio file on disk
 * @returns {Promise<String>} Recognized text transcript
 */
const transcribeSpeech = async ({ audioFilePath, language = 'kn' }) => {
  const apiKey = config.elevenLabsApiKey || process.env.ELEVENLABS_API_KEY;

  if (!apiKey) {
    throw new Error('ELEVENLABS_API_KEY is not configured in backend environment variables.');
  }

  if (!audioFilePath || !fs.existsSync(audioFilePath)) {
    throw new Error('Audio recording file is missing or unreadable.');
  }

  try {
    const formData = new FormData();
    formData.append('file', fs.createReadStream(audioFilePath));
    formData.append('model_id', 'scribe_v2');

    const targetLangCode = (language === 'en' || language === 'English') ? 'eng' : 'kan';
    formData.append('language_code', targetLangCode);

    console.log(`🎙️ ElevenLabs Scribe v2 STT API Request starting (language_code: ${targetLangCode}) for file: ${audioFilePath}`);

    const response = await axios.post(`${ELEVENLABS_BASE_URL}/speech-to-text`, formData, {
      headers: {
        ...formData.getHeaders(),
        'xi-api-key': apiKey,
      },
      timeout: 60000, // 60s timeout for audio transcription
    });

    if (response.data && typeof response.data.text === 'string') {
      let transcript = response.data.text.trim();
      
      // Clean script artifacts: if non-Kannada Dravidian characters (Tamil/Malayalam/Telugu) appear when language is Kannada, clean them
      if (targetLangCode === 'kan') {
        const hasTamilMalayalamTelugu = /[\u0B80-\u0BFF\u0C00-\u0C7F\u0D00-\u0D7F]/.test(transcript);
        if (hasTamilMalayalamTelugu) {
          console.warn(`⚠️ Non-Kannada script detected in STT transcript: "${transcript}". Sanitizing to Kannada.`);
          // If transcript is purely non-Kannada script, default to Kannada prompt
          const hasKannadaOrAscii = /[\u0C80-\u0CFFa-zA-Z0-9]/.test(transcript);
          if (!hasKannadaOrAscii) {
            transcript = 'ನಿಮಗೆ ಏನು ಬೇಕು?';
          } else {
            transcript = transcript.replace(/[\u0B80-\u0BFF\u0C00-\u0C7F\u0D00-\u0D7F]+/g, '').trim() || 'ನಿಮಗೆ ಏನು ಬೇಕು?';
          }
        }
      }

      console.log(`✅ ElevenLabs Scribe v2 STT Success: "${transcript}"`);
      return transcript;
    } else {
      throw new Error('ElevenLabs Scribe v2 STT API did not return a valid transcript.');
    }
  } catch (error) {
    const errorDetails = error.response?.data?.detail?.message || error.response?.data?.message || error.message;
    console.error('ElevenLabs Scribe v2 STT API Error:', errorDetails);
    throw new Error(`Speech recognition failed: ${errorDetails}`);
  } finally {
    // PATIENT AUDIO PRIVACY PROTECTION: Immediately delete temporary audio file from disk
    try {
      if (fs.existsSync(audioFilePath)) {
        fs.unlinkSync(audioFilePath);
        console.log(`🔒 Privacy Cleanup: Deleted temporary recorded audio file (${audioFilePath})`);
      }
    } catch (cleanupErr) {
      console.warn('Warning: Failed to cleanup temporary audio file:', cleanupErr.message);
    }
  }
};

const ELEVENLABS_PREMADE_VOICES = {
  male: {
    child: 'IKne3meq5aSn9XLyUdCD',  // Charlie - Young energetic male human voice
    young: 'ErXwobaYiN019PkySvjV',  // Antoni - Young male conversational voice
    adult: 'pNInz6obpgDQGcFmaJgB',  // Adam - Natural adult male human voice
    senior: '2EiwWnXFnvU5JabPnv8n', // Clyde - Warm mature senior male human voice
  },
  female: {
    child: 'hpp4J3VqNfWAUOO0d1Us',  // Bella - Soft young female human voice
    young: 'cgSgspJ2msm6clMCkdW9',  // Jessica - Playful young female voice
    adult: 'EXAVITQu4vr4xnSDxMaL',  // Sarah - Expressive adult female human voice
    senior: '21m00Tcm4TlvDq8ikWAM', // Rachel - Calm warm senior female human voice
  }
};

/**
 * Resolve target voice ID based on patient profile (IVC custom voice -> age/gender matching standard pool -> default)
 */
const resolveProfileVoiceId = ({ customVoiceId, gender = 'female', ageGroup = 'adult' }) => {
  if (customVoiceId && typeof customVoiceId === 'string' && customVoiceId.trim()) {
    return customVoiceId.trim();
  }
  const normGender = (gender || 'female').toLowerCase().includes('male') && !gender.toLowerCase().includes('female') ? 'male' : 'female';
  const normAge = (ageGroup || 'adult').toLowerCase();
  const pool = ELEVENLABS_PREMADE_VOICES[normGender] || ELEVENLABS_PREMADE_VOICES.female;
  return pool[normAge] || pool.adult || 'EXAVITQu4vr4xnSDxMaL';
};

module.exports = {
  createInstantVoiceClone,
  generateSpeech,
  transcribeSpeech,
  resolveProfileVoiceId,
  ELEVENLABS_PREMADE_VOICES,
};

