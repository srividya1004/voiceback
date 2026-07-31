/**
 * VoiceProfile Controller
 * Handles HTTP request/response orchestration for Patient TTS audio synthesis profiles using VoiceProfile Service.
 */

const voiceProfileService = require('../services/voiceProfileService');
const { sendSuccess, sendError } = require('../utils/responseFormatter');

/**
 * Create a new VoiceProfile record
 * @route POST /api/voice-profiles
 */
const createVoiceProfile = async (req, res) => {
  try {
    const voiceProfile = await voiceProfileService.create(req.body);
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
    const voiceProfiles = await voiceProfileService.getAll();
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
    const voiceProfile = await voiceProfileService.getById(id);
    return sendSuccess(res, 200, 'Voice profile retrieved successfully', voiceProfile);
  } catch (error) {
    if (error.message.includes('Invalid')) {
      return sendError(res, 400, error.message);
    }
    if (error.message.includes('not found')) {
      return sendError(res, 404, error.message);
    }
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
    const voiceProfile = await voiceProfileService.update(id, req.body);
    return sendSuccess(res, 200, 'Voice profile updated successfully', voiceProfile);
  } catch (error) {
    if (error.name === 'ValidationError' || error.message.includes('Invalid')) {
      return sendError(res, 400, error.message, error.errors);
    }
    if (error.message.includes('not found')) {
      return sendError(res, 404, error.message);
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
    const voiceProfile = await voiceProfileService.delete(id);
    return sendSuccess(res, 200, 'Voice profile deleted successfully', voiceProfile);
  } catch (error) {
    if (error.message.includes('Invalid')) {
      return sendError(res, 400, error.message);
    }
    if (error.message.includes('not found')) {
      return sendError(res, 404, error.message);
    }
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
