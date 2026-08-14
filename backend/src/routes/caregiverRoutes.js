/**
 * Caregiver REST API Routes
 */

const express = require('express');
const router = express.Router();
const caregiverController = require('../controllers/caregiverController');

router.get('/', caregiverController.getAll);
router.get('/:id', caregiverController.getById);
router.post('/', caregiverController.create);
router.put('/:id/link-patient', caregiverController.linkPatient);
router.put('/:id', caregiverController.update);
router.delete('/:id', caregiverController.delete);

module.exports = router;
