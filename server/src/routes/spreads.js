// server/src/routes/spreads.js
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const rateLimitMiddleware = require('../middleware/rateLimiting');
const spreadsController = require('../controllers/spreads');

/**
 * GET /api/spreads
 * Получение всех доступных раскладов
 */
router.get('/', spreadsController.getAvailableSpreads);

/**
 * GET /api/spreads/:spreadId
 * Получение подробной информации о раскладе
 */
router.get('/:spreadId', spreadsController.getSpreadDetails);

/**
 * POST /api/spreads/reading
 * Создание нового гадания с раскладом
 */
router.post('/reading',
    authMiddleware,
    rateLimitMiddleware({ windowMs: 15 * 60 * 1000, max: 20 }),
    spreadsController.createSpreadReading
);

/**
 * GET /api/spreads/reading/history
 * Получение истории раскладов пользователя
 */
router.get('/reading/history',
    authMiddleware,
    spreadsController.getSpreadHistory
);

/**
 * GET /api/spreads/reading/:readingId
 * Получение конкретного расклада по ID
 */
router.get('/reading/:readingId',
    authMiddleware,
    spreadsController.getSpreadReading
);

/**
 * POST /api/spreads/custom
 * Создание пользовательского расклада
 */
router.post('/custom',
    authMiddleware,
    rateLimitMiddleware({ windowMs: 60 * 60 * 1000, max: 5 }),
    spreadsController.createCustomSpread
);

/**
 * GET /api/spreads/custom/my
 * Получение пользовательских раскладов
 */
router.get('/custom/my',
    authMiddleware,
    spreadsController.getUserSpreads
);

/**
 * DELETE /api/spreads/custom/:spreadId
 * Удаление пользовательского расклада
 */
router.delete('/custom/:spreadId',
    authMiddleware,
    spreadsController.deleteCustomSpread
);

module.exports = router;