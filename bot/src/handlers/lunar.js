// bot/src/handlers/lunar.js
const lunarService = require('../../../server/src/services/lunarService');
const enhancedLunarService = require('../../../server/src/services/enhancedLunarService');
const { createInlineKeyboard, createReplyKeyboard } = require('../utils/keyboards');
// Простые форматтеры для дат
const formatDate = (date) => {
  return new Date(date).toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit', 
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};
const { getMysticalLoadingMessage } = require('../utils/messages');

class LunarHandler {
  // Главное меню лунного календаря
  async handleLunarMenu(ctx, user) {
    try {
      const isPremium = user && (user.isPremium || user.subscriptionType === 'premium' || user.subscriptionType === 'premium_plus');
      
      let keyboard;
      if (isPremium) {
        keyboard = createInlineKeyboard([
          [
            { text: '🌙 Текущая фаза', callback_data: 'lunar_current' },
            { text: '📅 Календарь', callback_data: 'lunar_calendar' }
          ],
          [
            { text: '💡 Рекомендации', callback_data: 'lunar_recommendations' },
            { text: '🔮 Ритуалы', callback_data: 'lunar_rituals' }
          ],
          [
            { text: '📊 Мой лунный дневник', callback_data: 'lunar_diary' },
            { text: '⚡ Следующее событие', callback_data: 'lunar_next_event' }
          ],
          [{ text: '🏠 Главное меню', callback_data: 'main_menu' }]
        ]);
      } else {
        keyboard = createInlineKeyboard([
          [
            { text: '🌙 Текущая фаза', callback_data: 'lunar_current' }
          ],
          [
            { text: '💎 Разблокировать все функции', callback_data: 'premium_info' }
          ],
          [{ text: '🏠 Главное меню', callback_data: 'main_menu' }]
        ]);
      }

      let message;
      if (isPremium) {
        message = `🌙 *Лунный календарь*

Изучайте влияние лунных фаз на вашу жизнь и получайте персональные рекомендации.

Выберите интересующий раздел:`;
      } else {
        message = `🌙 *Лунный календарь*

Изучайте влияние лунных фаз на вашу жизнь и получайте персональные рекомендации.

🆓 **Базовая версия:** Текущая фаза луны
💎 **Premium:** Полный календарь, рекомендации, ритуалы, личный дневник

Выберите интересующий раздел:`;
      }

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
      console.error('Ошибка в лунном меню:', error);
      await ctx.reply('Произошла ошибка. Попробуйте позже.');
    }
  }

  // Текущая фаза луны
  async handleCurrentPhase(ctx, user) {
    try {
      // Показываем мистическое сообщение загрузки
      const loadingMsg = await ctx.editMessageText ? 
        ctx.editMessageText(getMysticalLoadingMessage('lunar'), { parse_mode: 'Markdown' }) :
        ctx.reply(getMysticalLoadingMessage('lunar'), { parse_mode: 'Markdown' });

      // Получаем расширенные данные с ИИ (для премиум) или базовые
      const isPremium = user && (user.isPremium || user.subscriptionType === 'premium' || user.subscriptionType === 'premium_plus');
      const userContext = this.buildUserContext(user);
      
      const todayData = isPremium 
        ? await enhancedLunarService.getEnhancedDailyRecommendations(new Date(), userContext)
        : await lunarService.getDailyRecommendations();
      
      let message = `${todayData.moonPhase.emoji} *${todayData.moonPhase.name}*

📊 *Лунный день:* ${todayData.lunarDay}
📆 *Дата:* ${new Date().toLocaleDateString('ru-RU')}
⚡ *Энергия фазы:* ${todayData.moonPhase.energy}

💫 *Описание:*
${todayData.moonPhase.description}

🔮 *Астрологическое влияние:*
${todayData.zodiacSign.emoji} ${todayData.zodiacSign.name} - ${todayData.zodiacSign.energy}`;

      // Добавляем ИИ-анализ для премиум пользователей
      if (isPremium && todayData.aiEnhanced && todayData.personalizedAdvice) {
        message += `

✨ *Персональный совет дня:*
${todayData.personalizedAdvice}

🎯 *Прогноз энергии:*
${todayData.energyForecast || 'Энергия дня благоприятна для внутреннего роста'}`;
      }

      message += '\n\nХотите получить персональные рекомендации?';
      
      let keyboard;
      if (isPremium) {
        keyboard = createInlineKeyboard([
          [{ text: '💡 Рекомендации', callback_data: 'lunar_recommendations' }],
          [{ text: '🔮 Ритуалы', callback_data: 'lunar_rituals' }],
          [{ text: '🔙 Назад', callback_data: 'lunar_menu' }]
        ]);
      } else {
        keyboard = createInlineKeyboard([
          [{ text: '💎 Получить рекомендации и ритуалы', callback_data: 'premium_info' }],
          [{ text: '🔙 Назад', callback_data: 'lunar_menu' }]
        ]);
      }

      await ctx.editMessageText(message, { 
        parse_mode: 'Markdown', 
        reply_markup: keyboard 
      });
    } catch (error) {
      console.error('Ошибка получения фазы луны:', error);
      await ctx.reply('Не удалось получить данные о луне. Попробуйте позже.');
    }
  }

