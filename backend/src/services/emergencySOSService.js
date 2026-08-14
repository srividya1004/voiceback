/**
 * EmergencySOS Service
 * Business logic and database operations for Emergency SOS alerts
 */

const { EmergencySOS, Patient, Caregiver, Doctor } = require('../models');
const { validateObjectId } = require('../utils/validationHelper');

/**
 * Trigger / Create a new EmergencySOS alert record
 */
const createEmergencySOS = async (data) => {
  if (!data.patientId) {
    throw new Error('Patient ID is required to trigger emergency alert');
  }
  validateObjectId(data.patientId, 'Patient');

  // Verify patient exists
  const patient = await Patient.findById(data.patientId);
  if (!patient) {
    throw new Error('Patient record not found');
  }

  // Populate caregiver and doctor IDs from patient relationships if not explicitly provided
  const caregiverId = data.caregiverId || patient.assignedCaregiverId || null;
  const doctorId = data.doctorId || patient.assignedDoctorId || null;

  const sosRecord = await EmergencySOS.create({
    patientId: patient._id,
    caregiverId,
    doctorId,
    message: data.message || 'Emergency SOS triggered by patient',
    location: data.location || 'Home / Primary Location',
    status: 'Active'
  });

  return await EmergencySOS.findById(sosRecord._id)
    .populate('patientId', 'fullName age aphasiaType')
    .populate('caregiverId', 'fullName phone relationshipToPatient')
    .populate('doctorId', 'fullName specialization hospitalAffiliation');
};

/**
 * Get all Emergency SOS alerts (optionally filtered by patientId, caregiverId, doctorId)
 */
const getEmergencySOSAlerts = async (filter = {}) => {
  const query = {};
  if (filter.patientId) {
    validateObjectId(filter.patientId, 'Patient');
    query.patientId = filter.patientId;
  }
  if (filter.caregiverId) {
    validateObjectId(filter.caregiverId, 'Caregiver');
    query.caregiverId = filter.caregiverId;
  }
  if (filter.doctorId) {
    validateObjectId(filter.doctorId, 'Doctor');
    query.doctorId = filter.doctorId;
  }

  return await EmergencySOS.find(query)
    .sort({ createdAt: -1 })
    .populate('patientId', 'fullName age aphasiaType')
    .populate('caregiverId', 'fullName phone relationshipToPatient')
    .populate('doctorId', 'fullName specialization hospitalAffiliation');
};

/**
 * Update Emergency SOS status (e.g., Acknowledged or Resolved)
 */
const updateEmergencySOSStatus = async (id, status) => {
  validateObjectId(id, 'EmergencySOS');
  const validStatuses = ['Active', 'Acknowledged', 'Resolved'];
  if (!validStatuses.includes(status)) {
    throw new Error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
  }

  const updated = await EmergencySOS.findByIdAndUpdate(
    id,
    { status },
    { new: true, runValidators: true }
  )
    .populate('patientId', 'fullName age aphasiaType')
    .populate('caregiverId', 'fullName phone relationshipToPatient')
    .populate('doctorId', 'fullName specialization hospitalAffiliation');

  if (!updated) {
    throw new Error(`Emergency SOS record with ID ${id} not found`);
  }

  return updated;
};

module.exports = {
  createEmergencySOS,
  getEmergencySOSAlerts,
  updateEmergencySOSStatus
};
