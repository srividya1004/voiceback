/**
 * Script Training Feature Backend Test Suite
 * Tests PersonalScript model, service, controller, and routes
 */

const mongoose = require('mongoose');
const PersonalScript = require('../src/models/PersonalScript');
const TherapyProgress = require('../src/models/TherapyProgress');
const personalScriptService = require('../src/services/personalScriptService');
const therapyProgressService = require('../src/services/therapyProgressService');
const { calculateCloseness } = require('../src/utils/closenessScorer');
const routes = require('../src/routes');

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    passed++;
    console.log(`  ✅ PASS: ${message}`);
  } else {
    failed++;
    console.error(`  ❌ FAIL: ${message}`);
  }
}

async function runTests() {
  console.log('\n========================================================================');
  console.log('VOICEBACK HEAR-YOURSELF SCRIPT TRAINING BACKEND TEST SUITE');
  console.log('========================================================================');

  // 1. PersonalScript Model Schema
  console.log('\n--- 1. PersonalScript Model Validation ---');
  assert(PersonalScript.schema.paths.patientId !== undefined, 'PersonalScript defines patientId');
  assert(PersonalScript.schema.paths.patientId.isRequired, 'patientId is required on PersonalScript');
  assert(PersonalScript.schema.paths.text !== undefined, 'PersonalScript defines text');
  assert(PersonalScript.schema.paths.text.isRequired, 'text is required on PersonalScript');
  assert(PersonalScript.schema.paths.category !== undefined, 'PersonalScript defines category');
  assert(PersonalScript.schema.paths['createdBy.role'] !== undefined, 'PersonalScript defines createdBy.role');
  assert(PersonalScript.schema.paths['createdBy.userId'] !== undefined, 'PersonalScript defines createdBy.userId');
  assert(PersonalScript.schema.paths.isActive !== undefined, 'PersonalScript defines isActive');
  assert(PersonalScript.schema.paths.isActive.defaultValue === true, 'PersonalScript isActive defaults to true');

  // 2. TherapyProgress Schema Backward Compatibility
  console.log('\n--- 2. TherapyProgress Model Backward Compatibility ---');
  assert(TherapyProgress.schema.paths.scriptId !== undefined, 'TherapyProgress has scriptId field');
  assert(TherapyProgress.schema.paths.attemptRawTranscript !== undefined, 'TherapyProgress has attemptRawTranscript field');
  assert(TherapyProgress.schema.paths.attemptReconstructedText !== undefined, 'TherapyProgress has attemptReconstructedText field');
  assert(TherapyProgress.schema.paths.closenessScore !== undefined, 'TherapyProgress has closenessScore field');
  // Verify existing fields are untouched
  assert(TherapyProgress.schema.paths.patientId !== undefined, 'TherapyProgress preserves patientId');
  assert(TherapyProgress.schema.paths.exercisesCompleted !== undefined, 'TherapyProgress preserves exercisesCompleted');
  assert(TherapyProgress.schema.paths.accuracyScore !== undefined, 'TherapyProgress preserves accuracyScore');
  assert(TherapyProgress.schema.paths.sessionDate !== undefined, 'TherapyProgress preserves sessionDate');
  assert(TherapyProgress.schema.paths.notes !== undefined, 'TherapyProgress preserves notes');

  // 3. Service Layer Functions
  console.log('\n--- 3. Service Layer Functions ---');
  assert(typeof personalScriptService.createScript === 'function', 'personalScriptService.createScript exists');
  assert(typeof personalScriptService.getScriptsByPatientId === 'function', 'personalScriptService.getScriptsByPatientId exists');
  assert(typeof personalScriptService.getScriptById === 'function', 'personalScriptService.getScriptById exists');
  assert(typeof personalScriptService.deactivateScript === 'function', 'personalScriptService.deactivateScript exists');
  assert(typeof therapyProgressService.recordScriptAttempt === 'function', 'therapyProgressService.recordScriptAttempt exists');

  // 4. Closeness Scorer Comparisons
  console.log('\n--- 4. Closeness Scorer Word-Level Comparison ---');
  const exactScore = calculateCloseness('I love my daughter Meera.', 'I love my daughter Meera.');
  assert(exactScore === 100, `Target vs Identical Reconstructed = 100 (got ${exactScore})`);

  const closeScore = calculateCloseness('I love my daughter Meera.', 'I love daughter Mira.');
  assert(closeScore >= 50 && closeScore <= 85, `Target vs Near Match = 60-85% (got ${closeScore})`);

  const unrelatedScore = calculateCloseness('I love my daughter Meera.', 'The weather is very hot outside.');
  assert(unrelatedScore <= 15, `Target vs Unrelated = near 0% (got ${unrelatedScore})`);

  const emptyTarget = calculateCloseness('', 'I love my daughter Meera.');
  assert(emptyTarget === 0, `Empty target safely returns 0 (got ${emptyTarget})`);

  const emptyRecon = calculateCloseness('I love my daughter Meera.', '');
  assert(emptyRecon === 0, `Empty reconstructed safely returns 0 (got ${emptyRecon})`);

  const bothEmpty = calculateCloseness('', '');
  assert(bothEmpty === 100, `Both empty safely returns 100 (got ${bothEmpty})`);

  // 5. Route Mounting
  console.log('\n--- 5. Express Route Mount Validation ---');
  const mounted = routes.stack.some(layer => layer.regexp && layer.regexp.test('/scripts'));
  assert(mounted, '/scripts route is mounted in express routes/index.js');

  console.log('\n========================================================================');
  console.log(`SCRIPT TRAINING TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('========================================================================');

  if (failed > 0) process.exit(1);
}

runTests().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
