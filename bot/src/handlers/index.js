// bot/src/handlers/index.js
const database = require('../database');
const config = require('../config');

class BotHandlers {
  constructor() {
    this.handlers = new Map();
    this.commandHandlers = new Map();
    this.callbackHandlers = new Map();
  }

  /**
   * Регистрация всех обработчиков
   */
  registerAll(bot) {
    console.log('Registering bot handlers...');

    // Обработчики команд
    this.registerCommandHandlers(bot);
    
    // Обработчики callback queries
    this.registerCallbackHandlers(bot);
    
    // Обработчики сообщений
    this.registerMessageHandlers(bot);

    console.log('Bot handlers registered successfully');
  }

  /**
   * Регистрация обработчиков команд
   */
  registerCommandHandlers(bot) {
    // Команда /start
    bot.onText(/\/start/, async (msg) => {
      await this.handleStartCommand(bot, msg);
    });

    // Команда /help
    bot.onText(/\/help/, async (msg) => {
      await this.handleHelpCommand(bot, msg);
    });

    // Команда /reading
    bot.onText(/\/reading/, async (msg) => {
      await this.handleReadingCommand(bot, msg);
    });

    // Команда /daily
    bot.onText(/\/daily/, async (msg) => {
      await this.handleDailyCommand(bot, msg);
    });

    // Команда /lunar
    bot.onText(/\/lunar/, async (msg) => {
      await this.handleLunarCommand(bot, msg);
    });

    // Команда /numerology
    bot.onText(/\/numerology/, async (msg) => {
      await this.handleNumerologyCommand(bot, msg);
    });

    // Команда /premium
    bot.onText(/\/premium/, async (msg) => {
      await this.handlePremiumCommand(bot, msg);
    });

    // Команда /profile
    bot.onText(/\/profile/, async (msg) => {
      await this.handleProfileCommand(bot, msg);
    });

    // Команда /history
    bot.onText(/\/history/, async (msg) => {
      await this.handleHistoryCommand(bot, msg);
    });

    // Команда /settings
    bot.onText(/\/settings/, async (msg) => {
      await this.handleSettingsCommand(bot, msg);
    });

    console.log('Command handlers registered');
  }

  /**
   * Регистрация обработчиков callback queries
   */
  registerCallbackHandlers(bot) {
    bot.on('callback_query', async (query) => {
      await this.handleCallbackQuery(bot, query);
    });

    console.log('Callback handlers registered');
  }

  /**
   * Регистрация обработчиков сообщений
   */
  registerMessageHandlers(bot) {
    // Обработка текстовых сообщений
    bot.on('message', async (msg) => {
      if (msg.text && !msg.text.startsWith('/')) {
        await this.handleTextMessage(bot, msg);
      }
    });

    // Обработка фото
    bot.on('photo', async (msg) => {
      await this.handlePhotoMessage(bot, msg);
    });

    // Обработка голосовых сообщений
    bot.on('voice', async (msg) => {
      await this.handleVoiceMessage(bot, msg);
    });

    console.log('Message handlers registered');
  }

  /**
   * Обработчик команды /start
   */
  async handleStartCommand(bot, msg) {
    try {
      const chatId = msg.chat.id;
      const userId = msg.from.id;

      console.log('Processing /start command:', { userId, chatId });

      // Проверяем, есть ли пользователь в базе
      let user = await database.getUserByTelegramId(userId);
      let isNewUser = false;

      if (!user) {
        // Создаем нового пользователя
        const userData = {
          telegramId: userId,
          username: msg.from.username || null,
          firstName: msg.from.first_name || null,
          lastName: msg.from.last_name || null,
          languageCode: msg.from.language_code || 'ru',
          chatId: chatId
        };

        user = await database.createUser(userData);
        isNewUser = true;

        console.log('New user created:', { userId, username: msg.from.username });
      } else {
        // Обновляем информацию о пользователе
        await database.updateUser(user.id, {
          lastActive: new Date(),
          chatId: chatId
        });
      }

      // Отправляем приветственное сообщение
      const messages = config.getMessages();
      const keyboards = config.getKeyboards();
      
      const welcomeText = isNewUser ? 
        messages.start.new_user : 
        messages.start.returning_user;

      await bot.sendMessage(chatId, welcomeText, {
        reply_markup: keyboards.mainMenu,
        parse_mode: 'Markdown'
      });

      // Показываем кнопку WebApp
      await bot.sendMessage(chatId, '🔮 Откройте полное приложение MISTIKA:', {
        reply_markup: keyboards.webApp
      });

      // Трекинг события
      await database.trackEvent({
        type: 'command_start',
        userId: user.id,
        isNewUser,
        metadata: {
          username: msg.from.username,
          languageCode: msg.from.language_code
        }
      });

    } catch (error) {
      console.error('Error in /start command:', error);
      await this.sendErrorMessage(bot, msg.chat.id);
    }
  }

