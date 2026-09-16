/**
 * VoiceBack MongoDB Database Connection Manager
 * 
 * Production Network Architecture:
 * User Device / Any Network -> HTTPS -> VoiceBack Cloud Backend -> MongoDB Atlas
 * The database client is the backend server, making client locations (Home, College, Hotspot) location-independent.
 */

const mongoose = require('mongoose');
const dns = require('dns');
const config = require('./index');

// Ensure reliable DNS resolution for MongoDB Atlas SRV records
try {
  dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);
} catch (e) {
  // DNS fallback ignored if custom DNS setting fails
}

/**
 * Validate MongoDB Connection URI
 * @param {string} uri 
 * @returns {boolean}
 */
const validateMongoUri = (uri) => {
  if (!uri || typeof uri !== 'string') return false;
  const trimmed = uri.trim();
  return trimmed.startsWith('mongodb://') || trimmed.startsWith('mongodb+srv://');
};

/**
 * Safe connection diagnostics logger (never prints credentials or secrets)
 * @param {string} mongoUri 
 */
const logDiagnostics = (mongoUri) => {
  const isValid = validateMongoUri(mongoUri);
  let safeHost = 'Unconfigured';

  if (isValid) {
    try {
      const match = mongoUri.match(/@([^/?]+)/);
      if (match && match[1]) {
        safeHost = match[1];
      } else {
        safeHost = 'Host Masked';
      }
    } catch (e) {
      safeHost = 'Parse Error';
    }
  }

  console.log('--- MongoDB Connection Diagnostics ---');
  console.log(`  - URI Configured:      ${mongoUri ? 'YES' : 'NO'}`);
  console.log(`  - URI Format Valid:    ${isValid ? 'YES' : 'NO'}`);
  console.log(`  - Target Host:         ${safeHost}`);
};

/**
 * Register Mongoose connection lifecycle listeners
 */
const registerConnectionEvents = () => {
  if (mongoose.connection.listeners('error').length === 0) {
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB Connection Error:', err.message);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️ MongoDB Disconnected. Connection pool will attempt reconnection...');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('✅ MongoDB Reconnected successfully.');
    });
  }
};

/**
 * Extract database name from MongoDB connection string
 * @param {string} uri 
 * @returns {string}
 */
const extractDatabaseName = (uri) => {
  if (!uri || typeof uri !== 'string') return '';
  try {
    const match = uri.match(/[/:]([a-zA-Z0-9_-]+)(\?.*)?$/);
    return match ? match[1] : '';
  } catch (e) {
    return '';
  }
};

/**
 * Hard Safety Guard: Asserts that target connection is strictly an isolated TEST database.
 * Throws immediate fatal error if URI points to production or lacks test identifier.
 * @param {string} uri 
 * @param {string} [dbName]
 */
const assertTestDatabase = (uri, dbName) => {
  if (!uri || typeof uri !== 'string' || !uri.trim()) {
    throw new Error('FATAL SAFETY ERROR: Test database URI is missing. Automated tests are strictly prohibited from running without a dedicated test database.');
  }

  const resolvedDb = (dbName || extractDatabaseName(uri) || '').toLowerCase();
  const prodDb = (extractDatabaseName(process.env.MONGODB_URI || config.mongoUri || '') || 'voiceback').toLowerCase();

  // 1. Target database must not match production database name
  if (resolvedDb === prodDb || resolvedDb === 'voiceback') {
    throw new Error(`FATAL SAFETY ERROR: Test connection attempted to connect to PRODUCTION database "${resolvedDb}". Tests are strictly barred from writing to production.`);
  }

  // 2. Target database must explicitly contain test identifier
  if (!resolvedDb.includes('test')) {
    throw new Error(`FATAL SAFETY ERROR: Test database name "${resolvedDb}" does not contain the required "test" identifier (e.g., "voiceback_test"). Aborting test execution.`);
  }

  // 3. Reject if URI is identical to MONGODB_URI
  const prodUri = (process.env.MONGODB_URI || config.mongoUri || '').trim();
  if (prodUri && uri.trim() === prodUri) {
    throw new Error('FATAL SAFETY ERROR: TEST_MONGODB_URI is identical to production MONGODB_URI. Database isolation violation.');
  }

  return true;
};

/**
 * Connect to dedicated ISOLATED MongoDB Test Database using Mongoose.
 * Automated tests MUST use this method instead of connectDB().
 * Fails safely if TEST_MONGODB_URI is missing or points to production.
 * @returns {Promise<typeof mongoose>}
 */
const connectTestDB = async () => {
  process.env.NODE_ENV = 'test';

  const testUri = process.env.TEST_MONGODB_URI || config.testMongoUri;
  if (!testUri || !testUri.trim()) {
    throw new Error('FATAL SAFETY ERROR: TEST_MONGODB_URI is not set or empty. Automated tests must fail safely and NEVER fall back to production MONGODB_URI.');
  }

  assertTestDatabase(testUri);

  console.log('🛡️  Safety Guard Passed: Target is verified isolated test database.');
  logDiagnostics(testUri);

  registerConnectionEvents();

  console.log('⏳ Connecting to ISOLATED Test Database...');
  const conn = await mongoose.connect(testUri, {
    serverSelectionTimeoutMS: 15000,
    connectTimeoutMS: 15000,
    socketTimeoutMS: 45000,
    maxPoolSize: 5,
    family: 4
  });

  const activeDb = mongoose.connection.db.databaseName;
  if (activeDb === 'voiceback' || !activeDb.includes('test')) {
    await mongoose.disconnect();
    throw new Error(`FATAL SAFETY ERROR: Connected database is "${activeDb}", which violates test isolation. Connection terminated.`);
  }

  console.log(`✅ Connected to ISOLATED Test Database: "${activeDb}"`);
  return conn;
};

/**
 * Connect to MongoDB Atlas for live application/server.
 * Includes safety guard: Refuses to connect if NODE_ENV is 'test'.
 * @returns {Promise<typeof mongoose>}
 */
const connectDB = async () => {
  if (process.env.NODE_ENV === 'test') {
    throw new Error('FATAL SAFETY ERROR: connectDB() called while NODE_ENV is "test". Tests MUST call connectTestDB() to guarantee database isolation.');
  }

  const mongoUri = process.env.MONGODB_URI || config.mongoUri;

  logDiagnostics(mongoUri);

  if (!validateMongoUri(mongoUri)) {
    const errorMsg = 'MongoDB Connection Error: Invalid or missing MONGODB_URI. URI must start with mongodb:// or mongodb+srv://';
    console.error(`❌ ${errorMsg}`);
    throw new Error(errorMsg);
  }

  registerConnectionEvents();

  console.log('⏳ MongoDB Connection Attempt Started...');

  try {
    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 15000,
      connectTimeoutMS: 15000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
      family: 4
    });

    console.log('✅ MongoDB Atlas Connected Successfully');
    return conn;
  } catch (error) {
    console.error('❌ MongoDB Connection Failed:', error.message);
    throw error;
  }
};

module.exports = connectDB;
module.exports.connectDB = connectDB;
module.exports.connectTestDB = connectTestDB;
module.exports.assertTestDatabase = assertTestDatabase;
module.exports.extractDatabaseName = extractDatabaseName;

