/**
 * PersonalScript REST API Routes
 * Hear-Yourself Script Training endpoints protected by JWT authentication
 */

const express = require('express');
const router = express.Router();
const personalScriptController = require('../controllers/personalScriptController');
const uploadVoiceSample = require('../middleware/uploadMiddleware');
const authMiddleware = require('../middleware/authMiddleware');

// Protect all PersonalScript routes with JWT Bearer authentication
router.use(authMiddleware);

// Script Training Attempt (accepts multipart audio recording)
router.post('/:scriptId/attempt', uploadVoiceSample.single('audioSample'), personalScriptController.submitScriptAttempt);

// Script Management CRUD
router.post('/', personalScriptController.createScript);
router.get('/:patientId', personalScriptController.getScriptsByPatient);
router.delete('/:scriptId', personalScriptController.deleteScript);

module.exports = router;
