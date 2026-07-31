/**
 * Health Check Controller
 */

const { sendSuccess } = require('../utils/responseFormatter');
const config = require('../config');

/**
 * Handle GET /health request
 * Returns server operational status, uptime, and system metadata
 */
const getHealthStatus = (req, res) => {
  const healthData = {
    service: 'VoiceBack Backend API',
    status: 'healthy',
    uptimeSeconds: Math.floor(process.uptime()),
    environment: config.env,
    timestamp: new Date().toISOString()
  };

  return sendSuccess(res, 200, 'VoiceBack backend service is operational', healthData);
};

module.exports = {
  getHealthStatus
};
