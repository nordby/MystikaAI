// bot/src/handlers/numerology.js
const numerologyService = require('../../../server/src/services/numerologyService');
const { createInlineKeyboard } = require('../utils/keyboards');
const { getMysticalLoadingMessage } = require('../utils/messages');

class NumerologyHandler {
  constructor() {
    this.userSessions = new Map(); // Временное хранение сессий пользователей
  }

  // Вспомогательный метод для надежной отправки сообщений
  async sendMessage(ctx, message, options = {}) {
    try {
      // Если это callback-запрос, используем editMessageText
      if (ctx.callbackQuery || ctx.editMessageText) {
        await ctx.editMessageText(message, options);
      } else {
        // Иначе отправляем новое сообщение
        await ctx.reply(message, options);
      }
    } catch (error) {
      // Fallback - пробуем отправить новое сообщение если редактирование не удалось
      try {
        await ctx.reply(message, options);
      } catch (fallbackError) {
        console.error('Ошибка отправки сообщения:', fallbackError);
        await ctx.reply('❌ Ошибка отображения результата. Попробуйте позже.');
      }
    }
  }

  // Главное меню нумерологии
  async handleNumerologyMenu(ctx) {
    try {
      const keyboard = createInlineKeyboard([
        [
          { text: '🔢 Рассчитать профиль', callback_data: 'numerology_calculate' },
          { text: '👥 Совместимость', callback_data: 'numerology_compatibility' }
        ],
        [
          { text: '📊 Мой профиль', callback_data: 'numerology_profile' },
          { text: '🔮 Прогноз', callback_data: 'numerology_forecast' }
        ],
        [
          { text: '📝 Анализ имени', callback_data: 'numerology_name' },
          { text: '🎯 Персональный год', callback_data: 'numerology_year' }
        ],
        [
          { text: '🌌 Кармические уроки', callback_data: 'numerology_karma' }
        ],
        [{ text: '🏠 Главное меню', callback_data: 'main_menu' }]
      ]);

      const message = `🔢 *Нумерология*

Откройте тайны чисел и узнайте, что они говорят о вашей судьбе.

Выберите интересующий раздел:`;

      await this.sendMessage(ctx, message, { 
        parse_mode: 'Markdown', 
        reply_markup: keyboard 
      });
    } catch (error) {
      console.error('Ошибка в меню нумерологии:', error);
      await ctx.reply('Произошла ошибка. Попробуйте позже.');
    }
  }

  // Начало расчета профиля
  async handleCalculateStart(ctx) {
    try {
      const userId = ctx.from.id;
      
      // Инициализируем сессию
      this.userSessions.set(userId, {
        step: 'waiting_birthdate',
        data: {}
      });

      const message = `🔢 *Расчет нумерологического профиля*

Для точного расчета мне понадобятся:
1. Ваша дата рождения
2. Ваше полное имя

📅 Введите дату рождения в формате ДД.ММ.ГГГГ
Например: 15.03.1990`;

      const keyboard = createInlineKeyboard([
        [{ text: '❌ Отмена', callback_data: 'numerology_menu' }]
      ]);

      await this.sendMessage(ctx, message, { 
        parse_mode: 'Markdown', 
        reply_markup: keyboard 
      });
    } catch (error) {
      console.error('Ошибка начала расчета:', error);
      await ctx.reply('Ошибка. Попробуйте позже.');
    }
  }

  // Обработка текстовых сообщений для нумерологии
  async handleTextInput(ctx) {
    try {
      const userId = ctx.from.id;
      const session = this.userSessions.get(userId);

      if (!session) return;

      const text = ctx.message.text.trim();

      switch (session.step) {
        case 'waiting_birthdate':
          await this.processBirthDate(ctx, text, session);
          break;
          
        case 'waiting_fullname':
          await this.processFullName(ctx, text, session);
          break;
          
        case 'waiting_partner_birthdate':
          await this.processPartnerBirthDate(ctx, text, session);
          break;
          
        case 'waiting_partner_name':
          await this.processPartnerName(ctx, text, session);
          break;
          
        case 'waiting_name_analysis':
          await this.processNameAnalysis(ctx, text);
          break;
          
        case 'waiting_user_birthdate_for_compatibility':
          await this.processUserBirthDateForCompatibility(ctx, text, session);
          break;
          
        case 'waiting_user_name_for_compatibility':
          await this.processUserNameForCompatibility(ctx, text, session);
          break;
      }
    } catch (error) {
      console.error('Ошибка обработки текста:', error);
      await ctx.reply('Произошла ошибка. Попробуйте еще раз.');
    }
  }

  // Обработка даты рождения
  async processBirthDate(ctx, text, session) {
    const dateRegex = /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/;
    const match = text.match(dateRegex);

    if (!match) {
      await ctx.reply('❌ Неверный формат даты. Введите дату в формате ДД.ММ.ГГГГ (например: 15.03.1990)');
      return;
    }

    const [, day, month, year] = match;
    const birthDate = new Date(year, month - 1, day);

    if (isNaN(birthDate.getTime()) || birthDate > new Date()) {
      await ctx.reply('❌ Некорректная дата. Проверьте правильность ввода.');
      return;
    }

    session.data.birthDate = birthDate;
    session.step = 'waiting_fullname';
    this.userSessions.set(ctx.from.id, session);

    await ctx.reply(`✅ Дата рождения: ${day}.${month}.${year}

👤 Теперь введите ваше полное имя (Фамилия Имя Отчество):`, {
      reply_markup: createInlineKeyboard([
        [{ text: '❌ Отмена', callback_data: 'numerology_menu' }]
      ])
    });
  }

