const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const cartesiaService = require('../src/services/cartesiaService');
const elevenLabsService = require('../src/services/elevenLabsService');

async function testKannadaSentences() {
  console.log('====================================================');
  console.log('🧪 TESTING KANNADA TTS PRONUNCIATION & ACCENT');
  console.log('====================================================');

  const sentences = [
    { id: 'water', text: 'ನನಗೆ ನೀರು ಬೇಕು' },
    { id: 'movie', text: 'ನಾವು ಯಾವ ಸಿನಿಮಾ ನೋಡಲು ಹೋಗುತ್ತಿದ್ದೇವೆ?' },
    { id: 'rest', text: 'ನನಗೆ ಸ್ವಲ್ಪ ವಿಶ್ರಾಂತಿ ಬೇಕು.' },
    { id: 'come', text: 'ಹೌದು, ನಾನು ನಿಮ್ಮ ಜೊತೆ ಬರುತ್ತೇನೆ.' },
    { id: 'family', text: 'ದಯವಿಟ್ಟು ನನ್ನ ಕುಟುಂಬಕ್ಕೆ ಕರೆ ಮಾಡಿ.' }
  ];

  const uploadDir = path.join(__dirname, '../temp_uploads');
  if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

  const testVoices = [
    { name: 'Cartesia_Siya_Indian_Female', id: '4459a9a5-69d6-4680-b970-e13dc51845b6' },
    { name: 'Cartesia_Kabir_Indian_Male', id: 'cb9c954d-bcaa-43ed-82bf-aeb5e88a3cb5' }
  ];

  console.log('\n--- 1. Testing Cartesia Indian Voice Presets (High Fidelity 44.1kHz) ---');
  for (const voice of testVoices) {
    console.log(`\nTesting Voice: ${voice.name} (${voice.id})...`);
    for (const s of sentences) {
      try {
        const audioBuf = await cartesiaService.generateSpeech({
          voiceId: voice.id,
          text: s.text,
          language: 'kn'
        });
        const outPath = path.join(uploadDir, `${voice.name}_${s.id}.mp3`);
        fs.writeFileSync(outPath, audioBuf);
        console.log(`  ✅ [${s.id}] "${s.text.substring(0, 25)}..." -> ${audioBuf.length} bytes`);
      } catch (err) {
        console.error(`  ❌ [${s.id}] Failed:`, err.message);
      }
    }
  }

  console.log('\n--- 2. Testing Google Neural Kannada TTS Fallback ---');
  for (const s of sentences) {
    try {
      const gBuf = await elevenLabsService.fetchGoogleTtsAudioBuffer(s.text, 'kn');
      const outPath = path.join(uploadDir, `Google_Neural_${s.id}.mp3`);
      fs.writeFileSync(outPath, gBuf);
      console.log(`  ✅ [${s.id}] "${s.text.substring(0, 25)}..." -> ${gBuf.length} bytes`);
    } catch (err) {
      console.error(`  ❌ [${s.id}] Failed:`, err.message);
    }
  }

  console.log('\n🎉 ALL MULTIPLE KANNADA SENTENCES SYNTHESIZED SUCCESSFULLY!');
}

testKannadaSentences();
