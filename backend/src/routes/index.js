/**
 * VoiceBack API Routes Index
 * Combines and exports all REST API entity routes
 */

const express = require('express');
const router = express.Router();

const patientRoutes = require('./patientRoutes');
const doctorRoutes = require('./doctorRoutes');
const caregiverRoutes = require('./caregiverRoutes');
const userLoginRoutes = require('./userLoginRoutes');
const voiceProfileRoutes = require('./voiceProfileRoutes');
const emgProfileRoutes = require('./emgProfileRoutes');
const therapyProgressRoutes = require('./therapyProgressRoutes');
const communicationHistoryRoutes = require('./communicationHistoryRoutes');
const appointmentRoutes = require('./appointmentRoutes');

// Mount entity routes
router.use('/patients', patientRoutes);
router.use('/doctors', doctorRoutes);
router.use('/caregivers', caregiverRoutes);
router.use('/user-logins', userLoginRoutes);
router.use('/voice-profiles', voiceProfileRoutes);
router.use('/emg-profiles', emgProfileRoutes);
router.use('/therapy-progress', therapyProgressRoutes);
router.use('/communication-history', communicationHistoryRoutes);
router.use('/appointments', appointmentRoutes);

module.exports = router;
