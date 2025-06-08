// server/src/controllers/analytics.js
const { Reading, User, Subscription } = require('../models');
const { Op } = require('sequelize');
const logger = require('../utils/logger');

/**
 * Получение аналитики использования приложения (админ)
 */
const getAppAnalytics = async (req, res) => {
    try {
        if (!req.user.isAdmin) {
            return res.status(403).json({
                success: false,
                message: 'Недостаточно прав'
            });
        }

        const { period = '30d' } = req.query;
        const periodDays = parseInt(period.replace('d', ''));
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - periodDays);

        // Общая статистика
        const totalUsers = await User.count();
        const newUsers = await User.count({
            where: {
                createdAt: {
                    [Op.gte]: startDate
                }
            }
        });

        const totalReadings = await Reading.count();
        const newReadings = await Reading.count({
            where: {
                createdAt: {
                    [Op.gte]: startDate
                }
            }
        });

        // Статистика подписок
        const activeSubscriptions = await Subscription.count({
            where: {
                status: 'active'
            }
        });

        const newSubscriptions = await Subscription.count({
            where: {
                status: 'active',
                createdAt: {
                    [Op.gte]: startDate
                }
            }
        });

        // Популярные типы гаданий
        const readingTypes = await Reading.findAll({
            attributes: [
                'type',
                [Reading.sequelize.fn('COUNT', Reading.sequelize.col('type')), 'count']
            ],
            where: {
                createdAt: {
                    [Op.gte]: startDate
                }
            },
            group: ['type'],
            order: [[Reading.sequelize.fn('COUNT', Reading.sequelize.col('type')), 'DESC']]
        });

        // Активность по дням
        const dailyActivity = await Reading.findAll({
            attributes: [
                [Reading.sequelize.fn('DATE', Reading.sequelize.col('createdAt')), 'date'],
                [Reading.sequelize.fn('COUNT', Reading.sequelize.col('id')), 'count']
            ],
            where: {
                createdAt: {
                    [Op.gte]: startDate
                }
            },
            group: [Reading.sequelize.fn('DATE', Reading.sequelize.col('createdAt'))],
            order: [[Reading.sequelize.fn('DATE', Reading.sequelize.col('createdAt')), 'ASC']]
        });

        res.json({
            success: true,
            analytics: {
                overview: {
                    totalUsers,
                    newUsers,
                    totalReadings,
                    newReadings,
                    activeSubscriptions,
                    newSubscriptions
                },
                readingTypes: readingTypes.map(rt => ({
                    type: rt.type,
                    count: parseInt(rt.getDataValue('count'))
                })),
                dailyActivity: dailyActivity.map(da => ({
                    date: da.getDataValue('date'),
                    count: parseInt(da.getDataValue('count'))
                }))
            }
        });

    } catch (error) {
        logger.error('Ошибка получения аналитики:', error);
        res.status(500).json({
            success: false,
            message: 'Не удалось получить аналитику'
        });
    }
};

/**
 * Получение персональной статистики пользователя
 */
const getUserStats = async (req, res) => {
    try {
        const userId = req.user.id;
        
        // Общее количество гаданий
        const totalReadings = await Reading.count({
            where: { userId }
        });

        // Гадания за последний месяц
        const lastMonthStart = new Date();
        lastMonthStart.setMonth(lastMonthStart.getMonth() - 1);
        
        const monthlyReadings = await Reading.count({
            where: {
                userId,
                createdAt: {
                    [Op.gte]: lastMonthStart
                }
            }
        });

        // Любимые типы гаданий
        const favoriteTypes = await Reading.findAll({
            attributes: [
                'type',
                [Reading.sequelize.fn('COUNT', Reading.sequelize.col('type')), 'count']
            ],
            where: { userId },
            group: ['type'],
            order: [[Reading.sequelize.fn('COUNT', Reading.sequelize.col('type')), 'DESC']],
            limit: 5
        });

        // Активность по дням недели
        const weeklyActivity = await Reading.findAll({
            attributes: [
                [Reading.sequelize.fn('DAYOFWEEK', Reading.sequelize.col('createdAt')), 'dayOfWeek'],
                [Reading.sequelize.fn('COUNT', Reading.sequelize.col('id')), 'count']
            ],
            where: { userId },
            group: [Reading.sequelize.fn('DAYOFWEEK', Reading.sequelize.col('createdAt'))],
            order: [[Reading.sequelize.fn('DAYOFWEEK', Reading.sequelize.col('createdAt')), 'ASC']]
        });

        // Первое и последнее гадание
        const firstReading = await Reading.findOne({
            where: { userId },
            order: [['createdAt', 'ASC']]
        });

        const lastReading = await Reading.findOne({
            where: { userId },
            order: [['createdAt', 'DESC']]
        });

        // Расчет страйка (дней подряд)
        const currentStreak = await calculateUserStreak(userId);

        res.json({
            success: true,
            stats: {
                totalReadings,
                monthlyReadings,
                currentStreak,
                favoriteTypes: favoriteTypes.map(ft => ({
                    type: ft.type,
                    count: parseInt(ft.getDataValue('count'))
                })),
                weeklyActivity: weeklyActivity.map(wa => ({
                    dayOfWeek: wa.getDataValue('dayOfWeek'),
                    count: parseInt(wa.getDataValue('count'))
                })),
                firstReading: firstReading?.createdAt,
                lastReading: lastReading?.createdAt
            }
        });

    } catch (error) {
        logger.error('Ошибка получения статистики пользователя:', error);
        res.status(500).json({
            success: false,
            message: 'Не удалось получить статистику'
        });
    }
};

/**
 * Расчет страйка пользователя
 */
