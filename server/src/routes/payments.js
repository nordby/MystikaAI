// server/src/routes/payments.js
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const rateLimitMiddleware = require('../middleware/rateLimiting');
const paymentsController = require('../controllers/payments');

/**
 * GET /api/payments/plans
 * Получение доступных планов подписки
 */
router.get('/plans', paymentsController.getSubscriptionPlans);

/**
 * POST /api/payments/stars/invoice
 * Создание Telegram Stars invoice
 */
router.post('/stars/invoice',
    authMiddleware,
    rateLimitMiddleware.strictLimiter(),
    paymentsController.createStarsInvoice
);

/**
 * POST /api/payments/stars/pre-checkout
 * Обработка pre-checkout запроса от Telegram
 */
router.post('/stars/pre-checkout',
    rateLimitMiddleware.webhookLimiter(),
    paymentsController.handlePreCheckout
);

/**
 * POST /api/payments/stars/successful-payment
 * Обработка успешного платежа через Telegram Stars
 */
router.post('/stars/successful-payment',
    rateLimitMiddleware.webhookLimiter(),
    paymentsController.handleSuccessfulPayment
);

/**
 * GET /api/payments/subscription/status
 * Получение статуса подписки пользователя
 */
router.get('/subscription/status',
    authMiddleware,
    paymentsController.getSubscriptionStatus
);

/**
 * GET /api/payments/subscription/:userId
 * Получение статуса подписки по ID пользователя (для бота)
 */
router.get('/subscription/:userId',
    paymentsController.getSubscriptionStatus
);

module.exports = router;