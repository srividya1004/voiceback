/**
 * PersonalScript Mongoose Model
 * Represents personalized therapy practice sentences created for a patient
 */

const mongoose = require('mongoose');

const personalScriptSchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient',
      required: [true, 'Patient ID is required'],
      index: true
    },
    text: {
      type: String,
      required: [true, 'Script text is required'],
      trim: true
    },
    category: {
      type: String,
      trim: true,
      default: 'general'
    },
    createdBy: {
      role: {
        type: String,
        enum: ['patient', 'caregiver', 'doctor'],
        required: [true, 'Creator role is required']
      },
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'UserLogin',
        required: [true, 'Creator user ID is required']
      }
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

personalScriptSchema.index({ patientId: 1, isActive: 1 });

const PersonalScript = mongoose.model('PersonalScript', personalScriptSchema);

module.exports = PersonalScript;
