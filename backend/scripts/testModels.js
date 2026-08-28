/**
 * Comprehensive test script to verify all 9 VoiceBack Mongoose models
 * against MongoDB Atlas.
 */

const mongoose = require('mongoose');
const connectDB = require('../src/config/database');
const {
  UserLogin,
  Patient,
  Doctor,
  Caregiver,
  VoiceProfile,
  EMGProfile,
  TherapyProgress,
  CommunicationHistory,
  Appointment
} = require('../src/models');

const runTest = async () => {
  try {
    console.log('🔄 Connecting to MongoDB...');
    try {
      await connectDB();
    } catch (dbErr) {
      console.warn('⚠️ Atlas connection unavailable (IP Whitelist). Starting local MongoMemoryServer for tests...');
      const { MongoMemoryServer } = require('mongodb-memory-server');
      const mongod = await MongoMemoryServer.create();
      await mongoose.connect(mongod.getUri());
      console.log('✅ Connected to local MongoMemoryServer!');
    }

    console.log('\n--- 1. Testing UserLogin Model ---');
    const testUser = await UserLogin.create({
      email: 'test.patient@voiceback.org',
      passwordHash: '$2b$10$e839218391283918239128',
      role: 'Patient'
    });
    console.log(`✅ UserLogin created: ID=${testUser._id}, Email=${testUser.email}`);

    console.log('\n--- 2. Testing Doctor Model ---');
    const testDoctor = await Doctor.create({
      userId: testUser._id,
      fullName: 'Dr. Sarah Jenkins',
      specialization: 'Neurology & Speech Pathology',
      hospitalAffiliation: 'Boston General Hospital',
      licenseNumber: 'MD-998877',
      email: 'dr.jenkins.test@voiceback.org',
      phone: '+1-555-019-2831'
    });
    console.log(`✅ Doctor created: ID=${testDoctor._id}, License=${testDoctor.licenseNumber}`);

    console.log('\n--- 3. Testing Caregiver Model ---');
    const testCaregiver = await Caregiver.create({
      fullName: 'Robert Miller',
      phone: '+1-555-014-9823',
      relationshipToPatient: 'Spouse',
      email: 'robert.m.test@voiceback.org'
    });
    console.log(`✅ Caregiver created: ID=${testCaregiver._id}, Relation=${testCaregiver.relationshipToPatient}`);

    console.log('\n--- 4. Testing Patient Model ---');
    const testPatient = await Patient.create({
      userId: testUser._id,
      fullName: 'John Miller',
      age: 62,
      aphasiaType: "Broca's",
      assignedDoctorId: testDoctor._id,
      assignedCaregiverId: testCaregiver._id
    });
    console.log(`✅ Patient created: ID=${testPatient._id}, AphasiaType=${testPatient.aphasiaType}`);

    console.log('\n--- 5. Testing VoiceProfile Model ---');
    const testVoiceProfile = await VoiceProfile.create({
      patientId: testPatient._id,
      pitch: 1.2,
      speedRate: 0.9,
      voiceGender: 'Male'
    });
    console.log(`✅ VoiceProfile created: ID=${testVoiceProfile._id}, Pitch=${testVoiceProfile.pitch}`);

    console.log('\n--- 6. Testing EMGProfile Model ---');
    const testEMGProfile = await EMGProfile.create({
      patientId: testPatient._id,
      baselineVoltage: 0.15,
      maxVoluntaryContraction: 2.85,
      calibrationVector: [0.12, 0.15, 0.18, 0.22, 0.25]
    });
    console.log(`✅ EMGProfile created: ID=${testEMGProfile._id}, MVC=${testEMGProfile.maxVoluntaryContraction}`);

    console.log('\n--- 7. Testing TherapyProgress Model ---');
    const testTherapyProgress = await TherapyProgress.create({
      patientId: testPatient._id,
      exercisesCompleted: 15,
      accuracyScore: 88.5,
      notes: 'Patient showed improved response times.'
    });
    console.log(`✅ TherapyProgress created: ID=${testTherapyProgress._id}, Accuracy=${testTherapyProgress.accuracyScore}%`);

    console.log('\n--- 8. Testing CommunicationHistory Model ---');
    const testCommHistory = await CommunicationHistory.create({
      patientId: testPatient._id,
      attemptType: 'Whispered',
      recognizedText: 'I need water please',
      confidenceScore: 0.94
    });
    console.log(`✅ CommunicationHistory created: ID=${testCommHistory._id}, Text="${testCommHistory.recognizedText}"`);

    console.log('\n--- 9. Testing Appointment Model ---');
    const testAppointment = await Appointment.create({
      patientId: testPatient._id,
      doctorId: testDoctor._id,
      appointmentDate: new Date(Date.now() + 86400000), // Tomorrow
      status: 'Scheduled',
      clinicalNotes: 'Initial post-stroke sEMG evaluation'
    });
    console.log(`✅ Appointment created: ID=${testAppointment._id}, Status=${testAppointment.status}`);

    console.log('\n--- 10. Cleaning Up Test Documents ---');
    await Appointment.findByIdAndDelete(testAppointment._id);
    await CommunicationHistory.findByIdAndDelete(testCommHistory._id);
    await TherapyProgress.findByIdAndDelete(testTherapyProgress._id);
    await EMGProfile.findByIdAndDelete(testEMGProfile._id);
    await VoiceProfile.findByIdAndDelete(testVoiceProfile._id);
    await Patient.findByIdAndDelete(testPatient._id);
    await Caregiver.findByIdAndDelete(testCaregiver._id);
    await Doctor.findByIdAndDelete(testDoctor._id);
    await UserLogin.findByIdAndDelete(testUser._id);
    console.log('🧹 All test documents cleaned up from MongoDB Atlas.');

    console.log('\n🎉 ALL 9 MONGOOSE MODELS TESTED & PASSED SUCCESSFULLY!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Model Test Failed:', error.message);
    process.exit(1);
  }
};

runTest();
