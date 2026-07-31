/**
 * VoiceBack Backend Configuration Module
 * Loads environment variables using dotenv
 */

const dotenv = require('dotenv');

// Load environment variables from .env file
dotenv.config();

const config = {
  port: process.env.PORT || 5000,
  env: process.env.NODE_ENV || 'development',
  clientOrigin: process.env.CLIENT_ORIGIN || '*',
  mongoUri: process.env.MONGODB_URI
};

module.exports = config;
