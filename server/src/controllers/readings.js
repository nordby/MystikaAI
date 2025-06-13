// server/src/controllers/readings.js
const logger = require('../utils/logger');

/**
 * Генерация URL изображения карты
 */
function generateCardImageUrl(card, isReversed = false) {
  try {
    // Базовое изображение карты (можно заменить на реальные изображения)
    let baseImageUrl;
    
    if (card.arcana === 'major') {
      // Для старших арканов используем номер карты
      baseImageUrl = `https://via.placeholder.com/300x500/4A5568/FFFFFF?text=${encodeURIComponent(card.name)}`;
    } else {
      // Для младших арканов используем масть и номер/двор
      const suitName = getSuitNameRu(card.suit);
      const cardTitle = card.court ? `${card.name}` : `${card.number} ${suitName}`;
      baseImageUrl = `https://via.placeholder.com/300x500/2D3748/FFFFFF?text=${encodeURIComponent(cardTitle)}`;
    }
    
    return baseImageUrl;
    
  } catch (error) {
    logger.warn('Failed to generate card image URL', { 
      error: error.message,
      cardId: card.tarotId 
    });
    
    // Fallback изображение
    return `https://via.placeholder.com/300x500/718096/FFFFFF?text=${encodeURIComponent('Карта Таро')}`;
  }
}

/**
 * Получение русского названия масти
 */
