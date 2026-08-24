/**
 * VoiceBack Phase C Automated Verification Suite
 * Tests dynamic context reasoning, semantic intent mapping, multilingual rendering (en/kn/hi),
 * context-difference validation, API failure fallbacks, and future EMG intent submission contract.
 *
 * Rules:
 * - Uses generic fixtures only (patientA, caregiverA, doctorA)
 * - Does NOT modify or dirty the clean production/demo MongoDB database
 */

require('dotenv').config();
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const contextEngineService = require('../src/services/contextEngineService');
const communicationHistoryService = require('../src/services/communicationHistoryService');

const TEST_QUESTIONS = [
  'Did you eat lunch?',
  'How are you feeling today?',
  'Did you take your medicine?',
  'Are you in pain?',
  'What would you like to do now?',
  'Do you want to go outside?',
  'Are you tired?'
];

let mongoServer;

async function setupTestDb() {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
  console.log('[TestPhaseC] Connected to isolated MongoMemoryServer.');
}

async function teardownTestDb() {
  await mongoose.disconnect();
  if (mongoServer) {
    await mongoServer.stop();
  }
  console.log('[TestPhaseC] Disconnected isolated test database.');
}

async function runPhaseCTests() {
  console.log('=====================================================');
  console.log('       VOICEBACK PHASE C AUTOMATED VERIFICATION      ');
  console.log('=====================================================\n');

  await setupTestDb();

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition, message) {
    totalTests++;
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passedTests++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      throw new Error(`Assertion Failed: ${message}`);
    }
  }

  try {
    // -----------------------------------------------------
    // TEST 1: VERIFY ALL 7 REQUIRED CAREGIVER QUESTIONS
    // -----------------------------------------------------
    console.log('--- TEST GROUP 1: Required Caregiver Questions (English) ---');
    const questionOptionSets = {};

    for (let i = 0; i < TEST_QUESTIONS.length; i++) {
      const q = TEST_QUESTIONS[i];
      const result = await contextEngineService.generateResponseOptions({
        question: q,
        language: 'en'
      });

      assert(result && Array.isArray(result.options) && result.options.length >= 3, `Question "${q}" generated options array`);
      assert(result.question === q, `Result contains original caregiver question`);

      result.options.forEach((opt) => {
        assert(typeof opt.id === 'string' && opt.id.length > 0, `Option ID present (${opt.id})`);
        assert(typeof opt.intent === 'string' && opt.intent === opt.intent.toUpperCase(), `Semantic intent is uppercase string (${opt.intent})`);
        assert(typeof opt.text === 'string' && opt.text.length > 0, `Natural response text present ("${opt.text}")`);
      });

      questionOptionSets[q] = result.options;
    }

    // -----------------------------------------------------
    // TEST 2: CRITICAL CONTEXT DIFFERENCE TEST
    // -----------------------------------------------------
    console.log('\n--- TEST GROUP 2: CRITICAL Context-Difference Test ---');
    const q1 = TEST_QUESTIONS[0]; // "Did you eat lunch?"
    const q2 = TEST_QUESTIONS[1]; // "How are you feeling today?"
    const q3 = TEST_QUESTIONS[2]; // "Did you take your medicine?"

    const opts1 = questionOptionSets[q1].map((o) => o.intent).join(',');
    const opts2 = questionOptionSets[q2].map((o) => o.intent).join(',');
    const opts3 = questionOptionSets[q3].map((o) => o.intent).join(',');

    assert(opts1 !== opts2, `Question 1 ("${q1}") option set differs from Question 2 ("${q2}")`);
    assert(opts2 !== opts3, `Question 2 ("${q2}") option set differs from Question 3 ("${q3}")`);
    assert(opts1 !== opts3, `Question 1 ("${q1}") option set differs from Question 3 ("${q3}")`);

    console.log(`  ℹ️ Q1 Intents: [${opts1}]`);
    console.log(`  ℹ️ Q2 Intents: [${opts2}]`);
    console.log(`  ℹ️ Q3 Intents: [${opts3}]`);

    // -----------------------------------------------------
    // TEST 3: MULTILINGUAL VERIFICATION (English, Kannada, Hindi)
    // -----------------------------------------------------
    console.log('\n--- TEST GROUP 3: Multilingual Verification (en, kn, hi) ---');
    const multiLangQuestion = 'Did you eat lunch?';

    const resEn = await contextEngineService.generateResponseOptions({ question: multiLangQuestion, language: 'en' });
    const resKn = await contextEngineService.generateResponseOptions({ question: multiLangQuestion, language: 'kn' });
    const resHi = await contextEngineService.generateResponseOptions({ question: multiLangQuestion, language: 'hi' });

    assert(resEn.options[0].intent === resKn.options[0].intent, `Semantic intent preserved across English & Kannada (${resEn.options[0].intent})`);
    assert(resEn.options[0].intent === resHi.options[0].intent, `Semantic intent preserved across English & Hindi (${resEn.options[0].intent})`);

    assert(resEn.options[0].text !== resKn.options[0].text, `Kannada text differs from English ("${resKn.options[0].text}")`);
    assert(resEn.options[0].text !== resHi.options[0].text, `Hindi text differs from English ("${resHi.options[0].text}")`);

    // -----------------------------------------------------
    // TEST 4: DETERMINISTIC LOCAL FALLBACK & UNKNOWN QUESTION FALLBACK
    // -----------------------------------------------------
    console.log('\n--- TEST GROUP 4: Local Deterministic & Generic Fallbacks ---');
    const unknownQ = 'Is the sky purple right now?';
    const fallbackRes = contextEngineService.getDeterministicFallback(unknownQ, 'en');

    assert(fallbackRes.options.length === 5, `Generic fallback returns 5 safe options`);
    const fallbackIntents = fallbackRes.options.map((o) => o.intent);
    assert(fallbackIntents.includes('YES') && fallbackIntents.includes('NO') && fallbackIntents.includes('HELP'), `Safe generic fallback includes YES, NO, HELP`);

    // -----------------------------------------------------
    // TEST 5: FUTURE EMG INTENT SUBMISSION CONTRACT
    // -----------------------------------------------------
    console.log('\n--- TEST GROUP 5: Future EMG Intent Submission Contract ---');
    const genericPatientId = new mongoose.Types.ObjectId();

    const emgPayload = {
      patientId: genericPatientId,
      attemptType: 'EMGInference',
      recognizedText: 'I want something to eat.',
      confidenceScore: 0.95,
      semanticIntent: 'MEAL_REQUEST',
      language: 'en',
      caregiverQuestion: 'Did you eat lunch?'
    };

    const savedRecord = await communicationHistoryService.create(emgPayload);
    assert(savedRecord && savedRecord._id, `EMG intent log persisted to CommunicationHistory`);
    assert(savedRecord.attemptType === 'EMGInference', `attemptType recorded as EMGInference`);
    assert(savedRecord.semanticIntent === 'MEAL_REQUEST', `semanticIntent recorded as MEAL_REQUEST`);
    assert(savedRecord.recognizedText === 'I want something to eat.', `recognizedText preserved`);

    // -----------------------------------------------------
    // TEST 6: REAL GEMINI API SMOKE TEST (LIVE EN, KN, HI)
    // -----------------------------------------------------
    console.log('\n--- TEST GROUP 6: Real Gemini API Smoke Test ---');
    if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim().length > 0) {
      console.log(`  ℹ️ GEMINI_API_KEY detected. Executing live API verification using model [${process.env.GEMINI_MODEL || 'gemini-3.6-flash'}]...`);

      const liveTestScenarios = [
        { lang: 'en', question: 'Did you eat lunch?' },
        { lang: 'kn', question: 'ನೀವು ಊಟ ಮಾಡಿದಿರಾ?' },
        { lang: 'hi', question: 'क्या आपने खाना खाया?' }
      ];

      for (const scenario of liveTestScenarios) {
        try {
          const liveRes = await contextEngineService.generateResponseOptions({
            question: scenario.question,
            language: scenario.lang
          });
          
          assert(liveRes && Array.isArray(liveRes.options) && liveRes.options.length >= 3 && liveRes.options.length <= 5, `[LIVE GEMINI API RESULT ${scenario.lang.toUpperCase()}] Returned 3-5 options`);
          assert(liveRes.language === scenario.lang, `[LIVE GEMINI API RESULT ${scenario.lang.toUpperCase()}] Language matches (${scenario.lang})`);
          assert(liveRes.intentContext.length > 0, `[LIVE GEMINI API RESULT ${scenario.lang.toUpperCase()}] Intent context present (${liveRes.intentContext})`);

          console.log(`\n  --- LIVE GEMINI API RESULT [${scenario.lang.toUpperCase()}] ---`);
          console.log(`  Question: "${scenario.question}"`);
          console.log(`  Intent Context: "${liveRes.intentContext}"`);
          liveRes.options.forEach((opt, idx) => {
            assert(typeof opt.intent === 'string' && opt.intent.length > 0, `[LIVE GEMINI API] Option ${idx+1} has intent (${opt.intent})`);
            assert(typeof opt.text === 'string' && opt.text.length > 0, `[LIVE GEMINI API] Option ${idx+1} has text ("${opt.text}")`);
            const isPure = contextEngineService.validateLanguageScript(opt.text, scenario.lang);
            assert(isPure, `[LIVE GEMINI API] Script purity passed for option ${idx+1}: "${opt.text}"`);
            console.log(`    Option ${idx+1}: [${opt.intent}] -> "${opt.text}"`);
          });

          console.log(`  ✅ [LIVE GEMINI API RESULT ${scenario.lang.toUpperCase()}] PASSED.`);
        } catch (apiErr) {
          console.error(`  ❌ Safe Error in Live Gemini API [${scenario.lang.toUpperCase()}]:`, apiErr.message);
          throw apiErr;
        }
      }

      // API Failure Fallback Simulation
      console.log('\n  --- Simulating API Failure / Invalid Key Fallback ---');
      const oldKey = process.env.GEMINI_API_KEY;
      process.env.GEMINI_API_KEY = 'INVALID_DUMMY_KEY_FOR_TEST';
      const fallbackSimRes = await contextEngineService.generateResponseOptions({
        question: 'Did you eat lunch?',
        language: 'en'
      });
      process.env.GEMINI_API_KEY = oldKey; // Restore real key immediately

      assert(fallbackSimRes && Array.isArray(fallbackSimRes.options) && fallbackSimRes.options.length >= 3, '[LOCAL DETERMINISTIC FALLBACK RESULT] Fallback triggered smoothly on API failure');
      assert(fallbackSimRes.intentContext.includes('rule_') || fallbackSimRes.intentContext === 'generic_fallback', '[LOCAL DETERMINISTIC FALLBACK RESULT] Context label identifies local fallback');
      console.log(`  ✅ [LOCAL DETERMINISTIC FALLBACK RESULT] Simulation PASSED.`);

    } else {
      console.log('  ⚠️ NOT RUN — API key unavailable (GEMINI_API_KEY is not configured in process.env)');
    }

    // -----------------------------------------------------
    // TEST 7: SCRIPT CONTAMINATION & MULTILINGUAL QUALITY VALIDATION
    // -----------------------------------------------------
    console.log('\n--- TEST GROUP 7: Script Contamination & Multilingual Quality Validation ---');
    const { validateLanguageScript } = contextEngineService;

    // A. Direct Contamination Detection Unit Tests
    assert(validateLanguageScript('ಹೌದು, ನಾನು ಊಟ ಮಾಡಿದ್ದೇನೆ.', 'kn') === true, 'Pure Kannada script passes validation');
    assert(validateLanguageScript('ಇಲ್ಲ, ನಾನು 아직 ಊಟ ಮಾಡಿಲ್ಲ.', 'kn') === false, 'Korean contamination in Kannada detected and rejected');
    assert(validateLanguageScript('ಹೌದು, ನಾನು khana ಊಟ ಮಾಡಿದ್ದೇನೆ.', 'kn') === false, 'Latin contamination in Kannada detected and rejected');

    assert(validateLanguageScript('हाँ, मैंने खाना खा लिया।', 'hi') === true, 'Pure Devanagari script passes validation');
    assert(validateLanguageScript('नहीं, मैंने ಊಟ खा लिया।', 'hi') === false, 'Kannada contamination in Hindi detected and rejected');

    assert(validateLanguageScript('Yes, I ate lunch.', 'en') === true, 'Pure English text passes validation');
    assert(validateLanguageScript('Yes, I ate ಊಟ lunch.', 'en') === false, 'Kannada contamination in English detected and rejected');
    assert(validateLanguageScript('Yes, I ate खाना lunch.', 'en') === false, 'Devanagari contamination in English detected and rejected');

    // B. Validate All 7 Questions Across English, Kannada, Hindi (Zero Contamination)
    const languagesToTest = ['en', 'kn', 'hi'];
    for (const lang of languagesToTest) {
      console.log(`  🔍 Validating script purity for language: [${lang.toUpperCase()}]...`);
      for (const q of TEST_QUESTIONS) {
        const langResult = await contextEngineService.generateResponseOptions({ question: q, language: lang });
        assert(langResult.options.length >= 3, `Options generated for "${q}" in [${lang}]`);

        langResult.options.forEach((opt) => {
          const isClean = validateLanguageScript(opt.text, lang);
          assert(isClean, `Zero script contamination in [${lang}] text: "${opt.text}" (Intent: ${opt.intent})`);
        });
      }
    }

    // -----------------------------------------------------
    // TEST 8: CANONICAL SEMANTIC INTENT NORMALIZATION & CROSS-LANGUAGE EQUIVALENCE
    // -----------------------------------------------------
    console.log('\n--- TEST GROUP 8: Canonical Semantic Intent Normalization & Cross-Language Equivalence ---');
    const { normalizeSemanticIntent } = contextEngineService;

    // A. Normalization Unit Tests
    assert(normalizeSemanticIntent('NOT_HUNGRY', 'No, not hungry.') === 'MEAL_DECLINED', 'NOT_HUNGRY normalizes to MEAL_DECLINED');
    assert(normalizeSemanticIntent('MEAL_DECLINED', 'ಈಗ ಊಟ ಬೇಡ.') === 'MEAL_DECLINED', 'MEAL_DECLINED preserves MEAL_DECLINED');
    assert(normalizeSemanticIntent('WANT_FOOD', 'मुझे भूख लगी है।') === 'MEAL_REQUEST', 'WANT_FOOD normalizes to MEAL_REQUEST');
    assert(normalizeSemanticIntent('FEELING_HUNGRY', 'ನನಗೆ ಹಸಿವಾಗಿದೆ.') === 'MEAL_REQUEST', 'FEELING_HUNGRY normalizes to MEAL_REQUEST');
    assert(normalizeSemanticIntent('PAIN_MILD', 'Mild pain') === 'PAIN_PRESENT', 'PAIN_MILD normalizes to PAIN_PRESENT');
    assert(normalizeSemanticIntent('PAIN_SEVERE', 'Severe pain') === 'PAIN_PRESENT', 'PAIN_SEVERE normalizes to PAIN_PRESENT');
    assert(normalizeSemanticIntent('ACTIVITY_REST', 'Rest') === 'ACTIVITY_WANT', 'ACTIVITY_REST normalizes to ACTIVITY_WANT');

    // B. Extensible Unknown Intent Test
    assert(normalizeSemanticIntent('CUSTOM_FUTURE_INTENT') === 'CUSTOM_FUTURE_INTENT', 'Extensible custom intent preserved without breaking');

    // C. Cross-Language Semantic Intent Equivalence Proof
    const questionEN = 'Did you eat lunch?';
    const questionKN = 'ನೀವು ಊಟ ಮಾಡಿದಿರಾ?';
    const questionHI = 'क्या आपने खाना खाया?';

    const resEN = await contextEngineService.getDeterministicFallback(questionEN, 'en');
    const resKN = await contextEngineService.getDeterministicFallback(questionKN, 'kn');
    const resHI = await contextEngineService.getDeterministicFallback(questionHI, 'hi');

    [resEN, resKN, resHI].forEach(res => {
      res.options.forEach(opt => {
        assert(typeof opt.rawIntent === 'string' && opt.rawIntent.length > 0, `rawIntent present on option: ${opt.rawIntent}`);
        assert(typeof opt.intent === 'string' && opt.intent.length > 0, `intent alias present on option: ${opt.intent}`);
        assert(typeof opt.semanticIntent === 'string' && opt.semanticIntent.length > 0, `canonical semanticIntent present on option: ${opt.semanticIntent}`);
      });
    });

    const completedEN = resEN.options.find(o => o.semanticIntent === 'MEAL_COMPLETED');
    const completedKN = resKN.options.find(o => o.semanticIntent === 'MEAL_COMPLETED');
    const completedHI = resHI.options.find(o => o.semanticIntent === 'MEAL_COMPLETED');

    assert(completedEN && completedKN && completedHI, 'MEAL_COMPLETED intent present across EN, KN, HI');
    assert(completedEN.semanticIntent === completedKN.semanticIntent && completedKN.semanticIntent === completedHI.semanticIntent, 'Canonical semanticIntent is 100% identical (MEAL_COMPLETED) across EN, KN, HI');

    const notEatenEN = resEN.options.find(o => o.semanticIntent === 'MEAL_NOT_EATEN');
    const notEatenKN = resKN.options.find(o => o.semanticIntent === 'MEAL_NOT_EATEN');
    const notEatenHI = resHI.options.find(o => o.semanticIntent === 'MEAL_NOT_EATEN');

    assert(notEatenEN && notEatenKN && notEatenHI, 'MEAL_NOT_EATEN intent present across EN, KN, HI');
    assert(notEatenEN.semanticIntent === notEatenKN.semanticIntent && notEatenKN.semanticIntent === notEatenHI.semanticIntent, 'Canonical semanticIntent is 100% identical (MEAL_NOT_EATEN) across EN, KN, HI');

    console.log('  ✅ Canonical semanticIntent is 100% language-independent across English, Kannada & Hindi.');

    console.log('\n=====================================================');
    console.log(`  🎉 ALL PHASE C AUTOMATED TESTS PASSED (${passedTests}/${totalTests})`);
    console.log('=====================================================\n');
  } catch (err) {
    console.error('\n❌ PHASE C TEST SUITE FAILED:', err.message);
    process.exitCode = 1;
  } finally {
    await teardownTestDb();
  }
}

runPhaseCTests();
