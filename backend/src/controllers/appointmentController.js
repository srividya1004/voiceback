/**
 * Appointment Controller
 * Handles HTTP request/response orchestration for clinical session scheduling using Appointment Service.
 */

const appointmentService = require('../services/appointmentService');
const { sendSuccess, sendError } = require('../utils/responseFormatter');

/**
 * Create a new Appointment record
 * @route POST /api/appointments
 */
const createAppointment = async (req, res) => {
  try {
    const appointment = await appointmentService.create(req.body);
    return sendSuccess(res, 201, 'Appointment scheduled successfully', appointment);
  } catch (error) {
    if (error.name === 'ValidationError') {
      return sendError(res, 400, 'Validation Error', error.errors);
    }
    return sendError(res, 500, 'Failed to schedule appointment', error.message);
  }
};

/**
 * Retrieve all Appointment records
 * @route GET /api/appointments
 */
const getAllAppointments = async (req, res) => {
  try {
    const appointments = await appointmentService.getAll();
    return sendSuccess(res, 200, 'Appointments retrieved successfully', appointments);
  } catch (error) {
    return sendError(res, 500, 'Failed to retrieve appointments', error.message);
  }
};

/**
 * Retrieve a single Appointment record by ObjectId
 * @route GET /api/appointments/:id
 */
const getAppointmentById = async (req, res) => {
  try {
    const { id } = req.params;
    const appointment = await appointmentService.getById(id);
    return sendSuccess(res, 200, 'Appointment retrieved successfully', appointment);
  } catch (error) {
    if (error.message.includes('Invalid')) {
      return sendError(res, 400, error.message);
    }
    if (error.message.includes('not found')) {
      return sendError(res, 404, error.message);
    }
    return sendError(res, 500, 'Failed to retrieve appointment', error.message);
  }
};

/**
 * Update an Appointment record by ObjectId
 * @route PUT /api/appointments/:id
 */
const updateAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const appointment = await appointmentService.update(id, req.body);
    return sendSuccess(res, 200, 'Appointment updated successfully', appointment);
  } catch (error) {
    if (error.name === 'ValidationError' || error.message.includes('Invalid')) {
      return sendError(res, 400, error.message, error.errors);
    }
    if (error.message.includes('not found')) {
      return sendError(res, 404, error.message);
    }
    return sendError(res, 500, 'Failed to update appointment', error.message);
  }
};

/**
 * Delete an Appointment record by ObjectId
 * @route DELETE /api/appointments/:id
 */
const deleteAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const appointment = await appointmentService.delete(id);
    return sendSuccess(res, 200, 'Appointment deleted successfully', appointment);
  } catch (error) {
    if (error.message.includes('Invalid')) {
      return sendError(res, 400, error.message);
    }
    if (error.message.includes('not found')) {
      return sendError(res, 404, error.message);
    }
    return sendError(res, 500, 'Failed to delete appointment', error.message);
  }
};

module.exports = {
  create: createAppointment,
  getAll: getAllAppointments,
  getById: getAppointmentById,
  update: updateAppointment,
  delete: deleteAppointment,
  createAppointment,
  getAllAppointments,
  getAppointmentById,
  updateAppointment,
  deleteAppointment
};
