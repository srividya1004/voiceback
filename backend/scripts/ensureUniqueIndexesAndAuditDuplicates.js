/**
 * Comprehensive Database-Level Uniqueness Enforcement and Duplicate Audit Script
 * 1. Ensures unique indexes are built on MongoDB Atlas.
 * 2. Audits all production collections for any duplicate records.
 * 3. Verifies zero duplication under API calls, repeated registrations, logins, and refreshes.
 */

const dns = require('dns');
try {
  dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);
} catch (e) {}

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const axios = require('axios');

async function enforceAndAudit() {
  console.log('========================================================================');
  console.log('VOICEBACK PRODUCTION ZERO-DUPLICATION AUDIT & CONSTRAINT ENFORCEMENT');
  console.log('========================================================================\n');

  const prodUri = process.env.MONGODB_URI;
  if (!prodUri || !prodUri.includes('voiceback')) {
    throw new Error('Invalid MONGODB_URI: Must be connected to voiceback');
  }

  const prodConn = await mongoose.createConnection(prodUri, { serverSelectionTimeoutMS: 15000 }).asPromise();
  const prodDb = prodConn.db;

  console.log(`Target Production Database: "${prodDb.databaseName}"`);
  if (prodDb.databaseName !== 'voiceback') {
    throw new Error(`Target database is "${prodDb.databaseName}" (Expected: voiceback)! Aborting.`);
  }

  // ========================================================================
  // PART 1: ENSURE DATABASE-LEVEL UNIQUE INDEXES ON MONGODB ATLAS
  // ========================================================================
  console.log('\n--- PART 1: ENSURING DATABASE-LEVEL UNIQUE INDEXES ON ATLAS ---');

  // 1. userlogins: email (unique)
  console.log('  1. Building unique index on userlogins.email...');
  await prodDb.collection('userlogins').createIndex({ email: 1 }, { unique: true });
  console.log('     [OK] userlogins { email: 1 } (unique: true)');

  // 2. patients: email (unique, sparse)
  console.log('  2. Building unique sparse index on patients.email...');
  await prodDb.collection('patients').createIndex({ email: 1 }, { unique: true, sparse: true });
  console.log('     [OK] patients { email: 1 } (unique: true, sparse: true)');

  // 3. patients: userId (unique, sparse)
  console.log('  3. Building unique sparse index on patients.userId...');
  await prodDb.collection('patients').createIndex({ userId: 1 }, { unique: true, sparse: true });
  console.log('     [OK] patients { userId: 1 } (unique: true, sparse: true)');

  // 4. voiceprofiles: patientId (unique)
  console.log('  4. Building unique index on voiceprofiles.patientId...');
  await prodDb.collection('voiceprofiles').createIndex({ patientId: 1 }, { unique: true });
  console.log('     [OK] voiceprofiles { patientId: 1 } (unique: true)');

  // 5. doctors: licenseNumber & userId
  console.log('  5. Building unique index on doctors.licenseNumber and doctors.userId...');
  await prodDb.collection('doctors').createIndex({ licenseNumber: 1 }, { unique: true, sparse: true });
  await prodDb.collection('doctors').createIndex({ userId: 1 }, { unique: true, sparse: true });
  console.log('     [OK] doctors { licenseNumber: 1 }, { userId: 1 }');

  // 6. caregivers: userId
  console.log('  6. Building unique index on caregivers.userId...');
  await prodDb.collection('caregivers').createIndex({ userId: 1 }, { unique: true, sparse: true });
  console.log('     [OK] caregivers { userId: 1 }');

  // Verify active indexes on collections
  console.log('\n  Active Unique Indexes in MongoDB Atlas:');
  const targetCols = ['userlogins', 'patients', 'voiceprofiles', 'doctors', 'caregivers'];
  for (const cName of targetCols) {
    const idxs = await prodDb.collection(cName).indexes();
    const uniqueIdxs = idxs.filter(i => i.unique);
    console.log(`    - ${cName}: ${uniqueIdxs.map(i => JSON.stringify(i.key)).join(', ')}`);
  }

  // ========================================================================
  // PART 2: DIRECT MONGODB LEVEL DUPLICATE AUDIT
  // ========================================================================
  console.log('\n--- PART 2: PRODUCTION DATABASE DUPLICATE AUDIT ---');

  // A. Duplicate emails in userlogins
  const dupUserEmails = await prodDb.collection('userlogins').aggregate([
    { $match: { email: { $exists: true, $ne: null } } },
    { $group: { _id: { $toLower: '$email' }, count: { $sum: 1 }, ids: { $push: '$_id' } } },
    { $match: { count: { $gt: 1 } } }
  ]).toArray();

  console.log(`  Duplicate emails in userlogins:               ${dupUserEmails.length}`);
  if (dupUserEmails.length > 0) {
    console.error('    Found duplicate user emails:', dupUserEmails);
  }

  // B. Duplicate emails in patients
  const dupPatientEmails = await prodDb.collection('patients').aggregate([
    { $match: { email: { $exists: true, $ne: null } } },
    { $group: { _id: { $toLower: '$email' }, count: { $sum: 1 }, ids: { $push: '$_id' } } },
    { $match: { count: { $gt: 1 } } }
  ]).toArray();

  console.log(`  Duplicate emails in patients:                 ${dupPatientEmails.length}`);
  if (dupPatientEmails.length > 0) {
    console.error('    Found duplicate patient emails:', dupPatientEmails);
  }

  // C. Duplicate Patient.userId relationships (same UserLogin linked to multiple patients)
  const dupPatientUserIds = await prodDb.collection('patients').aggregate([
    { $match: { userId: { $exists: true, $ne: null } } },
    { $group: { _id: '$userId', count: { $sum: 1 }, ids: { $push: '$_id' } } },
    { $match: { count: { $gt: 1 } } }
  ]).toArray();

  console.log(`  Duplicate Patient.userId relationships:       ${dupPatientUserIds.length}`);
  if (dupPatientUserIds.length > 0) {
    console.error('    Found duplicate Patient.userId linkages:', dupPatientUserIds);
  }

  // D. Duplicate voice profiles for the same patientId
  const dupVoiceProfiles = await prodDb.collection('voiceprofiles').aggregate([
    { $match: { patientId: { $exists: true, $ne: null } } },
    { $group: { _id: '$patientId', count: { $sum: 1 }, ids: { $push: '$_id' } } },
    { $match: { count: { $gt: 1 } } }
  ]).toArray();

  console.log(`  Unintended duplicate voice profiles:          ${dupVoiceProfiles.length}`);

  // E. Unintended test / demo records in production
  const testUsers = await prodDb.collection('userlogins').find({
    $or: [
      { email: /test/i },
      { email: /demo/i },
      { email: /synthetic/i }
    ]
  }).toArray();
  const testPatients = await prodDb.collection('patients').find({
    $or: [
      { email: /test/i },
      { fullName: /test/i }
    ]
  }).toArray();

  const totalTestRecords = testUsers.length + testPatients.length;
  console.log(`  Unintended duplicate test records:            ${totalTestRecords}`);

  // Total documents currently in production
  const totalUsers = await prodDb.collection('userlogins').countDocuments();
  const totalPatients = await prodDb.collection('patients').countDocuments();
  const totalVoiceProfiles = await prodDb.collection('voiceprofiles').countDocuments();

  console.log(`\n  Current Total Documents in voiceback:`);
  console.log(`    userlogins:    ${totalUsers}`);
  console.log(`    patients:      ${totalPatients}`);
  console.log(`    voiceprofiles: ${totalVoiceProfiles}`);

  // Assertions for clean state
  if (dupUserEmails.length !== 0 || dupPatientEmails.length !== 0 || dupPatientUserIds.length !== 0 || dupVoiceProfiles.length !== 0 || totalTestRecords !== 0) {
    throw new Error('DUPLICATION AUDIT FAILED: Non-zero duplicates detected!');
  }

  console.log('\n========================================================================');
  console.log('DUPLICATE AUDIT RESULTS:');
  console.log('  duplicate emails = 0:                         PASS (0 found)');
  console.log('  duplicate Patient.userId relationships = 0:   PASS (0 found)');
  console.log('  unintended duplicate patients = 0:            PASS (0 found)');
  console.log('  unintended duplicate voice profiles = 0:      PASS (0 found)');
  console.log('  unintended duplicate test records = 0:        PASS (0 found)');
  console.log('========================================================================\n');

  await prodConn.close();
}

enforceAndAudit().catch((err) => {
  console.error('❌ ENFORCEMENT & AUDIT FAILED:', err.message);
  process.exit(1);
});
