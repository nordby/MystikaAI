// server/src/routes/lunar.js
const express = require('express');
const router = express.Router();
const lunarController = require('../controllers/lunar');
const authMiddleware = require('../middleware/auth');
const logger = require('../utils/logger');

// Middleware для логирования lunar запросов
router.use((req, res, next) => {
  logger.info('Lunar API request', {
    method: req.method,
    path: req.path,
    userAgent: req.get('User-Agent')
  });
  next();
});

// Публичные роуты (для Telegram бота)
router.get('/current', lunarController.getCurrentPhase);
router.get('/calendar', lunarController.getCalendar);
router.get('/personal', lunarController.getPersonalRecommendations);
router.post('/reading', lunarController.getLunarReading);

// Защищенные роуты (для веб-приложения)
router.get('/my-calendar', authMiddleware, lunarController.getMyCalendar);
router.post('/ritual', authMiddleware, lunarController.scheduleRitual);
router.get('/rituals', authMiddleware, lunarController.getMyRituals);

// Административные роуты
router.get('/stats', authMiddleware, lunarController.getStats);

module.exports = router;