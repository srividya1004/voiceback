require('dotenv').config();
const contextEngineService = require('../src/services/contextEngineService');

async function runLiveSmokeTest() {
  console.log('=====================================================');
  console.log('       REAL GEMINI API SMOKE TEST (gemini-3.6-flash)  ');
  console.log('=====================================================');
  
  const apiKeyPresent = !!(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim().length > 0);
  console.log(`A. Gemini API key detected: ${apiKeyPresent ? 'YES' : 'NO'}`);
  console.log(`B. Gemini model used: ${process.env.GEMINI_MODEL || 'gemini-3.6-flash'}`);

  const scenarios = [
    { lang: 'en', label: 'English', question: 'Did you eat lunch?' },
    { lang: 'kn', label: 'Kannada', question: 'ನೀವು ಊಟ ಮಾಡಿದಿರಾ?' },
    { lang: 'hi', label: 'Hindi', question: 'क्या आपने खाना खाया?' }
  ];

  for (const sc of scenarios) {
    console.log(`\n--- LIVE GEMINI API TEST [${sc.label.toUpperCase()} (${sc.lang})] ---`);
    console.log(`Caregiver Question: "${sc.question}"`);
    try {
      const res = await contextEngineService.generateResponseOptions({
        question: sc.question,
        language: sc.lang
      });

      const isLiveGemini = res.intentContext !== 'generic_fallback' && !res.intentContext.startsWith('rule_');
      const isScriptPure = res.options.every(opt => contextEngineService.validateLanguageScript(opt.text, sc.lang));

      console.log(`Source Engine: ${isLiveGemini ? 'LIVE GEMINI API RESULT' : 'LOCAL DETERMINISTIC FALLBACK RESULT'}`);
      console.log(`Intent Context: "${res.intentContext}"`);
      console.log(`Options Count: ${res.options.length}`);
      console.log(`Script Purity: ${isScriptPure ? 'PASS (100% Native Script)' : 'FAIL'}`);

      res.options.forEach((opt, idx) => {
        console.log(`  Option ${idx + 1}: [${opt.intent}] -> "${opt.text}"`);
      });
    } catch (err) {
      console.error(`❌ Live API Call Failed:`, err.message);
    }
  }

  // Fallback Simulation Test
  console.log('\n--- SIMULATING API FAILURE / FALLBACK TEST ---');
  const oldKey = process.env.GEMINI_API_KEY;
  process.env.GEMINI_API_KEY = 'INVALID_DUMMY_KEY';
  const fallbackRes = await contextEngineService.generateResponseOptions({
    question: 'Did you eat lunch?',
    language: 'en'
  });
  process.env.GEMINI_API_KEY = oldKey;

  const isFallbackValid = fallbackRes && fallbackRes.options.length >= 3 && (fallbackRes.intentContext.startsWith('rule_') || fallbackRes.intentContext === 'generic_fallback');
  console.log(`Fallback Status: ${isFallbackValid ? 'PASS (Local Deterministic Engine executed smoothly)' : 'FAIL'}`);
}

runLiveSmokeTest();
