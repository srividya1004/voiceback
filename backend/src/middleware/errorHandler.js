/**
 * Centralized Express Error Handling Middleware
 */

const { sendError } = require('../utils/responseFormatter');

const errorHandler = (err, req, res, next) => {
  console.error(`[Error Handler] ${err.stack || err.message}`);

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  return sendError(res, statusCode, message, process.env.NODE_ENV === 'development' ? { stack: err.stack } : null);
};

module.exports = errorHandler;
