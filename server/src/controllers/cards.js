// server/src/controllers/cards.js
const logger = require('../utils/logger');
const { Card } = require('../models');

class CardsController {
  /**
   * Получение всех карт
   */
  async getAllCards(req, res) {
    try {
      const {
        page = 1,
        limit = 78,
        arcana = null,
        suit = null
      } = req.query;

      const offset = (page - 1) * limit;
      const where = { isActive: true };

      // Фильтрация по аркану
      if (arcana && ['major', 'minor'].includes(arcana)) {
        where.arcana = arcana;
      }

      // Фильтрация по масти
      if (suit && ['wands', 'cups', 'swords', 'pentacles'].includes(suit)) {
        where.suit = suit;
      }

      const result = await Card.findAndCountAll({
        where,
        limit: parseInt(limit),
        offset,
        order: [['sortOrder', 'ASC'], ['name', 'ASC']]
      });

      res.json({
        success: true,
        data: {
          cards: result.rows.map(card => card.toJSON()),
          pagination: {
            total: result.count,
            page: parseInt(page),
            limit: parseInt(limit),
            pages: Math.ceil(result.count / limit)
          }
        }
      });

    } catch (error) {
      logger.error('Get all cards error', {
        error: error.message,
        query: req.query
      });

      res.status(500).json({
        success: false,
        message: 'Failed to get cards'
      });
    }
  }

  /**
   * Получение конкретной карты
   */
  async getCard(req, res) {
    try {
      const { id } = req.params;

      const card = await Card.findByTarotId(id) || await Card.findByPk(id);

      if (!card) {
        return res.status(404).json({
          success: false,
          message: 'Card not found'
        });
      }

      res.json({
        success: true,
        data: {
          card: card.toJSON()
        }
      });

    } catch (error) {
      logger.error('Get card error', {
        error: error.message,
        cardId: req.params.id
      });

      res.status(500).json({
        success: false,
        message: 'Failed to get card'
      });
    }
  }

  /**
   * Получение случайной карты
   */
  async getRandomCard(req, res) {
    try {
      const {
        arcana = null,
        suit = null
      } = req.query;

      const card = await Card.getRandomCard({
        arcana,
        suit
      });

      if (!card) {
        return res.status(404).json({
          success: false,
          message: 'No cards available'
        });
      }

      // Случайный переворот
      const reversed = Math.random() < 0.3;

      res.json({
        success: true,
        data: {
          card: card.toReadingObject(reversed)
        }
      });

    } catch (error) {
      logger.error('Get random card error', {
        error: error.message,
        query: req.query
      });

      res.status(500).json({
        success: false,
        message: 'Failed to get random card'
      });
    }
  }

  /**
   * Получение нескольких случайных карт
   */
  async getRandomCards(req, res) {
    try {
      const {
        count = 1,
        arcana = null,
        suit = null
      } = req.query;

      const cardCount = Math.min(parseInt(count), 10); // Максимум 10 карт

      const cards = await Card.getRandomCards(cardCount, {
        arcana,
        suit
      });

      // Добавление случайных переворотов
      const cardsWithOrientations = cards.map(card => {
        const reversed = Math.random() < 0.3;
        return card.toReadingObject(reversed);
      });

      res.json({
        success: true,
        data: {
          cards: cardsWithOrientations,
          count: cardsWithOrientations.length
        }
      });

    } catch (error) {
      logger.error('Get random cards error', {
        error: error.message,
        query: req.query
      });

      res.status(500).json({
        success: false,
        message: 'Failed to get random cards'
      });
    }
  }

  /**
   * Получение значения карты
   */
  async getCardMeaning(req, res) {
    try {
      const { id } = req.params;
      const {
        position = 'upright',
        category = 'general'
      } = req.query;

      const card = await Card.findByTarotId(id) || await Card.findByPk(id);

      if (!card) {
        return res.status(404).json({
          success: false,
          message: 'Card not found'
        });
      }

      const meaning = card.getMeaning(position, category);
      const keywords = card.getKeywords(position);

      res.json({
        success: true,
        data: {
          card: {
            id: card.tarotId,
            name: card.name,
            nameEn: card.nameEn
          },
          position,
          category,
          meaning,
          keywords
        }
      });

    } catch (error) {
      logger.error('Get card meaning error', {
        error: error.message,
        cardId: req.params.id
      });

      res.status(500).json({
        success: false,
        message: 'Failed to get card meaning'
      });
    }
  }
}

module.exports = new CardsController();