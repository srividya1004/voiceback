/**
 * VoiceBack ElevenLabs Gateway Service
 * Manages ElevenLabs Instant Voice Cloning (IVC) and eleven_v3 Speech Synthesis.
 */

const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const https = require('https');
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
    const errorDetails = rawError.message || error.message || 'Instant voice cloning failed on provider.';
    console.error('ElevenLabs IVC API Error:', errorDetails);
    throw new Error(`ElevenLabs IVC Error: ${errorDetails}`);
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
 * High-fidelity fallback to Google Neural TTS MP3 audio
 * Provides warm, fluent human native speech for Kannada (kn), Hindi (hi), and English (en)
 * @param {String} text
 * @param {String} language
 * @returns {Promise<Buffer>}
 */
const fetchGoogleTtsAudioBuffer = (text, language = 'en') => {
  return new Promise((resolve, reject) => {
    if (!text || !text.trim()) {
      return reject(new Error('Empty text for Google TTS'));
    }
    const clean = text.replace(/\[[^\]]+\]/g, '').trim();
    const langLower = (language || '').toLowerCase();
    const isKannada = langLower.includes('kan') || langLower.includes('kn') || /[\u0C80-\u0CFF]/.test(clean);
    const isHindi = langLower.includes('hin') || langLower.includes('hi') || /[\u0900-\u097F]/.test(clean);
    const tl = isKannada ? 'kn' : (isHindi ? 'hi' : 'en');
    
    // Google Translate TTS direct CDN endpoint provides clean, natural human MP3 stream
    const url = `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=${tl}&q=${encodeURIComponent(clean.slice(0, 200))}`;
    
    const req = https.get(
      url,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          'Accept': 'audio/mpeg, audio/*',
        },
        timeout: 10000,
      },
      (res) => {
        if (res.statusCode !== 200) {
          return reject(new Error(`Google TTS HTTP error: ${res.statusCode}`));
        }
        const chunks = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => {
          const buf = Buffer.concat(chunks);
          if (buf.length > 500) {
            resolve(buf);
          } else {
            reject(new Error('Google TTS payload too small'));
          }
        });
      }
    );

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Google TTS request timed out'));
    });
  });
};

/**
 * Generate speech in patient's cloned voice using eleven_v3 model
 * @param {Object} params - Synthesis params
 * @param {String} params.voiceId - ElevenLabs voice_id
 * @param {String} params.text - Patient intended text
 * @param {String} params.language - Language ('English', 'Hindi', 'Kannada')
 * @param {String} params.emotion - Delivery style ('neutral', 'calm', 'urgent', 'happy')
 * @param {Number} [params.speed] - Speed multiplier (0.7 to 1.1, default 0.88 for clear patient delivery)
 * @returns {Promise<Buffer>} Audio MP3 binary buffer
 */