  // Лунный календарь на месяц
  async handleCalendar(ctx, user) {
    // Проверяем премиум статус
    const isPremium = user && (user.isPremium || user.subscriptionType === 'premium' || user.subscriptionType === 'premium_plus');
    console.log(`🌙 Lunar calendar check: isPremium=${isPremium}, user.isPremium=${user?.isPremium}, subscriptionType=${user?.subscriptionType}`);
    
    if (!isPremium) {
      const message = `📅 *Лунный календарь*

🔒 Полный календарь доступен только в Premium версии.

💎 **С Premium вы получите:**
• Полный лунный календарь на любой месяц
• Навигация между месяцами
• Подробные данные каждого дня
• Важные лунные события

🆓 **Сейчас доступно:** Только текущая фаза луны`;

      const keyboard = createInlineKeyboard([
        [{ text: '💎 Получить Premium', callback_data: 'premium_info' }],
        [{ text: '🌙 Текущая фаза', callback_data: 'lunar_current' }],
        [{ text: '🔙 Назад', callback_data: 'lunar_menu' }]
      ]);

      await ctx.editMessageText(message, { 
        parse_mode: 'Markdown', 
        reply_markup: keyboard 
      });
      return;
    }
    try {
      const today = new Date();
      const endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      const userContext = this.buildUserContext(user);
      
      const calendarData = isPremium 
        ? await enhancedLunarService.getEnhancedLunarCalendar(today, endDate, userContext)
        : await lunarService.getLunarCalendar(today, endDate);

      const monthNames = [
        'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
        'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
      ];

      let calendarText = `📅 *Лунный календарь - ${monthNames[today.getMonth()]} ${today.getFullYear()}*\n\n`;
      
      // Для премиум показываем ИИ-анализ месяца
      if (isPremium && calendarData.aiEnhanced && calendarData.monthlyInsight) {
        calendarText += `🌟 *Астрологический прогноз месяца:*\n${calendarData.monthlyInsight}\n\n`;
        
        if (calendarData.keyRecommendations && calendarData.keyRecommendations.length > 0) {
          calendarText += `🎯 *Ключевые рекомендации:*\n`;
          calendarData.keyRecommendations.slice(0, 3).forEach(rec => {
            calendarText += `• ${rec}\n`;
          });
          calendarText += '\n';
        }
      } else {
        // Базовая сводка для бесплатных пользователей
        calendarText += `📊 *Сводка периода:*\n${calendarData.summary}\n\n`;
      }
      
      // Показываем ключевые дни
      calendarText += `🌟 *Ключевые дни этого месяца:*\n`;
      const keyDays = calendarData.calendar.filter(day => 
        [1, 8, 15, 22].includes(day.lunarDay)
      ).slice(0, 4);
      
      keyDays.forEach(day => {
        const date = new Date(day.date);
        calendarText += `${day.moonPhase.emoji} ${date.getDate()}.${date.getMonth() + 1} - ${day.moonPhase.name}`;
        
        // Для премиум добавляем ИИ-советы
        if (isPremium && calendarData.enhancedDays) {
          const enhancedDay = calendarData.enhancedDays.find(d => d.date === day.date);
          if (enhancedDay && enhancedDay.aiAdvice) {
            calendarText += `\n   💡 ${enhancedDay.aiAdvice.substring(0, 60)}...`;
          }
        }
        calendarText += '\n';
      });

      calendarText += '\n🌑 Новолуние  🌓 Четверти  🌕 Полнолуние';

      const keyboard = createInlineKeyboard([
        [
          { text: '⬅️ Пред. месяц', callback_data: 'lunar_prev_month' },
          { text: '➡️ След. месяц', callback_data: 'lunar_next_month' }
        ],
        [{ text: '📊 Подробный календарь', callback_data: 'lunar_detailed_calendar' }],
        [{ text: '🔙 Назад', callback_data: 'lunar_menu' }]
      ]);

      await ctx.editMessageText(calendarText, { 
        parse_mode: 'Markdown', 
        reply_markup: keyboard 
      });
    } catch (error) {
      console.error('Ошибка календаря:', error);
      await ctx.reply('Не удалось загрузить календарь.');
    }
  }

