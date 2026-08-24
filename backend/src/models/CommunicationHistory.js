/**
 * CommunicationHistory Mongoose Model
 * Represents real-time speech recognition log events
 */

const mongoose = require('mongoose');

const communicationHistorySchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient',
      required: [true, 'Patient ID is required']
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    attemptType: {
      type: String,
      required: [true, 'Attempt type is required'],
      trim: true,
      enum: {
        values: ['Silent', 'Whispered', 'Weak', 'Unclear', 'ContextSelect', 'EMGInference'],
        message: '{VALUE} is not a valid speech attempt type'
      }
    },
    recognizedText: {
      type: String,
      required: [true, 'Recognized text is required'],
      trim: true
    },
    confidenceScore: {
      type: Number,
      required: [true, 'Confidence score is required'],
      min: [0, 'Confidence score cannot be less than 0'],
      max: [1.0, 'Confidence score cannot exceed 1.0']
    },
    semanticIntent: {
      type: String,
      trim: true,
      default: ''
    },
    language: {
      type: String,
      enum: ['en', 'kn', 'hi'],
      default: 'en'
    },
    caregiverQuestion: {
      type: String,
      trim: true,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

const CommunicationHistory = mongoose.model('CommunicationHistory', communicationHistorySchema);

module.exports = CommunicationHistory;