const generateSpeech = async ({ voiceId, text, language, emotion, speed }) => {
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
  let cleanText = text.replace(/\[(calm|urgent|happy|neutral|pause|cough)\]/gi, '').trim();

  // Detect if text is in an Indic script (Kannada or Hindi/Devanagari)
  const isIndicText = /[\u0C80-\u0CFF\u0900-\u097F]/.test(cleanText) ||
    language === 'Kannada' || language === 'kn' || language === 'Hindi' || language === 'hi';

  // Use ElevenLabs flagship ultra-realistic human voice model (eleven_multilingual_v2) for natural human voice cloning
  const selectedModelId = 'eleven_multilingual_v2';

  // Dynamic Emotion, Warmth & Humanization Parameter Tuning for Flagship Voice Synthesis
  // Stability ~0.44 provides lifelike dynamic intonation, breathing micro-pauses, and organic vocal timbre.
  // SimilarityBoost ~0.90 locks in the natural acoustic resonance without synthetic flatness.
  let stability = isIndicText ? 0.44 : 0.38;
  let similarityBoost = 0.90;
  let style = isIndicText ? 0.0 : 0.20;

  if (!isIndicText) {
    if (emotion === 'calm') {
      stability = 0.45;
      style = 0.15;
    } else if (emotion === 'urgent') {
      stability = 0.30;
      style = 0.40;
    } else if (emotion === 'happy') {
      stability = 0.35;
      style = 0.30;
    }
  }

  // Clamped patient-friendly speed: 0.88 is calm, natural, and gentle for aphasia comprehension
  const effectiveSpeed = typeof speed === 'number' && !isNaN(speed)
    ? Math.max(0.70, Math.min(1.2, speed))
    : 0.88;

  const isKannada = /[\u0C80-\u0CFF]/.test(cleanText) || (language || '').toLowerCase().includes('kan');
  if (isKannada) {
    // ElevenLabs models do not support Kannada (kn) and distort pronunciation with an American English accent.
    // Automatically delegate Kannada synthesis to Google Neural Kannada TTS for authentic, fluent human speech.
    return fetchGoogleTtsAudioBuffer(cleanText, 'kn');
  }

  // Ensure clean single terminal punctuation without trailing duplicate dots (which cause stutter or hesitation artifacts)
  cleanText = cleanText.replace(/[.!?।,]+$/, '').trim();
  if (cleanText.length > 0) {
    cleanText = cleanText + (isIndicText && !isKannada ? '।' : '.');
  }

  try {
    console.log(`🎙️ ElevenLabs Human Voice TTS Request: "${cleanText.substring(0, 40)}..." (Lang: ${language || 'en'}, Model: ${selectedModelId}, Voice: ${targetVoiceId}, Style: ${style}, Stability: ${stability}, Speed: ${effectiveSpeed})`);
    const response = await axios.post(
      `${ELEVENLABS_BASE_URL}/text-to-speech/${targetVoiceId}`,
      {
        text: cleanText,
        model_id: selectedModelId,
        voice_settings: {
          stability: stability,
          similarity_boost: similarityBoost,
          style: style,
          use_speaker_boost: true,
          speed: effectiveSpeed,
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
 * @param {String} [params.language] - Optional language code ('en', 'kn', 'hi', or 'auto')
 * @returns {Promise<String>} Recognized text transcript
 */
const transcribeSpeech = async ({ audioFilePath, language = 'auto' }) => {
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

    // Only supply language_code if explicitly specified and not 'auto'
    if (language && language !== 'auto') {
      const targetLangCode = (language === 'en' || language === 'English') ? 'eng' : (language === 'hi' || language === 'Hindi') ? 'hin' : (language === 'kn' || language === 'Kannada') ? 'kan' : null;
      if (targetLangCode) {
        formData.append('language_code', targetLangCode);
        console.log(`🎙️ ElevenLabs Scribe v2 STT API Request starting (language_code: ${targetLangCode}) for file: ${audioFilePath}`);
      }
    } else {
      console.log(`🎙️ ElevenLabs Scribe v2 STT API Request starting (auto language detection) for file: ${audioFilePath}`);
    }

    const response = await axios.post(`${ELEVENLABS_BASE_URL}/speech-to-text`, formData, {
      headers: {
        ...formData.getHeaders(),
        'xi-api-key': apiKey,
      },
      timeout: 60000, // 60s timeout for audio transcription
    });

    if (response.data && typeof response.data.text === 'string') {
      let transcript = response.data.text.trim();
      
      // Clean script artifacts: if non-Kannada Dravidian characters (Tamil/Malayalam/Telugu) appear, clean them
      const hasTamilMalayalamTelugu = /[\u0B80-\u0BFF\u0C00-\u0C7F\u0D00-\u0D7F]/.test(transcript);
      if (hasTamilMalayalamTelugu) {
        console.warn(`⚠️ Non-Kannada Dravidian script detected in STT transcript: "${transcript}". Sanitizing.`);
        transcript = transcript.replace(/[\u0B80-\u0BFF\u0C00-\u0C7F\u0D00-\u0D7F]+/g, '').trim();
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
    adult: 'nPczCjzI2devNBz1zQrb',  // Brian - Deep, resonant and comforting male human voice
    senior: 'pqHfZKP75CvOlQylNhV4', // Bill - Wise mature senior male human voice
  },
  female: {
    child: 'hpp4J3VqNfWAUOO0d1Us',  // Bella - Soft young female human voice
    young: 'EXAVITQu4vr4xnSDxMaL',  // Sarah - Reassuring, mature, human conversational voice
    adult: 'EXAVITQu4vr4xnSDxMaL',  // Sarah - Expressive adult female human voice
    senior: 'XrExE9yKIg1WjnnlVkGX', // Matilda - Mature senior female human voice
  }
};

/**
 * Standard age band resolution helper
 * Child: < 18 (e.g. 1-17)
 * Young: 18 - 34
 * Adult: 35 - 60
 * Senior: > 60 (e.g. 61+)
 */
const resolveAgeGroup = (age) => {
  const num = parseInt(age, 10);
  if (isNaN(num)) return 'adult';
  if (num < 18) return 'child';
  if (num < 35) return 'young';
  if (num > 60) return 'senior';
  return 'adult';
};

/**
 * Resolve target voice ID based on patient profile (IVC custom voice -> age/gender matching standard pool -> default)
 */
const resolveProfileVoiceId = ({ customVoiceId, gender = 'female', ageGroup, age }) => {
  if (customVoiceId && typeof customVoiceId === 'string' && customVoiceId.trim()) {
    return customVoiceId.trim();
  }
  const normGender = (gender || 'female').toLowerCase().includes('male') && !gender.toLowerCase().includes('female') ? 'male' : 'female';
  const effectiveAgeGroup = ageGroup ? ageGroup.toLowerCase() : resolveAgeGroup(age);
  const pool = ELEVENLABS_PREMADE_VOICES[normGender] || ELEVENLABS_PREMADE_VOICES.female;
  return pool[effectiveAgeGroup] || pool.adult || 'EXAVITQu4vr4xnSDxMaL';
};

module.exports = {
  createInstantVoiceClone,
  generateSpeech,
  transcribeSpeech,
  fetchGoogleTtsAudioBuffer,
  resolveProfileVoiceId,
  resolveAgeGroup,
  ELEVENLABS_PREMADE_VOICES,
};


