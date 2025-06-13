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

// Параллельная генерация нескольких изображений карт
router.post('/generate-multiple-cards', async (req, res) => {
  try {
    const { cards, style = 'mystic', maxConcurrent = 3 } = req.body;

    if (!cards || !Array.isArray(cards) || cards.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Cards array is required'
      });
    }

    logger.info('Starting parallel card generation', {
      cardCount: cards.length,
      style,
      maxConcurrent
    });

    const result = await kandinskyService.generateMultipleCardImages(cards, {
      style,
      maxConcurrent
    });

    res.json(result);

  } catch (error) {
    logger.error('Multiple cards generation endpoint error', {
      error: error.message,
      cardCount: req.body.cards?.length
    });

    res.status(500).json({
      success: false,
      message: 'Failed to generate multiple card images'
    });
  }
});

// Предварительная генерация популярных карт
router.post('/pregenerate-cards', async (req, res) => {
  try {
    const { 
      popularCards, 
      styles = ['mystic', 'classic'], 
      priority = 'low',
      delay = 5000 
    } = req.body;

    if (!popularCards || !Array.isArray(popularCards) || popularCards.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Popular cards array is required'
      });
    }

    const result = await kandinskyService.preGeneratePopularCards(popularCards, styles, {
      priority,
      delay
    });

    res.json(result);

  } catch (error) {
    logger.error('Pre-generation endpoint error', {
      error: error.message,
      cardCount: req.body.popularCards?.length
    });

    res.status(500).json({
      success: false,
      message: 'Failed to start pre-generation'
    });
  }
});

// Генерация с fallback
router.post('/generate-card-with-fallback', async (req, res) => {
  try {
    const { 
      cardName, 
      cardDescription, 
      style = 'mystic',
      timeout = 30000,
      mockFallback = true 
    } = req.body;

    if (!cardName) {
      return res.status(400).json({
        success: false,
        message: 'Card name is required'
      });
    }

    const result = await kandinskyService.generateCardImageWithFallback(
      cardName,
      cardDescription || 'Карта Таро',
      { style, timeout, mockFallback }
    );

    res.json(result);

  } catch (error) {
    logger.error('Fallback generation endpoint error', {
      error: error.message,
      cardName: req.body.cardName
    });

    res.status(500).json({
      success: false,
      message: 'Failed to generate card image with fallback'
    });
  }
});

// Получение списка доступных стилей
router.get('/styles', async (req, res) => {
  try {
    const styles = kandinskyService.getAvailableStyles();
    
    res.json({
      success: true,
      styles,
      count: Object.keys(styles).length
    });

  } catch (error) {
    logger.error('Styles endpoint error', { error: error.message });

    res.status(500).json({
      success: false,
      message: 'Failed to get available styles'
    });
  }
});

// Тестовая генерация
router.post('/test-generation', async (req, res) => {
  try {
    const result = await kandinskyService.testGeneration();
    res.json(result);

  } catch (error) {
    logger.error('Test generation endpoint error', { error: error.message });

    res.status(500).json({
      success: false,
      message: 'Test generation failed'
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
    endpoints: {
      'generate-card-image': 'Single card generation',
      'generate-multiple-cards': 'Parallel cards generation',
      'generate-spread-images': 'Full spread generation',
      'pregenerate-cards': 'Background pre-generation',
      'generate-card-with-fallback': 'Generation with mock fallback',
      'styles': 'Available deck styles',
      'test-generation': 'API test generation',
      'kandinsky/health': 'Service health check'
    },
    timestamp: new Date().toISOString()
  });
});

// Простой middleware для ограничения запросов
const simpleRateLimit = (req, res, next) => {
  // Пропускаем все запросы для начала
  next();
};

module.exports = router;