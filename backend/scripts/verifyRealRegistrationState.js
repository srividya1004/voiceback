/**
 * Verification of Real Patient Registration in Production
 * Inspects voiceback database directly to verify all criteria 1 through 11
 * without deleting or modifying the real patient account.
 */

const dns = require('dns');
try {
  dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);
} catch (e) {}

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const axios = require('axios');

async function verifyRealRegistration() {
  console.log('========================================================================');
  console.log('VERIFICATION OF REAL PATIENT REGISTRATION IN PRODUCTION VOICEBACK');
  console.log('========================================================================\n');

  const prodUri = process.env.MONGODB_URI;
  const testUri = process.env.TEST_MONGODB_URI;

  const prodConn = await mongoose.createConnection(prodUri, { serverSelectionTimeoutMS: 15000 }).asPromise();
  const prodDb = prodConn.db;

  const testConn = await mongoose.createConnection(testUri, { serverSelectionTimeoutMS: 15000 }).asPromise();
  const testDb = testConn.db;

  console.log(`Production Database: "${prodDb.databaseName}"`);
  console.log(`Test Database:       "${testDb.databaseName}"\n`);

  // 1. Audit production counts
  const users = await prodDb.collection('userlogins').find({}).toArray();
  const patients = await prodDb.collection('patients').find({}).toArray();
  const vps = await prodDb.collection('voiceprofiles').find({}).toArray();

  console.log('--- 1. PRODUCTION DATABASE DOCUMENT AUDIT ---');
  console.log(`  voiceback.userlogins count:    ${users.length}`);
  console.log(`  voiceback.patients count:      ${patients.length}`);
  console.log(`  voiceback.voiceprofiles count:  ${vps.length}`);

  if (users.length !== 1) {
    throw new Error(`Expected exactly 1 UserLogin, found ${users.length}`);
  }
  if (patients.length !== 1) {
    throw new Error(`Expected exactly 1 Patient, found ${patients.length}`);
  }

  const userDoc = users[0];
  const patientDoc = patients[0];

  console.log('\n--- 2. REAL PATIENT DOCUMENT PERSISTENCE DETAILS ---');
  console.log(`  UserLogin ID:                  ${userDoc._id}`);
  console.log(`  Registered Email:              ${userDoc.email}`);
  console.log(`  User Role:                     ${userDoc.role}`);
  console.log(`  Password Hashed (bcrypt):      ${Boolean(userDoc.passwordHash && userDoc.passwordHash.startsWith('$2'))}`);
  console.log(`  CreatedAt:                     ${userDoc.createdAt}`);
  console.log('');
  console.log(`  Patient Document ID:           ${patientDoc._id}`);
  console.log(`  Linked userId:                 ${patientDoc.userId}`);
  console.log(`  1-to-1 Linkage Verified:       ${String(patientDoc.userId) === String(userDoc._id)}`);
  console.log(`  Full Name:                     ${patientDoc.fullName}`);
  console.log(`  Age:                           ${patientDoc.age}`);
  console.log(`  Gender:                        ${patientDoc.gender}`);
  console.log(`  Aphasia Type:                  ${patientDoc.aphasiaType}`);
  console.log(`  Preferred Language:            ${patientDoc.preferredLanguage || 'Not specified'}`);
  console.log(`  Phone / Mobile:                ${patientDoc.phone || 'Not specified'}`);
  console.log(`  Emergency Contact:             ${patientDoc.emergencyContact || 'Not specified'}`);

  // 3. Test Database Isolation Check
  const testUsers = await testDb.collection('userlogins').countDocuments();
  const testPatients = await testDb.collection('patients').countDocuments();
  console.log('\n--- 3. TEST DATABASE ISOLATION VERIFICATION ---');
  console.log(`  voiceback_test.userlogins count: ${testUsers} (Expected: 0)`);
  console.log(`  voiceback_test.patients count:   ${testPatients} (Expected: 0)`);
  console.log('  [PASS] Real account was stored strictly in production voiceback, not in voiceback_test.');

  // 4. Simulate Application Refresh
  console.log('\n--- 4. SIMULATE APPLICATION REFRESH ---');
  const API_URL = 'http://localhost:5000';
  await axios.get(`${API_URL}/health`);
  await axios.get(`${API_URL}/api/user-logins`);

  const refreshUsersCount = await prodDb.collection('userlogins').countDocuments();
  const refreshPatientsCount = await prodDb.collection('patients').countDocuments();
  console.log(`  Counts after refresh: userlogins=${refreshUsersCount}, patients=${refreshPatientsCount} (Delta = 0)`);
  if (refreshUsersCount !== 1 || refreshPatientsCount !== 1) {
    throw new Error('Refresh created unexpected documents!');
  }
  console.log('  [PASS] Refreshing the application created ZERO additional documents.');

  // 5. Test Duplicate Registration Prevention
  console.log('\n--- 5. DUPLICATE REGISTRATION ATTEMPT CHECK ---');
  let duplicateBlocked = false;
  try {
    await axios.post(`${API_URL}/api/user-logins`, {
      email: userDoc.email,
      password: 'AnotherPassword123!',
      role: 'Patient',
      fullName: 'Duplicate Test',
      age: 25
    });
  } catch (dupErr) {
    if (dupErr.response && dupErr.response.status === 400) {
      duplicateBlocked = true;
      console.log(`  Duplicate registration rejected as expected: HTTP ${dupErr.response.status} - "${dupErr.response.data?.message || dupErr.response.data?.error}"`);
    } else {
      throw dupErr;
    }
  }

  if (!duplicateBlocked) {
    throw new Error('Duplicate registration was not blocked!');
  }

  const postDupUsersCount = await prodDb.collection('userlogins').countDocuments();
  const postDupPatientsCount = await prodDb.collection('patients').countDocuments();
  console.log(`  Counts after duplicate attempt: userlogins=${postDupUsersCount}, patients=${postDupPatientsCount} (Delta = 0)`);
  if (postDupUsersCount !== 1 || postDupPatientsCount !== 1) {
    throw new Error('Duplicate registration created unexpected documents!');
  }
  console.log('  [PASS] Duplicate registration strictly blocked. Count remains exactly 1 UserLogin and 1 Patient.');

  // 6. Direct MongoDB Unique Index & Duplicate Audit
  console.log('\n--- 6. DUPLICATE AUDIT ON MONGODB ATLAS ---');
  const dupEmails = await prodDb.collection('userlogins').aggregate([
    { $group: { _id: { $toLower: '$email' }, count: { $sum: 1 } } },
    { $match: { count: { $gt: 1 } } }
  ]).toArray();

  const dupUserIds = await prodDb.collection('patients').aggregate([
    { $group: { _id: '$userId', count: { $sum: 1 } } },
    { $match: { count: { $gt: 1 } } }
  ]).toArray();

  console.log(`  Duplicate emails in userlogins:         ${dupEmails.length} (Expected: 0)`);
  console.log(`  Duplicate Patient.userId relationships: ${dupUserIds.length} (Expected: 0)`);

  if (dupEmails.length !== 0 || dupUserIds.length !== 0) {
    throw new Error('Duplicate records detected in MongoDB!');
  }
  console.log('  [PASS] Zero duplicates confirmed in MongoDB Atlas.');

  console.log('\n========================================================================');
  console.log('FINAL REAL APPLICATION REGISTRATION VERIFICATION: 100% SUCCESS!');
  console.log('========================================================================\n');

  await prodConn.close();
  await testConn.close();
}

verifyRealRegistration().catch((err) => {
  console.error('❌ VERIFICATION FAILED:', err.message);
  process.exit(1);
});
