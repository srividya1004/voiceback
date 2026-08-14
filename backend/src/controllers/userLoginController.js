/**
 * UserLogin Controller
 * Handles HTTP request/response orchestration for UserLogin authentication records using UserLogin Service.
 */

const userLoginService = require('../services/userLoginService');
const { sendSuccess, sendError } = require('../utils/responseFormatter');

/**
 * Create a new UserLogin record
 * @route POST /api/user-logins
 */
const createUserLogin = async (req, res) => {
  try {
    const result = await userLoginService.create(req.body);
    return sendSuccess(res, 201, 'User login created successfully', result);
  } catch (error) {
    if (error.name === 'ValidationError') {
      return sendError(res, 400, 'Validation Error', error.errors);
    }
    if (error.code === 11000 || error.message.includes('already exists')) {
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
    const userLogins = await userLoginService.getAll();
    return sendSuccess(res, 200, 'User logins retrieved successfully', userLogins);
  } catch (error) {
    return sendError(res, 500, 'Failed to retrieve user logins', error.message);
  }
};

/**
 * Retrieve current user profile
 * @route GET /api/user-logins/me or /me/:id
 */
const getMe = async (req, res) => {
  try {
    const userId = req.params.id || req.query.userId;
    if (!userId) {
      return sendError(res, 400, 'User ID parameter is required');
    }
    const result = await userLoginService.getMe(userId);
    return sendSuccess(res, 200, 'User profile retrieved successfully', result);
  } catch (error) {
    return sendError(res, 500, 'Failed to retrieve user profile', error.message);
  }
};

/**
 * Retrieve a single UserLogin by ObjectId
 * @route GET /api/user-logins/:id
 */
const getUserLoginById = async (req, res) => {
  try {
    const { id } = req.params;
    const userLogin = await userLoginService.getById(id);
    return sendSuccess(res, 200, 'User login retrieved successfully', userLogin);
  } catch (error) {
    if (error.message.includes('Invalid')) {
      return sendError(res, 400, error.message);
    }
    if (error.message.includes('not found')) {
      return sendError(res, 404, error.message);
    }
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
    const userLogin = await userLoginService.update(id, req.body);
    return sendSuccess(res, 200, 'User login updated successfully', userLogin);
  } catch (error) {
    if (error.name === 'ValidationError' || error.message.includes('Invalid')) {
      return sendError(res, 400, error.message, error.errors);
    }
    if (error.code === 11000 || error.message.includes('already exists')) {
      return sendError(res, 400, 'Email address already exists');
    }
    if (error.message.includes('not found')) {
      return sendError(res, 404, error.message);
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
    const userLogin = await userLoginService.delete(id);
    return sendSuccess(res, 200, 'User login deleted successfully', userLogin);
  } catch (error) {
    if (error.message.includes('Invalid')) {
      return sendError(res, 400, error.message);
    }
    if (error.message.includes('not found')) {
      return sendError(res, 404, error.message);
    }
    return sendError(res, 500, 'Failed to delete user login', error.message);
  }
};

/**
 * User login
 * @route POST /api/user-logins/login
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return sendError(res, 400, 'Email and password are required');
    }
    const result = await userLoginService.loginUser(email, password);
    return sendSuccess(res, 200, 'Login successful', result);
  } catch (error) {
    if (error.message.includes('Invalid') || error.message.includes('Incorrect') || error.message.includes('No account')) {
      return sendError(res, 401, error.message);
    }
    return sendError(res, 500, 'Failed to login', error.message);
  }
};

module.exports = {
  create: createUserLogin,
  getAll: getAllUserLogins,
  getById: getUserLoginById,
  getMe,
  update: updateUserLogin,
  delete: deleteUserLogin,
  login,
  loginUser: login,
  createUserLogin,
  getAllUserLogins,
  getUserLoginById,
  updateUserLogin,
  deleteUserLogin
};