  // Обработка полного имени
  async processFullName(ctx, text, session) {
    if (text.length < 2) {
      await ctx.reply('❌ Слишком короткое имя. Введите полное имя.');
      return;
    }

    session.data.fullName = text;
    
    try {
      // Показываем мистическое сообщение загрузки
      await ctx.reply(getMysticalLoadingMessage('numerology'), {
        parse_mode: 'Markdown'
      });

      // Рассчитываем профиль
      const profile = await numerologyService.generateFullAnalysis(
        session.data.birthDate,
        session.data.fullName
      );

      // Сохраняем профиль пользователя
      this.saveUserProfile(ctx.from.id, session.data.birthDate, session.data.fullName);

      await this.sendProfileResult(ctx, profile);
      
      // НЕ очищаем сессию, чтобы данные остались для других функций
      // this.userSessions.delete(ctx.from.id);
    } catch (error) {
      console.error('Ошибка расчета профиля:', error);
      await ctx.reply('❌ Ошибка расчета. Попробуйте позже.');
      this.userSessions.delete(ctx.from.id);
    }
  }

  // Отправка результата профиля
  async sendProfileResult(ctx, profile) {
    try {
      let message = `🔮 *Ваш мистический профиль души*\n\n`;

      // Основные числа
      message += `🛤 *Путь Судьбы:* ${profile.lifePath.number}\n`;
      message += `⭐ *Число Предназначения:* ${profile.destiny.number}\n`;
      message += `💫 *Вибрация Сущности:* ${profile.soul.number}\n`;
      message += `🎭 *Маска Личности:* ${profile.personality.number}\n\n`;

      // Используем ИИ-анализ если доступен
      if (profile.aiEnhanced && profile.summary) {
        message += `🌟 *Алхимия чисел:*\n${profile.summary}\n\n`;
      } else {
        // Fallback к базовому описанию
        message += `💫 *Энергия пути:*\n${profile.lifePath.meaning?.description || 'Ваш путь ведет к мудрости и пониманию'}\n\n`;
      }

      // Показываем ИИ-инсайты для жизненного пути если есть
      if (profile.lifePath.aiInsight) {
        message += `🛤️ *Духовный урок:*\n${profile.lifePath.aiInsight}\n\n`;
      } else if (profile.lifePath.meaning?.positive && profile.lifePath.meaning.positive.length > 0) {
        // Fallback к базовым сильным сторонам
        message += `💪 *Сильные стороны души:*\n`;
        profile.lifePath.meaning.positive.slice(0, 3).forEach(strength => {
          message += `• ${strength}\n`;
        });
        message += '\n';
      }

      // Добавляем рекомендации от ИИ если есть
      if (profile.recommendations && profile.recommendations.length > 0) {
        message += `🔑 *Ключи трансформации:*\n`;
        profile.recommendations.slice(0, 2).forEach(rec => {
          message += `• ${rec.advice || rec}\n`;
        });
        message += '\n';
      }

      // Отмечаем если использовался ИИ
      if (profile.aiEnhanced) {
        message += `✨ *Анализ проведен с помощью духовного ИИ*`;
      }

      const keyboard = createInlineKeyboard([
        [
          { text: '🌟 Подробный анализ', callback_data: 'numerology_detailed' },
          { text: '💕 Совместимость', callback_data: 'numerology_compatibility' }
        ],
        [
          { text: '🔮 Прогноз года', callback_data: 'numerology_forecast' },
          { text: '🌌 Кармические уроки', callback_data: 'numerology_karma' }
        ],
        [{ text: '🔙 Назад', callback_data: 'numerology_menu' }]
      ]);

      await this.sendMessage(ctx, message, { 
        parse_mode: 'Markdown', 
        reply_markup: keyboard 
      });
    } catch (error) {
      console.error('Ошибка отправки профиля:', error);
      await ctx.reply('❌ Ошибка отображения результата. Попробуйте позже.');
    }
  }

  // Совместимость
  async handleCompatibility(ctx) {
    try {
      const userId = ctx.from.id;
      
      this.userSessions.set(userId, {
        step: 'waiting_partner_birthdate',
        data: {}
      });

      const message = `👥 *Анализ совместимости*

Для расчета совместимости введите данные партнера:

📅 Дата рождения партнера (ДД.ММ.ГГГГ):`;

      const keyboard = createInlineKeyboard([
        [{ text: '❌ Отмена', callback_data: 'numerology_menu' }]
      ]);

      await this.sendMessage(ctx, message, { 
        parse_mode: 'Markdown', 
        reply_markup: keyboard 
      });
    } catch (error) {
      console.error('Ошибка совместимости:', error);
      await ctx.reply('Ошибка. Попробуйте позже.');
    }
  }

