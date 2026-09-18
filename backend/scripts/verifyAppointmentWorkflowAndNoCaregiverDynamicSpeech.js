/**
 * Verification Script:
 * 1. Caregiver Dashboard: Dynamic Speech Response / Context Question Generator removed completely.
 * 2. Appointment Workflow: Caregiver books appointment -> initial status is 'Pending'.
 *    Doctor can Accept/OK ('Accepted') or Cancel/Reject ('Cancelled').
 *    Cancelled appointment is inactive and not completed.
 *    Consistent across models, services, and dashboards.
 */

const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');

require('dotenv').config({ path: path.join(__dirname, '../.env') });

const { connectTestDB } = require('../src/config/database');
const appointmentService = require('../src/services/appointmentService');
const { Patient, Caregiver, Doctor, Appointment } = require('../src/models');

async function runVerification() {
  console.log('🔄 Connecting to ISOLATED Test Database...');
  await connectTestDB();
  console.log('✅ Connected to Test Database.');

  try {
    const uniqueTag = Date.now();

    // Setup Doctor, Caregiver, Patient
    const doc = await Doctor.create({
      fullName: 'Dr. Stephen Strange',
      email: `strange_${uniqueTag}@hospital.test`,
      specialization: 'Neurology',
      hospitalAffiliation: 'Sanctum Hospital',
      licenseNumber: `LIC-STRANGE-${uniqueTag}`
    });

    const cg = await Caregiver.create({
      fullName: 'Christine Palmer',
      email: `palmer_${uniqueTag}@hospital.test`,
      phone: '+1555234567',
      relationshipToPatient: 'Primary Caregiver'
    });

    const pt = await Patient.create({
      fullName: 'Peter Parker',
      email: `peter_${uniqueTag}@hospital.test`,
      age: 22,
      gender: 'male',
      aphasiaType: "Broca's",
      assignedDoctorId: doc._id,
      assignedCaregiverId: cg._id
    });

    console.log('\n--- 1. Caregiver Books Appointment (Default Status) ---');
    const createdApp = await appointmentService.create({
      patientId: pt._id,
      doctorId: doc._id,
      appointmentDate: new Date(Date.now() + 86400000).toISOString(),
      clinicalNotes: 'Speech follow-up consultation'
    });

    console.log(`✅ Appointment Created: ID=${createdApp._id}, Status=${createdApp.status}`);
    if (createdApp.status !== 'Pending') {
      throw new Error(`Expected initial status 'Pending', but got '${createdApp.status}'!`);
    }

    console.log('\n--- 2. Doctor Accepts Appointment (Accept / OK) ---');
    const acceptedApp = await appointmentService.update(createdApp._id, { status: 'Accepted' });
    console.log(`✅ Appointment Accepted: ID=${acceptedApp._id}, Status=${acceptedApp.status}`);
    if (acceptedApp.status !== 'Accepted') {
      throw new Error(`Expected status 'Accepted', but got '${acceptedApp.status}'!`);
    }

    console.log('\n--- 3. Doctor Cancels Appointment (Cancel / Reject) ---');
    const cancelledApp = await appointmentService.update(createdApp._id, { status: 'Cancelled' });
    console.log(`✅ Appointment Cancelled: ID=${cancelledApp._id}, Status=${cancelledApp.status}`);
    if (cancelledApp.status !== 'Cancelled') {
      throw new Error(`Expected status 'Cancelled', but got '${cancelledApp.status}'!`);
    }

    console.log('\n--- 4. Static Code Inspection: CaregiverDashboardScreen.jsx ---');
    const caregiverScreenPath = path.join(__dirname, '../../pwa/src/components/CaregiverDashboardScreen.jsx');
    const caregiverCode = fs.readFileSync(caregiverScreenPath, 'utf8');

    const forbiddenChecks = [
      { term: 'SpeechInputTrigger', desc: 'No SpeechInputTrigger component' },
      { term: 'contextService', desc: 'No contextService import or calls' },
      { term: 'handleAskQuestionSubmit', desc: 'No handleAskQuestionSubmit function' },
      { term: 'handleCaregiverSpeechTranscript', desc: 'No handleCaregiverSpeechTranscript function' },
      { term: 'caregiverQuestionInput', desc: 'No caregiverQuestionInput state' },
      { term: 'Ask Patient Arbitrary Question', desc: 'No Ask Patient Arbitrary Question UI header' },
      { term: 'Generate Dynamic Patient Options', desc: 'No Generate Dynamic Patient Options button' },
      { term: 'Generated Options Preview', desc: 'No Generated Options Preview section' }
    ];

    for (const check of forbiddenChecks) {
      if (caregiverCode.includes(check.term)) {
        throw new Error(`CaregiverDashboardScreen.jsx violates check: ${check.desc} (found "${check.term}")`);
      }
      console.log(`✅ Passed: ${check.desc}`);
    }

    console.log('\n--- 5. Static Code Inspection: DoctorDashboardScreen.jsx ---');
    const doctorScreenPath = path.join(__dirname, '../../pwa/src/components/DoctorDashboardScreen.jsx');
    const doctorCode = fs.readFileSync(doctorScreenPath, 'utf8');

    const doctorRequiredChecks = [
      { term: "app.status === 'Pending'", desc: "Doctor checks app.status === 'Pending'" },
      { term: "handleUpdateStatus(app._id, 'Accepted')", desc: 'Doctor has Accept / OK button updating to Accepted' },
      { term: "handleUpdateStatus(app._id, 'Cancelled')", desc: 'Doctor has Cancel / Reject button updating to Cancelled' },
      { term: 'Appointment Cancelled (Inactive)', desc: 'Doctor displays inactive state for cancelled appointments' }
    ];

    for (const check of doctorRequiredChecks) {
      if (!doctorCode.includes(check.term)) {
        throw new Error(`DoctorDashboardScreen.jsx missing required element: ${check.desc}`);
      }
      console.log(`✅ Passed: ${check.desc}`);
    }

    console.log('\n========================================================================');
    console.log('🎉 ALL APPOINTMENT WORKFLOW & CAREGIVER DYNAMIC REMOVAL CHECKS PASSED!');
    console.log('========================================================================\n');

    // Cleanup
    await Appointment.deleteMany({ patientId: pt._id });
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
