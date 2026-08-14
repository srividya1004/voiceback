/**
 * EMGProfile Controller
 * Handles HTTP request/response orchestration for calibrated sEMG threshold profiles and AI gesture inference.
 */

const emgProfileService = require('../services/emgProfileService');
const { sendSuccess, sendError } = require('../utils/responseFormatter');

/**
 * Create a new EMGProfile record
 * @route POST /api/emg-profiles
 */
const createEMGProfile = async (req, res) => {
  try {
    const emgProfile = await emgProfileService.create(req.body);
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
    const emgProfiles = await emgProfileService.getAll();
    return sendSuccess(res, 200, 'EMG profiles retrieved successfully', emgProfiles);
  } catch (error) {
    return sendError(res, 500, 'Failed to retrieve EMG profiles', error.message);
  }
};

/**
 * Perform sEMG AI gesture inference
 * @route POST /api/emg-profiles/predict
 */
const predictEMGIntent = async (req, res) => {
  try {
    const { patientId, rawAnalogSignal, rmsAmplitude, mode } = req.body;
    const result = await emgProfileService.predictEMGIntent(patientId, rawAnalogSignal, rmsAmplitude, mode);
    return sendSuccess(res, 200, 'sEMG AI intent inferred successfully', result);
  } catch (error) {
    return sendError(res, 500, 'Failed to infer sEMG intent', error.message);
  }
};

/**
 * Retrieve a single EMGProfile by ObjectId
 * @route GET /api/emg-profiles/:id
 */
const getEMGProfileById = async (req, res) => {
  try {
    const { id } = req.params;
    const emgProfile = await emgProfileService.getById(id);
    return sendSuccess(res, 200, 'EMG profile retrieved successfully', emgProfile);
  } catch (error) {
    if (error.message.includes('Invalid')) {
      return sendError(res, 400, error.message);
    }
    if (error.message.includes('not found')) {
      return sendError(res, 404, error.message);
    }
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
    const emgProfile = await emgProfileService.update(id, req.body);
    return sendSuccess(res, 200, 'EMG profile updated successfully', emgProfile);
  } catch (error) {
    if (error.name === 'ValidationError' || error.message.includes('Invalid')) {
      return sendError(res, 400, error.message, error.errors);
    }
    if (error.message.includes('not found')) {
      return sendError(res, 404, error.message);
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
    const emgProfile = await emgProfileService.delete(id);
    return sendSuccess(res, 200, 'EMG profile deleted successfully', emgProfile);
  } catch (error) {
    if (error.message.includes('Invalid')) {
      return sendError(res, 400, error.message);
    }
    if (error.message.includes('not found')) {
      return sendError(res, 404, error.message);
    }
    return sendError(res, 500, 'Failed to delete EMG profile', error.message);
  }
};

module.exports = {
  create: createEMGProfile,
  getAll: getAllEMGProfiles,
  getById: getEMGProfileById,
  predictEMGIntent,
  update: updateEMGProfile,
  delete: deleteEMGProfile,
  createEMGProfile,
  getAllEMGProfiles,
  getEMGProfileById,
  updateEMGProfile,
  deleteEMGProfile
};
