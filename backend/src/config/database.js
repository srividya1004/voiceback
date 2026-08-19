/**
 * VoiceBack MongoDB Database Connection Manager
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
  // Fallback ignored if custom DNS fail
}

/**
 * Safe connection diagnostics logger (never prints credentials or secrets)
 */
const logDiagnostics = (mongoUri) => {
  const isUriConfigured = Boolean(mongoUri);
  let isHostnameConfigured = false;

  if (mongoUri) {
    try {
      const match = mongoUri.match(/@([^/?]+)/);
      isHostnameConfigured = Boolean(match && match[1]);
    } catch (e) {
      isHostnameConfigured = false;
    }
  }

  console.log('--- MongoDB Connection Diagnostics ---');
  console.log(`  - URI Configured:      ${isUriConfigured ? 'YES' : 'NO'}`);
  console.log(`  - Hostname Configured: ${isHostnameConfigured ? 'YES' : 'NO'}`);
};

/**
 * Connect to MongoDB Atlas using Mongoose
 * @returns {Promise<typeof mongoose>}
 */
const connectDB = async () => {
  const mongoUri = config.mongoUri || process.env.MONGODB_URI;

  logDiagnostics(mongoUri);

  if (!mongoUri) {
    console.error('❌ MongoDB Connection Error: MONGODB_URI is not defined in environment variables.');
    process.exit(1);
  }

  console.log('⏳ MongoDB Connection Attempt Started...');

  try {
    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000
    });
    console.log('✅ MongoDB Atlas Connected Successfully');
    return conn;
  } catch (error) {
    console.error('❌ MongoDB Connection Failed:', error.message);
    throw error;
  }
};

module.exports = connectDB;
