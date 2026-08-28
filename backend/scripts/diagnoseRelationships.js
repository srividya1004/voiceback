/**
 * Read-Only Relationship & Assignment Diagnostic Script
 */

const mongoose = require('mongoose');
const connectDB = require('../src/config/database');
const { Patient, Doctor, Caregiver, UserLogin } = require('../src/models');

const diagnose = async () => {
  try {
    await connectDB();
    console.log('🔍 Starting Read-Only Relationship Inspection...\n');

    const [patients, doctors, caregivers, users] = await Promise.all([
      Patient.find().lean(),
      Doctor.find().lean(),
      Caregiver.find().lean(),
      UserLogin.find().lean()
    ]);

    console.log('--- 1. PATIENT RECORDS ---');
    patients.forEach(p => {
      console.log(` Patient ID: ${p._id}`);
      console.log(`   Name: ${p.fullName} | Email: ${p.email}`);
      console.log(`   userId: ${p.userId}`);
      console.log(`   assignedDoctorId: ${p.assignedDoctorId || 'null'}`);
      console.log(`   assignedCaregiverId: ${p.assignedCaregiverId || 'null'}`);
    });

    console.log('\n--- 2. DOCTOR RECORDS ---');
    doctors.forEach(d => {
      console.log(` Doctor ID: ${d._id}`);
      console.log(`   Name: ${d.fullName} | Email: ${d.email}`);
      console.log(`   userId: ${d.userId}`);
    });

    console.log('\n--- 3. CAREGIVER RECORDS ---');
    caregivers.forEach(c => {
      console.log(` Caregiver ID: ${c._id}`);
      console.log(`   Name: ${c.fullName} | Email: ${c.email}`);
      console.log(`   userId: ${c.userId}`);
      console.log(`   assignedPatients: ${JSON.stringify(c.assignedPatients || [])}`);
    });

    console.log('\n--- 4. USER LOGIN ACCOUNTS ---');
    users.forEach(u => {
      console.log(` UserLogin ID: ${u._id} | Role: ${u.role} | Email: ${u.email}`);
    });

    process.exit(0);
  } catch (err) {
    console.error('❌ Diagnostic error:', err);
    process.exit(1);
  }
};

diagnose();