  // Рекомендации для текущей фазы
  async handleRecommendations(ctx, user) {
    // Проверяем премиум статус
    const isPremium = user && (user.isPremium || user.subscriptionType === 'premium' || user.subscriptionType === 'premium_plus');
    
    if (!isPremium) {
      const message = `💡 *Лунные рекомендации*

🔒 Персональные рекомендации доступны только в Premium версии.

💎 **С Premium вы получите:**
• Подробные рекомендации для каждой фазы
• Что благоприятно делать сегодня
• Чего стоит избегать
• Энергетические советы
• Практические рекомендации

🆓 **Сейчас доступно:** Только просмотр текущей фазы`;

      const keyboard = createInlineKeyboard([
        [{ text: '💎 Получить Premium', callback_data: 'premium_info' }],
        [{ text: '🌙 Текущая фаза', callback_data: 'lunar_current' }],
        [{ text: '🔙 Назад', callback_data: 'lunar_menu' }]
      ]);

      await ctx.editMessageText(message, { 
        parse_mode: 'Markdown', 
        reply_markup: keyboard 
      });
      return;
    }
    try {
      const userContext = this.buildUserContext(user);
      const recommendations = isPremium 
        ? await enhancedLunarService.getEnhancedDailyRecommendations(new Date(), userContext)
        : await lunarService.getDailyRecommendations();

      let message = `💡 *Рекомендации для фазы "${recommendations.moonPhase.name}"*\n\n`;
      
      // Для премиум пользователей показываем расширенные рекомендации
      if (isPremium && recommendations.aiEnhanced) {
        message += `🌟 *Детальная интерпретация:*\n${recommendations.detailedInterpretation}\n\n`;
        
        if (recommendations.practicalTips && recommendations.practicalTips.length > 0) {
          message += `🎯 *Практические советы:*\n`;
          recommendations.practicalTips.slice(0, 5).forEach(tip => {
            message += `• ${tip}\n`;
          });
          message += '\n';
        }

        if (recommendations.manifestationAdvice && recommendations.manifestationAdvice.length > 0) {
          message += `✨ *Советы по проявлению:*\n`;
          recommendations.manifestationAdvice.slice(0, 3).forEach(advice => {
            message += `• ${advice}\n`;
          });
          message += '\n';
        }

        // Добавляем дополнительные разделы для премиум
        if (recommendations.relationships && recommendations.relationships.length > 0) {
          message += `💕 *Отношения:*\n`;
          recommendations.relationships.slice(0, 2).forEach(rel => {
            message += `• ${rel}\n`;
          });
          message += '\n';
        }

        if (recommendations.career && recommendations.career.length > 0) {
          message += `💼 *Карьера:*\n`;
          recommendations.career.slice(0, 2).forEach(career => {
            message += `• ${career}\n`;
          });
          message += '\n';
        }

        if (recommendations.health && recommendations.health.length > 0) {
          message += `🌿 *Здоровье:*\n`;
          recommendations.health.slice(0, 2).forEach(health => {
            message += `• ${health}\n`;
          });
          message += '\n';
        }
      } else {
        // Расширенные базовые рекомендации для бесплатных пользователей
        message += `✅ *Благоприятно сегодня:*\n`;
        recommendations.activities.recommended.slice(0, 6).forEach(item => {
          message += `• ${item}\n`;
        });

        message += `\n❌ *Стоит избегать:*\n`;
        recommendations.activities.avoid.slice(0, 4).forEach(item => {
          message += `• ${item}\n`;
        });

        message += `\n⚡ *Энергетика дня:*\n${recommendations.energy}`;
        
        if (recommendations.specialAdvice && recommendations.specialAdvice.length > 0) {
          message += `\n\n💫 *Особые советы:*\n`;
          recommendations.specialAdvice.slice(0, 2).forEach(advice => {
            message += `• ${advice}\n`;
          });
        }
      }

      const keyboard = createInlineKeyboard([
        [{ text: '🔮 Ритуалы', callback_data: 'lunar_rituals' }],
        [{ text: '📝 Записать в дневник', callback_data: 'lunar_add_diary' }],
        [{ text: '🔙 Назад', callback_data: 'lunar_menu' }]
      ]);

      await ctx.editMessageText(message, { 
        parse_mode: 'Markdown', 
        reply_markup: keyboard 
      });
    } catch (error) {
      console.error('Ошибка рекомендаций:', error);
      await ctx.reply('Не удалось получить рекомендации.');
    }
  }

