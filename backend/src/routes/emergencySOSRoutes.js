/**
 * EmergencySOS REST API Routes
 */

const express = require('express');
const router = express.Router();
const emergencySOSController = require('../controllers/emergencySOSController');

router.post('/', emergencySOSController.triggerEmergencySOS);
router.get('/', emergencySOSController.getEmergencySOSAlerts);
router.put('/:id', emergencySOSController.updateEmergencySOSStatus);

module.exports = router;
