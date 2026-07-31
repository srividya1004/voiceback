/**
 * Patient Controller
 * Handles CRUD operations for Patient clinical profiles
 */

const mongoose = require('mongoose');
const { Patient } = require('../models');
const { sendSuccess, sendError } = require('../utils/responseFormatter');

/**
 * Create a new Patient record
 * @route POST /api/patients
 */
const createPatient = async (req, res) => {
  try {
    const patient = await Patient.create(req.body);
    return sendSuccess(res, 201, 'Patient created successfully', patient);
  } catch (error) {
    if (error.name === 'ValidationError') {
      return sendError(res, 400, 'Validation Error', error.errors);
    }
    return sendError(res, 500, 'Failed to create patient', error.message);
  }
};

/**
 * Retrieve all Patient records
 * @route GET /api/patients
 */
const getAllPatients = async (req, res) => {
  try {
    const patients = await Patient.find()
      .populate('userId', 'email role')
      .populate('assignedDoctorId', 'fullName specialization licenseNumber')
      .populate('assignedCaregiverId', 'fullName phone relationshipToPatient');
    return sendSuccess(res, 200, 'Patients retrieved successfully', patients);
  } catch (error) {
    return sendError(res, 500, 'Failed to retrieve patients', error.message);
  }
};

/**
 * Retrieve a single Patient by ObjectId
 * @route GET /api/patients/:id
 */
const getPatientById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return sendError(res, 400, 'Invalid Patient ObjectId format');
    }

    const patient = await Patient.findById(id)
      .populate('userId', 'email role')
      .populate('assignedDoctorId', 'fullName specialization licenseNumber')
      .populate('assignedCaregiverId', 'fullName phone relationshipToPatient');

    if (!patient) {
      return sendError(res, 404, `Patient with ID ${id} not found`);
    }

    return sendSuccess(res, 200, 'Patient retrieved successfully', patient);
  } catch (error) {
    return sendError(res, 500, 'Failed to retrieve patient', error.message);
  }
};

/**
 * Update a Patient record by ObjectId
 * @route PUT /api/patients/:id
 */
const updatePatient = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return sendError(res, 400, 'Invalid Patient ObjectId format');
    }

    const patient = await Patient.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true
    });

    if (!patient) {
      return sendError(res, 404, `Patient with ID ${id} not found`);
    }

    return sendSuccess(res, 200, 'Patient updated successfully', patient);
  } catch (error) {
    if (error.name === 'ValidationError') {
      return sendError(res, 400, 'Validation Error', error.errors);
    }
    return sendError(res, 500, 'Failed to update patient', error.message);
  }
};

/**
 * Delete a Patient record by ObjectId
 * @route DELETE /api/patients/:id
 */
const deletePatient = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return sendError(res, 400, 'Invalid Patient ObjectId format');
    }

    const patient = await Patient.findByIdAndDelete(id);

    if (!patient) {
      return sendError(res, 404, `Patient with ID ${id} not found`);
    }

    return sendSuccess(res, 200, 'Patient deleted successfully', patient);
  } catch (error) {
    return sendError(res, 500, 'Failed to delete patient', error.message);
  }
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