  // Подробный анализ
  async handleDetailedAnalysis(ctx) {
    try {
      const userId = ctx.from.id;
      const userProfile = await this.getUserProfile(userId);
      
      if (!userProfile || !userProfile.profile) {
        await ctx.reply('❌ Профиль не найден. Необходимо создать профиль заново.');
        return;
      }

      await this.sendDetailedAnalysis(ctx, userProfile.profile);
    } catch (error) {
      console.error('Ошибка подробного анализа:', error);
      await ctx.reply('Ошибка получения подробного анализа.');
    }
  }

  // Отправка подробного анализа
  async sendDetailedAnalysis(ctx, profile) {
    try {
      let message = `🌟 *Глубокий анализ души*\n\n`;

      // Если есть ИИ-анализ, показываем его
      if (profile.aiEnhanced) {
        
        // Путь Судьбы с ИИ-инсайтом
        message += `🛤️ *ПУТЬ СУДЬБЫ (${profile.lifePath.number})*\n`;
        if (profile.lifePath.aiInsight) {
          message += `${profile.lifePath.aiInsight}\n\n`;
        } else {
          message += `${profile.lifePath.meaning?.description || 'Основной урок воплощения'}\n\n`;
        }

        // Предназначение души
        message += `⭐ *ПРЕДНАЗНАЧЕНИЕ ДУШИ (${profile.destiny.number})*\n`;
        if (profile.destiny.aiInsight) {
          message += `${profile.destiny.aiInsight}\n\n`;
        } else {
          message += `${profile.destiny.meaning?.description || 'Миссия души в этой жизни'}\n\n`;
        }

        // Сущность души
        message += `💎 *СУЩНОСТЬ ДУШИ (${profile.soul.number})*\n`;
        if (profile.soul.aiInsight) {
          message += `${profile.soul.aiInsight}\n\n`;
        } else {
          message += `${profile.soul.meaning?.description || 'Истинные желания души'}\n\n`;
        }

        // Маска личности
        message += `🎭 *МАСКА ЛИЧНОСТИ (${profile.personality.number})*\n`;
        if (profile.personality.aiInsight) {
          message += `${profile.personality.aiInsight}\n\n`;
        } else {
          message += `${profile.personality.meaning?.description || 'Как мир воспринимает вашу энергию'}\n\n`;
        }

        // ИИ-рекомендации
        if (profile.recommendations && profile.recommendations.length > 0) {
          message += `🔑 *КЛЮЧИ ТРАНСФОРМАЦИИ:*\n`;
          profile.recommendations.forEach(rec => {
            message += `• ${rec.advice || rec}\n`;
          });
          message += '\n';
        }

        message += `✨ *Анализ создан духовным ИИ*`;
        
      } else {
        // Fallback к базовому анализу
        message += `🛤 *Число жизненного пути: ${profile.lifePath.number}*\n`;
        message += `${profile.lifePath.meaning?.description || 'Основной урок воплощения'}\n\n`;
        
        if (profile.lifePath.meaning?.positive) {
          message += `✅ *Сильные стороны:*\n`;
          profile.lifePath.meaning.positive.forEach(strength => {
            message += `• ${strength}\n`;
          });
          message += '\n';
        }

        if (profile.lifePath.meaning?.negative) {
          message += `⚠️ *Вызовы:*\n`;
          profile.lifePath.meaning.negative.forEach(challenge => {
            message += `• ${challenge}\n`;
          });
          message += '\n';
        }

        // Рекомендации по карьере
        if (profile.lifePath.meaning?.career) {
          message += `💼 *Подходящие профессии:*\n`;
          profile.lifePath.meaning.career.forEach(career => {
            message += `• ${career}\n`;
          });
          message += '\n';
        }

        // Отношения
        if (profile.lifePath.meaning?.relationships) {
          message += `💕 *В отношениях:*\n${profile.lifePath.meaning.relationships}\n\n`;
        }
      }

      const keyboard = createInlineKeyboard([
        [{ text: '💕 Совместимость', callback_data: 'numerology_compatibility' }],
        [{ text: '🔮 Прогноз', callback_data: 'numerology_forecast' }],
        [{ text: '🌌 Кармические уроки', callback_data: 'numerology_karma' }],
        [{ text: '🔙 Назад', callback_data: 'numerology_menu' }]
      ]);

      await this.sendMessage(ctx, message, { 
        parse_mode: 'Markdown', 
        reply_markup: keyboard 
      });
    } catch (error) {
      console.error('Ошибка отправки подробного анализа:', error);
      await ctx.reply('❌ Ошибка отображения анализа. Попробуйте позже.');
    }
  }

