/**
 * EMGProfile Controller
 * Handles CRUD operations for calibrated sEMG threshold profiles
 */

const mongoose = require('mongoose');
const { EMGProfile } = require('../models');
const { sendSuccess, sendError } = require('../utils/responseFormatter');

/**
 * Create a new EMGProfile record
 * @route POST /api/emg-profiles
 */
const createEMGProfile = async (req, res) => {
  try {
    const emgProfile = await EMGProfile.create(req.body);
    return sendSuccess(res, 201, 'EMG profile created successfully', emgProfile);
  } catch (error) {
    if (error.name === 'ValidationError') {
      return sendError(res, 400, 'Validation Error', error.errors);
    }
    return sendError(res, 500, 'Failed to create EMG profile', error.message);
  }
};

/**
 * Retrieve all EMGProfile records
 * @route GET /api/emg-profiles
 */
const getAllEMGProfiles = async (req, res) => {
  try {
    const emgProfiles = await EMGProfile.find().populate('patientId', 'fullName aphasiaType age');
    return sendSuccess(res, 200, 'EMG profiles retrieved successfully', emgProfiles);
  } catch (error) {
    return sendError(res, 500, 'Failed to retrieve EMG profiles', error.message);
  }
};

/**
 * Retrieve a single EMGProfile by ObjectId
 * @route GET /api/emg-profiles/:id
 */
const getEMGProfileById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return sendError(res, 400, 'Invalid EMGProfile ObjectId format');
    }

    const emgProfile = await EMGProfile.findById(id).populate('patientId', 'fullName aphasiaType age');

    if (!emgProfile) {
      return sendError(res, 404, `EMGProfile with ID ${id} not found`);
    }

    return sendSuccess(res, 200, 'EMG profile retrieved successfully', emgProfile);
  } catch (error) {
    return sendError(res, 500, 'Failed to retrieve EMG profile', error.message);
  }
};

/**
 * Update an EMGProfile record by ObjectId
 * @route PUT /api/emg-profiles/:id
 */
const updateEMGProfile = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return sendError(res, 400, 'Invalid EMGProfile ObjectId format');
    }

    const emgProfile = await EMGProfile.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true
    });

    if (!emgProfile) {
      return sendError(res, 404, `EMGProfile with ID ${id} not found`);
    }

    return sendSuccess(res, 200, 'EMG profile updated successfully', emgProfile);
  } catch (error) {
    if (error.name === 'ValidationError') {
      return sendError(res, 400, 'Validation Error', error.errors);
    }
    return sendError(res, 500, 'Failed to update EMG profile', error.message);
  }
};

/**
 * Delete an EMGProfile record by ObjectId
 * @route DELETE /api/emg-profiles/:id
 */
const deleteEMGProfile = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return sendError(res, 400, 'Invalid EMGProfile ObjectId format');
    }

    const emgProfile = await EMGProfile.findByIdAndDelete(id);

    if (!emgProfile) {
      return sendError(res, 404, `EMGProfile with ID ${id} not found`);
    }

    return sendSuccess(res, 200, 'EMG profile deleted successfully', emgProfile);
  } catch (error) {
    return sendError(res, 500, 'Failed to delete EMG profile', error.message);
  }
};

module.exports = {
  create: createEMGProfile,
  getAll: getAllEMGProfiles,
  getById: getEMGProfileById,
  update: updateEMGProfile,
  delete: deleteEMGProfile,
  createEMGProfile,
  getAllEMGProfiles,
  getEMGProfileById,
  updateEMGProfile,
  deleteEMGProfile
};
