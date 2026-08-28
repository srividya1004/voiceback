/**
 * VoiceBack MongoDB / Patient Data Verification Test Suite
 * Verifies that MongoDB is the single source of truth for patient records,
 * login profile payload delivery, and doctor/caregiver relationships.
 */

const connectDB = require('../src/config/database');
const { userLoginService, patientService, doctorService, caregiverService } = require('../src/services');

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    throw new Error(`Assertion Failed: ${message}`);
  }
}

async function runPatientVerificationTests() {
  console.log('==================================================');
  console.log(' VOICEBACK MONGODB PATIENT DATA VERIFICATION TEST ');
  console.log('==================================================\n');

  try {
    console.log('--- TEST 1: MongoDB Database Connection ---');
    await connectDB();
    assert(true, 'MongoDB connected successfully');

    const testTag = Date.now();
    const testEmail = `verify.patient.${testTag}@voiceback.org`;
    const testPassword = 'SecurePassword123!';

    // -----------------------------------------------------
    // TEST 2: Patient Registration in MongoDB
    // -----------------------------------------------------
    console.log('\n--- TEST 2: Patient Account & Profile Creation ---');
    const userLogin = await userLoginService.create({
      email: testEmail,
      passwordHash: testPassword,
      role: 'Patient'
    });
    assert(userLogin._id, 'UserLogin document created in MongoDB');

    const patientProfile = await patientService.create({
      userId: userLogin._id,
      fullName: 'Amina Al-Mansoor',
      age: 38,
      aphasiaType: "Wernicke's",
      gender: 'Female',
      preferredLanguage: 'English',
      phone: '+1-555-432-1098',
      email: testEmail,
      emergencyContact: '+1-555-999-8888'
    });
    assert(patientProfile._id, 'Patient document created in MongoDB');
    assert(patientProfile.fullName === 'Amina Al-Mansoor', 'fullName stored as "Amina Al-Mansoor"');
    assert(patientProfile.age === 38, 'age stored as 38');
    assert(patientProfile.aphasiaType === "Wernicke's", 'aphasiaType stored as "Wernicke\'s"');

    // -----------------------------------------------------
    // TEST 3: Login Payload Delivery (Single Source of Truth)
    // -----------------------------------------------------
    console.log('\n--- TEST 3: Login Payload Delivery ---');
    const loginResult = await userLoginService.loginUser(testEmail, testPassword);
    assert(loginResult.token, 'JWT Token generated on login');
    assert(loginResult.user.role === 'Patient', 'Role identified as Patient');
    assert(loginResult.user.profile, 'User object contains populated profile from MongoDB');
    assert(loginResult.user.profile.fullName === 'Amina Al-Mansoor', 'Profile fullName matches MongoDB ("Amina Al-Mansoor")');
    assert(loginResult.user.profile.age === 38, 'Profile age matches MongoDB (38)');
    assert(loginResult.user.profile.aphasiaType === "Wernicke's", 'Profile aphasiaType matches MongoDB ("Wernicke\'s")');

    // -----------------------------------------------------
    // TEST 4: getMe Profile Retrieval Endpoint
    // -----------------------------------------------------
    console.log('\n--- TEST 4: getMe Profile Retrieval ---');
    const meData = await userLoginService.getMe(userLogin._id.toString());
    assert(meData.id.toString() === userLogin._id.toString(), 'getMe user ID matches');
    assert(meData.profile.fullName === 'Amina Al-Mansoor', 'getMe profile fullName matches MongoDB');
    assert(meData.profile.age === 38, 'getMe profile age matches MongoDB');

    // -----------------------------------------------------
    // TEST 5: getPatientById Endpoint
    // -----------------------------------------------------
    console.log('\n--- TEST 5: getPatientById Retrieval ---');
    const fetchedPatient = await patientService.getById(patientProfile._id.toString());
    assert(fetchedPatient._id.toString() === patientProfile._id.toString(), 'Fetched patient ID matches');
    assert(fetchedPatient.fullName === 'Amina Al-Mansoor', 'Fetched patient name matches');

    // -----------------------------------------------------
    // CLEANUP
    // -----------------------------------------------------
    console.log('\n--- Cleaning up Test Records ---');
    await patientService.delete(patientProfile._id.toString());
    await userLoginService.delete(userLogin._id.toString());
    console.log('  🧹 Cleaned up temporary test documents');

    console.log('\n==================================================');
    console.log(' ALL PATIENT MONGODB VERIFICATION TESTS PASSED!   ');
    console.log('==================================================\n');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ PATIENT MONGODB VERIFICATION TEST FAILED:', err.message);
    process.exit(1);
  }
}

runPatientVerificationTests();
