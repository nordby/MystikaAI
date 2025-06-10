// server/src/routes/numerology.js
const express = require('express');
const router = express.Router();
const numerologyController = require('../controllers/numerology');
const authMiddleware = require('../middleware/auth');
const logger = require('../utils/logger');

// Middleware для логирования numerology запросов
router.use((req, res, next) => {
  logger.info('Numerology API request', {
    method: req.method,
    path: req.path,
    userAgent: req.get('User-Agent')
  });
  next();
});

// Публичные роуты (для Telegram бота)
router.post('/calculate', numerologyController.calculateProfile);
router.get('/profile/:userId', numerologyController.getProfile);
router.post('/compatibility', numerologyController.getCompatibility);

// Защищенные роуты (для веб-приложения)
router.post('/forecast', authMiddleware, numerologyController.getPersonalForecast);
router.post('/analyze-name', authMiddleware, numerologyController.analyzeName);

// Заглушки для отсутствующих методов (временно)
router.get('/my-profile', authMiddleware, (req, res) => {
  res.status(501).json({ success: false, message: 'Method not implemented yet' });
});
router.put('/my-profile', authMiddleware, (req, res) => {
  res.status(501).json({ success: false, message: 'Method not implemented yet' });
});
router.get('/yearly-forecast', authMiddleware, (req, res) => {
  res.status(501).json({ success: false, message: 'Method not implemented yet' });
});
router.get('/stats', authMiddleware, (req, res) => {
  res.status(501).json({ success: false, message: 'Method not implemented yet' });
});

module.exports = router;