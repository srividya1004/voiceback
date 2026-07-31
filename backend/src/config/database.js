/**
 * VoiceBack MongoDB Database Connection Manager
 */

const mongoose = require('mongoose');
const dns = require('dns');
const config = require('./index');

// Set DNS order to ipv4first and set public DNS servers to resolve MongoDB Atlas SRV records properly on Windows
try {
  dns.setDefaultResultOrder('ipv4first');
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (err) {
  // Ignore DNS configuration errors if setServers is not supported in environment
}

/**
 * Connect to MongoDB Atlas using Mongoose
 * @returns {Promise<typeof mongoose>}
 */
const connectDB = async () => {
  const mongoUri = config.mongoUri || process.env.MONGODB_URI;

  if (!mongoUri) {
    console.error('❌ MongoDB Connection Error: MONGODB_URI is not defined in environment variables.');
    process.exit(1);
  }

  try {
    const conn = await mongoose.connect(mongoUri);
    console.log('✅ MongoDB Connected');
    return conn;
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
