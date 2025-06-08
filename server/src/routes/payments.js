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
 * POST /api/payments/create
 * Создание платежа
 */
router.post('/create',
    authMiddleware,
    rateLimitMiddleware({ windowMs: 15 * 60 * 1000, max: 10 }),
    paymentsController.createPayment
);

/**
 * POST /api/payments/confirm
 * Подтверждение платежа
 */
router.post('/confirm',
    authMiddleware,
    rateLimitMiddleware({ windowMs: 15 * 60 * 1000, max: 20 }),
    paymentsController.confirmPayment
);

/**
 * GET /api/payments/subscription
 * Получение статуса подписки пользователя
 */
router.get('/subscription',
    authMiddleware,
    paymentsController.getSubscriptionStatus
);

/**
 * POST /api/payments/cancel-subscription
 * Отмена подписки
 */
router.post('/cancel-subscription',
    authMiddleware,
    rateLimitMiddleware({ windowMs: 60 * 60 * 1000, max: 3 }),
    paymentsController.cancelSubscription
);

/**
 * POST /api/payments/resume-subscription
 * Возобновление подписки
 */
router.post('/resume-subscription',
    authMiddleware,
    rateLimitMiddleware({ windowMs: 60 * 60 * 1000, max: 5 }),
    paymentsController.resumeSubscription
);

/**
 * GET /api/payments/history
 * Получение истории платежей
 */
router.get('/history',
    authMiddleware,
    paymentsController.getPaymentHistory
);

/**
 * GET /api/payments/invoice/:paymentId
 * Получение счета для оплаты
 */
router.get('/invoice/:paymentId',
    authMiddleware,
    paymentsController.getInvoice
);

/**
 * POST /api/payments/promo-code
 * Применение промокода
 */
router.post('/promo-code',
    authMiddleware,
    rateLimitMiddleware({ windowMs: 60 * 60 * 1000, max: 10 }),
    paymentsController.applyPromoCode
);

/**
 * POST /api/payments/webhook
 * Webhook для обработки уведомлений о платежах
 */
router.post('/webhook',
    rateLimitMiddleware({ windowMs: 60 * 1000, max: 100 }),
    paymentsController.handlePaymentWebhook
);

/**
 * GET /api/payments/stats
 * Получение статистики платежей (только для админов)
 */
router.get('/stats',
    authMiddleware,
    paymentsController.getPaymentStats
);

module.exports = router;