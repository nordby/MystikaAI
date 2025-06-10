// server/src/routes/telegram.js
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const rateLimitMiddleware = require('../middleware/rateLimiting');
const telegramService = require('../services/telegramService');
const logger = require('../utils/logger');

/**
 * POST /api/telegram/webhook
 * Webhook для обработки обновлений от Telegram
 */
router.post('/webhook',
    rateLimitMiddleware.webhookLimiter(),
    async (req, res) => {
        try {
            const update = req.body;
            await telegramService.processUpdate(update);
            res.status(200).send('OK');
        } catch (error) {
            logger.error('Ошибка обработки webhook Telegram:', error);
            res.status(500).send('Internal Server Error');
        }
    }
);

/**
 * POST /api/telegram/send-message
 * Отправка сообщения через Telegram бота
 */
router.post('/send-message',
    authMiddleware,
    rateLimitMiddleware.globalLimiter(),
    async (req, res) => {
        try {
            const { chatId, message, options = {} } = req.body;
            
            if (!chatId || !message) {
                return res.status(400).json({
                    success: false,
                    message: 'chatId и message обязательны'
                });
            }

            const result = await telegramService.sendMessage(chatId, message, options);
            
            res.json({
                success: true,
                result
            });

        } catch (error) {
            logger.error('Ошибка отправки сообщения:', error);
            res.status(500).json({
                success: false,
                message: 'Не удалось отправить сообщение'
            });
        }
    }
);

/**
 * POST /api/telegram/send-card
 * Отправка карты Таро через Telegram
 */
router.post('/send-card',
    authMiddleware,
    rateLimitMiddleware.strictLimiter(),
    async (req, res) => {
        try {
            const { chatId, cardData } = req.body;
            
            if (!chatId || !cardData) {
                return res.status(400).json({
                    success: false,
                    message: 'chatId и cardData обязательны'
                });
            }

            const result = await telegramService.sendCard(chatId, cardData);
            
            res.json({
                success: true,
                result
            });

        } catch (error) {
            logger.error('Ошибка отправки карты:', error);
            res.status(500).json({
                success: false,
                message: 'Не удалось отправить карту'
            });
        }
    }
);

/**
 * POST /api/telegram/send-notification
 * Отправка уведомления пользователю
 */
router.post('/send-notification',
    authMiddleware,
    rateLimitMiddleware.globalLimiter(),
    async (req, res) => {
        try {
            const { userId, notification } = req.body;
            
            if (!userId || !notification) {
                return res.status(400).json({
                    success: false,
                    message: 'userId и notification обязательны'
                });
            }

            const result = await telegramService.sendNotification(userId, notification);
            
            res.json({
                success: true,
                result
            });

        } catch (error) {
            logger.error('Ошибка отправки уведомления:', error);
            res.status(500).json({
                success: false,
                message: 'Не удалось отправить уведомление'
            });
        }
    }
);

/**
 * GET /api/telegram/user-info/:telegramId
 * Получение информации о пользователе Telegram
 */
router.get('/user-info/:telegramId',
    authMiddleware,
    async (req, res) => {
        try {
            const { telegramId } = req.params;
            
            const userInfo = await telegramService.getUserInfo(telegramId);
            
            res.json({
                success: true,
                userInfo
            });

        } catch (error) {
            logger.error('Ошибка получения информации о пользователе:', error);
            res.status(500).json({
                success: false,
                message: 'Не удалось получить информацию о пользователе'
            });
        }
    }
);

/**
 * POST /api/telegram/set-webhook
 * Установка webhook для бота (только для админов)
 */
router.post('/set-webhook',
    authMiddleware,
    async (req, res) => {
        try {
            if (!req.user.isAdmin) {
                return res.status(403).json({
                    success: false,
                    message: 'Недостаточно прав'
                });
            }

            const { webhookUrl } = req.body;
            
            if (!webhookUrl) {
                return res.status(400).json({
                    success: false,
                    message: 'webhookUrl обязателен'
                });
            }

            const result = await telegramService.setWebhook(webhookUrl);
            
            res.json({
                success: true,
                result
            });

        } catch (error) {
            logger.error('Ошибка установки webhook:', error);
            res.status(500).json({
                success: false,
                message: 'Не удалось установить webhook'
            });
        }
    }
);

/**
 * DELETE /api/telegram/webhook
 * Удаление webhook (только для админов)
 */
router.delete('/webhook',
    authMiddleware,
    async (req, res) => {
        try {
            if (!req.user.isAdmin) {
                return res.status(403).json({
                    success: false,
                    message: 'Недостаточно прав'
                });
            }

            const result = await telegramService.deleteWebhook();
            
            res.json({
                success: true,
                result
            });

        } catch (error) {
            logger.error('Ошибка удаления webhook:', error);
            res.status(500).json({
                success: false,
                message: 'Не удалось удалить webhook'
            });
        }
    }
);

/**
 * GET /api/telegram/webhook-info
 * Получение информации о webhook (только для админов)
 */
router.get('/webhook-info',
    authMiddleware,
    async (req, res) => {
        try {
            if (!req.user.isAdmin) {
                return res.status(403).json({
                    success: false,
                    message: 'Недостаточно прав'
                });
            }

            const webhookInfo = await telegramService.getWebhookInfo();
            
            res.json({
                success: true,
                webhookInfo
            });

        } catch (error) {
            logger.error('Ошибка получения информации о webhook:', error);
            res.status(500).json({
                success: false,
                message: 'Не удалось получить информацию о webhook'
            });
        }
    }
);

/**
 * POST /api/telegram/broadcast
 * Массовая рассылка сообщений (только для админов)
 */
router.post('/broadcast',
    authMiddleware,
    rateLimitMiddleware.strictLimiter(),
    async (req, res) => {
        try {
            if (!req.user.isAdmin) {
                return res.status(403).json({
                    success: false,
                    message: 'Недостаточно прав'
                });
            }

            const { message, targetUsers, options = {} } = req.body;
            
            if (!message) {
                return res.status(400).json({
                    success: false,
                    message: 'Сообщение обязательно'
                });
            }

            const result = await telegramService.broadcastMessage(message, targetUsers, options);
            
            res.json({
                success: true,
                result
            });

        } catch (error) {
            logger.error('Ошибка массовой рассылки:', error);
            res.status(500).json({
                success: false,
                message: 'Не удалось выполнить рассылку'
            });
        }
    }
);

module.exports = router;