/**
 * Verification test for Production Health Endpoints and CORS
 */

const http = require('http');
const app = require('../src/app');
const mongoose = require('mongoose');
const { connectDB } = require('../src/config/database');

const makeRequest = (port, path, headers = {}) => {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: '127.0.0.1',
      port: port,
      path: path,
      method: 'GET',
      headers: headers
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, headers: res.headers, body: JSON.parse(body) });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, body });
        }
      });
    });

    req.on('error', (err) => reject(err));
    req.end();
  });
};

const run = async () => {
  const TEST_PORT = 5022;
  let server;

  try {
    console.log('🔄 Connecting to MongoDB for Health Check validation...');
    await connectDB();

    await new Promise((resolve) => {
      server = app.listen(TEST_PORT, '0.0.0.0', () => {
        console.log(`🚀 Test server listening on 0.0.0.0:${TEST_PORT}`);
        resolve();
      });
    });

    // 1. Test GET /health
    console.log('\n--- 1. Testing GET /health ---');
    const healthRoot = await makeRequest(TEST_PORT, '/health');
    console.log(`Status: ${healthRoot.status}`);
    console.log('Response:', JSON.stringify(healthRoot.body, null, 2));
    if (healthRoot.status !== 200 || healthRoot.body?.data?.database?.status !== 'Connected') {
      throw new Error('/health failed or database not connected');
    }
    console.log('✅ GET /health PASS');

    // 2. Test GET /api/health
    console.log('\n--- 2. Testing GET /api/health ---');
    const healthApi = await makeRequest(TEST_PORT, '/api/health');
    console.log(`Status: ${healthApi.status}`);
    console.log('Response:', JSON.stringify(healthApi.body, null, 2));
    if (healthApi.status !== 200 || healthApi.body?.data?.database?.status !== 'Connected') {
      throw new Error('/api/health failed or database not connected');
    }
    console.log('✅ GET /api/health PASS');

    // 3. Test CORS headers with allowed origin
    console.log('\n--- 3. Testing CORS Origin Handling ---');
    const corsTest = await makeRequest(TEST_PORT, '/health', {
      Origin: 'https://voiceback-pwa.vercel.app'
    });
    console.log('CORS Allow-Origin header:', corsTest.headers['access-control-allow-origin']);
    console.log('CORS Allow-Credentials header:', corsTest.headers['access-control-allow-credentials']);
    if (corsTest.headers['access-control-allow-credentials'] !== 'true') {
      throw new Error('CORS Access-Control-Allow-Credentials missing or invalid');
    }
    console.log('✅ CORS Origin Verification PASS');

    console.log('\n🎉 ALL DEPLOYMENT HEALTH & CORS CHECKS PASSED SUCCESSFULLY!');
  } catch (err) {
    console.error('❌ Check failed:', err.message);
    process.exit(1);
  } finally {
    if (server) server.close();
    await mongoose.disconnect();
  }
};

run();
