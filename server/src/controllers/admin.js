// server/src/controllers/admin.js
const User = require('../models/User');
const Payment = require('../models/Payment');
const Reading = require('../models/Reading');
const analyticsService = require('../services/analyticsService');
const notificationService = require('../services/notificationService');
const redis = require('../database/redis');
const { Op } = require('sequelize');
const os = require('os');

class AdminController {
    /**
     * Главный дашборд
     */
    async getDashboard(req, res) {
        try {
            const now = new Date();
            const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

            // Основная статистика
            const [
                totalUsers,
                activeUsers,
                premiumUsers,
                totalReadings,
                totalRevenue,
                todayRegistrations,
                todayPayments
            ] = await Promise.all([
                User.count(),
                User.count({
                    where: {
                        updated_at: { [Op.gte]: last30Days }
                    }
                }),
                User.count({
                    where: {
                        subscription_type: { [Op.ne]: 'basic' }
                    }
                }),
                Reading.count(),
                Payment.sum('amount', {
                    where: { status: 'completed' }
                }) || 0,
                User.count({
                    where: {
                        created_at: { [Op.gte]: today }
                    }
                }),
                Payment.count({
                    where: {
                        status: 'completed',
                        created_at: { [Op.gte]: today }
                    }
                })
            ]);

            // Статистика по дням за последние 30 дней
            const dailyStats = await this.getDailyStats(30);

            // Топ пользователи по активности
            const topUsers = await User.findAll({
                order: [['total_readings', 'DESC']],
                limit: 10,
                attributes: ['id', 'first_name', 'username', 'total_readings', 'subscription_type']
            });

            // Конверсия
            const conversionRate = totalUsers > 0 ? (premiumUsers / totalUsers * 100).toFixed(2) : 0;

            res.json({
                success: true,
                dashboard: {
                    overview: {
                        totalUsers,
                        activeUsers,
                        premiumUsers,
                        totalReadings,
                        totalRevenue,
                        conversionRate: parseFloat(conversionRate),
                        todayRegistrations,
                        todayPayments
                    },
                    dailyStats,
                    topUsers
                }
            });

        } catch (error) {
            console.error('Ошибка получения дашборда:', error);
            res.status(500).json({
                success: false,
                message: 'Ошибка получения данных дашборда'
            });
        }
    }

    /**
     * Статистика пользователей
     */
    async getUserStats(req, res) {
        try {
            const { period = '30d' } = req.query;
            const days = parseInt(period.replace('d', ''));
            const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

            // Статистика по подпискам
            const subscriptionStats = await User.findAll({
                attributes: [
                    'subscription_type',
                    [sequelize.fn('COUNT', sequelize.col('id')), 'count']
                ],
                group: ['subscription_type']
            });

            // Регистрации по дням
            const registrationsByDay = await User.findAll({
                attributes: [
                    [sequelize.fn('DATE', sequelize.col('created_at')), 'date'],
                    [sequelize.fn('COUNT', sequelize.col('id')), 'count']
                ],
                where: {
                    created_at: { [Op.gte]: startDate }
                },
                group: [sequelize.fn('DATE', sequelize.col('created_at'))],
                order: [[sequelize.fn('DATE', sequelize.col('created_at')), 'ASC']]
            });

            // География пользователей (примерная на основе language_code)
            const geography = await User.findAll({
                attributes: [
                    'language_code',
                    [sequelize.fn('COUNT', sequelize.col('id')), 'count']
                ],
                group: ['language_code'],
                order: [[sequelize.fn('COUNT', sequelize.col('id')), 'DESC']]
            });

            res.json({
                success: true,
                stats: {
                    subscriptions: subscriptionStats,
                    registrationsByDay,
                    geography
                }
            });

        } catch (error) {
            console.error('Ошибка получения статистики пользователей:', error);
            res.status(500).json({
                success: false,
                message: 'Ошибка получения статистики'
            });
        }
    }

