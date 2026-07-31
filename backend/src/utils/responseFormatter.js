/**
 * Utility functions for standardized API JSON responses
 */

/**
 * Format a successful JSON response
 * @param {Object} res Express response object
 * @param {Number} statusCode HTTP Status Code
 * @param {String} message Human-readable message
 * @param {Object|Array|null} data Response payload
 */
const sendSuccess = (res, statusCode = 200, message = 'Success', data = null) => {
  return res.status(statusCode).json({
    status: 'success',
    message,
    data,
    timestamp: new Date().toISOString()
  });
};

/**
 * Format an error JSON response
 * @param {Object} res Express response object
 * @param {Number} statusCode HTTP Status Code
 * @param {String} message Error message
 * @param {Object|null} errors Detailed error information
 */
const sendError = (res, statusCode = 500, message = 'Internal Server Error', errors = null) => {
  return res.status(statusCode).json({
    status: 'error',
    message,
    errors,
    timestamp: new Date().toISOString()
  });
};

module.exports = {
  sendSuccess,
  sendError
};
