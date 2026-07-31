/**
 * Caregiver Service
 * Contains business logic and database operations for Caregiver relationship profiles
 */

const { Caregiver } = require('../models');
const { validateObjectId } = require('../utils/validationHelper');

/**
 * Create a new Caregiver record
 * @param {Object} caregiverData - Caregiver profile input payload
 * @returns {Promise<Object>} Created Caregiver document
 */
const createCaregiver = async (caregiverData) => {
  const caregiver = await Caregiver.create(caregiverData);
  return caregiver;
};

/**
 * Retrieve all Caregiver records
 * @returns {Promise<Array>} List of Caregiver documents
 */
const getAllCaregivers = async () => {
  const caregivers = await Caregiver.find()
    .populate('userId', 'email role')
    .populate('assignedPatients', 'fullName aphasiaType age');
  return caregivers;
};

/**
 * Retrieve a single Caregiver by ObjectId
 * @param {String} id - Caregiver ObjectId
 * @returns {Promise<Object>} Caregiver document
 * @throws {Error} If ID is invalid or caregiver is not found
 */
const getCaregiverById = async (id) => {
  validateObjectId(id, 'Caregiver');

  const caregiver = await Caregiver.findById(id)
    .populate('userId', 'email role')
    .populate('assignedPatients', 'fullName aphasiaType age');

  if (!caregiver) {
    throw new Error(`Caregiver with ID ${id} not found`);
  }

  return caregiver;
};

/**
 * Update a Caregiver record by ObjectId
 * @param {String} id - Caregiver ObjectId
 * @param {Object} updateData - Data fields to update
 * @returns {Promise<Object>} Updated Caregiver document
 * @throws {Error} If ID is invalid or caregiver is not found
 */
const updateCaregiver = async (id, updateData) => {
  validateObjectId(id, 'Caregiver');

  const caregiver = await Caregiver.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true
  });

  if (!caregiver) {
    throw new Error(`Caregiver with ID ${id} not found`);
  }

  return caregiver;
};

/**
 * Delete a Caregiver record by ObjectId
 * @param {String} id - Caregiver ObjectId
 * @returns {Promise<Object>} Deleted Caregiver document
 * @throws {Error} If ID is invalid or caregiver is not found
 */
const deleteCaregiver = async (id) => {
  validateObjectId(id, 'Caregiver');

  const caregiver = await Caregiver.findByIdAndDelete(id);

  if (!caregiver) {
    throw new Error(`Caregiver with ID ${id} not found`);
  }

  return caregiver;
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
