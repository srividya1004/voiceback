/**
 * VoiceBack Test 1 Comprehensive Verification Script
 * Validates:
 * 1. Unauthenticated 401 prevention logic
 * 2. Atomic Patient Registration & Persistence in MongoDB
 * 3. Profile Display / API retrieval with JWT Bearer
 * 4. Refresh & Re-login persistence without duplicate records
 * 5. Demographic Voice Selection (all 8 age/gender combinations + KN/EN)
 * 6. IVC Failure Safety (failed clone must NOT set Ready or default voice)
 * 7. Existing user safety & orphan VoiceProfile non-destructive check
 */

const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);
const mongoose = require('mongoose');
const axios = require('axios');
require('dotenv').config();

const { connectTestDB } = require('../src/config/database');
const app = require('../src/app');

const TEST_PORT = 5005;
const API_BASE = `http://localhost:${TEST_PORT}/api`;

async function runVerification() {
  console.log('====================================================');
  console.log('VOICEBACK TEST 1 — COMPREHENSIVE VERIFICATION RUN');
  console.log('====================================================');

  await connectTestDB();
  console.log('Connected to ISOLATED MongoDB Atlas Test DB:', mongoose.connection.db.databaseName);

  let testServer;
  await new Promise((resolve) => {
    testServer = app.listen(TEST_PORT, () => {
      console.log(`Test API Server running on port ${TEST_PORT} bound to ${mongoose.connection.db.databaseName}`);
      resolve();
    });
  });

  const UserLogin = mongoose.connection.collection('userlogins');
  const Patient = mongoose.connection.collection('patients');
  const VoiceProfile = mongoose.connection.collection('voiceprofiles');


  // Baseline check: inspect existing records before test
  const preUserLogins = await UserLogin.find({}).toArray();
  const prePatients = await Patient.find({}).toArray();
  const preVoiceProfiles = await VoiceProfile.find({}).toArray();

  console.log(`\n--- PRE-TEST DATABASE STATE ---`);
  console.log(`UserLogins Count: ${preUserLogins.length}`);
  preUserLogins.forEach(u => console.log(`  - UserLogin ID: ${u._id}, Email: ${u.email}, Role: ${u.role}`));
  console.log(`Patients Count: ${prePatients.length}`);
  console.log(`VoiceProfiles Count: ${preVoiceProfiles.length}`);
  preVoiceProfiles.forEach(v => console.log(`  - VoiceProfile ID: ${v._id}, PatientId: ${v.patientId}, VoiceId: ${v.voiceId}, Status: ${v.status}`));

  // ----------------------------------------------------
  // TEST 1A: UNAUTHENTICATED 401 GUARD CHECK
  // ----------------------------------------------------
  console.log(`\n====================================================`);
  console.log(`MANUAL TEST 1A — UNAUTHENTICATED 401 ERROR CHECK`);
  console.log(`====================================================`);
  let unauthBlocked = false;
  try {
    await axios.get(`${API_BASE}/voice-profiles`);
  } catch (err) {
    if (err.response && err.response.status === 401) {
      unauthBlocked = true;
      console.log(`✅ Expected: Protected endpoint /api/voice-profiles requires Bearer token (HTTP 401).`);
      console.log(`   Message: "${err.response.data.message}"`);
    }
  }

  // ----------------------------------------------------
  // TEST 1B: NEW PATIENT REGISTRATION
  // ----------------------------------------------------
  console.log(`\n====================================================`);
  console.log(`MANUAL TEST 1B — NEW PATIENT REGISTRATION`);
  console.log(`====================================================`);
  const testEmail = `test.anita.rao.${Date.now()}@voiceback.org`;
  const testPassword = 'Password@1234';
  const testPatientData = {
    email: testEmail,
    password: testPassword,
    role: 'Patient',
    fullName: 'Anita Rao',
    age: 28,
    gender: 'Female',
    preferredLanguage: 'Kannada',
    aphasiaType: "Broca's",
    mobileNumber: '9876543210',
    emergencyContact: '9876543211'
  };

  console.log(`Registering new test patient via POST /api/user-logins...`);
  const regResponse = await axios.post(`${API_BASE}/user-logins`, testPatientData);
  console.log(`Registration Response Status: ${regResponse.status}`);
  const regData = regResponse.data.data;
  console.log(`  - Returned UserLogin ID: ${regData._id}`);
  console.log(`  - Returned Token Present: ${Boolean(regData.token)}`);
  console.log(`  - Returned Profile Present: ${Boolean(regData.profile)}`);
  if (regData.profile) {
    console.log(`  - Profile FullName: "${regData.profile.fullName}"`);
    console.log(`  - Profile Age: ${regData.profile.age}`);
    console.log(`  - Profile Gender: "${regData.profile.gender}"`);
    console.log(`  - Profile Language: "${regData.profile.preferredLanguage}"`);
    console.log(`  - Profile AphasiaType: "${regData.profile.aphasiaType}"`);
    console.log(`  - Profile Phone: "${regData.profile.phone}"`);
  }

  const authToken = regData.token;

  // Verify MongoDB immediately after registration
  const postRegUserLogins = await UserLogin.find({ email: testEmail }).toArray();
  const postRegPatients = await Patient.find({ email: testEmail }).toArray();

  console.log(`\nMongoDB Verification after Registration:`);
  console.log(`  - UserLogins for ${testEmail}: ${postRegUserLogins.length} (Expected: 1)`);
  console.log(`  - Patients for ${testEmail}: ${postRegPatients.length} (Expected: 1)`);

  if (postRegPatients.length > 0) {
    const pDoc = postRegPatients[0];
    console.log(`  - Patient Document ID: ${pDoc._id}`);
    console.log(`  - Linked userId: ${pDoc.userId} (Matches UserLogin: ${String(pDoc.userId) === String(postRegUserLogins[0]._id)})`);
    console.log(`  - FullName: "${pDoc.fullName}"`);
    console.log(`  - Age: ${pDoc.age}`);
    console.log(`  - Gender: "${pDoc.gender}"`);
    console.log(`  - PreferredLanguage: "${pDoc.preferredLanguage}"`);
    console.log(`  - AphasiaType: "${pDoc.aphasiaType}"`);
    console.log(`  - Phone: "${pDoc.phone}"`);
  }

  // ----------------------------------------------------
  // TEST 1C: PROFILE RETRIEVAL / DISPLAY
  // ----------------------------------------------------
  console.log(`\n====================================================`);
  console.log(`MANUAL TEST 1C — PROFILE DISPLAY & RETRIEVAL`);
  console.log(`====================================================`);
  const meResponse = await axios.get(`${API_BASE}/user-logins/me`, {
    headers: { Authorization: `Bearer ${authToken}` }
  });
  console.log(`GET /api/user-logins/me Status: ${meResponse.status}`);
  const meData = meResponse.data.data;
  console.log(`  - Authenticated Email: ${meData.email}`);
  console.log(`  - Authenticated FullName: ${meData.fullName}`);
  console.log(`  - Profile Missing: ${meData.profileMissing}`);
  console.log(`  - Profile ID: ${meData.profile?._id}`);
  console.log(`  - Profile Age: ${meData.profile?.age}`);
  console.log(`  - Profile Gender: ${meData.profile?.gender}`);
  console.log(`  - Profile Language: ${meData.profile?.preferredLanguage}`);
  console.log(`  - Profile Aphasia: ${meData.profile?.aphasiaType}`);
  console.log(`  - Profile Phone: ${meData.profile?.phone}`);

  // ----------------------------------------------------
  // TEST 1D: REFRESH TEST
  // ----------------------------------------------------
  console.log(`\n====================================================`);
  console.log(`MANUAL TEST 1D — REFRESH PERSISTENCE`);
  console.log(`====================================================`);
  // Simulate page refresh by fetching patients roster with Bearer token
  const refreshPatientsRes = await axios.get(`${API_BASE}/patients`, {
    headers: { Authorization: `Bearer ${authToken}` }
  });
  const matchedPatient = refreshPatientsRes.data.data.find(p => p.email === testEmail);
  console.log(`GET /api/patients after simulated refresh:`);
  console.log(`  - Matched Patient Found: ${Boolean(matchedPatient)}`);
  console.log(`  - Patient FullName: "${matchedPatient?.fullName}"`);
  console.log(`  - Patient Age: ${matchedPatient?.age}`);
  console.log(`  - Patient Gender: "${matchedPatient?.gender}"`);

  // Check MongoDB: no duplicate created
  const postRefreshPatientCount = await Patient.countDocuments({ email: testEmail });
  const postRefreshUserCount = await UserLogin.countDocuments({ email: testEmail });
  console.log(`  - MongoDB UserLogins Count: ${postRefreshUserCount} (Expected: 1)`);
  console.log(`  - MongoDB Patients Count: ${postRefreshPatientCount} (Expected: 1)`);

  // ----------------------------------------------------
  // TEST 1E: LOGOUT + LOGIN PERSISTENCE
  // ----------------------------------------------------
  console.log(`\n====================================================`);
  console.log(`MANUAL TEST 1E — LOGOUT AND LOGIN PERSISTENCE`);
  console.log(`====================================================`);
  console.log(`Logging in again via POST /api/user-logins/login...`);
  const loginRes = await axios.post(`${API_BASE}/user-logins/login`, {
    email: testEmail,
    password: testPassword
  });
  console.log(`Login Response Status: ${loginRes.status}`);
  const loginData = loginRes.data.data;
  console.log(`  - Login Token Received: ${Boolean(loginData.token)}`);
  console.log(`  - Login User FullName: "${loginData.user?.fullName}"`);
  console.log(`  - Login Profile Present: ${Boolean(loginData.user?.profile)}`);
  console.log(`  - Login Profile Age: ${loginData.user?.profile?.age}`);
  console.log(`  - Login Profile Missing: ${loginData.user?.profileMissing}`);

  const postLoginPatientCount = await Patient.countDocuments({ email: testEmail });
  const postLoginUserCount = await UserLogin.countDocuments({ email: testEmail });
  console.log(`  - MongoDB UserLogins Count: ${postLoginUserCount} (Expected: 1)`);
  console.log(`  - MongoDB Patients Count: ${postLoginPatientCount} (Expected: 1)`);

  // ----------------------------------------------------
  // TEST 1F: DEMOGRAPHIC VOICE SELECTION (ALL 8 COMBINATIONS)
  // ----------------------------------------------------
  console.log(`\n====================================================`);
  console.log(`MANUAL TEST 1F — DEMOGRAPHIC VOICE SELECTION`);
  console.log(`====================================================`);
  const testDemographics = [
    { gender: 'Female', age: 10, label: 'Female Child' },
    { gender: 'Female', age: 24, label: 'Female Young Adult' },
    { gender: 'Female', age: 45, label: 'Female Adult' },
    { gender: 'Female', age: 68, label: 'Female Senior' },
    { gender: 'Male', age: 10, label: 'Male Child' },
    { gender: 'Male', age: 24, label: 'Male Young Adult' },
    { gender: 'Male', age: 45, label: 'Male Adult' },
    { gender: 'Male', age: 68, label: 'Male Senior' },
  ];

  for (const demo of testDemographics) {
    const synthRes = await axios.post(
      `${API_BASE}/voice-profiles/synthesize`,
      {
        gender: demo.gender,
        age: demo.age,
        text: 'ನಮಸ್ಕಾರ, ನಾನು ಕ್ಷೇಮವಾಗಿದ್ದೇನೆ.',
        language: 'Kannada'
      },
      {
        headers: { Authorization: `Bearer ${authToken}` },
        responseType: 'arraybuffer'
      }
    );

    const resolvedVoiceId = synthRes.headers['x-resolved-voice-id'];
    const resolvedAgeGroup = synthRes.headers['x-resolved-age-group'];
    const resolvedGender = synthRes.headers['x-resolved-gender'];
    const selectionType = synthRes.headers['x-voice-selection-type'];
    const voiceProvider = synthRes.headers['x-voice-provider'];

    console.log(`[${demo.label}] Age: ${demo.age}, Gender: ${demo.gender} ->`);
    console.log(`    Resolved Voice ID: "${resolvedVoiceId}"`);
    console.log(`    Resolved Age Group: "${resolvedAgeGroup}"`);
    console.log(`    Resolved Gender: "${resolvedGender}"`);
    console.log(`    Selection Type: "${selectionType}"`);
    console.log(`    Provider: "${voiceProvider}"`);
  }

  // ----------------------------------------------------
  // TEST 1G: IVC FAILURE SAFETY
  // ----------------------------------------------------
  console.log(`\n====================================================`);
  console.log(`MANUAL TEST 1G — IVC FAILURE SAFETY CHECK`);
  console.log(`====================================================`);
  let ivcFailedSafely = false;
  try {
    const patientDoc = postRegPatients[0];
    // Attempt clone with empty/missing file
    const FormData = require('form-data');
    const form = new FormData();
    form.append('patientId', String(patientDoc._id));
    form.append('voiceName', 'Test_Voice_Sample');

    await axios.post(`${API_BASE}/voice-profiles/clone`, form, {
      headers: {
        ...form.getHeaders(),
        Authorization: `Bearer ${authToken}`
      }
    });
  } catch (err) {
    if (err.response && (err.response.status === 400 || err.response.status === 500)) {
      ivcFailedSafely = true;
      console.log(`✅ Expected: Voice cloning failed with HTTP ${err.response.status}.`);
      console.log(`   Error Message: "${err.response.data.message}"`);
    }
  }

  // Check VoiceProfile in MongoDB
  const patientDoc = postRegPatients[0];
  const vpAfterFailure = await VoiceProfile.findOne({ patientId: patientDoc._id });
  console.log(`VoiceProfile in MongoDB after IVC failure:`);
  if (vpAfterFailure) {
    console.log(`  - Status: "${vpAfterFailure.status}" (Expected: "Failed")`);
    console.log(`  - Voice ID: "${vpAfterFailure.voiceId}" (Expected: empty or NOT default fallback)`);
    console.log(`  - Is Default Fallback Voice ID ('EXAVITQu4vr4xnSDxMaL') Stored As Cloned: ${vpAfterFailure.voiceId === 'EXAVITQu4vr4xnSDxMaL'}`);
    console.log(`  - Last Cloned At: ${vpAfterFailure.lastClonedAt || 'null'} (Expected: null/undefined)`);
  } else {
    console.log(`  - VoiceProfile document not created as Ready (Safely kept unconfigured).`);
  }

  // ----------------------------------------------------
  // DATABASE SAFETY CHECK (EXISTING USERS & ORPHAN VOICEPROFILE)
  // ----------------------------------------------------
  console.log(`\n====================================================`);
  console.log(`EXISTING USER SAFETY & ORPHAN VOICEPROFILE AUDIT`);
  console.log(`====================================================`);
  const finalUserLogins = await UserLogin.find({}).toArray();
  const finalPatients = await Patient.find({}).toArray();
  const finalVoiceProfiles = await VoiceProfile.find({}).toArray();

  console.log(`Final Database Record Counts:`);
  console.log(`  - UserLogins: ${finalUserLogins.length} (Pre: ${preUserLogins.length} + 1 new test user)`);
  console.log(`  - Patients: ${finalPatients.length} (Pre: ${prePatients.length} + 1 new test patient)`);
  console.log(`  - VoiceProfiles: ${finalVoiceProfiles.length}`);

  // Verify original accounts are untouched
  const originalUser1 = await UserLogin.findOne({ email: 'gmsrividya3@gmail.com' });
  const originalUser2 = await UserLogin.findOne({ email: 'gmsrividya@gmail.com' });
  console.log(`  - Original User gmsrividya3@gmail.com preserved: ${Boolean(originalUser1)} (ID: ${originalUser1?._id})`);
  console.log(`  - Original User gmsrividya@gmail.com preserved: ${Boolean(originalUser2)} (ID: ${originalUser2?._id})`);

  // Verify orphan VoiceProfile is untouched
  const orphanVP = await VoiceProfile.findOne({ _id: new mongoose.Types.ObjectId('6a9517ff6d23f9bd7bea123b') });
  console.log(`  - Orphan VoiceProfile (6a9517ff6d23f9bd7bea123b) preserved: ${Boolean(orphanVP)}`);
  console.log(`    Status: "${orphanVP?.status}", VoiceId: "${orphanVP?.voiceId}", PatientId: "${orphanVP?.patientId}"`);

  if (testServer) await new Promise(r => testServer.close(r));
  await mongoose.disconnect();
  console.log('\n✅ TEST 1 COMPREHENSIVE VERIFICATION RUN COMPLETE.');
}

runVerification().catch((err) => {
  console.error('❌ Verification failed with error:', err);
  process.exit(1);
});
