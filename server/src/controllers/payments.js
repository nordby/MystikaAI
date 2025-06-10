// server/src/controllers/payments.js
const paymentService = require('../services/paymentService');
const logger = require('../utils/logger');

// Lazy loading for models
const getModels = () => {
  const { Subscription } = require('../models');
  return { Subscription };
};

/**
 * Получение планов подписки
 */
const getSubscriptionPlans = async (req, res) => {
    try {
        const plans = await paymentService.getAvailablePlans();
        
        res.json({
            success: true,
            plans
        });

    } catch (error) {
        logger.error('Ошибка получения планов подписки:', error);
        res.status(500).json({
            success: false,
            message: 'Не удалось получить планы подписки'
        });
    }
};

/**
 * Создание платежа
 */
const createPayment = async (req, res) => {
    try {
        const userId = req.user.id;
        const { planId, paymentMethod = 'card' } = req.body;
        
        if (!planId) {
            return res.status(400).json({
                success: false,
                message: 'ID плана обязателен'
            });
        }

        const payment = await paymentService.createPayment({
            userId,
            planId,
            paymentMethod
        });

        res.json({
            success: true,
            payment
        });

    } catch (error) {
        logger.error('Ошибка создания платежа:', error);
        res.status(500).json({
            success: false,
            message: 'Не удалось создать платеж'
        });
    }
};

/**
 * Подтверждение платежа
 */
const confirmPayment = async (req, res) => {
    try {
        const { paymentId, paymentData } = req.body;
        
        if (!paymentId) {
            return res.status(400).json({
                success: false,
                message: 'ID платежа обязателен'
            });
        }

        const confirmedPayment = await paymentService.confirmPayment({
            paymentId,
            paymentData
        });

        res.json({
            success: true,
            payment: confirmedPayment
        });

    } catch (error) {
        logger.error('Ошибка подтверждения платежа:', error);
        res.status(500).json({
            success: false,
            message: 'Не удалось подтвердить платеж'
        });
    }
};

/**
 * Получение статуса подписки пользователя
 */
const getSubscriptionStatus = async (req, res) => {
    try {
        const userId = req.user.id;
        
        const subscription = await paymentService.getUserSubscription(userId);

        res.json({
            success: true,
            subscription
        });

    } catch (error) {
        logger.error('Ошибка получения статуса подписки:', error);
        res.status(500).json({
            success: false,
            message: 'Не удалось получить статус подписки'
        });
    }
};

/**
 * Отмена подписки
 */
const cancelSubscription = async (req, res) => {
    try {
        const userId = req.user.id;
        
        const canceledSubscription = await paymentService.cancelSubscription(userId);

        res.json({
            success: true,
            subscription: canceledSubscription
        });

    } catch (error) {
        logger.error('Ошибка отмены подписки:', error);
        res.status(500).json({
            success: false,
            message: 'Не удалось отменить подписку'
        });
    }
};

/**
 * Возобновление подписки
 */
const resumeSubscription = async (req, res) => {
    try {
        const userId = req.user.id;
        
        const resumedSubscription = await paymentService.resumeSubscription(userId);

        res.json({
            success: true,
            subscription: resumedSubscription
        });

    } catch (error) {
        logger.error('Ошибка возобновления подписки:', error);
        res.status(500).json({
            success: false,
            message: 'Не удалось возобновить подписку'
        });
    }
};

/**
 * Получение истории платежей
 */
const getPaymentHistory = async (req, res) => {
    try {
        const userId = req.user.id;
        const { page = 1, limit = 10 } = req.query;
        
        const history = await paymentService.getPaymentHistory({
            userId,
            page: parseInt(page),
            limit: parseInt(limit)
        });

        res.json({
            success: true,
            history
        });

    } catch (error) {
        logger.error('Ошибка получения истории платежей:', error);
        res.status(500).json({
            success: false,
            message: 'Не удалось получить историю платежей'
        });
    }
};

/**
 * Webhook для обработки уведомлений о платежах
 */
const handlePaymentWebhook = async (req, res) => {
    try {
        const webhookData = req.body;
        const signature = req.headers['x-payment-signature'];
        
        // Проверяем подпись webhook
        const isValid = await paymentService.verifyWebhookSignature(webhookData, signature);
        
        if (!isValid) {
            return res.status(400).json({
                success: false,
                message: 'Неверная подпись webhook'
            });
        }

        await paymentService.processWebhook(webhookData);

        res.json({
            success: true,
            message: 'Webhook обработан'
        });

    } catch (error) {
        logger.error('Ошибка обработки webhook:', error);
        res.status(500).json({
            success: false,
            message: 'Ошибка обработки webhook'
        });
    }
};

/**
 * Получение счета для оплаты
 */
const getInvoice = async (req, res) => {
    try {
        const { paymentId } = req.params;
        const userId = req.user.id;
        
        const invoice = await paymentService.getInvoice({
            paymentId,
            userId
        });

        res.json({
            success: true,
            invoice
        });

    } catch (error) {
        logger.error('Ошибка получения счета:', error);
        res.status(500).json({
            success: false,
            message: 'Не удалось получить счет'
        });
    }
};

/**
 * Применение промокода
 */
const applyPromoCode = async (req, res) => {
    try {
        const userId = req.user.id;
        const { promoCode, planId } = req.body;
        
        if (!promoCode) {
            return res.status(400).json({
                success: false,
                message: 'Промокод обязателен'
            });
        }

        const discount = await paymentService.applyPromoCode({
            userId,
            promoCode,
            planId
        });

        res.json({
            success: true,
            discount
        });

    } catch (error) {
        logger.error('Ошибка применения промокода:', error);
        res.status(400).json({
            success: false,
            message: error.message || 'Не удалось применить промокод'
        });
    }
};

/**
 * Получение статистики платежей (для админа)
 */
const getPaymentStats = async (req, res) => {
    try {
        // Проверяем права администратора
        if (!req.user.isAdmin) {
            return res.status(403).json({
                success: false,
                message: 'Недостаточно прав'
            });
        }

        const { period = '30d' } = req.query;
        
        const stats = await paymentService.getPaymentStats(period);

        res.json({
            success: true,
            stats
        });

    } catch (error) {
        logger.error('Ошибка получения статистики платежей:', error);
        res.status(500).json({
            success: false,
            message: 'Не удалось получить статистику'
        });
    }
};

module.exports = {
    getSubscriptionPlans,
    createPayment,
    confirmPayment,
    getSubscriptionStatus,
    cancelSubscription,
    resumeSubscription,
    getPaymentHistory,
    handlePaymentWebhook,
    getInvoice,
    applyPromoCode,
    getPaymentStats
};