  // Анализ имени
  async handleNameAnalysis(ctx) {
    try {
      const userId = ctx.from.id;
      
      console.log('Starting name analysis for user:', userId);
      
      // Очищаем предыдущие сессии
      this.userSessions.delete(userId);
      
      this.userSessions.set(userId, {
        step: 'waiting_name_analysis',
        data: {},
        timestamp: Date.now()
      });

      const message = `📝 *Анализ имени*

Введите имя для нумерологического анализа:

💡 Можно ввести:
• Полное имя (Иван Петров)
• Только имя (Анна)
• Имя с отчеством (Мария Ивановна)

⭐ Я рассчитаю числа судьбы и имени для анализа характера.`;

      const keyboard = createInlineKeyboard([
        [{ text: '❌ Отмена', callback_data: 'numerology_menu' }]
      ]);

      await this.sendMessage(ctx, message, { 
        parse_mode: 'Markdown', 
        reply_markup: keyboard 
      });
    } catch (error) {
      console.error('Ошибка анализа имени:', error);
      await ctx.reply('❌ Ошибка инициализации анализа имени. Попробуйте позже.');
    }
  }

  // Обработка даты рождения партнера
  async processPartnerBirthDate(ctx, text, session) {
    const dateRegex = /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/;
    const match = text.match(dateRegex);

    if (!match) {
      await ctx.reply('❌ Неверный формат даты. Введите дату в формате ДД.ММ.ГГГГ (например: 15.03.1990)');
      return;
    }

    const [, day, month, year] = match;
    const partnerBirthDate = new Date(year, month - 1, day);

    if (isNaN(partnerBirthDate.getTime()) || partnerBirthDate > new Date()) {
      await ctx.reply('❌ Некорректная дата. Проверьте правильность ввода.');
      return;
    }

    session.data.partnerBirthDate = partnerBirthDate;
    session.step = 'waiting_partner_name';
    this.userSessions.set(ctx.from.id, session);

    await ctx.reply(`✅ Дата рождения партнера: ${day}.${month}.${year}

👤 Теперь введите полное имя партнера:`, {
      reply_markup: createInlineKeyboard([
        [{ text: '❌ Отмена', callback_data: 'numerology_menu' }]
      ])
    });
  }

  // Обработка имени партнера
  async processPartnerName(ctx, text, session) {
    if (text.length < 2) {
      await ctx.reply('❌ Слишком короткое имя. Введите полное имя партнера.');
      return;
    }

    session.data.partnerName = text;
    
    try {
      // Получаем данные пользователя из профиля
      const userProfile = await this.getUserProfile(ctx.from.id);
      if (!userProfile || !userProfile.birthDate) {
        // Если у пользователя нет профиля, запрашиваем его данные
        session.step = 'waiting_user_birthdate_for_compatibility';
        this.userSessions.set(ctx.from.id, session);
        
        await ctx.reply(`✅ Данные партнера сохранены: ${session.data.partnerName}

👤 Теперь введите вашу дату рождения в формате ДД.ММ.ГГГГ
Например: 15.03.1990`, {
          reply_markup: createInlineKeyboard([
            [{ text: '❌ Отмена', callback_data: 'numerology_menu' }]
          ])
        });
        return;
      }

      // Добавляем данные пользователя в сессию
      session.data.userBirthDate = userProfile.birthDate;
      session.data.userName = userProfile.fullName;

      await this.calculateCompatibility(ctx, session);
      this.userSessions.delete(ctx.from.id);
    } catch (error) {
      console.error('Ошибка расчета совместимости:', error);
      await ctx.reply('❌ Ошибка расчета. Попробуйте позже.');
      this.userSessions.delete(ctx.from.id);
    }
  }

  // Расчет совместимости
  async calculateCompatibility(ctx, session) {
    try {
      const userLifePath = await numerologyService.calculateLifePath(session.data.userBirthDate);
      const partnerLifePath = await numerologyService.calculateLifePath(session.data.partnerBirthDate);
      
      const compatibility = await numerologyService.calculateCompatibility(
        userLifePath, 
        partnerLifePath,
        session.data.userName || 'Пользователь',
        session.data.partnerName || 'Партнер'
      );

      let message = `💕 *Анализ совместимости*\n\n`;
      message += `👤 *Ваше число жизненного пути:* ${userLifePath}\n`;
      message += `💝 *Число партнера:* ${partnerLifePath}\n\n`;
      message += `📊 *Совместимость:* ${compatibility.percentage}%\n`;
      message += `🎯 *Уровень:* ${this.getCompatibilityLevel(compatibility.level)}\n\n`;
      
      // Используем улучшенное описание от ИИ если доступно
      if (compatibility.detailedAnalysis) {
        message += `💫 *Энергетический анализ:*\n${compatibility.detailedAnalysis}\n\n`;
      } else {
        message += `💬 *Описание:*\n${compatibility.description}\n\n`;
      }
      
      // Добавляем сильные стороны если есть ИИ-анализ
      if (compatibility.strengths && compatibility.strengths.length > 0) {
        message += `💎 *Сильные стороны союза:*\n`;
        compatibility.strengths.slice(0, 3).forEach(strength => {
          message += `• ${strength}\n`;
        });
        message += '\n';
      }
      
      // Добавляем вызовы если есть ИИ-анализ
      if (compatibility.challenges && compatibility.challenges.length > 0) {
        message += `⚡ *Вызовы отношений:*\n`;
        compatibility.challenges.slice(0, 3).forEach(challenge => {
          message += `• ${challenge}\n`;
        });
        message += '\n';
      }
      
      // Рекомендации (приоритет ИИ-рекомендациям)
      const recommendations = compatibility.recommendations || compatibility.advice || [];
      if (recommendations.length > 0) {
        message += `🌱 *Пути гармонизации:*\n`;
        recommendations.slice(0, 4).forEach(advice => {
          message += `• ${advice}\n`;
        });
        message += '\n';
      }

      // Отмечаем источник анализа
      if (compatibility.aiEnhanced) {
        message += `✨ *Анализ создан духовным ИИ*`;
      } else {
        message += `🔮 *Расширенный нумерологический анализ*`;
      }

      const keyboard = createInlineKeyboard([
        [{ text: '🔄 Другой партнер', callback_data: 'numerology_compatibility' }],
        [{ text: '🔙 Назад', callback_data: 'numerology_menu' }]
      ]);

      await this.sendMessage(ctx, message, { 
        parse_mode: 'Markdown', 
        reply_markup: keyboard 
      });
    } catch (error) {
      console.error('Ошибка расчета совместимости:', error);
      await ctx.reply('Ошибка расчета совместимости.');
    }
  }

