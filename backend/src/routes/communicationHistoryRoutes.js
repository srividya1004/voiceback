/**
 * CommunicationHistory REST API Routes
 */

const express = require('express');
const router = express.Router();
const communicationHistoryController = require('../controllers/communicationHistoryController');

router.get('/', communicationHistoryController.getAll);
router.get('/:id', communicationHistoryController.getById);
router.post('/', communicationHistoryController.create);
router.put('/:id', communicationHistoryController.update);
router.delete('/:id', communicationHistoryController.delete);

module.exports = router;
