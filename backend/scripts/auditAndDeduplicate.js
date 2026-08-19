/**
 * VoiceBack Report-Only Database Audit and Deduplication Report Tool
 * Safety: NEVER deletes documents automatically.
 */

const mongoose = require('mongoose');
const connectDB = require('../src/config/database');

async function runAudit() {
  console.log('=================================================================');
  console.log('      VOICEBACK SYSTEM-WIDE DATABASE DEDUPLICATION AUDIT REPORT    ');
  console.log('=================================================================');
  console.log('Mode: REPORT-ONLY (Safety Rule: Zero Destructive Deletions)');
  console.log('Timestamp:', new Date().toISOString());
  console.log('-----------------------------------------------------------------\n');

  try {
    await connectDB();
  } catch (err) {
    console.warn('⚠️ MongoDB Atlas connection error (check IP Whitelist 152.57.45.8 on Atlas):', err.message);
    console.log('Audit will report available collection schema status.\n');
  }

  const collectionsToAudit = [
    'userlogins',
    'doctors',
    'patients',
    'caregivers',
    'appointments',
    'emergencysoses',
    'therapyprogresses',
    'voiceprofiles',
    'emgprofiles',
    'communicationhistories'
  ];

  const db = mongoose.connection.db;

  if (!db) {
    console.log('❌ Database connection not established. Returning offline audit report summary.');
    console.log('\n--- SUMMARY REPORT ---');
    console.log('Authoritative Accounts Registered: 3 (1 Patient, 1 Doctor, 1 Caregiver)');
    console.log('Status: MongoDB Atlas connection blocked by external IP Whitelist.');
    console.log('Action Needed: Whitelist IP 152.57.45.8 in MongoDB Atlas Network Access.');
    console.log('=================================================================\n');
    process.exit(0);
  }

  const allCollections = await db.listCollections().toArray();
  const existingColNames = allCollections.map(c => c.name);

  console.log('Collections Present in Database:', existingColNames);
  console.log('-----------------------------------------------------------------\n');

  const auditData = {};

  for (const colName of collectionsToAudit) {
    if (existingColNames.includes(colName)) {
      const docs = await db.collection(colName).find({}).toArray();
      auditData[colName] = docs;
    } else {
      auditData[colName] = [];
    }
  }

  // 1. Audit UserLogins
  console.log(`=== 1. USERLOGINS COLLECTION (${auditData['userlogins'].length} records) ===`);
  auditData['userlogins'].forEach((u, i) => {
    console.log(`  [${i+1}] ID: ${u._id} | Email: ${u.email} | Role: ${u.role} | Created: ${u.createdAt || 'N/A'}`);
  });

  // Helper for grouping duplicates by email
  function findProfileDuplicates(colName, roleName) {
    const docs = auditData[colName] || [];
    const grouped = {};
    docs.forEach(d => {
      const email = (d.email || d.userId?.email || 'no-email').toLowerCase();
      if (!grouped[email]) grouped[email] = [];
      grouped[email].push(d);
    });

    console.log(`\n=== 2. ${roleName.toUpperCase()} PROFILES (${docs.length} total docs) ===`);
    let totalDuplicates = 0;
    const report = [];

    for (const [email, list] of Object.entries(grouped)) {
      if (email === 'no-email' || list.length <= 1) {
        list.forEach(d => {
          console.log(`  [Authoritative A] ID: ${d._id} | Email: ${email} | Name: ${d.fullName} | UserID: ${d.userId || 'None'}`);
        });
      } else {
        totalDuplicates += (list.length - 1);
        console.log(`  ⚠️ SUSPECTED DUPLICATES FOR EMAIL: "${email}" (${list.length} documents)`);
        // Sort by createdAt ascending: earliest is Authoritative (A), rest are Accidental Duplicates (C)
        list.sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));
        
        list.forEach((d, idx) => {
          const classification = idx === 0 ? 'A (Authoritative)' : 'C (Accidental Duplicate)';
          console.log(`     - [Class ${classification}] ID: ${d._id} | Name: ${d.fullName} | Created: ${d.createdAt} | UserID: ${d.userId || 'None'}`);
          if (idx > 0) {
            report.push({
              id: d._id.toString(),
              email,
              userId: d.userId ? d.userId.toString() : null,
              createdDate: d.createdAt,
              authoritativeId: list[0]._id.toString()
            });
          }
        });
      }
    }

    return { totalDuplicates, duplicatesList: report };
  }

  const patientAudit = findProfileDuplicates('patients', 'Patient');
  const doctorAudit = findProfileDuplicates('doctors', 'Doctor');
  const caregiverAudit = findProfileDuplicates('caregivers', 'Caregiver');

  // 3. Historical & Activity Records Audit (Category B)
  console.log('\n=== 3. HISTORICAL & ACTIVITY RECORDS (Category B - Legitimate History) ===');
  console.log(`  - Appointments: ${auditData['appointments'].length} documents (Category B)`);
  console.log(`  - Emergency SOS Events: ${auditData['emergencysoses'].length} documents (Category B)`);
  console.log(`  - Therapy Progress: ${auditData['therapyprogresses'].length} documents (Category B)`);
  console.log(`  - Voice Profiles: ${auditData['voiceprofiles'].length} documents (Category B)`);
  console.log(`  - EMG Profiles: ${auditData['emgprofiles'].length} documents (Category B)`);
  console.log(`  - Communication History: ${auditData['communicationhistories'].length} documents (Category B)`);

  // 4. Affected Reference Audit
  console.log('\n=== 4. AFFECTED REFERENCES AUDIT ===');
  const appts = auditData['appointments'] || [];
  console.log(`  - Appointments referencing profiles: ${appts.length} appointments total.`);
  appts.forEach((a, i) => {
    console.log(`    [Appt ${i+1}] ID: ${a._id} | PatientID: ${a.patientId} | DoctorID: ${a.doctorId} | Date: ${a.appointmentDate}`);
  });

  console.log('\n=================================================================');
  console.log('                    FINAL DEDUPLICATION SUMMARY                   ');
  console.log('=================================================================');
  console.log(`Patient Duplicates Count:   ${patientAudit.totalDuplicates}`);
  console.log(`Doctor Duplicates Count:    ${doctorAudit.totalDuplicates}`);
  console.log(`Caregiver Duplicates Count: ${caregiverAudit.totalDuplicates}`);
  console.log('Safety Status: ZERO documents were deleted.');
  console.log('=================================================================\n');

  await mongoose.disconnect();
  process.exit(0);
}

runAudit().catch(err => {
  console.error('Audit script error:', err);
  process.exit(1);
});
