// server/src/controllers/cards.js
const { Card, DailyReading, User, PersonalDeck } = require('../models');
const cardService = require('../services/cardService');
const aiService = require('../services/aiService');
const logger = require('../utils/logger');
const { Op } = require('sequelize');

class CardsController {
    /**
     * Получение дневной карты
     */
    async getDailyCard(req, res) {
        try {
            const userId = req.user.userId;
            
            // Проверяем лимиты для бесплатных пользователей
            if (!await this.checkDailyCardLimit(userId)) {
                return res.status(429).json({
                    success: false,
                    message: 'Дневная карта уже получена сегодня',
                    upgradeRequired: true
                });
            }

            const dailyCard = await cardService.getDailyCard(userId);

            res.json({
                success: true,
                card: dailyCard.card,
                isReversed: dailyCard.isReversed,
                interpretation: dailyCard.interpretation,
                date: dailyCard.date
            });

        } catch (error) {
            logger.error('Ошибка получения дневной карты:', error);
            res.status(500).json({
                success: false,
                message: 'Не удалось получить дневную карту'
            });
        }
    }

    /**
     * Получение персональной колоды
     */
    async getPersonalDeck(req, res) {
        try {
            const userId = req.user.userId;
            
            const deck = await cardService.getPersonalDeck(userId);
            
            if (!deck) {
                return res.status(404).json({
                    success: false,
                    message: 'Персональная колода не найдена'
                });
            }

            res.json({
                success: true,
                deck: deck
            });

        } catch (error) {
            logger.error('Ошибка получения персональной колоды:', error);
            res.status(500).json({
                success: false,
                message: 'Не удалось получить колоду'
            });
        }
    }

    /**
     * Генерация персональной колоды
     */
    async generatePersonalDeck(req, res) {
        try {
            const userId = req.user.userId;
            
            // Проверяем подписку
            if (!await this.checkPremiumSubscription(userId)) {
                return res.status(403).json({
                    success: false,
                    message: 'Функция доступна только для премиум пользователей',
                    upgradeRequired: true
                });
            }

            const userProfile = await this.getUserProfile(userId);
            const deck = await cardService.generatePersonalDeck(userId, userProfile);

            res.json({
                success: true,
                message: 'Персональная колода создается',
                deck: deck,
                estimatedTime: '10-15 минут'
            });

        } catch (error) {
            logger.error('Ошибка генерации персональной колоды:', error);
            res.status(500).json({
                success: false,
                message: 'Не удалось создать персональную колоду'
            });
        }
    }

    /**
     * Генерация отдельной карты
     */
    async generateCard(req, res) {
        try {
            const userId = req.user.userId;
            const { cardName, cardMeaning, style } = req.body;

            // Проверяем лимиты
            if (!await this.checkGenerationLimit(userId)) {
                return res.status(429).json({
                    success: false,
                    message: 'Превышен лимит генерации карт',
                    upgradeRequired: true
                });
            }

            const userProfile = await this.getUserProfile(userId);
            
            const imageUrl = await aiService.generateCardImage(
                cardName,
                cardMeaning,
                userProfile.photo_url,
                style || 'mystical'
            );

            res.json({
                success: true,
                imageUrl: imageUrl,
                cardName: cardName
            });

        } catch (error) {
            logger.error('Ошибка генерации карты:', error);
            res.status(500).json({
                success: false,
                message: 'Не удалось сгенерировать карту'
            });
        }
    }

    /**
     * Получение значения карты
     */
    async getCardMeaning(req, res) {
        try {
            const { cardId } = req.params;
            const userId = req.user.userId;

            const card = await cardService.getCardById(cardId, userId);

            if (!card) {
                return res.status(404).json({
                    success: false,
                    message: 'Карта не найдена'
                });
            }

            res.json({
                success: true,
                card: {
                    id: card.id,
                    name: card.card_name,
                    meaning: card.card_meaning,
                    reversed_meaning: card.reversed_meaning,
                    image_url: card.image_url,
                    suit: card.suit,
                    rank: card.rank,
                    is_major_arcana: card.is_major_arcana,
                    element: card.element,
                    planet: card.planet,
                    zodiac_sign: card.zodiac_sign
                }
            });

        } catch (error) {
            logger.error('Ошибка получения значения карты:', error);
            res.status(500).json({
                success: false,
                message: 'Не удалось получить значение карты'
            });
        }
    }

    /**
     * Создание NFT из карты
     */
    async createNFT(req, res) {
        try {
            const { cardId } = req.params;
            const userId = req.user.userId;

            // Проверяем подписку Гранд Мастер
            if (!await this.checkGrandMasterSubscription(userId)) {
                return res.status(403).json({
                    success: false,
                    message: 'Функция доступна только для Гранд Мастер подписки',
                    upgradeRequired: true
                });
            }

            const card = await cardService.getCardById(cardId, userId);
            
            if (!card) {
                return res.status(404).json({
                    success: false,
                    message: 'Карта не найдена'
                });
            }

            if (card.nft_token_id) {
                return res.status(400).json({
                    success: false,
                    message: 'NFT для этой карты уже создан'
                });
            }

            // Здесь должна быть интеграция с блокчейном для создания NFT
            const nftData = await this.createNFTToken(card);

            await card.update({
                nft_token_id: nftData.tokenId,
                nft_metadata: nftData.metadata
            });

            res.json({
                success: true,
                message: 'NFT успешно создан',
                nft: nftData
            });

        } catch (error) {
            logger.error('Ошибка создания NFT:', error);
            res.status(500).json({
                success: false,
                message: 'Не удалось создать NFT'
            });
        }
    }

