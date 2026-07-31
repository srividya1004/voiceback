/**
 * TherapyProgress Controller
 * Handles CRUD operations for therapy session progress tracking
 */

const mongoose = require('mongoose');
const { TherapyProgress } = require('../models');
const { sendSuccess, sendError } = require('../utils/responseFormatter');

/**
 * Create a new TherapyProgress record
 * @route POST /api/therapy-progress
 */
const createTherapyProgress = async (req, res) => {
  try {
    const therapyProgress = await TherapyProgress.create(req.body);
    return sendSuccess(res, 201, 'Therapy progress record created successfully', therapyProgress);
  } catch (error) {
    if (error.name === 'ValidationError') {
      return sendError(res, 400, 'Validation Error', error.errors);
    }
    return sendError(res, 500, 'Failed to create therapy progress record', error.message);
  }
};

/**
 * Retrieve all TherapyProgress records
 * @route GET /api/therapy-progress
 */
const getAllTherapyProgress = async (req, res) => {
  try {
    const therapyProgressRecords = await TherapyProgress.find().populate('patientId', 'fullName aphasiaType age');
    return sendSuccess(res, 200, 'Therapy progress records retrieved successfully', therapyProgressRecords);
  } catch (error) {
    return sendError(res, 500, 'Failed to retrieve therapy progress records', error.message);
  }
};

/**
 * Retrieve a single TherapyProgress record by ObjectId
 * @route GET /api/therapy-progress/:id
 */
const getTherapyProgressById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return sendError(res, 400, 'Invalid TherapyProgress ObjectId format');
    }

    const therapyProgress = await TherapyProgress.findById(id).populate('patientId', 'fullName aphasiaType age');

    if (!therapyProgress) {
      return sendError(res, 404, `TherapyProgress with ID ${id} not found`);
    }

    return sendSuccess(res, 200, 'Therapy progress record retrieved successfully', therapyProgress);
  } catch (error) {
    return sendError(res, 500, 'Failed to retrieve therapy progress record', error.message);
  }
};

/**
 * Update a TherapyProgress record by ObjectId
 * @route PUT /api/therapy-progress/:id
 */
const updateTherapyProgress = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return sendError(res, 400, 'Invalid TherapyProgress ObjectId format');
    }

    const therapyProgress = await TherapyProgress.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true
    });

    if (!therapyProgress) {
      return sendError(res, 404, `TherapyProgress with ID ${id} not found`);
    }

    return sendSuccess(res, 200, 'Therapy progress record updated successfully', therapyProgress);
  } catch (error) {
    if (error.name === 'ValidationError') {
      return sendError(res, 400, 'Validation Error', error.errors);
    }
    return sendError(res, 500, 'Failed to update therapy progress record', error.message);
  }
};

/**
 * Delete a TherapyProgress record by ObjectId
 * @route DELETE /api/therapy-progress/:id
 */
const deleteTherapyProgress = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return sendError(res, 400, 'Invalid TherapyProgress ObjectId format');
    }

    const therapyProgress = await TherapyProgress.findByIdAndDelete(id);

    if (!therapyProgress) {
      return sendError(res, 404, `TherapyProgress with ID ${id} not found`);
    }

    return sendSuccess(res, 200, 'Therapy progress record deleted successfully', therapyProgress);
  } catch (error) {
    return sendError(res, 500, 'Failed to delete therapy progress record', error.message);
  }
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
