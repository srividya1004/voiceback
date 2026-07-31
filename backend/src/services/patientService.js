/**
 * Patient Service
 * Contains business logic and database operations for Patient clinical profiles
 */

const { Patient } = require('../models');
const { validateObjectId } = require('../utils/validationHelper');

/**
 * Create a new Patient record
 * @param {Object} patientData - Patient profile input payload
 * @returns {Promise<Object>} Created Patient document
 */
const createPatient = async (patientData) => {
  const patient = await Patient.create(patientData);
  return patient;
};

/**
 * Retrieve all Patient records with populated references
 * @returns {Promise<Array>} List of Patient documents
 */
const getAllPatients = async () => {
  const patients = await Patient.find()
    .populate('userId', 'email role')
    .populate('assignedDoctorId', 'fullName specialization licenseNumber')
    .populate('assignedCaregiverId', 'fullName phone relationshipToPatient');
  return patients;
};

/**
 * Retrieve a single Patient by ObjectId
 * @param {String} id - Patient ObjectId
 * @returns {Promise<Object>} Patient document
 * @throws {Error} If ID is invalid or patient is not found
 */
const getPatientById = async (id) => {
  validateObjectId(id, 'Patient');

  const patient = await Patient.findById(id)
    .populate('userId', 'email role')
    .populate('assignedDoctorId', 'fullName specialization licenseNumber')
    .populate('assignedCaregiverId', 'fullName phone relationshipToPatient');

  if (!patient) {
    throw new Error(`Patient with ID ${id} not found`);
  }

  return patient;
};

/**
 * Update a Patient record by ObjectId
 * @param {String} id - Patient ObjectId
 * @param {Object} updateData - Data fields to update
 * @returns {Promise<Object>} Updated Patient document
 * @throws {Error} If ID is invalid or patient is not found
 */
const updatePatient = async (id, updateData) => {
  validateObjectId(id, 'Patient');

  const patient = await Patient.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true
  });

  if (!patient) {
    throw new Error(`Patient with ID ${id} not found`);
  }

  return patient;
};

/**
 * Delete a Patient record by ObjectId
 * @param {String} id - Patient ObjectId
 * @returns {Promise<Object>} Deleted Patient document
 * @throws {Error} If ID is invalid or patient is not found
 */
const deletePatient = async (id) => {
  validateObjectId(id, 'Patient');

  const patient = await Patient.findByIdAndDelete(id);

  if (!patient) {
    throw new Error(`Patient with ID ${id} not found`);
  }

  return patient;
};

module.exports = {
  create: createPatient,
  getAll: getAllPatients,
  getById: getPatientById,
  update: updatePatient,
  delete: deletePatient,
  createPatient,
  getAllPatients,
  getPatientById,
  updatePatient,
  deletePatient
};
