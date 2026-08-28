/**
 * Database Inspection and Cleanup Manifest Generator
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

const inspectDatabase = async () => {
  try {
    console.log('🔄 Connecting to Database for Inspection...');
    try {
      await connectDB();
    } catch (dbErr) {
      console.warn('⚠️ Atlas connection unavailable. Starting MongoMemoryServer for inspection...');
      const { MongoMemoryServer } = require('mongodb-memory-server');
      const mongod = await MongoMemoryServer.create();
      await mongoose.connect(mongod.getUri());
      console.log('✅ Connected to local MongoMemoryServer!');
    }

    console.log('\n--- 1. UserLogin Records ---');
    const users = await UserLogin.find().lean();
    console.log(`Total UserLogin accounts: ${users.length}`);
    users.forEach(u => {
      console.log(`  - ID: ${u._id} | Email: ${u.email} | Role: ${u.role}`);
    });

    console.log('\n--- 2. Patient Records ---');
    const patients = await Patient.find().lean();
    console.log(`Total Patient profiles: ${patients.length}`);
    patients.forEach(p => {
      console.log(`  - ID: ${p._id} | Name: ${p.fullName} | UserId: ${p.userId || 'UNLINKED'} | Email: ${p.email || 'N/A'}`);
    });

    console.log('\n--- 3. Doctor Records ---');
    const doctors = await Doctor.find().lean();
    console.log(`Total Doctor profiles: ${doctors.length}`);
    doctors.forEach(d => {
      console.log(`  - ID: ${d._id} | Name: ${d.fullName} | UserId: ${d.userId || 'UNLINKED'} | Email: ${d.email || 'N/A'}`);
    });

    console.log('\n--- 4. Caregiver Records ---');
    const caregivers = await Caregiver.find().lean();
    console.log(`Total Caregiver profiles: ${caregivers.length}`);
    caregivers.forEach(c => {
      console.log(`  - ID: ${c._id} | Name: ${c.fullName} | UserId: ${c.userId || 'UNLINKED'} | Email: ${c.email || 'N/A'}`);
    });

    console.log('\n--- 5. Referenced Collections Summary ---');
    const [appointments, comms, emgs, soses, therapies, voices] = await Promise.all([
      Appointment.countDocuments(),
      CommunicationHistory.countDocuments(),
      EMGProfile.countDocuments(),
      EmergencySOS.countDocuments(),
      TherapyProgress.countDocuments(),
      VoiceProfile.countDocuments()
    ]);

    console.log(`  - Appointments: ${appointments}`);
    console.log(`  - CommunicationHistory: ${comms}`);
    console.log(`  - EMGProfiles: ${emgs}`);
    console.log(`  - EmergencySOS: ${soses}`);
    console.log(`  - TherapyProgress: ${therapies}`);
    console.log(`  - VoiceProfiles: ${voices}`);

    // Generate Backup Snapshot JSON
    const snapshot = {
      timestamp: new Date().toISOString(),
      counts: {
        UserLogin: users.length,
        Patient: patients.length,
        Doctor: doctors.length,
        Caregiver: caregivers.length,
        Appointment: appointments,
        CommunicationHistory: comms,
        EMGProfile: emgs,
        EmergencySOS: soses,
        TherapyProgress: therapies,
        VoiceProfile: voices
      },
      users,
      patients,
      doctors,
      caregivers
    };

    const backupDir = path.join(__dirname, '../backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    const backupPath = path.join(backupDir, `db_snapshot_${Date.now()}.json`);
    fs.writeFileSync(backupPath, JSON.stringify(snapshot, null, 2));
    console.log(`\n💾 Snapshot backup saved to: ${backupPath}`);

    process.exit(0);
  } catch (err) {
    console.error('❌ Inspection Error:', err);
    process.exit(1);
  }
};

inspectDatabase();
