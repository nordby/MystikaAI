// server/src/controllers/lunar.js
const lunarService = require('../services/lunarService');
const logger = require('../utils/logger');

// Lazy loading for models
const getModels = () => {
  const { User } = require('../models');
  return { User };
};

class LunarController {
  /**
   * Получить текущую фазу луны
   */
  async getCurrentPhase(req, res) {
    try {
      const currentPhase = await lunarService.getCurrentPhase();
      
      res.json({
        success: true,
        data: currentPhase
      });
    } catch (error) {
      logger.error('Error getting current lunar phase:', error);
      res.status(500).json({
        success: false,
        message: 'Не удалось получить текущую фазу луны'
      });
    }
  }

  /**
   * Получить лунный календарь
   */
  async getCalendar(req, res) {
    try {
      const { month, year } = req.query;
      const calendar = await lunarService.getCalendar(month, year);
      
      res.json({
        success: true,
        data: calendar
      });
    } catch (error) {
      logger.error('Error getting lunar calendar:', error);
      res.status(500).json({
        success: false,
        message: 'Не удалось получить лунный календарь'
      });
    }
  }

  /**
   * Получить персональные рекомендации
   */
  async getPersonalRecommendations(req, res) {
    try {
      const { birthDate, zodiacSign } = req.query;
      const recommendations = await lunarService.getPersonalRecommendations({
        birthDate,
        zodiacSign
      });
      
      res.json({
        success: true,
        data: recommendations
      });
    } catch (error) {
      logger.error('Error getting personal lunar recommendations:', error);
      res.status(500).json({
        success: false,
        message: 'Не удалось получить персональные рекомендации'
      });
    }
  }

  /**
   * Получить лунное гадание
   */
  async getLunarReading(req, res) {
    try {
      const { question } = req.body;
      const reading = await lunarService.getLunarReading(question);
      
      res.json({
        success: true,
        data: reading
      });
    } catch (error) {
      logger.error('Error getting lunar reading:', error);
      res.status(500).json({
        success: false,
        message: 'Не удалось получить лунное гадание'
      });
    }
  }

  /**
   * Получить мой календарь (для авторизованных пользователей)
   */
  async getMyCalendar(req, res) {
    try {
      const userId = req.user.id;
      const user = await User.findByPk(userId);
      
      const calendar = await lunarService.getPersonalizedCalendar(user);
      
      res.json({
        success: true,
        data: calendar
      });
    } catch (error) {
      logger.error('Error getting personalized lunar calendar:', error);
      res.status(500).json({
        success: false,
        message: 'Не удалось получить персональный календарь'
      });
    }
  }

  /**
   * Запланировать ритуал
   */
  async scheduleRitual(req, res) {
    try {
      const userId = req.user.id;
      const { ritualType, scheduledDate } = req.body;
      
      const ritual = await lunarService.scheduleRitual({
        userId,
        ritualType,
        scheduledDate
      });
      
      res.json({
        success: true,
        data: ritual
      });
    } catch (error) {
      logger.error('Error scheduling ritual:', error);
      res.status(500).json({
        success: false,
        message: 'Не удалось запланировать ритуал'
      });
    }
  }

  /**
   * Получить мои ритуалы
   */
  async getMyRituals(req, res) {
    try {
      const userId = req.user.id;
      const rituals = await lunarService.getUserRituals(userId);
      
      res.json({
        success: true,
        data: rituals
      });
    } catch (error) {
      logger.error('Error getting user rituals:', error);
      res.status(500).json({
        success: false,
        message: 'Не удалось получить ваши ритуалы'
      });
    }
  }

  /**
   * Получить статистику (админ)
   */
  async getStats(req, res) {
    try {
      if (!req.user.isAdmin) {
        return res.status(403).json({
          success: false,
          message: 'Недостаточно прав'
        });
      }

      const stats = await lunarService.getStats();
      
      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      logger.error('Error getting lunar stats:', error);
      res.status(500).json({
        success: false,
        message: 'Не удалось получить статистику'
      });
    }
  }
}

module.exports = new LunarController();