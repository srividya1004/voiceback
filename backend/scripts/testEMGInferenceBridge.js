/**
 * VoiceBack Fix #3 Automated Backend Integration Test Suite
 * Verifies backend sEMG AI gesture inference bridge, intent labeling separation,
 * 1-channel BioAmp acquisition rejection, missing target model handling, and PyTorch benchmark execution.
 */

const emgProfileService = require('../src/services/emgProfileService');

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    throw new Error(`Assertion Failed: ${message}`);
  }
}

async function runBridgeTests() {
  console.log('==================================================');
  console.log(' VOICEBACK FIX #3 — BACKEND INFERENCE BRIDGE TEST ');
  console.log('==================================================\n');

  try {
    // -----------------------------------------------------
    // TEST 1: Physical 1-Channel BioAmp Input Signal Routing
    // -----------------------------------------------------
    console.log('--- TEST 1: Physical 1-Channel BioAmp Acquisition & Preprocessing ---');
    const bioamp1ch = Array(1000).fill([0.5]);
    const res1 = await emgProfileService.predictEMGIntent(null, bioamp1ch, 0, 'target');

    assert(res1.status === 'not_trained', `Status indicates 'not_trained' (got '${res1.status}')`);
    assert(res1.intent === 'Untrained 1-Channel Model', `Intent is 'Untrained 1-Channel Model' (got '${res1.intent}')`);
    assert(res1.confidenceScore === 0, 'Confidence score is 0');
    assert(res1.predictedText === '', 'No speech prediction is generated without trained 1-channel weights');
    assert(res1.emgMetrics.channelCount === 1, 'emgMetrics reports channelCount as 1');
    assert(res1.statusMessage.includes('1-channel BioAmp preprocessing and model architecture are ready'), 'Status message confirms 1-channel pipeline readiness');

    // -----------------------------------------------------
    // TEST 2: Target Mode without Calibrated Target Model
    // -----------------------------------------------------
    console.log('\n--- TEST 2: Target Mode without Calibrated Target Model ---');
    const emg8ch = Array(1000).fill(Array(8).fill(0.1));
    const res2 = await emgProfileService.predictEMGIntent(null, emg8ch, 0, 'target');

    assert(res2.status === 'not_calibrated', `Status is 'not_calibrated' (got '${res2.status}')`);
    assert(res2.intent === 'Uncalibrated Model', `Intent is 'Uncalibrated Model' (got '${res2.intent}')`);
    assert(res2.predictedText === '', 'No speech prediction generated for uncalibrated target mode');
    assert(res2.confidenceScore === 0, 'Confidence score is 0');
    assert(res2.statusMessage.includes('not calibrated'), 'Status message indicates target model not calibrated');

    // -----------------------------------------------------
    // TEST 3: Gaddy Benchmark Mode (PyTorch Execution)
    // -----------------------------------------------------
    console.log('\n--- TEST 3: Gaddy Benchmark Mode PyTorch Execution ---');
    const res3 = await emgProfileService.predictEMGIntent(null, emg8ch, 0, 'gaddy');

    assert(res3.status === 'success', `Status is 'success' (got '${res3.status}')`);
    assert(res3.intent === 'Benchmark Test', `Intent is 'Benchmark Test' (got '${res3.intent}')`);
    assert(typeof res3.predictedText === 'string', 'predictedText is returned as string');
    assert(res3.statusMessage === 'BENCHMARK TEST — NOT PATIENT TARGET VOCABULARY', 'Disclaimer strictly identifies benchmark test');
    assert(res3.aiInference.mode === 'gaddy', 'aiInference mode is gaddy');

    // -----------------------------------------------------
    // TEST 4: Empty Signal Handling
    // -----------------------------------------------------
    console.log('\n--- TEST 4: Empty Signal Handling ---');
    const res4 = await emgProfileService.predictEMGIntent(null, [], 0, 'target');

    assert(res4.status === 'not_ready', `Status is 'not_ready' (got '${res4.status}')`);
    assert(res4.intent === 'EMG AI Unavailable', `Intent is 'EMG AI Unavailable' (got '${res4.intent}')`);
    assert(res4.predictedText === '', 'predictedText is empty');
    assert(res4.confidenceScore === 0, 'Confidence score is 0');

    console.log('\n==================================================');
    console.log(' ALL FIX #3 BACKEND BRIDGE TESTS PASSED SUCCESSFULLY! ');
    console.log('==================================================\n');
  } catch (err) {
    console.error('\n❌ FIX #3 TEST FAILED:', err.message);
    process.exit(1);
  }
}

runBridgeTests();
