// server/src/services/cardService.js
const { Card, Reading, DailyReading, User } = require('../models');
const aiService = require('./aiService');
const logger = require('../utils/logger');
const { Op } = require('sequelize');

class CardService {
    constructor() {
        this.majorArcana = [
            'Шут', 'Маг', 'Жрица', 'Императрица', 'Император', 'Иерофант',
            'Влюбленные', 'Колесница', 'Сила', 'Отшельник', 'Колесо Фортуны',
            'Правосудие', 'Повешенный', 'Смерть', 'Умеренность', 'Дьявол',
            'Башня', 'Звезда', 'Луна', 'Солнце', 'Суд', 'Мир'
        ];
    }

    /**
     * Получение дневной карты пользователя
     */
    async getDailyCard(userId) {
        try {
            const today = new Date().toISOString().split('T')[0];
            
            // Проверяем, есть ли уже дневная карта на сегодня
            let dailyReading = await DailyReading.findOne({
                where: {
                    user_id: userId,
                    reading_date: today
                },
                include: ['card']
            });

            if (dailyReading) {
                return {
                    card: dailyReading.card,
                    isReversed: dailyReading.is_reversed,
                    interpretation: dailyReading.interpretation,
                    date: dailyReading.reading_date
                };
            }

            // Генерируем новую дневную карту
            const randomCard = await this.getRandomCard();
            const isReversed = Math.random() < 0.3; // 30% шанс перевернутой карты
            
            // Получаем профиль пользователя для персонализации
            const user = await User.findOne({ where: { telegram_id: userId } });
            
            // Генерируем персональную интерпретацию
            const interpretation = await aiService.generateDailyCardInterpretation(
                randomCard, 
                isReversed, 
                user
            );

            // Сохраняем дневную карту
            dailyReading = await DailyReading.create({
                user_id: userId,
                card_id: randomCard.id,
                reading_date: today,
                is_reversed: isReversed,
                interpretation: interpretation
            });

            // Обновляем статистику пользователя
            await user.update({
                last_daily_reading: today,
                total_readings: user.total_readings + 1
            });

            return {
                card: randomCard,
                isReversed: isReversed,
                interpretation: interpretation,
                date: today
            };

        } catch (error) {
            logger.error('Ошибка получения дневной карты:', error);
            throw new Error('Не удалось получить дневную карту');
        }
    }

    /**
     * Выполнение расклада карт
     */
    async performReading(userId, spreadType, question, cardsCount = 1) {
        try {
            // Получаем случайные карты
            const cards = await this.getRandomCards(cardsCount);
            
            // Добавляем случайность переворота карт
            const readingCards = cards.map(card => ({
                ...card.toJSON(),
                isReversed: Math.random() < 0.25 // 25% шанс перевернутой карты
            }));

            // Получаем профиль пользователя
            const user = await User.findOne({ where: { telegram_id: userId } });
            
            // Генерируем интерпретацию через AI
            const interpretation = await aiService.generateInterpretation(
                readingCards, 
                question, 
                user
            );

            return {
                cards: readingCards,
                interpretation: interpretation,
                spreadType: spreadType,
                question: question
            };

        } catch (error) {
            logger.error('Ошибка выполнения расклада:', error);
            throw new Error('Не удалось выполнить расклад');
        }
    }

    /**
     * Получение случайной карты
     */
    async getRandomCard() {
        try {
            const count = await Card.count();
            const random = Math.floor(Math.random() * count);
            
            return await Card.findOne({
                offset: random,
                order: [['id', 'ASC']]
            });
        } catch (error) {
            logger.error('Ошибка получения случайной карты:', error);
            throw new Error('Не удалось получить карту');
        }
    }

    /**
     * Получение нескольких случайных карт
     */
    async getRandomCards(count) {
        try {
            const totalCards = await Card.count();
            const cards = [];
            const usedIds = new Set();

            while (cards.length < count && usedIds.size < totalCards) {
                const randomOffset = Math.floor(Math.random() * totalCards);
                
                const card = await Card.findOne({
                    offset: randomOffset,
                    order: [['id', 'ASC']]
                });

                if (card && !usedIds.has(card.id)) {
                    cards.push(card);
                    usedIds.add(card.id);
                }
            }

            return cards;
        } catch (error) {
            logger.error('Ошибка получения случайных карт:', error);
            throw new Error('Не удалось получить карты');
        }
    }

    /**
     * Получение карты по ID
     */
    async getCardById(cardId, userId = null) {
        try {
            const card = await Card.findByPk(cardId);
            
            if (!card) {
                throw new Error('Карта не найдена');
            }

            return card;
        } catch (error) {
            logger.error('Ошибка получения карты по ID:', error);
            throw new Error('Не удалось получить карту');
        }
    }