    /**
     * Список пользователей с фильтрацией
     */
    async getUsers(req, res) {
        try {
            const { 
                page = 1, 
                limit = 50, 
                subscription = null, 
                search = null,
                sortBy = 'created_at',
                sortOrder = 'DESC'
            } = req.query;

            const offset = (page - 1) * limit;
            const whereClause = {};

            // Фильтр по подписке
            if (subscription && subscription !== 'all') {
                whereClause.subscription_type = subscription;
            }

            // Поиск по имени или username
            if (search) {
                whereClause[Op.or] = [
                    { first_name: { [Op.iLike]: `%${search}%` } },
                    { last_name: { [Op.iLike]: `%${search}%` } },
                    { username: { [Op.iLike]: `%${search}%` } }
                ];
            }

            const { rows: users, count } = await User.findAndCountAll({
                where: whereClause,
                order: [[sortBy, sortOrder]],
                limit: parseInt(limit),
                offset: offset,
                attributes: [
                    'id', 'telegram_id', 'username', 'first_name', 'last_name',
                    'subscription_type', 'subscription_expires_at', 'total_readings',
                    'referral_earnings', 'created_at', 'updated_at'
                ]
            });

            res.json({
                success: true,
                users,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(count / limit),
                    totalCount: count,
                    perPage: parseInt(limit)
                }
            });

        } catch (error) {
            console.error('Ошибка получения списка пользователей:', error);
            res.status(500).json({
                success: false,
                message: 'Ошибка получения пользователей'
            });
        }
    }

    /**
     * Системная информация
     */
    async getSystemInfo(req, res) {
        try {
            // Информация о сервере
            const serverInfo = {
                platform: os.platform(),
                arch: os.arch(),
                cpus: os.cpus().length,
                totalMemory: Math.round(os.totalmem() / 1024 / 1024 / 1024) + ' GB',
                freeMemory: Math.round(os.freemem() / 1024 / 1024 / 1024) + ' GB',
                uptime: Math.round(os.uptime() / 3600) + ' hours',
                nodeVersion: process.version
            };

            // Информация о Redis
            let redisInfo = {};
            try {
                const redisInfoRaw = await redis.info();
                redisInfo = {
                    connected: true,
                    version: redisInfoRaw.match(/redis_version:([^\r\n]+)/)?.[1] || 'Unknown',
                    usedMemory: redisInfoRaw.match(/used_memory_human:([^\r\n]+)/)?.[1] || 'Unknown'
                };
            } catch (error) {
                redisInfo = { connected: false, error: error.message };
            }

            // Информация о базе данных
            let dbInfo = {};
            try {
                const [results] = await sequelize.query('SELECT version() as version');
                dbInfo = {
                    connected: true,
                    version: results[0]?.version || 'Unknown'
                };
            } catch (error) {
                dbInfo = { connected: false, error: error.message };
            }

            // Метрики приложения
            const appMetrics = {
                processUptime: Math.round(process.uptime() / 3600) + ' hours',
                memoryUsage: process.memoryUsage(),
                env: process.env.NODE_ENV
            };

            res.json({
                success: true,
                systemInfo: {
                    server: serverInfo,
                    redis: redisInfo,
                    database: dbInfo,
                    application: appMetrics
                }
            });

        } catch (error) {
            console.error('Ошибка получения системной информации:', error);
            res.status(500).json({
                success: false,
                message: 'Ошибка получения системной информации'
            });
        }
    }

    /**
     * Отправка уведомления
     */
    async sendNotification(req, res) {
        try {
            const { message, userIds, subscriptionTypes, sendToAll } = req.body;

            if (!message) {
                return res.status(400).json({
                    success: false,
                    message: 'Сообщение не может быть пустым'
                });
            }

            let targetUsers = [];

            if (sendToAll) {
                // Отправка всем пользователям
                const users = await User.findAll({
                    where: { notifications_enabled: true },
                    attributes: ['telegram_id']
                });
                targetUsers = users.map(user => user.telegram_id);
            } else if (subscriptionTypes && subscriptionTypes.length > 0) {
                // Отправка по типам подписки
                const users = await User.findAll({
                    where: {
                        notifications_enabled: true,
                        subscription_type: { [Op.in]: subscriptionTypes }
                    },
                    attributes: ['telegram_id']
                });
                targetUsers = users.map(user => user.telegram_id);
            } else if (userIds && userIds.length > 0) {
                // Отправка конкретным пользователям
                targetUsers = userIds;
            }

            if (targetUsers.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Не найдены пользователи для отправки'
                });
            }

            // Отправляем уведомления
            await notificationService.sendBulkNotifications(targetUsers, message);

            res.json({
                success: true,
                message: `Уведомление отправлено ${targetUsers.length} пользователям`,
                sentTo: targetUsers.length
            });

        } catch (error) {
            console.error('Ошибка отправки уведомления:', error);
            res.status(500).json({
                success: false,
                message: 'Ошибка отправки уведомления'
            });
        }
    }

    /**
     * Получение статистики по дням
     */
    async getDailyStats(days) {
        const stats = [];
        
        for (let i = days - 1; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];

            const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
            const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);

            const [registrations, payments, readings] = await Promise.all([
                User.count({
                    where: {
                        created_at: {
                            [Op.gte]: dayStart,
                            [Op.lt]: dayEnd
                        }
                    }
                }),
                Payment.sum('amount', {
                    where: {
                        status: 'completed',
                        created_at: {
                            [Op.gte]: dayStart,
                            [Op.lt]: dayEnd
                        }
                    }
                }) || 0,
                Reading.count({
                    where: {
                        created_at: {
                            [Op.gte]: dayStart,
                            [Op.lt]: dayEnd
                        }
                    }
                })
            ]);

            stats.push({
                date: dateStr,
                registrations,
                revenue: payments,
                readings
            });
        }

        return stats;
    }
}

module.exports = new AdminController();