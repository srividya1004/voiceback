/**
 * VoiceBack Cartesia Gateway Service
 * Manages Cartesia Instant Voice Cloning (IVC) and Cartesia Sonic Speech Synthesis.
 */

const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const config = require('../config');

const CARTESIA_BASE_URL = 'https://api.cartesia.ai';
// Live Cartesia OpenAPI specification documents Cartesia-Version: 2026-08-14
const CARTESIA_API_VERSION = config.cartesiaVersion || '2026-08-14';

/**
 * Create Instant Voice Clone on Cartesia and cleanup local audio file
 * @param {Object} params
 * @param {String} params.voiceName - Cloned voice label
 * @param {String} params.audioFilePath - Path to temporary audio sample file
 * @param {String} [params.language='en'] - Voice language code
 * @returns {Promise<String>} Cartesia generated voice UUID
 */
const createInstantVoiceClone = async ({ voiceName, audioFilePath, language = 'en' }) => {
  const apiKey = config.cartesiaApiKey || process.env.CARTESIA_API_KEY;
  if (!apiKey) {
    throw new Error('CARTESIA_API_KEY is not configured in backend environment variables.');
  }

  if (!audioFilePath || !fs.existsSync(audioFilePath)) {
    throw new Error('Voice sample audio file is missing or unreadable.');
  }

  try {
    const formData = new FormData();
    formData.append('clip', fs.createReadStream(audioFilePath));
    formData.append('name', voiceName || `VoiceBack_Patient_${Date.now()}`);
    formData.append('language', language);

    const response = await axios.post(`${CARTESIA_BASE_URL}/voices/clone`, formData, {
      headers: {
        ...formData.getHeaders(),
        'X-API-Key': apiKey,
        'Cartesia-Version': CARTESIA_API_VERSION,
      },
      timeout: 60000,
    });

    if (response.data && response.data.id) {
      return response.data.id;
    }
    throw new Error('Cartesia IVC API did not return a valid voice id.');
  } catch (error) {
    const errorDetails = error.response?.data?.message || error.response?.data?.error || error.message;
    console.error('Cartesia IVC API Error:', errorDetails);
    throw new Error(`Cartesia IVC Error: ${errorDetails}`);
  } finally {
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
 * Generate speech in patient's cloned voice using Cartesia Sonic model
 * @param {Object} params
 * @param {String} params.voiceId - Cartesia voice UUID
 * @param {String} params.text - Intended text to synthesize
 * @param {String} [params.language='en'] - Language ('English', 'Hindi', 'Kannada' or ISO code)
 * @param {String} [params.emotion='neutral'] - Delivery emotion
 * @param {Number} [params.speed=0.88] - Delivery speed
 * @returns {Promise<Buffer>} Audio binary buffer (MP3 format)
 */
const generateSpeech = async ({ voiceId, text, language = 'en', emotion = 'neutral', speed = 0.88 }) => {
  const apiKey = config.cartesiaApiKey || process.env.CARTESIA_API_KEY;
  if (!apiKey) {
    throw new Error('CARTESIA_API_KEY is not configured in backend environment variables.');
  }
  if (!voiceId) {
    throw new Error('Voice ID is required for Cartesia speech synthesis.');
  }
  if (!text || !text.trim()) {
    throw new Error('Text prompt is required for Cartesia voice synthesis.');
  }

  const modelId = config.cartesiaTtsModel || process.env.CARTESIA_TTS_MODEL || 'sonic-3';
  const cleanText = text.replace(/\[[^\]]+\]/g, '').trim();

  const langLower = (language || 'en').toLowerCase().trim();
  // Force 'kn' when text contains Kannada Unicode characters [\u0C80-\u0CFF]
  const isKannada = /[\u0C80-\u0CFF]/.test(cleanText) || langLower.includes('kan') || langLower.includes('kn');
  const isHindi = /[\u0900-\u097F]/.test(cleanText) || langLower.includes('hin') || langLower.includes('hi');
  const langCode = isKannada ? 'kn' : (isHindi ? 'hi' : 'en');

  const effectiveSpeed = typeof speed === 'number' && !isNaN(speed) ? Math.max(0.6, Math.min(1.5, speed)) : 0.88;
  const validEmotion = ['neutral', 'happy', 'calm', 'content', 'peaceful', 'surprised', 'curious'].includes(emotion)
    ? emotion : 'neutral';

  const payload = {
    model_id: modelId,
    transcript: cleanText,
    voice: { mode: 'id', id: voiceId },
    output_format: {
      container: 'mp3',
      sample_rate: 44100,
      bit_rate: 192000,
    },
    language: langCode,
    generation_config: {
      speed: effectiveSpeed,
      emotion: validEmotion,
    },
  };

  const response = await axios.post(`${CARTESIA_BASE_URL}/tts/bytes`, payload, {
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': apiKey,
      'Cartesia-Version': CARTESIA_API_VERSION,
    },
    responseType: 'arraybuffer',
    timeout: 30000,
  });

  return Buffer.from(response.data);
};

module.exports = {
  createInstantVoiceClone,
  generateSpeech,
};
