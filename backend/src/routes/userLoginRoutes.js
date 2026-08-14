/**
 * UserLogin REST API Routes
 */

const express = require('express');
const router = express.Router();
const userLoginController = require('../controllers/userLoginController');

router.get('/', userLoginController.getAll);
router.get('/me/:id', userLoginController.getMe);
router.get('/me', userLoginController.getMe);
router.get('/:id', userLoginController.getUserLoginById);
router.post('/', userLoginController.create);
router.post('/login', userLoginController.login);
router.put('/:id', userLoginController.update);
router.delete('/:id', userLoginController.delete);

module.exports = router;
