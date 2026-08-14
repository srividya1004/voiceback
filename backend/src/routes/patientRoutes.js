/**
 * Patient REST API Routes
 */

const express = require('express');
const router = express.Router();
const patientController = require('../controllers/patientController');

router.get('/', patientController.getAll);
router.get('/:id', patientController.getById);
router.post('/', patientController.create);
router.put('/:id/assign-doctor', patientController.assignDoctor);
router.put('/:id', patientController.update);
router.delete('/:id', patientController.delete);

module.exports = router;
