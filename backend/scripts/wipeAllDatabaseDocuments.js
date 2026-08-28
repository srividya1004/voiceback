/**
 * Complete Database Document Wipe Script
 * Deletes all documents across all 10 application collections intentionally.
 * Does not drop collections, schemas, or indexes.
 */

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

async function wipeAllDocuments() {
  console.log('==================================================');
  console.log(' VOICEBACK COMPLETE DATABASE DOCUMENT WIPE        ');
  console.log('==================================================\n');

  try {
    await connectDB();

    const collections = {
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
    };

    console.log('--- 1. BEFORE DELETION DOCUMENT COUNTS ---');
    const beforeCounts = {};
    for (const [name, model] of Object.entries(collections)) {
      beforeCounts[name] = await model.countDocuments();
      console.log(`  - ${name.padEnd(22)}: ${beforeCounts[name]} documents`);
    }

    console.log('\n--- 2. EXECUTING DOCUMENT WIPES (deleteMany({})) ---');
    const deletedCounts = {};
    for (const [name, model] of Object.entries(collections)) {
      const res = await model.deleteMany({});
      deletedCounts[name] = res.deletedCount;
      console.log(`  ✅ Deleted ${res.deletedCount} documents from ${name}`);
    }

    console.log('\n--- 3. AFTER DELETION DOCUMENT COUNTS ---');
    const afterCounts = {};
    let allZero = true;
    for (const [name, model] of Object.entries(collections)) {
      afterCounts[name] = await model.countDocuments();
      console.log(`  📌 ${name.padEnd(22)}: ${afterCounts[name]} documents`);
      if (afterCounts[name] !== 0) {
        allZero = false;
      }
    }

    console.log('\n--- 4. VERIFICATION RESULT ---');
    if (allZero) {
      console.log('  ✅ ALL 10 APPLICATION COLLECTIONS SUCCESSFULLY CONTAIN EXACTLY 0 DOCUMENTS.');
      console.log('  ✅ Database structure, schemas, and indexes remain 100% intact for future fresh data.');
    } else {
      console.error('  ❌ ERROR: One or more collections still contain documents!');
      process.exit(1);
    }

    console.log('\n==================================================');
    console.log(' COMPLETE DATABASE DOCUMENT WIPE FINISHED CLEANLY  ');
    console.log('==================================================\n');

    process.exit(0);
  } catch (err) {
    console.error('❌ Wipe Error:', err.message);
    process.exit(1);
  }
}

wipeAllDocuments();
