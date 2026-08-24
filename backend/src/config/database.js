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
  const currentServers = dns.getServers();
  if (currentServers.length === 0 || currentServers.includes('127.0.0.1')) {
    dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);
  }
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
 * Connect to MongoDB Atlas using Mongoose
 * @returns {Promise<typeof mongoose>}
 */
const connectDB = async () => {
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
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10
    });

    console.log('✅ MongoDB Atlas Connected Successfully');
    return conn;
  } catch (error) {
    console.error('❌ MongoDB Connection Failed:', error.message);
    throw error;
  }
};

module.exports = connectDB;
