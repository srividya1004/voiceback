/**
 * UserLogin Mongoose Model
 * Represents authentication credentials, hashed passwords, and role access control
 */

const mongoose = require('mongoose');

const userLoginSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, 'Email address is required'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address']
    },
    passwordHash: {
      type: String,
      required: [true, 'Password hash is required']
    },
    role: {
      type: String,
      required: [true, 'User role is required'],
      enum: {
        values: ['Patient', 'Doctor', 'Caregiver'],
        message: '{VALUE} is not a valid user role'
      }
    },
    lastLogin: {
      type: Date,
      default: null
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

const UserLogin = mongoose.model('UserLogin', userLoginSchema);

module.exports = UserLogin;
