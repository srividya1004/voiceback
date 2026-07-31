/**
 * Caregiver Controller
 * Handles CRUD operations for Caregiver relationship profiles
 */

const mongoose = require('mongoose');
const { Caregiver } = require('../models');
const { sendSuccess, sendError } = require('../utils/responseFormatter');

/**
 * Create a new Caregiver record
 * @route POST /api/caregivers
 */
const createCaregiver = async (req, res) => {
  try {
    const caregiver = await Caregiver.create(req.body);
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
    const caregivers = await Caregiver.find()
      .populate('userId', 'email role')
      .populate('assignedPatients', 'fullName aphasiaType age');
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

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return sendError(res, 400, 'Invalid Caregiver ObjectId format');
    }

    const caregiver = await Caregiver.findById(id)
      .populate('userId', 'email role')
      .populate('assignedPatients', 'fullName aphasiaType age');

    if (!caregiver) {
      return sendError(res, 404, `Caregiver with ID ${id} not found`);
    }

    return sendSuccess(res, 200, 'Caregiver profile retrieved successfully', caregiver);
  } catch (error) {
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

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return sendError(res, 400, 'Invalid Caregiver ObjectId format');
    }

    const caregiver = await Caregiver.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true
    });

    if (!caregiver) {
      return sendError(res, 404, `Caregiver with ID ${id} not found`);
    }

    return sendSuccess(res, 200, 'Caregiver profile updated successfully', caregiver);
  } catch (error) {
    if (error.name === 'ValidationError') {
      return sendError(res, 400, 'Validation Error', error.errors);
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

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return sendError(res, 400, 'Invalid Caregiver ObjectId format');
    }

    const caregiver = await Caregiver.findByIdAndDelete(id);

    if (!caregiver) {
      return sendError(res, 404, `Caregiver with ID ${id} not found`);
    }

    return sendSuccess(res, 200, 'Caregiver profile deleted successfully', caregiver);
  } catch (error) {
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
