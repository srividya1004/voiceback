/**
 * Patient Service
 * Contains business logic and database operations for Patient clinical profiles
 */

const { Patient, Doctor } = require('../models');
const { validateObjectId } = require('../utils/validationHelper');

/**
 * Create a new Patient record (Find-or-create / Upsert)
 */
const createPatient = async (patientData) => {
  const normalizedEmail = patientData.email ? patientData.email.trim().toLowerCase() : '';

  const existing = await Patient.findOne({
    $or: [
      ...(normalizedEmail ? [{ email: normalizedEmail }] : []),
      ...(patientData.userId ? [{ userId: patientData.userId }] : [])
    ]
  });

  if (existing) {
    if (patientData.userId && !existing.userId) existing.userId = patientData.userId;
    if (patientData.fullName) existing.fullName = patientData.fullName;
    if (patientData.age) existing.age = patientData.age;
    if (patientData.aphasiaType) existing.aphasiaType = patientData.aphasiaType;
    if (normalizedEmail) existing.email = normalizedEmail;
    await existing.save();
    return existing;
  }

  if (normalizedEmail) {
    patientData.email = normalizedEmail;
  }

  const patient = await Patient.create(patientData);
  return patient;
};

/**
 * Retrieve all Patient records with populated references
 */
const getAllPatients = async () => {
  const patients = await Patient.find()
    .populate('userId', 'email role')
    .populate('assignedDoctorId', 'fullName specialization licenseNumber hospitalAffiliation email phone')
    .populate('assignedCaregiverId', 'fullName phone relationshipToPatient email');
  return patients;
};

/**
 * Retrieve a single Patient by ObjectId
 */
const getPatientById = async (id) => {
  validateObjectId(id, 'Patient');

  const patient = await Patient.findById(id)
    .populate('userId', 'email role')
    .populate('assignedDoctorId', 'fullName specialization licenseNumber hospitalAffiliation email phone')
    .populate('assignedCaregiverId', 'fullName phone relationshipToPatient email');

  if (!patient) {
    throw new Error(`Patient with ID ${id} not found`);
  }

  return patient;
};

/**
 * Assign a doctor to a patient
 */
const assignDoctor = async (patientId, doctorId) => {
  validateObjectId(patientId, 'Patient');
  validateObjectId(doctorId, 'Doctor');

  const doctor = await Doctor.findById(doctorId);
  if (!doctor) {
    throw new Error(`Doctor with ID ${doctorId} not found`);
  }

  const updatedPatient = await Patient.findByIdAndUpdate(
    patientId,
    { assignedDoctorId: doctor._id },
    { new: true, runValidators: true }
  )
    .populate('userId', 'email role')
    .populate('assignedDoctorId', 'fullName specialization licenseNumber hospitalAffiliation email phone')
    .populate('assignedCaregiverId', 'fullName phone relationshipToPatient email');

  if (!updatedPatient) {
    throw new Error(`Patient with ID ${patientId} not found`);
  }

  return updatedPatient;
};

/**
 * Update a Patient record by ObjectId
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
  assignDoctor,
  update: updatePatient,
  delete: deletePatient,
  createPatient,
  getAllPatients,
  getPatientById,
  updatePatient,
  deletePatient
};
