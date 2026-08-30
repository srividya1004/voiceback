const axios = require('axios');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function testKannadaTTS() {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  const voiceId = 'EXAVITQu4vr4xnSDxMaL'; // Sarah
  const kannadaText = 'ಹೌದು, ನನಗೆ ನೀರು ಬೇಕು.';

  console.log('Testing ElevenLabs Kannada TTS synthesis...');
  console.log('Voice ID:', voiceId);
  console.log('Text:', kannadaText);

  // Try eleven_v3 first, then eleven_multilingual_v2
  const models = ['eleven_v3', 'eleven_multilingual_v2'];

  for (const model_id of models) {
    try {
      console.log(`\nAttempting with model: ${model_id}...`);
      const response = await axios.post(
        `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
        {
          text: kannadaText,
          model_id: model_id,
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
          }
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

      const buffer = Buffer.from(response.data);
      console.log(`✅ SUCCESS with model ${model_id}! Received ${buffer.length} bytes.`);
      const outputPath = path.join(__dirname, `../temp_uploads/test_kannada_${model_id}.mp3`);
      fs.writeFileSync(outputPath, buffer);
      console.log(`Saved audio to: ${outputPath}`);
      return;
    } catch (err) {
      let errMsg = err.message;
      if (err.response?.data) {
        try {
          errMsg = Buffer.from(err.response.data).toString('utf-8');
        } catch (e) {}
      }
      console.error(`❌ Failed with model ${model_id}:`, errMsg);
    }
  }
}

testKannadaTTS();
