/**
 * CommunicationHistory Service
 * Contains business logic and database operations for real-time speech recognition event logs
 */

const { CommunicationHistory } = require('../models');
const { validateObjectId } = require('../utils/validationHelper');

/**
 * Create a new CommunicationHistory record
 * @param {Object} historyData - CommunicationHistory input payload
 * @returns {Promise<Object>} Created CommunicationHistory document
 */
const createCommunicationHistory = async (historyData) => {
  const historyRecord = await CommunicationHistory.create(historyData);
  return historyRecord;
};

/**
 * Retrieve all CommunicationHistory records (sorted chronologically)
 * @returns {Promise<Array>} List of CommunicationHistory documents
 */
const getAllCommunicationHistory = async () => {
  const historyRecords = await CommunicationHistory.find()
    .populate('patientId', 'fullName aphasiaType age')
    .sort({ timestamp: -1 });
  return historyRecords;
};

/**
 * Retrieve a single CommunicationHistory record by ObjectId
 * @param {String} id - CommunicationHistory ObjectId
 * @returns {Promise<Object>} CommunicationHistory document
 * @throws {Error} If ID is invalid or history record is not found
 */
const getCommunicationHistoryById = async (id) => {
  validateObjectId(id, 'CommunicationHistory');

  const historyRecord = await CommunicationHistory.findById(id).populate('patientId', 'fullName aphasiaType age');

  if (!historyRecord) {
    throw new Error(`CommunicationHistory with ID ${id} not found`);
  }

  return historyRecord;
};

/**
 * Update a CommunicationHistory record by ObjectId
 * @param {String} id - CommunicationHistory ObjectId
 * @param {Object} updateData - Data fields to update
 * @returns {Promise<Object>} Updated CommunicationHistory document
 * @throws {Error} If ID is invalid or history record is not found
 */
const updateCommunicationHistory = async (id, updateData) => {
  validateObjectId(id, 'CommunicationHistory');

  const historyRecord = await CommunicationHistory.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true
  });

  if (!historyRecord) {
    throw new Error(`CommunicationHistory with ID ${id} not found`);
  }

  return historyRecord;
};

/**
 * Delete a CommunicationHistory record by ObjectId
 * @param {String} id - CommunicationHistory ObjectId
 * @returns {Promise<Object>} Deleted CommunicationHistory document
 * @throws {Error} If ID is invalid or history record is not found
 */
const deleteCommunicationHistory = async (id) => {
  validateObjectId(id, 'CommunicationHistory');

  const historyRecord = await CommunicationHistory.findByIdAndDelete(id);

  if (!historyRecord) {
    throw new Error(`CommunicationHistory with ID ${id} not found`);
  }

  return historyRecord;
};

module.exports = {
  create: createCommunicationHistory,
  getAll: getAllCommunicationHistory,
  getById: getCommunicationHistoryById,
  update: updateCommunicationHistory,
  delete: deleteCommunicationHistory,
  createCommunicationHistory,
  getAllCommunicationHistory,
  getCommunicationHistoryById,
  updateCommunicationHistory,
  deleteCommunicationHistory
};
