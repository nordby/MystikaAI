// server/src/routes/users.js
const express = require('express');
const router = express.Router();
const usersController = require('../controllers/users');
const authMiddleware = require('../middleware/auth');
const logger = require('../utils/logger');

// Middleware для логирования user запросов
router.use((req, res, next) => {
  logger.info('Users API request', {
    method: req.method,
    path: req.path,
    userAgent: req.get('User-Agent')
  });
  next();
});

// Публичные роуты (для Telegram бота)
router.post('/create', usersController.createUser);
router.get('/profile/:telegramId', usersController.getProfileByTelegramId);

// Защищенные роуты (для веб-приложения)
router.get('/me', authMiddleware, usersController.getMyProfile);
router.put('/me', authMiddleware, usersController.updateMyProfile);
router.delete('/me', authMiddleware, usersController.deleteMyAccount);

// Пользовательские данные
router.get('/readings', authMiddleware, usersController.getMyReadings);
router.get('/stats', authMiddleware, usersController.getMyStats);
router.get('/subscription', authMiddleware, usersController.getMySubscription);

// Настройки
router.get('/settings', authMiddleware, usersController.getSettings);
router.put('/settings', authMiddleware, usersController.updateSettings);

// Друзья и рефералы
router.get('/referrals', authMiddleware, usersController.getMyReferrals);
router.post('/refer', authMiddleware, usersController.createReferral);

module.exports = router;