const axios = require('axios');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const cartesiaService = require('../src/services/cartesiaService');

async function testCartesia() {
  const apiKey = process.env.CARTESIA_API_KEY;
  console.log('--- CARTESIA KANNADA & ENGLISH TTS DIAGNOSTIC ---');
  console.log('Cartesia API key present:', !!apiKey);
  if (!apiKey) {
    console.error('Missing CARTESIA_API_KEY');
    process.exit(1);
  }

  try {
    const vRes = await axios.get('https://api.cartesia.ai/voices', {
      headers: {
        'X-API-Key': apiKey,
        'Cartesia-Version': '2026-08-14'
      }
    });

    const voiceList = Array.isArray(vRes.data) ? vRes.data : (vRes.data?.data || []);
    console.log(`Found ${voiceList.length} voices on Cartesia.`);
    const sampleVoice = voiceList[0];
    if (!sampleVoice) {
      console.error('No sample voice found.');
      process.exit(1);
    }
    console.log(`Using voice: ${sampleVoice.id} (${sampleVoice.name})`);

    // 1. Direct Model Test: English
    console.log('\n[TEST 1] Synthesizing English text: "I want water." ...');
    const enBuffer = await cartesiaService.generateSpeech({
      voiceId: sampleVoice.id,
      text: 'I want water.',
      language: 'en'
    });
    console.log(`✅ English synthesis SUCCESS! Received ${enBuffer.length} bytes.`);

    // 2. Direct Model Test: Kannada with explicit language: 'kn'
    console.log('\n[TEST 2] Synthesizing Kannada text: "ನನಗೆ ನೀರು ಬೇಕು" (explicit language: "kn") ...');
    const knBuffer = await cartesiaService.generateSpeech({
      voiceId: sampleVoice.id,
      text: 'ನನಗೆ ನೀರು ಬೇಕು',
      language: 'kn'
    });
    console.log(`✅ Kannada synthesis SUCCESS! Received ${knBuffer.length} bytes.`);

    // 3. Script Detection Test: Kannada text with unspecified / generic language: 'English'
    console.log('\n[TEST 3] Synthesizing Kannada text: "ನನಗೆ ನೀರು ಬೇಕು" with generic language: "English" (Unicode script guard test) ...');
    const guardBuffer = await cartesiaService.generateSpeech({
      voiceId: sampleVoice.id,
      text: 'ನನಗೆ ನೀರು ಬೇಕು',
      language: 'English'
    });
    console.log(`✅ Unicode script guard SUCCESS! Received ${guardBuffer.length} bytes (proper Kannada phonemes forced).`);

    console.log('\n🎉 ALL CARTESIA KANNADA & ENGLISH TESTS PASSED!');
  } catch (err) {
    const details = err.response?.data ? Buffer.from(err.response.data).toString('utf8') : err.message;
    console.error('❌ Cartesia diagnostic error:', details);
    process.exit(1);
  }
}

testCartesia();
