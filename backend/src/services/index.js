/**
 * VoiceBack Services Index
 * Exports all 9 business logic service modules
 */

const patientService = require('./patientService');
const doctorService = require('./doctorService');
const caregiverService = require('./caregiverService');
const userLoginService = require('./userLoginService');
const voiceProfileService = require('./voiceProfileService');
const emgProfileService = require('./emgProfileService');
const therapyProgressService = require('./therapyProgressService');
const communicationHistoryService = require('./communicationHistoryService');
const appointmentService = require('./appointmentService');

module.exports = {
  patientService,
  doctorService,
  caregiverService,
  userLoginService,
  voiceProfileService,
  emgProfileService,
  therapyProgressService,
  communicationHistoryService,
  appointmentService
};
