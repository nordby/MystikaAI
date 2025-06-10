// bot/src/handlers/lunar.js
const { lunarService } = require('../../../server/src/services/lunarService');
const { createInlineKeyboard, createReplyKeyboard } = require('../utils/keyboards');
const { formatDate, formatMoonPhase } = require('../utils/formatters');
const { getMysticalLoadingMessage } = require('../utils/messages');

class LunarHandler {
  // Главное меню лунного календаря
  async handleLunarMenu(ctx) {
    try {
      const keyboard = createInlineKeyboard([
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

      const message = `🌙 *Лунный календарь*

Изучайте влияние лунных фаз на вашу жизнь и получайте персональные рекомендации.

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
      console.error('Ошибка в лунном меню:', error);
      await ctx.reply('Произошла ошибка. Попробуйте позже.');
    }
  }

  // Текущая фаза луны
  async handleCurrentPhase(ctx) {
    try {
      // Показываем мистическое сообщение загрузки
      const loadingMsg = await ctx.editMessageText ? 
        ctx.editMessageText(getMysticalLoadingMessage('lunar'), { parse_mode: 'Markdown' }) :
        ctx.reply(getMysticalLoadingMessage('lunar'), { parse_mode: 'Markdown' });

      const currentPhase = await lunarService.getCurrentMoonPhase();
      
      const phaseEmojis = {
        'new_moon': '🌑',
        'waxing_crescent': '🌒',
        'first_quarter': '🌓',
        'waxing_gibbous': '🌔',
        'full_moon': '🌕',
        'waning_gibbous': '🌖',
        'last_quarter': '🌗',
        'waning_crescent': '🌘'
      };

      const emoji = phaseEmojis[currentPhase.phase] || '🌙';
      
      const message = `${emoji} *${currentPhase.name}*

📊 *Освещенность:* ${currentPhase.illumination}%
📆 *Возраст луны:* ${currentPhase.age} дней
⚡ *Энергия:* ${currentPhase.energy}%

💫 *Описание:*
${currentPhase.description}

Хотите получить персональные рекомендации?`;

      const keyboard = createInlineKeyboard([
        [{ text: '💡 Рекомендации', callback_data: 'lunar_recommendations' }],
        [{ text: '🔮 Ритуалы', callback_data: 'lunar_rituals' }],
        [{ text: '🔙 Назад', callback_data: 'lunar_menu' }]
      ]);

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
  async handleCalendar(ctx) {
    try {
      const today = new Date();
      const calendar = await lunarService.generateCalendar(
        today.getFullYear(), 
        today.getMonth()
      );

      const monthNames = [
        'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
        'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
      ];

      let calendarText = `📅 *Лунный календарь - ${monthNames[today.getMonth()]} ${today.getFullYear()}*\n\n`;
      
      // Группируем дни по неделям
      const weeks = [];
      let currentWeek = [];
      
      calendar.forEach(day => {
        currentWeek.push(day);
        if (day.date.getDay() === 0 || day === calendar[calendar.length - 1]) {
          weeks.push([...currentWeek]);
          currentWeek = [];
        }
      });

      weeks.forEach((week, weekIndex) => {
        if (weekIndex < 2) { // Показываем только первые 2 недели для краткости
          week.forEach(day => {
            const emoji = this.getPhaseEmoji(day.phase);
            const dayStr = day.isToday ? `*${day.day}*` : day.day;
            calendarText += `${dayStr}${emoji} `;
          });
          calendarText += '\n';
        }
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
  async handleRecommendations(ctx) {
    try {
      const currentPhase = await lunarService.getCurrentMoonPhase();
      const recommendations = await lunarService.getPhaseRecommendations(currentPhase.phase);

      let message = `💡 *Рекомендации для фазы "${currentPhase.name}"*\n\n`;
      
      message += `✅ *Благоприятно:*\n`;
      recommendations.favorable.forEach(item => {
        message += `• ${item}\n`;
      });

      message += `\n❌ *Избегать:*\n`;
      recommendations.avoid.forEach(item => {
        message += `• ${item}\n`;
      });

      message += `\n⚡ *Энергетика дня:*\n${recommendations.energy}`;

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
  async handleRituals(ctx) {
    try {
      const currentPhase = await lunarService.getCurrentMoonPhase();
      const rituals = await lunarService.getRitualsForPhase(currentPhase.phase);

      if (rituals.length === 0) {
        await ctx.editMessageText('🔮 Для текущей фазы луны особых ритуалов не предусмотрено.', {
          reply_markup: createInlineKeyboard([
            [{ text: '🔙 Назад', callback_data: 'lunar_menu' }]
          ])
        });
        return;
      }

      let message = `🔮 *Ритуалы для фазы "${currentPhase.name}"*\n\n`;

      rituals.forEach((ritual, index) => {
        message += `${index + 1}. *${ritual.name}*\n`;
        message += `📖 ${ritual.description}\n`;
        message += `⏰ Время: ${ritual.duration}\n`;
        message += `🛠 Необходимо: ${ritual.items.join(', ')}\n\n`;
      });

      const keyboard = createInlineKeyboard([
        [{ text: '📱 Открыть в приложении', url: `${process.env.WEBAPP_URL}/lunar` }],
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
  async handleDiary(ctx) {
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
  async handleNextEvent(ctx) {
    try {
      const nextEvent = await lunarService.getNextSignificantEvent();

      if (!nextEvent) {
        await ctx.editMessageText('⚡ Не удалось определить следующее лунное событие.', {
          reply_markup: createInlineKeyboard([
            [{ text: '🔙 Назад', callback_data: 'lunar_menu' }]
          ])
        });
        return;
      }

      const emoji = this.getPhaseEmoji(nextEvent.phase);
      const message = `⚡ *Следующее лунное событие*

${emoji} *${nextEvent.name}*
📅 ${formatDate(nextEvent.date)}
⏰ Через ${nextEvent.daysUntil} дн.

💫 *Значимость:* ${nextEvent.significance}

Подготовьтесь к этому дню заранее!`;

      const keyboard = createInlineKeyboard([
        [{ text: '🔔 Напомнить', callback_data: `lunar_remind_${nextEvent.phase}` }],
        [{ text: '💡 Подготовка', callback_data: `lunar_prepare_${nextEvent.phase}` }],
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
}

module.exports = LunarHandler;