  // Прогноз
  async handleForecast(ctx) {
    try {
      const userId = ctx.from.id;
      const userProfile = await this.getUserProfile(userId);
      
      if (!userProfile || !userProfile.birthDate) {
        await ctx.reply('❌ Для прогноза нужны данные о дате рождения. Пожалуйста, сначала заполните профиль.');
        return;
      }

      const currentDate = new Date();
      const forecast = await numerologyService.generatePersonalForecast(userProfile.birthDate, currentDate);
      
      console.log('🗓️ Прогноз данные:', {
        currentDate: currentDate.toISOString(),
        currentYear: currentDate.getFullYear(),
        personalYear: forecast.personalYear.number,
        forecastYear: forecast.personalYear.year
      });
      
      let message = `🔮 *Персональный нумерологический прогноз ${forecast.personalYear.year} года*\n`;
      message += `📅 Рассчитано: ${currentDate.toLocaleDateString('ru-RU', { 
        day: 'numeric', 
        month: 'long', 
        year: 'numeric',
        timeZone: 'Europe/Moscow'
      })}\n\n`;
      
      // Используем ИИ-описание если доступно
      if (forecast.aiEnhanced && forecast.personalYear.description) {
        message += `📅 *Энергия года ${forecast.personalYear.number} (${forecast.personalYear.year}):*\n`;
        message += `${forecast.personalYear.description}\n\n`;
        
        if (forecast.yearThemes && forecast.yearThemes.length > 0) {
          message += `🎯 *Ключевые темы года:*\n`;
          forecast.yearThemes.slice(0, 3).forEach(theme => {
            message += `• ${theme}\n`;
          });
          message += '\n';
        }
      } else {
        // Fallback к базовому описанию
        message += `📅 *Персональный год ${forecast.personalYear.number} (${forecast.personalYear.year}):*\n`;
        message += `${forecast.personalYear.meaning}\n\n`;
      }
      
      message += `📆 *Персональный месяц ${forecast.personalMonth.number}:*\n`;
      message += `${forecast.personalMonth.meaning}\n`;
      message += `⏰ Период: ${forecast.personalMonth.period}\n\n`;
      
      message += `📋 *Персональный день ${forecast.personalDay.number}:*\n`;
      message += `${forecast.personalDay.meaning}\n`;
      message += `📅 Дата: ${forecast.personalDay.period}\n\n`;
      
      // Используем улучшенные рекомендации от ИИ
      if (forecast.aiEnhanced && forecast.yearAdvice) {
        message += `🔮 *Мистические рекомендации года:*\n${forecast.yearAdvice}\n\n`;
      } else if (forecast.advice && forecast.advice.length > 0) {
        message += `💡 *Рекомендации:*\n`;
        forecast.advice.slice(0, 3).forEach(advice => {
          message += `• ${advice}\n`;
        });
        message += '\n';
      }
      
      if (forecast.aiEnhanced) {
        message += `✨ *Анализ создан духовным ИИ*`;
      }

      const keyboard = createInlineKeyboard([
        [{ text: '📊 Подробный прогноз', callback_data: 'numerology_detailed_forecast' }],
        [{ text: '🔙 Назад', callback_data: 'numerology_menu' }]
      ]);

      await this.sendMessage(ctx, message, { 
        parse_mode: 'Markdown', 
        reply_markup: keyboard 
      });
    } catch (error) {
      console.error('Ошибка прогноза:', error);
      await ctx.reply('Ошибка получения прогноза.');
    }
  }

