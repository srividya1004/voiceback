/**
 * VoiceBack Test 1B — Demographic Voice Verification Script
 *
 * Verifies all 8 demographic bands across age and gender:
 * 1. Female Child (<18, e.g. age 10) -> Bella (hpp4J3VqNfWAUOO0d1Us)
 * 2. Female Young (18-34, e.g. age 24) -> Jessica (cgSgspJ2msm6clMCkdW9)
 * 3. Female Adult (35-60, e.g. age 45) -> Sarah (EXAVITQu4vr4xnSDxMaL)
 * 4. Female Senior (>60, e.g. age 68) -> Matilda (XrExE9yKIg1WjnnlVkGX)
 * 5. Male Child (<18, e.g. age 10) -> Charlie (IKne3meq5aSn9XLyUdCD)
 * 6. Male Young (18-34, e.g. age 24) -> Antoni (ErXwobaYiN019PkySvjV)
 * 7. Male Adult (35-60, e.g. age 45) -> Adam (pNInz6obpgDQGcFmaJgB)
 * 8. Male Senior (>60, e.g. age 68) -> Bill (pqHfZKP75CvOlQylNhV4)
 *
 * Tests both:
 * - Direct demographic parameters (age + gender)
 * - Clinical Patient document lookup in isolated test database (voiceback_test)
 *
 * Verifies production database (voiceback) remains 100% untouched.
 */

const dns = require('dns');
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {}

const mongoose = require('mongoose');
const axios = require('axios');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const { connectTestDB } = require('../src/config/database');
const app = require('../src/app');

const TEST_PORT = 5005;
const TEST_API_BASE = `http://localhost:${TEST_PORT}/api`;

const PERSONAS = {
  'hpp4J3VqNfWAUOO0d1Us': { name: 'Bella', demographic: 'Child Female', desc: 'Soft, sweet, youthful girl voice' },
  'cgSgspJ2msm6clMCkdW9': { name: 'Jessica', demographic: 'Young Adult Female', desc: 'Bright, energetic, conversational young female voice' },
  'EXAVITQu4vr4xnSDxMaL': { name: 'Sarah', demographic: 'Adult Female', desc: 'Warm, confident, natural adult female voice' },
  'XrExE9yKIg1WjnnlVkGX': { name: 'Matilda', demographic: 'Senior Female', desc: 'Mature, composed, calm senior female voice' },
  'IKne3meq5aSn9XLyUdCD': { name: 'Charlie', demographic: 'Child Male', desc: 'Enthusiastic, energetic, youthful boy voice' },
  'ErXwobaYiN019PkySvjV': { name: 'Antoni', demographic: 'Young Adult Male', desc: 'Clear, expressive, articulate young male voice' },
  'pNInz6obpgDQGcFmaJgB': { name: 'Adam', demographic: 'Adult Male', desc: 'Deep, steady, authoritative adult male voice' },
  'pqHfZKP75CvOlQylNhV4': { name: 'Bill', demographic: 'Senior Male', desc: 'Wise, elder, warm senior male voice' }
};

const BANDS = [
  { label: 'Female Child', age: 10, gender: 'Female', expectedAgeGroup: 'child', expectedVoiceId: 'hpp4J3VqNfWAUOO0d1Us' },
  { label: 'Female Young', age: 24, gender: 'Female', expectedAgeGroup: 'young', expectedVoiceId: 'cgSgspJ2msm6clMCkdW9' },
  { label: 'Female Adult', age: 45, gender: 'Female', expectedAgeGroup: 'adult', expectedVoiceId: 'EXAVITQu4vr4xnSDxMaL' },
  { label: 'Female Senior', age: 68, gender: 'Female', expectedAgeGroup: 'senior', expectedVoiceId: 'XrExE9yKIg1WjnnlVkGX' },
  { label: 'Male Child', age: 10, gender: 'Male', expectedAgeGroup: 'child', expectedVoiceId: 'IKne3meq5aSn9XLyUdCD' },
  { label: 'Male Young', age: 24, gender: 'Male', expectedAgeGroup: 'young', expectedVoiceId: 'ErXwobaYiN019PkySvjV' },
  { label: 'Male Adult', age: 45, gender: 'Male', expectedAgeGroup: 'adult', expectedVoiceId: 'pNInz6obpgDQGcFmaJgB' },
  { label: 'Male Senior', age: 68, gender: 'Male', expectedAgeGroup: 'senior', expectedVoiceId: 'pqHfZKP75CvOlQylNhV4' }
];

