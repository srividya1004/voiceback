/**
 * Test script to verify all 9 VoiceBack Service layer modules
 * against MongoDB Atlas.
 */

const connectDB = require('../src/config/database');
const {
  userLoginService,
  doctorService,
  caregiverService,
  patientService,
  voiceProfileService,
  emgProfileService,
  therapyProgressService,
  communicationHistoryService,
  appointmentService
} = require('../src/services');

const runServiceTest = async () => {
  try {
    console.log('🔄 Connecting to MongoDB Atlas...');
    await connectDB();

    console.log('\n--- 1. Testing UserLogin Service ---');
    const user = await userLoginService.create({
      email: `service.test.${Date.now()}@voiceback.org`,
      passwordHash: '$2b$10$serviceHashSecret',
      role: 'Doctor'
    });
    console.log(`✅ userLoginService.create() success -> ID: ${user._id}`);

    const allUsers = await userLoginService.getAll();
    console.log(`✅ userLoginService.getAll() success -> Total users: ${allUsers.length}`);

    console.log('\n--- 2. Testing Doctor Service ---');
    const doctor = await doctorService.create({
      userId: user._id,
      fullName: 'Dr. Service Tester',
      specialization: 'Clinical Speech Pathology',
      hospitalAffiliation: 'Central Clinic',
      licenseNumber: `SVC-${Date.now()}`
    });
    console.log(`✅ doctorService.create() success -> ID: ${doctor._id}`);

    console.log('\n--- 3. Testing Caregiver Service ---');
    const caregiver = await caregiverService.create({
      fullName: 'Caregiver Tester',
      phone: '+1-555-888-9999',
      relationshipToPatient: 'Guardian'
    });
    console.log(`✅ caregiverService.create() success -> ID: ${caregiver._id}`);

    console.log('\n--- 4. Testing Patient Service ---');
    const patient = await patientService.create({
      userId: user._id,
      fullName: 'Patient Tester',
      age: 58,
      aphasiaType: "Wernicke's",
      assignedDoctorId: doctor._id,
      assignedCaregiverId: caregiver._id
    });
    console.log(`✅ patientService.create() success -> ID: ${patient._id}`);

    const fetchedPatient = await patientService.getById(patient._id.toString());
    console.log(`✅ patientService.getById() success -> Name: ${fetchedPatient.fullName}`);

    const updatedPatient = await patientService.update(patient._id.toString(), { age: 59 });
    console.log(`✅ patientService.update() success -> Updated Age: ${updatedPatient.age}`);

    console.log('\n--- 5. Testing VoiceProfile Service ---');
    const voiceProfile = await voiceProfileService.create({
      patientId: patient._id,
      pitch: 1.0,
      speedRate: 1.1,
      voiceGender: 'Female'
    });
    console.log(`✅ voiceProfileService.create() success -> ID: ${voiceProfile._id}`);

    console.log('\n--- 6. Testing EMGProfile Service ---');
    const emgProfile = await emgProfileService.create({
      patientId: patient._id,
      baselineVoltage: 0.18,
      maxVoluntaryContraction: 3.10
    });
    console.log(`✅ emgProfileService.create() success -> ID: ${emgProfile._id}`);

    console.log('\n--- 7. Testing TherapyProgress Service ---');
    const therapyProgress = await therapyProgressService.create({
      patientId: patient._id,
      exercisesCompleted: 20,
      accuracyScore: 94.0
    });
    console.log(`✅ therapyProgressService.create() success -> ID: ${therapyProgress._id}`);

    console.log('\n--- 8. Testing CommunicationHistory Service ---');
    const commHistory = await communicationHistoryService.create({
      patientId: patient._id,
      attemptType: 'Weak',
      recognizedText: 'I would like some tea',
      confidenceScore: 0.89
    });
    console.log(`✅ communicationHistoryService.create() success -> ID: ${commHistory._id}`);

    console.log('\n--- 9. Testing Appointment Service ---');
    const appointment = await appointmentService.create({
      patientId: patient._id,
      doctorId: doctor._id,
      appointmentDate: new Date(Date.now() + 172800000)
    });
    console.log(`✅ appointmentService.create() success -> ID: ${appointment._id}`);

    console.log('\n--- 10. Testing Error Handling (Invalid ObjectId & Not Found) ---');
    try {
      await patientService.getById('invalid-id-string');
    } catch (err) {
      console.log(`✅ Exception caught for invalid ID -> "${err.message}"`);
    }

    try {
      await patientService.getById('60c72b2f9b1e8a0015f8a9a9');
    } catch (err) {
      console.log(`✅ Exception caught for missing document -> "${err.message}"`);
    }

    console.log('\n--- 11. Cleaning Up Test Data ---');
    await appointmentService.delete(appointment._id.toString());
    await communicationHistoryService.delete(commHistory._id.toString());
    await therapyProgressService.delete(therapyProgress._id.toString());
    await emgProfileService.delete(emgProfile._id.toString());
    await voiceProfileService.delete(voiceProfile._id.toString());
    await patientService.delete(patient._id.toString());
    await caregiverService.delete(caregiver._id.toString());
    await doctorService.delete(doctor._id.toString());
    await userLoginService.delete(user._id.toString());
    console.log('🧹 All test documents cleaned up via services.');

    console.log('\n🎉 ALL 9 SERVICES TESTED & PASSED SUCCESSFULLY!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Service Test Failed:', error.message);
    process.exit(1);
  }
};

runServiceTest();