  // Обработка анализа имени
  async processNameAnalysis(ctx, text) {
    try {
      console.log('Processing name analysis for:', text);
      
      if (!text || text.trim().length < 2) {
        await ctx.reply('❌ Слишком короткое имя. Введите полное имя для анализа.');
        return;
      }

      const cleanName = text.trim();
      
      const destinyNumber = await numerologyService.calculateDestinyNumber(cleanName);
      const nameNumber = await numerologyService.calculateNameNumber(cleanName);
      
      console.log('Calculated numbers:', { destinyNumber, nameNumber });
      
      let message = `📝 *Анализ имени "${cleanName}"*\n\n`;
      message += `⭐ *Число судьбы:* ${destinyNumber}\n`;
      message += `📛 *Число имени:* ${nameNumber}\n\n`;
      
      // Получаем описание числа судьбы
      const destinyMeaning = numerologyService.numberMeanings[destinyNumber];
      if (destinyMeaning) {
        message += `💫 *Характеристика судьбы:*\n${destinyMeaning.description}\n\n`;
        message += `🔑 *Ключевые качества:* ${destinyMeaning.keywords.join(', ')}\n\n`;
      }
      
      // Получаем описание числа имени (если отличается)
      if (nameNumber !== destinyNumber) {
        const nameMeaning = numerologyService.numberMeanings[nameNumber];
        if (nameMeaning) {
          message += `💎 *Влияние имени:*\n${nameMeaning.description}\n\n`;
        }
      }
      
      message += `💡 *Рекомендация:* Используйте эти знания для лучшего понимания своих талантов и предназначения.`;

      const keyboard = createInlineKeyboard([
        [{ text: '🔄 Другое имя', callback_data: 'numerology_name' }],
        [{ text: '🔢 Полный профиль', callback_data: 'numerology_calculate' }],
        [{ text: '🔙 Назад', callback_data: 'numerology_menu' }]
      ]);

      await this.sendMessage(ctx, message, { 
        parse_mode: 'Markdown', 
        reply_markup: keyboard 
      });

      console.log('Name analysis completed successfully');
      this.userSessions.delete(ctx.from.id);
    } catch (error) {
      console.error('Ошибка анализа имени:', error);
      await ctx.reply('❌ Ошибка анализа. Проверьте правильность ввода имени и попробуйте еще раз.');
      // Не удаляем сессию, чтобы пользователь мог попробовать снова
    }
  }

  // Персональный год
  async handlePersonalYear(ctx) {
    try {
      // Получаем профиль пользователя
      const userProfile = await this.getUserProfile(ctx.from.id);
      
      if (!userProfile || !userProfile.birthDate) {
        const message = `🎯 *Персональный год*

❗ Для точного расчета персонального года нужна ваша дата рождения.

Пожалуйста, сначала создайте свой нумерологический профиль.`;

        const keyboard = createInlineKeyboard([
          [{ text: '🔢 Создать профиль', callback_data: 'numerology_calculate' }],
          [{ text: '🔙 Назад', callback_data: 'numerology_menu' }]
        ]);

        await ctx.editMessageText(message, { 
          parse_mode: 'Markdown', 
          reply_markup: keyboard 
        });
        return;
      }

      // Используем сервис для правильного расчета
      const currentDate = new Date();
      const forecast = await numerologyService.generatePersonalForecast(userProfile.birthDate, currentDate);
      
      console.log('🎯 Персональный год данные:', {
        currentDate: currentDate.toISOString(),
        currentYear: currentDate.getFullYear(),
        personalYear: forecast.personalYear.number,
        forecastYear: forecast.personalYear.year
      });

      let message = `🎯 *Персональный год ${forecast.personalYear.year}*\n`;
      message += `📅 Период: ${currentDate.toLocaleDateString('ru-RU', { 
        year: 'numeric',
        timeZone: 'Europe/Moscow'
      })} год\n\n`;
      message += `📊 *Ваше число года:* ${forecast.personalYear.number}\n\n`;

      if (forecast.aiEnhanced && forecast.personalYear.description) {
        message += `💫 *Энергия года:*\n${forecast.personalYear.description}\n\n`;
        
        if (forecast.yearThemes && forecast.yearThemes.length > 0) {
          message += `🎯 *Ключевые темы:*\n`;
          forecast.yearThemes.slice(0, 5).forEach(theme => {
            message += `• ${theme}\n`;
          });
          message += '\n';
        }
        
        if (forecast.yearAdvice) {
          message += `💡 *Мистические рекомендации:*\n${forecast.yearAdvice}`;
        }
      } else {
        message += `💫 *Энергия года:*\n${forecast.personalYear.meaning}\n\n`;
        message += `💡 *Основные рекомендации:*\n`;
        if (forecast.advice && forecast.advice.length > 0) {
          forecast.advice.slice(0, 3).forEach(advice => {
            message += `• ${advice}\n`;
          });
        }
      }

      const keyboard = createInlineKeyboard([
        [{ text: '📊 Полный прогноз', callback_data: 'numerology_forecast' }],
        [{ text: '📱 Подробный анализ', url: `${process.env.WEBAPP_URL}/numerology` }],
        [{ text: '🔙 Назад', callback_data: 'numerology_menu' }]
      ]);

      await this.sendMessage(ctx, message, { 
        parse_mode: 'Markdown', 
        reply_markup: keyboard 
      });
    } catch (error) {
      console.error('Ошибка персонального года:', error);
      await ctx.reply('❌ Ошибка расчета. Попробуйте позже.');
    }
  }

  // Получение уровня совместимости
  getCompatibilityLevel(level) {
    const levels = {
      'high': '💚 Высокая',
      'medium': '💛 Средняя', 
      'low': '💔 Низкая'
    };
    return levels[level] || '❓ Неопределенная';
  }

