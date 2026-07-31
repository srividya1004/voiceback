/**
 * TherapyProgress Mongoose Model
 * Represents clinical therapy session scores and exercise progress tracking
 */

const mongoose = require('mongoose');

const therapyProgressSchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient',
      required: [true, 'Patient ID is required']
    },
    sessionDate: {
      type: Date,
      default: Date.now
    },
    exercisesCompleted: {
      type: Number,
      required: [true, 'Exercises completed count is required'],
      min: [0, 'Exercises completed cannot be negative']
    },
    accuracyScore: {
      type: Number,
      required: [true, 'Accuracy score is required'],
      min: [0, 'Accuracy score cannot be less than 0'],
      max: [100, 'Accuracy score cannot exceed 100']
    },
    notes: {
      type: String,
      trim: true,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

const TherapyProgress = mongoose.model('TherapyProgress', therapyProgressSchema);

module.exports = TherapyProgress;
