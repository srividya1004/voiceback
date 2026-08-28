/**
 * Health Check Controller
 */

const { sendSuccess, sendError } = require('../utils/responseFormatter');
const mongoose = require('mongoose');
const config = require('../config');

/**
 * Handle GET /health request
 * Returns server operational status, uptime, database connection readiness, and safe metadata
 */
const getHealthStatus = (req, res) => {
  const readyStateMap = {
    0: 'Disconnected',
    1: 'Connected',
    2: 'Connecting',
    3: 'Disconnecting'
  };

  const readyState = mongoose.connection.readyState;
  const dbStatus = readyStateMap[readyState] || 'Unknown';
  const isDbHealthy = readyState === 1;

  // Extract safe host without credentials
  let safeHost = 'N/A';
  if (mongoose.connection && mongoose.connection.host) {
    safeHost = mongoose.connection.host;
  }

  const healthData = {
    service: 'VoiceBack Backend API',
    status: isDbHealthy ? 'healthy' : 'degraded',
    uptimeSeconds: Math.floor(process.uptime()),
    environment: config.env || process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
    database: {
      status: dbStatus,
      readyState: readyState,
      host: safeHost
    }
  };

  if (!isDbHealthy) {
    return sendError(res, 503, 'Database service is disconnected or unavailable', healthData);
  }

  return sendSuccess(res, 200, 'VoiceBack backend service is operational', healthData);
};

module.exports = {
  getHealthStatus
};
