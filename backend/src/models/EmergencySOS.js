/**
 * EmergencySOS Mongoose Model
 * Represents patient panic/emergency triggers and alerts recorded for caregivers/doctors
 */

const mongoose = require('mongoose');

const emergencySOSSchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient',
      required: [true, 'Patient ID is required']
    },
    caregiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Caregiver',
      default: null
    },
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Doctor',
      default: null
    },
    status: {
      type: String,
      enum: {
        values: ['Active', 'Acknowledged', 'Resolved'],
        message: '{VALUE} is not a valid emergency status'
      },
      default: 'Active'
    },
    message: {
      type: String,
      trim: true,
      default: 'Emergency SOS triggered by patient'
    },
    location: {
      type: String,
      trim: true,
      default: 'Home / Primary Location'
    },
    triggeredAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

const EmergencySOS = mongoose.model('EmergencySOS', emergencySOSSchema);

module.exports = EmergencySOS;
