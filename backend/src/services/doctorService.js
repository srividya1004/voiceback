/**
 * Doctor Service
 * Contains business logic and database operations for Doctor practitioner profiles
 */

const { Doctor, Patient, UserLogin } = require('../models');
const { validateObjectId } = require('../utils/validationHelper');

/**
 * Create a new Doctor record (Find-or-create / Upsert)
 */
const createDoctor = async (doctorData) => {
  const normalizedEmail = doctorData.email ? doctorData.email.trim().toLowerCase() : '';
  
  const existing = await Doctor.findOne({
    $or: [
      ...(normalizedEmail ? [{ email: normalizedEmail }] : []),
      ...(doctorData.userId ? [{ userId: doctorData.userId }] : [])
    ]
  });

  if (existing) {
    if (doctorData.userId && !existing.userId) existing.userId = doctorData.userId;
    if (doctorData.fullName) existing.fullName = doctorData.fullName;
    if (doctorData.specialization) existing.specialization = doctorData.specialization;
    if (doctorData.hospitalAffiliation) existing.hospitalAffiliation = doctorData.hospitalAffiliation;
    if (doctorData.licenseNumber) existing.licenseNumber = doctorData.licenseNumber;
    if (normalizedEmail) existing.email = normalizedEmail;
    if (doctorData.phone) existing.phone = doctorData.phone;
    await existing.save();
    return existing;
  }

  if (normalizedEmail) {
    doctorData.email = normalizedEmail;
  }

  const doctor = await Doctor.create(doctorData);
  return doctor;
};

/**
 * Retrieve all Doctor records
 */
const getAllDoctors = async () => {
  const doctors = await Doctor.find().populate('userId', 'email role');
  return doctors;
};

/**
 * Retrieve a single Doctor by ObjectId
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
 * Assign a patient to doctor by registered patient email
 */
const assignPatientByEmail = async (doctorId, emailInput) => {
  validateObjectId(doctorId, 'Doctor');

  const doctor = await Doctor.findById(doctorId);
  if (!doctor) {
    throw new Error('Doctor record not found');
  }

  if (!emailInput || typeof emailInput !== 'string') {
    throw new Error('Please enter a valid patient email address.');
  }

  const normalizedEmail = emailInput.trim().toLowerCase();

  // Search UserLogin and Patient documents
  const userLogins = await UserLogin.find({ email: normalizedEmail, role: 'Patient' });
  const userLoginIds = userLogins.map(u => u._id);

  const matches = await Patient.find({
    $or: [
      { email: normalizedEmail },
      { userId: { $in: userLoginIds } }
    ]
  });

  if (matches.length === 0) {
    throw new Error('No patient found with this email.');
  }

  // Pick the authoritative match (earliest or linked to userId)
  const patient = matches[0];

  // Update Patient.assignedDoctorId
  await Patient.findByIdAndUpdate(patient._id, {
    assignedDoctorId: doctor._id
  });

  return await Patient.findById(patient._id).populate('assignedDoctorId', 'fullName specialization hospitalAffiliation');
};

/**
 * Update a Doctor record by ObjectId
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
  assignPatientByEmail,
  update: updateDoctor,
  delete: deleteDoctor,
  createDoctor,
  getAllDoctors,
  getDoctorById,
  updateDoctor,
  deleteDoctor
};
