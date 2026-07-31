/**
 * Mongoose Models Index
 * Exports all 9 VoiceBack database models
 */

const UserLogin = require('./UserLogin');
const Patient = require('./Patient');
const Doctor = require('./Doctor');
const Caregiver = require('./Caregiver');
const VoiceProfile = require('./VoiceProfile');
const EMGProfile = require('./EMGProfile');
const TherapyProgress = require('./TherapyProgress');
const CommunicationHistory = require('./CommunicationHistory');
const Appointment = require('./Appointment');

module.exports = {
  UserLogin,
  Patient,
  Doctor,
  Caregiver,
  VoiceProfile,
  EMGProfile,
  TherapyProgress,
  CommunicationHistory,
  Appointment
};
