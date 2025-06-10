// bot/src/index.js
require('dotenv').config();
const { Telegraf, Scenes, session } = require('telegraf');
const { message } = require('telegraf/filters');

// Handlers
const LunarHandler = require('./handlers/lunar');
const NumerologyHandler = require('./handlers/numerology');
const { handleStart, handleRestart } = require('./handlers/start');
const { handleDaily } = require('./handlers/daily');

// Utils
const { createInlineKeyboard } = require('./utils/keyboards');
const logger = require('./utils/logger');
const apiService = require('./services/api');

// Создание бота
const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

// Инициализация handlers
const lunarHandler = new LunarHandler();
const numerologyHandler = new NumerologyHandler();

// Middleware
bot.use(session());

// Главное меню
const getMainMenu = () => {
  return createInlineKeyboard([
    [
      { text: '🃏 Дневная карта', callback_data: 'daily_card' },
      { text: '🔮 Гадание', callback_data: 'reading_menu' }
    ],
    [
      { text: '🔢 Нумерология', callback_data: 'numerology_menu' },
      { text: '🌙 Лунный календарь', callback_data: 'lunar_menu' }
    ],
    [
      { text: '👥 Групповые гадания', callback_data: 'group_menu' },
      { text: '👫 Друзья', callback_data: 'friends_menu' }
    ],
    [
      { text: '💎 Премиум', callback_data: 'premium_menu' },
      { text: '📱 Веб-приложение', web_app: { url: process.env.WEBAPP_URL } }
    ]
  ]);
};

// Команда /start
bot.start(async (ctx) => {
  await handleStart(bot, ctx.message);
});

// Команда /help
bot.help(async (ctx) => {
  const helpMessage = `📖 *MISTIKA - Справка*

*Основные функции:*
🃏 */daily* - Получить дневную карту
🔮 */reading* - Провести гадание
🔢 */numerology* - Нумерология
🌙 */lunar* - Лунный календарь
👥 */group* - Групповые гадания

*Как пользоваться:*
• Нажимайте на кнопки в меню
• Используйте команды выше
• Откройте веб-приложение для полного функционала

*Премиум возможности:*
💎 Персональные колоды карт
🎨 Генерация изображений ИИ
📊 Расширенная аналитика
🔮 Безлимитные гадания

Нужна помощь? Обратитесь в поддержку: @mistika_support`;

  await ctx.reply(helpMessage, {
    parse_mode: 'Markdown',
    reply_markup: createInlineKeyboard([
      [{ text: '🏠 Главное меню', callback_data: 'main_menu' }]
    ])
  });
});

// Обработка callback queries
bot.on('callback_query', async (ctx) => {
  try {
    const data = ctx.callbackQuery.data;
    
    // Главное меню
    if (data === 'main_menu') {
      const message = `🔮 *MISTIKA - Главное меню*

Выберите интересующий раздел:`;

      await ctx.editMessageText(message, {
        parse_mode: 'Markdown',
        reply_markup: getMainMenu()
      });
      return;
    }

    // Нумерология
    if (data === 'numerology_menu') {
      await numerologyHandler.handleNumerologyMenu(ctx);
      return;
    }

    if (data === 'numerology_calculate') {
      await numerologyHandler.handleCalculateStart(ctx);
      return;
    }

    if (data === 'numerology_compatibility') {
      await numerologyHandler.handleCompatibility(ctx);
      return;
    }

    if (data === 'numerology_name') {
      await numerologyHandler.handleNameAnalysis(ctx);
      return;
    }

    if (data === 'numerology_year') {
      await numerologyHandler.handlePersonalYear(ctx);
      return;
    }

    // Лунный календарь
    if (data === 'lunar_menu') {
      await lunarHandler.handleLunarMenu(ctx);
      return;
    }

    if (data === 'lunar_current') {
      await lunarHandler.handleCurrentPhase(ctx);
      return;
    }

    if (data === 'lunar_calendar') {
      await lunarHandler.handleCalendar(ctx);
      return;
    }

    if (data === 'lunar_recommendations') {
      await lunarHandler.handleRecommendations(ctx);
      return;
    }

    if (data === 'lunar_rituals') {
      await lunarHandler.handleRituals(ctx);
      return;
    }

    if (data === 'lunar_diary') {
      await lunarHandler.handleDiary(ctx);
      return;
    }

    if (data === 'lunar_next_event') {
      await lunarHandler.handleNextEvent(ctx);
      return;
    }

    // Перезапуск
    if (data === 'restart') {
      await handleRestart(bot, ctx.callbackQuery);
      return;
    }

    // Дневная карта  
    if (data === 'daily_card') {
      // TODO: Временно используем веб-приложение, потом добавим прямую обработку в боте
      await ctx.editMessageText('🃏 *Дневная карта*\n\nОткройте веб-приложение для получения дневной карты с красивой визуализацией!', {
        parse_mode: 'Markdown',
        reply_markup: createInlineKeyboard([
          [{ text: '📱 Открыть приложение', web_app: { url: `${process.env.WEBAPP_URL}/daily` } }],
          [{ text: '🔙 Назад', callback_data: 'main_menu' }]
        ])
      });
      return;
    }

    // Гадания
    if (data === 'reading_menu') {
      await ctx.editMessageText('🔮 *Гадания*\n\nВыберите тип гадания в веб-приложении для лучшего опыта!', {
        parse_mode: 'Markdown',
        reply_markup: createInlineKeyboard([
          [{ text: '📱 Открыть приложение', web_app: { url: `${process.env.WEBAPP_URL}/spreads` } }],
          [{ text: '🔙 Назад', callback_data: 'main_menu' }]
        ])
      });
      return;
    }

    // Премиум
    if (data === 'premium_menu') {
      await ctx.editMessageText('💎 *Премиум возможности*\n\nПолучите доступ к эксклюзивным функциям!', {
        parse_mode: 'Markdown',
        reply_markup: createInlineKeyboard([
          [{ text: '📱 Узнать больше', web_app: { url: `${process.env.WEBAPP_URL}/premium` } }],
          [{ text: '🔙 Назад', callback_data: 'main_menu' }]
        ])
      });
      return;
    }

    // Отвечаем на callback query
    await ctx.answerCallbackQuery();

  } catch (error) {
    logger.error('Ошибка обработки callback query:', error);
    await ctx.answerCallbackQuery('Произошла ошибка');
  }
});

