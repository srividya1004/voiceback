/**
 * CommunicationHistory Controller
 * Handles CRUD operations for real-time speech recognition event logs
 */

const mongoose = require('mongoose');
const { CommunicationHistory } = require('../models');
const { sendSuccess, sendError } = require('../utils/responseFormatter');

/**
 * Create a new CommunicationHistory record
 * @route POST /api/communication-history
 */
const createCommunicationHistory = async (req, res) => {
  try {
    const historyRecord = await CommunicationHistory.create(req.body);
    return sendSuccess(res, 201, 'Communication history log created successfully', historyRecord);
  } catch (error) {
    if (error.name === 'ValidationError') {
      return sendError(res, 400, 'Validation Error', error.errors);
    }
    return sendError(res, 500, 'Failed to create communication history log', error.message);
  }
};

/**
 * Retrieve all CommunicationHistory records
 * @route GET /api/communication-history
 */
const getAllCommunicationHistory = async (req, res) => {
  try {
    const historyRecords = await CommunicationHistory.find()
      .populate('patientId', 'fullName aphasiaType age')
      .sort({ timestamp: -1 });
    return sendSuccess(res, 200, 'Communication history logs retrieved successfully', historyRecords);
  } catch (error) {
    return sendError(res, 500, 'Failed to retrieve communication history logs', error.message);
  }
};

/**
 * Retrieve a single CommunicationHistory record by ObjectId
 * @route GET /api/communication-history/:id
 */
const getCommunicationHistoryById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return sendError(res, 400, 'Invalid CommunicationHistory ObjectId format');
    }

    const historyRecord = await CommunicationHistory.findById(id).populate('patientId', 'fullName aphasiaType age');

    if (!historyRecord) {
      return sendError(res, 404, `Communication history record with ID ${id} not found`);
    }

    return sendSuccess(res, 200, 'Communication history record retrieved successfully', historyRecord);
  } catch (error) {
    return sendError(res, 500, 'Failed to retrieve communication history record', error.message);
  }
};

/**
 * Update a CommunicationHistory record by ObjectId
 * @route PUT /api/communication-history/:id
 */
const updateCommunicationHistory = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return sendError(res, 400, 'Invalid CommunicationHistory ObjectId format');
    }

    const historyRecord = await CommunicationHistory.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true
    });

    if (!historyRecord) {
      return sendError(res, 404, `Communication history record with ID ${id} not found`);
    }

    return sendSuccess(res, 200, 'Communication history record updated successfully', historyRecord);
  } catch (error) {
    if (error.name === 'ValidationError') {
      return sendError(res, 400, 'Validation Error', error.errors);
    }
    return sendError(res, 500, 'Failed to update communication history record', error.message);
  }
};

/**
 * Delete a CommunicationHistory record by ObjectId
 * @route DELETE /api/communication-history/:id
 */
const deleteCommunicationHistory = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return sendError(res, 400, 'Invalid CommunicationHistory ObjectId format');
    }

    const historyRecord = await CommunicationHistory.findByIdAndDelete(id);

    if (!historyRecord) {
      return sendError(res, 404, `Communication history record with ID ${id} not found`);
    }

    return sendSuccess(res, 200, 'Communication history record deleted successfully', historyRecord);
  } catch (error) {
    return sendError(res, 500, 'Failed to delete communication history record', error.message);
  }
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
