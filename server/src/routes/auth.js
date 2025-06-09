// server/src/routes/auth.js
const express = require('express');
const authController = require('../controllers/auth');

const router = express.Router();

// Публичные роуты
router.post('/telegram', authController.telegramAuth);
router.post('/bot', authController.telegramBotAuth);
router.post('/refresh', authController.refreshToken);
router.get('/profile', authController.getProfile);
router.get('/user/:telegramId', authController.getUserByTelegramId);
router.put('/user/:telegramId', authController.updateUserByTelegramId);

module.exports = router;