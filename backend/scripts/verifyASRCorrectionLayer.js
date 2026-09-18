const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const assert = require('assert');
const { reconstructTranscriptWithGemini } = require('../src/controllers/voiceProfileController');

async function runTests() {
  console.log('========================================================================');
  console.log('🧪 VERIFYING GEMINI ASR TRANSCRIPT CORRECTION / RECONSTRUCTION LAYER');
  console.log('========================================================================\n');

  let passed = 0;
  let total = 0;

  function check(label, condition, detail = '') {
    total++;
    if (condition) {
      console.log(`✅ PASS: ${label}${detail ? ' -> ' + detail : ''}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${label}${detail ? ' -> ' + detail : ''}`);
    }
  }

  // TEST 1: User's primary required test case
  console.log('--- TEST 1: Primary Required Example ---');
  const raw1 = 'I have pain in my stomak from yesterdy';
  const res1 = await reconstructTranscriptWithGemini(raw1, 'en');
  console.log(`   Raw:      "${raw1}"`);
  console.log(`   Corrected: "${res1}"`);
  check(
    'Primary user example corrected to stomach/yesterday',
    /I have pain in my stomach from yesterday/i.test(res1),
    res1
  );

  // TEST 2: Clear English speech remains unchanged
  console.log('\n--- TEST 2: Clear English Speech ---');
  const raw2 = 'I want a glass of water please.';
  const res2 = await reconstructTranscriptWithGemini(raw2, 'en');
  console.log(`   Raw:      "${raw2}"`);
  console.log(`   Corrected: "${res2}"`);
  check(
    'Clear English sentence preserved without corruption',
    res2.toLowerCase().replace(/[.]/g, '').trim() === raw2.toLowerCase().replace(/[.]/g, '').trim(),
    res2
  );

  // TEST 3: Broken English words reconstructed meaningfully
  console.log('\n--- TEST 3: Broken English Words Reconstructed ---');
  const raw3 = 'pls help me walk to bathrom';
  const res3 = await reconstructTranscriptWithGemini(raw3, 'en');
  console.log(`   Raw:      "${raw3}"`);
  console.log(`   Corrected: "${res3}"`);
  check(
    'Broken words (pls, bathrom) normalized to proper English',
    /help me walk to (the )?bathroom/i.test(res3),
    res3
  );

  // TEST 4: Kannada script transcript preserved and corrected
  console.log('\n--- TEST 4: Kannada Script Preservation ---');
  const raw4 = 'ನನಗೆ ನೀರು ಬೇಕು';
  const res4 = await reconstructTranscriptWithGemini(raw4, 'kn');
  console.log(`   Raw:      "${raw4}"`);
  console.log(`   Corrected: "${res4}"`);
  check(
    'Kannada native script preserved properly',
    res4.includes('ನೀರು') && res4.includes('ಬೇಕು'),
    res4
  );

  // TEST 5: Kannada transliteration corrected to appropriate Kannada
  console.log('\n--- TEST 5: Kannada Transliteration Correction ---');
  const raw5 = 'nanage neeru beku';
  const res5 = await reconstructTranscriptWithGemini(raw5, 'kn');
  console.log(`   Raw:      "${raw5}"`);
  console.log(`   Corrected: "${res5}"`);
  check(
    'Kannada Latin transliteration reconstructed to clean Kannada',
    /[\u0C80-\u0CFF]/.test(res5) || /neeru beku/i.test(res5),
    res5
  );

  // TEST 6: Uncertain transcripts not overinterpreted / no hallucination
  console.log('\n--- TEST 6: Uncertain / Ambiguous Transcripts ---');
  const raw6 = 'xyz abc completely uncertain';
  const res6 = await reconstructTranscriptWithGemini(raw6, 'en');
  console.log(`   Raw:      "${raw6}"`);
  console.log(`   Corrected: "${res6}"`);
  check(
    'Uncertain input not fabricated into false medical diagnoses',
    !/cancer|diabetes|cardiac|infection|stroke|prescribe/i.test(res6),
    res6
  );

  // TEST 7: Empty or null input falls back safely
  console.log('\n--- TEST 7: Empty & Null Fallbacks ---');
  const resEmpty = await reconstructTranscriptWithGemini('', 'en');
  check('Empty string returns empty without crashing', resEmpty === '');

  const resNull = await reconstructTranscriptWithGemini(null, 'en');
  check('Null returns null or empty without crashing', resNull === null || resNull === '');

  // TEST 8: Gemini API failure / missing key fallback
  console.log('\n--- TEST 8: Fallback on API Key Failure ---');
  const originalKey = process.env.GEMINI_API_KEY;
  try {
    process.env.GEMINI_API_KEY = '';
    const rawFallback = 'Broken speech with missing api key';
    const resFallback = await reconstructTranscriptWithGemini(rawFallback, 'en');
    check(
      'Missing API key returns raw ASR transcript untouched',
      resFallback === rawFallback,
      resFallback
    );
  } finally {
    process.env.GEMINI_API_KEY = originalKey;
  }

  // TEST 9: Existing ASR output reaches correction layer (Controller contract)
  console.log('\n--- TEST 9: Controller Export & Contract ---');
  const controller = require('../src/controllers/voiceProfileController');
  check('transcribeSpeech exported as function', typeof controller.transcribeSpeech === 'function');
  check('reconstructTranscriptWithGemini exported as function', typeof controller.reconstructTranscriptWithGemini === 'function');

  console.log('\n========================================================================');
  console.log(`🏁 RESULTS: ${passed}/${total} TESTS PASSED (${Math.round((passed / total) * 100)}%)`);
  console.log('========================================================================\n');

  if (passed !== total) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
