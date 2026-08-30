const axios = require('axios');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function checkVoices() {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  console.log('Checking ElevenLabs API Key:', apiKey ? `${apiKey.substring(0, 10)}...` : 'MISSING');

  try {
    const res = await axios.get('https://api.elevenlabs.io/v1/voices', {
      headers: { 'xi-api-key': apiKey }
    });

    console.log('✅ Voices returned:', res.data?.voices?.length || 0);
    if (res.data?.voices) {
      res.data.voices.forEach(v => {
        console.log(`- Voice Name: "${v.name}", Voice ID: "${v.voice_id}", Category: "${v.category}"`);
      });
    }
  } catch (err) {
    console.error('❌ Error fetching voices:', err.response?.data || err.message);
  }
}

checkVoices();
