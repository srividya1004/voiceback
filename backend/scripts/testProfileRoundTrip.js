/**
 * VoiceBack Generic Profile Data Round-Trip Automated Test Suite
 * Tests generic profile data persistence (Patient, Doctor, Caregiver)
 * to prevent regressions across registration, edit, and read operations.
 */

const assert = require('assert');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

const patientService = require('../src/services/patientService');
const doctorService = require('../src/services/doctorService');
const caregiverService = require('../src/services/caregiverService');

let mongoServer;

const setupTestDb = async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
  console.log('[TestProfileRoundTrip] Connected to isolated MongoMemoryServer.');
};

const teardownTestDb = async () => {
  await mongoose.disconnect();
  if (mongoServer) {
    await mongoServer.stop();
  }
  console.log('[TestProfileRoundTrip] Disconnected isolated test database.');
};

const runProfileRoundTripTests = async () => {
  console.log('\n=====================================================');
  console.log('       GENERIC PROFILE ROUND-TRIP VERIFICATION       ');
  console.log('=====================================================\n');

  let passedTests = 0;
  let totalTests = 0;

  const test = (description, fn) => {
    totalTests++;
    try {
      fn();
      passedTests++;
      console.log(`  ✅ PASS: ${description}`);
    } catch (err) {
      console.error(`  ❌ FAIL: ${description}\n     Error: ${err.message}`);
      throw err;
    }
  };

  const testAsync = async (description, fn) => {
    totalTests++;
    try {
      await fn();
      passedTests++;
      console.log(`  ✅ PASS: ${description}`);
    } catch (err) {
      console.error(`  ❌ FAIL: ${description}\n     Error: ${err.message}`);
      throw err;
    }
  };

  try {
    await setupTestDb();

    // -----------------------------------------------------
    // 1. PATIENT PROFILE ROUND-TRIP TEST (patientA)
    // -----------------------------------------------------
    console.log('\n--- 1. Testing Patient Profile Round-Trip (patientA) ---');

    const patientAFixture = {
      fullName: 'Patient A',
      age: 52,
      gender: 'Male',
      aphasiaType: "Broca's",
      preferredLanguage: 'kn',
      phone: '9876543210',
      email: 'patienta.roundtrip@voiceback.org',
      emergencyContact: '9123456789'
    };

    let createdPatientA;
    await testAsync('Create patientA with complete profile data', async () => {
      createdPatientA = await patientService.create(patientAFixture);
      assert(createdPatientA && createdPatientA._id, 'Patient A created with valid ObjectId');
    });

    let fetchedPatientA;
    await testAsync('Retrieve patientA by ID and verify exact field round-trip persistence', async () => {
      fetchedPatientA = await patientService.getById(createdPatientA._id);
      assert.strictEqual(fetchedPatientA.fullName, patientAFixture.fullName, 'fullName matches');
      assert.strictEqual(fetchedPatientA.age, patientAFixture.age, 'age matches');
      assert.strictEqual(fetchedPatientA.gender, patientAFixture.gender, 'gender matches');
      assert.strictEqual(fetchedPatientA.aphasiaType, patientAFixture.aphasiaType, 'aphasiaType matches');
      assert.strictEqual(fetchedPatientA.preferredLanguage, patientAFixture.preferredLanguage, 'preferredLanguage matches');
      assert.strictEqual(fetchedPatientA.phone, patientAFixture.phone, 'phone (mobileNumber) matches');
      assert.strictEqual(fetchedPatientA.email, patientAFixture.email, 'email matches');
      assert.strictEqual(fetchedPatientA.emergencyContact, patientAFixture.emergencyContact, 'emergencyContact matches');
    });

    await testAsync('Update patientA profile and verify updated values persist', async () => {
      const updatePayload = {
        gender: 'Female',
        phone: '9988776655',
        emergencyContact: '9998887776'
      };
      const updatedPatientA = await patientService.update(createdPatientA._id, updatePayload);
      assert.strictEqual(updatedPatientA.gender, 'Female', 'Updated gender matches');
      assert.strictEqual(updatedPatientA.phone, '9988776655', 'Updated phone matches');
      assert.strictEqual(updatedPatientA.emergencyContact, '9998887776', 'Updated emergencyContact matches');
      assert.strictEqual(updatedPatientA.fullName, patientAFixture.fullName, 'fullName remains intact');
    });

    // -----------------------------------------------------
    // 2. DOCTOR PROFILE ROUND-TRIP TEST (doctorA)
    // -----------------------------------------------------
    console.log('\n--- 2. Testing Doctor Profile Round-Trip (doctorA) ---');

    const doctorAFixture = {
      fullName: 'Dr. Doctor A',
      specialization: 'Neurology',
      hospitalAffiliation: 'National Institute of Mental Health & Neurosciences',
      licenseNumber: 'LIC-DOCA-999',
      email: 'doctora.roundtrip@voiceback.org',
      phone: '9876512345'
    };

    let createdDoctorA;
    await testAsync('Create doctorA with complete profile data', async () => {
      createdDoctorA = await doctorService.create(doctorAFixture);
      assert(createdDoctorA && createdDoctorA._id, 'Doctor A created with valid ObjectId');
    });

    await testAsync('Retrieve doctorA by ID and verify exact field round-trip persistence', async () => {
      const fetchedDoctorA = await doctorService.getById(createdDoctorA._id);
      assert.strictEqual(fetchedDoctorA.fullName, doctorAFixture.fullName, 'fullName matches');
      assert.strictEqual(fetchedDoctorA.specialization, doctorAFixture.specialization, 'specialization matches');
      assert.strictEqual(fetchedDoctorA.hospitalAffiliation, doctorAFixture.hospitalAffiliation, 'hospitalAffiliation matches');
      assert.strictEqual(fetchedDoctorA.licenseNumber, doctorAFixture.licenseNumber, 'licenseNumber matches');
      assert.strictEqual(fetchedDoctorA.email, doctorAFixture.email, 'email matches');
      assert.strictEqual(fetchedDoctorA.phone, doctorAFixture.phone, 'phone matches');
    });

    // -----------------------------------------------------
    // 3. CAREGIVER PROFILE ROUND-TRIP TEST (caregiverA)
    // -----------------------------------------------------
    console.log('\n--- 3. Testing Caregiver Profile Round-Trip (caregiverA) ---');

    const caregiverAFixture = {
      fullName: 'Caregiver A',
      phone: '9876598765',
      relationshipToPatient: 'Spouse',
      email: 'caregivera.roundtrip@voiceback.org'
    };

    let createdCaregiverA;
    await testAsync('Create caregiverA with complete profile data', async () => {
      createdCaregiverA = await caregiverService.create(caregiverAFixture);
      assert(createdCaregiverA && createdCaregiverA._id, 'Caregiver A created with valid ObjectId');
    });

    await testAsync('Retrieve caregiverA by ID and verify exact field round-trip persistence', async () => {
      const fetchedCaregiverA = await caregiverService.getById(createdCaregiverA._id);
      assert.strictEqual(fetchedCaregiverA.fullName, caregiverAFixture.fullName, 'fullName matches');
      assert.strictEqual(fetchedCaregiverA.phone, caregiverAFixture.phone, 'phone matches');
      assert.strictEqual(fetchedCaregiverA.relationshipToPatient, caregiverAFixture.relationshipToPatient, 'relationshipToPatient matches');
      assert.strictEqual(fetchedCaregiverA.email, caregiverAFixture.email, 'email matches');
    });

    console.log('\n=====================================================');
    console.log(`  🎉 ALL PROFILE ROUND-TRIP TESTS PASSED (${passedTests}/${totalTests})`);
    console.log('=====================================================\n');

  } catch (err) {
    console.error('\n❌ PROFILE ROUND-TRIP TEST SUITE FAILED:', err.message);
    process.exitCode = 1;
  } finally {
    await teardownTestDb();
  }
};

runProfileRoundTripTests();
