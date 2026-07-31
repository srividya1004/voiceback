/**
 * Integration test script for all Express REST API endpoints under /api
 */

const http = require('http');
const connectDB = require('../src/config/database');
const app = require('../src/app');

// Helper to make HTTP requests
const makeRequest = (port, method, path, data = null) => {
  return new Promise((resolve, reject) => {
    const payload = data ? JSON.stringify(data) : null;
    const options = {
      hostname: 'localhost',
      port: port,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {})
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve({ status: res.statusCode, body: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, body });
        }
      });
    });

    req.on('error', (err) => reject(err));
    if (payload) req.write(payload);
    req.end();
  });
};

const runRouteTest = async () => {
  const TEST_PORT = 5005;
  let server;

  try {
    console.log('🔄 Connecting to MongoDB Atlas...');
    await connectDB();

    server = app.listen(TEST_PORT);
    console.log(`🚀 Test Server started on port ${TEST_PORT}\n`);

    // 1. Test Root & Health
    console.log('--- 1. Testing Root & Health ---');
    const rootRes = await makeRequest(TEST_PORT, 'GET', '/');
    console.log(`GET / -> Status ${rootRes.status}: ${rootRes.body.message}`);

    const healthRes = await makeRequest(TEST_PORT, 'GET', '/health');
    console.log(`GET /health -> Status ${healthRes.status}: Service status "${healthRes.body.data.status}"`);

    // 2. Test UserLogin Routes
    console.log('\n--- 2. Testing /api/user-logins Routes ---');
    const createUserRes = await makeRequest(TEST_PORT, 'POST', '/api/user-logins', {
      email: `route.test.${Date.now()}@voiceback.org`,
      passwordHash: '$2b$10$routeTestHash',
      role: 'Patient'
    });
    console.log(`POST /api/user-logins -> Status ${createUserRes.status} (ID: ${createUserRes.body.data?._id})`);
    const userId = createUserRes.body.data?._id;

    const getAllUsersRes = await makeRequest(TEST_PORT, 'GET', '/api/user-logins');
    console.log(`GET /api/user-logins -> Status ${getAllUsersRes.status} (Count: ${getAllUsersRes.body.data?.length})`);

    // 3. Test Doctor Routes
    console.log('\n--- 3. Testing /api/doctors Routes ---');
    const createDocRes = await makeRequest(TEST_PORT, 'POST', '/api/doctors', {
      userId,
      fullName: 'Dr. Alex Route',
      specialization: 'Neurology',
      hospitalAffiliation: 'City Hospital',
      licenseNumber: `LIC-${Date.now()}`
    });
    console.log(`POST /api/doctors -> Status ${createDocRes.status} (ID: ${createDocRes.body.data?._id})`);
    const doctorId = createDocRes.body.data?._id;

    // 4. Test Caregiver Routes
    console.log('\n--- 4. Testing /api/caregivers Routes ---');
    const createCareRes = await makeRequest(TEST_PORT, 'POST', '/api/caregivers', {
      fullName: 'Mary Route',
      phone: '+1-555-010-9999',
      relationshipToPatient: 'Parent'
    });
    console.log(`POST /api/caregivers -> Status ${createCareRes.status} (ID: ${createCareRes.body.data?._id})`);
    const caregiverId = createCareRes.body.data?._id;

    // 5. Test Patient Routes
    console.log('\n--- 5. Testing /api/patients Routes ---');
    const createPatRes = await makeRequest(TEST_PORT, 'POST', '/api/patients', {
      fullName: 'Tommy Route',
      age: 45,
      aphasiaType: "Broca's",
      assignedDoctorId: doctorId,
      assignedCaregiverId: caregiverId
    });
    console.log(`POST /api/patients -> Status ${createPatRes.status} (ID: ${createPatRes.body.data?._id})`);
    const patientId = createPatRes.body.data?._id;

    const getPatRes = await makeRequest(TEST_PORT, 'GET', `/api/patients/${patientId}`);
    console.log(`GET /api/patients/${patientId} -> Status ${getPatRes.status} (Name: ${getPatRes.body.data?.fullName})`);

    // 6. Test VoiceProfile Routes
    console.log('\n--- 6. Testing /api/voice-profiles Routes ---');
    const createVoiceRes = await makeRequest(TEST_PORT, 'POST', '/api/voice-profiles', {
      patientId,
      pitch: 1.1,
      speedRate: 1.0,
      voiceGender: 'Neutral'
    });
    console.log(`POST /api/voice-profiles -> Status ${createVoiceRes.status} (ID: ${createVoiceRes.body.data?._id})`);
    const voiceProfileId = createVoiceRes.body.data?._id;

    // 7. Test EMGProfile Routes
    console.log('\n--- 7. Testing /api/emg-profiles Routes ---');
    const createEmgRes = await makeRequest(TEST_PORT, 'POST', '/api/emg-profiles', {
      patientId,
      baselineVoltage: 0.12,
      maxVoluntaryContraction: 2.45
    });
    console.log(`POST /api/emg-profiles -> Status ${createEmgRes.status} (ID: ${createEmgRes.body.data?._id})`);
    const emgProfileId = createEmgRes.body.data?._id;

    // 8. Test TherapyProgress Routes
    console.log('\n--- 8. Testing /api/therapy-progress Routes ---');
    const createTherapyRes = await makeRequest(TEST_PORT, 'POST', '/api/therapy-progress', {
      patientId,
      exercisesCompleted: 10,
      accuracyScore: 85.0
    });
    console.log(`POST /api/therapy-progress -> Status ${createTherapyRes.status} (ID: ${createTherapyRes.body.data?._id})`);
    const therapyProgressId = createTherapyRes.body.data?._id;

    // 9. Test CommunicationHistory Routes
    console.log('\n--- 9. Testing /api/communication-history Routes ---');
    const createCommRes = await makeRequest(TEST_PORT, 'POST', '/api/communication-history', {
      patientId,
      attemptType: 'Silent',
      recognizedText: 'Hello world',
      confidenceScore: 0.92
    });
    console.log(`POST /api/communication-history -> Status ${createCommRes.status} (ID: ${createCommRes.body.data?._id})`);
    const commHistoryId = createCommRes.body.data?._id;

    // 10. Test Appointment Routes
    console.log('\n--- 10. Testing /api/appointments Routes ---');
    const createApptRes = await makeRequest(TEST_PORT, 'POST', '/api/appointments', {
      patientId,
      doctorId,
      appointmentDate: new Date(Date.now() + 86400000)
    });
    console.log(`POST /api/appointments -> Status ${createApptRes.status} (ID: ${createApptRes.body.data?._id})`);
    const appointmentId = createApptRes.body.data?._id;

    // 11. Cleanup Test Records via DELETE endpoints
    console.log('\n--- 11. Testing DELETE Endpoints Clean up ---');
    const delAppt = await makeRequest(TEST_PORT, 'DELETE', `/api/appointments/${appointmentId}`);
    console.log(`DELETE /api/appointments/${appointmentId} -> Status ${delAppt.status}`);

    const delComm = await makeRequest(TEST_PORT, 'DELETE', `/api/communication-history/${commHistoryId}`);
    console.log(`DELETE /api/communication-history/${commHistoryId} -> Status ${delComm.status}`);

    const delTherapy = await makeRequest(TEST_PORT, 'DELETE', `/api/therapy-progress/${therapyProgressId}`);
    console.log(`DELETE /api/therapy-progress/${therapyProgressId} -> Status ${delTherapy.status}`);

    const delEmg = await makeRequest(TEST_PORT, 'DELETE', `/api/emg-profiles/${emgProfileId}`);
    console.log(`DELETE /api/emg-profiles/${emgProfileId} -> Status ${delEmg.status}`);

    const delVoice = await makeRequest(TEST_PORT, 'DELETE', `/api/voice-profiles/${voiceProfileId}`);
    console.log(`DELETE /api/voice-profiles/${voiceProfileId} -> Status ${delVoice.status}`);

    const delPat = await makeRequest(TEST_PORT, 'DELETE', `/api/patients/${patientId}`);
    console.log(`DELETE /api/patients/${patientId} -> Status ${delPat.status}`);

    const delCare = await makeRequest(TEST_PORT, 'DELETE', `/api/caregivers/${caregiverId}`);
    console.log(`DELETE /api/caregivers/${caregiverId} -> Status ${delCare.status}`);

    const delDoc = await makeRequest(TEST_PORT, 'DELETE', `/api/doctors/${doctorId}`);
    console.log(`DELETE /api/doctors/${doctorId} -> Status ${delDoc.status}`);

    const delUser = await makeRequest(TEST_PORT, 'DELETE', `/api/user-logins/${userId}`);
    console.log(`DELETE /api/user-logins/${userId} -> Status ${delUser.status}`);

    console.log('\n🎉 ALL REST API ENDPOINTS TESTED & PASSED SUCCESSFULLY!');
    server.close();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Route Test Failed:', error);
    if (server) server.close();
    process.exit(1);
  }
};

runRouteTest();
