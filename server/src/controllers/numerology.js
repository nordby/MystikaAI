// server/src/controllers/numerology.js
const numerologyService = require('../services/numerologyService');
const logger = require('../utils/logger');

// Lazy loading for models
const getModels = () => {
  const { User } = require('../models');
  return { User };
};

class NumerologyController {
  // Расчет нумерологического профиля
  async calculateProfile(req, res) {
    try {
      const { birthDate, fullName } = req.body;
      const userId = req.user.id;

      if (!birthDate || !fullName) {
        return res.status(400).json({
          success: false,
          message: 'Необходимо указать дату рождения и полное имя'
        });
      }

      // Валидация даты
      const date = new Date(birthDate);
      if (isNaN(date.getTime())) {
        return res.status(400).json({
          success: false,
          message: 'Некорректная дата рождения'
        });
      }

      // Расчет нумерологического профиля
      const profile = await numerologyService.calculateProfile({
        birthDate: date,
        fullName: fullName.trim(),
        userId
      });

      // Сохранение профиля
      const existingProfile = await NumerologyProfile.findOne({
        where: { userId }
      });

      if (existingProfile) {
        await NumerologyProfile.update(
          {
            birthDate: date,
            fullName: fullName.trim(),
            lifePathNumber: profile.lifePathNumber.number,
            destinyNumber: profile.destinyNumber.number,
            soulNumber: profile.soulNumber.number,
            personalityNumber: profile.personalityNumber.number,
            birthdayNumber: profile.birthdayNumber.number,
            profile: profile,
            calculatedAt: new Date()
          },
          { where: { userId } }
        );
      } else {
        await NumerologyProfile.create({
          userId,
          birthDate: date,
          fullName: fullName.trim(),
          lifePathNumber: profile.lifePathNumber.number,
          destinyNumber: profile.destinyNumber.number,
          soulNumber: profile.soulNumber.number,
          personalityNumber: profile.personalityNumber.number,
          birthdayNumber: profile.birthdayNumber.number,
          profile: profile,
          calculatedAt: new Date()
        });
      }

      res.json({
        success: true,
        profile
      });

    } catch (error) {
      logger.error('Ошибка расчета нумерологии:', error);
      res.status(500).json({
        success: false,
        message: 'Ошибка расчета нумерологического профиля'
      });
    }
  }

  // Получить сохраненный профиль
  async getProfile(req, res) {
    try {
      const userId = req.user.id;

      const numerologyProfile = await NumerologyProfile.findOne({
        where: { userId }
      });

      if (!numerologyProfile) {
        return res.status(404).json({
          success: false,
          message: 'Нумерологический профиль не найден'
        });
      }

      res.json({
        success: true,
        profile: numerologyProfile.profile,
        calculatedAt: numerologyProfile.calculatedAt
      });

    } catch (error) {
      logger.error('Ошибка получения профиля:', error);
      res.status(500).json({
        success: false,
        message: 'Ошибка получения профиля'
      });
    }
  }

  // Совместимость по числам
  async getCompatibility(req, res) {
    try {
      const { partnerBirthDate, partnerFullName } = req.body;
      const userId = req.user.id;

      // Получение профиля пользователя
      const userProfile = await NumerologyProfile.findOne({
        where: { userId }
      });

      if (!userProfile) {
        return res.status(400).json({
          success: false,
          message: 'Сначала рассчитайте свой нумерологический профиль'
        });
      }

      // Расчет профиля партнера
      const partnerProfile = await numerologyService.calculateProfile({
        birthDate: new Date(partnerBirthDate),
        fullName: partnerFullName.trim(),
        userId: null // Не сохраняем профиль партнера
      });

      // Анализ совместимости
      const compatibility = await numerologyService.analyzeCompatibility(
        userProfile.profile,
        partnerProfile
      );

      res.json({
        success: true,
        userProfile: userProfile.profile,
        partnerProfile,
        compatibility
      });

    } catch (error) {
      logger.error('Ошибка анализа совместимости:', error);
      res.status(500).json({
        success: false,
        message: 'Ошибка анализа совместимости'
      });
    }
  }

  // Персональный прогноз
  async getPersonalForecast(req, res) {
    try {
      const userId = req.user.id;
      const { period = 'month' } = req.query;

      const numerologyProfile = await NumerologyProfile.findOne({
        where: { userId }
      });

      if (!numerologyProfile) {
        return res.status(400).json({
          success: false,
          message: 'Нумерологический профиль не найден'
        });
      }

      const forecast = await numerologyService.generateForecast(
        numerologyProfile.profile,
        period
      );

      res.json({
        success: true,
        forecast,
        period
      });

    } catch (error) {
      logger.error('Ошибка получения прогноза:', error);
      res.status(500).json({
        success: false,
        message: 'Ошибка получения прогноза'
      });
    }
  }

  // Нумерологический анализ имени
  async analyzeName(req, res) {
    try {
      const { name } = req.body;

      if (!name || !name.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Необходимо указать имя'
        });
      }

      const analysis = await numerologyService.analyzeName(name.trim());

      res.json({
        success: true,
        analysis
      });

    } catch (error) {
      logger.error('Ошибка анализа имени:', error);
      res.status(500).json({
        success: false,
        message: 'Ошибка анализа имени'
      });
    }
  }
}

module.exports = new NumerologyController();