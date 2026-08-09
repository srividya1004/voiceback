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
    const errorDetails = error.response?.data?.detail?.message || error.response?.data?.message || error.message;
    console.error('ElevenLabs IVC API Error:', errorDetails);
    throw new Error(`Voice cloning failed: ${errorDetails}`);
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
const generateSpeech = async ({ voiceId, text, emotion }) => {
  const apiKey = config.elevenLabsApiKey || process.env.ELEVENLABS_API_KEY;
  const modelId = config.elevenLabsTtsModel || process.env.ELEVENLABS_TTS_MODEL || 'eleven_v3';

  if (!apiKey) {
    throw new Error('ELEVENLABS_API_KEY is not configured in backend environment variables.');
  }

  if (!voiceId) {
    throw new Error('Patient voice profile does not have a configured ElevenLabs voice_id.');
  }

  if (!text || !text.trim()) {
    throw new Error('Text prompt is required for voice synthesis.');
  }

  // Format expressive delivery tag without modifying underlying intended text content
  const expressiveText = formatExpressiveText(text, emotion);

  try {
    const response = await axios.post(
      `${ELEVENLABS_BASE_URL}/text-to-speech/${voiceId}`,
      {
        text: expressiveText,
        model_id: modelId,
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
          style: 0.0,
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

module.exports = {
  createInstantVoiceClone,
  generateSpeech,
};
