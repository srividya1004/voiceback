/**
 * @deprecated HISTORICAL / UNUSED MODEL - RETAINED FOR SCHEMA ARCHIVE ONLY.
 * EMGProfile is no longer wired into the runtime application.
 * BioAmp sEMG is strictly optional hardware telemetry/calibration, NOT speech recognition.
 * Primary speech input is the Physical Microphone.
 * Do NOT delete this file or drop the MongoDB collection without explicit authorization.
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
