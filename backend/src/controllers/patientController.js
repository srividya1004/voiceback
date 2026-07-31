/**
 * Patient Controller
 * Handles HTTP request/response orchestration for Patient clinical profiles using Patient Service.
 */

const patientService = require('../services/patientService');
const { sendSuccess, sendError } = require('../utils/responseFormatter');

/**
 * Create a new Patient record
 * @route POST /api/patients
 */
const createPatient = async (req, res) => {
  try {
    const patient = await patientService.create(req.body);
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
    const patients = await patientService.getAll();
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
    const patient = await patientService.getById(id);
    return sendSuccess(res, 200, 'Patient retrieved successfully', patient);
  } catch (error) {
    if (error.message.includes('Invalid')) {
      return sendError(res, 400, error.message);
    }
    if (error.message.includes('not found')) {
      return sendError(res, 404, error.message);
    }
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
    const patient = await patientService.update(id, req.body);
    return sendSuccess(res, 200, 'Patient updated successfully', patient);
  } catch (error) {
    if (error.name === 'ValidationError' || error.message.includes('Invalid')) {
      return sendError(res, 400, error.message, error.errors);
    }
    if (error.message.includes('not found')) {
      return sendError(res, 404, error.message);
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
    const patient = await patientService.delete(id);
    return sendSuccess(res, 200, 'Patient deleted successfully', patient);
  } catch (error) {
    if (error.message.includes('Invalid')) {
      return sendError(res, 400, error.message);
    }
    if (error.message.includes('not found')) {
      return sendError(res, 404, error.message);
    }
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
