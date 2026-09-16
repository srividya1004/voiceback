/**
 * PersonalScript Service
 * Business logic and database operations for patient-scoped personal scripts
 */

const PersonalScript = require('../models/PersonalScript');
const { validateObjectId } = require('../utils/validationHelper');

/**
 * Create a new PersonalScript document
 * @param {Object} params
 * @param {String} params.patientId - Target patient ObjectId
 * @param {String} params.text - Personal script text
 * @param {String} [params.category] - Script category (family, daily_routine, identity, general)
 * @param {Object} params.createdBy - Creator info { role, userId }
 * @returns {Promise<Object>} Created PersonalScript
 */
const createScript = async ({ patientId, text, category = 'general', createdBy }) => {
  validateObjectId(patientId, 'Patient');

  if (!text || typeof text !== 'string' || !text.trim()) {
    throw new Error('Script text is required and cannot be empty.');
  }

  if (!createdBy || !createdBy.role || !createdBy.userId) {
    throw new Error('Creator identity is required.');
  }

  const script = await PersonalScript.create({
    patientId,
    text: text.trim(),
    category: category || 'general',
    createdBy: {
      role: createdBy.role,
      userId: createdBy.userId
    },
    isActive: true
  });

  return script;
};

/**
 * Retrieve active personal scripts for a patient
 * @param {String} patientId - Patient ObjectId
 * @returns {Promise<Array>} List of active PersonalScript documents
 */
const getScriptsByPatientId = async (patientId) => {
  validateObjectId(patientId, 'Patient');

  const scripts = await PersonalScript.find({
    patientId,
    isActive: true
  }).sort({ createdAt: -1 });

  return scripts;
};

/**
 * Retrieve a single personal script by ID
 * @param {String} scriptId - PersonalScript ObjectId
 * @returns {Promise<Object>} PersonalScript document
 */
const getScriptById = async (scriptId) => {
  validateObjectId(scriptId, 'PersonalScript');

  const script = await PersonalScript.findById(scriptId);
  if (!script) {
    throw new Error(`PersonalScript with ID ${scriptId} not found`);
  }

  return script;
};

/**
 * Deactivate a personal script (soft delete only)
 * @param {String} scriptId - PersonalScript ObjectId
 * @returns {Promise<Object>} Updated PersonalScript document
 */
const deactivateScript = async (scriptId) => {
  validateObjectId(scriptId, 'PersonalScript');

  const script = await PersonalScript.findByIdAndUpdate(
    scriptId,
    { isActive: false },
    { new: true }
  );

  if (!script) {
    throw new Error(`PersonalScript with ID ${scriptId} not found`);
  }

  return script;
};

module.exports = {
  createScript,
  getScriptsByPatientId,
  getScriptById,
  deactivateScript
};
