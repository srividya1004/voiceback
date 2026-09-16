/**
 * Mongoose Models Index
 * Exports all VoiceBack database models
 */

const UserLogin = require('./UserLogin');
const Patient = require('./Patient');
const Doctor = require('./Doctor');
const Caregiver = require('./Caregiver');
const VoiceProfile = require('./VoiceProfile');
const TherapyProgress = require('./TherapyProgress');
const CommunicationHistory = require('./CommunicationHistory');
const Appointment = require('./Appointment');
const EmergencySOS = require('./EmergencySOS');
const PersonalScript = require('./PersonalScript');

module.exports = {
  UserLogin,
  Patient,
  Doctor,
  Caregiver,
  VoiceProfile,
  TherapyProgress,
  CommunicationHistory,
  Appointment,
  EmergencySOS,
  PersonalScript
};
