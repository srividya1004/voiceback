/**
 * UserLogin Service
 * Contains business logic and database operations for UserLogin authentication records
 */

const { UserLogin, Patient, Doctor, Caregiver } = require('../models');
const { validateObjectId } = require('../utils/validationHelper');
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

/**
 * Helper to resolve or auto-create single authoritative profile for a user
 */
const resolveOrCreateProfile = async (user) => {
  let profile = null;
  const normalizedEmail = (user.email || '').trim().toLowerCase();

  if (user.role === 'Doctor') {
    profile = await Doctor.findOne({ userId: user._id });
    if (!profile && normalizedEmail) {
      profile = await Doctor.findOne({ email: normalizedEmail });
    }
    if (!profile) {
      profile = await Doctor.create({
        userId: user._id,
        fullName: normalizedEmail.split('@')[0],
        specialization: 'Speech-Language Pathologist & Neurologist',
        hospitalAffiliation: 'AIIMS Clinical Rehabilitation Center',
        licenseNumber: `LIC-${Math.floor(1000 + Math.random() * 9000)}`,
        email: normalizedEmail
      });
    } else if (!profile.userId || profile.userId.toString() !== user._id.toString()) {
      profile.userId = user._id;
      if (normalizedEmail && !profile.email) profile.email = normalizedEmail;
      await profile.save();
    }
  } else if (user.role === 'Patient') {
    profile = await Patient.findOne({ userId: user._id })
      .populate('assignedDoctorId', 'fullName specialization licenseNumber hospitalAffiliation email phone')
      .populate('assignedCaregiverId', 'fullName phone relationshipToPatient email');
    if (!profile && normalizedEmail) {
      profile = await Patient.findOne({ email: normalizedEmail })
        .populate('assignedDoctorId', 'fullName specialization licenseNumber hospitalAffiliation email phone')
        .populate('assignedCaregiverId', 'fullName phone relationshipToPatient email');
    }
    if (!profile) {
      profile = await Patient.create({
        userId: user._id,
        fullName: normalizedEmail.split('@')[0],
        age: 45,
        aphasiaType: "Broca's",
        email: normalizedEmail
      });
      profile = await Patient.findById(profile._id)
        .populate('assignedDoctorId', 'fullName specialization licenseNumber hospitalAffiliation email phone')
        .populate('assignedCaregiverId', 'fullName phone relationshipToPatient email');
    } else if (!profile.userId || profile.userId.toString() !== user._id.toString()) {
      profile.userId = user._id;
      if (normalizedEmail && !profile.email) profile.email = normalizedEmail;
      await profile.save();
    }
  } else if (user.role === 'Caregiver') {
    profile = await Caregiver.findOne({ userId: user._id })
      .populate({
        path: 'assignedPatients',
        populate: { path: 'assignedDoctorId', select: 'fullName specialization licenseNumber hospitalAffiliation email phone' }
      });
    if (!profile && normalizedEmail) {
      profile = await Caregiver.findOne({ email: normalizedEmail })
        .populate({
          path: 'assignedPatients',
          populate: { path: 'assignedDoctorId', select: 'fullName specialization licenseNumber hospitalAffiliation email phone' }
        });
    }
    if (!profile) {
      profile = await Caregiver.create({
        userId: user._id,
        fullName: normalizedEmail.split('@')[0],
        phone: '9876543210',
        relationshipToPatient: 'Caregiver',
        email: normalizedEmail
      });
      profile = await Caregiver.findById(profile._id)
        .populate({
          path: 'assignedPatients',
          populate: { path: 'assignedDoctorId', select: 'fullName specialization licenseNumber hospitalAffiliation email phone' }
        });
    } else if (!profile.userId || profile.userId.toString() !== user._id.toString()) {
      profile.userId = user._id;
      if (normalizedEmail && !profile.email) profile.email = normalizedEmail;
      await profile.save();
    }
  }

  return profile;
};

/**
 * Create a new UserLogin record (or return existing if email already registered)
 * @param {Object} userData - UserLogin input payload
 * @returns {Promise<Object>} Created/Existing UserLogin document (without passwordHash)
 */
