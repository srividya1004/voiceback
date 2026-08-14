/**
 * EmergencySOS Controller
 * HTTP orchestration for Emergency SOS alerts
 */

const emergencySOSService = require('../services/emergencySOSService');
const { sendSuccess, sendError } = require('../utils/responseFormatter');

/**
 * Trigger emergency SOS
 * @route POST /api/emergency-sos
 */
const triggerEmergencySOS = async (req, res) => {
  try {
    const alert = await emergencySOSService.createEmergencySOS(req.body);
    return sendSuccess(res, 201, 'Emergency alert recorded', alert);
  } catch (error) {
    if (error.message.includes('required') || error.message.includes('Invalid')) {
      return sendError(res, 400, error.message);
    }
    return sendError(res, 500, 'Failed to record emergency alert', error.message);
  }
};

/**
 * Get emergency SOS alerts (with query params patientId, caregiverId, doctorId)
 * @route GET /api/emergency-sos
 */
const getEmergencySOSAlerts = async (req, res) => {
  try {
    const { patientId, caregiverId, doctorId } = req.query;
    const filter = {};
    if (patientId) filter.patientId = patientId;
    if (caregiverId) filter.caregiverId = caregiverId;
    if (doctorId) filter.doctorId = doctorId;

    const alerts = await emergencySOSService.getEmergencySOSAlerts(filter);
    return sendSuccess(res, 200, 'Emergency alerts retrieved successfully', alerts);
  } catch (error) {
    return sendError(res, 500, 'Failed to retrieve emergency alerts', error.message);
  }
};

/**
 * Update emergency alert status
 * @route PUT /api/emergency-sos/:id
 */
const updateEmergencySOSStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const updated = await emergencySOSService.updateEmergencySOSStatus(id, status);
    return sendSuccess(res, 200, 'Emergency alert status updated successfully', updated);
  } catch (error) {
    if (error.message.includes('not found')) {
      return sendError(res, 404, error.message);
    }
    if (error.message.includes('Invalid')) {
      return sendError(res, 400, error.message);
    }
    return sendError(res, 500, 'Failed to update emergency alert status', error.message);
  }
};

module.exports = {
  triggerEmergencySOS,
  getEmergencySOSAlerts,
  updateEmergencySOSStatus
};
