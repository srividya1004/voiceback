/**
 * Doctor Controller
 * Handles CRUD operations for Doctor medical practitioner profiles
 */

const mongoose = require('mongoose');
const { Doctor } = require('../models');
const { sendSuccess, sendError } = require('../utils/responseFormatter');

/**
 * Create a new Doctor record
 * @route POST /api/doctors
 */
const createDoctor = async (req, res) => {
  try {
    const doctor = await Doctor.create(req.body);
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
    const doctors = await Doctor.find().populate('userId', 'email role');
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

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return sendError(res, 400, 'Invalid Doctor ObjectId format');
    }

    const doctor = await Doctor.findById(id).populate('userId', 'email role');

    if (!doctor) {
      return sendError(res, 404, `Doctor with ID ${id} not found`);
    }

    return sendSuccess(res, 200, 'Doctor profile retrieved successfully', doctor);
  } catch (error) {
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

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return sendError(res, 400, 'Invalid Doctor ObjectId format');
    }

    const doctor = await Doctor.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true
    });

    if (!doctor) {
      return sendError(res, 404, `Doctor with ID ${id} not found`);
    }

    return sendSuccess(res, 200, 'Doctor profile updated successfully', doctor);
  } catch (error) {
    if (error.name === 'ValidationError') {
      return sendError(res, 400, 'Validation Error', error.errors);
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

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return sendError(res, 400, 'Invalid Doctor ObjectId format');
    }

    const doctor = await Doctor.findByIdAndDelete(id);

    if (!doctor) {
      return sendError(res, 404, `Doctor with ID ${id} not found`);
    }

    return sendSuccess(res, 200, 'Doctor profile deleted successfully', doctor);
  } catch (error) {
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
