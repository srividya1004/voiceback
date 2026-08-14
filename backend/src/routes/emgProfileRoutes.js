/**
 * EMGProfile REST API Routes
 */

const express = require('express');
const router = express.Router();
const emgProfileController = require('../controllers/emgProfileController');

router.get('/', emgProfileController.getAll);
router.post('/predict', emgProfileController.predictEMGIntent);
router.get('/:id', emgProfileController.getById);
router.post('/', emgProfileController.create);
router.put('/:id', emgProfileController.update);
router.delete('/:id', emgProfileController.delete);

module.exports = router;