  // Лунные ритуалы
  async handleRituals(ctx, user) {
    // Проверяем премиум статус
    const isPremium = user && (user.isPremium || user.subscriptionType === 'premium' || user.subscriptionType === 'premium_plus');
    
    if (!isPremium) {
      const message = `🔮 *Лунные ритуалы*

🔒 Ритуалы доступны только в Premium версии.

💎 **С Premium вы получите:**
• Специальные ритуалы для каждой фазы
• Пошаговые инструкции
• Необходимые материалы
• Время проведения
• Мистические практики

🆓 **Сейчас доступно:** Только просмотр текущей фазы`;

      const keyboard = createInlineKeyboard([
        [{ text: '💎 Получить Premium', callback_data: 'premium_info' }],
        [{ text: '🌙 Текущая фаза', callback_data: 'lunar_current' }],
        [{ text: '🔙 Назад', callback_data: 'lunar_menu' }]
      ]);

      await ctx.editMessageText(message, { 
        parse_mode: 'Markdown', 
        reply_markup: keyboard 
      });
      return;
    }
    try {
      const userContext = this.buildUserContext(user);
      let message;
      
      if (isPremium) {
        // Получаем ИИ-ритуалы для премиум пользователей
        const ritualsData = await enhancedLunarService.getEnhancedRituals(new Date(), userContext);
        
        message = `🔮 *Ритуалы для фазы "${ritualsData.phase}"*\n\n`;
        message += `⚡ *Энергия:* ${ritualsData.energy}\n\n`;
        message += `💫 *Что такое лунные ритуалы?*\nЭто простые духовные практики, которые помогают настроиться на энергию луны и улучшить свою жизнь. Выполняйте их дома в спокойной обстановке.\n\n`;
        
        if (ritualsData.aiGenerated) {
          message += `✨ *Персональные ритуалы от духовного ИИ:*\n\n`;
        }
        
        ritualsData.rituals.forEach((ritual, index) => {
          message += `${index + 1}. **${ritual.name}**\n`;
          message += `📖 ${ritual.description}\n`;
          message += `⏰ Время: ${ritual.time}\n`;
          
          if (ritual.items && ritual.items.length > 0) {
            message += `🛠 Понадобится: ${ritual.items.join(', ')}\n`;
          }
          
          if (ritual.steps && ritual.steps.length > 0) {
            message += `📋 *Как выполнить:*\n`;
            ritual.steps.slice(0, 3).forEach((step, stepIndex) => {
              if (step && step.trim()) {
                message += `   ${stepIndex + 1}. ${step.trim()}\n`;
              }
            });
          }
          
          if (ritual.affirmation) {
            message += `🙏 *Аффирмация:* "${ritual.affirmation}"\n`;
          }
          message += '\n';
        });
      } else {
        // Базовые рекомендации для бесплатных пользователей
        const recommendations = await lunarService.getDailyRecommendations();
        
        message = `🔮 *Ритуалы для фазы "${recommendations.moonPhase.name}"*\n\n`;
        message += `${recommendations.moonPhase.emoji} *Энергия фазы:* ${recommendations.moonPhase.energy}\n\n`;
        message += `💫 *Что такое лунные ритуалы?*\nЭто простые духовные практики для настройки на лунную энергию. Доступны базовые рекомендации.\n\n`;
        
        message += `🕯️ *Рекомендуемые практики:*\n`;
        recommendations.activities.recommended.slice(0, 5).forEach((activity, index) => {
          message += `${index + 1}. ${activity}\n`;
        });
        
        message += `\n✨ *Специальный совет дня:*\n${recommendations.specialAdvice?.[0] || 'Следуйте энергии луны и доверьтесь интуиции'}\n\n`;
        message += `💫 *Астрологическое влияние:* ${recommendations.zodiacSign.name} ${recommendations.zodiacSign.emoji}\n\n`;
        message += `💎 *Хотите персональные ритуалы с пошаговыми инструкциями?* Получите Premium для доступа к ИИ-ритуалам!`;
      }

      const keyboard = createInlineKeyboard([
        [{ text: '📱 Открыть в приложении', url: `${process.env.WEBAPP_URL || 'https://mystika.systems.cv'}/lunar` }],
        [{ text: '🔙 Назад', callback_data: 'lunar_menu' }]
      ]);

      await ctx.editMessageText(message, { 
        parse_mode: 'Markdown', 
        reply_markup: keyboard 
      });
    } catch (error) {
      console.error('Ошибка ритуалов:', error);
      await ctx.reply('Не удалось получить ритуалы.');
    }
  }

