/**
 * Patient Service
 * Contains business logic and database operations for Patient clinical profiles
 */

const { Patient, Doctor, Caregiver, UserLogin } = require('../models');
const { validateObjectId } = require('../utils/validationHelper');

const sanitizeAphasiaType = (type) => {
  if (!type || typeof type !== 'string') return undefined;
  const validEnums = [
    "Broca's", "Wernicke's", "Global", "Anomic",
    "Transcortical Motor", "Transcortical Sensory", "Conduction", "Mixed", "Other"
  ];
  const stripped = type.replace(/\s+Aphasia$/i, '').trim();
  if (validEnums.includes(stripped)) return stripped;
  if (validEnums.includes(type)) return type;
  return "Broca's";
};

/**
 * Create a new Patient record (Find-or-create / Upsert)
 */
const createPatient = async (patientData) => {
  const normalizedEmail = patientData.email ? patientData.email.trim().toLowerCase() : '';

  if (patientData.aphasiaType) {
    patientData.aphasiaType = sanitizeAphasiaType(patientData.aphasiaType);
  }

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
    if (patientData.gender) existing.gender = patientData.gender;
    if (patientData.preferredLanguage) existing.preferredLanguage = patientData.preferredLanguage;
    if (patientData.phone) existing.phone = patientData.phone;
    if (patientData.emergencyContact) existing.emergencyContact = patientData.emergencyContact;
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
 * Assign a doctor to a patient with bidirectional synchronization
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
 * Assign or change caregiver for a patient with bidirectional synchronization
 */
const assignCaregiver = async (patientId, caregiverId) => {
  validateObjectId(patientId, 'Patient');
  validateObjectId(caregiverId, 'Caregiver');

  const caregiver = await Caregiver.findById(caregiverId);
  if (!caregiver) {
    throw new Error(`Caregiver with ID ${caregiverId} not found`);
  }

  const patient = await Patient.findById(patientId);
  if (!patient) {
    throw new Error(`Patient with ID ${patientId} not found`);
  }

  // Generic Orphan & Reassignment handling: Pull from old caregiver if switching
  if (patient.assignedCaregiverId && patient.assignedCaregiverId.toString() !== caregiverId.toString()) {
    const existingCaregiver = await Caregiver.findById(patient.assignedCaregiverId);
    if (existingCaregiver) {
      await Caregiver.findByIdAndUpdate(existingCaregiver._id, {
        $pull: { assignedPatients: patient._id }
      });
    }
  }

  // Update Caregiver assignedPatients array
  await Caregiver.findByIdAndUpdate(caregiver._id, {
    $addToSet: { assignedPatients: patient._id }
  });

  // Update Patient assignedCaregiverId
  const updatedPatient = await Patient.findByIdAndUpdate(
    patient._id,
    { assignedCaregiverId: caregiver._id },
    { new: true, runValidators: true }
  )
    .populate('userId', 'email role')
    .populate('assignedDoctorId', 'fullName specialization licenseNumber hospitalAffiliation email phone')
    .populate('assignedCaregiverId', 'fullName phone relationshipToPatient email');

  return updatedPatient;
};

/**
 * Assign Doctor by registered email (initiated by Patient)
 */
const assignDoctorByEmail = async (patientId, doctorEmailInput) => {
  validateObjectId(patientId, 'Patient');
  if (!doctorEmailInput || typeof doctorEmailInput !== 'string') {
    throw new Error('Please enter a valid doctor email address.');
  }

  const normalizedEmail = doctorEmailInput.trim().toLowerCase();
  const userLogins = await UserLogin.find({ email: normalizedEmail, role: 'Doctor' });
  const userLoginIds = userLogins.map(u => u._id);

  const doctors = await Doctor.find({
    $or: [
      { email: normalizedEmail },
      { userId: { $in: userLoginIds } }
    ]
  });

  if (doctors.length === 0) {
    throw new Error('No doctor found with this email address.');
  }

  const doctor = doctors[0];
  return await assignDoctor(patientId, doctor._id);
};

/**
 * Assign Caregiver by registered email (initiated by Patient)
 */
const assignCaregiverByEmail = async (patientId, caregiverEmailInput) => {
  validateObjectId(patientId, 'Patient');
  if (!caregiverEmailInput || typeof caregiverEmailInput !== 'string') {
    throw new Error('Please enter a valid caregiver email address.');
  }

  const normalizedEmail = caregiverEmailInput.trim().toLowerCase();
  const userLogins = await UserLogin.find({ email: normalizedEmail, role: 'Caregiver' });
  const userLoginIds = userLogins.map(u => u._id);

  const caregivers = await Caregiver.find({
    $or: [
      { email: normalizedEmail },
      { userId: { $in: userLoginIds } }
    ]
  });

  if (caregivers.length === 0) {
    throw new Error('No caregiver found with this email address.');
  }

  const caregiver = caregivers[0];
  return await assignCaregiver(patientId, caregiver._id);
};

/**
 * Update a Patient record by ObjectId
 */
const updatePatient = async (id, updateData) => {
  validateObjectId(id, 'Patient');

  if (updateData.aphasiaType) {
    updateData.aphasiaType = sanitizeAphasiaType(updateData.aphasiaType);
  }

  const patient = await Patient.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true
  })
    .populate('userId', 'email role')
    .populate('assignedDoctorId', 'fullName specialization licenseNumber hospitalAffiliation email phone')
    .populate('assignedCaregiverId', 'fullName phone relationshipToPatient email');

  if (!patient) {
    throw new Error(`Patient with ID ${id} not found`);
  }

  return patient;
};

/**
 * Delete a Patient record by ObjectId with generic cascade cleanup
 */
const deletePatient = async (id) => {
  validateObjectId(id, 'Patient');

  const patient = await Patient.findByIdAndDelete(id);

  if (!patient) {
    throw new Error(`Patient with ID ${id} not found`);
  }

  // Generic Cascade Cleanup: Pull patient ID from all Caregiver assignedPatients arrays
  await Caregiver.updateMany(
    { assignedPatients: id },
    { $pull: { assignedPatients: id } }
  );

  return patient;
};

module.exports = {
  create: createPatient,
  getAll: getAllPatients,
  getById: getPatientById,
  assignDoctor,
  assignCaregiver,
  assignDoctorByEmail,
  assignCaregiverByEmail,
  update: updatePatient,
  delete: deletePatient,
  createPatient,
  getAllPatients,
  getPatientById,
  updatePatient,
  deletePatient
};
