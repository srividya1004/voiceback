/**
 * Doctor Controller
 * Handles HTTP request/response orchestration for Doctor medical practitioner profiles using Doctor Service.
 */

const doctorService = require('../services/doctorService');
const { sendSuccess, sendError } = require('../utils/responseFormatter');

/**
 * Create a new Doctor record
 * @route POST /api/doctors
 */
const createDoctor = async (req, res) => {
  try {
    const doctor = await doctorService.create(req.body);
    return sendSuccess(res, 201, 'Doctor profile created successfully', doctor);
  } catch (error) {
    if (error.name === 'ValidationError') {
      return sendError(res, 400, 'Validation Error', error.errors);
    }
    return sendError(res, 500, 'Failed to create doctor profile', error.message);
  }
};

/**
 * Retrieve all Doctor records
 * @route GET /api/doctors
 */
const getAllDoctors = async (req, res) => {
  try {
    const doctors = await doctorService.getAll();
    return sendSuccess(res, 200, 'Doctors retrieved successfully', doctors);
  } catch (error) {
    return sendError(res, 500, 'Failed to retrieve doctors', error.message);
  }
};

/**
 * Retrieve a single Doctor by ObjectId
 * @route GET /api/doctors/:id
 */
const getDoctorById = async (req, res) => {
  try {
    const { id } = req.params;
    const doctor = await doctorService.getById(id);
    return sendSuccess(res, 200, 'Doctor profile retrieved successfully', doctor);
  } catch (error) {
    if (error.message.includes('Invalid')) {
      return sendError(res, 400, error.message);
    }
    if (error.message.includes('not found')) {
      return sendError(res, 404, error.message);
    }
    return sendError(res, 500, 'Failed to retrieve doctor profile', error.message);
  }
};

/**
 * Update a Doctor record by ObjectId
 * @route PUT /api/doctors/:id
 */
const updateDoctor = async (req, res) => {
  try {
    const { id } = req.params;
    const doctor = await doctorService.update(id, req.body);
    return sendSuccess(res, 200, 'Doctor profile updated successfully', doctor);
  } catch (error) {
    if (error.name === 'ValidationError' || error.message.includes('Invalid')) {
      return sendError(res, 400, error.message, error.errors);
    }
    if (error.message.includes('not found')) {
      return sendError(res, 404, error.message);
    }
    return sendError(res, 500, 'Failed to update doctor profile', error.message);
  }
};

/**
 * Delete a Doctor record by ObjectId
 * @route DELETE /api/doctors/:id
 */
const deleteDoctor = async (req, res) => {
  try {
    const { id } = req.params;
    const doctor = await doctorService.delete(id);
    return sendSuccess(res, 200, 'Doctor profile deleted successfully', doctor);
  } catch (error) {
    if (error.message.includes('Invalid')) {
      return sendError(res, 400, error.message);
    }
    if (error.message.includes('not found')) {
      return sendError(res, 404, error.message);
    }
    return sendError(res, 500, 'Failed to delete doctor profile', error.message);
  }
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
