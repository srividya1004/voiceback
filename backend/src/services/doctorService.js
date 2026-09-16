/**
 * Doctor Service
 * Contains business logic and database operations for Doctor practitioner profiles
 */

const {
  Doctor,
  Patient,
  UserLogin,
  TherapyProgress,
  CommunicationHistory,
  Appointment,
  PersonalScript
} = require('../models');
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
 * Assign a patient to a doctor by registered patient email address
 */
const assignPatientByEmail = async (doctorId, patientEmail) => {
  validateObjectId(doctorId, 'Doctor');

  const doctor = await Doctor.findById(doctorId);
  if (!doctor) {
    throw new Error(`Doctor with ID ${doctorId} not found`);
  }

  const normalizedEmail = (patientEmail || '').trim().toLowerCase();
  if (!normalizedEmail) {
    throw new Error('Patient email is required');
  }

  // Find patient by registered email
  const patient = await Patient.findOne({ email: normalizedEmail });
  if (!patient) {
    throw new Error(`No patient found with registered email: ${patientEmail}`);
  }

  // Update Patient.assignedDoctorId
  await Patient.findByIdAndUpdate(patient._id, {
    assignedDoctorId: doctor._id
  });

  return await Patient.findById(patient._id).populate('assignedDoctorId', 'fullName specialization hospitalAffiliation');
};

/**
 * Retrieve full medical record for a patient assigned to a specific doctor
 * Enforces strict authorization: only returns records if patient is assigned to the doctor.
 */
