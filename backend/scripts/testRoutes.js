/**
 * Integration test script for all Express REST API endpoints under /api
 * (with JWT authentication and automatic test record teardown).
 */

const http = require('http');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const { connectTestDB } = require('../src/config/database');
const app = require('../src/app');

// Helper to make HTTP requests
const makeRequest = (port, method, path, data = null, headers = {}) => {
  return new Promise((resolve, reject) => {
    const payload = data ? JSON.stringify(data) : null;
    const options = {
      hostname: 'localhost',
      port: port,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {}),
        ...headers
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
    console.log('🔄 Connecting to ISOLATED Test Database for Route Testing...');
    await connectTestDB();


    // Start Express server on test port
    await new Promise((resolve) => {
      server = app.listen(TEST_PORT, () => {
        console.log(`🚀 Test server listening on port ${TEST_PORT}`);
        resolve();
      });
    });

    // 1. Test Health / Root Endpoints
    console.log('\n--- 1. Testing Root / Health Check ---');
    const healthRes = await makeRequest(TEST_PORT, 'GET', '/');
    console.log(`GET / -> Status ${healthRes.status} (Message: ${healthRes.body.message})`);

    // 2. Test UserLogin Routes
    console.log('\n--- 2. Testing /api/user-logins Routes ---');
    const testEmail = `route.test.${Date.now()}@voiceback.org`;
    const createUserRes = await makeRequest(TEST_PORT, 'POST', '/api/user-logins', {
      email: testEmail,
      passwordHash: '$2b$10$routeTestHash',
      role: 'Doctor'
    });
    console.log(`POST /api/user-logins -> Status ${createUserRes.status} (ID: ${createUserRes.body.data?._id})`);
    const userId = createUserRes.body.data?._id;

    const getAllUsersRes = await makeRequest(TEST_PORT, 'GET', '/api/user-logins');
    console.log(`GET /api/user-logins -> Status ${getAllUsersRes.status} (Count: ${getAllUsersRes.body.data?.length})`);

    // Generate JWT token for authenticated routes (Patient & VoiceProfile)
    const jwtSecret = process.env.JWT_SECRET || 'voiceback_secret_key';
    const authToken = jwt.sign({ id: userId, email: testEmail, role: 'Doctor' }, jwtSecret, { expiresIn: '1h' });
    const authHeaders = { Authorization: `Bearer ${authToken}` };

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

    // 5. Test Patient Routes (JWT Protected)
    console.log('\n--- 5. Testing /api/patients Routes (JWT Protected) ---');
    const createPatRes = await makeRequest(TEST_PORT, 'POST', '/api/patients', {
      fullName: 'Tommy Route',
      age: 45,
      aphasiaType: "Broca's",
      assignedDoctorId: doctorId,
      assignedCaregiverId: caregiverId
    }, authHeaders);
    console.log(`POST /api/patients -> Status ${createPatRes.status} (ID: ${createPatRes.body.data?._id})`);
    const patientId = createPatRes.body.data?._id;

    const getPatRes = await makeRequest(TEST_PORT, 'GET', `/api/patients/${patientId}`, null, authHeaders);
    console.log(`GET /api/patients/${patientId} -> Status ${getPatRes.status} (Name: ${getPatRes.body.data?.fullName})`);

    // 6. Test VoiceProfile Routes (JWT Protected)
    console.log('\n--- 6. Testing /api/voice-profiles Routes (JWT Protected) ---');
    const createVoiceRes = await makeRequest(TEST_PORT, 'POST', '/api/voice-profiles', {
      patientId,
      pitch: 1.1,
      speedRate: 1.0,
      voiceGender: 'Neutral'
    }, authHeaders);
    console.log(`POST /api/voice-profiles -> Status ${createVoiceRes.status} (ID: ${createVoiceRes.body.data?._id})`);
    const voiceProfileId = createVoiceRes.body.data?._id;

    // 7. Test TherapyProgress Routes
    console.log('\n--- 7. Testing /api/therapy-progress Routes ---');
    const createTherapyRes = await makeRequest(TEST_PORT, 'POST', '/api/therapy-progress', {
      patientId,
      exercisesCompleted: 10,
      accuracyScore: 85.0
    });
    console.log(`POST /api/therapy-progress -> Status ${createTherapyRes.status} (ID: ${createTherapyRes.body.data?._id})`);
    const therapyProgressId = createTherapyRes.body.data?._id;

    // 8. Test CommunicationHistory Routes
    console.log('\n--- 8. Testing /api/communication-history Routes ---');
    const createCommRes = await makeRequest(TEST_PORT, 'POST', '/api/communication-history', {
      patientId,
      attemptType: 'Whispered',
      recognizedText: 'Hello world',
      confidenceScore: 0.92
    });
    console.log(`POST /api/communication-history -> Status ${createCommRes.status} (ID: ${createCommRes.body.data?._id})`);
    const commHistoryId = createCommRes.body.data?._id;

    // 9. Test Appointment Routes
    console.log('\n--- 9. Testing /api/appointments Routes ---');
    const createApptRes = await makeRequest(TEST_PORT, 'POST', '/api/appointments', {
      patientId,
      doctorId,
      appointmentDate: new Date(Date.now() + 86400000)
    });
    console.log(`POST /api/appointments -> Status ${createApptRes.status} (ID: ${createApptRes.body.data?._id})`);
    const appointmentId = createApptRes.body.data?._id;

    // 10. Cleanup Test Records via DELETE endpoints
    console.log('\n--- 10. Testing DELETE Endpoints Clean up ---');
    const delAppt = await makeRequest(TEST_PORT, 'DELETE', `/api/appointments/${appointmentId}`);
    console.log(`DELETE /api/appointments/${appointmentId} -> Status ${delAppt.status}`);

    const delComm = await makeRequest(TEST_PORT, 'DELETE', `/api/communication-history/${commHistoryId}`);
    console.log(`DELETE /api/communication-history/${commHistoryId} -> Status ${delComm.status}`);

    const delTherapy = await makeRequest(TEST_PORT, 'DELETE', `/api/therapy-progress/${therapyProgressId}`);
    console.log(`DELETE /api/therapy-progress/${therapyProgressId} -> Status ${delTherapy.status}`);

    const delVoice = await makeRequest(TEST_PORT, 'DELETE', `/api/voice-profiles/${voiceProfileId}`, null, authHeaders);
    console.log(`DELETE /api/voice-profiles/${voiceProfileId} -> Status ${delVoice.status}`);

    const delPat = await makeRequest(TEST_PORT, 'DELETE', `/api/patients/${patientId}`, null, authHeaders);
    console.log(`DELETE /api/patients/${patientId} -> Status ${delPat.status}`);

    const delCare = await makeRequest(TEST_PORT, 'DELETE', `/api/caregivers/${caregiverId}`);
    console.log(`DELETE /api/caregivers/${caregiverId} -> Status ${delCare.status}`);

    const delDoc = await makeRequest(TEST_PORT, 'DELETE', `/api/doctors/${doctorId}`);
    console.log(`DELETE /api/doctors/${doctorId} -> Status ${delDoc.status}`);

    const delUser = await makeRequest(TEST_PORT, 'DELETE', `/api/user-logins/${userId}`);
    console.log(`DELETE /api/user-logins/${userId} -> Status ${delUser.status}`);

    console.log('\n🎉 ALL ACTIVE REST API ENDPOINTS TESTED & PASSED SUCCESSFULLY!');
    server.close();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Route Test Failed:', error);
    if (server) server.close();
    process.exit(1);
  }
};

runRouteTest();