  // Сохранение профиля пользователя через HTTP API
  async saveUserProfile(userId, birthDate, fullName) {
    // Сохраняем в локальной сессии
    const session = this.userSessions.get(userId) || { data: {} };
    session.data.birthDate = birthDate;
    session.data.fullName = fullName;
    session.data.userBirthDate = birthDate; // Для совместимости
    this.userSessions.set(userId, session);
    
    // Рассчитываем полный профиль и сохраняем в БД
    try {
      const numerologyService = require('../../../server/src/services/numerologyService');
      const profile = await numerologyService.generateFullAnalysis(birthDate, fullName);
      
      const profileData = {
        profile,
        birthDate: birthDate.toISOString(),
        fullName,
        lastAnalysis: new Date().toISOString()
      };

      // Сохраняем в базу данных через HTTP API
      try {
        const database = require('../database');
        await database.updateUser(userId, {
          numerologyProfile: profileData
        });
        console.log('✅ Нумерологический профиль сохранен в БД для пользователя:', userId);
      } catch (dbError) {
        console.error('❌ Ошибка сохранения нумерологического профиля в БД:', dbError.message);
      }
      
      // Синхронизируем с основным хранилищем через внешний обработчик (если есть)
      if (this.externalProfileHandler && this.externalProfileHandler.saveProfile) {
        this.externalProfileHandler.saveProfile(userId, profileData);
      }
    } catch (error) {
      console.error('Ошибка сохранения профиля:', error);
    }
  }

  // Получение профиля пользователя через HTTP API
  async getUserProfile(userId) {
    try {
      // Сначала проверяем внешнее хранилище (если настроено)
      if (this.externalProfileHandler && this.externalProfileHandler.getProfile) {
        try {
          const externalProfile = await this.externalProfileHandler.getProfile(userId);
          if (externalProfile) {
            return externalProfile;
          }
        } catch (error) {
          console.error('Ошибка получения профиля из внешнего хранилища:', error.message);
        }
      }

      // Загружаем из базы данных через HTTP API
      const database = require('../database');
      const userData = await database.getUserByTelegramId(userId);
      
      if (userData && userData.user && userData.user.numerologyProfile) {
        const profile = userData.user.numerologyProfile;
        return {
          profile: profile.profile,
          birthDate: profile.birthDate ? new Date(profile.birthDate) : null,
          fullName: profile.fullName,
          lastAnalysis: profile.lastAnalysis ? new Date(profile.lastAnalysis) : null
        };
      }

      // Иначе берем из локальной сессии
      const session = this.userSessions.get(userId);
      return session?.data || null;
    } catch (error) {
      console.error('❌ Ошибка загрузки профиля из БД:', error.message);
      
      // Fallback к локальной сессии
      const session = this.userSessions.get(userId);
      return session?.data || null;
    }
  }

  // Метод для установки внешнего обработчика профилей (для синхронизации)
  setProfileHandler(profileHandler) {
    this.externalProfileHandler = profileHandler;
  }

  // Вспомогательные методы
  calculatePersonalYear(year, userId) {
    // Упрощенный расчет для демонстрации
    return ((year + userId) % 9) + 1;
  }

  getPersonalYearMeaning(year) {
    const meanings = {
      1: "Год новых начинаний и возможностей",
      2: "Год сотрудничества и терпения", 
      3: "Год творчества и самовыражения",
      4: "Год труда и построения основ",
      5: "Год перемен и свободы",
      6: "Год ответственности и семьи",
      7: "Год самопознания и духовного роста",
      8: "Год материального успеха и достижений",
      9: "Год завершения и освобождения"
    };
    return meanings[year] || "Особый год трансформации";
  }

  getYearFocus(year) {
    const focuses = {
      1: "новых проектов и лидерства",
      2: "партнерства и дипломатии",
      3: "творчества и общения",
      4: "стабильности и упорного труда",
      5: "перемен и путешествий",
      6: "семьи и заботы о близких",
      7: "духовного развития и учебы",
      8: "карьеры и материального успеха",
      9: "завершения проектов и подведения итогов"
    };
    return focuses[year] || "личностного роста";
  }

  // Обработка даты рождения пользователя для совместимости
  async processUserBirthDateForCompatibility(ctx, text, session) {
    const dateRegex = /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/;
    const match = text.match(dateRegex);

    if (!match) {
      await ctx.reply('❌ Неверный формат даты. Введите дату в формате ДД.ММ.ГГГГ (например: 15.03.1990)');
      return;
    }

    const [, day, month, year] = match;
    const birthDate = new Date(year, month - 1, day);

    if (isNaN(birthDate.getTime()) || birthDate > new Date()) {
      await ctx.reply('❌ Некорректная дата. Проверьте правильность ввода.');
      return;
    }

    session.data.userBirthDate = birthDate;
    session.step = 'waiting_user_name_for_compatibility';
    this.userSessions.set(ctx.from.id, session);

    await ctx.reply(`✅ Ваша дата рождения: ${day}.${month}.${year}

👤 Теперь введите ваше полное имя (Фамилия Имя Отчество):`, {
      reply_markup: createInlineKeyboard([
        [{ text: '❌ Отмена', callback_data: 'numerology_menu' }]
      ])
    });
  }

