/**
 * EMGProfile Mongoose Model
 * Represents calibrated sEMG baseline thresholds and feature vectors for a patient
 */

const mongoose = require('mongoose');

const emgProfileSchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient',
      required: [true, 'Patient ID is required']
    },
    baselineVoltage: {
      type: Number,
      required: [true, 'Baseline voltage is required'],
      min: [0, 'Baseline voltage cannot be negative']
    },
    maxVoluntaryContraction: {
      type: Number,
      required: [true, 'Max voluntary contraction (MVC) value is required'],
      min: [0, 'Max voluntary contraction cannot be negative']
    },
    calibrationVector: {
      type: [Number],
      default: []
    },
    calibratedAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

const EMGProfile = mongoose.model('EMGProfile', emgProfileSchema);

module.exports = EMGProfile;
