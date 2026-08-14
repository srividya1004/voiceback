/**
 * Caregiver Service
 * Contains business logic and database operations for Caregiver relationship profiles
 */

const { Caregiver, Patient, UserLogin } = require('../models');
const { validateObjectId } = require('../utils/validationHelper');

/**
 * Create a new Caregiver record
 */
const createCaregiver = async (caregiverData) => {
  const caregiver = await Caregiver.create(caregiverData);
  return caregiver;
};

/**
 * Retrieve all Caregiver records
 */
const getAllCaregivers = async () => {
  const caregivers = await Caregiver.find()
    .populate('userId', 'email role')
    .populate({
      path: 'assignedPatients',
      populate: { path: 'assignedDoctorId', select: 'fullName specialization licenseNumber hospitalAffiliation email phone' }
    });
  return caregivers;
};

/**
 * Retrieve a single Caregiver by ObjectId
 */
const getCaregiverById = async (id) => {
  validateObjectId(id, 'Caregiver');

  const caregiver = await Caregiver.findById(id)
    .populate('userId', 'email role')
    .populate({
      path: 'assignedPatients',
      populate: { path: 'assignedDoctorId', select: 'fullName specialization licenseNumber hospitalAffiliation email phone' }
    });

  if (!caregiver) {
    throw new Error(`Caregiver with ID ${id} not found`);
  }

  return caregiver;
};

/**
 * Link a patient to a caregiver securely using registered email
 */
const linkPatientByEmail = async (caregiverId, emailInput) => {
  validateObjectId(caregiverId, 'Caregiver');

  const caregiver = await Caregiver.findById(caregiverId);
  if (!caregiver) {
    throw new Error(`Caregiver record not found`);
  }

  if (!emailInput || typeof emailInput !== 'string') {
    throw new Error('Please enter a valid patient email address.');
  }

  const normalizedEmail = emailInput.trim().toLowerCase();

  // 1. Search UserLogin matching registered email
  const userLogins = await UserLogin.find({ email: normalizedEmail, role: 'Patient' });
  const userLoginIds = userLogins.map(u => u._id);

  // 2. Search Patient profiles matching email or userId
  const matches = await Patient.find({
    $or: [
      { email: normalizedEmail },
      { userId: { $in: userLoginIds } }
    ]
  }).populate('assignedDoctorId', 'fullName specialization hospitalAffiliation');

  if (matches.length === 0) {
    throw new Error('No patient found with this email.');
  }

  if (matches.length > 1) {
    throw new Error('Multiple accounts found. Cannot link automatically.');
  }

  const patient = matches[0];

  // 3. Verify single caregiver assignment
  if (patient.assignedCaregiverId && patient.assignedCaregiverId.toString() !== caregiverId.toString()) {
    throw new Error('Patient is already linked to another caregiver.');
  }

  // 4. Atomically update relationship on both records
  await Caregiver.findByIdAndUpdate(caregiverId, {
    $addToSet: { assignedPatients: patient._id }
  });

  await Patient.findByIdAndUpdate(patient._id, {
    assignedCaregiverId: caregiver._id
  });

  return await Caregiver.findById(caregiverId)
    .populate('userId', 'email role')
    .populate({
      path: 'assignedPatients',
      populate: { path: 'assignedDoctorId', select: 'fullName specialization licenseNumber hospitalAffiliation email phone' }
    });
};

/**
 * Update a Caregiver record by ObjectId
 */
const updateCaregiver = async (id, updateData) => {
  validateObjectId(id, 'Caregiver');

  const caregiver = await Caregiver.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true
  });

  if (!caregiver) {
    throw new Error(`Caregiver with ID ${id} not found`);
  }

  return caregiver;
};

/**
 * Delete a Caregiver record by ObjectId
 */
const deleteCaregiver = async (id) => {
  validateObjectId(id, 'Caregiver');

  const caregiver = await Caregiver.findByIdAndDelete(id);

  if (!caregiver) {
    throw new Error(`Caregiver with ID ${id} not found`);
  }

  return caregiver;
};

module.exports = {
  create: createCaregiver,
  getAll: getAllCaregivers,
  getById: getCaregiverById,
  linkPatient: linkPatientByEmail,
  linkPatientByEmail,
  update: updateCaregiver,
  delete: deleteCaregiver,
  createCaregiver,
  getAllCaregivers,
  getCaregiverById,
  updateCaregiver,
  deleteCaregiver
};
