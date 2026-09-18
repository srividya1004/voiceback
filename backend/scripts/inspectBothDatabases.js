const dns = require('dns');
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {}

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function inspect() {
  const prodUri = process.env.MONGODB_URI;
  const testUri = process.env.TEST_MONGODB_URI;

  console.log('Connecting to PRODUCTION:', prodUri ? prodUri.replace(/\/\/.*@/, '//<hidden>@') : 'NONE');
  const prodConn = await mongoose.createConnection(prodUri, { serverSelectionTimeoutMS: 15000 }).asPromise();
  const prodDb = prodConn.db;

  console.log('Connecting to TEST:', testUri ? testUri.replace(/\/\/.*@/, '//<hidden>@') : 'NONE');
  const testConn = await mongoose.createConnection(testUri, { serverSelectionTimeoutMS: 15000 }).asPromise();
  const testDb = testConn.db;

  const pUsers = await prodDb.collection('userlogins').find({}).toArray();
  const pPatients = await prodDb.collection('patients').find({}).toArray();
  const pVps = await prodDb.collection('voiceprofiles').find({}).toArray();

  const tUsers = await testDb.collection('userlogins').find({}).toArray();
  const tPatients = await testDb.collection('patients').find({}).toArray();
  const tVps = await testDb.collection('voiceprofiles').find({}).toArray();

  console.log('\n======================================================');
  console.log('1. PRODUCTION DATABASE (' + prodDb.databaseName + ')');
  console.log('======================================================');
  console.log('Counts:', {
    userlogins: pUsers.length,
    patients: pPatients.length,
    voiceprofiles: pVps.length
  });

  console.log('\n--- voiceback.userlogins ---');
  pUsers.forEach((u, i) => {
    console.log(`[${i + 1}] _id: ${u._id}, email: '${u.email}', role: '${u.role}', createdAt: ${u.createdAt}`);
  });

  console.log('\n--- voiceback.patients ---');
  pPatients.forEach((p, i) => {
    console.log(`[${i + 1}] _id: ${p._id}, userId: ${p.userId}, email: '${p.email}', fullName: '${p.fullName}', age: ${p.age}, gender: '${p.gender}', aphasiaType: '${p.aphasiaType}'`);
  });

  console.log('\n--- voiceback.voiceprofiles ---');
  pVps.forEach((v, i) => {
    console.log(`[${i + 1}] _id: ${v._id}, patientId: ${v.patientId}, voiceId: '${v.voiceId}', status: '${v.status}', lastClonedAt: ${v.lastClonedAt}`);
  });

  console.log('\n======================================================');
  console.log('2. TEST DATABASE (' + testDb.databaseName + ')');
  console.log('======================================================');
  console.log('Counts:', {
    userlogins: tUsers.length,
    patients: tPatients.length,
    voiceprofiles: tVps.length
  });

  console.log('\n--- voiceback_test.userlogins ---');
  tUsers.forEach((u, i) => {
    console.log(`[${i + 1}] _id: ${u._id}, email: '${u.email}', role: '${u.role}', createdAt: ${u.createdAt}`);
  });

  console.log('\n--- voiceback_test.patients ---');
  tPatients.forEach((p, i) => {
    console.log(`[${i + 1}] _id: ${p._id}, userId: ${p.userId}, email: '${p.email}', fullName: '${p.fullName}', age: ${p.age}, gender: '${p.gender}'`);
  });

  console.log('\n--- voiceback_test.voiceprofiles ---');
  tVps.forEach((v, i) => {
    console.log(`[${i + 1}] _id: ${v._id}, patientId: ${v.patientId}, voiceId: '${v.voiceId}', status: '${v.status}'`);
  });

  await prodConn.close();
  await testConn.close();
}

inspect().catch(e => console.error('Inspection failed:', e));
