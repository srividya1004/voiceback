/**
 * VoiceBack Gemini Multimodal Speech Recognition Service
 * Transcribes audio and generates response options using Google Gemini Multimodal Audio Model.
 */

require('dotenv').config();
const axios = require('axios');
const fs = require('fs');
const path = require('path');

async function testGeminiAudioSpeechRecognition() {
  console.log('========================================================================');
  console.log('🎙️ Testing Google Gemini Multimodal Audio Voice Recognition Engine');
  console.log('========================================================================');

  const apiKey = process.env.GEMINI_API_KEY;
  const audioFilePath = path.join(__dirname, '../temp_audio/output_voice_en.mp3');

  if (!fs.existsSync(audioFilePath)) {
    console.error('Audio file missing:', audioFilePath);
    return;
  }

  const audioBuffer = fs.readFileSync(audioFilePath);
  const base64Audio = audioBuffer.toString('base64');

  console.log(`📁 Loaded audio sample (${(audioBuffer.length / 1024).toFixed(2)} KB)`);

  const model = 'gemini-3.5-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  console.log(`📡 Sending audio to Google Gemini Multimodal (${model})...`);

  try {
    const response = await axios.post(
      url,
      {
        contents: [
          {
            parts: [
              {
                text: 'Listen to this audio recording of a caregiver or patient speaking. 1) Transcribe the exact speech into text. 2) Identify the context intent. 3) Generate 3 patient-friendly response options in JSON format: { "transcript": "text", "intent": "code", "options": ["option 1", "option 2", "option 3"] }.'
              },
              {
                inline_data: {
                  mime_type: 'audio/mp3',
                  data: base64Audio
                }
              }
            ]
          }
        ],
        generationConfig: {
          responseMimeType: 'application/json'
        }
      },
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 20000
      }
    );

    const jsonText = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
    console.log('✅ Google Gemini Multimodal Voice Recognition & Response Success:\n', jsonText);

  } catch (err) {
    console.error('❌ Error:', err.response?.status, err.response?.data?.error?.message || err.message);
  }
}

testGeminiAudioSpeechRecognition();