  /**
   * Обработчик команды /help
   */
  async handleHelpCommand(bot, msg) {
    try {
      const messages = config.getMessages();
      
      await bot.sendMessage(msg.chat.id, messages.help, {
        parse_mode: 'Markdown'
      });

      await database.trackEvent({
        type: 'command_help',
        userId: msg.from.id
      });

    } catch (error) {
      console.error('Error in /help command:', error);
      await this.sendErrorMessage(bot, msg.chat.id);
    }
  }

  /**
   * Обработчик команды /reading
   */
  async handleReadingCommand(bot, msg) {
    try {
      const user = await this.ensureUser(msg.from);

      await bot.sendMessage(msg.chat.id, '🔮 *Создание нового гадания*\n\nВыберите тип расклада:', {
        reply_markup: {
          inline_keyboard: [
            [
              { text: '🃏 Одна карта', callback_data: 'reading_one_card' },
              { text: '🃏🃏🃏 Три карты', callback_data: 'reading_three_cards' }
            ],
            [
              { text: '🌟 Кельтский крест', callback_data: 'reading_celtic_cross' },
              { text: '💫 Специальный', callback_data: 'reading_custom' }
            ],
            [{ text: '⬅️ Назад', callback_data: 'back_to_menu' }]
          ]
        },
        parse_mode: 'Markdown'
      });

      await database.trackEvent({
        type: 'command_reading',
        userId: user.id
      });

    } catch (error) {
      console.error('Error in /reading command:', error);
      await this.sendErrorMessage(bot, msg.chat.id);
    }
  }

  /**
   * Обработчик команды /daily
   */
  async handleDailyCommand(bot, msg) {
    try {
      const user = await this.ensureUser(msg.from);

      await bot.sendChatAction(msg.chat.id, 'typing');

      const dailyCard = await database.getDailyCard(user.id);

      if (dailyCard) {
        const text = `🌅 *Карта дня*\n\n🃏 **${dailyCard.card.name}**\n\n${dailyCard.interpretation}\n\n✨ *Совет дня:* ${dailyCard.advice}`;

        await bot.sendMessage(msg.chat.id, text, {
          reply_markup: {
            inline_keyboard: [
              [{ text: '🔮 Подробное толкование', callback_data: `daily_details_${dailyCard.id}` }],
              [{ text: '🃏 Новое гадание', callback_data: 'new_reading' }]
            ]
          },
          parse_mode: 'Markdown'
        });
      } else {
        await bot.sendMessage(msg.chat.id, '🌅 Генерирую вашу карту дня...\n\nПожалуйста, подождите немного.', {
          reply_markup: {
            inline_keyboard: [
              [{ text: '🔄 Попробовать снова', callback_data: 'daily_retry' }]
            ]
          }
        });
      }

      await database.trackEvent({
        type: 'command_daily',
        userId: user.id
      });

    } catch (error) {
      console.error('Error in /daily command:', error);
      await this.sendErrorMessage(bot, msg.chat.id);
    }
  }

  /**
   * Обработчик команды /lunar
   */
  async handleLunarCommand(bot, msg) {
    try {
      const user = await this.ensureUser(msg.from);

      await bot.sendChatAction(msg.chat.id, 'typing');

      const recommendations = await database.getLunarRecommendations();

      if (recommendations) {
        const text = `🌙 *Лунные рекомендации*\n\n**${recommendations.moonPhase.name}** ${recommendations.moonPhase.emoji}\n\n${recommendations.moonPhase.description}\n\n**Рекомендуется:**\n${recommendations.activities.recommended.slice(0, 3).map(a => `• ${a}`).join('\n')}\n\n**Избегайте:**\n${recommendations.activities.avoid.slice(0, 2).map(a => `• ${a}`).join('\n')}`;

        await bot.sendMessage(msg.chat.id, text, {
          reply_markup: {
            inline_keyboard: [
              [{ text: '📅 Полный календарь', callback_data: 'lunar_calendar' }],
              [{ text: '🔮 Гадание по фазе', callback_data: `lunar_reading_${recommendations.moonPhase.phase}` }]
            ]
          },
          parse_mode: 'Markdown'
        });
      }

      await database.trackEvent({
        type: 'command_lunar',
        userId: user.id
      });

    } catch (error) {
      console.error('Error in /lunar command:', error);
      await this.sendErrorMessage(bot, msg.chat.id);
    }
  }

