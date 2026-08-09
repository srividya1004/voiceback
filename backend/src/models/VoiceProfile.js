/**
 * VoiceProfile Mongoose Model
 * Represents personalized TTS audio synthesis settings for a patient
 */

const mongoose = require('mongoose');

const voiceProfileSchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient',
      required: [true, 'Patient ID is required']
    },
    pitch: {
      type: Number,
      default: 1.0,
      min: [0.5, 'Pitch cannot be less than 0.5'],
      max: [2.0, 'Pitch cannot exceed 2.0']
    },
    speedRate: {
      type: Number,
      default: 1.0,
      min: [0.5, 'Speed rate cannot be less than 0.5'],
      max: [2.0, 'Speed rate cannot exceed 2.0']
    },
    voiceGender: {
      type: String,
      enum: {
        values: ['Male', 'Female', 'Neutral'],
        message: '{VALUE} is not a supported voice gender'
      },
      default: 'Neutral'
    },
    customVoiceAssetUrl: {
      type: String,
      trim: true,
      default: ''
    },
    voiceId: {
      type: String,
      trim: true,
      default: ''
    },
    status: {
      type: String,
      enum: ['Not Configured', 'Processing', 'Ready', 'Failed'],
      default: 'Not Configured'
    },
    lastClonedAt: {
      type: Date
    }
  },
  {
    timestamps: true
  }
);

const VoiceProfile = mongoose.model('VoiceProfile', voiceProfileSchema);

module.exports = VoiceProfile;
