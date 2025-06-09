// server/src/routes/ai.js
const express = require('express');
const router = express.Router();
const aiController = require('../controllers/ai');
const kandinskyService = require('../services/kandinskyService');
const logger = require('../utils/logger');

// Публичные роуты (для бота)
router.post('/interpret', aiController.interpretReading);

// Генерация изображения карты
router.post('/generate-card-image', async (req, res) => {
  try {
    const { cardName, cardDescription, style = 'mystic' } = req.body;

    if (!cardName) {
      return res.status(400).json({
        success: false,
        message: 'Card name is required'
      });
    }

    const result = await kandinskyService.generateCardImage(
      cardName,
      cardDescription || 'Карта Таро',
      { style }
    );

    res.json(result);

  } catch (error) {
    logger.error('Image generation endpoint error', {
      error: error.message,
      cardName: req.body.cardName
    });

    res.status(500).json({
      success: false,
      message: 'Failed to generate card image'
    });
  }
});

// Генерация изображений для всего расклада
router.post('/generate-spread-images', async (req, res) => {
  try {
    const { cards, spreadType } = req.body;

    if (!cards || !Array.isArray(cards) || cards.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Cards array is required'
      });
    }

    const result = await kandinskyService.generateSpreadImages(cards, spreadType);

    res.json(result);

  } catch (error) {
    logger.error('Spread images generation endpoint error', {
      error: error.message,
      cardCount: req.body.cards?.length
    });

    res.status(500).json({
      success: false,
      message: 'Failed to generate spread images'
    });
  }
});

// Проверка доступности Kandinsky API
router.get('/kandinsky/health', async (req, res) => {
  try {
    const health = await kandinskyService.checkServiceHealth();
    res.json({
      success: true,
      kandinsky: health,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Проверка доступности функций AI
router.get('/health', async (req, res) => {
  res.json({
    success: true,
    status: 'AI services available',
    models: ['claude-3-5-haiku-20241022'],
    kandinsky: 'available',
    timestamp: new Date().toISOString()
  });
});

// Простой middleware для ограничения запросов
const simpleRateLimit = (req, res, next) => {
  // Пропускаем все запросы для начала
  next();
};

module.exports = router;