async function runDemographicVoiceVerification() {
  console.log('========================================================================');
  console.log('VOICEBACK TEST 1B — DEMOGRAPHIC VOICE VERIFICATION RUN');
  console.log('========================================================================');

  // 1. Audit production DB before test
  const prodConn = await mongoose.createConnection(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 15000 }).asPromise();
  const prodUsersBefore = await prodConn.collection('userlogins').countDocuments();
  const prodPatientsBefore = await prodConn.collection('patients').countDocuments();
  console.log(`🛡️  Production Baseline ("${prodConn.db.databaseName}"): UserLogins=${prodUsersBefore}, Patients=${prodPatientsBefore}`);

  // 2. Connect test environment to voiceback_test
  await connectTestDB();
  console.log(`🛡️  Test Environment Connected to: "${mongoose.connection.db.databaseName}"`);

  // Start test Express server
  let server;
  await new Promise((resolve) => {
    server = app.listen(TEST_PORT, () => {
      console.log(`🚀 Isolated test server running on ${TEST_API_BASE}`);
      resolve();
    });
  });

  // Generate test JWT Bearer Token
  const testToken = jwt.sign(
    { id: '6a9c51291375dc3e10c4d2ee', email: 'test.demographic.runner@voiceback.org', role: 'Patient' },
    process.env.JWT_SECRET || 'voiceback_super_secret_key_2026',
    { expiresIn: '1h' }
  );

  console.log('\n------------------------------------------------------------------------');
  console.log('PART 1: TESTING ALL 8 DEMOGRAPHIC BANDS (DIRECT PAYLOAD)');
  console.log('Speech prompt: "ನಮಸ್ಕಾರ, ನಾನು ಕ್ಷೇಮವಾಗಿದ್ದೇನೆ." (Kannada)');
  console.log('------------------------------------------------------------------------\n');

  const results = [];

  for (const band of BANDS) {
    process.stdout.write(`Synthesizing [${band.label}] (Age: ${band.age}, Gender: ${band.gender})... `);
    try {
      const startTime = Date.now();
      const res = await axios.post(`${TEST_API_BASE}/voice-profiles/synthesize`, {
        text: 'ನಮಸ್ಕಾರ, ನಾನು ಕ್ಷೇಮವಾಗಿದ್ದೇನೆ.',
        age: band.age,
        gender: band.gender,
        language: 'Kannada'
      }, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${testToken}`
        },
        responseType: 'arraybuffer',
        timeout: 30000
      });
      const duration = Date.now() - startTime;

      const voiceId = res.headers['x-resolved-voice-id'];
      const ageGroup = res.headers['x-resolved-age-group'];
      const gender = res.headers['x-resolved-gender'];
      const provider = res.headers['x-voice-provider'];
      const voiceType = res.headers['x-voice-selection-type'];
      const bytes = res.data.byteLength;

      const persona = PERSONAS[voiceId] || { name: 'Unknown', desc: 'Unknown' };
      const voiceMatch = voiceId === band.expectedVoiceId;
      const ageGroupMatch = ageGroup === band.expectedAgeGroup;
      const audioGenerated = bytes > 1000 && provider === 'elevenlabs_ivc';

      const passed = voiceMatch && ageGroupMatch && audioGenerated;

      console.log(passed ? `✅ PASS (${bytes} bytes, ${duration}ms)` : `❌ FAIL`);

      results.push({
        label: band.label,
        inputAge: band.age,
        inputGender: band.gender,
        expectedAgeGroup: band.expectedAgeGroup,
        resolvedAgeGroup: ageGroup,
        expectedVoiceId: band.expectedVoiceId,
        resolvedVoiceId: voiceId,
        personaName: persona.name,
        personaDesc: persona.desc,
        provider,
        voiceType,
        audioBytes: bytes,
        durationMs: duration,
        status: passed ? 'PASS' : 'FAIL'
      });
    } catch (err) {
      console.log(`❌ ERROR: ${err.message}`);
      results.push({
        label: band.label,
        inputAge: band.age,
        inputGender: band.gender,
        status: 'ERROR',
        error: err.message
      });
    }
  }

  // ------------------------------------------------------------------------
  // PART 2: PATIENT DOCUMENT LOOKUP LINKAGE IN TEST DB
  // Verify that passing ONLY patientId (no age/gender in payload) reads from MongoDB
  // ------------------------------------------------------------------------
  console.log('\n------------------------------------------------------------------------');
  console.log('PART 2: PATIENT PROFILE -> VOICE LINKAGE FROM MONGODB DOCUMENT');
  console.log('------------------------------------------------------------------------');

  const PatientModel = mongoose.connection.model('Patient');

  // Create test patient with age 72, Male in test DB
  const seniorPatient = await PatientModel.create({
    userId: new mongoose.Types.ObjectId(),
    fullName: 'Ramesh Senior',
    email: `ramesh.senior.${Date.now()}@voiceback.org`,
    age: 72,
    gender: 'Male',
    preferredLanguage: 'Kannada',
    aphasiaType: "Broca's"
  });

  console.log(`Created test patient in voiceback_test: ID=${seniorPatient._id}, Age=72, Gender=Male`);

  // Request synthesis passing ONLY patientId
  process.stdout.write(`Synthesizing with ONLY patientId="${seniorPatient._id}"... `);
  const patientRes = await axios.post(`${TEST_API_BASE}/voice-profiles/synthesize`, {
    patientId: seniorPatient._id.toString(),
    text: 'ನಮಸ್ಕಾರ, ನಾನು ಹಿರಿಯ ನಾಗರಿಕ.',
    language: 'Kannada'
  }, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${testToken}`
    },
    responseType: 'arraybuffer',
    timeout: 30000
  });

  const pVoiceId = patientRes.headers['x-resolved-voice-id'];
  const pAgeGroup = patientRes.headers['x-resolved-age-group'];
  const pGender = patientRes.headers['x-resolved-gender'];
  const pBytes = patientRes.data.byteLength;

  const patientPassed = pVoiceId === 'pqHfZKP75CvOlQylNhV4' && pAgeGroup === 'senior' && pGender === 'Male' && pBytes > 1000;
  console.log(patientPassed ? `✅ PASS (${pBytes} bytes, Resolved to Bill - Senior Male)` : `❌ FAIL`);

  // Clean up test patient from voiceback_test
  await PatientModel.deleteOne({ _id: seniorPatient._id });

  // ------------------------------------------------------------------------
  // PART 3: PRODUCTION DATABASE INTEGRITY AUDIT
  // ------------------------------------------------------------------------
  console.log('\n------------------------------------------------------------------------');
  console.log('PART 3: PRODUCTION DATABASE NON-MUTATION AUDIT');
  console.log('------------------------------------------------------------------------');

  const prodUsersAfter = await prodConn.collection('userlogins').countDocuments();
  const prodPatientsAfter = await prodConn.collection('patients').countDocuments();

  console.log(`Production UserLogins: Before=${prodUsersBefore}, After=${prodUsersAfter}, Delta=${prodUsersAfter - prodUsersBefore}`);
  console.log(`Production Patients:   Before=${prodPatientsBefore}, After=${prodPatientsAfter}, Delta=${prodPatientsAfter - prodPatientsBefore}`);

  const prodUntouched = (prodUsersAfter === prodUsersBefore) && (prodPatientsAfter === prodPatientsBefore);

  console.log('\n========================================================================');
  console.log('SUMMARY TABLE: 8 DEMOGRAPHIC COMBINATIONS');
  console.log('========================================================================');
  console.table(results.map(r => ({
    'Demographic Band': r.label,
    'Age': r.inputAge,
    'Gender': r.inputGender,
    'Resolved AgeGroup': r.resolvedAgeGroup,
    'Resolved Voice ID': r.resolvedVoiceId,
    'Persona Name': r.personaName,
    'Audio Bytes': r.audioBytes,
    'Result': r.status
  })));

  await new Promise(r => server.close(r));
  await prodConn.close();
  await mongoose.disconnect();

  if (!prodUntouched) {
    throw new Error('FATAL: Production database was modified!');
  }

  const allPassed = results.every(r => r.status === 'PASS') && patientPassed;
  if (!allPassed) {
    throw new Error('One or more demographic voice combinations failed!');
  }

  console.log('\n🎉 TEST 1B — DEMOGRAPHIC VOICE VERIFICATION: 100% PASS!\n');
}

runDemographicVoiceVerification().catch(err => {
  console.error('\n❌ Test 1B Failed:', err.message);
  process.exit(1);
});
