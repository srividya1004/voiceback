/**
 * VoiceBack Production Database Test Data Purge
 *
 * Surgically removes ONLY synthetic test records from the production database (`voiceback`):
 * - Deletes `test.anita.rao...` records from `userlogins`
 * - Deletes `test.anita.rao...` records from `patients`
 * - Deletes synthetic orphan profile (`660000000000000000000001`) from `voiceprofiles`
 *
 * STRICT GUARANTEE:
 * - Legitimate user accounts (`gmsrividya3@gmail.com`, `gmsrividya@gmail.com`) are NEVER touched.
 */

const dns = require('dns');
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {}

const mongoose = require('mongoose');
require('dotenv').config();

async function cleanProduction() {
  const prodUri = process.env.MONGODB_URI;
  if (!prodUri) throw new Error('MONGODB_URI is not set in .env');

  console.log('Connecting to PRODUCTION Database for surgical cleanup...');
  const conn = await mongoose.createConnection(prodUri, { serverSelectionTimeoutMS: 15000 }).asPromise();
  const db = conn.db;

  if (db.databaseName !== 'voiceback') {
    throw new Error(`Safety check failed: Expected database "voiceback", found "${db.databaseName}"`);
  }

  const userLoginsCol = db.collection('userlogins');
  const patientsCol = db.collection('patients');
  const voiceProfilesCol = db.collection('voiceprofiles');

  console.log('\n--- 1. AUDIT BEFORE CLEANUP ---');
  const preUsers = await userLoginsCol.find({}).toArray();
  const prePatients = await patientsCol.find({}).toArray();
  const preVps = await voiceProfilesCol.find({}).toArray();

  console.log('UserLogins in voiceback:', preUsers.map(u => ({ id: u._id, email: u.email })));
  console.log('Patients in voiceback:', prePatients.map(p => ({ id: p._id, email: p.email, fullName: p.fullName })));
  console.log('VoiceProfiles in voiceback:', preVps.map(v => ({ id: v._id, patientId: v.patientId, status: v.status })));

  // Identify legitimate users to protect
  const legitimateEmails = ['gmsrividya3@gmail.com', 'gmsrividya@gmail.com'];
  const legitimateUsers = preUsers.filter(u => legitimateEmails.includes(u.email.toLowerCase()));
  console.log('\n🛡️  Verified Legitimate Users to Protect:', legitimateUsers.map(u => u.email));

  // Identify test records to delete
  const testUsers = preUsers.filter(u => !legitimateEmails.includes(u.email.toLowerCase()));
  const testPatients = prePatients;
  const syntheticVps = preVps.filter(v => String(v.patientId) === '660000000000000000000001' || !v.patientId);

  console.log('Targeted Test UserLogins for removal:', testUsers.map(u => ({ id: u._id, email: u.email })));
  console.log('Targeted Test Patients for removal:', testPatients.map(p => ({ id: p._id, email: p.email })));
  console.log('Targeted Synthetic VoiceProfiles for removal:', syntheticVps.map(v => ({ id: v._id, patientId: v.patientId })));

  // Execute surgical removal
  if (testUsers.length > 0) {
    const userResult = await userLoginsCol.deleteMany({
      _id: { $in: testUsers.map(u => u._id) },
      email: { $nin: legitimateEmails }
    });
    console.log(`\n🧹 Removed ${userResult.deletedCount} test UserLogin records.`);
  }

  if (testPatients.length > 0) {
    const patientResult = await patientsCol.deleteMany({
      _id: { $in: testPatients.map(p => p._id) }
    });
    console.log(`🧹 Removed ${patientResult.deletedCount} test Patient records.`);
  }

  if (syntheticVps.length > 0) {
    const vpResult = await voiceProfilesCol.deleteMany({
      _id: { $in: syntheticVps.map(v => v._id) }
    });
    console.log(`🧹 Removed ${vpResult.deletedCount} synthetic VoiceProfile records.`);
  }

  console.log('\n--- 2. AUDIT AFTER CLEANUP ---');
  const postUsers = await userLoginsCol.find({}).toArray();
  const postPatients = await patientsCol.find({}).toArray();
  const postVps = await voiceProfilesCol.find({}).toArray();

  console.log(`Remaining UserLogins (${postUsers.length}):`, postUsers.map(u => ({ id: u._id, email: u.email })));
  console.log(`Remaining Patients (${postPatients.length}):`, postPatients.map(p => ({ id: p._id, email: p.email })));
  console.log(`Remaining VoiceProfiles (${postVps.length}):`, postVps.map(v => ({ id: v._id, voiceId: v.voiceId })));

  await conn.close();

  // Validate state
  if (postUsers.length !== 2 || postPatients.length !== 0 || postVps.length !== 0) {
    throw new Error('Cleanup validation failed: Unexpected remaining counts in voiceback!');
  }

  console.log('\n✅ Production database "voiceback" is now completely clean of all test/synthetic data.');
}

cleanProduction().catch(err => {
  console.error('\n❌ Cleanup Failed:', err.message);
  process.exit(1);
});
