/**
 * Validation Helper Utilities
 */

const mongoose = require('mongoose');

/**
 * Validate whether a string is a valid MongoDB ObjectId
 * @param {String} id - Candidate ID string
 * @param {String} entityName - Entity label for descriptive error messaging
 * @throws {Error} Throws Error if ObjectId format is invalid
 */
const validateObjectId = (id, entityName = 'Resource') => {
  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    throw new Error(`Invalid ${entityName} ObjectId format: ${id}`);
  }
};

module.exports = {
  validateObjectId
};
