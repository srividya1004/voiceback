/**
 * VoiceBack Backend Configuration Module
 * Loads environment variables using dotenv
 */

const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from .env file in backend/ or root
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config();

const config = {
  port: process.env.PORT || 5000,
  env: process.env.NODE_ENV || 'development',
  clientOrigin: process.env.CLIENT_ORIGIN || '*',
  mongoUri: process.env.MONGODB_URI,
  elevenLabsApiKey: process.env.ELEVENLABS_API_KEY || '',
  elevenLabsTtsModel: process.env.ELEVENLABS_TTS_MODEL || 'eleven_v3'
};

module.exports = config;
