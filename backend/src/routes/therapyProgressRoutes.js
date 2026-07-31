/**
 * TherapyProgress REST API Routes
 */

const express = require('express');
const router = express.Router();
const therapyProgressController = require('../controllers/therapyProgressController');

router.get('/', therapyProgressController.getAll);
router.get('/:id', therapyProgressController.getById);
router.post('/', therapyProgressController.create);
router.put('/:id', therapyProgressController.update);
router.delete('/:id', therapyProgressController.delete);

module.exports = router;
