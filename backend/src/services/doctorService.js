/**
 * Doctor Service
 * Contains business logic and database operations for Doctor practitioner profiles
 */

const { Doctor } = require('../models');
const { validateObjectId } = require('../utils/validationHelper');

/**
 * Create a new Doctor record
 * @param {Object} doctorData - Doctor profile input payload
 * @returns {Promise<Object>} Created Doctor document
 */
const createDoctor = async (doctorData) => {
  const doctor = await Doctor.create(doctorData);
  return doctor;
};

/**
 * Retrieve all Doctor records
 * @returns {Promise<Array>} List of Doctor documents
 */
const getAllDoctors = async () => {
  const doctors = await Doctor.find().populate('userId', 'email role');
  return doctors;
};

/**
 * Retrieve a single Doctor by ObjectId
 * @param {String} id - Doctor ObjectId
 * @returns {Promise<Object>} Doctor document
 * @throws {Error} If ID is invalid or doctor is not found
 */
const getDoctorById = async (id) => {
  validateObjectId(id, 'Doctor');

  const doctor = await Doctor.findById(id).populate('userId', 'email role');

  if (!doctor) {
    throw new Error(`Doctor with ID ${id} not found`);
  }

  return doctor;
};

/**
 * Update a Doctor record by ObjectId
 * @param {String} id - Doctor ObjectId
 * @param {Object} updateData - Data fields to update
 * @returns {Promise<Object>} Updated Doctor document
 * @throws {Error} If ID is invalid or doctor is not found
 */
const updateDoctor = async (id, updateData) => {
  validateObjectId(id, 'Doctor');

  const doctor = await Doctor.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true
  });

  if (!doctor) {
    throw new Error(`Doctor with ID ${id} not found`);
  }

  return doctor;
};

/**
 * Delete a Doctor record by ObjectId
 * @param {String} id - Doctor ObjectId
 * @returns {Promise<Object>} Deleted Doctor document
 * @throws {Error} If ID is invalid or doctor is not found
 */
const deleteDoctor = async (id) => {
  validateObjectId(id, 'Doctor');

  const doctor = await Doctor.findByIdAndDelete(id);

  if (!doctor) {
    throw new Error(`Doctor with ID ${id} not found`);
  }

  return doctor;
};

module.exports = {
  create: createDoctor,
  getAll: getAllDoctors,
  getById: getDoctorById,
  update: updateDoctor,
  delete: deleteDoctor,
  createDoctor,
  getAllDoctors,
  getDoctorById,
  updateDoctor,
  deleteDoctor
};
