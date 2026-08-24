/**
 * Generic Relationship Architecture Verification Test Suite
 * Uses strictly generic fixtures (patientA, doctorA, doctorB, caregiverA, caregiverB)
 * Zero hardcoded real names or identities
 */

const mongoose = require('mongoose');
const connectDB = require('../src/config/database');
const userLoginService = require('../src/services/userLoginService');
const patientService = require('../src/services/patientService');
const doctorService = require('../src/services/doctorService');
const caregiverService = require('../src/services/caregiverService');
const { UserLogin, Patient, Doctor, Caregiver } = require('../src/models');

const runGenericTest = async () => {
  try {
    console.log('========================================');
    console.log('--- 1. Setting Up Generic Test Fixtures ---');
    console.log('========================================');
    await connectDB();

    const timestamp = Date.now();
    const emailP = `patient.gen.${timestamp}@test.org`;
    const emailDocA = `doctor.a.${timestamp}@test.org`;
    const emailDocB = `doctor.b.${timestamp}@test.org`;
    const emailCgA = `caregiver.a.${timestamp}@test.org`;
    const emailCgB = `caregiver.b.${timestamp}@test.org`;

    // Create UserLogins
    const userP = await userLoginService.create({ email: emailP, passwordHash: 'TestPass1!', role: 'Patient' });
    const userDocA = await userLoginService.create({ email: emailDocA, passwordHash: 'TestPass1!', role: 'Doctor' });
    const userDocB = await userLoginService.create({ email: emailDocB, passwordHash: 'TestPass1!', role: 'Doctor' });
    const userCgA = await userLoginService.create({ email: emailCgA, passwordHash: 'TestPass1!', role: 'Caregiver' });
    const userCgB = await userLoginService.create({ email: emailCgB, passwordHash: 'TestPass1!', role: 'Caregiver' });

    // Create Role Profiles
    const patientA = await patientService.create({
      userId: userP._id,
      fullName: 'Generic Patient A',
      email: emailP,
      age: 45,
      aphasiaType: 'Anomic'
    });

    const doctorA = await doctorService.create({
      userId: userDocA._id,
      fullName: 'Generic Doctor A',
      email: emailDocA,
      specialization: 'Neurology',
      hospitalAffiliation: 'Generic Hospital A',
      licenseNumber: 'GEN-LIC-001'
    });

    const doctorB = await doctorService.create({
      userId: userDocB._id,
      fullName: 'Generic Doctor B',
      email: emailDocB,
      specialization: 'Rehabilitation',
      hospitalAffiliation: 'Generic Hospital B',
      licenseNumber: 'GEN-LIC-002'
    });

    const caregiverA = await caregiverService.create({
      userId: userCgA._id,
      fullName: 'Generic Caregiver A',
      email: emailCgA,
      phone: '+1-555-000-1111',
      relationshipToPatient: 'Family Member'
    });

    const caregiverB = await caregiverService.create({
      userId: userCgB._id,
      fullName: 'Generic Caregiver B',
      email: emailCgB,
      phone: '+1-555-000-2222',
      relationshipToPatient: 'Professional Nurse'
    });

    console.log('✅ Generic Fixtures Created Successfully.');

    console.log('\n========================================');
    console.log('--- 2. Test 1: Initial Caregiver Linking & Bidirectional Sync ---');
    console.log('========================================');
    await caregiverService.linkPatient(caregiverA._id.toString(), emailP);

    const checkP1 = await Patient.findById(patientA._id);
    const checkCgA1 = await Caregiver.findById(caregiverA._id);

    console.log(` Patient assignedCaregiverId: ${checkP1.assignedCaregiverId}`);
    console.log(` Caregiver assignedPatients: ${checkCgA1.assignedPatients.map(id => id.toString())}`);

    if (
      String(checkP1.assignedCaregiverId) !== String(caregiverA._id) ||
      !checkCgA1.assignedPatients.some(id => String(id) === String(patientA._id))
    ) {
      throw new Error('Test 1 Failed: Bidirectional sync failed for initial caregiver link');
    }
    console.log('✅ Test 1 PASSED!');

    console.log('\n========================================');
    console.log('--- 3. Test 2: Idempotent Re-assignment ---');
    console.log('========================================');
    await caregiverService.linkPatient(caregiverA._id.toString(), emailP);
    const checkCgA2 = await Caregiver.findById(caregiverA._id);
    if (checkCgA2.assignedPatients.length !== 1) {
      throw new Error('Test 2 Failed: Duplicate patient entry found in caregiver assignedPatients');
    }
    console.log('✅ Test 2 PASSED (Idempotent link verified)!');

    console.log('\n========================================');
    console.log('--- 4. Test 3: Generic Caregiver Re-assignment / Switching ---');
    console.log('========================================');
    await caregiverService.linkPatient(caregiverB._id.toString(), emailP);

    const checkP3 = await Patient.findById(patientA._id);
    const checkCgA3 = await Caregiver.findById(caregiverA._id);
    const checkCgB3 = await Caregiver.findById(caregiverB._id);

    console.log(` Patient assignedCaregiverId: ${checkP3.assignedCaregiverId} (Expected: ${caregiverB._id})`);
    console.log(` Old Caregiver A assignedPatients length: ${checkCgA3.assignedPatients.length} (Expected: 0)`);
    console.log(` New Caregiver B assignedPatients length: ${checkCgB3.assignedPatients.length} (Expected: 1)`);

    if (
      String(checkP3.assignedCaregiverId) !== String(caregiverB._id) ||
      checkCgA3.assignedPatients.some(id => String(id) === String(patientA._id)) ||
      !checkCgB3.assignedPatients.some(id => String(id) === String(patientA._id))
    ) {
      throw new Error('Test 3 Failed: Caregiver switching bidirectional sync failed');
    }
    console.log('✅ Test 3 PASSED!');

    console.log('\n========================================');
    console.log('--- 5. Test 4: Generic Cascade Cleanup on Caregiver Delete ---');
    console.log('========================================');
    await caregiverService.delete(caregiverB._id.toString());
    await UserLogin.findByIdAndDelete(userCgB._id);

    const checkP4 = await Patient.findById(patientA._id);
    console.log(` Patient assignedCaregiverId post-delete: ${checkP4.assignedCaregiverId} (Expected: null)`);

    if (checkP4.assignedCaregiverId !== null) {
      throw new Error('Test 4 Failed: Patient assignedCaregiverId was not nullified on Caregiver deletion');
    }
    console.log('✅ Test 4 PASSED!');

    console.log('\n========================================');
    console.log('--- 6. Test 5: Generic Orphan Recovery Rule ---');
    console.log('========================================');
    // Inject a fake orphaned ObjectId into Patient record
    const fakeOrphanId = new mongoose.Types.ObjectId();
    await Patient.findByIdAndUpdate(patientA._id, { assignedCaregiverId: fakeOrphanId });

    console.log(` Injected fake orphaned caregiver ID: ${fakeOrphanId}`);
    // Attempt link by caregiverA -> should bypass orphan smoothly and reassign
    await caregiverService.linkPatient(caregiverA._id.toString(), emailP);

    const checkP5 = await Patient.findById(patientA._id);
    console.log(` Patient assignedCaregiverId post-orphan link: ${checkP5.assignedCaregiverId} (Expected: ${caregiverA._id})`);

    if (String(checkP5.assignedCaregiverId) !== String(caregiverA._id)) {
      throw new Error('Test 5 Failed: Orphan recovery rule failed to bypass deleted caregiver reference');
    }
    console.log('✅ Test 5 PASSED!');

    console.log('\n========================================');
    console.log('--- 7. Test 6: Generic Doctor Assignment & Cascade Cleanup ---');
    console.log('========================================');
    await doctorService.assignPatientByEmail(doctorA._id.toString(), emailP);
    let checkP6 = await Patient.findById(patientA._id);
    console.log(` Doctor A assigned: ${checkP6.assignedDoctorId}`);

    await doctorService.assignPatientByEmail(doctorB._id.toString(), emailP);
    checkP6 = await Patient.findById(patientA._id);
    console.log(` Doctor B reassigned: ${checkP6.assignedDoctorId}`);

    await doctorService.delete(doctorB._id.toString());
    await UserLogin.findByIdAndDelete(userDocB._id);

    checkP6 = await Patient.findById(patientA._id);
    console.log(` Doctor post-delete assignedDoctorId: ${checkP6.assignedDoctorId} (Expected: null)`);

    if (checkP6.assignedDoctorId !== null) {
      throw new Error('Test 6 Failed: Patient assignedDoctorId was not nullified on Doctor deletion');
    }
    console.log('✅ Test 6 PASSED!');

    console.log('\n========================================');
    console.log('--- 8. Cleaning Up Generic Test Fixtures ---');
    console.log('========================================');
    await patientService.delete(patientA._id.toString());
    await doctorService.delete(doctorA._id.toString());
    await caregiverService.delete(caregiverA._id.toString());

    await UserLogin.findByIdAndDelete(userP._id);
    await UserLogin.findByIdAndDelete(userDocA._id);
    await UserLogin.findByIdAndDelete(userCgA._id);

    console.log('✅ All generic test fixtures cleaned up.');

    console.log('\n========================================');
    console.log('🎉 ALL GENERIC RELATIONSHIP TESTS PASSED SUCCESSFULLY!');
    console.log('========================================\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Generic Relationship Test Failed:', error.message);
    process.exit(1);
  }
};

runGenericTest();
