// bot/src/handlers/index.js
const database = require('../database');
const config = require('../config');
const { TAROT_CARDS } = require('../data/tarot');

class BotHandlers {
  constructor() {
    this.handlers = new Map();
    this.commandHandlers = new Map();
    this.callbackHandlers = new Map();
    
    // Очистка старых вопросов каждые 10 минут
    setInterval(() => {
      this.cleanupOldQuestions();
    }, 10 * 60 * 1000);
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
      let userResponse = await database.getUserByTelegramId(userId);
      let user = userResponse?.user;
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

        const createResponse = await database.createUser(userData);
        user = createResponse.user; // Извлекаем user из ответа API
        isNewUser = true;

        console.log('New user created:', { userId, username: msg.from.username });
      } else {
        // Обновляем информацию о пользователе  
        await database.updateUser(user.telegramId, {
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
        parse_mode: 'HTML'
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

      await bot.sendMessage(msg.chat.id, '🔮 *Создание нового гадания*\n\nВыберите тип расклада:\n\n💡 *Совет:* Для более точного гадания сначала задайте свой вопрос в сообщении, а затем выберите расклад.', {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [
              { text: '🃏 Одна карта', callback_data: 'reading_single' },
              { text: '🃏🃏🃏 Три карты', callback_data: 'reading_three' }
            ],
            [
              { text: '🌟 Кельтский крест', callback_data: 'reading_celtic' },
              { text: '💕 Отношения', callback_data: 'reading_relationship' }
            ],
            [{ text: '❓ Задать вопрос сначала', callback_data: 'ask_question_first' }],
            [{ text: '⬅️ Назад', callback_data: 'back_to_menu' }]
          ]
        }
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

      // Выбираем случайную карту дня
      const allCards = [
        ...TAROT_CARDS.major,
        ...TAROT_CARDS.minor.wands,
        ...TAROT_CARDS.minor.cups,
        ...TAROT_CARDS.minor.swords,
        ...TAROT_CARDS.minor.pentacles
      ];
      
      const randomCard = allCards[Math.floor(Math.random() * allCards.length)];
      const isReversed = Math.random() < 0.2; // 20% шанс на перевернутую карту
      
      const cardWithState = {
        ...randomCard,
        reversed: isReversed
      };

      // Получаем AI интерпретацию для карты дня
      let dailyInterpretation = null;
      try {
        await bot.sendChatAction(msg.chat.id, 'typing');
        
        const aiResponse = await this.getDailyCardInterpretation(cardWithState, user);
        dailyInterpretation = aiResponse;
        console.log('Daily card AI interpretation received:', JSON.stringify(aiResponse, null, 2));
      } catch (error) {
        console.log('Daily card AI interpretation failed:', error.message);
      }

      // Генерируем изображение карты
      let cardImage = null;
      try {
        await bot.sendChatAction(msg.chat.id, 'typing');
        
        const imageResponse = await database.generateCardImage(cardWithState.name, cardWithState.description || 'Карта Таро');
        if (imageResponse && imageResponse.success) {
          cardImage = imageResponse;
        }
      } catch (error) {
        console.log('Daily card image generation failed:', error.message);
      }

      // Формируем текст интерпретации
      let interpretationText;
      let advice;
      
      if (dailyInterpretation && dailyInterpretation.success) {
        interpretationText = dailyInterpretation.interpretation.interpretation || dailyInterpretation.interpretation.main;
        advice = dailyInterpretation.interpretation.advice;
      } else {
        // Fallback интерпретация
        interpretationText = `Карта ${cardWithState.name}${isReversed ? ' (перевернутая)' : ''} приносит важные энергии в ваш день.`;
        advice = 'Доверьтесь своей интуиции и будьте открыты новым возможностям.';
      }

      const caption = `🌅 <b>Карта дня</b>\n\n🃏 <b>${cardWithState.name}</b>${isReversed ? ' (перевернутая)' : ''}\n\n${interpretationText}\n\n✨ <i>Совет дня:</i> ${advice}`;

      // Отправляем карту с изображением или без
      if (cardImage && cardImage.imageData) {
        try {
          const imageBuffer = Buffer.from(cardImage.imageData, 'base64');
          await bot.sendPhoto(msg.chat.id, imageBuffer, {
            caption: caption,
            parse_mode: 'HTML',
            reply_markup: {
              inline_keyboard: [
                [{ text: '🔮 Подробное толкование', callback_data: 'daily_details' }],
                [{ text: '🃏 Новое гадание', callback_data: 'new_reading' }]
              ]
            }
          });
        } catch (photoError) {
          console.log('Failed to send daily card photo:', photoError.message);
          // Fallback к текстовому сообщению
          await bot.sendMessage(msg.chat.id, caption, {
            parse_mode: 'HTML',
            reply_markup: {
              inline_keyboard: [
                [{ text: '🔮 Подробное толкование', callback_data: 'daily_details' }],
                [{ text: '🃏 Новое гадание', callback_data: 'new_reading' }]
              ]
            }
          });
        }
      } else {
        await bot.sendMessage(msg.chat.id, caption, {
          parse_mode: 'HTML',
          reply_markup: {
            inline_keyboard: [
              [{ text: '🔮 Подробное толкование', callback_data: 'daily_details' }],
              [{ text: '🃏 Новое гадание', callback_data: 'new_reading' }]
            ]
          }
        });
      }

      // Сохраняем карту дня в базу данных
      try {
        const dailyCardData = {
          userId: user.id,
          type: 'daily_card',
          spreadName: 'Карта дня',
          cards: [cardWithState],
          question: 'Карта дня',
          interpretation: interpretationText
        };
        
        await database.createReading(dailyCardData);
      } catch (error) {
        console.log('Failed to save daily card to database:', error.message);
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

      // Определяем текущую фазу луны
      const moonPhase = this.getCurrentMoonPhase();
      
      // Получаем AI рекомендации для лунной фазы
      let lunarRecommendations = null;
      try {
        await bot.sendChatAction(msg.chat.id, 'typing');
        
        const aiResponse = await this.getLunarRecommendations(moonPhase, user);
        lunarRecommendations = aiResponse;
        console.log('Lunar AI recommendations received:', JSON.stringify(aiResponse, null, 2));
      } catch (error) {
        console.log('Lunar AI recommendations failed:', error.message);
      }

      // Формируем текст рекомендаций
      let recommendationsText;
      let practices;
      let avoid;
      
      if (lunarRecommendations && lunarRecommendations.success) {
        recommendationsText = lunarRecommendations.interpretation.interpretation || lunarRecommendations.interpretation.main;
        practices = lunarRecommendations.interpretation.practices || ['Медитация и размышления', 'Работа с интуицией'];
        avoid = lunarRecommendations.interpretation.avoid || ['Конфликтов и споров', 'Поспешных решений'];
      } else {
        // Fallback рекомендации
        recommendationsText = this.getBasicLunarRecommendation(moonPhase);
        practices = this.getBasicLunarPractices(moonPhase);
        avoid = this.getBasicLunarAvoid(moonPhase);
      }

      const practicesText = Array.isArray(practices) ? practices.map(p => `• ${p}`).join('\n') : `• ${practices}`;
      const avoidText = Array.isArray(avoid) ? avoid.map(a => `• ${a}`).join('\n') : `• ${avoid}`;

      const text = `🌙 <b>Лунные рекомендации</b>\n\n<b>${moonPhase.emoji} ${moonPhase.name}</b>\n\n${recommendationsText}\n\n<b>Рекомендуется:</b>\n${practicesText}\n\n<b>Избегайте:</b>\n${avoidText}`;

      await bot.sendMessage(msg.chat.id, text, {
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [
            [{ text: '📅 Полный календарь', callback_data: 'lunar_calendar' }],
            [{ text: '🔮 Гадание по фазе', callback_data: 'lunar_reading' }]
          ]
        }
      });

      // Сохраняем лунную консультацию
      try {
        const lunarData = {
          userId: user.id,
          type: 'lunar_calendar',
          spreadName: 'Лунный календарь',
          cards: [],
          question: 'Лунные рекомендации',
          interpretation: recommendationsText,
          metadata: {
            moonPhase: moonPhase.name,
            date: new Date().toISOString()
          }
        };
        
        await database.createReading(lunarData);
      } catch (error) {
        console.log('Failed to save lunar reading to database:', error.message);
      }

      await database.trackEvent({
        type: 'command_lunar',
        userId: user.id,
        metadata: { moonPhase: moonPhase.name }
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

      // Подтверждаем получение callback query сразу, чтобы избежать timeout
      try {
        await bot.answerCallbackQuery(query.id, {
          text: '⏳ Обрабатываю запрос...'
        });
      } catch (err) {
        // Игнорируем ошибки подтверждения (query is too old)
        if (!err.message.includes('query is too old') && !err.message.includes('query ID is invalid')) {
          console.error('Error answering callback query:', err.message);
        }
      }

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
      
      // Пытаемся ответить на callback query, но не падаем если не получается
      try {
        await bot.answerCallbackQuery(query.id, {
          text: 'Произошла ошибка. Попробуйте позже.',
          show_alert: true
        });
      } catch (answerError) {
        // Игнорируем ошибки ответа на старые query
        if (!answerError.message.includes('query is too old') && !answerError.message.includes('query ID is invalid')) {
          console.error('Error answering callback query in error handler:', answerError.message);
        }
      }
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
          // Проверяем, ожидаем ли мы ввод даты рождения для нумерологии
          if (this.pendingNumerology && this.pendingNumerology.has(chatId)) {
            await this.handleNumerologyInput(bot, msg);
            return;
          }
          
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

    // Сохраняем вопрос в памяти для этого пользователя
    this.pendingQuestions = this.pendingQuestions || new Map();
    const questionId = Date.now().toString(); // Простой ID на основе времени
    this.pendingQuestions.set(chatId, {
      questionId,
      question,
      timestamp: Date.now()
    });

    await bot.sendMessage(chatId, `✨ Отличный вопрос!\n\n"${question}"\n\nВыберите расклад для гадания:`, {
      reply_markup: {
        inline_keyboard: [
          [
            { text: '🃏 Одна карта', callback_data: `reading_single_q_${questionId}` },
            { text: '🃏🃏🃏 Три карты', callback_data: `reading_three_q_${questionId}` }
          ],
          [{ text: '🌟 Кельтский крест', callback_data: `reading_celtic_q_${questionId}` }]
        ]
      }
    });
  }

  /**
   * Получение или создание пользователя
   */
  async ensureUser(telegramUser) {
    try {
      let userResponse = await database.getUserByTelegramId(telegramUser.id);
      let user = userResponse?.user;
      
      if (!user) {
        const userData = {
          telegramId: telegramUser.id,
          username: telegramUser.username || null,
          firstName: telegramUser.first_name || null,
          lastName: telegramUser.last_name || null,
          languageCode: telegramUser.language_code || 'ru'
        };

        const createdResponse = await database.createUser(userData);
        user = createdResponse.user || createdResponse;
      }

      return user;
    } catch (error) {
      console.error('Error ensuring user:', error.message);
      
      // Возвращаем минимальные данные для продолжения работы
      return {
        id: telegramUser.id,
        telegramId: telegramUser.id,
        username: telegramUser.username,
        firstName: telegramUser.first_name,
        lastName: telegramUser.last_name,
        languageCode: telegramUser.language_code || 'ru',
        isPremium: false,
        subscriptionType: 'basic',
        totalReadings: 0,
        dailyReadingsUsed: 0,
        isActive: true
      };
    }
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

  /**
   * Обработчик команды нумерологии
   */
  async handleNumerologyCommand(bot, msg) {
    try {
      const user = await this.ensureUser(msg.from);

      await bot.sendChatAction(msg.chat.id, 'typing');

      // Просим пользователя ввести дату рождения
      await bot.sendMessage(msg.chat.id, '🔢 <b>Нумерологический анализ</b>\n\nДля расчета вашего числа судьбы и персональных рекомендаций, пожалуйста, введите дату рождения в формате ДД.ММ.ГГГГ\n\nНапример: 15.03.1990', {
        parse_mode: 'HTML',
        reply_markup: {
          force_reply: true,
          input_field_placeholder: 'Введите дату рождения...'
        }
      });

      // Сохраняем состояние ожидания даты рождения
      this.pendingNumerology = this.pendingNumerology || new Map();
      this.pendingNumerology.set(msg.chat.id, {
        userId: user.id,
        step: 'waiting_birthdate',
        messageId: msg.message_id
      });

      await database.trackEvent({
        type: 'command_numerology',
        userId: user.id
      });

    } catch (error) {
      console.error('Error in /numerology command:', error);
      await this.sendErrorMessage(bot, msg.chat.id);
    }
  }

  async handleProfileCommand(bot, msg) {
    try {
      const user = await this.ensureUser(msg.from);
      
      const profileText = `👤 <b>Ваш профиль</b>\n\n` +
        `<b>Имя:</b> ${user.firstName || 'Не указано'}\n` +
        `<b>Пользователь:</b> @${user.username || 'Не указан'}\n` +
        `<b>Статус:</b> ${user.isPremium ? '💎 Premium' : '🆓 Базовый'}\n` +
        `<b>Тип подписки:</b> ${user.subscriptionType || 'basic'}\n` +
        `<b>Всего гаданий:</b> ${user.totalReadings || 0}\n` +
        `<b>Использовано сегодня:</b> ${user.dailyReadingsUsed || 0}\n` +
        `<b>Дата регистрации:</b> ${new Date(user.createdAt || Date.now()).toLocaleDateString('ru-RU')}\n`;

      await bot.sendMessage(msg.chat.id, profileText, {
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [
            [{ text: '📊 Статистика', callback_data: 'profile_stats' }],
            [{ text: '⚙️ Настройки', callback_data: 'profile_settings' }],
            [{ text: '💎 Premium', callback_data: 'profile_premium' }]
          ]
        }
      });

    } catch (error) {
      console.error('Error in profile command:', error);
      await this.sendErrorMessage(bot, msg.chat.id);
    }
  }

  async handleHistoryCommand(bot, msg) {
    await bot.sendMessage(msg.chat.id, '📋 История в разработке...');
  }

  async handleSettingsCommand(bot, msg) {
    await bot.sendMessage(msg.chat.id, '⚙️ Настройки в разработке...');
  }

  async handleReadingCallback(bot, chatId, messageId, data, from) {
    try {
      const user = await this.ensureUser(from);
      
      // Определяем тип гадания из callback data
      let readingType, userQuestion = null;
      
      // Проверяем, есть ли в callback data ID вопроса
      if (data.includes('_q_')) {
        const parts = data.split('_q_');
        readingType = parts[0].replace('reading_', '');
        const questionId = parts[1];
        
        // Получаем вопрос из памяти
        const questionData = this.pendingQuestions?.get(chatId);
        if (questionData && questionData.questionId === questionId) {
          userQuestion = questionData.question;
          console.log('User question retrieved:', userQuestion);
          // Очищаем вопрос из памяти после использования
          this.pendingQuestions.delete(chatId);
        } else {
          console.log('Question not found in memory for ID:', questionId);
        }
      } else {
        readingType = data.replace('reading_', '');
      }

      // Начинаем ритуал с правильной последовательности
      await this.conductTarotRitual(bot, chatId, messageId, readingType, userQuestion, user);

    } catch (error) {
      console.error('Error in reading callback:', error);
      await bot.editMessageText('❌ Произошла ошибка при создании гадания. Попробуйте позже.', {
        chat_id: chatId,
        message_id: messageId
      });
    }
  }

  /**
   * Проведение полного ритуала гадания Таро
   */
  async conductTarotRitual(bot, chatId, messageId, readingType, userQuestion, user) {
    try {
      // Этап 1: Подготовка и настройка
      await bot.editMessageText('🔮 *Подготовка к гаданию*\n\n🕯️ Зажигаю свечи...\n🌟 Очищаю энергетическое пространство...\n📿 Настраиваюсь на вашу энергию...', {
        chat_id: chatId,
        message_id: messageId,
        parse_mode: 'Markdown'
      });

      await new Promise(resolve => setTimeout(resolve, 2000));

      // Этап 2: Призыв и сосредоточение
      let focusText = '🌙 *Призываю мудрость древних*\n\n';
      if (userQuestion) {
        focusText += `🧘‍♀️ Сосредотачиваемся на вашем вопросе:\n"${userQuestion}"\n\n`;
      }
      focusText += '🔮 Прошу духов карт показать истину...';

      await bot.editMessageText(focusText, {
        chat_id: chatId,
        message_id: messageId,
        parse_mode: 'Markdown'
      });

      await new Promise(resolve => setTimeout(resolve, 1500));

      // Этап 3: Выбор и подготовка карт
      const { TAROT_CARDS, SPREAD_TYPES } = require('../data/tarot');
      const spread = SPREAD_TYPES[readingType] || SPREAD_TYPES.single;

      await bot.editMessageText(`🃏 *Тасую колоду из ${78} карт Таро*\n\n🌀 Карты выбирают себя сами...\n✨ Энергия вашего вопроса направляет процесс...`, {
        chat_id: chatId,
        message_id: messageId,
        parse_mode: 'Markdown'
      });

      await new Promise(resolve => setTimeout(resolve, 2000));

      // Подготовка карт
      const allCards = [
        ...TAROT_CARDS.major,
        ...TAROT_CARDS.minor.wands,
        ...TAROT_CARDS.minor.cups,
        ...TAROT_CARDS.minor.swords,
        ...TAROT_CARDS.minor.pentacles
      ];

      const shuffledCards = this.shuffleArray([...allCards]);
      const drawnCards = shuffledCards.slice(0, spread.maxCards);

      const cardsWithReverse = drawnCards.map((card, index) => ({
        ...card,
        reversed: Math.random() < 0.25, // 25% шанс реверса
        position: spread.positions[index]?.name || `Позиция ${index + 1}`,
        positionDescription: spread.positions[index]?.description || 'Важный аспект ситуации'
      }));

      // Этап 4: Создание образов карт
      await bot.editMessageText(`🎨 *Создаю мистические образы*\n\n${spread.name}\n\n🖼️ Материализую энергии карт в образы...\n⚡ Каждая карта несет уникальную вибрацию...`, {
        chat_id: chatId,
        message_id: messageId,
        parse_mode: 'Markdown'
      });

      // Генерация изображений
      let cardImages = [];
      try {
        const imageResponse = await Promise.race([
          database.generateSpreadImages(cardsWithReverse, readingType),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Image generation timeout')), 15000))
        ]);
        
        if (imageResponse && imageResponse.success) {
          cardImages = imageResponse.results.filter(r => r.success);
          console.log(`Generated ${cardImages.length} card images successfully`);
        }
      } catch (error) {
        console.log('Card image generation failed:', error.message);
      }

      // Этап 5: Получение мудрости
      await bot.editMessageText(`🔮 *Консультация с высшими силами*\n\n🌌 Соединяюсь с космическим сознанием...\n📜 Интерпретирую послания карт...\n💫 Перевожу символы в понятный язык...`, {
        chat_id: chatId,
        message_id: messageId,
        parse_mode: 'Markdown'
      });

      // Получаем AI интерпретацию
      let aiInterpretation = null;
      try {
        const aiResponse = await this.getAIInterpretationWithQuestion(cardsWithReverse, spread, user, userQuestion);
        aiInterpretation = aiResponse;
        console.log('AI interpretation received successfully');
      } catch (error) {
        console.log('AI interpretation failed:', error.message);
      }

      // Сохраняем гадание в базу данных
      await this.saveReadingToDatabase(cardsWithReverse, spread, readingType, userQuestion, user, aiInterpretation);

      // Этап 6: Начинаем раскрытие карт
      await this.startCardRevelation(bot, chatId, messageId, cardsWithReverse, cardImages, spread, aiInterpretation, userQuestion);

    } catch (error) {
      console.error('Error in tarot ritual:', error);
      throw error;
    }
  }

  /**
   * Начало раскрытия карт с интерактивностью
   */
  async startCardRevelation(bot, chatId, messageId, cards, cardImages, spread, aiInterpretation, userQuestion) {
    // Удаляем сообщение подготовки
    await bot.deleteMessage(chatId, messageId).catch(() => {});

    // Отправляем красивый заголовок расклада
    let headerText = `🔮 *${spread.name}*\n\n`;
    if (userQuestion) {
      headerText += `❓ *Ваш вопрос:* "${userQuestion}"\n\n`;
    }
    headerText += `✨ Карты выбраны. Теперь раскроем их тайны...\n\n`;
    headerText += `🎭 Нажмите на номер карты, чтобы открыть её послание`;

    await bot.sendMessage(chatId, headerText, { parse_mode: 'Markdown' });

    // Сохраняем данные для интерактивного раскрытия
    this.pendingReadings = this.pendingReadings || new Map();
    this.pendingReadings.set(chatId, {
      cards,
      cardImages: cardImages.filter(img => img && img.success && img.imageData && !img.isMock),
      spread,
      aiInterpretation,
      userQuestion,
      revealedCards: new Set(),
      currentStep: 'revelation',
      controlMessageId: null
    });

    // Отправляем красивый расклад с кнопками для раскрытия
    await this.sendMysticalSpreadLayout(bot, chatId, cards, spread);
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
    try {
      // Обработка открытия карт
      if (data.startsWith('reveal_card_')) {
        const cardIndex = parseInt(data.replace('reveal_card_', ''));
        await this.handleCardReveal(bot, chatId, messageId, cardIndex, from);
        return;
      }

      // Обработка нажатия на уже раскрытую карту
      if (data.startsWith('card_revealed_')) {
        const cardIndex = parseInt(data.replace('card_revealed_', ''));
        await this.handleRevealedCardTouch(bot, chatId, messageId, cardIndex, from);
        return;
      }

      if (data === 'reveal_all_cards') {
        await this.handleRevealAllCards(bot, chatId, messageId, from);
        return;
      }

      if (data === 'show_interpretation' || data === 'show_full_interpretation') {
        await this.handleShowFullInterpretation(bot, chatId, messageId, from);
        return;
      }

      switch (data) {
        case 'new_reading':
          // Показываем меню выбора типа гадания
          await bot.editMessageText('🔮 *Создание нового гадания*\n\nВыберите тип расклада:\n\n💡 *Совет:* Для более точного гадания сначала задайте свой вопрос в сообщении, а затем выберите расклад.', {
            chat_id: chatId,
            message_id: messageId,
            parse_mode: 'Markdown',
            reply_markup: {
              inline_keyboard: [
                [
                  { text: '🃏 Одна карта', callback_data: 'reading_single' },
                  { text: '🃏🃏🃏 Три карты', callback_data: 'reading_three' }
                ],
                [
                  { text: '🌟 Кельтский крест', callback_data: 'reading_celtic' },
                  { text: '💕 Отношения', callback_data: 'reading_relationship' }
                ],
                [{ text: '❓ Задать вопрос сначала', callback_data: 'ask_question_first' }]
              ]
            }
          });
          break;

        case 'ask_question_first':
          await bot.editMessageText('❓ *Задайте свой вопрос*\n\nНапишите вопрос, на который хотите получить ответ с помощью карт Таро.\n\nПосле отправки вопроса вам будет предложено выбрать тип расклада.', {
            chat_id: chatId,
            message_id: messageId,
            parse_mode: 'Markdown',
            reply_markup: {
              inline_keyboard: [
                [{ text: '⬅️ Назад к выбору расклада', callback_data: 'new_reading' }]
              ]
            }
          });
          break;

        case 'reading_history':
          await bot.editMessageText('📋 История гаданий в разработке...', {
            chat_id: chatId,
            message_id: messageId,
            reply_markup: {
              inline_keyboard: [
                [{ text: '🔮 Новое гадание', callback_data: 'new_reading' }]
              ]
            }
          });
          break;

        case 'profile_stats':
          await bot.editMessageText('📊 Статистика в разработке...', {
            chat_id: chatId,
            message_id: messageId,
            reply_markup: {
              inline_keyboard: [
                [{ text: '⬅️ Назад к профилю', callback_data: 'back_to_profile' }]
              ]
            }
          });
          break;

        case 'profile_settings':
          await bot.editMessageText('⚙️ Настройки в разработке...', {
            chat_id: chatId,
            message_id: messageId,
            reply_markup: {
              inline_keyboard: [
                [{ text: '⬅️ Назад к профилю', callback_data: 'back_to_profile' }]
              ]
            }
          });
          break;

        case 'profile_premium':
          await bot.editMessageText('💎 Premium функции в разработке...', {
            chat_id: chatId,
            message_id: messageId,
            reply_markup: {
              inline_keyboard: [
                [{ text: '⬅️ Назад к профилю', callback_data: 'back_to_profile' }]
              ]
            }
          });
          break;

        case 'back_to_spread':
          await bot.editMessageText('🔮 Возвращаюсь к раскладу...', {
            chat_id: chatId,
            message_id: messageId
          });
          // Здесь можно добавить логику возврата к раскладу
          break;

        case 'daily_card':
          await this.handleDailyCommand(bot, { chat: { id: chatId }, from });
          break;

        default:
          await bot.editMessageText('⏳ Обработка запроса...', {
            chat_id: chatId,
            message_id: messageId
          });
          break;
      }
    } catch (error) {
      console.error('Error in general callback:', error);
      await bot.editMessageText('❌ Произошла ошибка. Попробуйте позже.', {
        chat_id: chatId,
        message_id: messageId
      });
    }
  }

  async handlePhotoMessage(bot, msg) {
    await bot.sendMessage(msg.chat.id, '📷 Анализ изображений в разработке...');
  }

  async handleVoiceMessage(bot, msg) {
    await bot.sendMessage(msg.chat.id, '🎤 Анализ голосовых сообщений в разработке...');
  }

  async sendErrorMessage(bot, chatId, errorText = 'Произошла ошибка. Попробуйте позже.') {
    await bot.sendMessage(chatId, `❌ ${errorText}`);
  }

  /**
   * Перемешивание массива (алгоритм Фишера-Йетса)
   */
  shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  /**
   * Получение AI интерпретации через API сервера
   */
  async getAIInterpretation(cards, spread, user) {
    try {
      const response = await database.makeRequest('POST', '/ai/interpret', {
        cards: cards,
        spreadType: spread.id,
        positions: spread.positions,
        question: 'Общее гадание',
        user: {
          id: user.id,
          language: user.languageCode || 'ru'
        }
      });

      return response;
    } catch (error) {
      console.error('Failed to get AI interpretation:', error.message);
      throw error;
    }
  }

  /**
   * Получение AI интерпретации с учетом вопроса пользователя
   */
  async getAIInterpretationWithQuestion(cards, spread, user, userQuestion) {
    try {
      const question = userQuestion || 'Общее гадание';
      
      const response = await database.makeRequest('POST', '/ai/interpret', {
        cards: cards,
        spreadType: spread.id,
        positions: spread.positions,
        question: question,
        user: {
          id: user.id,
          language: user.languageCode || 'ru'
        }
      });

      return response;
    } catch (error) {
      console.error('Failed to get AI interpretation with question:', error.message);
      throw error;
    }
  }

  /**
   * Получение AI интерпретации для карты дня
   */
  async getDailyCardInterpretation(card, user) {
    try {
      const response = await database.makeRequest('POST', '/ai/interpret', {
        cards: [card],
        spreadType: 'daily_card',
        positions: [{ name: 'Карта дня', description: 'Главная энергия дня' }],
        question: 'Какую энергию и возможности принесет этот день?',
        user: {
          id: user.id,
          language: user.languageCode || 'ru'
        }
      });

      return response;
    } catch (error) {
      console.error('Failed to get daily card AI interpretation:', error.message);
      throw error;
    }
  }

  /**
   * Получение AI рекомендаций для лунной фазы
   */
  async getLunarRecommendations(moonPhase, user) {
    try {
      const response = await database.makeRequest('POST', '/ai/interpret', {
        cards: [],
        spreadType: 'lunar_calendar',
        positions: [],
        question: `Какие рекомендации и практики подходят для фазы луны "${moonPhase.name}"? Что лучше делать и чего избегать в этот период?`,
        user: {
          id: user.id,
          language: user.languageCode || 'ru'
        },
        metadata: {
          moonPhase: moonPhase.name,
          moonDescription: moonPhase.description
        }
      });

      return response;
    } catch (error) {
      console.error('Failed to get lunar AI recommendations:', error.message);
      throw error;
    }
  }

  /**
   * Определение текущей фазы луны
   */
  getCurrentMoonPhase() {
    const today = new Date();
    const dayOfMonth = today.getDate();
    
    // Простое приближение фаз луны (каждые ~7 дней)
    const phaseIndex = Math.floor((dayOfMonth - 1) / 7) % 4;
    
    const phases = [
      { 
        name: 'Новолуние', 
        emoji: '🌑', 
        description: 'Время новых начинаний и постановки целей' 
      },
      { 
        name: 'Растущая луна', 
        emoji: '🌒', 
        description: 'Период роста, развития и накопления энергии' 
      },
      { 
        name: 'Полнолуние', 
        emoji: '🌕', 
        description: 'Пик энергии, завершение проектов и благодарность' 
      },
      { 
        name: 'Убывающая луна', 
        emoji: '🌘', 
        description: 'Время освобождения, очищения и рефлексии' 
      }
    ];
    
    return phases[phaseIndex];
  }

  /**
   * Базовые рекомендации для фазы луны
   */
  getBasicLunarRecommendation(moonPhase) {
    const recommendations = {
      'Новолуние': 'Идеальное время для постановки новых целей и начала важных проектов. Энергия луны поддерживает все новые начинания.',
      'Растущая луна': 'Период активного роста и развития. Сейчас хорошо заниматься саморазвитием и воплощать планы в жизнь.',
      'Полнолуние': 'Пик лунной энергии. Время завершения проектов, выражения благодарности и работы с интуицией.',
      'Убывающая луна': 'Период освобождения от старого и ненужного. Хорошо заниматься очищением на всех уровнях.'
    };
    
    return recommendations[moonPhase.name] || 'Каждая фаза луны несет свою особую энергию для духовного развития.';
  }

  /**
   * Базовые практики для фазы луны
   */
  getBasicLunarPractices(moonPhase) {
    const practices = {
      'Новолуние': ['Медитация на цели', 'Планирование новых проектов', 'Работа с намерениями'],
      'Растущая луна': ['Активные практики', 'Изучение нового', 'Развитие навыков'],
      'Полнолуние': ['Благодарственные ритуалы', 'Работа с интуицией', 'Завершение дел'],
      'Убывающая луна': ['Очищающие практики', 'Освобождение от старого', 'Рефлексия и анализ']
    };
    
    return practices[moonPhase.name] || ['Медитация', 'Работа с энергией'];
  }

  /**
   * Что избегать в фазу луны
   */
  getBasicLunarAvoid(moonPhase) {
    const avoid = {
      'Новолуние': ['Завершения важных дел', 'Принятия окончательных решений'],
      'Растущая луна': ['Пассивности', 'Откладывания важных дел'],
      'Полнолуние': ['Начала новых проектов', 'Перегрузки энергией'],
      'Убывающая луна': ['Новых начинаний', 'Накопления негатива']
    };
    
    return avoid[moonPhase.name] || ['Негативных мыслей', 'Поспешных решений'];
  }

  /**
   * Получение AI интерпретации для нумерологии
   */
  async getNumerologyInterpretation(numerologyResult, user) {
    try {
      const response = await database.makeRequest('POST', '/ai/interpret', {
        cards: [],
        spreadType: 'numerology',
        positions: [],
        question: `Дай подробную интерпретацию нумерологического профиля. Число судьбы: ${numerologyResult.lifePathNumber}, Число личности: ${numerologyResult.personalityNumber}, Число души: ${numerologyResult.soulNumber}. Какие это говорит о характере, предназначении и жизненном пути человека?`,
        user: {
          id: user.id,
          language: user.languageCode || 'ru'
        },
        metadata: {
          lifePathNumber: numerologyResult.lifePathNumber,
          personalityNumber: numerologyResult.personalityNumber,
          soulNumber: numerologyResult.soulNumber
        }
      });

      return response;
    } catch (error) {
      console.error('Failed to get numerology AI interpretation:', error.message);
      throw error;
    }
  }

  /**
   * Расчет нумерологических чисел
   */
  calculateNumerology(birthDate) {
    const day = birthDate.getDate();
    const month = birthDate.getMonth() + 1;
    const year = birthDate.getFullYear();

    // Число судьбы (сумма всех цифр даты рождения)
    const lifePathNumber = this.reduceToSingleDigit(day + month + year);

    // Число личности (день рождения)
    const personalityNumber = this.reduceToSingleDigit(day);

    // Число души (месяц рождения)
    const soulNumber = this.reduceToSingleDigit(month);

    return {
      lifePathNumber,
      personalityNumber,
      soulNumber,
      birthDay: day,
      birthMonth: month,
      birthYear: year
    };
  }

  /**
   * Сведение числа к однозначному
   */
  reduceToSingleDigit(number) {
    while (number > 9) {
      number = Math.floor(number / 10) + (number % 10);
    }
    return number;
  }

  /**
   * Базовая интерпретация нумерологии
   */
  getBasicNumerologyInterpretation(numerologyResult) {
    const lifePathMeanings = {
      1: 'Лидерство, независимость, новаторство. Вы прирожденный лидер с сильной волей.',
      2: 'Сотрудничество, дипломатия, чувствительность. Вы миротворец и командный игрок.',
      3: 'Творчество, общение, оптимизм. У вас яркая личность и творческие способности.',
      4: 'Практичность, надежность, трудолюбие. Вы основательны и ответственны.',
      5: 'Свобода, приключения, перемены. Вы любите разнообразие и новые впечатления.',
      6: 'Забота, ответственность, семья. Вы прирожденный защитник и опекун.',
      7: 'Духовность, анализ, мудрость. Вы глубокий мыслитель и искатель истины.',
      8: 'Материальный успех, власть, достижения. У вас сильные организаторские способности.',
      9: 'Гуманизм, щедрость, мудрость. Вы стремитесь помогать людям и миру.'
    };

    const personalityMeanings = {
      1: 'Уверенная и сильная личность',
      2: 'Мягкая и дипломатичная натура',
      3: 'Яркая и творческая индивидуальность',
      4: 'Надежная и практичная личность',
      5: 'Свободолюбивая и энергичная натура',
      6: 'Заботливая и ответственная личность',
      7: 'Глубокая и мудрая натура',
      8: 'Амбициозная и целеустремленная личность',
      9: 'Великодушная и мудрая натура'
    };

    const interpretation = `Ваше число судьбы ${numerologyResult.lifePathNumber} говорит о том, что ${lifePathMeanings[numerologyResult.lifePathNumber] || 'у вас особый жизненный путь'}. ` +
      `Число личности ${numerologyResult.personalityNumber} показывает, что у вас ${personalityMeanings[numerologyResult.personalityNumber] || 'уникальная личность'}.`;

    return interpretation;
  }

  /**
   * Базовые рекомендации по нумерологии
   */
  getBasicNumerologyRecommendations(numerologyResult) {
    const recommendations = {
      1: 'Развивайте лидерские качества, не бойтесь инициативы и новых проектов.',
      2: 'Работайте в команде, развивайте дипломатические навыки и эмпатию.',
      3: 'Выражайте свою творческую натуру, общайтесь и вдохновляйте других.',
      4: 'Будьте методичны и последовательны, стройте прочный фундамент для будущего.',
      5: 'Не бойтесь перемен, путешествуйте и изучайте новое.',
      6: 'Заботьтесь о близких, создавайте гармонию в семье и обществе.',
      7: 'Развивайте духовность, медитируйте и ищите глубинные знания.',
      8: 'Стремитесь к материальному успеху, развивайте бизнес-навыки.',
      9: 'Помогайте людям, занимайтесь благотворительностью и делитесь мудростью.'
    };

    return recommendations[numerologyResult.lifePathNumber] || 'Следуйте своему внутреннему голосу и развивайте свои природные таланты.';
  }

  /**
   * Обработка ввода для нумерологии
   */
  async handleNumerologyInput(bot, msg) {
    try {
      const chatId = msg.chat.id;
      const input = msg.text.trim();
      const numerologyData = this.pendingNumerology.get(chatId);

      if (!numerologyData) {
        return;
      }

      // Проверяем формат даты
      const dateRegex = /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/;
      const match = input.match(dateRegex);

      if (!match) {
        await bot.sendMessage(chatId, '❌ Неверный формат даты. Пожалуйста, введите дату в формате ДД.ММ.ГГГГ\n\nНапример: 15.03.1990');
        return;
      }

      const day = parseInt(match[1]);
      const month = parseInt(match[2]);
      const year = parseInt(match[3]);

      // Проверяем корректность даты
      if (day < 1 || day > 31 || month < 1 || month > 12 || year < 1900 || year > new Date().getFullYear()) {
        await bot.sendMessage(chatId, '❌ Некорректная дата. Проверьте правильность введенных данных.');
        return;
      }

      const birthDate = new Date(year, month - 1, day);
      
      await bot.sendChatAction(chatId, 'typing');

      // Рассчитываем нумерологические данные
      const numerologyResult = this.calculateNumerology(birthDate);

      // Получаем AI интерпретацию
      let aiInterpretation = null;
      try {
        const aiResponse = await this.getNumerologyInterpretation(numerologyResult, { id: numerologyData.userId, languageCode: 'ru' });
        aiInterpretation = aiResponse;
        console.log('Numerology AI interpretation received:', JSON.stringify(aiResponse, null, 2));
      } catch (error) {
        console.log('Numerology AI interpretation failed:', error.message);
      }

      // Формируем результат
      let interpretationText;
      let recommendations;
      
      if (aiInterpretation && aiInterpretation.success) {
        interpretationText = aiInterpretation.interpretation.interpretation || aiInterpretation.interpretation.main;
        recommendations = aiInterpretation.interpretation.advice || aiInterpretation.interpretation.recommendations;
      } else {
        interpretationText = this.getBasicNumerologyInterpretation(numerologyResult);
        recommendations = this.getBasicNumerologyRecommendations(numerologyResult);
      }

      const resultText = `🔢 <b>Ваш нумерологический профиль</b>\n\n` +
        `📅 <b>Дата рождения:</b> ${day}.${month}.${year}\n\n` +
        `🎯 <b>Число судьбы:</b> ${numerologyResult.lifePathNumber}\n` +
        `💫 <b>Число личности:</b> ${numerologyResult.personalityNumber}\n` +
        `✨ <b>Число души:</b> ${numerologyResult.soulNumber}\n\n` +
        `<b>Интерпретация:</b>\n${interpretationText}\n\n` +
        `<b>Рекомендации:</b>\n${recommendations}`;

      await bot.sendMessage(chatId, resultText, {
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [
            [{ text: '📊 Подробный анализ', callback_data: 'numerology_detailed' }],
            [{ text: '🔮 Новое гадание', callback_data: 'new_reading' }]
          ]
        }
      });

      // Сохраняем нумерологический анализ
      try {
        const numerologyData = {
          userId: numerologyData.userId,
          type: 'numerology',
          spreadName: 'Нумерологический анализ',
          cards: [],
          question: 'Нумерологический профиль',
          interpretation: interpretationText,
          metadata: {
            birthDate: birthDate.toISOString(),
            lifePathNumber: numerologyResult.lifePathNumber,
            personalityNumber: numerologyResult.personalityNumber,
            soulNumber: numerologyResult.soulNumber
          }
        };
        
        await database.createReading(numerologyData);
      } catch (error) {
        console.log('Failed to save numerology reading to database:', error.message);
      }

      // Очищаем состояние
      this.pendingNumerology.delete(chatId);

    } catch (error) {
      console.error('Error in numerology input:', error);
      await this.sendErrorMessage(bot, msg.chat.id);
      this.pendingNumerology?.delete(msg.chat.id);
    }
  }

  /**
   * Базовые значения карт для младших арканов
   */
  getBasicCardMeaning(card, isReversed) {
    const suitMeanings = {
      wands: isReversed 
        ? 'Блокировка энергии, отсутствие мотивации, застой в делах'
        : 'Энергия, действие, творчество, страсть',
      cups: isReversed
        ? 'Эмоциональная нестабильность, разочарование, закрытость'
        : 'Любовь, эмоции, интуиция, духовность',
      swords: isReversed
        ? 'Ментальная путаница, конфликты, агрессия'
        : 'Мысли, коммуникация, конфликты, справедливость',
      pentacles: isReversed
        ? 'Материальные трудности, упущенные возможности'
        : 'Материальные блага, практичность, стабильность'
    };

    return suitMeanings[card.suit] || 'Значение этой карты требует индивидуальной интерпретации';
  }

  /**
   * Обработка открытия одной карты с мистическим раскрытием
   */
  async handleCardReveal(bot, chatId, messageId, cardIndex, from) {
    try {
      const readingData = this.pendingReadings?.get(chatId);
      if (!readingData) {
        console.log('Reading data not found for chat:', chatId);
        return;
      }

      const { cards, cardImages, spread, revealedCards, aiInterpretation } = readingData;
      const card = cards[cardIndex];

      if (!card || revealedCards.has(cardIndex)) {
        console.log('Card not found or already revealed:', cardIndex);
        return;
      }

      // Отмечаем карту как открытую
      revealedCards.add(cardIndex);

      // Мистическое раскрытие карты
      await this.revealCardMystically(bot, chatId, card, cardIndex, cardImages[cardIndex], spread, aiInterpretation);

      // Обновляем кнопки управления
      await this.updateRevelationControls(bot, chatId, cards, revealedCards, spread);

      console.log(`Card revealed: ${card.name} for user ${from.id}`);

    } catch (error) {
      console.error('Error revealing card:', error);
    }
  }

  /**
   * Мистическое раскрытие одной карты
   */
  async revealCardMystically(bot, chatId, card, cardIndex, cardImage, spread, aiInterpretation) {
    const position = spread.positions[cardIndex];
    
    // Сначала показываем мистическое сообщение
    const mysticalText = `✨ *Карта ${cardIndex + 1} раскрывает свои тайны...*\n\n` +
      `🔮 *${position.name}*\n` +
      `${position.description || 'Ключевая позиция в раскладе'}\n\n` +
      `*Карта говорит:* "${card.name}"${card.reversed ? ' *(перевернутая)*' : ''}`;

    await bot.sendMessage(chatId, mysticalText, { parse_mode: 'Markdown' });

    // Пауза для драматического эффекта
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Отправляем изображение карты если есть
    if (cardImage && cardImage.imageData) {
      console.log(`Card image for ${card.name}: valid=${this.isValidBase64Image(cardImage.imageData)}, length=${cardImage.imageData.length}, isMock=${cardImage.isMock}`);
      
      if (this.isValidBase64Image(cardImage.imageData)) {
        try {
          const imageBuffer = Buffer.from(cardImage.imageData, 'base64');
          console.log(`Sending card image for ${card.name}, buffer size: ${imageBuffer.length}`);
          
          // Ограничиваем длину caption для Telegram (максимум 1024 символа)
          const mysticalDesc = this.getCardMysticalDescription(card);
          let caption = `🃏 *${card.name}*${card.reversed ? ' *(перевернутая)*' : ''}`;
          
          if (mysticalDesc && (caption.length + mysticalDesc.length + 4) <= 1020) {
            caption += `\n\n${mysticalDesc}`;
          }
          
          await bot.sendPhoto(chatId, imageBuffer, {
            caption,
            parse_mode: 'Markdown'
          }, {
            filename: `${card.name.replace(/\s+/g, '_')}.png`,
            contentType: 'image/png'
          });
          
          console.log(`Successfully sent card image for ${card.name}`);
        } catch (imageError) {
          console.log('Failed to send card image:', imageError.message);
          // Отправляем текстовое описание
          await bot.sendMessage(chatId, `🃏 *${card.name}*${card.reversed ? ' *(перевернутая)*' : ''}\n\n${this.getCardMysticalDescription(card)}`, {
            parse_mode: 'Markdown'
          });
        }
      } else {
        console.log(`Invalid card image for ${card.name}, sending text instead`);
        // Текстовое описание карты
        await bot.sendMessage(chatId, `🃏 *${card.name}*${card.reversed ? ' *(перевернутая)*' : ''}\n\n${this.getCardMysticalDescription(card)}`, {
          parse_mode: 'Markdown'
        });
      }
    } else {
      console.log(`No card image data for ${card.name}, sending text`);
      // Текстовое описание карты
      await bot.sendMessage(chatId, `🃏 *${card.name}*${card.reversed ? ' *(перевернутая)*' : ''}\n\n${this.getCardMysticalDescription(card)}`, {
        parse_mode: 'Markdown'
      });
    }

    // Если есть AI интерпретация для этой позиции, показываем её
    if (aiInterpretation && aiInterpretation.success) {
      const positionInterpretation = this.extractPositionInterpretation(aiInterpretation, cardIndex, position.name);
      if (positionInterpretation) {
        await bot.sendMessage(chatId, `💫 *Мудрость карты:*\n\n${positionInterpretation}`, { parse_mode: 'Markdown' });
      }
    }
  }

  /**
   * Получение мистического описания карты
   */
  getCardMysticalDescription(card) {
    const keywords = card.keywords || [];
    const description = card.description || 'Карта несет важное послание для вас';
    
    let mysticalDesc = `${card.unicode || '🔮'} ${description}\n\n`;
    
    if (keywords.length > 0) {
      mysticalDesc += `*Ключевые энергии:* ${keywords.slice(0, 3).join(', ')}\n\n`;
    }
    
    if (card.reversed) {
      mysticalDesc += `⚠️ *Карта перевернута:* Энергия блокирована или требует внутренней работы`;
    } else {
      mysticalDesc += `✅ *Прямое положение:* Энергия активна и доступна`;
    }
    
    return mysticalDesc;
  }

  /**
   * Извлечение интерпретации для конкретной позиции
   */
  extractPositionInterpretation(aiInterpretation, cardIndex, positionName) {
    const interpretation = aiInterpretation.interpretation?.interpretation || aiInterpretation.interpretation?.main || '';
    
    // Пытаемся найти упоминание позиции в интерпретации
    const lines = interpretation.split('\n');
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].toLowerCase();
      if (line.includes(positionName.toLowerCase()) || line.includes(`${cardIndex + 1}`)) {
        // Возвращаем эту строку и следующие 2-3 строки как контекст
        return lines.slice(i, i + 3).join('\n').trim();
      }
    }
    
    // Если не нашли конкретную интерпретацию, возвращаем общую мудрость
    const sentences = interpretation.split('. ');
    return sentences[cardIndex] || sentences[0] || 'Карта говорит о важных изменениях в вашей жизни.';
  }

  /**
   * Обработка открытия всех карт сразу
   */
  async handleRevealAllCards(bot, chatId, messageId, from) {
    try {
      const readingData = this.pendingReadings?.get(chatId);
      if (!readingData) {
        console.log('Reading data not found for chat:', chatId);
        return;
      }

      const { cards, cardImages, spread, revealedCards, aiInterpretation } = readingData;

      await bot.sendMessage(chatId, '🌟 *Раскрываю все карты одновременно...*\n\n🔮 Готовьтесь принять всю мудрость расклада!', { 
        parse_mode: 'Markdown' 
      });

      // Раскрываем все оставшиеся карты
      for (let i = 0; i < cards.length; i++) {
        if (!revealedCards.has(i)) {
          const card = cards[i];
          const cardImage = cardImages[i];

          // Мистическое раскрытие каждой карты
          await this.revealCardMystically(bot, chatId, card, i, cardImage, spread, aiInterpretation);
          revealedCards.add(i);

          // Пауза между картами для лучшего восприятия
          await new Promise(resolve => setTimeout(resolve, 1200));
        }
      }

      console.log(`All cards revealed for user ${from.id}`);

      // Финальное сообщение
      await bot.sendMessage(chatId, '✨ *Все карты раскрыты!*\n\n🔮 Теперь вы можете получить полное толкование всего расклада.', {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: '📜 Полное толкование', callback_data: 'show_full_interpretation' }],
            [{ text: '🔮 Новое гадание', callback_data: 'new_reading' }]
          ]
        }
      });

    } catch (error) {
      console.error('Error revealing all cards:', error);
    }
  }

  /**
   * Обработка нажатия на уже раскрытую карту (показать детали)
   */
  async handleRevealedCardTouch(bot, chatId, messageId, cardIndex, from) {
    try {
      const readingData = this.pendingReadings?.get(chatId);
      if (!readingData) {
        console.log('Reading data not found for chat:', chatId);
        return;
      }

      const { cards, spread, aiInterpretation } = readingData;
      const card = cards[cardIndex];
      const position = spread.positions[cardIndex];

      if (!card) {
        console.log('Card not found at index:', cardIndex);
        return;
      }

      // Показываем детальную информацию о карте
      let detailText = `🃏 *ДЕТАЛИ КАРТЫ*\n\n`;
      detailText += `**${card.name}**${card.reversed ? ' *(перевернутая)*' : ''}\n\n`;
      detailText += `🎯 *Позиция:* ${position.name}\n`;
      detailText += `📝 *Значение позиции:* ${position.description || 'Ключевая позиция в раскладе'}\n\n`;
      
      // Добавляем дополнительные детали карты
      if (card.element) {
        detailText += `🌟 *Стихия:* ${card.element}\n`;
      }
      if (card.suit) {
        detailText += `♠️ *Масть:* ${this.getSuitName(card.suit)}\n`;
      }
      if (card.number) {
        detailText += `🔢 *Номер:* ${card.number}\n`;
      }
      
      detailText += `\n${this.getCardMysticalDescription(card)}\n\n`;

      // Добавляем интерпретацию для этой позиции
      if (aiInterpretation && aiInterpretation.success) {
        const positionInterpretation = this.extractPositionInterpretation(aiInterpretation, cardIndex, position.name);
        if (positionInterpretation) {
          detailText += `💫 *Мудрость для вас:*\n${positionInterpretation}`;
        }
      }

      await bot.sendMessage(chatId, detailText, {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: '🔮 Вернуться к раскладу', callback_data: 'back_to_spread' }],
            [{ text: '📜 Полное толкование', callback_data: 'show_full_interpretation' }]
          ]
        }
      });

      console.log(`Card details shown: ${card.name} for user ${from.id}`);

    } catch (error) {
      console.error('Error showing card details:', error);
    }
  }

  /**
   * Получение названия масти
   */
  getSuitName(suit) {
    const suitNames = {
      'wands': 'Жезлы',
      'cups': 'Кубки', 
      'swords': 'Мечи',
      'pentacles': 'Пентакли'
    };
    return suitNames[suit] || suit;
  }

  /**
   * Обработка показа полной интерпретации
   */
  async handleShowFullInterpretation(bot, chatId, messageId, from) {
    try {
      const readingData = this.pendingReadings?.get(chatId);
      if (!readingData) {
        console.log('Reading data not found for chat:', chatId);
        return;
      }

      const { cards, spread, aiInterpretation, userQuestion } = readingData;

      // Формируем полную интерпретацию
      await this.sendFullReadingInterpretation(bot, chatId, cards, spread, aiInterpretation, userQuestion);

      console.log(`Full interpretation shown for user ${from.id}`);

      // Очищаем данные
      this.pendingReadings?.delete(chatId);

    } catch (error) {
      console.error('Error showing full interpretation:', error);
    }
  }

  /**
   * Отправка полной интерпретации гадания
   */
  async sendFullReadingInterpretation(bot, chatId, cards, spread, aiInterpretation, userQuestion) {
    // Заголовок интерпретации
    let interpretationText = `📜 *ПОЛНОЕ ТОЛКОВАНИЕ РАСКЛАДА*\n\n`;
    interpretationText += `🔮 *${spread.name}*\n\n`;
    
    if (userQuestion) {
      interpretationText += `❓ *Ваш вопрос:* "${userQuestion}"\n\n`;
    }

    await bot.sendMessage(chatId, interpretationText, { parse_mode: 'Markdown' });

    // Показываем каждую карту с её значением
    for (let i = 0; i < cards.length; i++) {
      const card = cards[i];
      const position = spread.positions[i];
      
      let cardText = `🃏 *${position.name}*\n`;
      cardText += `${card.unicode || '🔮'} **${card.name}**${card.reversed ? ' *(перевернутая)*' : ''}\n\n`;
      cardText += `${position.description || 'Ключевая позиция в раскладе'}\n\n`;
      cardText += `${this.getCardMysticalDescription(card)}`;

      await bot.sendMessage(chatId, cardText, { parse_mode: 'Markdown' });
      
      // Пауза между картами
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    // AI интерпретация
    if (aiInterpretation && aiInterpretation.success && aiInterpretation.interpretation) {
      let aiText = `🌟 *МУДРОСТЬ ВЫСШИХ СИЛ*\n\n`;
      
      if (aiInterpretation.interpretation.interpretation) {
        aiText += `${aiInterpretation.interpretation.interpretation}\n\n`;
      }
      
      if (aiInterpretation.interpretation.summary) {
        aiText += `📋 *Резюме:*\n${aiInterpretation.interpretation.summary}\n\n`;
      }
      
      if (aiInterpretation.interpretation.advice) {
        aiText += `💡 *Совет мудрецов:*\n${aiInterpretation.interpretation.advice}`;
      }

      await bot.sendMessage(chatId, aiText, { parse_mode: 'Markdown' });
    } else {
      // Fallback интерпретация
      const fallbackText = `🌟 *ТРАДИЦИОННОЕ ТОЛКОВАНИЕ*\n\n` +
        `Карты выбрали себя сами, чтобы показать вам путь. ` +
        `Каждая несет важное послание о вашей ситуации. ` +
        `Доверьтесь своей интуиции при интерпретации символов.`;

      await bot.sendMessage(chatId, fallbackText, { parse_mode: 'Markdown' });
    }

    // Заключительное сообщение
    const closingText = `✨ *ЗАКЛЮЧЕНИЕ*\n\n` +
      `Гадание завершено. Пусть мудрость карт направит вас на пути к гармонии и успеху.\n\n` +
      `🙏 Благодарю духов карт за их послания.`;

    await bot.sendMessage(chatId, closingText, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: '🔮 Новое гадание', callback_data: 'new_reading' }],
          [{ text: '📋 История гаданий', callback_data: 'reading_history' }],
          [{ text: '🌙 Карта дня', callback_data: 'daily_card' }]
        ]
      }
    });
  }

  /**
   * Создание мистического расклада с интерактивными элементами
   */
  async sendMysticalSpreadLayout(bot, chatId, cards, spread) {
    let layoutText = `🔮 *${spread.name}*\n\n`;
    
    // Показываем позиции карт
    cards.forEach((card, index) => {
      const position = spread.positions[index];
      layoutText += `🎭 *Позиция ${index + 1}:* ${position.name}\n`;
      layoutText += `   ${position.description || 'Ключевая позиция в раскладе'}\n\n`;
    });

    layoutText += `✨ *Нажмите на кнопку, чтобы открыть карту*`;

    await bot.sendMessage(chatId, layoutText, { parse_mode: 'Markdown' });

    // Отправляем кнопки для раскрытия карт
    await this.sendRevelationButtons(bot, chatId, cards, new Set());
  }

  /**
   * Отправка кнопок для раскрытия карт
   */
  async sendRevelationButtons(bot, chatId, cards, revealedCards) {
    const buttons = [];
    
    // Создаем кнопки для каждой карты
    const cardButtons = [];
    for (let i = 0; i < cards.length; i++) {
      if (!revealedCards.has(i)) {
        cardButtons.push({
          text: `🎭 Карта ${i + 1}`,
          callback_data: `reveal_card_${i}`
        });
      } else {
        cardButtons.push({
          text: `✨ Карта ${i + 1} ✨`,
          callback_data: `card_revealed_${i}`
        });
      }
    }

    // Разбиваем кнопки по рядам (максимум 2 в ряду для лучшего UX)
    for (let i = 0; i < cardButtons.length; i += 2) {
      buttons.push(cardButtons.slice(i, i + 2));
    }

    // Дополнительные кнопки управления
    const controlButtons = [];
    
    if (revealedCards.size > 0 && revealedCards.size < cards.length) {
      controlButtons.push({ text: '🌟 Открыть все карты', callback_data: 'reveal_all_cards' });
    }
    
    if (revealedCards.size > 0) {
      controlButtons.push({ text: '📜 Получить полное толкование', callback_data: 'show_full_interpretation' });
    }

    if (controlButtons.length > 0) {
      buttons.push(controlButtons);
    }

    // Кнопка нового гадания всегда внизу
    buttons.push([{ text: '🔮 Новое гадание', callback_data: 'new_reading' }]);

    const controlMessage = await bot.sendMessage(chatId, '🎯 *Управление раскладом:*', {
      reply_markup: { inline_keyboard: buttons },
      parse_mode: 'Markdown'
    });

    // Сохраняем ID сообщения с кнопками
    const readingData = this.pendingReadings?.get(chatId);
    if (readingData) {
      readingData.controlMessageId = controlMessage.message_id;
      this.pendingReadings.set(chatId, readingData);
    }
  }

  /**
   * Обновление кнопок управления раскрытием
   */
  async updateRevelationControls(bot, chatId, cards, revealedCards, spread) {
    const readingData = this.pendingReadings?.get(chatId);
    if (!readingData) return;

    // Удаляем старые кнопки
    if (readingData.controlMessageId) {
      await bot.deleteMessage(chatId, readingData.controlMessageId).catch(() => {});
    }

    // Отправляем обновленные кнопки
    await this.sendRevelationButtons(bot, chatId, cards, revealedCards);
  }

  /**
   * Сохранение гадания в базу данных
   */
  async saveReadingToDatabase(cards, spread, readingType, userQuestion, user, aiInterpretation) {
    try {
      // Конвертируем тип гадания в правильный формат для модели
      let dbReadingType;
      switch (readingType) {
        case 'single':
          dbReadingType = 'single_card';
          break;
        case 'three':
          dbReadingType = 'three_cards';
          break;
        case 'celtic':
          dbReadingType = 'celtic_cross';
          break;
        case 'relationship':
          dbReadingType = 'relationship';
          break;
        default:
          dbReadingType = 'single_card';
      }

      const readingData = {
        userId: user.id,
        type: dbReadingType,
        spreadName: spread.name,
        cards: cards,
        positions: spread.positions,
        question: userQuestion || 'Общее гадание',
        interpretation: (aiInterpretation && aiInterpretation.success && aiInterpretation.interpretation) 
          ? aiInterpretation.interpretation.interpretation 
          : 'Гадание проведено с использованием традиционных методов'
      };

      await database.createReading(readingData);
      console.log('Reading saved to database successfully');
    } catch (error) {
      console.log('Failed to save reading to database:', error.message);
    }
  }

  /**
   * Расклад из трех карт в ряд
   */
  async sendThreeCardLayout(bot, chatId, cards, spread, mode, revealedCards) {
    const readingData = this.pendingReadings?.get(chatId);
    
    // Отправляем карты в ряд как медиагруппу
    const mediaGroup = [];
    for (let i = 0; i < cards.length; i++) {
      const card = cards[i];
      const cardImage = readingData.cardImages[i];
      
      if (revealedCards.has(i)) {
        // Открытая карта
        if (cardImage && cardImage.imageData && this.isValidBase64Image(cardImage.imageData)) {
          try {
            const imageBuffer = Buffer.from(cardImage.imageData, 'base64');
            mediaGroup.push({
              type: 'photo',
              media: imageBuffer,
              caption: i === 0 ? `🔮 <b>${spread.name}</b>\n\n🃏 ${card.name}${card.reversed ? ' (перевернутая)' : ''}\n${spread.positions[i]?.name}` : `🃏 ${card.name}${card.reversed ? ' (перевернутая)' : ''}\n${spread.positions[i]?.name}`,
              parse_mode: 'HTML'
            });
          } catch (imageError) {
            console.log(`Failed to process card image ${i}:`, imageError.message);
            // Fallback к заблюренному изображению
            const blurredImage = await this.createBlurredCardImage();
            mediaGroup.push({
              type: 'photo',
              media: blurredImage,
              caption: `🃏 ${card.name}${card.reversed ? ' (перевернутая)' : ''}\n${spread.positions[i]?.name}\n(Ошибка загрузки изображения)`,
              parse_mode: 'HTML'
            });
          }
        } else {
          // Если изображение невалидно, используем заблюренное
          const blurredImage = await this.createBlurredCardImage();
          mediaGroup.push({
            type: 'photo',
            media: blurredImage,
            caption: `🃏 ${card.name}${card.reversed ? ' (перевернутая)' : ''}\n${spread.positions[i]?.name}`,
            parse_mode: 'HTML'
          });
        }
      } else {
        // Закрытая карта (рубашка)
        const blurredImage = await this.createBlurredCardImage();
        mediaGroup.push({
          type: 'photo',
          media: blurredImage,
          caption: i === 0 ? `🔮 <b>${spread.name}</b>\n\n🎭 ${spread.positions[i]?.name}\n(Нажмите кнопку чтобы открыть)` : `🎭 ${spread.positions[i]?.name}\n(Нажмите кнопку чтобы открыть)`,
          parse_mode: 'HTML'
        });
      }
    }

    // Отправляем медиагруппу
    await bot.sendMediaGroup(chatId, mediaGroup);

    // Отправляем кнопки управления
    await this.sendControlButtons(bot, chatId, cards, mode, revealedCards);
  }

  /**
   * Расклад кельтского креста
   */
  async sendCelticCrossLayout(bot, chatId, cards, spread, mode, revealedCards) {
    const readingData = this.pendingReadings?.get(chatId);
    
    // Отправляем заголовок
    await bot.sendMessage(chatId, `🔮 <b>${spread.name}</b>\n\n✨ Древний расклад кельтских друидов`, {
      parse_mode: 'HTML'
    });

    // Отправляем карты группами по позициям креста
    // Центр (карты 0, 1)
    const centerGroup = [];
    for (let i = 0; i < 2; i++) {
      const card = cards[i];
      const cardImage = readingData.cardImages[i];
      
      if (revealedCards.has(i)) {
        centerGroup.push({
          type: 'photo',
          media: Buffer.from(cardImage.imageData, 'base64'),
          caption: `🃏 ${card.name}${card.reversed ? ' (перевернутая)' : ''}\n${spread.positions[i]?.name}`,
          parse_mode: 'HTML'
        });
      } else {
        const blurredImage = await this.createBlurredCardImage();
        centerGroup.push({
          type: 'photo',
          media: blurredImage,
          caption: `🎭 ${spread.positions[i]?.name}\n(Нажмите кнопку чтобы открыть)`,
          parse_mode: 'HTML'
        });
      }
    }

    if (centerGroup.length > 0) {
      await bot.sendMediaGroup(chatId, centerGroup);
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    // Остальные карты попарно
    for (let i = 2; i < cards.length; i += 2) {
      const pairGroup = [];
      for (let j = i; j < Math.min(i + 2, cards.length); j++) {
        const card = cards[j];
        const cardImage = readingData.cardImages[j];
        
        if (revealedCards.has(j)) {
          pairGroup.push({
            type: 'photo',
            media: Buffer.from(cardImage.imageData, 'base64'),
            caption: `🃏 ${card.name}${card.reversed ? ' (перевернутая)' : ''}\n${spread.positions[j]?.name}`,
            parse_mode: 'HTML'
          });
        } else {
          const blurredImage = await this.createBlurredCardImage();
          pairGroup.push({
            type: 'photo',
            media: blurredImage,
            caption: `🎭 ${spread.positions[j]?.name}\n(Нажмите кнопку чтобы открыть)`,
            parse_mode: 'HTML'
          });
        }
      }
      
      if (pairGroup.length > 0) {
        await bot.sendMediaGroup(chatId, pairGroup);
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    // Отправляем кнопки управления
    await this.sendControlButtons(bot, chatId, cards, mode, revealedCards);
  }

  /**
   * Расклад одной карты
   */
  async sendSingleCardLayout(bot, chatId, cards, spread, mode, revealedCards) {
    const readingData = this.pendingReadings?.get(chatId);
    const card = cards[0];
    const cardImage = readingData.cardImages[0];
    
    if (revealedCards.has(0)) {
      // Открытая карта
      const imageBuffer = Buffer.from(cardImage.imageData, 'base64');
      await bot.sendPhoto(chatId, imageBuffer, {
        caption: `🔮 <b>${spread.name}</b>\n\n🃏 ${card.name}${card.reversed ? ' (перевернутая)' : ''}\n\n${spread.positions[0]?.name}`,
        parse_mode: 'HTML'
      });
    } else {
      // Закрытая карта
      const blurredImage = await this.createBlurredCardImage();
      await bot.sendPhoto(chatId, blurredImage, {
        caption: `🔮 <b>${spread.name}</b>\n\n🎭 ${spread.positions[0]?.name}\n(Нажмите кнопку чтобы открыть)`,
        parse_mode: 'HTML'
      });
    }

    // Отправляем кнопки управления
    await this.sendControlButtons(bot, chatId, cards, mode, revealedCards);
  }

  /**
   * Кнопки управления раскладом
   */
  async sendControlButtons(bot, chatId, cards, mode, revealedCards) {
    const readingData = this.pendingReadings?.get(chatId);
    if (!readingData) return;

    const allRevealed = revealedCards.size === cards.length;
    const buttons = [];

    if (!allRevealed) {
      // Кнопки для открытия отдельных карт
      const cardButtons = [];
      for (let i = 0; i < cards.length; i++) {
        if (!revealedCards.has(i)) {
          cardButtons.push({
            text: `🃏 ${i + 1}`,
            callback_data: `reveal_card_${i}`
          });
        }
      }

      if (cardButtons.length > 0) {
        // Разбиваем кнопки по рядам (максимум 3 в ряду)
        for (let i = 0; i < cardButtons.length; i += 3) {
          buttons.push(cardButtons.slice(i, i + 3));
        }
      }

      // Кнопка "Открыть все"
      if (revealedCards.size > 0 && revealedCards.size < cards.length) {
        buttons.push([{ text: '🔮 Открыть все карты', callback_data: 'reveal_all_cards' }]);
      }
    }

    // Кнопка толкования (всегда внизу)
    if (allRevealed || revealedCards.size > 0) {
      buttons.push([{ text: '📜 Показать толкование', callback_data: 'show_interpretation' }]);
    }

    // Кнопка нового гадания
    buttons.push([{ text: '🔮 Новое гадание', callback_data: 'new_reading' }]);

    const controlMessage = await bot.sendMessage(chatId, '🎭 Управление раскладом:', {
      reply_markup: {
        inline_keyboard: buttons
      }
    });

    // Сохраняем ID сообщения с кнопками для последующего удаления
    readingData.controlMessageId = controlMessage.message_id;
    this.pendingReadings.set(chatId, readingData);
  }

  /**
   * Создание заблюренного изображения карты (рубашка)
   */
  async createBlurredCardImage() {
    // Простое изображение рубашки карты в base64 (синий градиент)
    const cardBackImage = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAsAAAAQCAYAAADAvYV+AAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAAdgAAAHYBTnsmCAAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAAFXSURBVCiRpZM9SwNBEIafgwQSCxsLwcJCG1sLG1sLG1sLwcJCG1sLG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLWcJCG1sLG1sLG1sLG1sLG1sLWcJCG1sLG1sLWc=', 'base64');
    return cardBackImage;
  }

  /**
   * Очистка старых вопросов из памяти (старше 30 минут)
   */
  cleanupOldQuestions() {
    if (!this.pendingQuestions) return;
    
    const now = Date.now();
    const maxAge = 30 * 60 * 1000; // 30 минут
    
    for (const [chatId, questionData] of this.pendingQuestions.entries()) {
      if (now - questionData.timestamp > maxAge) {
        this.pendingQuestions.delete(chatId);
        console.log(`Cleaned up old question for chat ${chatId}`);
      }
    }
  }

  /**
   * Проверка валидности base64 изображения
   */
  isValidBase64Image(base64String) {
    try {
      if (!base64String || typeof base64String !== 'string') {
        return false;
      }
      
      // Проверяем, что это валидный base64
      const buffer = Buffer.from(base64String, 'base64');
      
      // Проверяем минимальный размер (должно быть больше чем просто заголовок)
      if (buffer.length < 100) {
        return false;
      }
      
      // Проверяем сигнатуры популярных форматов изображений
      const signatures = [
        [0xFF, 0xD8, 0xFF], // JPEG
        [0x89, 0x50, 0x4E, 0x47], // PNG  
        [0x47, 0x49, 0x46], // GIF
        [0x42, 0x4D], // BMP
        [0x52, 0x49, 0x46, 0x46] // WEBP
      ];
      
      return signatures.some(sig => 
        sig.every((byte, index) => buffer[index] === byte)
      );
    } catch (error) {
      console.log('Base64 validation error:', error.message);
      return false;
    }
  }
}

module.exports = new BotHandlers();