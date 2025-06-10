// bot/src/handlers/numerology.js
const numerologyService = require('../../../server/src/services/numerologyService');
const { createInlineKeyboard } = require('../utils/keyboards');

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
      // Рассчитываем профиль
      const profile = await numerologyService.generateFullAnalysis(
        session.data.birthDate,
        session.data.fullName
      );

      await this.sendProfileResult(ctx, profile);
      
      // Очищаем сессию
      this.userSessions.delete(ctx.from.id);
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

  // Анализ имени
  async handleNameAnalysis(ctx) {
    try {
      const userId = ctx.from.id;
      
      this.userSessions.set(userId, {
        step: 'waiting_name_analysis',
        data: {}
      });

      const message = `📝 *Анализ имени*

Введите имя для нумерологического анализа:
(можно ввести как полное имя, так и отдельные имена)`;

      const keyboard = createInlineKeyboard([
        [{ text: '❌ Отмена', callback_data: 'numerology_menu' }]
      ]);

      await ctx.editMessageText(message, { 
        parse_mode: 'Markdown', 
        reply_markup: keyboard 
      });
    } catch (error) {
      console.error('Ошибка анализа имени:', error);
      await ctx.reply('Ошибка. Попробуйте позже.');
    }
  }

  // Обработка анализа имени
  async processNameAnalysis(ctx, text) {
    try {
      const destinyNumber = await numerologyService.calculateDestinyNumber(text);
      const nameNumber = await numerologyService.calculateNameNumber(text);
      
      let message = `📝 *Анализ имени "${text}"*\n\n`;
      message += `⭐ *Число судьбы:* ${destinyNumber}\n`;
      message += `📛 *Число имени:* ${nameNumber}\n\n`;
      
      // Получаем описание числа
      const meaning = numerologyService.numberMeanings[destinyNumber];
      if (meaning) {
        message += `💬 *Значение:* ${meaning.description}\n\n`;
        message += `🔑 *Ключевые слова:* ${meaning.keywords.join(', ')}`;
      }

      const keyboard = createInlineKeyboard([
        [{ text: '🔄 Другое имя', callback_data: 'numerology_name' }],
        [{ text: '🔙 Назад', callback_data: 'numerology_menu' }]
      ]);

      await ctx.reply(message, { 
        parse_mode: 'Markdown', 
        reply_markup: keyboard 
      });

      this.userSessions.delete(ctx.from.id);
    } catch (error) {
      console.error('Ошибка анализа имени:', error);
      await ctx.reply('Ошибка анализа. Попробуйте еще раз.');
    }
  }

  // Персональный год
  async handlePersonalYear(ctx) {
    try {
      // Здесь можно получить профиль пользователя из базы данных
      // Для примера используем расчет на основе текущей даты
      const currentYear = new Date().getFullYear();
      const personalYear = this.calculatePersonalYear(currentYear, ctx.from.id);

      const message = `🎯 *Персональный год ${currentYear}*

📊 *Ваше число года:* ${personalYear}

${this.getPersonalYearMeaning(personalYear)}

Это время для ${this.getYearFocus(personalYear)}`;

      const keyboard = createInlineKeyboard([
        [{ text: '📱 Подробный анализ', url: `${process.env.WEBAPP_URL}/numerology` }],
        [{ text: '🔙 Назад', callback_data: 'numerology_menu' }]
      ]);

      await ctx.editMessageText(message, { 
        parse_mode: 'Markdown', 
        reply_markup: keyboard 
      });
    } catch (error) {
      console.error('Ошибка персонального года:', error);
      await ctx.reply('Ошибка. Попробуйте позже.');
    }
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
}

module.exports = NumerologyHandler;