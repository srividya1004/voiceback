/**
 * Patient Mongoose Model
 * Represents clinical demographic profile and linkage to doctor & caregiver
 */

const mongoose = require('mongoose');

const patientSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'UserLogin'
    },
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
      minlength: [2, 'Full name must be at least 2 characters long'],
      maxlength: [100, 'Full name cannot exceed 100 characters']
    },
    age: {
      type: Number,
      required: [true, 'Age is required'],
      min: [0, 'Age cannot be negative'],
      max: [120, 'Age cannot exceed 120']
    },
    aphasiaType: {
      type: String,
      required: [true, 'Aphasia type is required'],
      trim: true,
      enum: {
        values: [
          "Broca's",
          "Wernicke's",
          'Global',
          'Anomic',
          'Transcortical Motor',
          'Transcortical Sensory',
          'Conduction',
          'Mixed',
          'Other'
        ],
        message: '{VALUE} is not a recognized aphasia type'
      }
    },
    assignedDoctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Doctor',
      default: null
    },
    assignedCaregiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Caregiver',
      default: null
    }
  },
  {
    timestamps: true
  }
);

const Patient = mongoose.model('Patient', patientSchema);

module.exports = Patient;
