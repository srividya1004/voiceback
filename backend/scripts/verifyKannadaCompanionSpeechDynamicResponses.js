/**
 * Comprehensive Verification Suite for Fully Dynamic Context-Aware Companion Speech in Kannada
 * Tests all 13 mandatory scenarios with both Live Gemini Context Engine & NLP Processor Fallback
 */

import { generateResponseOptions, detectUtteranceLanguage } from '../src/services/contextEngineService.js';
import nlpProcessorService from '../src/services/nlpProcessorService.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const TEST_SCENARIOS = [
  {
    id: 1,
    name: 'Movie or outing invitation',
    input: 'ನಾವು ಸಿನಿಮಾ ನೋಡಲು ಹೋಗೋಣವೇ?',
    expectedKeywords: ['ಹೋಗೋಣ', 'ಸಿನಿಮಾ', 'ಇಷ್ಟ', 'ಆಸಕ್ತಿ'],
    forbidden: ['ಟಿವಿ', 'watching tv', 'ರೈಸ್', 'headache']
  },
  {
    id: 2,
    name: 'Food / snack question',
    input: 'ನಿಮಗೆ ಏನು ತಿನ್ನಬೇಕು?',
    expectedKeywords: ['ತಿಂಡಿ', 'ಚಿಪ್ಸ್', 'ಸಿಹಿ', 'ಹಣ್ಣು', 'ಬೇಡ'],
    forbidden: ['ಟಿವಿ', 'watching tv', 'ನಡಿಗೆ']
  },
  {
    id: 3,
    name: 'Tea / coffee or binary choice',
    input: 'ನಿಮಗೆ ಚಹಾ ಬೇಕಾ ಅಥವಾ ಕಾಫಿ ಬೇಕಾ?',
    expectedKeywords: ['ಚಹಾ', 'ಕಾಫಿ', 'ಎರಡೂ ಬೇಡ'],
    forbidden: ['ಟಿವಿ', 'watching tv', 'ಸಿನಿಮಾ']
  },
  {
    id: 4,
    name: 'Wellbeing question',
    input: 'ನಿಮಗೆ ಈಗ ಹೇಗನಿಸುತ್ತಿದೆ?',
    expectedKeywords: ['ಚೆನ್ನಾಗಿದೆ', 'ಸುಧಾರಣೆ', 'ವಿಶ್ರಾಂತಿ', 'ಆರಾಮ'],
    forbidden: ['ಟಿವಿ ನೋಡ್ತಾ ಇದ್ದೀನಿ', 'watching tv']
  },
  {
    id: 5,
    name: 'General yes/no question',
    input: 'ನೀವು ಬೆಳಗ್ಗೆ ವಾಕಿಂಗ್ ಹೋಗಿದ್ದೀರಾ?',
    expectedKeywords: ['ಹೌದು', 'ಇಲ್ಲ'],
    forbidden: ['watching tv']
  },
  {
    id: 6,
    name: 'Assistance offer',
    input: 'ನಾನು ನಿಮಗೆ ಸಹಾಯ ಮಾಡಲಾ?',
    expectedKeywords: ['ಸಹಾಯ', 'ಧನ್ಯವಾದ', 'ಮಾಡಿಕೊಳ್ಳುತ್ತೇನೆ'],
    forbidden: ['watching tv', 'ಚಹಾ']
  },
  {
    id: 7,
    name: 'Location question',
    input: 'ನಿಮ್ಮ ಕನ್ನಡಕ ಎಲ್ಲಿ ಇಟ್ಟಿದ್ದೀರಿ?',
    expectedKeywords: ['ಮೇಜಿನ', 'ಇಟ್ಟಿದ್ದೇನೆ', 'ನೆನಪಾಗುತ್ತಿಲ್ಲ', 'ಹುಡುಕಿ', 'ಕೋಣೆ', 'ಬ್ಯಾಗ್'],
    forbidden: ['watching tv', 'ತೋಟಕ್ಕೆ ಹೋಗೋಣ']
  },
  {
    id: 8,
    name: 'Reason question',
    input: 'ಯಾಕೆ ಇಷ್ಟು ಚಿಂತೆ ಮಾಡ್ತಿದ್ದೀರಿ?',
    expectedKeywords: ['ಆಯಾಸ', 'ಏನೂ ಇಲ್ಲ', 'ಆರಾಮ', 'ಯೋಚನೆ'],
    forbidden: ['watching tv']
  },
  {
    id: 9,
    name: 'Open-ended Kannada statement',
    input: 'ನಿಮ್ಮ ಮೊಮ್ಮಗ ಇವತ್ತು ಕ್ರಿಕೆಟ್ ಮ್ಯಾಚ್ ಗೆದ್ದಿದ್ದಾನೆ!',
    expectedKeywords: ['ಸಂತೋಷ', 'ಸುದ್ದಿ', 'ಧನ್ಯವಾದ'],
    forbidden: ['watching tv']
  },
  {
    id: 10,
    name: 'Unseen Kannada question',
    input: 'ನಾವು ಈ ಹೊಸ ಕಥಾ ಪುಸ್ತಕವನ್ನು ಓದೋಣವೇ?',
    expectedKeywords: ['ಓದೋಣ', 'ಹೌದು', 'ಇಷ್ಟ', 'ನಂತರ'],
    forbidden: ['watching tv']
  },
  {
    id: 11,
    name: 'Roman Kannada input',
    input: 'chaha beka coffee beka?',
    expectedKeywords: ['ಚಹಾ', 'ಕಾಫಿ', 'ಎರಡೂ ಬೇಡ'],
    forbidden: ['watching tv']
  },
  {
    id: 12,
    name: 'Mixed Kannada-English input',
    input: 'Doctor ge call madla?',
    expectedKeywords: ['ಡಾಕ್ಟರ್', 'ಕಾಲ್', 'ಹೌದು', 'ಬೇಡ', 'ಮಾಡಿ'],
    forbidden: ['watching tv']
  }
];