  // Обработка имени пользователя для совместимости
  async processUserNameForCompatibility(ctx, text, session) {
    if (text.length < 2) {
      await ctx.reply('❌ Слишком короткое имя. Введите полное имя.');
      return;
    }

    session.data.userName = text;
    
    try {
      // Теперь у нас есть все данные для расчета совместимости
      await this.calculateCompatibility(ctx, session);
      this.userSessions.delete(ctx.from.id);
    } catch (error) {
      console.error('Ошибка расчета совместимости:', error);
      await ctx.reply('❌ Ошибка расчета. Попробуйте позже.');
      this.userSessions.delete(ctx.from.id);
    }
  }

  // Мой профиль (алиас для детального анализа)
  async handleMyProfile(ctx) {
    try {
      await this.handleDetailedAnalysis(ctx);
    } catch (error) {
      console.error('Ошибка отображения профиля:', error);
      await ctx.reply('❌ Ошибка отображения профиля. Попробуйте позже.');
    }
  }

  // Кармический анализ
  async handleKarmicAnalysis(ctx) {
    try {
      const userId = ctx.from.id;
      const userProfile = await this.getUserProfile(userId);
      
      if (!userProfile || !userProfile.birthDate || !userProfile.fullName) {
        const message = `🌌 *Кармические уроки души*

❗ Для анализа кармических чисел нужны данные о дате рождения и полном имени.

Создайте свой нумерологический профиль, чтобы узнать о своих кармических уроках.`;

        const keyboard = createInlineKeyboard([
          [{ text: '🔢 Создать профиль', callback_data: 'numerology_calculate' }],
          [{ text: '🔙 Назад', callback_data: 'numerology_menu' }]
        ]);

        await ctx.editMessageText(message, { 
          parse_mode: 'Markdown', 
          reply_markup: keyboard 
        });
        return;
      }

      // Показываем загрузку
      await ctx.editMessageText('🌌 *Анализирую кармические записи души...*', {
        parse_mode: 'Markdown'
      });

      try {
        const karmicAnalysis = await numerologyService.analyzeKarmicNumbers(
          userProfile.birthDate, 
          userProfile.fullName
        );

        await this.sendKarmicAnalysis(ctx, karmicAnalysis);

      } catch (error) {
        console.error('Ошибка кармического анализа:', error);
        await ctx.editMessageText('❌ Ошибка анализа кармических чисел. Попробуйте позже.', {
          reply_markup: createInlineKeyboard([
            [{ text: '🔙 Назад', callback_data: 'numerology_menu' }]
          ])
        });
      }

    } catch (error) {
      console.error('Ошибка обработки кармического анализа:', error);
      await ctx.reply('❌ Ошибка. Попробуйте позже.');
    }
  }

  // Отправка результата кармического анализа
  async sendKarmicAnalysis(ctx, analysis) {
    try {
      let message = `🌌 *Кармические уроки души*\n\n`;

      if (!analysis.hasKarmicNumbers) {
        message += `✨ *У вас нет выраженных кармических чисел*\n\n`;
        message += `Это означает, что ваша душа пришла в эту жизнь без особых кармических долгов из прошлых воплощений. `;
        message += `Вы можете свободно фокусироваться на своем основном жизненном пути и предназначении.\n\n`;
        message += `💫 Это дает вам возможность быстрее развиваться духовно и помогать другим в их кармических уроках.`;
      } else {
        message += `⚡ *Найдены кармические числа:* ${analysis.karmicNumbers.map(k => k.number).join(', ')}\n\n`;
        
        if (analysis.karmicLessons) {
          message += `🎭 *Кармические вызовы:*\n${analysis.karmicLessons}\n\n`;
        }

        // Добавляем улучшенный ИИ-анализ если доступен
        if (analysis.aiEnhanced && analysis.transformation) {
          message += `🔮 *Кармическое предназначение:*\n${analysis.transformation}\n\n`;
        }

        if (analysis.spiritualGifts && analysis.spiritualGifts.length > 0) {
          message += `💎 *Скрытые дары кармы:*\n`;
          analysis.spiritualGifts.slice(0, 3).forEach(gift => {
            message += `• ${gift}\n`;
          });
          message += '\n';
        }

        if (analysis.recommendations && analysis.recommendations.length > 0) {
          message += `🌅 *Пути освобождения:*\n`;
          analysis.recommendations.slice(0, 4).forEach(rec => {
            message += `• ${rec}\n`;
          });
        }
      }

      const keyboard = createInlineKeyboard([
        [{ text: '📊 Полный профиль', callback_data: 'numerology_detailed' }],
        [{ text: '🔮 Прогноз', callback_data: 'numerology_forecast' }],
        [{ text: '🔙 Назад', callback_data: 'numerology_menu' }]
      ]);

      await this.sendMessage(ctx, message, { 
        parse_mode: 'Markdown', 
        reply_markup: keyboard 
      });

    } catch (error) {
      console.error('Ошибка отправки кармического анализа:', error);
      await ctx.reply('❌ Ошибка отображения результата.');
    }
  }
}

module.exports = NumerologyHandler;