const createUserLogin = async (userData) => {
    const normalizedEmail = (userData.email || '').trim().toLowerCase();
    
    // Check if account already exists
    const existing = await UserLogin.findOne({ email: normalizedEmail });
    if (existing) {
      const result = existing.toObject();
      delete result.passwordHash;
      return result;
    }

    // Hash the password before saving
    const hashedPassword = await bcrypt.hash(userData.passwordHash, 10);
    userData.email = normalizedEmail;
    userData.passwordHash = hashedPassword;

    const userLogin = await UserLogin.create(userData);

    const result = userLogin.toObject();
    delete result.passwordHash;

    return result;
};

/**
 * Retrieve all UserLogin records (excluding passwordHash)
 * @returns {Promise<Array>} List of UserLogin documents
 */
const getAllUserLogins = async () => {
  const userLogins = await UserLogin.find().select('-passwordHash');
  return userLogins;
};

/**
 * Retrieve a single UserLogin by ObjectId (excluding passwordHash)
 * @param {String} id - UserLogin ObjectId
 * @returns {Promise<Object>} UserLogin document
 * @throws {Error} If ID is invalid or user login is not found
 */
const getUserLoginById = async (id) => {
  validateObjectId(id, 'UserLogin');

  const userLogin = await UserLogin.findById(id).select('-passwordHash');

  if (!userLogin) {
    throw new Error(`UserLogin with ID ${id} not found`);
  }

  return userLogin;
};

/**
 * Update a UserLogin record by ObjectId
 * @param {String} id - UserLogin ObjectId
 * @param {Object} updateData - Data fields to update
 * @returns {Promise<Object>} Updated UserLogin document
 * @throws {Error} If ID is invalid or user login is not found
 */
const updateUserLogin = async (id, updateData) => {
  validateObjectId(id, 'UserLogin');

  const userLogin = await UserLogin.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true
  }).select('-passwordHash');

  if (!userLogin) {
    throw new Error(`UserLogin with ID ${id} not found`);
  }

  return userLogin;
};

/**
 * Delete a UserLogin record by ObjectId
 * @param {String} id - UserLogin ObjectId
 * @returns {Promise<Object>} Deleted UserLogin document
 * @throws {Error} If ID is invalid or user login is not found
 */
const deleteUserLogin = async (id) => {
  validateObjectId(id, 'UserLogin');

  const userLogin = await UserLogin.findByIdAndDelete(id).select('-passwordHash');

  if (!userLogin) {
    throw new Error(`UserLogin with ID ${id} not found`);
  }

  return userLogin;
};

/**
 * Get current authenticated user details along with role profile
 */
const getMe = async (userId) => {
  validateObjectId(userId, 'UserLogin');
  const user = await UserLogin.findById(userId).select('-passwordHash');
  if (!user) {
    throw new Error(`User not found`);
  }
  
  const profile = await resolveOrCreateProfile(user);

  return {
    id: user._id,
    email: user.email,
    role: user.role,
    fullName: profile ? profile.fullName : '',
    profile: profile ? profile.toObject() : null
  };
};

/**
 * Login User
 */
const loginUser = async (email, password) => {
  const normalizedEmail = (email || '').trim().toLowerCase();
  
  // Find user by email
  const user = await UserLogin.findOne({ email: normalizedEmail });

  if (!user) {
    throw new Error("No account found. Please register first.");
  }

  // Compare password
  const isMatch = await bcrypt.compare(password, user.passwordHash);

  if (!isMatch) {
    throw new Error("Incorrect password. Please try again.");
  }

  // Resolve or create linked profile
  const profile = await resolveOrCreateProfile(user);

  // Generate JWT Token
  const token = jwt.sign(
    {
      id: user._id,
      email: user.email,
      role: user.role
    },
    process.env.JWT_SECRET || 'voiceback_secret_key',
    {
      expiresIn: "7d"
    }
  );

  return {
    token,
    user: {
      id: user._id,
      email: user.email,
      role: user.role,
      fullName: profile ? profile.fullName : user.email.split('@')[0],
      profile: profile ? profile.toObject() : null
    }
  };
};

module.exports = {
  create: createUserLogin,
  getAll: getAllUserLogins,
  getById: getUserLoginById,
  update: updateUserLogin,
  delete: deleteUserLogin,
  createUserLogin,
  getAllUserLogins,
  getUserLoginById,
  updateUserLogin,
  deleteUserLogin,
  loginUser,
  getMe
};
