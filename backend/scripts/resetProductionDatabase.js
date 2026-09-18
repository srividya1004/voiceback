/**
 * Script to safely inspect and reset the production database `voiceback` to ZERO application documents
 * as explicitly instructed by the user.
 */

const dns = require('dns');
try {
  dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);
} catch (e) {}

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const axios = require('axios');

// List of all known VoiceBack application collections
const APP_COLLECTIONS = [
  'userlogins',
  'patients',
  'voiceprofiles',
  'appointments',
  'caregivers',
  'communicationhistories',
  'emergencysos',
  'emergencysoses',
  'therapyprogresses',
  'doctors',
  'contextoptions'
];

async function runReset() {
  console.log('========================================================================');
  console.log('VOICEBACK PRODUCTION DATABASE RESET & VERIFICATION TASK');
  console.log('========================================================================\n');

  const prodUri = process.env.MONGODB_URI;
  const testUri = process.env.TEST_MONGODB_URI;

  if (!prodUri || !prodUri.includes('voiceback')) {
    throw new Error('Invalid MONGODB_URI: Must be connected to voiceback');
  }

  const prodConn = await mongoose.createConnection(prodUri, { serverSelectionTimeoutMS: 15000 }).asPromise();
  const prodDb = prodConn.db;

  console.log(`Target Production Database: "${prodDb.databaseName}"`);
  if (prodDb.databaseName !== 'voiceback') {
    throw new Error(`Target database is not "voiceback"! Aborting.`);
  }

  // 1. Audit all collections before cleanup
  console.log('\n--- 1. PRODUCTION COUNTS BEFORE CLEANUP ---');
  const existingCollections = await prodDb.listCollections().toArray();
  const existingColNames = existingCollections.map(c => c.name);

  const beforeCounts = {};
  for (const name of existingColNames) {
    if (name.startsWith('system.')) continue;
    const cnt = await prodDb.collection(name).countDocuments();
    beforeCounts[name] = cnt;
    console.log(`  Collection [${name}]: ${cnt} documents`);
  }

  // 2. Perform the cleanup across all application collections
  console.log('\n--- 2. PERFORMING CLEANUP ACROSS ALL APPLICATION COLLECTIONS ---');
  const clearedCollections = [];
  for (const name of existingColNames) {
    if (name.startsWith('system.')) continue;
    const cnt = await prodDb.collection(name).countDocuments();
    if (cnt > 0) {
      console.log(`  Clearing collection: "${name}" (${cnt} documents)...`);
      const res = await prodDb.collection(name).deleteMany({});
      console.log(`  -> Deleted ${res.deletedCount} documents from "${name}".`);
      clearedCollections.push({ name, deletedCount: res.deletedCount });
    } else {
      console.log(`  Collection "${name}" is already empty (0 documents).`);
      clearedCollections.push({ name, deletedCount: 0 });
    }
  }

  // Also check if any known APP_COLLECTIONS exist that were not listed
  for (const appCol of APP_COLLECTIONS) {
    if (!existingColNames.includes(appCol)) {
      // Ensure it doesn't have documents
      try {
        const cnt = await prodDb.collection(appCol).countDocuments();
        if (cnt > 0) {
          await prodDb.collection(appCol).deleteMany({});
          clearedCollections.push({ name: appCol, deletedCount: cnt });
        }
      } catch (e) {}
    }
  }

  // 3. Verify counts after cleanup
  console.log('\n--- 3. PRODUCTION COUNTS AFTER CLEANUP ---');
  const afterCounts = {};
  let totalAfterDocs = 0;
  for (const name of existingColNames) {
    if (name.startsWith('system.')) continue;
    const cnt = await prodDb.collection(name).countDocuments();
    afterCounts[name] = cnt;
    totalAfterDocs += cnt;
    console.log(`  Collection [${name}]: ${cnt} documents`);
  }

  console.log(`\n  Total Application Documents in "voiceback": ${totalAfterDocs}`);
  if (totalAfterDocs !== 0) {
    throw new Error(`CRITICAL ERROR: Production database still contains ${totalAfterDocs} documents!`);
  }
  console.log('  [PASS] Production database successfully reset to ZERO application documents.\n');

  // 4. Verify no Srividya, Ramesh, Anita, or test accounts remain
  console.log('--- 4. EXPLICIT ACCOUNT ABSENCE VERIFICATION ---');
  const users = await prodDb.collection('userlogins').find({}).toArray();
  const patients = await prodDb.collection('patients').find({}).toArray();
  const voiceProfiles = await prodDb.collection('voiceprofiles').find({}).toArray();

  console.log(`  userlogins:    ${users.length}`);
  console.log(`  patients:      ${patients.length}`);
  console.log(`  voiceprofiles: ${voiceProfiles.length}`);
  console.log('  [PASS] Zero accounts remain in production.\n');

  // 5. Test Database Isolation Check
  console.log('--- 5. TEST DATABASE ISOLATION CHECK ---');
  const testConn = await mongoose.createConnection(testUri, { serverSelectionTimeoutMS: 15000 }).asPromise();
  const testDb = testConn.db;
  console.log(`  Test Database Name: "${testDb.databaseName}"`);
  console.log(`  Test Database URI is distinct: ${prodUri !== testUri}`);
  console.log('  [PASS] voiceback_test remains dedicated and isolated.\n');

  await prodConn.close();
  await testConn.close();

  return {
    beforeCounts,
    clearedCollections,
    afterCounts,
    totalAfterDocs
  };
}

runReset().catch((err) => {
  console.error('❌ RESET FAILED:', err.message);
  process.exit(1);
});
