/**
 * VoiceProfile Controller
 * Handles CRUD operations for Patient TTS audio synthesis profiles
 */

const mongoose = require('mongoose');
const { VoiceProfile } = require('../models');
const { sendSuccess, sendError } = require('../utils/responseFormatter');

/**
 * Create a new VoiceProfile record
 * @route POST /api/voice-profiles
 */
const createVoiceProfile = async (req, res) => {
  try {
    const voiceProfile = await VoiceProfile.create(req.body);
    return sendSuccess(res, 201, 'Voice profile created successfully', voiceProfile);
  } catch (error) {
    if (error.name === 'ValidationError') {
      return sendError(res, 400, 'Validation Error', error.errors);
    }
    return sendError(res, 500, 'Failed to create voice profile', error.message);
  }
};

/**
 * Retrieve all VoiceProfile records
 * @route GET /api/voice-profiles
 */
const getAllVoiceProfiles = async (req, res) => {
  try {
    const voiceProfiles = await VoiceProfile.find().populate('patientId', 'fullName aphasiaType age');
    return sendSuccess(res, 200, 'Voice profiles retrieved successfully', voiceProfiles);
  } catch (error) {
    return sendError(res, 500, 'Failed to retrieve voice profiles', error.message);
  }
};

/**
 * Retrieve a single VoiceProfile by ObjectId
 * @route GET /api/voice-profiles/:id
 */
const getVoiceProfileById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return sendError(res, 400, 'Invalid VoiceProfile ObjectId format');
    }

    const voiceProfile = await VoiceProfile.findById(id).populate('patientId', 'fullName aphasiaType age');

    if (!voiceProfile) {
      return sendError(res, 404, `VoiceProfile with ID ${id} not found`);
    }

    return sendSuccess(res, 200, 'Voice profile retrieved successfully', voiceProfile);
  } catch (error) {
    return sendError(res, 500, 'Failed to retrieve voice profile', error.message);
  }
};

/**
 * Update a VoiceProfile record by ObjectId
 * @route PUT /api/voice-profiles/:id
 */
const updateVoiceProfile = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return sendError(res, 400, 'Invalid VoiceProfile ObjectId format');
    }

    const voiceProfile = await VoiceProfile.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true
    });

    if (!voiceProfile) {
      return sendError(res, 404, `VoiceProfile with ID ${id} not found`);
    }

    return sendSuccess(res, 200, 'Voice profile updated successfully', voiceProfile);
  } catch (error) {
    if (error.name === 'ValidationError') {
      return sendError(res, 400, 'Validation Error', error.errors);
    }
    return sendError(res, 500, 'Failed to update voice profile', error.message);
  }
};

/**
 * Delete a VoiceProfile record by ObjectId
 * @route DELETE /api/voice-profiles/:id
 */
const deleteVoiceProfile = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return sendError(res, 400, 'Invalid VoiceProfile ObjectId format');
    }

    const voiceProfile = await VoiceProfile.findByIdAndDelete(id);

    if (!voiceProfile) {
      return sendError(res, 404, `VoiceProfile with ID ${id} not found`);
    }

    return sendSuccess(res, 200, 'Voice profile deleted successfully', voiceProfile);
  } catch (error) {
    return sendError(res, 500, 'Failed to delete voice profile', error.message);
  }
};

module.exports = {
  create: createVoiceProfile,
  getAll: getAllVoiceProfiles,
  getById: getVoiceProfileById,
  update: updateVoiceProfile,
  delete: deleteVoiceProfile,
  createVoiceProfile,
  getAllVoiceProfiles,
  getVoiceProfileById,
  updateVoiceProfile,
  deleteVoiceProfile
};
