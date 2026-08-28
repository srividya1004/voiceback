/**
 * Detailed Cleanup Manifest Generator & Reporter
 */

const mongoose = require('mongoose');
const connectDB = require('../src/config/database');
const {
  UserLogin,
  Patient,
  Doctor,
  Caregiver,
  Appointment,
  CommunicationHistory,
  EMGProfile,
  EmergencySOS,
  TherapyProgress,
  VoiceProfile
} = require('../src/models');

const generateDetailedReport = async () => {
  try {
    await connectDB();

    const users = await UserLogin.find().lean();
    const patients = await Patient.find().lean();
    const doctors = await Doctor.find().lean();
    const caregivers = await Caregiver.find().lean();

    const appointments = await Appointment.find().lean();
    const comms = await CommunicationHistory.find().lean();
    const emgs = await EMGProfile.find().lean();
    const soses = await EmergencySOS.find().lean();
    const therapies = await TherapyProgress.find().lean();
    const voices = await VoiceProfile.find().lean();

    // Map referenced IDs
    const referencedPatientIds = new Set([
      ...appointments.map(a => String(a.patientId)),
      ...comms.map(c => String(c.patientId)),
      ...emgs.map(e => String(e.patientId)),
      ...soses.map(s => String(s.patientId)),
      ...therapies.map(t => String(t.patientId)),
      ...voices.map(v => String(v.patientId)),
      ...caregivers.flatMap(cg => (cg.assignedPatients || []).map(p => String(p)))
    ]);

    const referencedDoctorIds = new Set([
      ...appointments.map(a => String(a.doctorId)),
      ...soses.map(s => String(s.doctorId)),
      ...patients.map(p => p.assignedDoctorId ? String(p.assignedDoctorId) : null).filter(Boolean)
    ]);

    const referencedCaregiverIds = new Set([
      ...patients.map(p => p.assignedCaregiverId ? String(p.assignedCaregiverId) : null).filter(Boolean)
    ]);

    // Active canonical emails
    const activeEmails = new Set(['gmsrividya@gmail.com', 'sagarbk89@gmail.com', 'sumukh@gmail.com']);

    const report = {
      usersToKeep: [],
      usersToRemove: [],
      patientsToKeep: [],
      patientsToRemove: [],
      doctorsToKeep: [],
      doctorsToRemove: [],
      caregiversToKeep: [],
      caregiversToRemove: []
    };

    users.forEach(u => {
      const email = (u.email || '').toLowerCase();
      if (activeEmails.has(email)) {
        report.usersToKeep.push({ id: String(u._id), email: u.email, role: u.role, reason: 'Active Canonical Account' });
      } else {
        report.usersToRemove.push({ id: String(u._id), email: u.email, role: u.role, reason: 'Test/Temporary Account (0 references)' });
      }
    });

    patients.forEach(p => {
      const isRef = referencedPatientIds.has(String(p._id));
      const user = users.find(u => String(u._id) === String(p.userId));
      const isCanonical = user && activeEmails.has((user.email || '').toLowerCase());
      if (isCanonical || isRef) {
        report.patientsToKeep.push({ id: String(p._id), name: p.fullName, email: p.email || 'N/A', reason: isCanonical ? 'Active Patient Profile' : 'Referenced Historical Record (Therapy/Appt/SOS)' });
      } else {
        report.patientsToRemove.push({ id: String(p._id), name: p.fullName, email: p.email || 'N/A', reason: 'Unreferenced Test Profile' });
      }
    });

    doctors.forEach(d => {
      const isRef = referencedDoctorIds.has(String(d._id));
      const user = users.find(u => String(u._id) === String(d.userId));
      const isCanonical = user && activeEmails.has((user.email || '').toLowerCase());
      if (isCanonical || isRef) {
        report.doctorsToKeep.push({ id: String(d._id), name: d.fullName, email: d.email || 'N/A', reason: isCanonical ? 'Active Doctor Profile' : 'Referenced Historical Record (Appt/SOS/Patient Link)' });
      } else {
        report.doctorsToRemove.push({ id: String(d._id), name: d.fullName, email: d.email || 'N/A', reason: 'Unreferenced Test Profile' });
      }
    });

    caregivers.forEach(c => {
      const isRef = referencedCaregiverIds.has(String(c._id));
      const user = users.find(u => String(u._id) === String(c.userId));
      const isCanonical = user && activeEmails.has((user.email || '').toLowerCase());
      if (isCanonical || isRef) {
        report.caregiversToKeep.push({ id: String(c._id), name: c.fullName, email: c.email || 'N/A', reason: isCanonical ? 'Active Caregiver Profile' : 'Referenced Historical Record (Patient Link)' });
      } else {
        report.caregiversToRemove.push({ id: String(c._id), name: c.fullName, email: c.email || 'N/A', reason: 'Unreferenced Test Profile' });
      }
    });

    console.log('\n--- DETAILED CLEANUP MANIFEST REPORT ---');
    console.log(JSON.stringify(report, null, 2));

    process.exit(0);
  } catch (err) {
    console.error('Error generating detailed report:', err);
    process.exit(1);
  }
};

generateDetailedReport();
