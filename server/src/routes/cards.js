// server/src/routes/cards.js
const express = require('express');
const router = express.Router();
const cardsController = require('../controllers/cards');
const { authenticateToken, requireSubscription } = require('../middleware/auth');
const { validateCardRequest } = require('../middleware/validation');

/**
 * Получение дневной карты
 * GET /api/cards/daily
 */
router.get('/daily', 
    authenticateToken, 
    cardsController.getDailyCard
);

/**
 * Получение персональной колоды
 * GET /api/cards/personal-deck
 */
router.get('/personal-deck', 
    authenticateToken,
    requireSubscription('mystic'),
    cardsController.getPersonalDeck
);

/**
 * Генерация персональной колоды
 * POST /api/cards/generate-deck
 */
router.post('/generate-deck',
    authenticateToken,
    requireSubscription('master'),
    cardsController.generatePersonalDeck
);

/**
 * Генерация отдельной карты
 * POST /api/cards/generate
 */
router.post('/generate',
    authenticateToken,
    requireSubscription('mystic'),
    validateCardRequest,
    cardsController.generateCard
);

/**
 * Получение значения карты
 * GET /api/cards/:cardId/meaning
 */
router.get('/:cardId/meaning',
    authenticateToken,
    cardsController.getCardMeaning
);

/**
 * Создание NFT из карты
 * POST /api/cards/:cardId/nft
 */
router.post('/:cardId/nft',
    authenticateToken,
    requireSubscription('grandmaster'),
    cardsController.createNFT
);

/**
 * Получение всех карт Таро
 * GET /api/cards/all
 */
router.get('/all',
    authenticateToken,
    async (req, res) => {
        try {
            const { Card } = require('../models');
            const cards = await Card.findAll({
                order: [['suit', 'ASC'], ['rank', 'ASC']]
            });

            res.json({
                success: true,
                cards: cards.map(card => ({
                    id: card.id,
                    name: card.card_name,
                    suit: card.suit,
                    rank: card.rank,
                    image_url: card.image_url,
                    is_major_arcana: card.is_major_arcana
                }))
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Не удалось получить карты'
            });
        }
    }
);

/**
 * Поиск карт
 * GET /api/cards/search
 */
router.get('/search',
    authenticateToken,
    async (req, res) => {
        try {
            const { q: query, suit, type } = req.query;
            const { Card } = require('../models');
            const { Op } = require('sequelize');

            const whereClause = {};

            if (query) {
                whereClause[Op.or] = [
                    { card_name: { [Op.iLike]: `%${query}%` } },
                    { card_meaning: { [Op.iLike]: `%${query}%` } }
                ];
            }

            if (suit) {
                whereClause.suit = suit;
            }

            if (type === 'major') {
                whereClause.is_major_arcana = true;
            } else if (type === 'minor') {
                whereClause.is_major_arcana = false;
            }

            const cards = await Card.findAll({
                where: whereClause,
                limit: 20,
                order: [['card_name', 'ASC']]
            });

            res.json({
                success: true,
                cards: cards
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Ошибка поиска карт'
            });
        }
    }
);

module.exports = router;