async function calculateUserStreak(userId) {
    try {
        const readings = await Reading.findAll({
            where: { userId },
            attributes: [
                [Reading.sequelize.fn('DATE', Reading.sequelize.col('createdAt')), 'date']
            ],
            group: [Reading.sequelize.fn('DATE', Reading.sequelize.col('createdAt'))],
            order: [[Reading.sequelize.fn('DATE', Reading.sequelize.col('createdAt')), 'DESC']]
        });

        if (readings.length === 0) return 0;

        let streak = 0;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        for (let i = 0; i < readings.length; i++) {
            const readingDate = new Date(readings[i].getDataValue('date'));
            const expectedDate = new Date(today);
            expectedDate.setDate(expectedDate.getDate() - i);

            if (readingDate.getTime() === expectedDate.getTime()) {
                streak++;
            } else {
                break;
            }
        }

        return streak;
    } catch (error) {
        logger.error('Ошибка расчета страйка:', error);
        return 0;
    }
}

/**
 * Получение трендов и инсайтов
 */
const getInsights = async (req, res) => {
    try {
        const userId = req.user.id;
        
        // Анализ наиболее частых вопросов/тем
        const recentReadings = await Reading.findAll({
            where: {
                userId,
                question: {
                    [Op.not]: null
                },
                createdAt: {
                    [Op.gte]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
                }
            },
            order: [['createdAt', 'DESC']],
            limit: 50
        });

        // Анализ времени активности
        const hourlyActivity = await Reading.findAll({
            attributes: [
                [Reading.sequelize.fn('HOUR', Reading.sequelize.col('createdAt')), 'hour'],
                [Reading.sequelize.fn('COUNT', Reading.sequelize.col('id')), 'count']
            ],
            where: { userId },
            group: [Reading.sequelize.fn('HOUR', Reading.sequelize.col('createdAt'))],
            order: [[Reading.sequelize.fn('HOUR', Reading.sequelize.col('createdAt')), 'ASC']]
        });

        // Самый активный час
        const mostActiveHour = hourlyActivity.reduce((max, current) => {
            return parseInt(current.getDataValue('count')) > parseInt(max.getDataValue('count')) ? current : max;
        }, hourlyActivity[0]);

        // Рекомендации
        const recommendations = generateRecommendations(recentReadings, hourlyActivity);

        res.json({
            success: true,
            insights: {
                mostActiveHour: mostActiveHour ? {
                    hour: mostActiveHour.getDataValue('hour'),
                    count: parseInt(mostActiveHour.getDataValue('count'))
                } : null,
                hourlyPattern: hourlyActivity.map(ha => ({
                    hour: ha.getDataValue('hour'),
                    count: parseInt(ha.getDataValue('count'))
                })),
                recommendations
            }
        });

    } catch (error) {
        logger.error('Ошибка получения инсайтов:', error);
        res.status(500).json({
            success: false,
            message: 'Не удалось получить инсайты'
        });
    }
};

/**
 * Генерация рекомендаций на основе активности
 */
function generateRecommendations(readings, hourlyActivity) {
    const recommendations = [];

    // Рекомендация по частоте
    if (readings.length < 5) {
        recommendations.push({
            type: 'frequency',
            title: 'Регулярная практика',
            message: 'Попробуйте проводить гадания регулярно для лучшего понимания энергий',
            action: 'daily_card'
        });
    }

    // Рекомендация по времени
    const morningReadings = hourlyActivity.filter(ha => 
        ha.getDataValue('hour') >= 6 && ha.getDataValue('hour') <= 12
    ).reduce((sum, ha) => sum + parseInt(ha.getDataValue('count')), 0);

    const eveningReadings = hourlyActivity.filter(ha => 
        ha.getDataValue('hour') >= 18 && ha.getDataValue('hour') <= 23
    ).reduce((sum, ha) => sum + parseInt(ha.getDataValue('count')), 0);

    if (morningReadings < eveningReadings / 2) {
        recommendations.push({
            type: 'timing',
            title: 'Утренние гадания',
            message: 'Утренние гадания могут помочь настроиться на день',
            action: 'morning_routine'
        });
    }

    // Рекомендация по типам гаданий
    const types = [...new Set(readings.map(r => r.type))];
    if (types.length === 1) {
        recommendations.push({
            type: 'variety',
            title: 'Разнообразие',
            message: 'Попробуйте различные типы гаданий для более полного понимания',
            action: 'explore_spreads'
        });
    }

    return recommendations;
}

/**
 * Экспорт данных пользователя
 */
const exportUserData = async (req, res) => {
    try {
        const userId = req.user.id;
        const { format = 'json' } = req.query;

        const readings = await Reading.findAll({
            where: { userId },
            include: ['cards'],
            order: [['createdAt', 'DESC']]
        });

        const userData = {
            user: {
                id: req.user.id,
                telegramId: req.user.telegramId,
                firstName: req.user.firstName,
                createdAt: req.user.createdAt
            },
            readings: readings.map(reading => ({
                id: reading.id,
                type: reading.type,
                question: reading.question,
                createdAt: reading.createdAt,
                cards: reading.cards || []
            })),
            exportedAt: new Date()
        };

        if (format === 'csv') {
            // Можно добавить экспорт в CSV
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', 'attachment; filename=mystika_data.csv');
            // Здесь должна быть логика конверсии в CSV
            res.send('CSV export not implemented yet');
        } else {
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Content-Disposition', 'attachment; filename=mystika_data.json');
            res.json(userData);
        }

    } catch (error) {
        logger.error('Ошибка экспорта данных:', error);
        res.status(500).json({
            success: false,
            message: 'Не удалось экспортировать данные'
        });
    }
};

module.exports = {
    getAppAnalytics,
    getUserStats,
    getInsights,
    exportUserData
};