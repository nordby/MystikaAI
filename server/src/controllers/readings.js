// server/src/controllers/readings.js
const logger = require('../utils/logger');
const databaseConfig = require('../config/database');

class ReadingsController {
  /**
   * Создание нового гадания
   */
  async createReading(req, res) {
    try {
      const {
        userId,
        type,
        question,
        questionCategory = 'general',
        cards = [],
        interpretation = ''
      } = req.body;

      const models = databaseConfig.getModels();
      const { User, TarotReading } = models;

      // Найти пользователя
      const user = await User.findByPk(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Получаем positions из req.body или создаем из cards если не предоставлены
      const { positions = null } = req.body;
      let readingPositions;
      
      if (positions) {
        readingPositions = positions;
      } else {
        // Создаем позиции из карт если не предоставлены
        readingPositions = cards.map((card, index) => ({ 
          name: card.position || `Позиция ${index + 1}`,
          meaning: 'Значение позиции'
        }));
      }

      // Создать запись гадания
      const reading = await TarotReading.create({
        userId: user.id,
        type: type || 'single_card',
        spreadName: req.body.spreadName || type || 'Одна карта',
        question: question || 'Общее гадание',
        questionCategory,
        cards: cards || [],
        positions: readingPositions,
        interpretation: interpretation || 'Интерпретация гадания',
        summary: 'Краткое резюме',
        advice: 'Совет',
        mood: 'neutral',
        confidence: 0.8,
        aiModel: 'claude-3-5-haiku-20241022',
        language: 'ru'
      });

      // Обновить счетчики пользователя
      await user.increment('totalReadings');
      await user.increment('dailyReadingsUsed');

      logger.info('Reading created successfully', {
        readingId: reading.id,
        userId: user.id,
        type
      });

      res.json({
        success: true,
        reading: {
          id: reading.id,
          type: reading.type,
          question: reading.question,
          cards: reading.cards,
          interpretation: reading.interpretation,
          createdAt: reading.createdAt
        }
      });

    } catch (error) {
      logger.error('Create reading error', {
        error: error.message,
        userId: req.body.userId
      });

      res.status(500).json({
        success: false,
        message: 'Failed to create reading'
      });
    }
  }

  /**
   * Получение истории гаданий пользователя
   */
  async getUserReadings(req, res) {
    try {
      const { userId } = req.params;
      const { page = 1, limit = 10 } = req.query;

      const models = databaseConfig.getModels();
      const { TarotReading } = models;

      const offset = (page - 1) * limit;

      const readings = await TarotReading.findAndCountAll({
        where: { userId },
        order: [['createdAt', 'DESC']],
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      res.json({
        success: true,
        readings: readings.rows.map(reading => ({
          id: reading.id,
          type: reading.type,
          question: reading.question,
          cards: JSON.parse(reading.cards || '[]'),
          interpretation: reading.interpretation,
          createdAt: reading.createdAt
        })),
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: readings.count,
          totalPages: Math.ceil(readings.count / limit)
        }
      });

    } catch (error) {
      logger.error('Get user readings error', {
        error: error.message,
        userId: req.params.userId
      });

      res.status(500).json({
        success: false,
        message: 'Failed to get readings'
      });
    }
  }

  /**
   * Получение конкретного гадания
   */
  async getReading(req, res) {
    try {
      const { readingId } = req.params;
      
      const models = databaseConfig.getModels();
      const { TarotReading } = models;

      const reading = await TarotReading.findByPk(readingId);

      if (!reading) {
        return res.status(404).json({
          success: false,
          message: 'Reading not found'
        });
      }

      res.json({
        success: true,
        reading: {
          id: reading.id,
          type: reading.type,
          question: reading.question,
          cards: JSON.parse(reading.cards || '[]'),
          interpretation: reading.interpretation,
          createdAt: reading.createdAt
        }
      });

    } catch (error) {
      logger.error('Get reading error', {
        error: error.message,
        readingId: req.params.readingId
      });

      res.status(500).json({
        success: false,
        message: 'Failed to get reading'
      });
    }
  }
}

module.exports = new ReadingsController();