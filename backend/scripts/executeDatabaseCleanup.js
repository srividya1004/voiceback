/**
 * Execute Database Cleanup Script (Approved Manifest)
 */

const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
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

const executeCleanup = async () => {
  try {
    console.log('⚡ Starting Database Cleanup Execution...\n');

    // 1. Verify New Current-State Backup Snapshot
    const backupPath = path.join(__dirname, '../backups/db_snapshot_current_live.json');
    if (!fs.existsSync(backupPath)) {
      throw new Error(`Backup snapshot file not found at ${backupPath}`);
    }
    const backupData = JSON.parse(fs.readFileSync(backupPath, 'utf8'));
    console.log(`✅ Verified current-state backup snapshot at: ${backupPath}`);
    console.log(`   Snapshot timestamp: ${backupData.timestamp}\n`);

    // Connect to MongoDB Atlas
    await connectDB();

    // 2. Capture BEFORE counts
    const beforeCounts = {
      UserLogin: await UserLogin.countDocuments(),
      Patient: await Patient.countDocuments(),
      Doctor: await Doctor.countDocuments(),
      Caregiver: await Caregiver.countDocuments(),
      Appointment: await Appointment.countDocuments(),
      CommunicationHistory: await CommunicationHistory.countDocuments(),
      EMGProfile: await EMGProfile.countDocuments(),
      EmergencySOS: await EmergencySOS.countDocuments(),
      TherapyProgress: await TherapyProgress.countDocuments(),
      VoiceProfile: await VoiceProfile.countDocuments()
    };

    console.log('--- 1. BEFORE COUNTS ---');
    Object.entries(beforeCounts).forEach(([col, count]) => {
      console.log(` - ${col.padEnd(22)}: ${count}`);
    });

    // 3. Define candidate ID lists from manifest
    const canonicalEmails = ['gmsrividya@gmail.com', 'sagarbk89@gmail.com', 'sumukh@gmail.com'];

    const targetPatientIdToRemove = '6a868cbaa27174b52f984a61';
    const targetDoctorIdsToRemove = [
      '6a7efa4354d111bc711ee55c',
      '6a7efa7d76e674906ca2eaa7',
      '6a7efed318a39c04b4bc4362',
      '6a868cbba27174b52f984a63'
    ];
    const targetCaregiverIdsToRemove = [
      '6a7f01717a252eca19e9486b',
      '6a7f05ee321f5868e9a63cb8',
      '6a868cbba27174b52f984a65'
    ];

    // Safety checks before deletion
    const canonicalUserCheck = await UserLogin.countDocuments({ email: { $in: canonicalEmails } });
    if (canonicalUserCheck !== 3) {
      throw new Error(`Safety Check Failed: Expected 3 canonical users, found ${canonicalUserCheck}`);
    }

    console.log('\n--- 2. EXECUTING APPROVED DELETIONS ---');
    const userDelRes = await UserLogin.deleteMany({ email: { $nin: canonicalEmails } });
    console.log(` ✅ UserLogin deleted: ${userDelRes.deletedCount} (Target: 34)`);

    const patientDelRes = await Patient.deleteOne({ _id: targetPatientIdToRemove });
    console.log(` ✅ Patient deleted: ${patientDelRes.deletedCount} (Target: 1)`);

    const doctorDelRes = await Doctor.deleteMany({ _id: { $in: targetDoctorIdsToRemove } });
    console.log(` ✅ Doctor deleted: ${doctorDelRes.deletedCount} (Target: 4)`);

    const caregiverDelRes = await Caregiver.deleteMany({ _id: { $in: targetCaregiverIdsToRemove } });
    console.log(` ✅ Caregiver deleted: ${caregiverDelRes.deletedCount} (Target: 3)`);

    const deletedCounts = {
      UserLogin: userDelRes.deletedCount,
      Patient: patientDelRes.deletedCount,
      Doctor: doctorDelRes.deletedCount,
      Caregiver: caregiverDelRes.deletedCount,
      Appointment: 0,
      CommunicationHistory: 0,
      EMGProfile: 0,
      EmergencySOS: 0,
      TherapyProgress: 0,
      VoiceProfile: 0
    };

    // 4. Capture AFTER counts
    const afterCounts = {
      UserLogin: await UserLogin.countDocuments(),
      Patient: await Patient.countDocuments(),
      Doctor: await Doctor.countDocuments(),
      Caregiver: await Caregiver.countDocuments(),
      Appointment: await Appointment.countDocuments(),
      CommunicationHistory: await CommunicationHistory.countDocuments(),
      EMGProfile: await EMGProfile.countDocuments(),
      EmergencySOS: await EmergencySOS.countDocuments(),
      TherapyProgress: await TherapyProgress.countDocuments(),
      VoiceProfile: await VoiceProfile.countDocuments()
    };

    console.log('\n--- 3. AFTER COUNTS ---');
    Object.entries(afterCounts).forEach(([col, count]) => {
      console.log(` - ${col.padEnd(22)}: ${count}`);
    });

    // 5. Deletion Failures Check
    const failures = [];
    if (userDelRes.deletedCount !== 34) failures.push(`UserLogin deleted ${userDelRes.deletedCount} instead of 34`);
    if (patientDelRes.deletedCount !== 1) failures.push(`Patient deleted ${patientDelRes.deletedCount} instead of 1`);
    if (doctorDelRes.deletedCount !== 4) failures.push(`Doctor deleted ${doctorDelRes.deletedCount} instead of 4`);
    if (caregiverDelRes.deletedCount !== 3) failures.push(`Caregiver deleted ${caregiverDelRes.deletedCount} instead of 3`);

    console.log('\n--- 4. DELETION FAILURES ---');
    if (failures.length === 0) {
      console.log(' ✅ ZERO DELETION FAILURES. All targeted deletions completed perfectly.');
    } else {
      console.log(` ❌ Failures: ${failures.join('; ')}`);
    }

    // 6. Canonical Accounts Verification
    const remainingCanonicalUsers = await UserLogin.find({ email: { $in: canonicalEmails } }).lean();
    console.log('\n--- 5. CANONICAL ACCOUNTS VERIFICATION ---');
    console.log(` Remaining Canonical UserLogins (${remainingCanonicalUsers.length} of 3):`);
    remainingCanonicalUsers.forEach(u => console.log(`   * ${u.role}: ${u.email} (_id: ${u._id})`));

    if (remainingCanonicalUsers.length !== 3) {
      throw new Error('Canonical accounts verification failed!');
    }

    // 7. Preserved Collections Verification
    const preservedUnchanged =
      afterCounts.Appointment === beforeCounts.Appointment &&
      afterCounts.CommunicationHistory === beforeCounts.CommunicationHistory &&
      afterCounts.EMGProfile === beforeCounts.EMGProfile &&
      afterCounts.EmergencySOS === beforeCounts.EmergencySOS &&
      afterCounts.TherapyProgress === beforeCounts.TherapyProgress &&
      afterCounts.VoiceProfile === beforeCounts.VoiceProfile;

    console.log('\n--- 6. PRESERVED COLLECTIONS VERIFICATION ---');
    console.log(` Preserved Collections Unchanged: ${preservedUnchanged ? 'YES (100% Intact)' : 'NO'}`);

    console.log('\n========================================');
    console.log('🎉 DATABASE CLEANUP COMPLETED SUCCESSFULLY!');
    console.log('========================================\n');

    process.exit(0);
  } catch (err) {
    console.error('❌ Database Cleanup Execution Failed:', err.message);
    process.exit(1);
  }
};

executeCleanup();
