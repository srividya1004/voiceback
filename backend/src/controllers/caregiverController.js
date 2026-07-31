/**
 * Caregiver Controller
 * Handles HTTP request/response orchestration for Caregiver relationship profiles using Caregiver Service.
 */

const caregiverService = require('../services/caregiverService');
const { sendSuccess, sendError } = require('../utils/responseFormatter');

/**
 * Create a new Caregiver record
 * @route POST /api/caregivers
 */
const createCaregiver = async (req, res) => {
  try {
    const caregiver = await caregiverService.create(req.body);
    return sendSuccess(res, 201, 'Caregiver profile created successfully', caregiver);
  } catch (error) {
    if (error.name === 'ValidationError') {
      return sendError(res, 400, 'Validation Error', error.errors);
    }
    return sendError(res, 500, 'Failed to create caregiver profile', error.message);
  }
};

/**
 * Retrieve all Caregiver records
 * @route GET /api/caregivers
 */
const getAllCaregivers = async (req, res) => {
  try {
    const caregivers = await caregiverService.getAll();
    return sendSuccess(res, 200, 'Caregivers retrieved successfully', caregivers);
  } catch (error) {
    return sendError(res, 500, 'Failed to retrieve caregivers', error.message);
  }
};

/**
 * Retrieve a single Caregiver by ObjectId
 * @route GET /api/caregivers/:id
 */
const getCaregiverById = async (req, res) => {
  try {
    const { id } = req.params;
    const caregiver = await caregiverService.getById(id);
    return sendSuccess(res, 200, 'Caregiver profile retrieved successfully', caregiver);
  } catch (error) {
    if (error.message.includes('Invalid')) {
      return sendError(res, 400, error.message);
    }
    if (error.message.includes('not found')) {
      return sendError(res, 404, error.message);
    }
    return sendError(res, 500, 'Failed to retrieve caregiver profile', error.message);
  }
};

/**
 * Update a Caregiver record by ObjectId
 * @route PUT /api/caregivers/:id
 */
const updateCaregiver = async (req, res) => {
  try {
    const { id } = req.params;
    const caregiver = await caregiverService.update(id, req.body);
    return sendSuccess(res, 200, 'Caregiver profile updated successfully', caregiver);
  } catch (error) {
    if (error.name === 'ValidationError' || error.message.includes('Invalid')) {
      return sendError(res, 400, error.message, error.errors);
    }
    if (error.message.includes('not found')) {
      return sendError(res, 404, error.message);
    }
    return sendError(res, 500, 'Failed to update caregiver profile', error.message);
  }
};

/**
 * Delete a Caregiver record by ObjectId
 * @route DELETE /api/caregivers/:id
 */
const deleteCaregiver = async (req, res) => {
  try {
    const { id } = req.params;
    const caregiver = await caregiverService.delete(id);
    return sendSuccess(res, 200, 'Caregiver profile deleted successfully', caregiver);
  } catch (error) {
    if (error.message.includes('Invalid')) {
      return sendError(res, 400, error.message);
    }
    if (error.message.includes('not found')) {
      return sendError(res, 404, error.message);
    }
    return sendError(res, 500, 'Failed to delete caregiver profile', error.message);
  }
};

module.exports = {
  create: createCaregiver,
  getAll: getAllCaregivers,
  getById: getCaregiverById,
  update: updateCaregiver,
  delete: deleteCaregiver,
  createCaregiver,
  getAllCaregivers,
  getCaregiverById,
  updateCaregiver,
  deleteCaregiver
};
