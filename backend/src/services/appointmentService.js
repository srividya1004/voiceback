/**
 * Appointment Service
 * Contains business logic and database operations for clinical session appointments
 */

const { Appointment } = require('../models');
const { validateObjectId } = require('../utils/validationHelper');

/**
 * Create a new Appointment record
 * @param {Object} appointmentData - Appointment input payload
 * @returns {Promise<Object>} Created Appointment document
 */
const createAppointment = async (appointmentData) => {
  const appointment = await Appointment.create(appointmentData);
  return appointment;
};

/**
 * Retrieve all Appointment records
 * @returns {Promise<Array>} List of Appointment documents
 */
const getAllAppointments = async () => {
  const appointments = await Appointment.find()
    .populate('patientId', 'fullName aphasiaType age')
    .populate('doctorId', 'fullName specialization hospitalAffiliation licenseNumber');
  return appointments;
};

/**
 * Retrieve a single Appointment by ObjectId
 * @param {String} id - Appointment ObjectId
 * @returns {Promise<Object>} Appointment document
 * @throws {Error} If ID is invalid or appointment is not found
 */
const getAppointmentById = async (id) => {
  validateObjectId(id, 'Appointment');

  const appointment = await Appointment.findById(id)
    .populate('patientId', 'fullName aphasiaType age')
    .populate('doctorId', 'fullName specialization hospitalAffiliation licenseNumber');

  if (!appointment) {
    throw new Error(`Appointment with ID ${id} not found`);
  }

  return appointment;
};

/**
 * Update an Appointment record by ObjectId
 * @param {String} id - Appointment ObjectId
 * @param {Object} updateData - Data fields to update
 * @returns {Promise<Object>} Updated Appointment document
 * @throws {Error} If ID is invalid or appointment is not found
 */
const updateAppointment = async (id, updateData) => {
  validateObjectId(id, 'Appointment');

  const appointment = await Appointment.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true
  });

  if (!appointment) {
    throw new Error(`Appointment with ID ${id} not found`);
  }

  return appointment;
};

/**
 * Delete an Appointment record by ObjectId
 * @param {String} id - Appointment ObjectId
 * @returns {Promise<Object>} Deleted Appointment document
 * @throws {Error} If ID is invalid or appointment is not found
 */
const deleteAppointment = async (id) => {
  validateObjectId(id, 'Appointment');

  const appointment = await Appointment.findByIdAndDelete(id);

  if (!appointment) {
    throw new Error(`Appointment with ID ${id} not found`);
  }

  return appointment;
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
