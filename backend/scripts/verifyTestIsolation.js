/**
 * VoiceBack Test Database Isolation & Safety Guard Verification Script
 *
 * Proves:
 * 1. Production database document counts before testing.
 * 2. Test database document counts before testing.
 * 3. Run a complete synthetic registration test ONLY against the test database.
 * 4. Show the created test UserLogin and Patient exist ONLY in the test database.
 * 5. Confirm production database counts did not change.
 * 6. Run duplicate-registration test against test DB.
 * 7. Confirm duplicate attempt creates zero additional UserLogin/Patient documents.
 * 8. Run login/profile/voice tests against test DB.
 * 9. Confirm no test document was written to production.
 * 10. Confirm that if TEST_MONGODB_URI is removed or matches production, tests fail safely.
 */

const dns = require('dns');
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {}

const mongoose = require('mongoose');
const axios = require('axios');
const http = require('http');
require('dotenv').config();

const { connectTestDB, assertTestDatabase } = require('../src/config/database');
const app = require('../src/app');

const TEST_PORT = 5005;
const TEST_API_BASE = `http://localhost:${TEST_PORT}/api`;

async function verifyIsolation() {
  console.log('====================================================');
  console.log('VOICEBACK DATABASE ISOLATION & SAFETY VERIFICATION');
  console.log('====================================================');

  const prodUri = process.env.MONGODB_URI;
  const testUri = process.env.TEST_MONGODB_URI;

  console.log('\n--- ENVIRONMENT VARIABLE AUDIT ---');
  console.log('MONGODB_URI (Production):', prodUri ? prodUri.replace(/\/\/.*@/, '//<credentials-hidden>@') : 'MISSING');
  console.log('TEST_MONGODB_URI (Test):  ', testUri ? testUri.replace(/\/\/.*@/, '//<credentials-hidden>@') : 'MISSING');

  if (!testUri) {
    throw new Error('TEST_MONGODB_URI is missing in .env!');
  }

  // ----------------------------------------------------------------
  // STEP 10 (Early Test): SAFETY GUARD VALIDATION
  // Prove that missing or production TEST_MONGODB_URI fails safely!
  // ----------------------------------------------------------------
  console.log('\n====================================================');
  console.log('SAFETY GUARD CHECK 1: Missing TEST_MONGODB_URI');
  console.log('====================================================');
  let missingUriBlocked = false;
  try {
    assertTestDatabase('');
  } catch (err) {
    missingUriBlocked = true;
    console.log('✅ PASS: Missing URI was safely blocked!');
    console.log('   Error:', err.message);
  }
  if (!missingUriBlocked) throw new Error('FAIL: Missing URI was not blocked!');

  console.log('\n====================================================');
  console.log('SAFETY GUARD CHECK 2: Production DB Name Rejected');
  console.log('====================================================');
  let prodDbBlocked = false;
  try {
    assertTestDatabase(prodUri, 'voiceback');
  } catch (err) {
    prodDbBlocked = true;
    console.log('✅ PASS: Production database "voiceback" was safely blocked!');
    console.log('   Error:', err.message);
  }
  if (!prodDbBlocked) throw new Error('FAIL: Production database connection was not blocked!');

  // ----------------------------------------------------------------
  // STEP 1 & 2: BASELINE DOCUMENT COUNTS (PROD vs TEST)
  // ----------------------------------------------------------------
  console.log('\n====================================================');
  console.log('STEP 1 & 2: BASELINE COUNTS BEFORE TEST');
  console.log('====================================================');

  // Connect read-only client to Production DB to read baseline counts
  const prodConn = await mongoose.createConnection(prodUri, { serverSelectionTimeoutMS: 15000 }).asPromise();
  const prodDbName = prodConn.db.databaseName;
  const prodUserLoginsBefore = await prodConn.collection('userlogins').countDocuments();
  const prodPatientsBefore = await prodConn.collection('patients').countDocuments();
  const prodVoiceProfilesBefore = await prodConn.collection('voiceprofiles').countDocuments();

  console.log(`Production Database: "${prodDbName}"`);
  console.log(`  - userlogins:    ${prodUserLoginsBefore}`);
  console.log(`  - patients:      ${prodPatientsBefore}`);
  console.log(`  - voiceprofiles: ${prodVoiceProfilesBefore}`);

  // Connect read-only client to Test DB to read baseline counts
  const testConn = await mongoose.createConnection(testUri, { serverSelectionTimeoutMS: 15000 }).asPromise();
  const testDbName = testConn.db.databaseName;
  const testUserLoginsBefore = await testConn.collection('userlogins').countDocuments();
  const testPatientsBefore = await testConn.collection('patients').countDocuments();
  const testVoiceProfilesBefore = await testConn.collection('voiceprofiles').countDocuments();

  console.log(`Test Database: "${testDbName}"`);
  console.log(`  - userlogins:    ${testUserLoginsBefore}`);
  console.log(`  - patients:      ${testPatientsBefore}`);
  console.log(`  - voiceprofiles: ${testVoiceProfilesBefore}`);

  // ----------------------------------------------------------------
  // STEP 3: START TEST SERVER CONNECTED EXCLUSIVELY TO TEST DB
  // ----------------------------------------------------------------
  console.log('\n====================================================');
  console.log('STEP 3: STARTING ISOLATED TEST SERVER ON PORT ' + TEST_PORT);
  console.log('====================================================');

  await connectTestDB(); // Connects default mongoose instance to TEST_MONGODB_URI

  let testServer;
  await new Promise((resolve) => {
    testServer = app.listen(TEST_PORT, () => {
      console.log(`✅ Test server running on http://localhost:${TEST_PORT}/api bound to "${mongoose.connection.db.databaseName}"`);
      resolve();
    });
  });

  // ----------------------------------------------------------------
  // STEP 3 & 4: RUN SYNTHETIC REGISTRATION AGAINST TEST DB
  // ----------------------------------------------------------------
  console.log('\n====================================================');
  console.log('STEP 3 & 4: SYNTHETIC REGISTRATION IN TEST DB ONLY');
  console.log('====================================================');

  const testEmail = `isolated.test.${Date.now()}@voiceback.org`;
  const testPayload = {
    email: testEmail,
    password: 'Password@1234',
    role: 'Patient',
    fullName: 'Isolated Test Patient',
    age: 22,
    gender: 'Female',
    preferredLanguage: 'Kannada',
    aphasiaType: "Broca's",
    mobileNumber: '9999988888',
    emergencyContact: '9999977777'
  };

  console.log(`Registering new test user (${testEmail}) via POST ${TEST_API_BASE}/user-logins...`);
  const regRes = await axios.post(`${TEST_API_BASE}/user-logins`, testPayload);
  console.log(`Registration status: ${regRes.status}`);
  const regUser = regRes.data.data;
  const authToken = regUser.token;

  console.log(`  - Created UserLogin ID: ${regUser._id}`);
  console.log(`  - Created Patient ID:   ${regUser.profile?._id}`);
  console.log(`  - Token Present:        ${Boolean(authToken)}`);

  // Verify presence in TEST database
  const inTestUser = await testConn.collection('userlogins').findOne({ email: testEmail });
  const inTestPatient = await testConn.collection('patients').findOne({ email: testEmail });
  console.log(`\nPresence in TEST Database ("${testDbName}"):`);
  console.log(`  - UserLogin found: ${Boolean(inTestUser)} (ID: ${inTestUser?._id})`);
  console.log(`  - Patient found:   ${Boolean(inTestPatient)} (ID: ${inTestPatient?._id})`);

  if (!inTestUser || !inTestPatient) {
    throw new Error('FAIL: Record was not saved to test database!');
  }

  // ----------------------------------------------------------------
  // STEP 5: PROVE PRODUCTION DATABASE COUNTS ARE UNCHANGED
  // ----------------------------------------------------------------
  console.log('\n====================================================');
  console.log('STEP 5: VERIFY PRODUCTION DATABASE WAS NOT TOUCHED');
  console.log('====================================================');

  const inProdUser = await prodConn.collection('userlogins').findOne({ email: testEmail });
  const inProdPatient = await prodConn.collection('patients').findOne({ email: testEmail });
  const prodUserLoginsAfterReg = await prodConn.collection('userlogins').countDocuments();
  const prodPatientsAfterReg = await prodConn.collection('patients').countDocuments();

  console.log(`Production Database ("${prodDbName}") Inspection:`);
  console.log(`  - Test email found in production UserLogin: ${Boolean(inProdUser)} (Expected: false)`);
  console.log(`  - Test email found in production Patient:   ${Boolean(inProdPatient)} (Expected: false)`);
  console.log(`  - UserLogin count before: ${prodUserLoginsBefore}, after: ${prodUserLoginsAfterReg} (Delta: ${prodUserLoginsAfterReg - prodUserLoginsBefore})`);
  console.log(`  - Patient count before:   ${prodPatientsBefore}, after: ${prodPatientsAfterReg} (Delta: ${prodPatientsAfterReg - prodPatientsBefore})`);

  if (inProdUser || inProdPatient || prodUserLoginsAfterReg !== prodUserLoginsBefore || prodPatientsAfterReg !== prodPatientsBefore) {
    throw new Error('FATAL FAILURE: Test record leaked into production database!');
  }
  console.log('✅ PROOF CONFIRMED: Zero records written to production database.');

  // ----------------------------------------------------------------
  // STEP 6 & 7: DUPLICATE REGISTRATION TEST IN TEST DB
  // ----------------------------------------------------------------
  console.log('\n====================================================');
  console.log('STEP 6 & 7: DUPLICATE REGISTRATION IDEMPOTENCY TEST');
  console.log('====================================================');

  let dupRejected = false;
  let dupStatus = null;
  let dupMessage = null;

  try {
    await axios.post(`${TEST_API_BASE}/user-logins`, testPayload);
  } catch (err) {
    dupRejected = true;
    dupStatus = err.response?.status;
    dupMessage = err.response?.data?.message;
  }

  const testUserLoginsAfterDup = await testConn.collection('userlogins').countDocuments({ email: testEmail });
  const testPatientsAfterDup = await testConn.collection('patients').countDocuments({ email: testEmail });

  console.log(`Duplicate Attempt Result:`);
  console.log(`  - Rejected:      ${dupRejected}`);
  console.log(`  - HTTP Status:   ${dupStatus}`);
  console.log(`  - Error Message: "${dupMessage}"`);
  console.log(`  - Test UserLogins for email: ${testUserLoginsAfterDup} (Expected: 1)`);
  console.log(`  - Test Patients for email:   ${testPatientsAfterDup} (Expected: 1)`);

  if (!dupRejected || dupStatus !== 400 || testUserLoginsAfterDup !== 1 || testPatientsAfterDup !== 1) {
    throw new Error('FAIL: Duplicate registration idempotency check failed!');
  }
  console.log('✅ PASS: Duplicate registration rejected and created 0 duplicate documents.');

  // ----------------------------------------------------------------
  // STEP 8: LOGIN, PROFILE & VOICE SYNTHESIS IN TEST DB
  // ----------------------------------------------------------------
  console.log('\n====================================================');
  console.log('STEP 8: LOGIN, PROFILE & VOICE RESOLUTION TEST');
  console.log('====================================================');

  // Login
  const loginRes = await axios.post(`${TEST_API_BASE}/user-logins/login`, {
    email: testEmail,
    password: 'Password@1234'
  });
  console.log(`Login Status: ${loginRes.status}`);
  const loginToken = loginRes.data.data.token;

  // /me Profile
  const meRes = await axios.get(`${TEST_API_BASE}/user-logins/me`, {
    headers: { Authorization: `Bearer ${loginToken}` }
  });
  console.log(`/me Status: ${meRes.status}`);
  console.log(`  - FullName:       "${meRes.data.data.fullName}"`);
  console.log(`  - Profile Age:    ${meRes.data.data.profile?.age}`);
  console.log(`  - ProfileMissing: ${meRes.data.data.profileMissing}`);

  // Voice synthesis with patientId from test database
  const synthRes = await axios.post(`${TEST_API_BASE}/voice-profiles/synthesize`, {
    patientId: inTestPatient._id.toString(),
    text: 'ನಮಸ್ಕಾರ',
    language: 'Kannada'
  }, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${loginToken}`
    },
    responseType: 'arraybuffer'
  });

  const synthVoiceId = synthRes.headers['x-resolved-voice-id'];
  const synthAgeGroup = synthRes.headers['x-resolved-age-group'];
  const synthGender = synthRes.headers['x-resolved-gender'];
  const synthBytes = synthRes.data.byteLength;

  console.log(`Voice Synthesis in Test Environment:`);
  console.log(`  - Resolved Voice ID:  ${synthVoiceId}`);
  console.log(`  - Resolved Age Group: ${synthAgeGroup} (Expected: young for age 22)`);
  console.log(`  - Resolved Gender:    ${synthGender}`);
  console.log(`  - Audio Bytes:        ${synthBytes}`);

  if (synthAgeGroup !== 'young' || synthBytes < 1000) {
    throw new Error('FAIL: Voice synthesis resolution in test DB failed!');
  }
  console.log('✅ PASS: Voice synthesis resolved correctly from test patient profile.');

  // ----------------------------------------------------------------
  // STEP 9: FINAL PRODUCTION INTEGRITY AUDIT
  // ----------------------------------------------------------------
  console.log('\n====================================================');
  console.log('STEP 9: FINAL PRODUCTION INTEGRITY VERIFICATION');
  console.log('====================================================');

  const prodUserLoginsFinal = await prodConn.collection('userlogins').countDocuments();
  const prodPatientsFinal = await prodConn.collection('patients').countDocuments();
  const prodVoiceProfilesFinal = await prodConn.collection('voiceprofiles').countDocuments();

  console.log(`Production Database Final Counts:`);
  console.log(`  - userlogins:    ${prodUserLoginsFinal} (Initial: ${prodUserLoginsBefore}, Delta: ${prodUserLoginsFinal - prodUserLoginsBefore})`);
  console.log(`  - patients:      ${prodPatientsFinal} (Initial: ${prodPatientsBefore}, Delta: ${prodPatientsFinal - prodPatientsBefore})`);
  console.log(`  - voiceprofiles: ${prodVoiceProfilesFinal} (Initial: ${prodVoiceProfilesBefore}, Delta: ${prodVoiceProfilesFinal - prodVoiceProfilesBefore})`);

  if (prodUserLoginsFinal !== prodUserLoginsBefore || prodPatientsFinal !== prodPatientsBefore || prodVoiceProfilesFinal !== prodVoiceProfilesBefore) {
    throw new Error('FATAL: Production database was modified during testing!');
  }

  console.log('\n🎉 ALL 10 DATABASE ISOLATION REQUIREMENTS VERIFIED SUCCESSFULLY!');

  // Cleanup test server and connections
  await new Promise((resolve) => testServer.close(resolve));
  await prodConn.close();
  await testConn.close();
  await mongoose.disconnect();

  console.log('Connections closed cleanly.\n');
}

verifyIsolation().catch((err) => {
  console.error('\n❌ Isolation Verification FAILED:', err.message);
  process.exit(1);
});
