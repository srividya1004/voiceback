/**
 * VoiceProfile REST API Routes
 */

const express = require('express');
const router = express.Router();
const voiceProfileController = require('../controllers/voiceProfileController');

const uploadVoiceSample = require('../middleware/uploadMiddleware');

router.get('/', voiceProfileController.getAll);
router.get('/:id', voiceProfileController.getById);
router.post('/', voiceProfileController.create);
router.put('/:id', voiceProfileController.update);
router.delete('/:id', voiceProfileController.delete);

// ElevenLabs Instant Voice Cloning & Speech Synthesis Routes
router.post('/clone-voice', uploadVoiceSample.single('audioSample'), voiceProfileController.cloneVoiceSample);
router.post('/synthesize', voiceProfileController.synthesizeSpeech);

module.exports = router;
