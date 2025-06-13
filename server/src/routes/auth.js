// server/src/routes/auth.js
const express = require('express');
const authController = require('../controllers/auth');
const auth = require('../middleware/auth');

const router = express.Router();

// Публичные роуты
router.post('/telegram', authController.telegramAuth);
router.post('/bot', authController.telegramBotAuth);
router.post('/refresh', authController.refreshToken);

// Защищенные роуты (требуют авторизации)
router.get('/profile', auth, authController.getProfile);
router.put('/profile', auth, authController.updateProfile);

// Роуты для bot API
router.get('/user/:telegramId', authController.getUserByTelegramId);
router.put('/user/:telegramId', authController.updateUserByTelegramId);

module.exports = router;