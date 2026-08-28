/**
 * Doctor Mongoose Model
 * Represents medical practitioner details and hospital affiliation
 */

const mongoose = require('mongoose');

const doctorSchema = new mongoose.Schema(
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
    specialization: {
      type: String,
      required: [true, 'Specialization is required'],
      trim: true,
      maxlength: [100, 'Specialization cannot exceed 100 characters']
    },
    hospitalAffiliation: {
      type: String,
      required: [true, 'Hospital affiliation is required'],
      trim: true,
      maxlength: [150, 'Hospital affiliation cannot exceed 150 characters']
    },
    licenseNumber: {
      type: String,
      required: [true, 'License number is required'],
      trim: true,
      uppercase: true,
      maxlength: [50, 'License number cannot exceed 50 characters']
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address']
    },
    phone: {
      type: String,
      trim: true,
      match: [/^[+]*[(]{0,1}[0-9]{1,4}[)]{0,1}[-\s./0-9]*$/, 'Please enter a valid phone number']
    }
  },
  {
    timestamps: true
  }
);

doctorSchema.index({ email: 1 }, { unique: true, sparse: true });
doctorSchema.index({ userId: 1 }, { unique: true, sparse: true });

const Doctor = mongoose.model('Doctor', doctorSchema);

module.exports = Doctor;