function getSuitNameRu(suit) {
  const suitNames = {
    'wands': 'Жезлов',
    'cups': 'Кубков', 
    'swords': 'Мечей',
    'pentacles': 'Пентаклей'
  };
  return suitNames[suit] || suit;
}
// const databaseConfig = require('../config/database'); // Удалено - используем ленивую загрузку

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

      const models = require('../models').getModels();
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

      const models = require('../models').getModels();
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
          cards: reading.cards || [],
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
   * Получение дневной карты пользователя
   */
  async getDailyReading(req, res) {
    try {
      // Получаем userId из токена авторизации или параметров запроса
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
          success: false,
          message: 'Authorization token required'
        });
      }

      const models = require('../models').getModels();
      const { User, TarotReading, Card } = models;
      
      logger.info('Models info', {
        userModel: User ? User.name : 'undefined',
        tarotReadingModel: TarotReading ? TarotReading.name : 'undefined',
        cardModel: Card ? Card.name : 'undefined'
      });

      // Извлекаем токен и декодируем его (упрощенная версия)
      const token = authHeader.split(' ')[1];
      let userId;
      
      try {
        // Здесь должна быть проверка JWT токена
        // Для упрощения используем базовый подход
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        userId = decoded.userId || decoded.id;
      } catch (jwtError) {
        return res.status(401).json({
          success: false,
          message: 'Invalid token'
        });
      }

      // Найти пользователя
      logger.info('Looking for user', { userId });
      
      const user = await User.findByPk(userId);
      logger.info('User search result', { 
        found: !!user, 
        userId,
        userDetails: user ? { id: user.id, telegramId: user.telegramId } : null 
      });
      
      if (!user) {
        logger.error('User not found for daily reading', { userId, token: token.substring(0, 20) + '...' });
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Проверяем, есть ли уже дневная карта на сегодня
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);

      const existingDailyReading = await TarotReading.findOne({
        where: {
          userId: user.id,
          type: 'daily_card',
          createdAt: {
            [require('sequelize').Op.between]: [startOfDay, endOfDay]
          }
        },
        order: [['createdAt', 'DESC']]
      });

      if (existingDailyReading) {
        // Возвращаем существующую дневную карту
        const cards = existingDailyReading.cards || [];
        
        return res.json({
          success: true,
          card: cards[0],
          isReversed: cards[0]?.reversed || false,
          interpretation: existingDailyReading.interpretation,
          date: existingDailyReading.createdAt,
          existingReading: true
        });
      }

      // Проверяем лимиты пользователя (временно отключено для разработки)
      // if (!user.isPremium && user.dailyReadingsUsed >= 10) { // увеличили лимит до 10
      //   return res.status(429).json({
      //     success: false,
      //     message: 'Daily limit exceeded',
      //     upgradeRequired: true
      //   });
      // }

      // Генерируем случайную карту для дневного гадания
      const allCards = await Card.findAll();
      
      if (!allCards || allCards.length === 0) {
        return res.status(500).json({
          success: false,
          message: 'No cards found in database'
        });
      }
      
      const randomCard = allCards[Math.floor(Math.random() * allCards.length)];
      const isReversed = Math.random() < 0.5;

      // Генерируем URL изображения карты
      const imageUrl = generateCardImageUrl(randomCard, isReversed);
      
      const cardData = {
        id: randomCard.tarotId || randomCard.id,
        name: randomCard.name,
        number: randomCard.number,
        suit: randomCard.suit || null,
        type: randomCard.arcana,
        meaning: isReversed ? randomCard.getMeaning('reversed', 'general') : randomCard.getMeaning('upright', 'general'),
        reversed: isReversed,
        imageUrl: imageUrl
      };

      // Генерируем ИИ интерпретацию для дневной карты
      const aiService = require('../services/aiService');
      let interpretation, summary, advice, mood, confidence;
      
      try {
        const aiResult = await aiService.interpretReading(
          [cardData], 
          'Карта дня - что несет мне сегодняшний день?',
          user,
          {
            spreadType: 'daily_card',
            positions: [{ name: 'Карта дня', meaning: 'Энергия и советы на весь день' }],
            language: 'ru',
            style: 'mystical_daily'
          }
        );
        
        interpretation = aiResult.interpretation;
        summary = aiResult.summary || `Карта дня: ${cardData.name}`;
        advice = aiResult.advice || 'Сосредоточьтесь на энергии этой карты весь день';
        mood = aiResult.mood || 'neutral';
        confidence = aiResult.confidence || 0.9;
        
        logger.info('AI interpretation generated for daily card', {
          cardName: cardData.name,
          isReversed,
          userId: user.id
        });
        
      } catch (aiError) {
        logger.warn('AI interpretation failed, using fallback', {
          error: aiError.message,
          cardName: cardData.name
        });
        
        // Fallback к базовой интерпретации
        interpretation = `${cardData.name} ${isReversed ? '(перевернутая)' : ''} - ${cardData.meaning}`;
        summary = `Карта дня: ${cardData.name}`;
        advice = 'Сосредоточьтесь на энергии этой карты весь день';
        mood = 'neutral';
        confidence = 0.7;
      }

      // Создаем запись дневного гадания
      logger.info('Creating tarot reading with user data', {
        userId: user.id,
        userIdType: typeof user.id,
        userTableName: user.constructor.tableName,
        userPrimaryKey: user.constructor.primaryKeyAttribute
      });

      const dailyReading = await TarotReading.create({
        userId: user.id,
        type: 'daily_card',
        spreadName: 'Карта дня',
        question: 'Карта дня',
        questionCategory: 'general',
        cards: [cardData],
        positions: [{ name: 'Карта дня', meaning: 'Энергия дня' }],
        interpretation: interpretation,
        summary: summary,
        advice: advice,
        mood: mood,
        confidence: confidence,
        aiModel: 'claude-3-haiku-20240307',
        language: 'ru'
      });

      // Обновляем счетчики пользователя
      await user.increment('totalReadings');
      await user.increment('dailyReadingsUsed');

      logger.info('Daily reading created', {
        readingId: dailyReading.id,
        userId: user.id,
        cardName: cardData.name,
        isReversed
      });

      res.json({
        success: true,
        card: cardData,
        isReversed: isReversed,
        interpretation: interpretation,
        date: dailyReading.createdAt,
        existingReading: false
      });

    } catch (error) {
      logger.error('Get daily reading error', {
        error: error.message,
        stack: error.stack
      });

      res.status(500).json({
        success: false,
        message: 'Failed to get daily reading'
      });
    }
  }

  /**
   * Получение конкретного гадания
   */
  async getReading(req, res) {
    try {
      const { readingId } = req.params;
      
      const models = require('../models').getModels();
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
          cards: reading.cards || [],
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