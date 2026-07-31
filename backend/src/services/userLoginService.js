/**
 * UserLogin Service
 * Contains business logic and database operations for UserLogin authentication records
 */

const { UserLogin } = require('../models');
const { validateObjectId } = require('../utils/validationHelper');
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

/**
 * Create a new UserLogin record
 * @param {Object} userData - UserLogin input payload
 * @returns {Promise<Object>} Created UserLogin document (without passwordHash)
 */
const createUserLogin = async (userData) => {
    // Hash the password before saving
    const hashedPassword = await bcrypt.hash(userData.passwordHash, 10);

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
 * Login User
 */
const loginUser = async (email, password) => {

  // Find user by email
  const user = await UserLogin.findOne({ email });

  if (!user) {
    throw new Error("Invalid email or password");
  }

  // Compare password
  const isMatch = await bcrypt.compare(password, user.passwordHash);

  if (!isMatch) {
    throw new Error("Invalid email or password");
  }

  // Generate JWT Token
  const token = jwt.sign(
    {
      id: user._id,
      email: user.email,
      role: user.role
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "7d"
    }
  );

  return {
    token,
    user: {
      id: user._id,
      email: user.email,
      role: user.role
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
  loginUser
};

