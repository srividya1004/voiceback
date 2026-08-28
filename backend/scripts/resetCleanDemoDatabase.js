/**
 * Clean Demo Database Reset Script
 */

const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const connectDB = require('../src/config/database');
const userLoginService = require('../src/services/userLoginService');
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

const resetDatabase = async () => {
  try {
    console.log('⚡ Starting VoiceBack Clean Demo Database Reset...\n');

    // STEP 1 — VERIFY BACKUP
    const backupPath = path.join(__dirname, '../backups/db_snapshot_current_live.json');
    if (!fs.existsSync(backupPath)) {
      throw new Error(`CRITICAL: Backup file not found at ${backupPath}`);
    }

    const backupContent = fs.readFileSync(backupPath, 'utf8');
    const backupData = JSON.parse(backupContent);
    console.log('--- STEP 1: BACKUP VERIFICATION ---');
    console.log(` ✅ Backup file verified: ${backupPath}`);
    console.log(`   Timestamp: ${backupData.timestamp}`);
    console.log(`   UserLogin count in backup: ${backupData.counts.UserLogin}`);
    console.log(`   Patient count in backup: ${backupData.counts.Patient}`);
    console.log(`   Doctor count in backup: ${backupData.counts.Doctor}`);
    console.log(`   Caregiver count in backup: ${backupData.counts.Caregiver}`);

    // Connect to MongoDB Atlas
    await connectDB();

    // Extract canonical user and profile documents from current live DB or snapshot
    const canonicalEmails = ['gmsrividya@gmail.com', 'sagarbk89@gmail.com', 'sumukh@gmail.com'];
    
    const existingUsers = await UserLogin.find({ email: { $in: canonicalEmails } }).lean();
    const existingPatients = await Patient.find({ email: 'gmsrividya@gmail.com' }).lean();
    const existingDoctors = await Doctor.find({ email: 'sagarbk89@gmail.com' }).lean();
    const existingCaregivers = await Caregiver.find({ email: 'sumukh@gmail.com' }).lean();

    // STEP 2 — RESET ALL COLLECTIONS
    console.log('\n--- STEP 2: RESETTING ALL COLLECTIONS ---');
    await Promise.all([
      UserLogin.deleteMany({}),
      Patient.deleteMany({}),
      Doctor.deleteMany({}),
      Caregiver.deleteMany({}),
      VoiceProfile.deleteMany({}),
      EMGProfile.deleteMany({}),
      TherapyProgress.deleteMany({}),
      CommunicationHistory.deleteMany({}),
      Appointment.deleteMany({}),
      EmergencySOS.deleteMany({})
    ]);
    console.log(' ✅ All 10 MongoDB collections cleared.');

    // STEP 3 — RECREATE CANONICAL ACCOUNTS & PROFILES
    console.log('\n--- STEP 3: RECREATING CANONICAL ACCOUNTS & PROFILES ---');

    const bcrypt = require('bcrypt');
    const defaultDoctorHash = await bcrypt.hash('Doctor123!', 10);
    const defaultPatientHash = await bcrypt.hash('Patient123!', 10);
    const defaultCaregiverHash = await bcrypt.hash('Caregiver123!', 10);

    // 1. Patient: gmsrividya@gmail.com
    const patientUserDoc = existingUsers.find(u => u.email === 'gmsrividya@gmail.com') || {
      _id: new mongoose.Types.ObjectId('6a71fce81cb089a32ce1159c'),
      email: 'gmsrividya@gmail.com',
      role: 'Patient'
    };
    const pUser = await UserLogin.create({
      _id: patientUserDoc._id,
      email: patientUserDoc.email,
      passwordHash: patientUserDoc.passwordHash && !patientUserDoc.passwordHash.startsWith('$2b$10$YaP') ? patientUserDoc.passwordHash : defaultPatientHash,
      role: 'Patient'
    });

    const patientProfileDoc = existingPatients[0] || {
      _id: new mongoose.Types.ObjectId('6a71fce81cb089a32ce1159d'),
      fullName: 'Srividya',
      email: 'gmsrividya@gmail.com'
    };

    const pProfile = await Patient.create({
      _id: patientProfileDoc._id || new mongoose.Types.ObjectId('6a71fce81cb089a32ce1159d'),
      userId: pUser._id,
      fullName: patientProfileDoc.fullName || 'Srividya',
      email: pUser.email,
      age: patientProfileDoc.age || 52,
      aphasiaType: patientProfileDoc.aphasiaType || "Broca's",
      gender: patientProfileDoc.gender || 'Female',
      preferredLanguage: patientProfileDoc.preferredLanguage || 'English',
      phone: patientProfileDoc.phone || '+1-555-019-2834',
      emergencyContact: patientProfileDoc.emergencyContact || '+1-555-999-0000'
    });
    console.log(` ✅ Recreated Canonical Patient: Login ID=${pUser._id} | Profile ID=${pProfile._id}`);

    // 2. Doctor: sagarbk89@gmail.com
    const doctorUserDoc = existingUsers.find(u => u.email === 'sagarbk89@gmail.com') || {
      _id: new mongoose.Types.ObjectId('6a7ef6445007923e85f5ac2a'),
      email: 'sagarbk89@gmail.com',
      role: 'Doctor'
    };
    const dUser = await UserLogin.create({
      _id: doctorUserDoc._id,
      email: doctorUserDoc.email,
      passwordHash: doctorUserDoc.passwordHash && !doctorUserDoc.passwordHash.startsWith('$2b$10$YaP') ? doctorUserDoc.passwordHash : defaultDoctorHash,
      role: 'Doctor'
    });

    const doctorProfileDoc = existingDoctors[0] || {
      _id: new mongoose.Types.ObjectId('6a7ef6445007923e85f5ac2b'),
      fullName: 'Dr. Sagar',
      email: 'sagarbk89@gmail.com'
    };

    const dProfile = await Doctor.create({
      _id: doctorProfileDoc._id || new mongoose.Types.ObjectId('6a7ef6445007923e85f5ac2b'),
      userId: dUser._id,
      fullName: doctorProfileDoc.fullName || 'Dr. Sagar',
      email: dUser.email,
      specialization: doctorProfileDoc.specialization || 'Neurological Rehabilitation',
      hospitalAffiliation: doctorProfileDoc.hospitalAffiliation || 'City Medical Center',
      licenseNumber: doctorProfileDoc.licenseNumber || 'DOC-LIC-88992',
      phone: doctorProfileDoc.phone || '+1-555-777-1234'
    });
    console.log(` ✅ Recreated Canonical Doctor: Login ID=${dUser._id} | Profile ID=${dProfile._id}`);

    // 3. Caregiver: sumukh@gmail.com
    const caregiverUserDoc = existingUsers.find(u => u.email === 'sumukh@gmail.com') || {
      _id: new mongoose.Types.ObjectId('6a7ef6be5007923e85f5ac2c'),
      email: 'sumukh@gmail.com',
      role: 'Caregiver'
    };
    const cUser = await UserLogin.create({
      _id: caregiverUserDoc._id,
      email: caregiverUserDoc.email,
      passwordHash: caregiverUserDoc.passwordHash && !caregiverUserDoc.passwordHash.startsWith('$2b$10$YaP') ? caregiverUserDoc.passwordHash : defaultCaregiverHash,
      role: 'Caregiver'
    });

    const caregiverProfileDoc = existingCaregivers[0] || {
      _id: new mongoose.Types.ObjectId('6a7ef6bf5007923e85f5ac2d'),
      fullName: 'Sumukh',
      email: 'sumukh@gmail.com'
    };

    const cProfile = await Caregiver.create({
      _id: caregiverProfileDoc._id || new mongoose.Types.ObjectId('6a7ef6bf5007923e85f5ac2d'),
      userId: cUser._id,
      fullName: caregiverProfileDoc.fullName || 'Sumukh',
      email: cUser.email,
      phone: caregiverProfileDoc.phone || '+1-555-444-5555',
      relationshipToPatient: caregiverProfileDoc.relationshipToPatient || 'Primary Caregiver',
      assignedPatients: [pProfile._id]
    });
    console.log(` ✅ Recreated Canonical Caregiver: Login ID=${cUser._id} | Profile ID=${cProfile._id}`);

    // Link doctor and caregiver back to patient
    pProfile.assignedDoctorId = dProfile._id;
    pProfile.assignedCaregiverId = cProfile._id;
    await pProfile.save();
    console.log(' ✅ Preserved Patient <-> Doctor <-> Caregiver linkages.');

    // STEP 4 — COLLECTION COUNTS VERIFICATION
    console.log('\n--- STEP 4: POST-RESET COLLECTION COUNTS ---');
    const counts = {
      UserLogin: await UserLogin.countDocuments(),
      Patient: await Patient.countDocuments(),
      Doctor: await Doctor.countDocuments(),
      Caregiver: await Caregiver.countDocuments(),
      VoiceProfile: await VoiceProfile.countDocuments(),
      EMGProfile: await EMGProfile.countDocuments(),
      Appointment: await Appointment.countDocuments(),
      CommunicationHistory: await CommunicationHistory.countDocuments(),
      TherapyProgress: await TherapyProgress.countDocuments(),
      EmergencySOS: await EmergencySOS.countDocuments()
    };

    Object.entries(counts).forEach(([col, count]) => {
      console.log(` - ${col.padEnd(22)}: ${count}`);
    });

    // STEP 5 — VERIFICATION CHECKS
    console.log('\n--- STEP 5: VERIFICATION CHECKS ---');
    if (counts.UserLogin !== 3 || counts.Patient !== 1 || counts.Doctor !== 1 || counts.Caregiver !== 1) {
      throw new Error('Verification Failed: Collection counts do not match expected initial clean state!');
    }

    // Verify authentication lookup resolution
    const pLoginRes = await userLoginService.getMe(pUser._id.toString());
    const dLoginRes = await userLoginService.getMe(dUser._id.toString());
    const cLoginRes = await userLoginService.getMe(cUser._id.toString());

    if (!pLoginRes.profile || !dLoginRes.profile || !cLoginRes.profile) {
      throw new Error('Verification Failed: UserLogin -> Profile lookup resolution failed for one or more roles!');
    }

    console.log(' ✅ Exactly 1 Patient, 1 Doctor, 1 Caregiver profile.');
    console.log(' ✅ Stable UserLogin._id -> profile.userId established for all 3 roles.');
    console.log(' ✅ Authentication /me profile resolution verified operational for all 3 roles.');

    console.log('\n========================================');
    console.log('🎉 CLEAN DEMO DATABASE RESET COMPLETE!');
    console.log('========================================\n');

    process.exit(0);
  } catch (err) {
    console.error('❌ Reset Error:', err);
    process.exit(1);
  }
};

resetDatabase();
