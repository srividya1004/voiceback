/**
 * VoiceBack Phase C - Context Routes
 * Defines API routes for dynamic context generation and semantic intent submission
 */

const express = require('express');
const router = express.Router();
const contextController = require('../controllers/contextController');

router.post('/generate-options', contextController.generateOptions);
router.post('/submit-intent', contextController.submitIntent);
router.post('/gemini-speech-response', contextController.geminiSpeechRecognize);

module.exports = router;
