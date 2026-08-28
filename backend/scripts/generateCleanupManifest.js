/**
 * Generate Cleanup Manifest Script
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

const generateManifest = async () => {
  try {
    await connectDB();
    console.log('✅ Connected to MongoDB Atlas');

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

    // Map referenced patient IDs, doctor IDs, caregiver IDs, user IDs
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

    const manifest = {
      keepUsers: [],
      removeUsers: [],
      keepPatients: [],
      removePatients: [],
      keepDoctors: [],
      removeDoctors: [],
      keepCaregivers: [],
      removeCaregivers: []
    };

    users.forEach(u => {
      const isCanonical = activeEmails.has((u.email || '').toLowerCase());
      if (isCanonical) {
        manifest.keepUsers.push({ id: String(u._id), email: u.email, role: u.role, reason: 'Canonical Active User' });
      } else {
        manifest.removeUsers.push({ id: String(u._id), email: u.email, role: u.role, reason: 'Test/Obsolete User' });
      }
    });

    patients.forEach(p => {
      const isRef = referencedPatientIds.has(String(p._id));
      const user = users.find(u => String(u._id) === String(p.userId));
      const isCanonical = user && activeEmails.has((user.email || '').toLowerCase());
      if (isCanonical || isRef) {
        manifest.keepPatients.push({ id: String(p._id), name: p.fullName, email: p.email, reason: isCanonical ? 'Canonical Active Patient' : 'Referenced Historical Record' });
      } else {
        manifest.removePatients.push({ id: String(p._id), name: p.fullName, email: p.email, reason: 'Unreferenced Test Record' });
      }
    });

    doctors.forEach(d => {
      const isRef = referencedDoctorIds.has(String(d._id));
      const user = users.find(u => String(u._id) === String(d.userId));
      const isCanonical = user && activeEmails.has((user.email || '').toLowerCase());
      if (isCanonical || isRef) {
        manifest.keepDoctors.push({ id: String(d._id), name: d.fullName, email: d.email, reason: isCanonical ? 'Canonical Active Doctor' : 'Referenced Historical Record' });
      } else {
        manifest.removeDoctors.push({ id: String(d._id), name: d.fullName, email: d.email, reason: 'Unreferenced Test Record' });
      }
    });

    caregivers.forEach(c => {
      const isRef = referencedCaregiverIds.has(String(c._id));
      const user = users.find(u => String(u._id) === String(c.userId));
      const isCanonical = user && activeEmails.has((user.email || '').toLowerCase());
      if (isCanonical || isRef) {
        manifest.keepCaregivers.push({ id: String(c._id), name: c.fullName, email: c.email, reason: isCanonical ? 'Canonical Active Caregiver' : 'Referenced Historical Record' });
      } else {
        manifest.removeCaregivers.push({ id: String(c._id), name: c.fullName, email: c.email, reason: 'Unreferenced Test Record' });
      }
    });

    console.log('\n--- CLEANUP MANIFEST SUMMARY ---');
    console.log(`Keep Users: ${manifest.keepUsers.length} | Remove Users: ${manifest.removeUsers.length}`);
    console.log(`Keep Patients: ${manifest.keepPatients.length} | Remove Patients: ${manifest.removePatients.length}`);
    console.log(`Keep Doctors: ${manifest.keepDoctors.length} | Remove Doctors: ${manifest.removeDoctors.length}`);
    console.log(`Keep Caregivers: ${manifest.keepCaregivers.length} | Remove Caregivers: ${manifest.removeCaregivers.length}`);

    process.exit(0);
  } catch (err) {
    console.error('Error generating manifest:', err);
    process.exit(1);
  }
};

generateManifest();
