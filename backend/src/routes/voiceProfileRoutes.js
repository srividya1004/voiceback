/**
 * VoiceProfile REST API Routes
 */

const express = require('express');
const router = express.Router();
const voiceProfileController = require('../controllers/voiceProfileController');

router.get('/', voiceProfileController.getAll);
router.get('/:id', voiceProfileController.getById);
router.post('/', voiceProfileController.create);
router.put('/:id', voiceProfileController.update);
router.delete('/:id', voiceProfileController.delete);

module.exports = router;
