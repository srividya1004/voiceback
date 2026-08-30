const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function testClone() {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  console.log('Testing ElevenLabs Voice Cloning API Key:', apiKey ? `${apiKey.substring(0, 10)}...` : 'MISSING');

  // Create a 1-second silent WAV file buffer
  const samplePath = path.join(__dirname, '../temp_uploads/sample_test.wav');
  if (!fs.existsSync(path.dirname(samplePath))) {
    fs.mkdirSync(path.dirname(samplePath), { recursive: true });
  }

  // Write basic dummy WAV header and audio bytes
  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + 16000, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20); // PCM
  header.writeUInt16LE(1, 22); // mono
  header.writeUInt32LE(16000, 24); // sample rate
  header.writeUInt32LE(32000, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);
  header.write('data', 36);
  header.writeUInt32LE(16000, 40);
  const pcm = Buffer.alloc(16000);
  const wavBuffer = Buffer.concat([header, pcm]);
  fs.writeFileSync(samplePath, wavBuffer);

  try {
    const formData = new FormData();
    formData.append('name', `Test_Voice_${Date.now()}`);
    formData.append('description', 'VoiceBack Test Voice Clone');
    formData.append('files', fs.createReadStream(samplePath));

    const response = await axios.post('https://api.elevenlabs.io/v1/voices/add', formData, {
      headers: {
        ...formData.getHeaders(),
        'xi-api-key': apiKey,
      },
      timeout: 30000,
    });

    console.log('✅ VOICE CLONING SUCCESS! Created Voice ID:', response.data?.voice_id);
  } catch (err) {
    console.error('❌ VOICE CLONING ERROR DETAILS:', err.response?.data || err.message);
  } finally {
    if (fs.existsSync(samplePath)) {
      fs.unlinkSync(samplePath);
    }
  }
}

testClone();
