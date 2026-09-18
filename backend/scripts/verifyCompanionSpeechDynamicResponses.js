/**
 * Comprehensive Automated Verification Suite for Companion Speech Dynamic-Response Feature
 * Tests:
 * 1. Core Benchmark Scenarios:
 *    - Movie invitation
 *    - Food/snack preference
 *    - Tea or coffee question
 *    - Feeling-better question
 *    - Yes/no question
 *    - Open-ended companion statement
 *    - AI/NLP failure fallback (Gemini unavailable)
 * 2. Generalized Unseen Companion Scenarios:
 *    - Reading invitation ("Shall we read a book together?")
 *    - Dynamic binary choice ("Do you want apple or banana?")
 *    - Assistance offer ("Can I help you put on your sweater?")
 *    - Location inquiry ("Where did you leave your reading glasses?")
 *    - Personal news statement ("Your grandson did very well in his match today.")
 *    - Concern / reason question ("Why are you looking so worried?")
 *    - Environment observation ("The flowers on the balcony are blooming.")
 * 3. Generalized Fallback Verification:
 *    - Confirms that even when Gemini is bypassed, the fallback dynamically understands
 *      the speech act (choice, invitation, offer, reason, observation) without hardcoded questions.
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const contextEngineService = require('../src/services/contextEngineService');
const nlpProcessorService = require('../src/services/nlpProcessorService');

async function runTests() {
  console.log('================================================================');
  console.log('🧪 COMPANION SPEECH DYNAMIC & GENERALIZED VERIFICATION SUITE');
  console.log('================================================================\n');

  let passed = 0;
  let total = 0;

  function record(desc, ok, details = '') {
    total++;
    if (ok) {
      passed++;
      console.log(`  ✅ PASS: ${desc}`);
    } else {
      console.error(`  ❌ FAIL: ${desc}`);
      if (details) console.error(`     Details: ${details}`);
    }
  }

  // -------------------------------------------------------------
  // PART 1: CORE BENCHMARK SCENARIOS (AI Generation + Fallback)
  // -------------------------------------------------------------
  console.log('--- Part 1: Core Benchmark Scenarios ---');

  // Scenario 1: Movie invitation
  const qMovie = "Hi, let's go to see the movie.";
  const resMovie = await contextEngineService.generateResponseOptions({ question: qMovie, language: 'en' });
  const movieTexts = resMovie.options.map(o => o.text);
  const movieNoBad = !movieTexts.some(t => t.includes('watching TV') || t.includes('doing fine, thank you'));
  const movieRelevant = movieTexts.some(t => /go|movie|film|tired|day|see/i.test(t));
  record('1. Movie Invitation (Backend AI): Relevant and no canned non-sequiturs', movieRelevant && movieNoBad, JSON.stringify(movieTexts));

  // Scenario 2: Food/snack preference
  const qFood = "What would you like to eat?";
  const resFood = await contextEngineService.generateResponseOptions({ question: qFood, language: 'en' });
  const foodTexts = resFood.options.map(o => o.text);
  const foodRelevant = foodTexts.some(t => /snack|eat|food|chips|popcorn|sweet|soup|light|nothing/i.test(t));
  record('2. Food Preference (Backend AI): Returns relevant food/snack choices', foodRelevant, JSON.stringify(foodTexts));

  // Scenario 3: Tea or coffee question
  const qTeaCoffee = "Would you like tea or coffee?";
  const resTeaCoffee = await contextEngineService.generateResponseOptions({ question: qTeaCoffee, language: 'en' });
  const tcTexts = resTeaCoffee.options.map(o => o.text);
  const tcRelevant = tcTexts.some(t => /tea/i.test(t)) && tcTexts.some(t => /coffee/i.test(t));
  record('3. Tea or Coffee Question (Backend AI): Returns tea/coffee options', tcRelevant, JSON.stringify(tcTexts));

  // Scenario 4: Feeling-better question
  const qBetter = "Are you feeling better today?";
  const resBetter = await contextEngineService.generateResponseOptions({ question: qBetter, language: 'en' });
  const betterTexts = resBetter.options.map(o => o.text);
  const betterRelevant = betterTexts.some(t => /better|well|rest/i.test(t));
  record('4. Feeling Better Question (Backend AI): Returns wellbeing choices', betterRelevant, JSON.stringify(betterTexts));

  // Scenario 5: Yes/no question
  const qYesNo = "Did you take your walk this morning?";
  const resYesNo = await contextEngineService.generateResponseOptions({ question: qYesNo, language: 'en' });
  const ynTexts = resYesNo.options.map(o => o.text);
  const ynRelevant = ynTexts.some(t => /yes|no|walk|morning|later/i.test(t));
  record('5. Yes/No Question (Backend AI): Returns direct affirmative/negative choices', ynRelevant, JSON.stringify(ynTexts));

  // Scenario 6: Open-ended companion statement
  const qStatement = "It looks like it might rain today.";
  const resStatement = await contextEngineService.generateResponseOptions({ question: qStatement, language: 'en' });
  const stTexts = resStatement.options.map(o => o.text);
  const stNoTv = !stTexts.some(t => t.includes('watching TV') || t.includes('doing fine, thank you'));
  record('6. Open Statement (Backend AI): Contextually conversational, zero canned TV replies', stNoTv, JSON.stringify(stTexts));

  // -------------------------------------------------------------
  // PART 2: GENERALIZED UNSEEN COMPANION SCENARIOS (AI Engine)
  // -------------------------------------------------------------
  console.log('\n--- Part 2: Generalized Unseen Scenarios (AI Engine) ---');

  // Unseen 1: Reading invitation
  const qRead = "Shall we read a book together?";
  const resRead = await contextEngineService.generateResponseOptions({ question: qRead, language: 'en' });
  const readTexts = resRead.options.map(o => o.text);
  record('Unseen 1 ("Shall we read a book together?"): Relevant patient responses', readTexts.some(t => /read|book|tired|later|rest|love/i.test(t)), JSON.stringify(readTexts));

  // Unseen 2: Dynamic binary choice
  const qFruit = "Do you want apple or banana?";
  const resFruit = await contextEngineService.generateResponseOptions({ question: qFruit, language: 'en' });
  const fruitTexts = resFruit.options.map(o => o.text);
  record('Unseen 2 ("Do you want apple or banana?"): Relevant choice options', fruitTexts.some(t => /apple/i.test(t)) || fruitTexts.some(t => /banana/i.test(t)), JSON.stringify(fruitTexts));

  // Unseen 3: Assistance offer
  const qSweater = "Can I help you put on your sweater?";
  const resSweater = await contextEngineService.generateResponseOptions({ question: qSweater, language: 'en' });
  const sweaterTexts = resSweater.options.map(o => o.text);
  record('Unseen 3 ("Can I help you put on your sweater?"): Relevant response to offer', sweaterTexts.some(t => /please|help|manage|thank|sweater/i.test(t)), JSON.stringify(sweaterTexts));

  // Unseen 4: Location inquiry
  const qGlasses = "Where did you leave your reading glasses?";
  const resGlasses = await contextEngineService.generateResponseOptions({ question: qGlasses, language: 'en' });
  const glassesTexts = resGlasses.options.map(o => o.text);
  record('Unseen 4 ("Where did you leave your reading glasses?"): Relevant location / memory reply', glassesTexts.some(t => /table|bed|room|not sure|remember|glasses/i.test(t)), JSON.stringify(glassesTexts));

  // Unseen 5: News statement
  const qNews = "Your grandson did very well in his match today.";
  const resNews = await contextEngineService.generateResponseOptions({ question: qNews, language: 'en' });
  const newsTexts = resNews.options.map(o => o.text);
  record('Unseen 5 ("Your grandson did very well in his match today."): Natural conversational pride/appreciation', newsTexts.some(t => /proud|happy|hear|great|call|good/i.test(t)), JSON.stringify(newsTexts));

  // Unseen 6: Reason / why question
  const qWorried = "Why are you looking so worried?";
  const resWorried = await contextEngineService.generateResponseOptions({ question: qWorried, language: 'en' });
  const worriedTexts = resWorried.options.map(o => o.text);
  record('Unseen 6 ("Why are you looking so worried?"): Relevant explanation/reassurance', worriedTexts.some(t => /tired|fine|thinking|words|worry|nothing/i.test(t)), JSON.stringify(worriedTexts));

  // Unseen 7: Environmental observation
  const qFlowers = "The flowers on the balcony are blooming.";
  const resFlowers = await contextEngineService.generateResponseOptions({ question: qFlowers, language: 'en' });
  const flowersTexts = resFlowers.options.map(o => o.text);
  record('Unseen 7 ("The flowers on the balcony are blooming."): Conversational observation reply', flowersTexts.some(t => /pretty|love|flowers|spring|nice|bloom/i.test(t)), JSON.stringify(flowersTexts));

  // -------------------------------------------------------------
  // PART 3: GENERALIZED FALLBACK ENGINE (Simulated AI Outage)
  // -------------------------------------------------------------
  console.log('\n--- Part 3: Generalized Local Fallback Engine (Zero Hardcoding) ---');

  // Fallback 1: Dynamic binary choice extraction (unseen)
  const fbChoice = contextEngineService.getDeterministicFallback("Do you prefer apple or orange?", 'en');
  const fbChoiceTexts = fbChoice.options.map(o => o.text);
  record('Fallback 1 (Dynamic "X or Y" extraction): Generates preference for extracted options', fbChoiceTexts.some(t => t.includes('apple')) && fbChoiceTexts.some(t => t.includes('orange')), JSON.stringify(fbChoiceTexts));

  // Fallback 2: General assistance offer (unseen)
  const fbAssist = contextEngineService.getDeterministicFallback("Can I help you put on your coat?", 'en');
  const fbAssistTexts = fbAssist.options.map(o => o.text);
  record('Fallback 2 (General assistance offer): Generates accept/decline for offer', fbAssistTexts.some(t => t.includes('helpful')) && fbAssistTexts.some(t => t.includes('manage')), JSON.stringify(fbAssistTexts));

  // Fallback 3: General activity invitation (unseen)
  const fbInv = contextEngineService.getDeterministicFallback("Shall we listen to the radio together?", 'en');
  const fbInvTexts = fbInv.options.map(o => o.text);
  record('Fallback 3 (General activity invitation): Generates invitation acceptance/timing', fbInvTexts.some(t => /love to|wonderful/i.test(t)) && fbInvTexts.some(t => /rest|later/i.test(t)), JSON.stringify(fbInvTexts));

  // Fallback 4: General why question (unseen)
  const fbWhy = contextEngineService.getDeterministicFallback("Why are you sitting so quietly?", 'en');
  const fbWhyTexts = fbWhy.options.map(o => o.text);
  record('Fallback 4 (General why inquiry): Generates sensible patient explanation', fbWhyTexts.some(t => /tired|fine|thinking/i.test(t)), JSON.stringify(fbWhyTexts));

  // Fallback 5: General declarative statement / observation (unseen)
  const fbObs = contextEngineService.getDeterministicFallback("The neighbor brought over fresh bread.", 'en');
  const fbObsTexts = fbObs.options.map(o => o.text);
  record('Fallback 5 (General statement): Generates polite conversational acknowledgment, zero TV non-sequiturs', fbObsTexts.some(t => /good|wonderful|understand|know/i.test(t)) && !fbObsTexts.some(t => t.includes('watching TV')), JSON.stringify(fbObsTexts));

  // Fallback 6: Kannada dynamic binary choice
  const fbKn = contextEngineService.getDeterministicFallback("ನೀವು ಚಹಾ ಅಥವಾ ಹಾಲು ಬಯಸುತ್ತೀರಾ?", 'kn');
  const fbKnTexts = fbKn.options.map(o => o.text);
  record('Fallback 6 (Kannada dynamic choice): Localized native script choices', fbKnTexts.length > 0 && /[\u0C80-\u0CFF]/.test(fbKnTexts[0]), JSON.stringify(fbKnTexts));

  console.log('\n================================================================');
  console.log(`📊 TEST SUMMARY: ${passed} / ${total} TESTS PASSED`);
  console.log('================================================================');

  if (passed === total) {
    console.log('🎉 ALL DYNAMIC & GENERALIZED COMPANION SCENARIOS PASSED WITH 100% SUCCESS!');
    process.exit(0);
  } else {
    console.error('❌ SOME TESTS FAILED!');
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
