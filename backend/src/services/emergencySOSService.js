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

  // Link each patient directly to their assigned caregiver for emergency alerts
  const assignedCaregiverId = patient.assignedCaregiverId || data.caregiverId || null;
  if (!assignedCaregiverId) {
    throw new Error('No caregiver is assigned to this patient. Emergency alert cannot be sent.');
  }

  // Emergency alerts are sent ONLY to the assigned caregiver, NEVER to the doctor
  const sosRecord = await EmergencySOS.create({
    patientId: patient._id,
    caregiverId: assignedCaregiverId,
    doctorId: null,
    message: data.message || 'Emergency SOS triggered by patient',
    location: data.location || 'Home / Primary Location',
    status: 'Active',
    triggeredAt: new Date()
  });

  return await EmergencySOS.findById(sosRecord._id)
    .populate('patientId', 'fullName age aphasiaType')
    .populate('caregiverId', 'fullName phone relationshipToPatient email');
};

/**
 * Get all Emergency SOS alerts (optionally filtered by patientId, caregiverId, doctorId)
 * Emergency alerts are never routed to doctors; doctor filter returns empty array.
 */
const getEmergencySOSAlerts = async (filter = {}) => {
  // If doctorId is supplied, return empty array as doctors do not receive emergency alerts
  if (filter.doctorId) {
    return [];
  }

  const query = {};
  if (filter.patientId) {
    validateObjectId(filter.patientId, 'Patient');
    query.patientId = filter.patientId;
  }
  if (filter.caregiverId) {
    validateObjectId(filter.caregiverId, 'Caregiver');
    query.caregiverId = filter.caregiverId;
  }

  return await EmergencySOS.find(query)
    .sort({ createdAt: -1 })
    .populate('patientId', 'fullName age aphasiaType')
    .populate('caregiverId', 'fullName phone relationshipToPatient email');
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
    .populate('caregiverId', 'fullName phone relationshipToPatient email');

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