    /**
     * Получение персональной колоды пользователя
     */
    async getPersonalDeck(userId) {
        try {
            const user = await User.findOne({ 
                where: { telegram_id: userId },
                include: ['personal_decks']
            });

            if (!user || !user.personal_decks || user.personal_decks.length === 0) {
                return null;
            }

            return user.personal_decks[0]; // Возвращаем первую персональную колоду
        } catch (error) {
            logger.error('Ошибка получения персональной колоды:', error);
            throw new Error('Не удалось получить персональную колоду');
        }
    }

    /**
     * Генерация персональной колоды
     */
    async generatePersonalDeck(userId, userProfile) {
        try {
            // Здесь должна быть логика создания персональной колоды
            // на основе профиля пользователя и AI генерации
            
            const deckData = {
                user_id: userId,
                name: `Персональная колода ${userProfile.first_name}`,
                description: 'Колода, созданная специально для вас',
                style: 'personal',
                status: 'generating'
            };

            // Здесь будет создание записи в БД для персональной колоды
            // и запуск фонового процесса генерации карт через AI

            logger.info(`Начата генерация персональной колоды для пользователя ${userId}`);
            
            return deckData;
        } catch (error) {
            logger.error('Ошибка генерации персональной колоды:', error);
            throw new Error('Не удалось создать персональную колоду');
        }
    }

    /**
     * Получение истории гаданий пользователя
     */
    async getReadingHistory(userId, options = {}) {
        try {
            const { limit = 20, offset = 0, category = null } = options;
            
            const whereClause = { user_id: userId };
            
            if (category) {
                whereClause.reading_type = category;
            }

            const readings = await Reading.findAndCountAll({
                where: whereClause,
                limit: limit,
                offset: offset,
                order: [['created_at', 'DESC']],
                include: ['spread_template']
            });

            return readings;
        } catch (error) {
            logger.error('Ошибка получения истории гаданий:', error);
            throw new Error('Не удалось получить историю');
        }
    }

    /**
     * Получение статистики карт пользователя
     */
    async getUserCardStats(userId) {
        try {
            const stats = await Reading.findAll({
                where: { user_id: userId },
                attributes: [
                    [sequelize.fn('COUNT', sequelize.col('id')), 'total_readings'],
                    [sequelize.fn('AVG', sequelize.col('accuracy_rating')), 'avg_accuracy'],
                    [sequelize.fn('COUNT', 
                        sequelize.literal('CASE WHEN accuracy_rating >= 4 THEN 1 END')
                    ), 'accurate_readings']
                ]
            });

            // Статистика по типам раскладов
            const spreadStats = await Reading.findAll({
                where: { user_id: userId },
                attributes: [
                    'reading_type',
                    [sequelize.fn('COUNT', sequelize.col('id')), 'count']
                ],
                group: ['reading_type']
            });

            return {
                totalReadings: stats[0]?.total_readings || 0,
                averageAccuracy: stats[0]?.avg_accuracy || 0,
                accurateReadings: stats[0]?.accurate_readings || 0,
                spreadDistribution: spreadStats
            };
        } catch (error) {
            logger.error('Ошибка получения статистики карт:', error);
            throw new Error('Не удалось получить статистику');
        }
    }

    /**
     * Валидация данных расклада
     */
    validateReadingData(spreadType, question, cardsCount) {
        const allowedSpreadTypes = [
            'one_card', 'three_card', 'celtic_cross', 'relationship', 
            'career', 'health', 'spiritual', 'custom'
        ];

        if (!allowedSpreadTypes.includes(spreadType)) {
            throw new Error('Недопустимый тип расклада');
        }

        if (!question || question.trim().length < 3) {
            throw new Error('Вопрос слишком короткий');
        }

        if (cardsCount < 1 || cardsCount > 10) {
            throw new Error('Недопустимое количество карт');
        }

        return true;
    }

    /**
     * Получение рекомендуемого расклада для пользователя
     */
    async getRecommendedSpread(userId, question) {
        try {
            const user = await User.findOne({ where: { telegram_id: userId } });
            
            // Анализируем вопрос и профиль пользователя для рекомендации
            const questionKeywords = question.toLowerCase();
            
            if (questionKeywords.includes('любовь') || questionKeywords.includes('отношения')) {
                return 'relationship';
            } else if (questionKeywords.includes('работа') || questionKeywords.includes('карьера')) {
                return 'career';
            } else if (questionKeywords.includes('здоровье')) {
                return 'health';
            } else if (user.subscription_type !== 'basic') {
                return 'celtic_cross';
            } else {
                return 'three_card';
            }
        } catch (error) {
            logger.error('Ошибка получения рекомендации расклада:', error);
            return 'one_card';
        }
    }
}

module.exports = new CardService();