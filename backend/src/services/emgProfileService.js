/**
 * EMGProfile Service
 * Contains business logic and database operations for sEMG baseline threshold profiles
 */

const { EMGProfile } = require('../models');
const { validateObjectId } = require('../utils/validationHelper');

/**
 * Create a new EMGProfile record
 * @param {Object} emgProfileData - EMGProfile input payload
 * @returns {Promise<Object>} Created EMGProfile document
 */
const createEMGProfile = async (emgProfileData) => {
  const emgProfile = await EMGProfile.create(emgProfileData);
  return emgProfile;
};

/**
 * Retrieve all EMGProfile records
 * @returns {Promise<Array>} List of EMGProfile documents
 */
const getAllEMGProfiles = async () => {
  const emgProfiles = await EMGProfile.find().populate('patientId', 'fullName aphasiaType age');
  return emgProfiles;
};

/**
 * Retrieve a single EMGProfile by ObjectId
 * @param {String} id - EMGProfile ObjectId
 * @returns {Promise<Object>} EMGProfile document
 * @throws {Error} If ID is invalid or EMG profile is not found
 */
const getEMGProfileById = async (id) => {
  validateObjectId(id, 'EMGProfile');

  const emgProfile = await EMGProfile.findById(id).populate('patientId', 'fullName aphasiaType age');

  if (!emgProfile) {
    throw new Error(`EMGProfile with ID ${id} not found`);
  }

  return emgProfile;
};

/**
 * Update an EMGProfile record by ObjectId
 * @param {String} id - EMGProfile ObjectId
 * @param {Object} updateData - Data fields to update
 * @returns {Promise<Object>} Updated EMGProfile document
 * @throws {Error} If ID is invalid or EMG profile is not found
 */
const updateEMGProfile = async (id, updateData) => {
  validateObjectId(id, 'EMGProfile');

  const emgProfile = await EMGProfile.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true
  });

  if (!emgProfile) {
    throw new Error(`EMGProfile with ID ${id} not found`);
  }

  return emgProfile;
};

/**
 * Delete an EMGProfile record by ObjectId
 * @param {String} id - EMGProfile ObjectId
 * @returns {Promise<Object>} Deleted EMGProfile document
 * @throws {Error} If ID is invalid or EMG profile is not found
 */
const deleteEMGProfile = async (id) => {
  validateObjectId(id, 'EMGProfile');

  const emgProfile = await EMGProfile.findByIdAndDelete(id);

  if (!emgProfile) {
    throw new Error(`EMGProfile with ID ${id} not found`);
  }

  return emgProfile;
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