const getPatientMedicalRecord = async (doctorId, patientId) => {
  validateObjectId(doctorId, 'Doctor');
  validateObjectId(patientId, 'Patient');

  const doctor = await Doctor.findById(doctorId);
  if (!doctor) {
    const error = new Error(`Doctor with ID ${doctorId} not found`);
    error.statusCode = 404;
    throw error;
  }

  const patient = await Patient.findById(patientId)
    .populate('assignedCaregiverId', 'fullName phone relationshipToPatient email')
    .populate('assignedDoctorId', 'fullName specialization hospitalAffiliation licenseNumber email phone')
    .populate('userId', 'email role');

  if (!patient) {
    const error = new Error(`Patient with ID ${patientId} not found`);
    error.statusCode = 404;
    throw error;
  }

  // Strict Authorization Check: patient must be assigned to this doctor
  const assignedDocId = patient.assignedDoctorId?._id || patient.assignedDoctorId;
  if (!assignedDocId || assignedDocId.toString() !== doctorId.toString()) {
    const error = new Error('Access Denied: Patient is not assigned to this doctor.');
    error.statusCode = 403;
    throw error;
  }

  // Fetch all real clinical data in parallel
  const [therapyProgress, communicationHistory, appointments, personalScripts] = await Promise.all([
    TherapyProgress.find({ patientId }).sort({ sessionDate: 1, createdAt: 1 }),
    CommunicationHistory.find({ patientId }).sort({ timestamp: -1, createdAt: -1 }),
    Appointment.find({ patientId, doctorId }).sort({ appointmentDate: -1 }),
    PersonalScript.find({ patientId }).sort({ createdAt: -1 })
  ]);

  // Compute therapy progress and recovery metrics strictly from recorded data
  let recoveryMetrics = {
    totalSessions: therapyProgress.length,
    totalExercisesCompleted: therapyProgress.reduce((sum, r) => sum + (r.exercisesCompleted || 0), 0),
    initialScore: null,
    latestScore: null,
    averageScore: null,
    indicator: 'No data available',
    scoreChange: null
  };

  const validScores = therapyProgress
    .map(r => (typeof r.closenessScore === 'number' ? r.closenessScore : (typeof r.accuracyScore === 'number' ? r.accuracyScore : null)))
    .filter(s => s !== null && !isNaN(s));

  if (validScores.length > 0) {
    recoveryMetrics.initialScore = validScores[0];
    recoveryMetrics.latestScore = validScores[validScores.length - 1];
    const sum = validScores.reduce((a, b) => a + b, 0);
    recoveryMetrics.averageScore = Math.round((sum / validScores.length) * 10) / 10;

    if (validScores.length > 1) {
      const diff = recoveryMetrics.latestScore - recoveryMetrics.initialScore;
      recoveryMetrics.scoreChange = diff;
      if (diff > 0) {
        recoveryMetrics.indicator = `Improvement (+${diff}%)`;
      } else if (diff < 0) {
        recoveryMetrics.indicator = `Decline (${diff}%)`;
      } else {
        recoveryMetrics.indicator = 'Stable (0% change)';
      }
    } else {
      recoveryMetrics.indicator = `Baseline Established (${validScores[0]}%)`;
    }
  }

  return {
    patient: {
      _id: patient._id,
      fullName: patient.fullName,
      age: patient.age,
      gender: patient.gender || null,
      email: patient.email || null,
      phone: patient.phone || null,
      aphasiaType: patient.aphasiaType,
      preferredLanguage: patient.preferredLanguage || null,
      emergencyContact: patient.emergencyContact || null,
      registeredAt: patient.createdAt,
      assignedCaregiver: patient.assignedCaregiverId ? {
        _id: patient.assignedCaregiverId._id,
        fullName: patient.assignedCaregiverId.fullName,
        phone: patient.assignedCaregiverId.phone || null,
        email: patient.assignedCaregiverId.email || null,
        relationshipToPatient: patient.assignedCaregiverId.relationshipToPatient || null
      } : null,
      assignedDoctor: patient.assignedDoctorId ? {
        _id: patient.assignedDoctorId._id,
        fullName: patient.assignedDoctorId.fullName,
        specialization: patient.assignedDoctorId.specialization,
        hospitalAffiliation: patient.assignedDoctorId.hospitalAffiliation,
        licenseNumber: patient.assignedDoctorId.licenseNumber || null,
        email: patient.assignedDoctorId.email || null,
        phone: patient.assignedDoctorId.phone || null
      } : null
    },
    clinicalDetails: {
      primaryDiagnosis: patient.aphasiaType,
      notes: appointments.filter(a => a.clinicalNotes).map(a => ({
        date: a.appointmentDate,
        text: a.clinicalNotes
      }))
    },
    therapyData: {
      history: therapyProgress,
      assignedScripts: personalScripts,
      recoveryMetrics
    },
    communicationHistory,
    appointments,
    generatedReports: {
      medicalSummaryReport: {
        reportId: `MED-REP-${patient._id.toString().slice(-6).toUpperCase()}`,
        generatedAt: new Date().toISOString(),
        diagnosis: patient.aphasiaType,
        totalConsultations: appointments.length,
        recoveryStatus: recoveryMetrics.indicator
      },
      therapyProgressReport: {
        reportId: `THP-REP-${patient._id.toString().slice(-6).toUpperCase()}`,
        generatedAt: new Date().toISOString(),
        totalPracticeSessions: therapyProgress.length,
        averagePerformance: recoveryMetrics.averageScore !== null ? `${recoveryMetrics.averageScore}%` : 'No data available',
        recoveryTrend: recoveryMetrics.indicator
      }
    }
  };
};

/**
 * Update a Doctor record by ObjectId
 */
const updateDoctor = async (id, updateData) => {
  validateObjectId(id, 'Doctor');

  const doctor = await Doctor.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true
  }).populate('userId', 'email role');

  if (!doctor) {
    throw new Error(`Doctor with ID ${id} not found`);
  }

  return doctor;
};

/**
 * Delete a Doctor record by ObjectId with generic cascade cleanup
 */
const deleteDoctor = async (id) => {
  validateObjectId(id, 'Doctor');

  const doctor = await Doctor.findByIdAndDelete(id);

  if (!doctor) {
    throw new Error(`Doctor with ID ${id} not found`);
  }

  // Generic Cascade Cleanup: Nullify assignedDoctorId on all linked Patients
  await Patient.updateMany(
    { assignedDoctorId: id },
    { $set: { assignedDoctorId: null } }
  );

  return doctor;
};

module.exports = {
  create: createDoctor,
  getAll: getAllDoctors,
  getById: getDoctorById,
  assignPatientByEmail,
  getPatientMedicalRecord,
  update: updateDoctor,
  delete: deleteDoctor,
  createDoctor,
  getAllDoctors,
  getDoctorById,
  updateDoctor,
  deleteDoctor
};