  // Лунный дневник
  async handleDiary(ctx, user) {
    // Проверяем премиум статус
    const isPremium = user && (user.isPremium || user.subscriptionType === 'premium' || user.subscriptionType === 'premium_plus');
    
    if (!isPremium) {
      const message = `📊 *Лунный дневник*

🔒 Лунный дневник доступен только в Premium версии.

💎 **С Premium вы получите:**
• Ведение личного лунного дневника
• Отслеживание настроения по фазам
• Анализ лунных циклов
• Персональная статистика
• Напоминания о записях

🆓 **Сейчас доступно:** Только просмотр текущей фазы`;

      const keyboard = createInlineKeyboard([
        [{ text: '💎 Получить Premium', callback_data: 'premium_info' }],
        [{ text: '🌙 Текущая фаза', callback_data: 'lunar_current' }],
        [{ text: '🔙 Назад', callback_data: 'lunar_menu' }]
      ]);

      await ctx.editMessageText(message, { 
        parse_mode: 'Markdown', 
        reply_markup: keyboard 
      });
      return;
    }
    try {
      const message = `📊 *Лунный дневник*

Ведите записи о своем состоянии в разные фазы луны для лучшего понимания лунных циклов.

Что вы хотите сделать?`;

      const keyboard = createInlineKeyboard([
        [{ text: '➕ Добавить запись', callback_data: 'lunar_add_entry' }],
        [{ text: '📖 Просмотреть записи', callback_data: 'lunar_view_entries' }],
        [{ text: '📊 Анализ настроения', callback_data: 'lunar_mood_analysis' }],
        [{ text: '🔙 Назад', callback_data: 'lunar_menu' }]
      ]);

      await ctx.editMessageText(message, { 
        parse_mode: 'Markdown', 
        reply_markup: keyboard 
      });
    } catch (error) {
      console.error('Ошибка дневника:', error);
      await ctx.reply('Не удалось открыть дневник.');
    }
  }

