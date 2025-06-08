// server/src/controllers/spreads.js
const { Spread, Reading, ReadingCard } = require('../models');
const { TAROT_SPREADS } = require('../../../shared/constants/tarots');
const cardService = require('../services/cardService');
const logger = require('../utils/logger');

/**
 * Получение всех доступных раскладов
 */
const getAvailableSpreads = async (req, res) => {
    try {
        const spreads = Object.values(TAROT_SPREADS).map(spread => ({
            id: spread.id,
            name: spread.name,
            description: spread.description,
            cardCount: spread.positions.length,
            difficulty: spread.difficulty,
            category: spread.category,
            isPremium: spread.isPremium || false
        }));

        res.json({
            success: true,
            spreads
        });

    } catch (error) {
        logger.error('Ошибка получения раскладов:', error);
        res.status(500).json({
            success: false,
            message: 'Не удалось получить расклады'
        });
    }
};

/**
 * Получение подробной информации о раскладе
 */
const getSpreadDetails = async (req, res) => {
    try {
        const { spreadId } = req.params;
        
        const spread = TAROT_SPREADS[spreadId];
        if (!spread) {
            return res.status(404).json({
                success: false,
                message: 'Расклад не найден'
            });
        }

        res.json({
            success: true,
            spread
        });

    } catch (error) {
        logger.error('Ошибка получения деталей расклада:', error);
        res.status(500).json({
            success: false,
            message: 'Не удалось получить детали расклада'
        });
    }
};

/**
 * Создание нового гадания с раскладом
 */
const createSpreadReading = async (req, res) => {
    try {
        const userId = req.user.id;
        const { spreadId, question } = req.body;
        
        if (!spreadId) {
            return res.status(400).json({
                success: false,
                message: 'ID расклада обязателен'
            });
        }

        const spread = TAROT_SPREADS[spreadId];
        if (!spread) {
            return res.status(404).json({
                success: false,
                message: 'Расклад не найден'
            });
        }

        // Проверяем премиум статус для премиум раскладов
        if (spread.isPremium && !req.user.isPremium) {
            return res.status(403).json({
                success: false,
                message: 'Этот расклад доступен только для премиум пользователей',
                upgradeRequired: true
            });
        }

        // Генерируем карты для расклада
        const cards = await cardService.generateSpreadCards(spread.positions.length);
        
        // Создаем запись о гадании
        const reading = await Reading.create({
            userId,
            spreadId,
            question: question || null,
            type: 'spread',
            status: 'completed'
        });

        // Создаем записи о картах в раскладе
        const readingCards = await Promise.all(
            cards.map(async (cardData, index) => {
                return await ReadingCard.create({
                    readingId: reading.id,
                    cardId: cardData.card.id,
                    position: index + 1,
                    isReversed: cardData.isReversed,
                    interpretation: cardData.interpretation
                });
            })
        );

        // Формируем ответ
        const spreadReading = {
            id: reading.id,
            spread,
            question,
            cards: cards.map((cardData, index) => ({
                ...cardData,
                position: spread.positions[index],
                positionMeaning: spread.positions[index].meaning
            })),
            createdAt: reading.createdAt
        };

        res.json({
            success: true,
            reading: spreadReading
        });

    } catch (error) {
        logger.error('Ошибка создания расклада:', error);
        res.status(500).json({
            success: false,
            message: 'Не удалось создать расклад'
        });
    }
};

/**
 * Получение истории раскладов пользователя
 */
const getSpreadHistory = async (req, res) => {
    try {
        const userId = req.user.id;
        const { page = 1, limit = 10, spreadId } = req.query;
        
        const whereClause = {
            userId,
            type: 'spread'
        };
        
        if (spreadId) {
            whereClause.spreadId = spreadId;
        }

        const readings = await Reading.findAndCountAll({
            where: whereClause,
            include: [{
                model: ReadingCard,
                as: 'cards',
                include: ['card']
            }],
            order: [['createdAt', 'DESC']],
            limit: parseInt(limit),
            offset: (parseInt(page) - 1) * parseInt(limit)
        });

        const history = readings.rows.map(reading => {
            const spread = TAROT_SPREADS[reading.spreadId];
            return {
                id: reading.id,
                spreadName: spread?.name || 'Неизвестный расклад',
                question: reading.question,
                cardCount: reading.cards.length,
                createdAt: reading.createdAt,
                spreadId: reading.spreadId
            };
        });

        res.json({
            success: true,
            history,
            pagination: {
                total: readings.count,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(readings.count / parseInt(limit))
            }
        });

    } catch (error) {
        logger.error('Ошибка получения истории раскладов:', error);
        res.status(500).json({
            success: false,
            message: 'Не удалось получить историю раскладов'
        });
    }
};

