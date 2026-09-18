/**
 * Verification Script for Emergency SOS Behavior
 *
 * Verifies:
 * 1. Alert creation is blocked with a clear error when a patient has no assigned caregiver.
 * 2. Alert creation links directly to the assigned caregiver when assigned.
 * 3. Alert is NEVER sent to doctors (doctorId is null, doctor alert queries return []).
 * 4. Alert stores: patientId, assigned caregiverId, emergency message, timestamp, status.
 * 5. Caregiver receives and can view/acknowledge the alert.
 */

const mongoose = require('mongoose');
const { connectTestDB } = require('../src/config/database');
const {
  Patient,
  Doctor,
  Caregiver,
  UserLogin,
  EmergencySOS
} = require('../src/models');
const emergencySOSService = require('../src/services/emergencySOSService');

const runEmergencySOSTest = async () => {
  let createdDocs = {
    users: [],
    doctors: [],
    caregivers: [],
    patients: [],
    alerts: []
  };

  try {
    console.log('🔄 Connecting to ISOLATED Test Database...');
    await connectTestDB();

    const uniqueTag = Date.now();

    // 1. Create a Doctor
    console.log('\n--- Setting Up Test Entities ---');
    const doctorUser = await UserLogin.create({
      email: `doctor.sos.${uniqueTag}@voiceback.test`,
      passwordHash: 'hashed_password',
      role: 'Doctor'
    });
    createdDocs.users.push(doctorUser._id);

    const testDoctor = await Doctor.create({
      userId: doctorUser._id,
      fullName: 'Dr. Evelyn Reed',
      specialization: 'Neurology',
      hospitalAffiliation: 'Metropolitan Hospital',
      licenseNumber: `MED-SOS-${uniqueTag}`,
      email: doctorUser.email
    });
    createdDocs.doctors.push(testDoctor._id);
    console.log(`✅ Test Doctor created: ID=${testDoctor._id}, Name=${testDoctor.fullName}`);

    // 2. Create a Caregiver
    const caregiverUser = await UserLogin.create({
      email: `caregiver.sos.${uniqueTag}@voiceback.test`,
      passwordHash: 'hashed_password',
      role: 'Caregiver'
    });
    createdDocs.users.push(caregiverUser._id);

    const testCaregiver = await Caregiver.create({
      userId: caregiverUser._id,
      fullName: 'Jane Doe',
      phone: '+1-555-432-1098',
      relationshipToPatient: 'Daughter',
      email: caregiverUser.email
    });
    createdDocs.caregivers.push(testCaregiver._id);
    console.log(`✅ Test Caregiver created: ID=${testCaregiver._id}, Name=${testCaregiver.fullName}`);

    // 3. Create Patient A (WITH assigned caregiver and assigned doctor)
    const patientAUser = await UserLogin.create({
      email: `patient.with.cg.${uniqueTag}@voiceback.test`,
      passwordHash: 'hashed_password',
      role: 'Patient'
    });
    createdDocs.users.push(patientAUser._id);

    const patientWithCaregiver = await Patient.create({
      userId: patientAUser._id,
      fullName: 'Arthur Dent',
      age: 62,
      aphasiaType: "Broca's",
      email: patientAUser.email,
      assignedDoctorId: testDoctor._id,
      assignedCaregiverId: testCaregiver._id
    });
    createdDocs.patients.push(patientWithCaregiver._id);
    console.log(`✅ Patient A (with caregiver) created: ID=${patientWithCaregiver._id}`);

    // 4. Create Patient B (WITHOUT assigned caregiver, but WITH assigned doctor)
    const patientBUser = await UserLogin.create({
      email: `patient.no.cg.${uniqueTag}@voiceback.test`,
      passwordHash: 'hashed_password',
      role: 'Patient'
    });
    createdDocs.users.push(patientBUser._id);

    const patientNoCaregiver = await Patient.create({
      userId: patientBUser._id,
      fullName: 'Ford Prefect',
      age: 45,
      aphasiaType: "Anomic",
      email: patientBUser.email,
      assignedDoctorId: testDoctor._id,
      assignedCaregiverId: null
    });
    createdDocs.patients.push(patientNoCaregiver._id);
    console.log(`✅ Patient B (NO caregiver) created: ID=${patientNoCaregiver._id}`);

    // TEST 1: Attempt Emergency SOS for Patient B (No assigned caregiver)
    console.log('\n--- Test 1: Emergency SOS fails when no caregiver is assigned ---');
    let rejectedAsExpected = false;
    try {
      await emergencySOSService.createEmergencySOS({
        patientId: patientNoCaregiver._id,
        message: 'Patient requires emergency assistance!'
      });
    } catch (err) {
      if (err.message.includes('No caregiver is assigned to this patient')) {
        rejectedAsExpected = true;
        console.log(`✅ Correctly rejected: "${err.message}"`);
      } else {
        throw new Error(`Unexpected rejection error: ${err.message}`);
      }
    }
    if (!rejectedAsExpected) {
      throw new Error('FAILED: createEmergencySOS should have failed because Patient B has no assigned caregiver!');
    }

    // Verify 0 alerts recorded for Patient B
    const alertsForB = await EmergencySOS.find({ patientId: patientNoCaregiver._id });
    if (alertsForB.length !== 0) {
      throw new Error('FAILED: An alert was incorrectly created for Patient B without caregiver');
    }
    console.log('✅ Verified zero emergency alerts stored for patient without assigned caregiver.');

    // TEST 2: Emergency SOS for Patient A (Has assigned caregiver)
    console.log('\n--- Test 2: Emergency SOS routes to assigned caregiver only, NOT doctor ---');
    const createdAlert = await emergencySOSService.createEmergencySOS({
      patientId: patientWithCaregiver._id,
      message: 'Chest discomfort reported by patient Arthur.',
      location: 'Bedroom'
    });
    createdDocs.alerts.push(createdAlert._id);

    console.log(`✅ Alert created: ID=${createdAlert._id}`);
    console.log(`   Patient ID: ${createdAlert.patientId._id} (${createdAlert.patientId.fullName})`);
    console.log(`   Assigned Caregiver ID: ${createdAlert.caregiverId._id} (${createdAlert.caregiverId.fullName})`);
    console.log(`   Doctor ID: ${createdAlert.doctorId || 'null'}`);
    console.log(`   Status: ${createdAlert.status}`);
    console.log(`   Message: ${createdAlert.message}`);
    console.log(`   Triggered At: ${createdAlert.triggeredAt}`);

    // Assertions
    if (String(createdAlert.caregiverId._id) !== String(testCaregiver._id)) {
      throw new Error(`FAILED: Caregiver ID mismatch. Expected ${testCaregiver._id}, got ${createdAlert.caregiverId._id}`);
    }
    if (createdAlert.doctorId !== null && createdAlert.doctorId !== undefined) {
      throw new Error(`FAILED: doctorId must be null! Doctor must never receive emergency SOS alerts. Got: ${createdAlert.doctorId}`);
    }
    if (createdAlert.status !== 'Active') {
      throw new Error(`FAILED: Status must be Active. Got: ${createdAlert.status}`);
    }
    if (!createdAlert.triggeredAt) {
      throw new Error('FAILED: triggeredAt timestamp is missing.');
    }

    // TEST 3: Caregiver can query and view the alert
    console.log('\n--- Test 3: Caregiver Dashboard alert retrieval ---');
    const caregiverAlerts = await emergencySOSService.getEmergencySOSAlerts({ caregiverId: testCaregiver._id });
    console.log(`✅ Caregiver alerts found: ${caregiverAlerts.length}`);
    if (caregiverAlerts.length === 0) {
      throw new Error('FAILED: Caregiver should be able to view the alert for their assigned patient.');
    }
    const retrievedAlert = caregiverAlerts[0];
    if (String(retrievedAlert.patientId._id) !== String(patientWithCaregiver._id)) {
      throw new Error('FAILED: Retrieved alert does not match patient ID.');
    }
    console.log(`✅ Caregiver successfully sees alert for patient: ${retrievedAlert.patientId.fullName}`);

    // TEST 4: Doctor queries for emergency alerts return []
    console.log('\n--- Test 4: Doctor queries return 0 emergency alerts ---');
    const doctorAlerts = await emergencySOSService.getEmergencySOSAlerts({ doctorId: testDoctor._id });
    console.log(`✅ Doctor alerts returned: ${doctorAlerts.length}`);
    if (doctorAlerts.length !== 0) {
      throw new Error('FAILED: Doctors must receive 0 emergency alerts!');
    }

    // TEST 5: Caregiver acknowledges alert
    console.log('\n--- Test 5: Caregiver acknowledges alert ---');
    const acknowledgedAlert = await emergencySOSService.updateEmergencySOSStatus(createdAlert._id, 'Acknowledged');
    if (acknowledgedAlert.status !== 'Acknowledged') {
      throw new Error(`FAILED: Status should be Acknowledged, got: ${acknowledgedAlert.status}`);
    }
    console.log(`✅ Alert successfully transitioned to status: ${acknowledgedAlert.status}`);

    console.log('\n========================================');
    console.log('🎉 ALL EMERGENCY SOS BEHAVIOR TESTS PASSED!');
    console.log('========================================\n');

  } catch (err) {
    console.error('❌ Test failed with error:', err);
    process.exitCode = 1;
  } finally {
    console.log('🧹 Cleaning up test records from database...');
    try {
      if (createdDocs.alerts.length) await EmergencySOS.deleteMany({ _id: { $in: createdDocs.alerts } });
      if (createdDocs.patients.length) await Patient.deleteMany({ _id: { $in: createdDocs.patients } });
      if (createdDocs.caregivers.length) await Caregiver.deleteMany({ _id: { $in: createdDocs.caregivers } });
      if (createdDocs.doctors.length) await Doctor.deleteMany({ _id: { $in: createdDocs.doctors } });
      if (createdDocs.users.length) await UserLogin.deleteMany({ _id: { $in: createdDocs.users } });
      console.log('✅ Cleanup complete.');
    } catch (cleanErr) {
      console.error('⚠️ Cleanup error:', cleanErr.message);
    }
    await mongoose.disconnect();
    console.log('🔌 Disconnected from test database.');
  }
};

runEmergencySOSTest();
