/**
 * Caregiver Mongoose Model
 * Represents caregiver relationship tracking and assigned patients
 */

const mongoose = require('mongoose');

const caregiverSchema = new mongoose.Schema(
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
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
      match: [/^[+]*[(]{0,1}[0-9]{1,4}[)]{0,1}[-\s./0-9]*$/, 'Please enter a valid phone number']
    },
    relationshipToPatient: {
      type: String,
      required: [true, 'Relationship to patient is required'],
      trim: true,
      maxlength: [50, 'Relationship description cannot exceed 50 characters']
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address']
    },
    assignedPatients: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Patient'
      }
    ]
  },
  {
    timestamps: true
  }
);

const Caregiver = mongoose.model('Caregiver', caregiverSchema);

module.exports = Caregiver;
