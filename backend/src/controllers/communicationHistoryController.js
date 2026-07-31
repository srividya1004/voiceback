/**
 * CommunicationHistory Controller
 * Handles HTTP request/response orchestration for speech recognition event logs using CommunicationHistory Service.
 */

const communicationHistoryService = require('../services/communicationHistoryService');
const { sendSuccess, sendError } = require('../utils/responseFormatter');

/**
 * Create a new CommunicationHistory record
 * @route POST /api/communication-history
 */
const createCommunicationHistory = async (req, res) => {
  try {
    const historyRecord = await communicationHistoryService.create(req.body);
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
    const historyRecords = await communicationHistoryService.getAll();
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
    const historyRecord = await communicationHistoryService.getById(id);
    return sendSuccess(res, 200, 'Communication history record retrieved successfully', historyRecord);
  } catch (error) {
    if (error.message.includes('Invalid')) {
      return sendError(res, 400, error.message);
    }
    if (error.message.includes('not found')) {
      return sendError(res, 404, error.message);
    }
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
    const historyRecord = await communicationHistoryService.update(id, req.body);
    return sendSuccess(res, 200, 'Communication history record updated successfully', historyRecord);
  } catch (error) {
    if (error.name === 'ValidationError' || error.message.includes('Invalid')) {
      return sendError(res, 400, error.message, error.errors);
    }
    if (error.message.includes('not found')) {
      return sendError(res, 404, error.message);
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
    const historyRecord = await communicationHistoryService.delete(id);
    return sendSuccess(res, 200, 'Communication history record deleted successfully', historyRecord);
  } catch (error) {
    if (error.message.includes('Invalid')) {
      return sendError(res, 400, error.message);
    }
    if (error.message.includes('not found')) {
      return sendError(res, 404, error.message);
    }
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
