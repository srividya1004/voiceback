/**
 * VoiceProfile Service
 * Contains business logic and database operations for VoiceProfile TTS settings
 */

const { VoiceProfile } = require('../models');
const { validateObjectId } = require('../utils/validationHelper');

/**
 * Create a new VoiceProfile record
 * @param {Object} voiceProfileData - VoiceProfile input payload
 * @returns {Promise<Object>} Created VoiceProfile document
 */
const createVoiceProfile = async (voiceProfileData) => {
  const voiceProfile = await VoiceProfile.create(voiceProfileData);
  return voiceProfile;
};

/**
 * Retrieve all VoiceProfile records
 * @returns {Promise<Array>} List of VoiceProfile documents
 */
const getAllVoiceProfiles = async () => {
  const voiceProfiles = await VoiceProfile.find().populate('patientId', 'fullName aphasiaType age');
  return voiceProfiles;
};

/**
 * Retrieve a single VoiceProfile by ObjectId
 * @param {String} id - VoiceProfile ObjectId
 * @returns {Promise<Object>} VoiceProfile document
 * @throws {Error} If ID is invalid or voice profile is not found
 */
const getVoiceProfileById = async (id) => {
  validateObjectId(id, 'VoiceProfile');

  const voiceProfile = await VoiceProfile.findById(id).populate('patientId', 'fullName aphasiaType age');

  if (!voiceProfile) {
    throw new Error(`VoiceProfile with ID ${id} not found`);
  }

  return voiceProfile;
};

/**
 * Update a VoiceProfile record by ObjectId
 * @param {String} id - VoiceProfile ObjectId
 * @param {Object} updateData - Data fields to update
 * @returns {Promise<Object>} Updated VoiceProfile document
 * @throws {Error} If ID is invalid or voice profile is not found
 */
const updateVoiceProfile = async (id, updateData) => {
  validateObjectId(id, 'VoiceProfile');

  const voiceProfile = await VoiceProfile.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true
  });

  if (!voiceProfile) {
    throw new Error(`VoiceProfile with ID ${id} not found`);
  }

  return voiceProfile;
};

/**
 * Delete a VoiceProfile record by ObjectId
 * @param {String} id - VoiceProfile ObjectId
 * @returns {Promise<Object>} Deleted VoiceProfile document
 * @throws {Error} If ID is invalid or voice profile is not found
 */
const deleteVoiceProfile = async (id) => {
  validateObjectId(id, 'VoiceProfile');

  const voiceProfile = await VoiceProfile.findByIdAndDelete(id);

  if (!voiceProfile) {
    throw new Error(`VoiceProfile with ID ${id} not found`);
  }

  return voiceProfile;
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
