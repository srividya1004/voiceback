/**
 * VoiceBack JWT Authentication Middleware
 * Validates Bearer token from Authorization header and injects req.user.
 */

const jwt = require('jsonwebtoken');
const { sendError } = require('../utils/responseFormatter');

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers.authorization || req.headers.Authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return sendError(res, 401, 'Authentication required. Missing Bearer token.');
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'voiceback_secret_key');
    req.user = decoded;
    return next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return sendError(res, 401, 'Authentication token has expired.');
    }
    return sendError(res, 401, 'Invalid authentication token.');
  }
};

module.exports = authenticateToken;
