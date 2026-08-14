/**
 * VoiceProfile REST API Routes
 */

const express = require('express');
const router = express.Router();
const voiceProfileController = require('../controllers/voiceProfileController');

const uploadVoiceSample = require('../middleware/uploadMiddleware');

// ElevenLabs Instant Voice Cloning, Speech Synthesis & Scribe STT Routes (must come before /:id)
router.post('/clone-voice', uploadVoiceSample.single('audioSample'), voiceProfileController.cloneVoiceSample);
router.post('/synthesize', voiceProfileController.synthesizeSpeech);
router.post('/transcribe', uploadVoiceSample.single('audioSample'), voiceProfileController.transcribeSpeech);

// Entity CRUD Routes
router.get('/', voiceProfileController.getAll);
router.post('/', voiceProfileController.create);
router.get('/:id', voiceProfileController.getById);
router.put('/:id', voiceProfileController.update);
router.delete('/:id', voiceProfileController.delete);

module.exports = router;


