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

/**
 * Record a Hear-Yourself script training attempt
 * @param {Object} params
 * @param {String} params.patientId - Patient ObjectId
 * @param {String} [params.scriptId] - PersonalScript ObjectId
 * @param {String} [params.attemptRawTranscript] - Raw Scribe STT transcript
 * @param {String} [params.attemptReconstructedText] - Reconstructed aphasic sentence
 * @param {Number} [params.closenessScore] - Closeness score (0-100)
 * @returns {Promise<Object>} Created TherapyProgress document
 */
const recordScriptAttempt = async ({
  patientId,
  scriptId,
  attemptRawTranscript,
  attemptReconstructedText,
  closenessScore
}) => {
  validateObjectId(patientId, 'Patient');

  const scoreVal = typeof closenessScore === 'number'
    ? Math.max(0, Math.min(100, Math.round(closenessScore)))
    : null;

  const therapyProgressData = {
    patientId,
    scriptId: scriptId || null,
    exercisesCompleted: 1,
    accuracyScore: scoreVal !== null ? scoreVal : 0,
    closenessScore: scoreVal,
    attemptRawTranscript: attemptRawTranscript || '',
    attemptReconstructedText: attemptReconstructedText || '',
    notes: 'Hear-Yourself Script Training attempt'
  };

  const record = await TherapyProgress.create(therapyProgressData);
  return record;
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
  deleteTherapyProgress,
  recordScriptAttempt
};