// Обработка текстовых сообщений
bot.on(message('text'), async (ctx) => {
  try {
    // Проверяем, есть ли активная сессия нумерологии
    await numerologyHandler.handleTextInput(ctx);
    
  } catch (error) {
    logger.error('Ошибка обработки текста:', error);
    await ctx.reply('Произошла ошибка при обработке сообщения.');
  }
});

// Команды-shortcuts
bot.command('daily', async (ctx) => {
  // TODO: Добавить получение токена пользователя из сессии
  // Пока используем веб-приложение
  await ctx.reply('🃏 Дневная карта доступна в веб-приложении!', {
    reply_markup: createInlineKeyboard([
      [{ text: '📱 Открыть', web_app: { url: `${process.env.WEBAPP_URL}/daily` } }]
    ])
  });
});

bot.command('reading', async (ctx) => {
  await ctx.reply('🔮 Выберите гадание в веб-приложении!', {
    reply_markup: createInlineKeyboard([
      [{ text: '📱 Открыть', web_app: { url: `${process.env.WEBAPP_URL}/spreads` } }]
    ])
  });
});

bot.command('numerology', async (ctx) => {
  await numerologyHandler.handleNumerologyMenu(ctx);
});

bot.command('lunar', async (ctx) => {
  await lunarHandler.handleLunarMenu(ctx);
});

// Обработка ошибок
bot.catch((err, ctx) => {
  logger.error('Ошибка бота:', err);
  ctx.reply('Произошла техническая ошибка. Попробуйте позже.');
});

// Запуск бота
const startBot = async () => {
  try {
    // Проверяем соединение с API сервером
    try {
      await apiService.healthCheck();
      logger.info('API server connection established');
    } catch (error) {
      logger.warn('API server not available, bot will continue but with limited functionality:', error.message);
    }

    if (process.env.NODE_ENV === 'production') {
      // Webhook режим для production
      const webhookUrl = `${process.env.TELEGRAM_WEBHOOK_URL}/api/telegram/webhook`;
      await bot.telegram.setWebhook(webhookUrl);
      logger.info(`Webhook установлен: ${webhookUrl}`);
    } else {
      // Polling режим для development
      await bot.launch();
      logger.info('Бот запущен в polling режиме');
    }

    // Graceful stop
    process.once('SIGINT', () => bot.stop('SIGINT'));
    process.once('SIGTERM', () => bot.stop('SIGTERM'));

  } catch (error) {
    logger.error('Ошибка запуска бота:', error);
    process.exit(1);
  }
};

// Запуск
if (require.main === module) {
  startBot();
}

module.exports = bot;