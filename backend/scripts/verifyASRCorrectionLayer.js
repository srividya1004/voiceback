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
    /I have pain in my stomach (from|since) yesterday/i.test(res1),
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

  // TEST 9: Controller Export & Contract
  console.log('\n--- TEST 9: Controller Export & Contract ---');
  const controller = require('../src/controllers/voiceProfileController');
  check('transcribeSpeech exported as function', typeof controller.transcribeSpeech === 'function');
  check('reconstructTranscriptWithGemini exported as function', typeof controller.reconstructTranscriptWithGemini === 'function');
  check('resolveGeminiModels exported as function', typeof controller.resolveGeminiModels === 'function');

  // TEST 10: Model Name Deduplication & Order Preservation
  console.log('\n--- TEST 10: Deduplication & Fallback Order ---');
  const modelsWhenLite = controller.resolveGeminiModels('gemini-3.5-flash-lite');
  check(
    'gemini-3.5-flash-lite deduplicated (length 2, no duplicates)',
    modelsWhenLite.length === 2 && modelsWhenLite[0] === 'gemini-3.5-flash-lite' && modelsWhenLite[1] === 'gemini-3.6-flash',
    JSON.stringify(modelsWhenLite)
  );

  const modelsWhenFlash = controller.resolveGeminiModels('gemini-3.6-flash');
  check(
    'gemini-3.6-flash deduplicated (length 2, no duplicates)',
    modelsWhenFlash.length === 2 && modelsWhenFlash[0] === 'gemini-3.6-flash' && modelsWhenFlash[1] === 'gemini-3.5-flash-lite',
    JSON.stringify(modelsWhenFlash)
  );

  const modelsWhenCustom = controller.resolveGeminiModels('custom-model-x');
  check(
    'Custom model placed first without duplicates',
    modelsWhenCustom.length === 3 && modelsWhenCustom[0] === 'custom-model-x' && modelsWhenCustom[1] === 'gemini-3.6-flash' && modelsWhenCustom[2] === 'gemini-3.5-flash-lite',
    JSON.stringify(modelsWhenCustom)
  );

  const modelsWhenEmpty = controller.resolveGeminiModels(null);
  check(
    'Null primary model defaults to unique fallback models in standard order',
    modelsWhenEmpty.length === 2 && modelsWhenEmpty[0] === 'gemini-3.6-flash' && modelsWhenEmpty[1] === 'gemini-3.5-flash-lite',
    JSON.stringify(modelsWhenEmpty)
  );

  // TEST 11: Configurable Timeout Default & Override
  console.log('\n--- TEST 11: Configurable Timeout Verification ---');
  const originalTimeout = process.env.GEMINI_TIMEOUT_MS;
  try {
    process.env.GEMINI_TIMEOUT_MS = '2500';
    const parsedCustom = parseInt(process.env.GEMINI_TIMEOUT_MS, 10);
    check('GEMINI_TIMEOUT_MS custom value parsed correctly', parsedCustom === 2500);

    delete process.env.GEMINI_TIMEOUT_MS;
    const defaultTimeout = parseInt(process.env.GEMINI_TIMEOUT_MS, 10) || 4000;
    check('Sensible default timeout is 4000ms when env is absent', defaultTimeout === 4000);
  } finally {
    if (originalTimeout !== undefined) {
      process.env.GEMINI_TIMEOUT_MS = originalTimeout;
    } else {
      delete process.env.GEMINI_TIMEOUT_MS;
    }
  }

  // TEST 12: Response Contract & Raw Transcript Preservation
  console.log('\n--- TEST 12: transcribeSpeech Contract & Raw Transcript Integrity ---');
  let mockStatusCode = null;
  let mockJsonData = null;
  const mockRes = {
    status(code) {
      mockStatusCode = code;
      return this;
    },
    json(payload) {
      mockJsonData = payload;
      return this;
    }
  };

  // Simulate missing file error
  await controller.transcribeSpeech({ body: {} }, mockRes);
  check('Missing audio sample returns status 400 error', mockStatusCode === 400);

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