  /**
   * Обработчик команды /premium
   */
  async handlePremiumCommand(bot, msg) {
    try {
      const user = await this.ensureUser(msg.from);
      const subscription = await database.getUserSubscription(user.id);

      let text;
      let keyboard;

      if (subscription && subscription.isActive) {
        text = `💎 *Ваш Premium активен!*\n\nПлан: ${subscription.planName}\nДействует до: ${new Date(subscription.endDate).toLocaleDateString('ru-RU')}\n\n✨ Вам доступны все функции MISTIKA Premium!`;
        
        keyboard = {
          inline_keyboard: [
            [{ text: '🔄 Продлить подписку', callback_data: 'extend_premium' }],
            [{ text: '💳 Изменить план', callback_data: 'change_plan' }],
            [{ text: '📊 Статистика', callback_data: 'premium_stats' }]
          ]
        };
      } else {
        const messages = config.getMessages();
        text = `💎 *MISTIKA Premium*\n\nОткройте все возможности мистического мира:\n\n✨ **Что входит в Premium:**\n• Безлимитные гадания (вместо 3 в день)\n• Эксклюзивные расклады Таро\n• Детальная нумерология\n• Персональный лунный календарь\n• История всех гаданий\n• Экспорт результатов\n• Приоритетная поддержка\n\n🎯 **Планы подписки:**\n• Месяц: 299₽\n• 3 месяца: 799₽ (экономия 33%)\n• Год: 2999₽ (экономия 50%)\n\n🎁 Бесплатный пробный период 7 дней!`;
        
        keyboard = config.getKeyboards().premium;
      }

      await bot.sendMessage(msg.chat.id, text, {
        reply_markup: keyboard,
        parse_mode: 'Markdown'
      });

      await database.trackEvent({
        type: 'command_premium',
        userId: user.id,
        metadata: { hasActiveSubscription: !!(subscription && subscription.isActive) }
      });

    } catch (error) {
      console.error('Error in /premium command:', error);
      await this.sendErrorMessage(bot, msg.chat.id);
    }
  }

  /**
   * Обработчик callback queries
   */
  async handleCallbackQuery(bot, query) {
    try {
      const { data, message, from } = query;
      const chatId = message.chat.id;
      const messageId = message.message_id;

      console.log('Processing callback query:', { data, userId: from.id });

      // Подтверждаем получение callback query
      await bot.answerCallbackQuery(query.id);

      // Маршрутизация по типу callback data
      if (data.startsWith('reading_')) {
        await this.handleReadingCallback(bot, chatId, messageId, data, from);
      } else if (data.startsWith('premium_')) {
        await this.handlePremiumCallback(bot, chatId, messageId, data, from);
      } else if (data.startsWith('daily_')) {
        await this.handleDailyCallback(bot, chatId, messageId, data, from);
      } else if (data.startsWith('lunar_')) {
        await this.handleLunarCallback(bot, chatId, messageId, data, from);
      } else {
        // Обработка общих callback
        await this.handleGeneralCallback(bot, chatId, messageId, data, from);
      }

    } catch (error) {
      console.error('Error in callback query:', error);
      await bot.answerCallbackQuery(query.id, {
        text: 'Произошла ошибка. Попробуйте позже.',
        show_alert: true
      });
    }
  }

  /**
   * Обработчик текстовых сообщений
   */
  async handleTextMessage(bot, msg) {
    try {
      const text = msg.text;
      const chatId = msg.chat.id;

      // Обработка кнопок главного меню
      switch (text) {
        case '🔮 Новое гадание':
          await this.handleReadingCommand(bot, msg);
          break;
        case '📅 Карта дня':
          await this.handleDailyCommand(bot, msg);
          break;
        case '🌙 Лунный календарь':
          await this.handleLunarCommand(bot, msg);
          break;
        case '🔢 Нумерология':
          await this.handleNumerologyCommand(bot, msg);
          break;
        case '👤 Профиль':
          await this.handleProfileCommand(bot, msg);
          break;
        case '💎 Premium':
          await this.handlePremiumCommand(bot, msg);
          break;
        case '❓ Помощь':
          await this.handleHelpCommand(bot, msg);
          break;
        default:
          // Обработка произвольного текста как вопроса для гадания
          await this.handleQuestionText(bot, msg);
      }

    } catch (error) {
      console.error('Error in text message:', error);
      await this.sendErrorMessage(bot, msg.chat.id);
    }
  }

