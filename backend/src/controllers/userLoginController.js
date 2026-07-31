/**
 * UserLogin Controller
 * Handles CRUD operations for UserLogin authentication records
 */

const mongoose = require('mongoose');
const { UserLogin } = require('../models');
const { sendSuccess, sendError } = require('../utils/responseFormatter');

/**
 * Create a new UserLogin record
 * @route POST /api/user-logins
 */
const createUserLogin = async (req, res) => {
  try {
    const userLogin = await UserLogin.create(req.body);
    // Omit sensitive passwordHash in response output if needed, or return object
    const result = userLogin.toObject();
    delete result.passwordHash;

    return sendSuccess(res, 201, 'User login created successfully', result);
  } catch (error) {
    if (error.name === 'ValidationError') {
      return sendError(res, 400, 'Validation Error', error.errors);
    }
    if (error.code === 11000) {
      return sendError(res, 400, 'Email address already exists');
    }
    return sendError(res, 500, 'Failed to create user login', error.message);
  }
};

/**
 * Retrieve all UserLogin records
 * @route GET /api/user-logins
 */
const getAllUserLogins = async (req, res) => {
  try {
    const userLogins = await UserLogin.find().select('-passwordHash');
    return sendSuccess(res, 200, 'User logins retrieved successfully', userLogins);
  } catch (error) {
    return sendError(res, 500, 'Failed to retrieve user logins', error.message);
  }
};

/**
 * Retrieve a single UserLogin by ObjectId
 * @route GET /api/user-logins/:id
 */
const getUserLoginById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return sendError(res, 400, 'Invalid UserLogin ObjectId format');
    }

    const userLogin = await UserLogin.findById(id).select('-passwordHash');

    if (!userLogin) {
      return sendError(res, 404, `UserLogin with ID ${id} not found`);
    }

    return sendSuccess(res, 200, 'User login retrieved successfully', userLogin);
  } catch (error) {
    return sendError(res, 500, 'Failed to retrieve user login', error.message);
  }
};

/**
 * Update a UserLogin record by ObjectId
 * @route PUT /api/user-logins/:id
 */
const updateUserLogin = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return sendError(res, 400, 'Invalid UserLogin ObjectId format');
    }

    const userLogin = await UserLogin.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true
    }).select('-passwordHash');

    if (!userLogin) {
      return sendError(res, 404, `UserLogin with ID ${id} not found`);
    }

    return sendSuccess(res, 200, 'User login updated successfully', userLogin);
  } catch (error) {
    if (error.name === 'ValidationError') {
      return sendError(res, 400, 'Validation Error', error.errors);
    }
    if (error.code === 11000) {
      return sendError(res, 400, 'Email address already exists');
    }
    return sendError(res, 500, 'Failed to update user login', error.message);
  }
};

/**
 * Delete a UserLogin record by ObjectId
 * @route DELETE /api/user-logins/:id
 */
const deleteUserLogin = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return sendError(res, 400, 'Invalid UserLogin ObjectId format');
    }

    const userLogin = await UserLogin.findByIdAndDelete(id).select('-passwordHash');

    if (!userLogin) {
      return sendError(res, 404, `UserLogin with ID ${id} not found`);
    }

    return sendSuccess(res, 200, 'User login deleted successfully', userLogin);
  } catch (error) {
    return sendError(res, 500, 'Failed to delete user login', error.message);
  }
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
  deleteUserLogin
};