/**
 * Получение конкретного расклада по ID
 */
const getSpreadReading = async (req, res) => {
    try {
        const { readingId } = req.params;
        const userId = req.user.id;
        
        const reading = await Reading.findOne({
            where: {
                id: readingId,
                userId,
                type: 'spread'
            },
            include: [{
                model: ReadingCard,
                as: 'cards',
                include: ['card'],
                order: [['position', 'ASC']]
            }]
        });

        if (!reading) {
            return res.status(404).json({
                success: false,
                message: 'Расклад не найден'
            });
        }

        const spread = TAROT_SPREADS[reading.spreadId];
        if (!spread) {
            return res.status(404).json({
                success: false,
                message: 'Тип расклада не найден'
            });
        }

        const spreadReading = {
            id: reading.id,
            spread,
            question: reading.question,
            cards: reading.cards.map(readingCard => ({
                card: readingCard.card,
                isReversed: readingCard.isReversed,
                interpretation: readingCard.interpretation,
                position: spread.positions[readingCard.position - 1],
                positionMeaning: spread.positions[readingCard.position - 1]?.meaning
            })),
            createdAt: reading.createdAt
        };

        res.json({
            success: true,
            reading: spreadReading
        });

    } catch (error) {
        logger.error('Ошибка получения расклада:', error);
        res.status(500).json({
            success: false,
            message: 'Не удалось получить расклад'
        });
    }
};

/**
 * Создание пользовательского расклада
 */
const createCustomSpread = async (req, res) => {
    try {
        const userId = req.user.id;
        const { name, description, positions, isPrivate = true } = req.body;
        
        if (!name || !positions || positions.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Название и позиции расклада обязательны'
            });
        }

        if (positions.length > 10) {
            return res.status(400).json({
                success: false,
                message: 'Максимальное количество позиций - 10'
            });
        }

        // Проверяем премиум статус для создания пользовательских раскладов
        if (!req.user.isPremium) {
            return res.status(403).json({
                success: false,
                message: 'Создание пользовательских раскладов доступно только для премиум пользователей',
                upgradeRequired: true
            });
        }

        const customSpread = await Spread.create({
            userId,
            name,
            description,
            positions: JSON.stringify(positions),
            isPrivate,
            isCustom: true
        });

        res.json({
            success: true,
            spread: customSpread
        });

    } catch (error) {
        logger.error('Ошибка создания пользовательского расклада:', error);
        res.status(500).json({
            success: false,
            message: 'Не удалось создать пользовательский расклад'
        });
    }
};

/**
 * Получение пользовательских раскладов
 */
const getUserSpreads = async (req, res) => {
    try {
        const userId = req.user.id;
        
        const spreads = await Spread.findAll({
            where: {
                userId,
                isCustom: true
            },
            order: [['createdAt', 'DESC']]
        });

        res.json({
            success: true,
            spreads: spreads.map(spread => ({
                ...spread.toJSON(),
                positions: JSON.parse(spread.positions)
            }))
        });

    } catch (error) {
        logger.error('Ошибка получения пользовательских раскладов:', error);
        res.status(500).json({
            success: false,
            message: 'Не удалось получить пользовательские расклады'
        });
    }
};

/**
 * Удаление пользовательского расклада
 */
const deleteCustomSpread = async (req, res) => {
    try {
        const { spreadId } = req.params;
        const userId = req.user.id;
        
        const spread = await Spread.findOne({
            where: {
                id: spreadId,
                userId,
                isCustom: true
            }
        });

        if (!spread) {
            return res.status(404).json({
                success: false,
                message: 'Пользовательский расклад не найден'
            });
        }

        await spread.destroy();

        res.json({
            success: true,
            message: 'Пользовательский расклад удален'
        });

    } catch (error) {
        logger.error('Ошибка удаления пользовательского расклада:', error);
        res.status(500).json({
            success: false,
            message: 'Не удалось удалить пользовательский расклад'
        });
    }
};

module.exports = {
    getAvailableSpreads,
    getSpreadDetails,
    createSpreadReading,
    getSpreadHistory,
    getSpreadReading,
    createCustomSpread,
    getUserSpreads,
    deleteCustomSpread
};