  /**
   * Обработка вопроса для гадания
   */
  async handleQuestionText(bot, msg) {
    const chatId = msg.chat.id;
    const question = msg.text;

    if (question.length < 5) {
      await bot.sendMessage(chatId, '🤔 Слишком короткий вопрос. Пожалуйста, сформулируйте ваш вопрос подробнее (минимум 5 символов).');
      return;
    }

    if (question.length > 500) {
      await bot.sendMessage(chatId, '📝 Слишком длинный вопрос. Пожалуйста, сократите до 500 символов.');
      return;
    }

    await bot.sendMessage(chatId, `✨ Отличный вопрос!\n\n"${question}"\n\nВыберите расклад для гадания:`, {
      reply_markup: {
        inline_keyboard: [
          [
            { text: '🃏 Одна карта', callback_data: `reading_one_card_q_${Buffer.from(question).toString('base64')}` },
            { text: '🃏🃏🃏 Три карты', callback_data: `reading_three_cards_q_${Buffer.from(question).toString('base64')}` }
          ],
          [{ text: '🌟 Кельтский крест', callback_data: `reading_celtic_cross_q_${Buffer.from(question).toString('base64')}` }]
        ]
      }
    });
  }

  /**
   * Получение или создание пользователя
   */
  async ensureUser(telegramUser) {
    let user = await database.getUserByTelegramId(telegramUser.id);
    
    if (!user) {
      const userData = {
        telegramId: telegramUser.id,
        username: telegramUser.username || null,
        firstName: telegramUser.first_name || null,
        lastName: telegramUser.last_name || null,
        languageCode: telegramUser.language_code || 'ru'
      };

      user = await database.createUser(userData);
    }

    return user;
  }

  /**
   * Отправка сообщения об ошибке
   */
  async sendErrorMessage(bot, chatId) {
    const messages = config.getMessages();
    await bot.sendMessage(chatId, messages.errors.general, {
      reply_markup: {
        inline_keyboard: [
          [{ text: '🔄 Попробовать снова', callback_data: 'retry' }],
          [{ text: '❓ Помощь', callback_data: 'help' }]
        ]
      }
    });
  }

  // Заглушки для остальных обработчиков
  async handleNumerologyCommand(bot, msg) {
    await bot.sendMessage(msg.chat.id, '🔢 Нумерология в разработке...');
  }

  async handleProfileCommand(bot, msg) {
    await bot.sendMessage(msg.chat.id, '👤 Профиль в разработке...');
  }

  async handleHistoryCommand(bot, msg) {
    await bot.sendMessage(msg.chat.id, '📋 История в разработке...');
  }

  async handleSettingsCommand(bot, msg) {
    await bot.sendMessage(msg.chat.id, '⚙️ Настройки в разработке...');
  }

  async handleReadingCallback(bot, chatId, messageId, data, from) {
    await bot.editMessageText('🔮 Создание гадания...', {
      chat_id: chatId,
      message_id: messageId
    });
  }

  async handlePremiumCallback(bot, chatId, messageId, data, from) {
    await bot.editMessageText('💎 Обработка Premium...', {
      chat_id: chatId,
      message_id: messageId
    });
  }

  async handleDailyCallback(bot, chatId, messageId, data, from) {
    await bot.editMessageText('📅 Загрузка карты дня...', {
      chat_id: chatId,
      message_id: messageId
    });
  }

  async handleLunarCallback(bot, chatId, messageId, data, from) {
    await bot.editMessageText('🌙 Загрузка лунного календаря...', {
      chat_id: chatId,
      message_id: messageId
    });
  }

  async handleGeneralCallback(bot, chatId, messageId, data, from) {
    await bot.editMessageText('⏳ Обработка запроса...', {
      chat_id: chatId,
      message_id: messageId
    });
  }

  async handlePhotoMessage(bot, msg) {
    await bot.sendMessage(msg.chat.id, '📷 Анализ изображений в разработке...');
  }

  async handleVoiceMessage(bot, msg) {
    await bot.sendMessage(msg.chat.id, '🎤 Анализ голосовых сообщений в разработке...');
  }
}

module.exports = new BotHandlers();