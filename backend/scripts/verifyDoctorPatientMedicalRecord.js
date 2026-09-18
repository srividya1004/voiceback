/**
 * Verification Script for Doctor Dashboard - Assigned Patient Details Only
 *
 * Verifies:
 * 1. Authenticated doctor can retrieve complete, rich clinical medical record for their assigned patient.
 * 2. Unassigned doctor attempting to access another patient's medical record is strictly blocked with HTTP 403.
 * 3. Recovery trajectory and clinical indicators are computed strictly from real recorded data.
 * 4. Patients with no therapy progress truthfully display "No data available" (zero invented values).
 */

const mongoose = require('mongoose');
const { connectTestDB } = require('../src/config/database');
const {
  Patient,
  Doctor,
  Caregiver,
  UserLogin,
  TherapyProgress,
  CommunicationHistory,
  Appointment,
  PersonalScript
} = require('../src/models');
const doctorService = require('../src/services/doctorService');

const runVerification = async () => {
  let createdDocs = {
    users: [],
    doctors: [],
    caregivers: [],
    patients: [],
    therapy: [],
    comms: [],
    appointments: [],
    scripts: []
  };

  try {
    console.log('🔄 Connecting to ISOLATED Test Database...');
    await connectTestDB();

    const uniqueTag = Date.now();

    console.log('\n--- 1. Setting Up Test Entities ---');
    // Doctor A
    const doctorAUser = await UserLogin.create({
      email: `doctorA.${uniqueTag}@voiceback.test`,
      passwordHash: 'hash',
      role: 'Doctor'
    });
    createdDocs.users.push(doctorAUser._id);

    const doctorA = await Doctor.create({
      userId: doctorAUser._id,
      fullName: 'Dr. Alistair Vance',
      specialization: 'Neurology & Speech Rehabilitation',
      hospitalAffiliation: 'Boston Neuro Clinic',
      licenseNumber: `DOC-A-${uniqueTag}`,
      email: doctorAUser.email,
      phone: '+1-555-901-2345'
    });
    createdDocs.doctors.push(doctorA._id);

    // Doctor B
    const doctorBUser = await UserLogin.create({
      email: `doctorB.${uniqueTag}@voiceback.test`,
      passwordHash: 'hash',
      role: 'Doctor'
    });
    createdDocs.users.push(doctorBUser._id);

    const doctorB = await Doctor.create({
      userId: doctorBUser._id,
      fullName: 'Dr. Beatrice Thorne',
      specialization: 'Geriatric Rehabilitation',
      hospitalAffiliation: 'Central Hospital',
      licenseNumber: `DOC-B-${uniqueTag}`,
      email: doctorBUser.email
    });
    createdDocs.doctors.push(doctorB._id);

    // Caregiver
    const caregiverUser = await UserLogin.create({
      email: `caregiver.rec.${uniqueTag}@voiceback.test`,
      passwordHash: 'hash',
      role: 'Caregiver'
    });
    createdDocs.users.push(caregiverUser._id);

    const caregiver = await Caregiver.create({
      userId: caregiverUser._id,
      fullName: 'Martha Vance',
      phone: '+1-555-876-5432',
      relationshipToPatient: 'Spouse',
      email: caregiverUser.email
    });
    createdDocs.caregivers.push(caregiver._id);

    // Patient A (Assigned to Doctor A)
    const patientAUser = await UserLogin.create({
      email: `patientA.rec.${uniqueTag}@voiceback.test`,
      passwordHash: 'hash',
      role: 'Patient'
    });
    createdDocs.users.push(patientAUser._id);

    const patientA = await Patient.create({
      userId: patientAUser._id,
      fullName: 'Arthur Pendelton',
      age: 64,
      gender: 'Male',
      aphasiaType: "Broca's",
      preferredLanguage: 'en',
      emergencyContact: '+1-555-876-5432',
      email: patientAUser.email,
      phone: '+1-555-234-5678',
      assignedDoctorId: doctorA._id,
      assignedCaregiverId: caregiver._id
    });
    createdDocs.patients.push(patientA._id);

    // Patient B (Assigned to Doctor B)
    const patientBUser = await UserLogin.create({
      email: `patientB.rec.${uniqueTag}@voiceback.test`,
      passwordHash: 'hash',
      role: 'Patient'
    });
    createdDocs.users.push(patientBUser._id);

    const patientB = await Patient.create({
      userId: patientBUser._id,
      fullName: 'Clara Oswald',
      age: 38,
      gender: 'Female',
      aphasiaType: "Wernicke's",
      email: patientBUser.email,
      assignedDoctorId: doctorB._id,
      assignedCaregiverId: null
    });
    createdDocs.patients.push(patientB._id);

    // Populate clinical data for Patient A
    const script = await PersonalScript.create({
      patientId: patientA._id,
      text: 'I would like a glass of warm water.',
      category: 'daily_needs',
      createdBy: { role: 'doctor', userId: doctorAUser._id }
    });
    createdDocs.scripts.push(script._id);

    const therapy1 = await TherapyProgress.create({
      patientId: patientA._id,
      sessionDate: new Date('2026-09-01T10:00:00Z'),
      exercisesCompleted: 3,
      accuracyScore: 60,
      closenessScore: 60,
      notes: 'Initial evaluation session',
      attemptRawTranscript: 'I want watr',
      attemptReconstructedText: 'I want water.'
    });
    createdDocs.therapy.push(therapy1._id);

    const therapy2 = await TherapyProgress.create({
      patientId: patientA._id,
      sessionDate: new Date('2026-09-08T10:00:00Z'),
      exercisesCompleted: 5,
      accuracyScore: 85,
      closenessScore: 85,
      notes: 'Follow-up articulation practice',
      attemptRawTranscript: 'I would like water',
      attemptReconstructedText: 'I would like a glass of warm water.'
    });
    createdDocs.therapy.push(therapy2._id);

    const commLog = await CommunicationHistory.create({
      patientId: patientA._id,
      timestamp: new Date('2026-09-10T14:30:00Z'),
      attemptType: 'Whispered',
      recognizedText: 'I need medication',
      confidenceScore: 0.88,
      semanticIntent: 'MEDICATION_REQUEST',
      language: 'en'
    });
    createdDocs.comms.push(commLog._id);

    const appointment = await Appointment.create({
      patientId: patientA._id,
      doctorId: doctorA._id,
      appointmentDate: new Date('2026-09-15T09:00:00Z'),
      status: 'Scheduled',
      clinicalNotes: 'Follow-up speech rehabilitation progress review. Patient recovering motor speech control.'
    });
    createdDocs.appointments.push(appointment._id);

    console.log('✅ Test entities and clinical history established.');

    // TEST 1: Doctor A retrieves Patient A's medical record
    console.log('\n--- Test 1: Doctor A accesses assigned Patient A medical record ---');
    const recordA = await doctorService.getPatientMedicalRecord(doctorA._id, patientA._id);

    // Profile check
    if (recordA.patient.fullName !== 'Arthur Pendelton') {
      throw new Error(`FAILED: Expected Arthur Pendelton, got ${recordA.patient.fullName}`);
    }
    if (recordA.patient.aphasiaType !== "Broca's") {
      throw new Error(`FAILED: Expected Broca's aphasia, got ${recordA.patient.aphasiaType}`);
    }
    if (recordA.patient.assignedCaregiver?.fullName !== 'Martha Vance') {
      throw new Error(`FAILED: Expected caregiver Martha Vance, got ${recordA.patient.assignedCaregiver?.fullName}`);
    }
    console.log(`✅ Patient Demographic Profile verified: ${recordA.patient.fullName}, Age ${recordA.patient.age}, Caregiver: ${recordA.patient.assignedCaregiver.fullName}`);

    // Therapy & Recovery metrics check
    const metrics = recordA.therapyData.recoveryMetrics;
    console.log(`   Recovery Trajectory: ${metrics.indicator} (Initial: ${metrics.initialScore}%, Latest: ${metrics.latestScore}%, Avg: ${metrics.averageScore}%)`);
    if (metrics.initialScore !== 60 || metrics.latestScore !== 85) {
      throw new Error(`FAILED: Metric scores mismatch. Expected 60 -> 85, got ${metrics.initialScore} -> ${metrics.latestScore}`);
    }
    if (metrics.indicator !== 'Improvement (+25%)') {
      throw new Error(`FAILED: Expected 'Improvement (+25%)', got ${metrics.indicator}`);
    }
    console.log(`✅ Recovery Trajectory correctly computed: ${metrics.indicator}`);

    // Communication history check
    if (recordA.communicationHistory.length !== 1) {
      throw new Error(`FAILED: Expected 1 communication record, got ${recordA.communicationHistory.length}`);
    }
    console.log(`✅ Communication History verified: "${recordA.communicationHistory[0].recognizedText}" (${recordA.communicationHistory[0].attemptType})`);

    // Doctor Notes check
    if (recordA.clinicalDetails.notes.length !== 1) {
      throw new Error(`FAILED: Expected 1 appointment note, got ${recordA.clinicalDetails.notes.length}`);
    }
    console.log(`✅ Doctor Clinical Notes verified: "${recordA.clinicalDetails.notes[0].text}"`);

    // Generated reports check
    if (!recordA.generatedReports?.medicalSummaryReport || !recordA.generatedReports?.therapyProgressReport) {
      throw new Error('FAILED: Generated clinical reports are missing.');
    }
    console.log(`✅ Generated Reports verified: ${recordA.generatedReports.medicalSummaryReport.reportId} & ${recordA.generatedReports.therapyProgressReport.reportId}`);

    // TEST 2: Doctor A attempts to access Patient B (assigned to Doctor B) -> MUST BE BLOCKED
    console.log('\n--- Test 2: Doctor A denied access to unassigned Patient B ---');
    let blockedAsExpected = false;
    try {
      await doctorService.getPatientMedicalRecord(doctorA._id, patientB._id);
    } catch (err) {
      if (err.statusCode === 403 || err.message.includes('Access Denied')) {
        blockedAsExpected = true;
        console.log(`✅ Correctly blocked with HTTP 403 / Access Denied: "${err.message}"`);
      } else {
        throw new Error(`Unexpected error: ${err.message}`);
      }
    }
    if (!blockedAsExpected) {
      throw new Error('FAILED: Doctor A was NOT blocked from viewing unassigned Patient B!');
    }

    // TEST 3: Patient with zero therapy records returns "No data available" (Truthful fallback)
    console.log('\n--- Test 3: Patient with no therapy history returns "No data available" ---');
    const patientCUser = await UserLogin.create({
      email: `patientC.rec.${uniqueTag}@voiceback.test`,
      passwordHash: 'hash',
      role: 'Patient'
    });
    createdDocs.users.push(patientCUser._id);

    const patientC = await Patient.create({
      userId: patientCUser._id,
      fullName: 'David Mitchell',
      age: 55,
      aphasiaType: 'Global',
      email: patientCUser.email,
      assignedDoctorId: doctorA._id
    });
    createdDocs.patients.push(patientC._id);

    const recordC = await doctorService.getPatientMedicalRecord(doctorA._id, patientC._id);
    if (recordC.therapyData.recoveryMetrics.indicator !== 'No data available') {
      throw new Error(`FAILED: Expected 'No data available', got ${recordC.therapyData.recoveryMetrics.indicator}`);
    }
    if (recordC.therapyData.history.length !== 0) {
      throw new Error('FAILED: Therapy history should be empty.');
    }
    console.log('✅ Truthful fallback verified: Zero therapy records returns "No data available" without fabricating scores.');

    console.log('\n======================================================');
    console.log('🎉 ALL DOCTOR PATIENT MEDICAL RECORD TESTS PASSED!');
    console.log('======================================================\n');

  } catch (err) {
    console.error('❌ Test failed with error:', err);
    process.exitCode = 1;
  } finally {
    console.log('🧹 Cleaning up test records from database...');
    try {
      if (createdDocs.therapy.length) await TherapyProgress.deleteMany({ _id: { $in: createdDocs.therapy } });
      if (createdDocs.comms.length) await CommunicationHistory.deleteMany({ _id: { $in: createdDocs.comms } });
      if (createdDocs.appointments.length) await Appointment.deleteMany({ _id: { $in: createdDocs.appointments } });
      if (createdDocs.scripts.length) await PersonalScript.deleteMany({ _id: { $in: createdDocs.scripts } });
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

runVerification();
