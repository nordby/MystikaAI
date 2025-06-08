// server/src/controllers/numerologyController.js
const numerologyService = require('../services/numerologyService');
const { NumerologyProfile, User } = require('../models');
const logger = require('../utils/logger');

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

// server/src/controllers/lunarController.js
const lunarService = require('../services/lunarService');
const { User } = require('../models');
const logger = require('../utils/logger');

class LunarController {
  // Получить текущую фазу луны
  async getCurrentPhase(req, res) {
    try {
      const currentPhase = await lunarService.getCurrentMoonPhase();
      const recommendations = await lunarService.getPhaseRecommendations(currentPhase.phase);

      res.json({
        success: true,
        currentPhase,
        recommendations
      });

    } catch (error) {
      logger.error('Ошибка получения фазы луны:', error);
      res.status(500).json({
        success: false,
        message: 'Ошибка получения данных о луне'
      });
    }
  }

  // Получить лунный календарь
  async getCalendar(req, res) {
    try {
      const { year, month } = req.query;
      
      const currentDate = new Date();
      const targetYear = year ? parseInt(year) : currentDate.getFullYear();
      const targetMonth = month ? parseInt(month) - 1 : currentDate.getMonth();

      const calendar = await lunarService.generateCalendar(targetYear, targetMonth);

      res.json({
        success: true,
        calendar,
        year: targetYear,
        month: targetMonth + 1
      });

    } catch (error) {
      logger.error('Ошибка получения календаря:', error);
      res.status(500).json({
        success: false,
        message: 'Ошибка получения лунного календаря'
      });
    }
  }

  // Получить рекомендации для определенной даты
  async getDateRecommendations(req, res) {
    try {
      const { date } = req.params;
      const targetDate = new Date(date);

      if (isNaN(targetDate.getTime())) {
        return res.status(400).json({
          success: false,
          message: 'Некорректная дата'
        });
      }

      const moonPhase = await lunarService.getMoonPhaseForDate(targetDate);
      const recommendations = await lunarService.getDetailedRecommendations(
        moonPhase.phase,
        targetDate
      );

      res.json({
        success: true,
        date: targetDate,
        moonPhase,
        recommendations
      });

    } catch (error) {
      logger.error('Ошибка получения рекомендаций:', error);
      res.status(500).json({
        success: false,
        message: 'Ошибка получения рекомендаций'
      });
    }
  }

  // Персональные лунные рекомендации
  async getPersonalRecommendations(req, res) {
    try {
      const userId = req.user.id;
      const user = await User.findByPk(userId);

      const currentPhase = await lunarService.getCurrentMoonPhase();
      const personalRecommendations = await lunarService.getPersonalizedRecommendations(
        currentPhase,
        user
      );

      res.json({
        success: true,
        currentPhase,
        personalRecommendations
      });

    } catch (error) {
      logger.error('Ошибка получения персональных рекомендаций:', error);
      res.status(500).json({
        success: false,
        message: 'Ошибка получения персональных рекомендаций'
      });
    }
  }

  // Лунные ритуалы и практики
  async getRituals(req, res) {
    try {
      const { phase } = req.query;
      
      const currentPhase = phase || (await lunarService.getCurrentMoonPhase()).phase;
      const rituals = await lunarService.getRitualsForPhase(currentPhase);

      res.json({
        success: true,
        phase: currentPhase,
        rituals
      });

    } catch (error) {
      logger.error('Ошибка получения ритуалов:', error);
      res.status(500).json({
        success: false,
        message: 'Ошибка получения ритуалов'
      });
    }
  }

  // Лунный дневник
  async addDiaryEntry(req, res) {
    try {
      const { entry, mood, energy, date } = req.body;
      const userId = req.user.id;

      const targetDate = date ? new Date(date) : new Date();
      const moonPhase = await lunarService.getMoonPhaseForDate(targetDate);

      // Здесь можно добавить сохранение в базу данных
      // const diaryEntry = await LunarDiary.create({...});

      res.json({
        success: true,
        message: 'Запись добавлена в лунный дневник',
        entry: {
          date: targetDate,
          moonPhase: moonPhase.phase,
          entry,
          mood,
          energy
        }
      });

    } catch (error) {
      logger.error('Ошибка добавления записи:', error);
      res.status(500).json({
        success: false,
        message: 'Ошибка добавления записи в дневник'
      });
    }
  }

  // Следующее важное лунное событие
  async getNextEvent(req, res) {
    try {
      const nextEvent = await lunarService.getNextSignificantEvent();

      res.json({
        success: true,
        nextEvent
      });

    } catch (error) {
      logger.error('Ошибка получения следующего события:', error);
      res.status(500).json({
        success: false,
        message: 'Ошибка получения информации о событиях'
      });
    }
  }
}

module.exports = {
  NumerologyController: new NumerologyController(),
  LunarController: new LunarController()
};