/**
 * Mongoose Models Index
 * Exports Patient, Doctor, and Caregiver models
 */

const Patient = require('./Patient');
const Doctor = require('./Doctor');
const Caregiver = require('./Caregiver');

module.exports = {
  Patient,
  Doctor,
  Caregiver
};
