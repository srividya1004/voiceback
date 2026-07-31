/**
 * TherapyProgress Service
 * Contains business logic and database operations for clinical therapy session progress logs
 */

const { TherapyProgress } = require('../models');
const { validateObjectId } = require('../utils/validationHelper');

/**
 * Create a new TherapyProgress record
 * @param {Object} therapyProgressData - TherapyProgress input payload
 * @returns {Promise<Object>} Created TherapyProgress document
 */
const createTherapyProgress = async (therapyProgressData) => {
  const therapyProgress = await TherapyProgress.create(therapyProgressData);
  return therapyProgress;
};

/**
 * Retrieve all TherapyProgress records
 * @returns {Promise<Array>} List of TherapyProgress documents
 */
const getAllTherapyProgress = async () => {
  const therapyProgressRecords = await TherapyProgress.find().populate('patientId', 'fullName aphasiaType age');
  return therapyProgressRecords;
};

/**
 * Retrieve a single TherapyProgress record by ObjectId
 * @param {String} id - TherapyProgress ObjectId
 * @returns {Promise<Object>} TherapyProgress document
 * @throws {Error} If ID is invalid or therapy progress is not found
 */
const getTherapyProgressById = async (id) => {
  validateObjectId(id, 'TherapyProgress');

  const therapyProgress = await TherapyProgress.findById(id).populate('patientId', 'fullName aphasiaType age');

  if (!therapyProgress) {
    throw new Error(`TherapyProgress with ID ${id} not found`);
  }

  return therapyProgress;
};

/**
 * Update a TherapyProgress record by ObjectId
 * @param {String} id - TherapyProgress ObjectId
 * @param {Object} updateData - Data fields to update
 * @returns {Promise<Object>} Updated TherapyProgress document
 * @throws {Error} If ID is invalid or therapy progress is not found
 */
const updateTherapyProgress = async (id, updateData) => {
  validateObjectId(id, 'TherapyProgress');

  const therapyProgress = await TherapyProgress.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true
  });

  if (!therapyProgress) {
    throw new Error(`TherapyProgress with ID ${id} not found`);
  }

  return therapyProgress;
};

/**
 * Delete a TherapyProgress record by ObjectId
 * @param {String} id - TherapyProgress ObjectId
 * @returns {Promise<Object>} Deleted TherapyProgress document
 * @throws {Error} If ID is invalid or therapy progress is not found
 */
const deleteTherapyProgress = async (id) => {
  validateObjectId(id, 'TherapyProgress');

  const therapyProgress = await TherapyProgress.findByIdAndDelete(id);

  if (!therapyProgress) {
    throw new Error(`TherapyProgress with ID ${id} not found`);
  }

  return therapyProgress;
};

module.exports = {
  create: createTherapyProgress,
  getAll: getAllTherapyProgress,
  getById: getTherapyProgressById,
  update: updateTherapyProgress,
  delete: deleteTherapyProgress,
  createTherapyProgress,
  getAllTherapyProgress,
  getTherapyProgressById,
  updateTherapyProgress,
  deleteTherapyProgress
};