  // Следующее лунное событие
  async handleNextEvent(ctx, user) {
    // Проверяем премиум статус
    const isPremium = user && (user.isPremium || user.subscriptionType === 'premium' || user.subscriptionType === 'premium_plus');
    
    if (!isPremium) {
      const message = `⚡ *Лунные события*

🔒 Отслеживание лунных событий доступно только в Premium версии.

💎 **С Premium вы получите:**
• Уведомления о важных лунных событиях
• Подготовка к особым дням
• Напоминания о ритуалах
• Календарь событий
• Персональные рекомендации

🆓 **Сейчас доступно:** Только просмотр текущей фазы`;

      const keyboard = createInlineKeyboard([
        [{ text: '💎 Получить Premium', callback_data: 'premium_info' }],
        [{ text: '🌙 Текущая фаза', callback_data: 'lunar_current' }],
        [{ text: '🔙 Назад', callback_data: 'lunar_menu' }]
      ]);

      await ctx.editMessageText(message, { 
        parse_mode: 'Markdown', 
        reply_markup: keyboard 
      });
      return;
    }
    try {
      const upcomingEventsData = await lunarService.getUpcomingLunarEvents();
      const nextEvent = upcomingEventsData.events[0]; // Берем первое событие

      if (!nextEvent) {
        await ctx.editMessageText('⚡ Не удалось определить следующее лунное событие.', {
          reply_markup: createInlineKeyboard([
            [{ text: '🔙 Назад', callback_data: 'lunar_menu' }]
          ])
        });
        return;
      }

      const message = `⚡ *Следующее лунное событие*

${nextEvent.emoji} *${nextEvent.name}*
📅 ${nextEvent.date}
⏰ Через ${nextEvent.daysFromNow} дн.

💫 *Значимость:* ${nextEvent.significance}
⚡ *Энергия:* ${nextEvent.energy}

Подготовьтесь к этому дню заранее!`;

      const keyboard = createInlineKeyboard([
        [{ text: '🔔 Напомнить', callback_data: `lunar_remind_${nextEvent.phase || nextEvent.type || 'event'}` }],
        [{ text: '💡 Подготовка', callback_data: `lunar_prepare_${nextEvent.phase || nextEvent.type || 'event'}` }],
        [{ text: '🔙 Назад', callback_data: 'lunar_menu' }]
      ]);

      await ctx.editMessageText(message, { 
        parse_mode: 'Markdown', 
        reply_markup: keyboard 
      });
    } catch (error) {
      console.error('Ошибка следующего события:', error);
      await ctx.reply('Не удалось получить информацию о событиях.');
    }
  }

  // Вспомогательные методы
  getPhaseEmoji(phase) {
    const emojis = {
      'new_moon': '🌑',
      'waxing_crescent': '🌒',
      'first_quarter': '🌓',
      'waxing_gibbous': '🌔',
      'full_moon': '🌕',
      'waning_gibbous': '🌖',
      'last_quarter': '🌗',
      'waning_crescent': '🌘'
    };
    return emojis[phase] || '🌙';
  }

  // Уведомления о лунных событиях
  async scheduleNotification(ctx, phase, date) {
    try {
      // Здесь можно добавить логику планирования уведомлений
      await ctx.answerCallbackQuery('🔔 Уведомление настроено!');
    } catch (error) {
      console.error('Ошибка настройки уведомления:', error);
      await ctx.answerCallbackQuery('Ошибка настройки уведомления');
    }
  }

  // Создание контекста пользователя для ИИ
  buildUserContext(user) {
    return {
      subscriptionType: user?.subscriptionType || 'basic',
      isPremium: user?.isPremium || false,
      totalReadings: user?.totalReadings || 0,
      interests: [], // Можно добавить из профиля пользователя
      lifeArea: 'general' // По умолчанию
    };
  }
}

module.exports = LunarHandler;