    /**
     * Получение статистики карт пользователя
     */
    async getCardStats(req, res) {
        try {
            const userId = req.user.userId;
            
            const stats = await cardService.getUserCardStats(userId);

            res.json({
                success: true,
                stats: stats
            });

        } catch (error) {
            logger.error('Ошибка получения статистики карт:', error);
            res.status(500).json({
                success: false,
                message: 'Не удалось получить статистику'
            });
        }
    }

    /**
     * Получение истории дневных карт
     */
    async getDailyCardHistory(req, res) {
        try {
            const userId = req.user.userId;
            const { limit = 30, offset = 0 } = req.query;

            const history = await DailyReading.findAndCountAll({
                where: { user_id: userId },
                include: [{
                    model: Card,
                    as: 'card',
                    attributes: ['id', 'card_name', 'image_url', 'is_major_arcana']
                }],
                order: [['reading_date', 'DESC']],
                limit: parseInt(limit),
                offset: parseInt(offset)
            });

            res.json({
                success: true,
                history: history.rows.map(reading => ({
                    id: reading.id,
                    date: reading.reading_date,
                    card: reading.card,
                    isReversed: reading.is_reversed,
                    interpretation: reading.interpretation.substring(0, 200) + '...'
                })),
                pagination: {
                    total: history.count,
                    limit: parseInt(limit),
                    offset: parseInt(offset),
                    hasMore: history.count > parseInt(offset) + parseInt(limit)
                }
            });

        } catch (error) {
            logger.error('Ошибка получения истории дневных карт:', error);
            res.status(500).json({
                success: false,
                message: 'Не удалось получить историю'
            });
        }
    }

    /**
     * Избранные карты пользователя
     */
    async addToFavorites(req, res) {
        try {
            const userId = req.user.userId;
            const { cardId } = req.params;

            const user = await User.findOne({ where: { telegram_id: userId } });
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'Пользователь не найден'
                });
            }

            const card = await Card.findByPk(cardId);
            if (!card) {
                return res.status(404).json({
                    success: false,
                    message: 'Карта не найдена'
                });
            }

            // Добавляем карту в избранное (предполагается связь many-to-many)
            await user.addFavoriteCard(card);

            res.json({
                success: true,
                message: 'Карта добавлена в избранное'
            });

        } catch (error) {
            logger.error('Ошибка добавления в избранное:', error);
            res.status(500).json({
                success: false,
                message: 'Не удалось добавить карту в избранное'
            });
        }
    }

    /**
     * Проверка лимита дневной карты
     */
    async checkDailyCardLimit(userId) {
        const user = await User.findOne({ where: { telegram_id: userId } });
        const today = new Date().toISOString().split('T')[0];
        
        return user.last_daily_reading !== today;
    }

    /**
     * Проверка премиум подписки
     */
    async checkPremiumSubscription(userId) {
        const user = await User.findOne({ where: { telegram_id: userId } });
        
        if (user.subscription_type === 'basic') {
            return false;
        }

        if (user.subscription_expires_at && new Date() > user.subscription_expires_at) {
            return false;
        }

        return true;
    }

    /**
     * Проверка подписки Гранд Мастер
     */
    async checkGrandMasterSubscription(userId) {
        const user = await User.findOne({ where: { telegram_id: userId } });
        
        return user.subscription_type === 'grandmaster' && 
               (!user.subscription_expires_at || new Date() < user.subscription_expires_at);
    }

    /**
     * Проверка лимита генерации
     */
    async checkGenerationLimit(userId) {
        const user = await User.findOne({ where: { telegram_id: userId } });
        
        // Для базовых пользователей - лимит 0
        if (user.subscription_type === 'basic') {
            return false;
        }

        // Здесь можно добавить проверку дневного лимита генерации
        // на основе типа подписки
        const today = new Date().toISOString().split('T')[0];
        const dailyLimit = {
            'mystic': 5,
            'master': 20,
            'grandmaster': 100
        }[user.subscription_type] || 0;

        // Получаем количество генераций за сегодня
        const todayGenerations = await PersonalDeck.count({
            where: {
                user_id: userId,
                created_at: {
                    [Op.gte]: new Date(today)
                }
            }
        });

        return todayGenerations < dailyLimit;
    }

    /**
     * Получение профиля пользователя
     */
    async getUserProfile(userId) {
        return await User.findOne({ where: { telegram_id: userId } });
    }

    /**
     * Создание NFT токена (заглушка для интеграции с блокчейном)
     */
    async createNFTToken(card) {
        // Здесь должна быть реальная интеграция с блокчейном
        // Например, с Ethereum, Polygon, или другой сетью
        
        return {
            tokenId: `NFT_${card.id}_${Date.now()}`,
            metadata: {
                name: `Mystika Card: ${card.card_name}`,
                description: card.card_meaning,
                image: card.image_url,
                attributes: [
                    { trait_type: 'Card Type', value: card.is_major_arcana ? 'Major Arcana' : 'Minor Arcana' },
                    { trait_type: 'Suit', value: card.suit || 'Major Arcana' },
                    { trait_type: 'Element', value: card.element || 'Universal' },
                    { trait_type: 'Personalized', value: 'Yes' },
                    { trait_type: 'Rarity', value: 'Unique' }
                ]
            },
            contractAddress: process.env.NFT_CONTRACT_ADDRESS || '0x...',
            transactionHash: `0x${Date.now().toString(16)}`, // Заглушка
            blockchainNetwork: 'Polygon',
            createdAt: new Date().toISOString()
        };
    }
}

module.exports = new CardsController();