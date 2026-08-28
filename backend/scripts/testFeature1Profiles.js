/**
 * Feature 1 Profile Persistence & Identity Test Script
 */

const mongoose = require('mongoose');
const connectDB = require('../src/config/database');
const {
  UserLogin,
  Patient,
  Doctor,
  Caregiver
} = require('../src/models');
const {
  userLoginService,
  patientService,
  doctorService,
  caregiverService
} = require('../src/services');

const runFeature1Test = async () => {
  try {
    console.log('🔄 Connecting to Database...');
    try {
      await connectDB();
    } catch (dbErr) {
      console.warn('⚠️ Atlas connection unavailable. Starting MongoMemoryServer for tests...');
      const { MongoMemoryServer } = require('mongodb-memory-server');
      const mongod = await MongoMemoryServer.create();
      await mongoose.connect(mongod.getUri());
      console.log('✅ Connected to local MongoMemoryServer!');
    }

    const testTs = Date.now();

    console.log('\n========================================');
    console.log('--- 1. Testing Patient Profile Persistence & Zero Auto-Creation ---');
    console.log('========================================');
    const patientEmail = `patient.f1.${testTs}@voiceback.org`;
    const patientUser = await userLoginService.create({
      email: patientEmail,
      passwordHash: 'PatientPass123!',
      role: 'Patient'
    });
    console.log(`✅ Created UserLogin for Patient (ID: ${patientUser._id})`);

    // Verify login without profile does NOT auto-create profile document
    const pLoginInitial = await userLoginService.loginUser(patientEmail, 'PatientPass123!');
    const countBeforePat = await Patient.countDocuments({ userId: patientUser._id });
    if (pLoginInitial.user.profile !== null || !pLoginInitial.user.profileMissing || countBeforePat !== 0) {
      throw new Error(`Synthetic Patient profile was created unexpectedly during login! Count: ${countBeforePat}`);
    }
    console.log(`✅ Verified login without profile returns profile: null and creates ZERO Patient documents.`);

    // Create real patient profile in MongoDB
    const initialPatientProfile = await patientService.create({
      userId: patientUser._id,
      fullName: 'Initial Patient',
      age: 50,
      aphasiaType: "Broca's",
      email: patientEmail
    });
    console.log(`✅ Created real Patient profile (ID: ${initialPatientProfile._id})`);

    const pLoginRes = await userLoginService.loginUser(patientEmail, 'PatientPass123!');
    if (!pLoginRes.user.profile || pLoginRes.user.profile._id.toString() !== initialPatientProfile._id.toString()) {
      throw new Error('Failed to resolve real MongoDB patient profile on login!');
    }
    console.log(`✅ Logged in Patient. Resolved Profile ID: ${pLoginRes.user.profile._id}`);

    // Update patient profile fields
    const updatedPatientData = {
      fullName: 'Jane Patient Smith',
      age: 52,
      aphasiaType: "Broca's",
      gender: 'Female',
      preferredLanguage: 'English',
      phone: '+1-555-234-5678',
      emergencyContact: '+1-555-987-6543'
    };

    const savedPatient = await patientService.update(initialPatientProfile._id.toString(), updatedPatientData);
    console.log(`✅ Updated Patient Profile via patientService.update()`);

    // Fetch via getMe (simulating refresh / /me endpoint)
    const pMeRes = await userLoginService.getMe(patientUser._id.toString());
    const refreshedP = pMeRes.profile;

    console.log('🔍 Checking Patient persisted fields:');
    console.log(` - Full Name: ${refreshedP.fullName} (Expected: Jane Patient Smith)`);
    console.log(` - Age: ${refreshedP.age} (Expected: 52)`);
    console.log(` - Aphasia Type: ${refreshedP.aphasiaType} (Expected: Broca's)`);
    console.log(` - Gender: ${refreshedP.gender} (Expected: Female)`);
    console.log(` - Preferred Language: ${refreshedP.preferredLanguage} (Expected: English)`);
    console.log(` - Phone: ${refreshedP.phone} (Expected: +1-555-234-5678)`);
    console.log(` - Emergency Contact: ${refreshedP.emergencyContact} (Expected: +1-555-987-6543)`);

    if (
      refreshedP.fullName !== 'Jane Patient Smith' ||
      refreshedP.age !== 52 ||
      refreshedP.gender !== 'Female' ||
      refreshedP.preferredLanguage !== 'English' ||
      refreshedP.phone !== '+1-555-234-5678' ||
      refreshedP.emergencyContact !== '+1-555-987-6543'
    ) {
      throw new Error('Patient profile field persistence assertion failed!');
    }
    console.log('✅ Patient profile persistence PASSED!');

    console.log('\n========================================');
    console.log('--- 2. Testing Doctor Profile Persistence & Zero Auto-Creation ---');
    console.log('========================================');
    const doctorEmail = `doctor.f1.${testTs}@voiceback.org`;
    const doctorUser = await userLoginService.create({
      email: doctorEmail,
      passwordHash: 'DoctorPass123!',
      role: 'Doctor'
    });
    console.log(`✅ Created UserLogin for Doctor (ID: ${doctorUser._id})`);

    const dLoginInitial = await userLoginService.loginUser(doctorEmail, 'DoctorPass123!');
    const countBeforeDoc = await Doctor.countDocuments({ userId: doctorUser._id });
    if (dLoginInitial.user.profile !== null || !dLoginInitial.user.profileMissing || countBeforeDoc !== 0) {
      throw new Error(`Synthetic Doctor profile was created unexpectedly during login! Count: ${countBeforeDoc}`);
    }
    console.log(`✅ Verified login without profile returns profile: null and creates ZERO Doctor documents.`);

    const initialDoctorProfile = await doctorService.create({
      userId: doctorUser._id,
      fullName: 'Initial Doctor',
      specialization: 'Neurology',
      hospitalAffiliation: 'General Hospital',
      licenseNumber: `LIC-${testTs}`,
      email: doctorEmail
    });
    console.log(`✅ Created real Doctor profile (ID: ${initialDoctorProfile._id})`);

    const dLoginRes = await userLoginService.loginUser(doctorEmail, 'DoctorPass123!');
    if (!dLoginRes.user.profile || dLoginRes.user.profile._id.toString() !== initialDoctorProfile._id.toString()) {
      throw new Error('Failed to resolve real MongoDB doctor profile on login!');
    }
    console.log(`✅ Logged in Doctor. Resolved Profile ID: ${dLoginRes.user.profile._id}`);

    const updatedDoctorData = {
      fullName: 'Dr. Evelyn Reed',
      specialization: 'Neurological Rehabilitation',
      hospitalAffiliation: 'Johns Hopkins Rehabilitation Center',
      phone: '+1-555-777-1234'
    };

    await doctorService.update(initialDoctorProfile._id.toString(), updatedDoctorData);
    console.log(`✅ Updated Doctor Profile via doctorService.update()`);

    const dMeRes = await userLoginService.getMe(doctorUser._id.toString());
    const refreshedD = dMeRes.profile;

    console.log('🔍 Checking Doctor persisted fields:');
    console.log(` - Full Name: ${refreshedD.fullName} (Expected: Dr. Evelyn Reed)`);
    console.log(` - Specialization: ${refreshedD.specialization} (Expected: Neurological Rehabilitation)`);
    console.log(` - Hospital: ${refreshedD.hospitalAffiliation} (Expected: Johns Hopkins Rehabilitation Center)`);
    console.log(` - Phone: ${refreshedD.phone} (Expected: +1-555-777-1234)`);

    if (
      refreshedD.fullName !== 'Dr. Evelyn Reed' ||
      refreshedD.specialization !== 'Neurological Rehabilitation' ||
      refreshedD.hospitalAffiliation !== 'Johns Hopkins Rehabilitation Center' ||
      refreshedD.phone !== '+1-555-777-1234'
    ) {
      throw new Error('Doctor profile field persistence assertion failed!');
    }
    console.log('✅ Doctor profile persistence PASSED!');

    console.log('\n========================================');
    console.log('--- 3. Testing Caregiver Profile Persistence & Zero Auto-Creation ---');
    console.log('========================================');
    const caregiverEmail = `caregiver.f1.${testTs}@voiceback.org`;
    const caregiverUser = await userLoginService.create({
      email: caregiverEmail,
      passwordHash: 'CaregiverPass123!',
      role: 'Caregiver'
    });
    console.log(`✅ Created UserLogin for Caregiver (ID: ${caregiverUser._id})`);

    const cLoginInitial = await userLoginService.loginUser(caregiverEmail, 'CaregiverPass123!');
    const countBeforeCg = await Caregiver.countDocuments({ userId: caregiverUser._id });
    if (cLoginInitial.user.profile !== null || !cLoginInitial.user.profileMissing || countBeforeCg !== 0) {
      throw new Error(`Synthetic Caregiver profile was created unexpectedly during login! Count: ${countBeforeCg}`);
    }
    console.log(`✅ Verified login without profile returns profile: null and creates ZERO Caregiver documents.`);

    const initialCaregiverProfile = await caregiverService.create({
      userId: caregiverUser._id,
      fullName: 'Initial Caregiver',
      phone: '+1-555-111-2222',
      relationshipToPatient: 'Sibling',
      email: caregiverEmail
    });
    console.log(`✅ Created real Caregiver profile (ID: ${initialCaregiverProfile._id})`);

    const cLoginRes = await userLoginService.loginUser(caregiverEmail, 'CaregiverPass123!');
    if (!cLoginRes.user.profile || cLoginRes.user.profile._id.toString() !== initialCaregiverProfile._id.toString()) {
      throw new Error('Failed to resolve real MongoDB caregiver profile on login!');
    }
    console.log(`✅ Logged in Caregiver. Resolved Profile ID: ${cLoginRes.user.profile._id}`);

    const updatedCaregiverData = {
      fullName: 'Marcus Vance',
      phone: '+1-555-444-5555',
      relationshipToPatient: 'Primary Caregiver & Spouse'
    };

    await caregiverService.update(initialCaregiverProfile._id.toString(), updatedCaregiverData);
    console.log(`✅ Updated Caregiver Profile via caregiverService.update()`);

    const cMeRes = await userLoginService.getMe(caregiverUser._id.toString());
    const refreshedC = cMeRes.profile;

    console.log('🔍 Checking Caregiver persisted fields:');
    console.log(` - Full Name: ${refreshedC.fullName} (Expected: Marcus Vance)`);
    console.log(` - Phone: ${refreshedC.phone} (Expected: +1-555-444-5555)`);
    console.log(` - Relationship: ${refreshedC.relationshipToPatient} (Expected: Primary Caregiver & Spouse)`);

    if (
      refreshedC.fullName !== 'Marcus Vance' ||
      refreshedC.phone !== '+1-555-444-5555' ||
      refreshedC.relationshipToPatient !== 'Primary Caregiver & Spouse'
    ) {
      throw new Error('Caregiver profile field persistence assertion failed!');
    }
    console.log('✅ Caregiver profile persistence PASSED!');

    console.log('\n========================================');
    console.log('--- 4. Testing Duplicate Profile Immunity & Profile-Less Login Immunity ---');
    console.log('========================================');
    const profilelessUser = await userLoginService.create({
      email: `profileless.${testTs}@voiceback.org`,
      passwordHash: 'Pass123!',
      role: 'Patient'
    });

    const patientCountBefore = await Patient.countDocuments({ userId: patientUser._id });
    const doctorCountBefore = await Doctor.countDocuments({ userId: doctorUser._id });
    const caregiverCountBefore = await Caregiver.countDocuments({ userId: caregiverUser._id });
    const profilelessCountBefore = await Patient.countDocuments({ userId: profilelessUser._id });

    // Call getMe and loginUser 5 times each
    for (let i = 0; i < 5; i++) {
      await userLoginService.getMe(patientUser._id.toString());
      await userLoginService.loginUser(patientEmail, 'PatientPass123!');
      await userLoginService.getMe(doctorUser._id.toString());
      await userLoginService.loginUser(doctorEmail, 'DoctorPass123!');
      await userLoginService.getMe(caregiverUser._id.toString());
      await userLoginService.loginUser(caregiverEmail, 'CaregiverPass123!');
      await userLoginService.getMe(profilelessUser._id.toString());
      await userLoginService.loginUser(`profileless.${testTs}@voiceback.org`, 'Pass123!');
    }

    const patientCountAfter = await Patient.countDocuments({ userId: patientUser._id });
    const doctorCountAfter = await Doctor.countDocuments({ userId: doctorUser._id });
    const caregiverCountAfter = await Caregiver.countDocuments({ userId: caregiverUser._id });
    const profilelessCountAfter = await Patient.countDocuments({ userId: profilelessUser._id });

    console.log(` Patient profiles count for User ${patientUser._id}: Before=${patientCountBefore}, After=${patientCountAfter}`);
    console.log(` Doctor profiles count for User ${doctorUser._id}: Before=${doctorCountBefore}, After=${doctorCountAfter}`);
    console.log(` Caregiver profiles count for User ${caregiverUser._id}: Before=${caregiverCountBefore}, After=${caregiverCountAfter}`);
    console.log(` Profile-less user Patient profiles count for User ${profilelessUser._id}: Before=${profilelessCountBefore}, After=${profilelessCountAfter}`);

    if (patientCountBefore !== 1 || patientCountAfter !== 1) {
      throw new Error(`Duplicate Patient profile detected! Count: ${patientCountAfter}`);
    }
    if (doctorCountBefore !== 1 || doctorCountAfter !== 1) {
      throw new Error(`Duplicate Doctor profile detected! Count: ${doctorCountAfter}`);
    }
    if (caregiverCountBefore !== 1 || caregiverCountAfter !== 1) {
      throw new Error(`Duplicate Caregiver profile detected! Count: ${caregiverCountAfter}`);
    }
    if (profilelessCountBefore !== 0 || profilelessCountAfter !== 0) {
      throw new Error(`Profile was created for profile-less user! Count: ${profilelessCountAfter}`);
    }
    console.log('✅ Duplicate profile immunity & profile-less immunity PASSED!');

    console.log('\n========================================');
    console.log('🎉 ALL FEATURE 1 TESTS PASSED SUCCESSFULLY!');
    console.log('========================================\n');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ Feature 1 Test Failed:', err.message);
    process.exit(1);
  }
};

runFeature1Test();
