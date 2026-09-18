/**
 * Verification Script: Hide Emergency SOS from Doctor Dashboard
 *
 * Verifies:
 * 1. Patient triggers Emergency SOS.
 * 2. Alert is routed to assigned Caregiver only (status: Active, caregiverId populated).
 * 3. Caregiver queries alerts and receives the triggered SOS.
 * 4. Doctor queries /api/emergency-sos and receives ZERO alerts.
 * 5. DoctorDashboardScreen.jsx contains ZERO Emergency SOS fetching, state, counts, drawer items, or display sections.
 */

const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');

require('dotenv').config({ path: path.join(__dirname, '../.env') });

const { connectTestDB } = require('../src/config/database');
const emergencySOSService = require('../src/services/emergencySOSService');
const { Patient, Caregiver, Doctor, EmergencySOS } = require('../src/models');

async function runVerification() {
  console.log('🔄 Connecting to ISOLATED Test Database...');
  await connectTestDB();
  console.log('✅ Connected to Test Database.');

  try {
    const uniqueTag = Date.now();
    const doc = await Doctor.create({
      fullName: 'Dr. Gregory House',
      email: `house_${uniqueTag}@hospital.test`,
      specialization: 'Neurology',
      hospitalAffiliation: 'Princeton-Plainsboro',
      licenseNumber: `LIC-${uniqueTag}`
    });

    const cg = await Caregiver.create({
      fullName: 'Nurse Jackie',
      email: `jackie_${uniqueTag}@hospital.test`,
      phone: '+1234567890',
      relationshipToPatient: 'Nurse'
    });

    const pt = await Patient.create({
      fullName: 'John Watson',
      email: `watson_${uniqueTag}@hospital.test`,
      age: 45,
      gender: 'male',
      aphasiaType: "Broca's",
      assignedDoctorId: doc._id,
      assignedCaregiverId: cg._id
    });

    console.log('\n--- 1. Trigger Emergency SOS as Patient ---');
    const sosAlert = await emergencySOSService.createEmergencySOS({
      patientId: pt._id,
      message: 'Urgent assistance needed by patient John Watson'
    });

    console.log(`✅ Emergency SOS created: ID=${sosAlert._id}`);
    console.log(`   Patient: ${sosAlert.patientId.fullName} (${sosAlert.patientId._id})`);
    console.log(`   Assigned Caregiver: ${sosAlert.caregiverId.fullName} (${sosAlert.caregiverId._id})`);
    console.log(`   Doctor ID: ${sosAlert.doctorId}`);
    if (sosAlert.doctorId !== null) {
      throw new Error('Doctor ID should be null in Emergency SOS record!');
    }

    console.log('\n--- 2. Confirm Alert Appears in Assigned Caregiver Queries ---');
    const caregiverAlerts = await emergencySOSService.getEmergencySOSAlerts({ caregiverId: cg._id.toString() });
    console.log(`✅ Caregiver alerts count: ${caregiverAlerts.length}`);
    if (caregiverAlerts.length !== 1 || caregiverAlerts[0]._id.toString() !== sosAlert._id.toString()) {
      throw new Error('Caregiver failed to receive the emergency alert!');
    }
    console.log(`✅ Caregiver successfully sees alert: "${caregiverAlerts[0].message}"`);

    console.log('\n--- 3. Confirm Doctor Receives Zero Emergency SOS Alerts ---');
    const doctorAlerts = await emergencySOSService.getEmergencySOSAlerts({ doctorId: doc._id.toString() });
    console.log(`✅ Doctor alerts count: ${doctorAlerts.length}`);
    if (doctorAlerts.length !== 0) {
      throw new Error(`Doctor should receive 0 emergency alerts, but received ${doctorAlerts.length}!`);
    }

    console.log('\n--- 4. Static Code Inspection: DoctorDashboardScreen.jsx ---');
    const doctorScreenPath = path.join(__dirname, '../../pwa/src/components/DoctorDashboardScreen.jsx');
    const screenCode = fs.readFileSync(doctorScreenPath, 'utf8');

    const checks = [
      { term: 'loadEmergencyAlerts', desc: 'No emergency alert fetch call' },
      { term: 'doctorEmergencyAlerts', desc: 'No doctorEmergencyAlerts filter' },
      { term: "activeTab === 'emergency'", desc: 'No emergency tab state check' },
      { term: '<h3>Emergency SOS Alerts</h3>', desc: 'No Emergency SOS Alerts UI header' },
      { term: "label: 'Emergency Alerts'", desc: 'No Emergency Alerts drawer item' }
    ];

    for (const check of checks) {
      if (screenCode.includes(check.term)) {
        throw new Error(`DoctorDashboardScreen.jsx violates check: ${check.desc} (found "${check.term}")`);
      }
      console.log(`✅ Passed check: ${check.desc}`);
    }

    console.log('\n======================================================');
    console.log('🎉 ALL EMERGENCY SOS DOCTOR HIDING VERIFICATIONS PASSED!');
    console.log('======================================================\n');

    // Cleanup
    await EmergencySOS.deleteMany({ patientId: pt._id });
    await Patient.findByIdAndDelete(pt._id);
    await Caregiver.findByIdAndDelete(cg._id);
    await Doctor.findByIdAndDelete(doc._id);

  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from test database.');
  }
}

runVerification().catch((err) => {
  console.error('❌ Verification failed:', err);
  process.exit(1);
});
