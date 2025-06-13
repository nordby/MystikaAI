// bot/src/handlers/numerology.js
const numerologyService = require('../../../server/src/services/numerologyService');
const { createInlineKeyboard } = require('../utils/keyboards');
const { getMysticalLoadingMessage } = require('../utils/messages');

class NumerologyHandler {
  constructor() {
    this.userSessions = new Map(); // Временное хранение сессий пользователей
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
        [{ text: '🏠 Главное меню', callback_data: 'main_menu' }]
      ]);

      const message = `🔢 *Нумерология*

Откройте тайны чисел и узнайте, что они говорят о вашей судьбе.

Выберите интересующий раздел:`;

      if (ctx.callbackQuery) {
        await ctx.editMessageText(message, { 
          parse_mode: 'Markdown', 
          reply_markup: keyboard 
        });
      } else {
        await ctx.reply(message, { 
          parse_mode: 'Markdown', 
          reply_markup: keyboard 
        });
      }
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

      await ctx.editMessageText(message, { 
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
      let message = `🔢 *Ваш нумерологический профиль*\n\n`;

      // Основные числа
      message += `🛤 *Число жизненного пути:* ${profile.lifePath.number}\n`;
      message += `⭐ *Число судьбы:* ${profile.destiny.number}\n`;
      message += `💫 *Число души:* ${profile.soul.number}\n`;
      message += `👤 *Число личности:* ${profile.personality.number}\n\n`;

      // Краткое описание
      message += `💬 *Главное значение:*\n${profile.lifePath.meaning?.description || 'Ваш жизненный путь определяет основные уроки и задачи'}\n\n`;

      // Сильные стороны
      if (profile.lifePath.meaning?.positive && profile.lifePath.meaning.positive.length > 0) {
        message += `💪 *Сильные стороны:*\n`;
        profile.lifePath.meaning.positive.slice(0, 3).forEach(strength => {
          message += `• ${strength}\n`;
        });
        message += '\n';
      }

      const keyboard = createInlineKeyboard([
        [
          { text: '📊 Подробный анализ', callback_data: 'numerology_detailed' },
          { text: '👥 Совместимость', callback_data: 'numerology_compatibility' }
        ],
        [
          { text: '🔮 Прогноз', callback_data: 'numerology_forecast' },
          { text: '💎 Счастливые числа', callback_data: 'numerology_lucky' }
        ],
        [{ text: '🔙 Назад', callback_data: 'numerology_menu' }]
      ]);

      await ctx.reply(message, { 
        parse_mode: 'Markdown', 
        reply_markup: keyboard 
      });
    } catch (error) {
      console.error('Ошибка отправки профиля:', error);
      await ctx.reply('Ошибка отображения результата.');
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

      await ctx.editMessageText(message, { 
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
      const userProfile = this.getUserProfile(userId);
      
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
      let message = `📊 *Подробный нумерологический анализ*\n\n`;

      // Число жизненного пути
      message += `🛤 *Число жизненного пути: ${profile.lifePath.number}*\n`;
      message += `${profile.lifePath.meaning?.description || ''}\n\n`;
      
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

      const keyboard = createInlineKeyboard([
        [{ text: '👥 Совместимость', callback_data: 'numerology_compatibility' }],
        [{ text: '🔮 Прогноз', callback_data: 'numerology_forecast' }],
        [{ text: '🔙 Назад', callback_data: 'numerology_menu' }]
      ]);

      await ctx.editMessageText(message, { 
        parse_mode: 'Markdown', 
        reply_markup: keyboard 
      });
    } catch (error) {
      console.error('Ошибка отправки подробного анализа:', error);
      await ctx.reply('Ошибка отображения анализа.');
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

      await ctx.editMessageText(message, { 
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
      const userProfile = this.getUserProfile(ctx.from.id);
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
      
      const compatibility = await numerologyService.calculateCompatibility(userLifePath, partnerLifePath);

      let message = `👥 *Анализ совместимости*\n\n`;
      message += `👤 *Ваше число жизненного пути:* ${userLifePath}\n`;
      message += `💕 *Число партнера:* ${partnerLifePath}\n\n`;
      message += `📊 *Совместимость:* ${compatibility.percentage}%\n`;
      message += `🎯 *Уровень:* ${this.getCompatibilityLevel(compatibility.level)}\n\n`;
      message += `💬 *Описание:*\n${compatibility.description}\n\n`;
      
      if (compatibility.advice && compatibility.advice.length > 0) {
        message += `💡 *Рекомендации:*\n`;
        compatibility.advice.forEach(advice => {
          message += `• ${advice}\n`;
        });
      }

      const keyboard = createInlineKeyboard([
        [{ text: '🔄 Другой партнер', callback_data: 'numerology_compatibility' }],
        [{ text: '🔙 Назад', callback_data: 'numerology_menu' }]
      ]);

      await ctx.reply(message, { 
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
      const userProfile = this.getUserProfile(userId);
      
      if (!userProfile || !userProfile.birthDate) {
        await ctx.reply('❌ Для прогноза нужны данные о дате рождения. Пожалуйста, сначала заполните профиль.');
        return;
      }

      const forecast = await numerologyService.generatePersonalForecast(userProfile.birthDate);
      
      let message = `🔮 *Персональный нумерологический прогноз*\n\n`;
      
      message += `📅 *Персональный год ${forecast.personalYear.number}:*\n`;
      message += `${forecast.personalYear.meaning}\n\n`;
      
      message += `📆 *Персональный месяц ${forecast.personalMonth.number}:*\n`;
      message += `${forecast.personalMonth.meaning}\n\n`;
      
      message += `📋 *Персональный день ${forecast.personalDay.number}:*\n`;
      message += `${forecast.personalDay.meaning}\n\n`;
      
      if (forecast.advice && forecast.advice.length > 0) {
        message += `💡 *Рекомендации:*\n`;
        forecast.advice.slice(0, 3).forEach(advice => {
          message += `• ${advice}\n`;
        });
      }

      const keyboard = createInlineKeyboard([
        [{ text: '📊 Подробный прогноз', callback_data: 'numerology_detailed_forecast' }],
        [{ text: '🔙 Назад', callback_data: 'numerology_menu' }]
      ]);

      await ctx.editMessageText(message, { 
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

      await ctx.reply(message, { 
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
      const userProfile = this.getUserProfile(ctx.from.id);
      
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
      const forecast = await numerologyService.generatePersonalForecast(userProfile.birthDate);
      const currentYear = new Date().getFullYear();

      const message = `🎯 *Персональный год ${currentYear}*

📊 *Ваше число года:* ${forecast.personalYear}

💫 *Энергия года:*
${forecast.yearDescription}

🎯 *Ключевые темы:*
${forecast.yearThemes.map(theme => `• ${theme}`).join('\n')}

💡 *Рекомендации:*
${forecast.yearAdvice}`;

      const keyboard = createInlineKeyboard([
        [{ text: '📊 Полный прогноз', callback_data: 'numerology_forecast' }],
        [{ text: '📱 Подробный анализ', url: `${process.env.WEBAPP_URL}/numerology` }],
        [{ text: '🔙 Назад', callback_data: 'numerology_menu' }]
      ]);

      await ctx.editMessageText(message, { 
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

  // Сохранение профиля пользователя (синхронизация с основным индексом)
  async saveUserProfile(userId, birthDate, fullName) {
    // Сохраняем в локальной сессии
    const session = this.userSessions.get(userId) || { data: {} };
    session.data.birthDate = birthDate;
    session.data.fullName = fullName;
    session.data.userBirthDate = birthDate; // Для совместимости
    this.userSessions.set(userId, session);
    
    // Рассчитываем полный профиль
    try {
      const numerologyService = require('../../../server/src/services/numerologyService');
      const profile = await numerologyService.generateFullAnalysis(birthDate, fullName);
      
      // Синхронизируем с основным хранилищем через внешний обработчик
      if (this.externalProfileHandler) {
        this.externalProfileHandler.saveProfile(userId, {
          profile,
          birthDate,
          fullName,
          lastAnalysis: new Date()
        });
      }
    } catch (error) {
      console.error('Ошибка сохранения профиля:', error);
    }
  }

  // Получение профиля пользователя (с проверкой основного хранилища)
  getUserProfile(userId) {
    // Сначала проверяем основное хранилище
    if (this.externalProfileHandler) {
      const externalProfile = this.externalProfileHandler.getProfile(userId);
      if (externalProfile) {
        return externalProfile;
      }
    }
    
    // Иначе берем из локальной сессии
    const session = this.userSessions.get(userId);
    return session?.data || null;
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
}

module.exports = NumerologyHandler;