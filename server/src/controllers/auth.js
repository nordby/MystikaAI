// server/src/controllers/auth.js
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const logger = require('../utils/logger');

class AuthController {
  /**
   * Аутентификация через Telegram Bot
   */
  async telegramBotAuth(req, res) {
    try {
      const { telegramId, username, firstName, lastName, languageCode, chatId } = req.body;
      
      logger.info('Bot auth request', { telegramId, username, firstName });

      if (!telegramId) {
        return res.status(400).json({
          success: false,
          message: 'Missing telegramId parameter'
        });
      }

      // Получаем модель User через ленивую загрузку
      const { User } = require('../models');
      if (!User) {
        throw new Error('User model not initialized');
      }

      // Поиск или создание пользователя
      logger.info('Searching for user', { telegramId });
      let user = await User.findOne({ where: { telegramId } });
      logger.info('User search result', { found: !!user });
      
      if (!user) {
        user = await User.create({
          telegramId,
          username,
          firstName,
          lastName,
          languageCode: languageCode || 'ru',
          isBot: false
        });

        logger.info('New user registered via Bot', {
          userId: user.id,
          telegramId,
          username
        });
      } else {
        // Обновляем данные пользователя
        await user.update({
          username,
          firstName,
          lastName,
          languageCode: languageCode || 'ru',
          lastSeenAt: new Date()
        });

        logger.info('User updated via Bot', {
          userId: user.id,
          telegramId,
          username
        });
      }

      // Генерация JWT токена
      const token = jwt.sign(
        { 
          userId: user.id,
          telegramId: user.telegramId,
          type: 'bot'
        },
        process.env.JWT_SECRET || 'default-secret',
        { expiresIn: '30d' }
      );

      res.json({
        success: true,
        user: {
          id: user.id,
          telegramId: user.telegramId,
          username: user.username,
          firstName: user.firstName,
          lastName: user.lastName,
          languageCode: user.languageCode,
          isPremium: user.isPremium,
          subscriptionType: user.subscriptionType,
          totalReadings: user.totalReadings,
          dailyReadingsUsed: user.dailyReadingsUsed,
          isActive: user.isActive,
          preferences: user.preferences,
          deckType: user.deckType
        },
        token
      });

    } catch (error) {
      logger.error('Telegram bot auth error', { 
        error: error.message,
        telegramId: req.body.telegramId 
      });
      
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Аутентификация через Telegram WebApp
   */
  async telegramAuth(req, res) {
    try {
      const { initData } = req.body;

      if (!initData) {
        return res.status(400).json({
          success: false,
          message: 'Missing initData parameter'
        });
      }

      // Валидация Telegram WebApp данных
      const isValid = this.validateTelegramWebAppData(initData);
      if (!isValid) {
        return res.status(401).json({
          success: false,
          message: 'Invalid Telegram WebApp data'
        });
      }

      // Парсинг данных пользователя из initData
      const userData = this.parseTelegramInitData(initData);
      
      // Получаем модель User
      // Получаем модель User через ленивую загрузку
      const { User } = require('../models');
      if (!User) {
        throw new Error('User model not initialized');
      }

      // Поиск или создание пользователя
      let user = await User.findOne({ where: { telegramId: userData.id } });
      
      if (!user) {
        user = await User.create({
          telegramId: userData.id,
          username: userData.username,
          firstName: userData.first_name,
          lastName: userData.last_name,
          languageCode: userData.language_code || 'ru',
          isBot: userData.is_bot || false
        });

        logger.info('New user registered via WebApp', {
          userId: user.id,
          telegramId: userData.id,
          username: userData.username
        });
      } else {
        // Обновление данных пользователя
        await user.update({
          username: userData.username,
          firstName: userData.first_name,
          lastName: userData.last_name,
          languageCode: userData.language_code || user.languageCode,
          lastSeenAt: new Date()
        });
      }

      // Генерация JWT токена
      const token = this.generateJWT(user);

      res.json({
        success: true,
        data: {
          user: user.toSafeObject(),
          token,
          expiresIn: '7d'
        }
      });

    } catch (error) {
      logger.error('Telegram auth error', {
        error: error.message,
        stack: error.stack
      });

      res.status(500).json({
        success: false,
        message: 'Authentication failed'
      });
    }
  }

  /**
   * Обновление токена
   */
  async refreshToken(req, res) {
    try {
      const user = req.user; // Из middleware
      
      const token = this.generateJWT(user);

      res.json({
        success: true,
        data: {
          token,
          expiresIn: '7d'
        }
      });

    } catch (error) {
      logger.error('Token refresh error', {
        error: error.message,
        userId: req.user?.id
      });

      res.status(500).json({
        success: false,
        message: 'Token refresh failed'
      });
    }
  }

  /**
   * Получение пользователя по Telegram ID
   */
  async getUserByTelegramId(req, res) {
    try {
      const { telegramId } = req.params;
      // Получаем модель User через ленивую загрузку
      const { User } = require('../models');
      if (!User) {
        throw new Error('User model not initialized');
      }
      
      const user = await User.findOne({ where: { telegramId } });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Генерируем JWT токен для существующего пользователя
      const token = jwt.sign(
        { 
          userId: user.id,
          telegramId: user.telegramId,
          type: 'bot'
        },
        process.env.JWT_SECRET || 'default-secret',
        { expiresIn: '30d' }
      );

      res.json({
        success: true,
        user: {
          id: user.id,
          telegramId: user.telegramId,
          username: user.username,
          firstName: user.firstName,
          lastName: user.lastName,
          languageCode: user.languageCode,
          isPremium: user.isPremium,
          subscriptionType: user.subscriptionType,
          totalReadings: user.totalReadings,
          dailyReadingsUsed: user.dailyReadingsUsed,
          isActive: user.isActive,
          preferences: user.preferences,
          deckType: user.deckType
        },
        token
      });

    } catch (error) {
      logger.error('Get user by telegram ID error', {
        error: error.message,
        telegramId: req.params.telegramId
      });

      res.status(500).json({
        success: false,
        message: 'Failed to get user'
      });
    }
  }

  /**
   * Обновление пользователя по Telegram ID
   */
  async updateUserByTelegramId(req, res) {
    try {
      const { telegramId } = req.params;
      const updateData = req.body;
      
      logger.info('Updating user by telegram ID', { 
        telegramId, 
        updateData: JSON.stringify(updateData, null, 2) 
      });
      
      // Получаем модель User через ленивую загрузку
      const { User } = require('../models');
      if (!User) {
        throw new Error('User model not initialized');
      }
      
      const user = await User.findOne({ where: { telegramId } });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      logger.info('User before update', { 
        preferences: JSON.stringify(user.preferences, null, 2) 
      });

      await user.update({
        ...updateData,
        lastSeenAt: new Date()
      });

      // Перезагружаем пользователя для получения актуальных данных
      await user.reload();

      logger.info('User after update', { 
        deckType: user.deckType,
        preferences: JSON.stringify(user.preferences, null, 2) 
      });

      res.json({
        success: true,
        user: {
          id: user.id,
          telegramId: user.telegramId,
          username: user.username,
          firstName: user.firstName,
          lastName: user.lastName,
          languageCode: user.languageCode,
          isPremium: user.isPremium,
          subscriptionType: user.subscriptionType,
          totalReadings: user.totalReadings,
          dailyReadingsUsed: user.dailyReadingsUsed,
          isActive: user.isActive,
          preferences: user.preferences,
          deckType: user.deckType
        }
      });

    } catch (error) {
      logger.error('Update user by telegram ID error', {
        error: error.message,
        telegramId: req.params.telegramId
      });

      res.status(500).json({
        success: false,
        message: 'Failed to update user'
      });
    }
  }

  /**
   * Получение профиля текущего пользователя
   */
  async getProfile(req, res) {
    try {
      // Получаем модель User через ленивую загрузку
      const { User } = require('../models');
      if (!User) {
        throw new Error('User model not initialized');
      }
      
      const user = await User.findByPk(req.user.id);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      res.json({
        success: true,
        data: {
          user: user.toSafeObject()
        }
      });

    } catch (error) {
      logger.error('Get profile error', {
        error: error.message,
        userId: req.user?.id
      });

      res.status(500).json({
        success: false,
        message: 'Failed to get profile'
      });
    }
  }

  /**
   * Обновление профиля текущего пользователя
   */
  async updateProfile(req, res) {
    try {
      const { User } = require('../models');
      if (!User) {
        throw new Error('User model not initialized');
      }
      
      const user = await User.findByPk(req.user.id);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      const { preferences, ...profileData } = req.body;

      // Обновляем основные данные профиля
      await user.update({
        ...profileData,
        lastSeenAt: new Date()
      });

      // Обновляем настройки пользователя (preferences) в отдельном поле JSON
      if (preferences) {
        const currentPreferences = user.preferences || {};
        const updatedPreferences = {
          ...currentPreferences,
          ...preferences
        };
        
        await user.update({
          preferences: updatedPreferences
        });
      }

      // Перезагружаем пользователя с обновленными данными
      await user.reload();

      res.json({
        success: true,
        user: user.toSafeObject(),
        message: 'Profile updated successfully'
      });

    } catch (error) {
      logger.error('Update profile error', {
        error: error.message,
        userId: req.user?.id
      });

      res.status(500).json({
        success: false,
        message: 'Failed to update profile'
      });
    }
  }

  /**
   * Генерация JWT токена
   */
  generateJWT(user) {
    const payload = {
      userId: user.id,
      telegramId: user.telegramId,
      isPremium: user.isPremiumActive()
    };

    return jwt.sign(payload, process.env.JWT_SECRET || 'default-secret', {
      expiresIn: '7d',
      issuer: 'mistika-api',
      audience: 'mistika-app'
    });
  }

  /**
   * Валидация данных Telegram WebApp
   */
  validateTelegramWebAppData(initData) {
    try {
      const botToken = process.env.TELEGRAM_BOT_TOKEN;
      if (!botToken) {
        logger.error('TELEGRAM_BOT_TOKEN not found');
        return false;
      }

      // Парсинг параметров
      const urlParams = new URLSearchParams(initData);
      const hash = urlParams.get('hash');
      urlParams.delete('hash');

      // Сортировка параметров
      const dataCheckArray = [];
      for (const [key, value] of urlParams.entries()) {
        dataCheckArray.push(`${key}=${value}`);
      }
      dataCheckArray.sort();

      const dataCheckString = dataCheckArray.join('\n');

      // Создание секретного ключа
      const secretKey = crypto
        .createHmac('sha256', 'WebAppData')
        .update(botToken)
        .digest();

      // Создание хеша для проверки
      const calculatedHash = crypto
        .createHmac('sha256', secretKey)
        .update(dataCheckString)
        .digest('hex');

      return calculatedHash === hash;

    } catch (error) {
      logger.error('Telegram WebApp validation error', {
        error: error.message
      });
      return false;
    }
  }

  /**
   * Парсинг данных пользователя из initData
   */
  parseTelegramInitData(initData) {
    const urlParams = new URLSearchParams(initData);
    const userParam = urlParams.get('user');
    
    if (!userParam) {
      throw new Error('User data not found in initData');
    }

    return JSON.parse(userParam);
  }
}

module.exports = new AuthController();