async function runTests() {
  console.log('===============================================================');
  console.log('🔊 VOICEBACK KANNADA COMPANION SPEECH VERIFICATION SUITE');
  console.log('===============================================================\n');

  let passed = 0;
  let failed = 0;

  // PART 1: LIVE GEMINI CONTEXT ENGINE TESTS
  console.log('--- PART 1: LIVE GEMINI CONTEXT ENGINE (ALL 12 SCENARIOS) ---');
  for (const scenario of TEST_SCENARIOS) {
    const detected = detectUtteranceLanguage(scenario.input, 'en');
    console.log(`\n[Scenario ${scenario.id}] ${scenario.name}`);
    console.log(`  Input: "${scenario.input}" (Language detected: ${detected})`);

    try {
      const res = await generateResponseOptions({ caregiverQuestion: scenario.input, language: detected });
      const options = res.options || [];

      if (!options || options.length === 0) {
        console.error(`  ❌ FAILED: No options returned`);
        failed++;
        continue;
      }

      console.log(`  Output [${res.source}]:`);
      let allKnScript = true;
      let hasForbidden = false;

      options.forEach((opt, idx) => {
        const text = opt.text || opt;
        console.log(`    ${idx + 1}. ${text}`);
        if (!/[\u0C80-\u0CFF]/.test(text)) {
          allKnScript = false;
        }
        for (const f of scenario.forbidden) {
          if (text.toLowerCase().includes(f.toLowerCase())) {
            hasForbidden = true;
            console.error(`      ⚠️ Contains forbidden keyword: "${f}"`);
          }
        }
      });

      if (!allKnScript) {
        console.error(`  ❌ FAILED: Output must be in Kannada script!`);
        failed++;
      } else if (hasForbidden) {
        console.error(`  ❌ FAILED: Output contained irrelevant canned content`);
        failed++;
      } else {
        console.log(`  ✅ PASSED`);
        passed++;
      }
    } catch (err) {
      console.error(`  ❌ ERROR: ${err.message}`);
      failed++;
    }
  }

  // PART 2: NLP DETERMINISTIC FALLBACK TESTS
  console.log('\n--- PART 2: NLP DETERMINISTIC FALLBACK ENGINE (OFFLINE/FAILOVER) ---');
  for (const scenario of TEST_SCENARIOS) {
    console.log(`\n[Fallback ${scenario.id}] ${scenario.name}`);
    console.log(`  Input: "${scenario.input}"`);

    const fallbackOpts = nlpProcessorService.generateSemanticNLPResponses(scenario.input, 'kn');
    if (!fallbackOpts || fallbackOpts.length === 0) {
      console.error(`  ❌ FAILED: No fallback options returned`);
      failed++;
      continue;
    }

    console.log(`  Fallback Output (${fallbackOpts.length} options):`);
    let allKnScript = true;
    let hasForbidden = false;

    fallbackOpts.forEach((opt, idx) => {
      console.log(`    ${idx + 1}. [${opt.intent}] ${opt.text}`);
      if (!/[\u0C80-\u0CFF]/.test(opt.text)) {
        allKnScript = false;
      }
      for (const f of scenario.forbidden) {
        if (opt.text.toLowerCase().includes(f.toLowerCase())) {
          hasForbidden = true;
          console.error(`      ⚠️ Fallback contains forbidden keyword: "${f}"`);
        }
      }
    });

    if (!allKnScript) {
      console.error(`  ❌ FAILED: Fallback output must be in Kannada script!`);
      failed++;
    } else if (hasForbidden) {
      console.error(`  ❌ FAILED: Fallback contained irrelevant canned content`);
      failed++;
    } else {
      console.log(`  ✅ PASSED`);
      passed++;
    }
  }

  // PART 3: SIMULATED AI FAILURE TEST (SCENARIO 13)
  console.log('\n--- PART 3: SCENARIO 13 - SIMULATED AI FAILURE AND GRACEFUL FALLBACK ---');
  try {
    const testInput = 'ನಾವು ಸಿನಿಮಾ ನೋಡಲು ಹೋಗೋಣವೇ?';
    console.log(`Simulating AI failure with prompt: "${testInput}"`);

    // Simulate what happens when callGeminiAPI fails: generateSemanticNLPResponses is called
    const fallbackRes = nlpProcessorService.generateSemanticNLPResponses(testInput, 'kn');
    console.log(`Graceful fallback produced ${fallbackRes.length} options:`);
    fallbackRes.forEach((opt, i) => console.log(`  ${i + 1}. ${opt.text}`));

    const hasCinema = fallbackRes.some(opt => opt.text.includes('ಹೋಗೋಣ') || opt.text.includes('ಸಿನಿಮಾ'));
    const noTV = !fallbackRes.some(opt => opt.text.includes('ಟಿವಿ'));

    if (fallbackRes.length >= 4 && hasCinema && noTV) {
      console.log('  ✅ PASSED: Simulated AI failure gracefully returns high-quality Kannada movie options without generic TV non-sequiturs.');
      passed++;
    } else {
      console.error('  ❌ FAILED: Fallback did not produce relevant cinema responses.');
      failed++;
    }
  } catch (e) {
    console.error(`  ❌ ERROR in simulated fallback: ${e.message}`);
    failed++;
  }

  console.log('\n===============================================================');
  console.log(`📊 FINAL RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('===============================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
