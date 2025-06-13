// bot/src/handlers/index.js
const database = require('../database');
const config = require('../config');
const { TAROT_CARDS } = require('../data/tarot');
const NumerologyHandler = require('./numerology');
const premiumHandlers = require('./premium');
const referralHandlers = require('./referral');
const { getMysticalLoadingMessage, getMysticalLoadingSequence } = require('../utils/messages');

class BotHandlers {
  constructor() {
    this.handlers = new Map();
    this.commandHandlers = new Map();
    this.callbackHandlers = new Map();
    
    // Инициализация Maps для состояний
    this.pendingQuestions = new Map();
    this.pendingReadings = new Map();
    
    // Постоянное хранилище профилей пользователей (не очищается)
    this.userProfiles = new Map(); // chatId -> { profile, birthDate, fullName, lastAnalysis }
    
    // Инициализация обработчика нумерологии
    this.numerologyHandler = new NumerologyHandler();
    
    // Устанавливаем связь для синхронизации профилей
    this.numerologyHandler.setProfileHandler({
      saveProfile: (userId, profile) => {
        this.userProfiles.set(userId, profile);
      },
      getProfile: (userId) => {
        return this.userProfiles.get(userId);
      }
    });
    
    // Очистка старых состояний каждые 10 минут
    setInterval(() => {
      this.cleanupOldQuestions();
      this.cleanupPendingStates();
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

    // Команда /test - тестирование новых функций
    bot.onText(/\/test/, async (msg) => {
      await this.handleTestCommand(bot, msg);
    });

    // Команда /premium
    bot.onText(/\/premium/, async (msg) => {
      await this.handlePremiumCommand(bot, msg);
    });

    // Команда /referral
    bot.onText(/\/referral/, async (msg) => {
      await this.handleReferralCommand(bot, msg);
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

    // Обработка pre-checkout запросов для Telegram Stars
    bot.on('pre_checkout_query', async (query) => {
      try {
        const premiumHandlers = require('./premium');
        await premiumHandlers.handlePreCheckoutQuery(bot, query);
      } catch (error) {
        console.error('Pre-checkout query error:', error);
        await bot.answerPreCheckoutQuery(query.id, false, { error_message: 'Внутренняя ошибка сервера' });
      }
    });

    // Обработка успешных платежей
    bot.on('message', async (msg) => {
      if (msg.successful_payment) {
        try {
          const premiumHandlers = require('./premium');
          await premiumHandlers.handleSuccessfulPayment(bot, msg);
        } catch (error) {
          console.error('Successful payment error:', error);
        }
      }
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
      await bot.sendMessage(chatId, '🔮 За пеленой тайн скрывается больше…', {
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

      // Проверяем, есть ли уже карта дня на сегодня
      const existingDailyCard = await this.getTodaysDailyReading(user.token);
      if (existingDailyCard) {
        // Показываем существующую карту дня
        const caption = `🌅 <b>Ваша карта дня уже получена</b>\n\n🃏 <b>${existingDailyCard.cards[0].name}</b>${existingDailyCard.cards[0].reversed ? ' (перевернутая)' : ''}\n\n💫 <b>Толкование:</b>\n${existingDailyCard.interpretation}\n\n💡 <i>Карту дня можно получить только один раз в сутки. Сосредоточьтесь на энергии этой карты весь день!</i>`;
        
        await bot.sendMessage(msg.chat.id, caption, {
          parse_mode: 'HTML',
          reply_markup: {
            inline_keyboard: [
              [{ text: '🔮 Подробное толкование', callback_data: 'daily_details' }],
              [{ text: '🏠 Главное меню', callback_data: 'back_to_menu' }]
            ]
          }
        });
        return;
      }

      // Показываем мистическое сообщение загрузки
      const loadingMsg = await bot.sendMessage(msg.chat.id, getMysticalLoadingMessage('tarot'), {
        parse_mode: 'Markdown'
      });

      // Получаем новую дневную карту через API
      const apiService = require('../services/api');
      const dailyCardResponse = await apiService.getDailyCard(user.token);

      if (!dailyCardResponse.success) {
        await bot.deleteMessage(msg.chat.id, loadingMsg.message_id);
        
        if (dailyCardResponse.data?.upgradeRequired) {
          await bot.sendMessage(msg.chat.id,
            '🌅 <b>Дневная карта уже получена</b>\n\n' +
            'Вы уже получили свою карту дня сегодня.\n' +
            'Премиум пользователи могут получать карты без ограничений!\n\n' +
            '💎 Узнайте больше о преимуществах подписки:', {
            parse_mode: 'HTML',
            reply_markup: {
              inline_keyboard: [
                [{ text: '💎 Премиум возможности', callback_data: 'premium_info' }],
                [{ text: '📖 Посмотреть сегодняшнюю карту', web_app: { url: `${process.env.WEBAPP_URL}/daily` } }]
              ]
            }
          });
        } else {
          await bot.sendMessage(msg.chat.id,
            '❌ <b>Не удалось получить дневную карту</b>\n\n' +
            'Попробуйте еще раз через несколько секунд.', {
            parse_mode: 'HTML',
            reply_markup: {
              inline_keyboard: [[{ text: '🔄 Попробовать снова', callback_data: 'daily_card' }]]
            }
          });
        }
        return;
      }

      const { card, isReversed, interpretation } = dailyCardResponse;

      // Удаляем загрузочное сообщение
      await bot.deleteMessage(msg.chat.id, loadingMsg.message_id);

      // Формируем caption с ограничением длины для Telegram (максимум 1024 символа)
      let caption = `🌅 <b>Карта дня</b>\n\n🃏 <b>${card.name}</b>${isReversed ? ' (перевернутая)' : ''}`;
      
      // Добавляем интерпретацию
      if (interpretation) {
        const withInterpretation = caption + `\n\n💫 <b>Толкование:</b>\n${interpretation}`;
        if (withInterpretation.length <= 1020) {
          caption = withInterpretation;
        }
      }

      // Отправляем карту с изображением (если есть)
      if (card.imageUrl) {
        await bot.sendPhoto(msg.chat.id, card.imageUrl, {
          caption: caption,
          parse_mode: 'HTML',
          reply_markup: {
            inline_keyboard: [
              [{ text: '🔮 Подробное толкование', callback_data: 'daily_details' }],
              [{ text: '🏠 Главное меню', callback_data: 'back_to_menu' }]
            ]
          }
        });
      } else {
        await bot.sendMessage(msg.chat.id, caption, {
          parse_mode: 'HTML',
          reply_markup: {
            inline_keyboard: [
              [{ text: '🔮 Подробное толкование', callback_data: 'daily_details' }],
              [{ text: '🏠 Главное меню', callback_data: 'back_to_menu' }]
            ]
          }
        });
      }

      // Дополнительные кнопки для действий
      await bot.sendMessage(msg.chat.id, 
        '🎯 <b>Что вы хотите узнать еще?</b>', {
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [
            ...(process.env.WEBAPP_URL ? [[
              {
                text: '🎴 Другие расклады',
                web_app: { 
                  url: `${process.env.WEBAPP_URL}/spreads` 
                }
              }
            ]] : []),
            [
              ...(process.env.WEBAPP_URL ? [{
                text: '📖 История гаданий',
                web_app: { 
                  url: `${process.env.WEBAPP_URL}/history` 
                }
              }] : []),
              {
                text: '🔢 Нумерология',
                callback_data: 'numerology_today'
              }
            ],
            [
              {
                text: '🌙 Лунный календарь',
                callback_data: 'lunar_today'
              }
            ]
          ]
        }
      });

    } catch (error) {
      console.error('Error in daily command:', error);
      
      // Удаляем сообщение загрузки если оно еще есть
      try {
        await bot.deleteMessage(msg.chat.id, loadingMsg.message_id);
      } catch (deleteError) {
        // Игнорируем ошибки удаления
      }

      // Отправляем сообщение об ошибке
      await bot.sendMessage(msg.chat.id,
        '❌ <b>Не удалось получить дневную карту</b>\n\n' +
        'Попробуйте еще раз через несколько секунд.\n' +
        '<i>Иногда карты просто не готовы открыться...</i>', {
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: '🔄 Попробовать снова',
                callback_data: 'daily_card'
              }
            ],
            ...(process.env.WEBAPP_URL ? [[
              {
                text: '🎴 Другие расклады',
                web_app: { 
                  url: `${process.env.WEBAPP_URL}/spreads` 
                }
              }
            ]] : [])
          ]
        }
      });
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
          cards: [{ 
            name: `Луна в фазе "${moonPhase.name}"`, 
            description: moonPhase.description 
          }],
          positions: [{ 
            name: 'Лунная энергия', 
            description: `Влияние фазы ${moonPhase.name}` 
          }],
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
      const userToken = user.token;
      
      // Используем новый обработчик премиум
      const premiumHandlers = require('./premium');
      await premiumHandlers.handlePremium(bot, msg, userToken);

    } catch (error) {
      console.error('Error in /premium command:', error);
      console.error('Error details:', error.stack);
      await bot.sendMessage(msg.chat.id, '❌ Произошла ошибка при загрузке информации о Premium. Попробуйте позже.');
    }
  }

/**


  /**
   * Обработчик команды /referral
   */
  async handleReferralCommand(bot, msg) {
    try {
      const user = await this.ensureUser(msg.from);
      
      // Используем referral handler
      await referralHandlers.handleReferralProgram(bot, {
        message: msg,
        from: msg.from,
        id: 'referral_program'
      }, database.apiService);

      await database.trackEvent({
        type: 'command_referral',
        userId: user.id
      });

    } catch (error) {
      console.error('Error in /referral command:', error);
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
          text: '✨ Призываю духов-наставников...'
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
      } else if (data.startsWith('premium_') && data !== 'premium_menu') {
        await this.handlePremiumCallback(bot, chatId, messageId, data, from, query.id);
      } else if (data.startsWith('buy_premium_') || data === 'how_to_get_stars') {
        await this.handlePremiumCallback(bot, chatId, messageId, data, from, query.id);
      } else if (data.startsWith('referral_')) {
        await this.handleReferralCallback(bot, chatId, messageId, data, from);
      } else if (data.startsWith('daily_')) {
        await this.handleDailyCallback(bot, chatId, messageId, data, from);
      } else if (data.startsWith('lunar_')) {
        await this.handleLunarCallback(bot, chatId, messageId, data, from);
      } else if (data.startsWith('test_')) {
        await this.handleTestCallback(bot, chatId, messageId, data, from);
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
        case '🃏 Дневная карта':
        case '📅 Карта дня':
          await this.handleDailyCommand(bot, msg);
          break;
        case '🌙 Лунный календарь':
          await this.handleLunarCommand(bot, msg);
          break;
        case '🔢 Нумерология':
          // НЕ очищаем сессию нумерологии, так как пользователь явно хочет работать с нумерологией
          await this.handleNumerologyCommand(bot, msg);
          break;
        case '👤 Профиль':
          await this.handleProfileCommand(bot, msg);
          break;
        case '💎 Премиум':
          await this.handlePremiumCommand(bot, msg);
          break;
        case '📱 Приложение':
          await this.handleAppCommand(bot, msg);
          break;
        case '⚙️ Настройки':
          await this.handleSettingsCommand(bot, msg);
          break;
        case '❓ Помощь':
          await this.handleHelpCommand(bot, msg);
          break;
        default:
          // Проверяем, ожидаем ли мы ввод для нумерологии
          if (this.numerologyHandler.userSessions.has(chatId)) {
            await this.numerologyHandler.handleTextInput({
              message: { text },
              from: { id: msg.from.id },
              reply: (text, options) => bot.sendMessage(chatId, text, options)
            });
            return;
          }
          
          // Проверяем, не является ли текст командой меню (защита от неточного совпадения)
          if (text.includes('💎') && (text.includes('Премиум') || text.includes('Premium'))) {
            await this.handlePremiumCommand(bot, msg);
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
    // Map уже инициализирован в constructor
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
   * Показать главное меню
   */
  async showMainMenu(bot, chatId, messageId = null) {
    const menuText = `🔮 *MISTIKA - Мистическое Таро*

Добро пожаловать в мир древней мудрости! Выберите, что вас интересует:

🃏 *Гадания Таро*
🌅 *Карта дня*  
🌙 *Лунный календарь*
🔢 *Нумерология*
👤 *Профиль*`;

    const keyboard = {
      inline_keyboard: [
        [
          { text: '🃏 Гадание Таро', callback_data: 'new_reading' },
          { text: '🌅 Карта дня', callback_data: 'daily_card' }
        ],
        [
          { text: '🌙 Лунный календарь', callback_data: 'lunar_reading' },
          { text: '🔢 Нумерология', callback_data: 'numerology' }
        ],
        [
          { text: '👤 Профиль', callback_data: 'profile' }
        ]
      ]
    };

    if (messageId) {
      await bot.editMessageText(menuText, {
        chat_id: chatId,
        message_id: messageId,
        parse_mode: 'Markdown',
        reply_markup: keyboard
      });
    } else {
      await bot.sendMessage(chatId, menuText, {
        parse_mode: 'Markdown',
        reply_markup: keyboard
      });
    }
  }

  /**
   * Получение или создание пользователя
   */
  async ensureUser(telegramUser) {
    try {
      let userResponse = await database.getUserByTelegramId(telegramUser.id);
      let user = userResponse?.user;
      let token = userResponse?.token;
      
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
        token = createdResponse.token;
      }

      // Добавляем токен к объекту пользователя для удобства
      if (user && token) {
        user.token = token;
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
        isActive: true,
        token: null
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

      // Используем новый обработчик нумерологии
      await this.numerologyHandler.handleNumerologyMenu({
        editMessageText: (text, options) => bot.sendMessage(msg.chat.id, text, options),
        reply: (text, options) => bot.sendMessage(msg.chat.id, text, options),
        callbackQuery: false,
        from: { id: msg.from.id }
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
        `<b>Всего гаданий:</b> ${user.totalReadings || 0}\n` +
        `<b>Использовано сегодня:</b> ${user.dailyReadingsUsed || 0}\n` +
        `<b>Дата регистрации:</b> ${new Date(user.createdAt || Date.now()).toLocaleDateString('ru-RU')}\n`;

      await bot.sendMessage(msg.chat.id, profileText, {
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [
            [{ text: '📊 Статистика', callback_data: 'profile_stats' }],
            [{ text: '❓ Помощь', callback_data: 'help' }]
          ]
        }
      });

    } catch (error) {
      console.error('Error in profile command:', error);
      await this.sendErrorMessage(bot, msg.chat.id);
    }
  }

  async handleHistoryCommand(bot, msg) {
    try {
      const user = await this.ensureUser(msg.from);
      
      // Показываем сообщение загрузки
      const loadingMsg = await bot.sendMessage(msg.chat.id, '📋 *Загружаю вашу историю гаданий...*', {
        parse_mode: 'Markdown'
      });

      // Получаем историю гаданий пользователя
      const history = await database.getUserReadings(user.id, 10); // Последние 10 гаданий
      
      // Удаляем сообщение загрузки
      try {
        await bot.deleteMessage(msg.chat.id, loadingMsg.message_id);
      } catch (deleteError) {
        // Игнорируем ошибки удаления
      }

      if (!history || history.length === 0) {
        await bot.sendMessage(msg.chat.id, 
          '📋 <b>История гаданий пуста</b>\n\n' +
          'Вы еще не проводили гадания.\n' +
          'Начните с карты дня или выберите расклад!', {
          parse_mode: 'HTML',
          reply_markup: {
            inline_keyboard: [
              [{ text: '🌅 Карта дня', callback_data: 'daily_card' }],
              [{ text: '🔮 Новое гадание', callback_data: 'new_reading' }],
              [{ text: '🏠 Главное меню', callback_data: 'back_to_menu' }]
            ]
          }
        });
        return;
      }

      // Формируем сообщение с историей
      let historyText = '📋 <b>Ваша история гаданий</b>\n\n';
      
      history.forEach((reading, index) => {
        const date = new Date(reading.createdAt).toLocaleDateString('ru-RU');
        const time = new Date(reading.createdAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
        const cardNames = reading.cards.map(card => 
          `${card.name}${card.reversed ? ' (перевернутая)' : ''}`
        ).join(', ');
        
        historyText += `${index + 1}. <b>${reading.spreadName}</b>\n`;
        historyText += `📅 ${date} в ${time}\n`;
        historyText += `🃏 ${cardNames}\n`;
        if (reading.question && reading.question !== 'Карта дня') {
          historyText += `❓ <i>${reading.question}</i>\n`;
        }
        historyText += '\n';
      });

      historyText += '💡 <i>Для подробного просмотра используйте веб-приложение</i>';

      await bot.sendMessage(msg.chat.id, historyText, {
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [
            [{ text: '📱 Открыть в приложении', web_app: { url: `${process.env.WEBAPP_URL}/history` } }],
            [{ text: '🏠 Главное меню', callback_data: 'back_to_menu' }]
          ]
        }
      });

    } catch (error) {
      console.error('Error in history command:', error);
      await bot.sendMessage(msg.chat.id, 
        '❌ <b>Ошибка загрузки истории</b>\n\n' +
        'Попробуйте позже или обратитесь в поддержку.', {
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [
            [{ text: '🔄 Попробовать снова', callback_data: 'reading_history' }],
            [{ text: '🏠 Главное меню', callback_data: 'back_to_menu' }]
          ]
        }
      });
    }
  }

  async handleSettingsCommand(bot, msg) {
    try {
      const user = await this.ensureUser(msg.from);
      
      const settingsText = `⚙️ *Настройки*\n\nВыберите раздел для настройки:`;
      
      const keyboard = {
        inline_keyboard: [
          [
            { text: '🔔 Уведомления', callback_data: 'settings_notifications' },
            { text: '🎨 Тема', callback_data: 'settings_theme' }
          ],
          [
            { text: '🌐 Язык', callback_data: 'settings_language' },
            { text: '🔮 Колода', callback_data: 'settings_deck' }
          ],
          [
            { text: '🔙 Назад', callback_data: 'back_to_menu' }
          ]
        ]
      };

      await bot.sendMessage(msg.chat.id, settingsText, {
        parse_mode: 'Markdown',
        reply_markup: keyboard
      });

    } catch (error) {
      console.error('Error in settings command:', error);
      await this.sendErrorMessage(bot, msg.chat.id);
    }
  }

  async handleReadingCallback(bot, chatId, messageId, data, from) {
    try {
      const user = await this.ensureUser(from);
      
      // Логируем пользователя и его настройки для диагностики
      console.log(`🔍 Bot: User ${user.telegramId} data:`, {
        deckType: user.deckType,
        preferences: JSON.stringify(user.preferences, null, 2)
      });
      
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
      // Мистическая последовательность загрузки
      const loadingSequence = getMysticalLoadingSequence('tarot');
      
      // Этап 1
      await bot.editMessageText(loadingSequence[0], {
        chat_id: chatId,
        message_id: messageId,
        parse_mode: 'Markdown'
      });

      await new Promise(resolve => setTimeout(resolve, 2000));

      // Этап 2: Добавляем вопрос пользователя если есть
      let focusText = loadingSequence[1];
      if (userQuestion) {
        focusText = loadingSequence[1].replace('🃏 Карты выбирают свой путь...', `🧘‍♀️ Сосредотачиваемся на вашем вопросе:\n"${userQuestion}"\n\n🃏 Карты выбирают свой путь...`);
      }

      await bot.editMessageText(focusText, {
        chat_id: chatId,
        message_id: messageId,
        parse_mode: 'Markdown'
      });

      await new Promise(resolve => setTimeout(resolve, 1500));

      // Этап 3
      const { TAROT_CARDS, SPREAD_TYPES } = require('../data/tarot');
      const spread = SPREAD_TYPES[readingType] || SPREAD_TYPES.single;

      await bot.editMessageText(loadingSequence[2], {
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
      await bot.editMessageText(`🎨 *Создаю мистические образы*\n\n🖼️ Материализую энергии карт в образы...\n⚡ Каждая карта несет уникальную вибрацию...`, {
        chat_id: chatId,
        message_id: messageId,
        parse_mode: 'Markdown'
      });

      // Генерация изображений с настройками пользователя
      let cardImages = [];
      try {
        // Получаем настройки генерации карт пользователя
        console.log(`🔍 Bot: User ${user.telegramId} data:`, {
          deckType: user.deckType,
          preferences: typeof user.preferences === 'string' ? user.preferences : JSON.stringify(user.preferences)
        });
        
        // Парсим preferences если они пришли как строка
        let userPreferences = {};
        if (typeof user.preferences === 'string') {
          try {
            userPreferences = JSON.parse(user.preferences);
          } catch (error) {
            console.error('Error parsing user preferences:', error);
            userPreferences = {};
          }
        } else {
          userPreferences = user.preferences || {};
        }
        const cardGeneration = userPreferences.cardGeneration || {};
        
        console.log(`🎨 Bot: Using card generation settings for user ${user.telegramId}:`, cardGeneration);
        
        let imageResponse;
        
        // Проверяем, включена ли автогенерация
        if (cardGeneration.autoGenerate !== false) { // по умолчанию включена
          // Подготавливаем карты для генерации
          const cardsForGeneration = cardsWithReverse.map(card => ({
            name: card.name,
            description: card.meaning?.upright || card.description || 'Карта Таро'
          }));
          
          // Выбираем метод генерации
          if (cardGeneration.parallelGeneration !== false) { // по умолчанию параллельная
            console.log(`🔄 Bot: Using parallel generation with style: ${cardGeneration.defaultStyle || 'mystic'}`);
            imageResponse = await Promise.race([
              database.generateMultipleCardImages(cardsForGeneration, {
                style: cardGeneration.defaultStyle || 'mystic',
                maxConcurrent: 3
              }),
              new Promise((_, reject) => setTimeout(() => reject(new Error('Image generation timeout')), 280000))
            ]);
          } else {
            console.log(`🔄 Bot: Using sequential generation`);
            imageResponse = await Promise.race([
              database.generateSpreadImages(cardsForGeneration, readingType),
              new Promise((_, reject) => setTimeout(() => reject(new Error('Image generation timeout')), 280000))
            ]);
          }
        } else {
          console.log('❌ Bot: Auto generation disabled for user');
        }
        
        if (imageResponse && imageResponse.success) {
          cardImages = imageResponse.results.filter(r => r.success);
          console.log(`✅ Bot: Generated ${cardImages.length} card images successfully`);
        }
      } catch (error) {
        console.log('❌ Bot: Card image generation failed:', error.message);
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
    // Map уже инициализирован в constructor
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

  async handlePremiumCallback(bot, chatId, messageId, data, from, queryId = null) {
    try {
      const user = await this.ensureUser(from);
      const userToken = user.token;

      // Импортируем handlers из нового premium.js
      const premiumHandlers = require('./premium');

      switch (data) {
        case 'premium_info':
          const premiumInfoQuery = {
            id: queryId || Date.now().toString(),
            message: { chat: { id: chatId } },
            from: from,
            data: data
          };
          await premiumHandlers.handlePremiumInfo(bot, premiumInfoQuery, userToken);
          break;

        case 'how_to_get_stars':
          const starsInfoQuery = {
            id: queryId || Date.now().toString(),
            message: { chat: { id: chatId } },
            from: from,
            data: data
          };
          await premiumHandlers.handleHowToGetStars(bot, starsInfoQuery);
          break;

        default:
          if (data.startsWith('buy_premium_')) {
            // Создаем правильную структуру callbackQuery
            const mockCallbackQuery = {
              id: queryId || Date.now().toString(),
              message: { chat: { id: chatId } },
              from: from,
              data: data
            };
            await premiumHandlers.handleBuyPremium(bot, mockCallbackQuery, userToken);
          }
          break;
      }

    } catch (error) {
      console.error('Error in premium callback:', error);
      await bot.sendMessage(chatId, '❌ Произошла ошибка. Попробуйте позже.');
    }
  }

  async handleReferralCallback(bot, chatId, messageId, data, from) {
    try {
      const user = await this.ensureUser(from);
      
      // Создаем mock callback query для совместимости с referral handlers
      const mockCallbackQuery = {
        id: data,
        message: { chat: { id: chatId } },
        from: from
      };

      switch (data) {
        case 'referral_program':
          await referralHandlers.handleReferralProgram(bot, mockCallbackQuery, database.apiService);
          break;
        case 'referral_stats':
          await referralHandlers.handleReferralStats(bot, mockCallbackQuery, database.apiService);
          break;
        case 'referral_invite':
          await referralHandlers.handleInviteFriends(bot, mockCallbackQuery, database.apiService);
          break;
        case 'referral_copy_link':
          await referralHandlers.handleCopyReferralLink(bot, mockCallbackQuery, database.apiService);
          break;
        case 'referral_rewards':
          await referralHandlers.handleReferralRewards(bot, mockCallbackQuery, database.apiService);
          break;
        case 'referral_claim':
          await referralHandlers.handleClaimReferralRewards(bot, mockCallbackQuery, database.apiService);
          break;
        default:
          await bot.editMessageText('🎁 Обработка реферальной программы...', {
            chat_id: chatId,
            message_id: messageId
          });
      }

      await database.trackEvent({
        type: 'referral_callback',
        userId: user.id,
        metadata: { action: data }
      });

    } catch (error) {
      console.error('Error in referral callback:', error);
      await bot.editMessageText('❌ Ошибка при обработке реферальной программы. Попробуйте позже.', {
        chat_id: chatId,
        message_id: messageId,
        reply_markup: {
          inline_keyboard: [
            [{ text: '🔄 Попробовать снова', callback_data: 'referral_program' }],
            [{ text: '⬅️ Главное меню', callback_data: 'back_to_menu' }]
          ]
        }
      });
    }
  }

  async handleDailyCallback(bot, chatId, messageId, data, from) {
    try {
      switch (data) {
        case 'daily_details':
          // Получаем пользователя
          const user = await this.ensureUser(from);
          
          // Получаем сегодняшнюю дневную карту из базы данных
          const todaysReading = await this.getTodaysDailyReading(user.token);
          
          if (todaysReading) {
            // Формируем подробное сообщение с summary и advice
            const card = todaysReading.cards[0];
            const cardName = card.name || 'Неизвестная карта';
            const isReversed = card.reversed;
            
            let detailsMessage = `🔮 <b>Подробное толкование карты дня</b>\n\n`;
            detailsMessage += `🃏 <b>${cardName}</b>${isReversed ? ' (перевернутая)' : ''}\n\n`;
            
            // Добавляем краткое резюме (summary)
            if (todaysReading.summary) {
              detailsMessage += `📝 <b>Краткое значение:</b>\n${todaysReading.summary}\n\n`;
            }
            
            // Добавляем советы (advice)
            if (todaysReading.advice) {
              detailsMessage += `💡 <b>Советы на день:</b>\n${todaysReading.advice}\n\n`;
            }
            
            // Добавляем полную интерпретацию если она отличается от summary
            if (todaysReading.interpretation && todaysReading.interpretation !== todaysReading.summary) {
              detailsMessage += `🔍 <b>Подробная интерпретация:</b>\n${todaysReading.interpretation}`;
            }
            
            // Отправляем подробное сообщение
            await bot.sendMessage(chatId, detailsMessage, {
              parse_mode: 'HTML',
              reply_markup: {
                inline_keyboard: [
                  [{ text: '🏠 Главное меню', callback_data: 'back_to_menu' }],
                  [{ text: '⬅️ Главное меню', callback_data: 'back_to_menu' }]
                ]
              }
            });
          } else {
            // Если дневной карты нет, предлагаем получить новую
            await bot.sendMessage(chatId, '🌅 <b>Карта дня еще не получена</b>\n\nПолучите свою карту дня, чтобы увидеть подробное толкование.', {
              parse_mode: 'HTML',
              reply_markup: {
                inline_keyboard: [
                  [{ text: '🌅 Получить карту дня', callback_data: 'daily_card' }],
                  [{ text: '⬅️ Главное меню', callback_data: 'back_to_menu' }]
                ]
              }
            });
          }
          break;
          
        default:
          await bot.editMessageText(getMysticalLoadingMessage('tarot'), {
            chat_id: chatId,
            message_id: messageId,
            parse_mode: 'Markdown'
          });
          
          await this.handleDailyCommand(bot, { chat: { id: chatId }, from });
      }
    } catch (error) {
      console.error('Error in daily callback:', error);
      await bot.editMessageText('❌ Ошибка при загрузке карты дня. Попробуйте позже.', {
        chat_id: chatId,
        message_id: messageId,
        reply_markup: {
          inline_keyboard: [
            [{ text: '🔄 Попробовать снова', callback_data: 'daily_card' }],
            [{ text: '⬅️ Главное меню', callback_data: 'back_to_menu' }]
          ]
        }
      });
    }
  }

  async handleLunarCallback(bot, chatId, messageId, data, from) {
    try {
      switch (data) {
        case 'lunar_calendar':
          await bot.editMessageText('🌙 *Лунный календарь*\n\nЗагружаю полный календарь фаз луны...', {
            chat_id: chatId,
            message_id: messageId,
            parse_mode: 'Markdown'
          });
          
          // Показываем календарь фаз луны
          await this.showLunarCalendar(bot, chatId, messageId);
          break;
          
        case 'lunar_reading':
          await bot.editMessageText('🌙 *Лунное гадание*\n\nПроведу гадание согласно текущей фазе луны...', {
            chat_id: chatId,
            message_id: messageId,
            parse_mode: 'Markdown'
          });
          
          await this.handleLunarCommand(bot, { chat: { id: chatId }, from });
          break;
          
        default:
          await this.handleLunarCommand(bot, { chat: { id: chatId }, from });
      }
    } catch (error) {
      console.error('Error in lunar callback:', error);
      await bot.editMessageText('❌ Ошибка при загрузке лунного календаря. Попробуйте позже.', {
        chat_id: chatId,
        message_id: messageId,
        reply_markup: {
          inline_keyboard: [
            [{ text: '🔄 Попробовать снова', callback_data: 'lunar_reading' }],
            [{ text: '⬅️ Главное меню', callback_data: 'back_to_menu' }]
          ]
        }
      });
    }
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
          // Возвращаемся в главное меню вместо создания меню гадания
          await this.showMainMenu(bot, chatId, messageId);
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
          try {
            const user = await this.ensureUser(from);
            
            // Показываем загрузку
            await bot.editMessageText('📋 *Загружаю вашу историю гаданий...*', {
              chat_id: chatId,
              message_id: messageId,
              parse_mode: 'Markdown'
            });

            // Получаем историю гаданий пользователя
            const history = await database.getUserReadings(user.id, 10); // Последние 10 гаданий

            if (!history || history.length === 0) {
              await bot.editMessageText(
                '📋 <b>История гаданий пуста</b>\n\n' +
                'Вы еще не проводили гадания.\n' +
                'Начните с карты дня или выберите расклад!', {
                chat_id: chatId,
                message_id: messageId,
                parse_mode: 'HTML',
                reply_markup: {
                  inline_keyboard: [
                    [{ text: '🌅 Карта дня', callback_data: 'daily_card' }],
                    [{ text: '🔮 Новое гадание', callback_data: 'new_reading' }],
                    [{ text: '🏠 Главное меню', callback_data: 'back_to_menu' }]
                  ]
                }
              });
              break;
            }

            // Формируем сообщение с историей
            let historyText = '📋 <b>Ваша история гаданий</b>\n\n';
            
            history.forEach((reading, index) => {
              const date = new Date(reading.createdAt).toLocaleDateString('ru-RU');
              const time = new Date(reading.createdAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
              const cardNames = reading.cards.map(card => 
                `${card.name}${card.reversed ? ' (перевернутая)' : ''}`
              ).join(', ');
              
              historyText += `${index + 1}. <b>${reading.spreadName}</b>\n`;
              historyText += `📅 ${date} в ${time}\n`;
              historyText += `🃏 ${cardNames}\n`;
              if (reading.question && reading.question !== 'Карта дня') {
                historyText += `❓ <i>${reading.question}</i>\n`;
              }
              historyText += '\n';
            });

            historyText += '💡 <i>Для подробного просмотра используйте веб-приложение</i>';

            await bot.editMessageText(historyText, {
              chat_id: chatId,
              message_id: messageId,
              parse_mode: 'HTML',
              reply_markup: {
                inline_keyboard: [
                  [{ text: '📱 Открыть в приложении', web_app: { url: `${process.env.WEBAPP_URL}/history` } }],
                  [{ text: '🏠 Главное меню', callback_data: 'back_to_menu' }]
                ]
              }
            });

          } catch (error) {
            console.error('Error in reading_history callback:', error);
            await bot.editMessageText(
              '❌ <b>Ошибка загрузки истории</b>\n\n' +
              'Попробуйте позже или обратитесь в поддержку.', {
              chat_id: chatId,
              message_id: messageId,
              parse_mode: 'HTML',
              reply_markup: {
                inline_keyboard: [
                  [{ text: '🔄 Попробовать снова', callback_data: 'reading_history' }],
                  [{ text: '🏠 Главное меню', callback_data: 'back_to_menu' }]
                ]
              }
            });
          }
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


        case 'back_to_spread':
          await bot.editMessageText('🔮 Возвращаюсь к раскладу...', {
            chat_id: chatId,
            message_id: messageId
          });
          // Здесь можно добавить логику возврата к раскладу
          break;

        case 'daily_card':
          // Очищаем активные сессии нумерологии
          await this.handleDailyCommand(bot, { chat: { id: chatId }, from });
          break;

        case 'premium_menu':
          // Очищаем активные сессии нумерологии
          // Используем новый обработчик премиум
          const user = await this.ensureUser(from);
          const userToken = user.token;
          const premiumHandlers = require('./premium');
          await premiumHandlers.handlePremium(bot, { chat: { id: chatId }, from }, userToken);
          break;

        case 'back_to_menu':
          // Очищаем активные сессии нумерологии
          await this.showMainMenu(bot, chatId, messageId);
          break;

        case 'back_to_profile':
          // Очищаем активные сессии нумерологии
          await this.handleProfileCommand(bot, { chat: { id: chatId }, from });
          break;

        case 'retry':
          await bot.editMessageText('🔄 *Повторяю последнее действие...*', {
            chat_id: chatId,
            message_id: messageId,
            parse_mode: 'Markdown'
          });
          // Можно добавить логику повтора последнего действия
          setTimeout(() => {
            this.showMainMenu(bot, chatId, messageId);
          }, 1000);
          break;


        case 'profile':
          // Очищаем активные сессии нумерологии
          await this.handleProfileCommand(bot, { chat: { id: chatId }, from });
          break;

        case 'numerology':
        case 'numerology_menu':
          await this.numerologyHandler.handleNumerologyMenu({
            editMessageText: (text, options) => bot.editMessageText(text, { ...options, chat_id: chatId, message_id: messageId }),
            reply: (text, options) => bot.sendMessage(chatId, text, options),
            callbackQuery: true,
            from: { id: from.id }
          });
          break;

        case 'numerology_create_profile':
        case 'numerology_calculate':
          await this.numerologyHandler.handleCalculateStart({
            editMessageText: (text, options) => bot.editMessageText(text, { ...options, chat_id: chatId, message_id: messageId }),
            reply: (text, options) => bot.sendMessage(chatId, text, options),
            from: { id: from.id }
          });
          break;

        case 'numerology_my_profile':
          await this.numerologyHandler.handleMyProfile({
            editMessageText: (text, options) => bot.editMessageText(text, { ...options, chat_id: chatId, message_id: messageId }),
            reply: (text, options) => bot.sendMessage(chatId, text, options),
            from: { id: from.id }
          });
          break;

        case 'numerology_personal_reading':
          await bot.editMessageText('🔮 Персональное нумерологическое гадание в разработке...', { chat_id: chatId, message_id: messageId });
          break;

        case 'numerology_cancel':
          // Очищаем сессию нумерологии и возвращаемся в главное меню
          await this.numerologyHandler.handleNumerologyMenu({
            editMessageText: (text, options) => bot.editMessageText(text, { ...options, chat_id: chatId, message_id: messageId }),
            reply: (text, options) => bot.sendMessage(chatId, text, options),
            from: { id: from.id }
          });
          break;

        case 'numerology_detailed':
          await this.numerologyHandler.handleDetailedAnalysis({
            editMessageText: (text, options) => bot.editMessageText(text, { ...options, chat_id: chatId, message_id: messageId }),
            reply: (text, options) => bot.sendMessage(chatId, text, options),
            from: { id: from.id }
          });
          break;

        case 'numerology_compatibility':
          await this.numerologyHandler.handleCompatibility({
            editMessageText: (text, options) => bot.editMessageText(text, { ...options, chat_id: chatId, message_id: messageId }),
            reply: (text, options) => bot.sendMessage(chatId, text, options),
            from: { id: from.id }
          });
          break;

        case 'numerology_forecast':
          await this.numerologyHandler.handleForecast({
            editMessageText: (text, options) => bot.editMessageText(text, { ...options, chat_id: chatId, message_id: messageId }),
            reply: (text, options) => bot.sendMessage(chatId, text, options),
            from: { id: from.id }
          });
          break;

        case 'numerology_name':
          await this.numerologyHandler.handleNameAnalysis({
            editMessageText: (text, options) => bot.editMessageText(text, { ...options, chat_id: chatId, message_id: messageId }),
            reply: (text, options) => bot.sendMessage(chatId, text, options),
            from: { id: from.id }
          });
          break;

        case 'numerology_year':
          await this.numerologyHandler.handlePersonalYear({
            editMessageText: (text, options) => bot.editMessageText(text, { ...options, chat_id: chatId, message_id: messageId }),
            reply: (text, options) => bot.sendMessage(chatId, text, options),
            from: { id: from.id }
          });
          break;

        case 'numerology_profile':
          await this.numerologyHandler.handleMyProfile({
            editMessageText: (text, options) => bot.editMessageText(text, { ...options, chat_id: chatId, message_id: messageId }),
            reply: (text, options) => bot.sendMessage(chatId, text, options),
            from: { id: from.id }
          });
          break;

        case 'help':
          await this.handleHelpCommand(bot, { chat: { id: chatId }, from });
          break;

        case 'settings':
          await this.handleSettingsCommand(bot, { chat: { id: chatId }, from });
          break;
          
        case 'settings_notifications':
          await this.handleSettingsNotifications(bot, chatId, messageId, from);
          break;
          
        case 'settings_theme':
          await this.handleSettingsTheme(bot, chatId, messageId, from);
          break;
          
        case 'settings_language':
          await this.handleSettingsLanguage(bot, chatId, messageId, from);
          break;
          
        case 'settings_deck':
          await this.handleSettingsDeck(bot, chatId, messageId, from);
          break;

        // Обработка выбора стиля колоды
        case 'deck_mystic':
        case 'deck_classic':
        case 'deck_modern':
        case 'deck_fantasy':
        case 'deck_gothic':
        case 'deck_vintage':
        case 'deck_art_nouveau':
        case 'deck_baroque':
        case 'deck_minimalist':
        case 'deck_steampunk':
          await this.handleDeckSelection(bot, chatId, messageId, data, from);
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
   * Получение сегодняшней дневной карты пользователя
   */
  async getTodaysDailyReading(userToken) {
    try {
      const apiService = require('../services/api');
      const response = await apiService.getDailyCard(userToken);
      
      if (response && response.success) {
        return {
          cards: [{
            name: response.card.name,
            reversed: response.isReversed
          }],
          interpretation: response.interpretation,
          summary: response.interpretation,
          advice: 'Сосредоточьтесь на энергии этой карты весь день'
        };
      }
      
      return null;
    } catch (error) {
      console.error('Failed to get today\'s daily reading:', error.message);
      return null;
    }
  }

  /**
   * Получение AI рекомендаций для лунной фазы
   */
  async getLunarRecommendations(moonPhase, user) {
    try {
      // Создаем символическую карту для лунного гадания
      const lunarCard = {
        name: `Луна в фазе "${moonPhase.name}"`,
        description: moonPhase.description,
        type: 'lunar',
        phase: moonPhase.name
      };

      const response = await database.makeRequest('POST', '/ai/interpret', {
        cards: [lunarCard],
        spreadType: 'lunar_calendar',
        positions: [{ 
          name: 'Лунная энергия', 
          description: `Влияние фазы ${moonPhase.name} на вашу жизнь` 
        }],
        question: `Какие рекомендации и практики подходят для фазы луны "${moonPhase.name}"? Что лучше делать и чего избегать в этот период?`,
        user: {
          id: user.id,
          language: user.languageCode || 'ru'
        }
      });

      return response;
    } catch (error) {
      console.error('Failed to get lunar AI recommendations:', error.message);
      throw error;
    }
  }

  /**
   * Показать лунный календарь
   */
  async showLunarCalendar(bot, chatId, messageId) {
    const currentPhase = this.getCurrentMoonPhase();
    const today = new Date();
    
    // Расчет фаз на ближайшие дни
    const phases = [];
    for (let i = 0; i < 28; i += 7) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      const phaseIndex = Math.floor((date.getDate() - 1) / 7) % 4;
      const phaseNames = ['Новолуние', 'Растущая луна', 'Полнолуние', 'Убывающая луна'];
      const emojis = ['🌑', '🌒', '🌕', '🌘'];
      
      phases.push({
        date: date.toLocaleDateString('ru-RU'),
        name: phaseNames[phaseIndex],
        emoji: emojis[phaseIndex]
      });
    }

    const calendarText = `🌙 *Лунный календарь*

${currentPhase.emoji} *Текущая фаза:* ${currentPhase.name}
${currentPhase.description}

📅 *Ближайшие фазы:*
${phases.map(phase => `${phase.emoji} ${phase.date} - ${phase.name}`).join('\n')}

🔮 *Лунная мудрость:* Каждая фаза луны несет особую энергию, которая влияет на наши решения и действия.`;

    await bot.editMessageText(calendarText, {
      chat_id: chatId,
      message_id: messageId,
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: '🌙 Получить лунные рекомендации', callback_data: 'lunar_reading' }],
          [{ text: '⬅️ Главное меню', callback_data: 'back_to_menu' }]
        ]
      }
    });
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
    await new Promise(resolve => setTimeout(resolve, 500));

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
      const finalKeyboard = {
        inline_keyboard: [
          [{ text: '📜 Полное толкование', callback_data: 'show_full_interpretation' }],
          [{ text: '🔮 Новое гадание', callback_data: 'new_reading' }]
        ]
      };
      
      await bot.sendMessage(chatId, '✨ *Все карты раскрыты!*\n\n🔮 Теперь вы можете получить полное толкование всего расклада.', {
        parse_mode: 'Markdown',
        reply_markup: this.addMainMenuButton(finalKeyboard)
      });

    } catch (error) {
      console.error('Error revealing all cards:', error);
      
      // Очищаем состояние при ошибке
      this.pendingReadings.delete(chatId);
      
      // Отправляем сообщение об ошибке
      await bot.sendMessage(chatId, '❌ Произошла ошибка при раскрытии карт. Попробуйте начать новое гадание.', {
        reply_markup: {
          inline_keyboard: [
            [{ text: '🔮 Новое гадание', callback_data: 'new_reading' }],
            [{ text: '🏠 Главное меню', callback_data: 'back_to_menu' }]
          ]
        }
      });
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
      }, {
        filename: `${card.name.replace(/\s+/g, '_')}_single.png`,
        contentType: 'image/png'
      });
    } else {
      // Закрытая карта
      const blurredImage = await this.createBlurredCardImage();
      await bot.sendPhoto(chatId, blurredImage, {
        caption: `🔮 <b>${spread.name}</b>\n\n🎭 ${spread.positions[0]?.name}\n(Нажмите кнопку чтобы открыть)`,
        parse_mode: 'HTML'
      }, {
        filename: 'card_back.png',
        contentType: 'image/png'
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
   * Очистка всех pending состояний для предотвращения утечек памяти
   */
  cleanupPendingStates() {
    const now = Date.now();
    const timeout = 30 * 60 * 1000; // 30 минут

    // Очистка pending гаданий
    if (this.pendingReadings) {
      for (const [chatId, data] of this.pendingReadings.entries()) {
        const timestamp = data.timestamp || data.startTime || 0;
        if (now - timestamp > timeout) {
          this.pendingReadings.delete(chatId);
          console.log(`Cleaned up pending reading for chat ${chatId}`);
        }
      }
    }

    const totalPending = (this.pendingReadings?.size || 0) + (this.pendingQuestions?.size || 0);
    if (totalPending > 0) {
      console.log(`Active pending states: questions=${this.pendingQuestions?.size || 0}, readings=${this.pendingReadings?.size || 0}`);
    }
  }

  /**
   * Добавить кнопку "Главное меню" к существующей клавиатуре
   */
  addMainMenuButton(keyboard) {
    if (!keyboard.inline_keyboard) {
      keyboard.inline_keyboard = [];
    }
    
    // Проверяем, есть ли уже кнопка главного меню
    const hasMainMenu = keyboard.inline_keyboard.some(row => 
      row.some(button => button.callback_data === 'back_to_menu')
    );
    
    if (!hasMainMenu) {
      keyboard.inline_keyboard.push([
        { text: '🏠 Главное меню', callback_data: 'back_to_menu' }
      ]);
    }
    
    return keyboard;
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
  /**
   * Обработчик кнопки "Приложение"
   */
  async handleAppCommand(bot, msg) {
    try {
      const user = await this.ensureUser(msg.from);

      const text = `📱 *MISTIKA - Полное приложение*\n\nОткройте веб-приложение MISTIKA для доступа ко всем возможностям:\n\n✨ **Что доступно в приложении:**\n• Полные расклады Таро\n• Детальная нумерология\n• Лунный календарь с ритуалами\n• История всех гаданий\n• Персональные рекомендации\n• Экспорт результатов\n\n🔮 Откройте магический портал прямо сейчас!`;

      await bot.sendMessage(msg.chat.id, text, {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: '✨ Открыть MISTIKA',
                web_app: { url: process.env.WEBAPP_URL || 'https://mistika.app' }
              }
            ],
            [
              { text: '🔮 Новое гадание', callback_data: 'new_reading' },
              { text: '🔢 Нумерология', callback_data: 'numerology' }
            ]
          ]
        }
      });

      await database.trackEvent({
        type: 'button_app',
        userId: user.id
      });

    } catch (error) {
      console.error('Error in app command:', error);
      await this.sendErrorMessage(bot, msg.chat.id);
    }
  }

  /**
   * Обработчик настроек уведомлений
   */
  async handleSettingsNotifications(bot, chatId, messageId, from) {
    try {
      const user = await this.ensureUser(from);
      
      const text = `🔔 *Настройки уведомлений*\n\nВыберите, какие уведомления вы хотите получать:`;
      
      const keyboard = {
        inline_keyboard: [
          [
            { text: user.notifyDailyCard ? '✅' : '❌', callback_data: 'toggle_daily_notifications' },
            { text: 'Дневная карта', callback_data: 'info_daily_notifications' }
          ],
          [
            { text: user.notifyLunar ? '✅' : '❌', callback_data: 'toggle_lunar_notifications' },
            { text: 'Лунный календарь', callback_data: 'info_lunar_notifications' }
          ],
          [
            { text: user.notifyPremium ? '✅' : '❌', callback_data: 'toggle_premium_notifications' },
            { text: 'Премиум функции', callback_data: 'info_premium_notifications' }
          ],
          [
            { text: '⬅️ Назад к настройкам', callback_data: 'settings' }
          ]
        ]
      };

      await bot.editMessageText(text, {
        chat_id: chatId,
        message_id: messageId,
        parse_mode: 'Markdown',
        reply_markup: keyboard
      });

    } catch (error) {
      console.error('Error in settings notifications:', error);
      await bot.editMessageText('❌ Ошибка при загрузке настроек уведомлений.', {
        chat_id: chatId,
        message_id: messageId,
        reply_markup: {
          inline_keyboard: [
            [{ text: '⬅️ Назад к настройкам', callback_data: 'settings' }]
          ]
        }
      });
    }
  }

  /**
   * Обработчик настроек темы
   */
  async handleSettingsTheme(bot, chatId, messageId, from) {
    try {
      const user = await this.ensureUser(from);
      
      const text = `🎨 *Настройки темы*\n\nВыберите предпочитаемую тему оформления:`;
      
      const keyboard = {
        inline_keyboard: [
          [
            { text: user.theme === 'dark' ? '🌙 Темная ✅' : '🌙 Темная', callback_data: 'theme_dark' },
            { text: user.theme === 'light' ? '☀️ Светлая ✅' : '☀️ Светлая', callback_data: 'theme_light' }
          ],
          [
            { text: user.theme === 'mystical' ? '🔮 Мистическая ✅' : '🔮 Мистическая', callback_data: 'theme_mystical' }
          ],
          [
            { text: '⬅️ Назад к настройкам', callback_data: 'settings' }
          ]
        ]
      };

      await bot.editMessageText(text, {
        chat_id: chatId,
        message_id: messageId,
        parse_mode: 'Markdown',
        reply_markup: keyboard
      });

    } catch (error) {
      console.error('Error in settings theme:', error);
      await bot.editMessageText('❌ Ошибка при загрузке настроек темы.', {
        chat_id: chatId,
        message_id: messageId,
        reply_markup: {
          inline_keyboard: [
            [{ text: '⬅️ Назад к настройкам', callback_data: 'settings' }]
          ]
        }
      });
    }
  }

  /**
   * Обработчик настроек языка
   */
  async handleSettingsLanguage(bot, chatId, messageId, from) {
    try {
      const user = await this.ensureUser(from);
      
      const text = `🌐 *Настройки языка*\n\nВыберите предпочитаемый язык интерфейса:`;
      
      const keyboard = {
        inline_keyboard: [
          [
            { text: user.language === 'ru' ? '🇷🇺 Русский ✅' : '🇷🇺 Русский', callback_data: 'lang_ru' },
            { text: user.language === 'en' ? '🇺🇸 English ✅' : '🇺🇸 English', callback_data: 'lang_en' }
          ],
          [
            { text: user.language === 'es' ? '🇪🇸 Español ✅' : '🇪🇸 Español', callback_data: 'lang_es' },
            { text: user.language === 'fr' ? '🇫🇷 Français ✅' : '🇫🇷 Français', callback_data: 'lang_fr' }
          ],
          [
            { text: '⬅️ Назад к настройкам', callback_data: 'settings' }
          ]
        ]
      };

      await bot.editMessageText(text, {
        chat_id: chatId,
        message_id: messageId,
        parse_mode: 'Markdown',
        reply_markup: keyboard
      });

    } catch (error) {
      console.error('Error in settings language:', error);
      await bot.editMessageText('❌ Ошибка при загрузке настроек языка.', {
        chat_id: chatId,
        message_id: messageId,
        reply_markup: {
          inline_keyboard: [
            [{ text: '⬅️ Назад к настройкам', callback_data: 'settings' }]
          ]
        }
      });
    }
  }

  /**
   * Обработчик настроек колоды
   */
  async handleSettingsDeck(bot, chatId, messageId, from) {
    try {
      const user = await this.ensureUser(from);
      // Получаем текущий стиль из новой структуры настроек
      const userPreferences = user.preferences || {};
      const cardGeneration = userPreferences.cardGeneration || {};
      const currentDeck = cardGeneration.defaultStyle || user.deckType || 'mystic';
      
      console.log(`🎨 Bot: Showing deck settings for user ${user.telegramId}, current style: ${currentDeck}`);
      
      const text = `🔮 *Настройки стиля колоды*\n\nВыберите стиль для генерации изображений карт:\n\n💡 *Стиль влияет на то, как будут выглядеть ваши карты Таро*`;
      
      const deckStyles = [
        { key: 'mystic', name: '🔮 Мистический', desc: 'Таинственный магический' },
        { key: 'classic', name: '📜 Классический', desc: 'Традиционный Райдер-Уэйт' },
        { key: 'modern', name: '🔳 Современный', desc: 'Минималистичный дизайн' },
        { key: 'fantasy', name: '🧚 Фэнтези', desc: 'Волшебный сказочный' },
        { key: 'gothic', name: '🏰 Готический', desc: 'Темный драматичный' },
        { key: 'vintage', name: '📰 Винтажный', desc: 'Старинный ретро' },
        { key: 'art_nouveau', name: '🌿 Ар-нуво', desc: 'Элегантный декоративный' },
        { key: 'baroque', name: '👑 Барокко', desc: 'Роскошный пышный' }
      ];
      
      const keyboard = {
        inline_keyboard: []
      };
      
      // Группируем по 2 стиля в ряд
      for (let i = 0; i < deckStyles.length; i += 2) {
        const row = [];
        for (let j = i; j < Math.min(i + 2, deckStyles.length); j++) {
          const style = deckStyles[j];
          const isSelected = currentDeck === style.key;
          const buttonText = isSelected ? `${style.name} ✅` : style.name;
          row.push({ 
            text: buttonText, 
            callback_data: `deck_${style.key}` 
          });
        }
        keyboard.inline_keyboard.push(row);
      }
      
      // Добавляем информацию о текущем стиле и кнопки управления
      keyboard.inline_keyboard.push([
        { text: `📋 Текущий: ${deckStyles.find(s => s.key === currentDeck)?.name || currentDeck}`, callback_data: 'test_show_settings' }
      ]);
      keyboard.inline_keyboard.push([
        { text: '⬅️ Назад к настройкам', callback_data: 'settings' }
      ]);

      await bot.editMessageText(text, {
        chat_id: chatId,
        message_id: messageId,
        parse_mode: 'Markdown',
        reply_markup: keyboard
      });

    } catch (error) {
      console.error('Error in settings deck:', error);
      await bot.editMessageText('❌ Ошибка при загрузке настроек колоды.', {
        chat_id: chatId,
        message_id: messageId,
        reply_markup: {
          inline_keyboard: [
            [{ text: '⬅️ Назад к настройкам', callback_data: 'settings' }]
          ]
        }
      });
    }
  }

  /**
   * Обработчик выбора стиля колоды
   */
  async handleDeckSelection(bot, chatId, messageId, data, from) {
    try {
      const user = await this.ensureUser(from);
      const selectedStyle = data.replace('deck_', '');
      
      // Получаем описание стиля
      const styleDescriptions = {
        mystic: 'Мистический стиль - таинственный магический с темными тонами и золотыми акцентами',
        classic: 'Классический стиль - традиционный Райдер-Уэйт с исторической точностью',
        modern: 'Современный стиль - минималистичный с чистыми линиями и геометрией',
        fantasy: 'Фэнтези стиль - волшебный сказочный с магическими существами',
        gothic: 'Готический стиль - темный драматичный с готическими мотивами',
        vintage: 'Винтажный стиль - старинный ретро с состаренной бумагой',
        art_nouveau: 'Ар-нуво стиль - элегантный декоративный с растительными орнаментами',
        baroque: 'Барокко стиль - роскошный пышный с богатыми орнаментами',
        minimalist: 'Минималистский стиль - простой лаконичный концептуальный',
        steampunk: 'Стимпанк стиль - викторианский механический с шестеренками'
      };

      // Обновляем настройки пользователя в новой структуре
      // Парсим preferences если они пришли как строка
      let currentPreferences = {};
      if (typeof user.preferences === 'string') {
        try {
          currentPreferences = JSON.parse(user.preferences);
        } catch (error) {
          console.error('Error parsing user preferences in deck selection:', error);
          currentPreferences = {};
        }
      } else {
        currentPreferences = user.preferences || {};
      }
      
      const currentCardGeneration = currentPreferences.cardGeneration || {};
      
      const updateData = { 
        deckType: selectedStyle, // для обратной совместимости
        preferences: {
          ...currentPreferences,
          cardDeck: selectedStyle, // для обратной совместимости
          cardGeneration: {
            ...currentCardGeneration,
            defaultStyle: selectedStyle
          }
        }
      };

      console.log(`🎨 Bot: Updating user ${user.telegramId} with data:`, JSON.stringify(updateData, null, 2));

      const result = await database.updateUser(user.telegramId, updateData);

      console.log(`🎨 Bot: Update result:`, JSON.stringify(result, null, 2));

      // ВАЖНО: Принудительно перезагружаем пользователя для получения свежих данных
      console.log(`🔄 Bot: Reloading user data after update...`);
      const refreshedUser = await this.ensureUser(from);
      console.log(`🔄 Bot: Refreshed user preferences:`, JSON.stringify(refreshedUser.preferences, null, 2));

      // Проверяем, что настройки действительно сохранились
      setTimeout(async () => {
        try {
          const updatedUser = await database.getUserByTelegramId(user.telegramId);
          console.log(`🔍 Bot: User after update check:`, {
            deckType: updatedUser?.user?.deckType,
            preferences: JSON.stringify(updatedUser?.user?.preferences, null, 2)
          });
        } catch (error) {
          console.error('Error checking updated user:', error);
        }
      }, 1000);

      const confirmText = `✅ *Стиль колоды обновлен*\n\n🎨 *Выбранный стиль:* ${styleDescriptions[selectedStyle]}\n\n💡 Теперь все новые карты будут генерироваться в этом стиле!\n\n🧪 Проверьте командой /test → "📋 Мои настройки генерации"`;

      await bot.editMessageText(confirmText, {
        chat_id: chatId,
        message_id: messageId,
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: '🔮 Изменить стиль', callback_data: 'settings_deck' }],
            [{ text: '⬅️ Назад к настройкам', callback_data: 'settings' }],
            [{ text: '🏠 Главное меню', callback_data: 'back_to_menu' }]
          ]
        }
      });

    } catch (error) {
      console.error('Error in deck selection:', error);
      await bot.editMessageText('❌ Ошибка при сохранении настроек. Попробуйте позже.', {
        chat_id: chatId,
        message_id: messageId,
        reply_markup: {
          inline_keyboard: [
            [{ text: '🔄 Попробовать снова', callback_data: 'settings_deck' }],
            [{ text: '⬅️ Назад к настройкам', callback_data: 'settings' }]
          ]
        }
      });
    }
  }

  /**
   * Обработчик команды /test - тестирование новых функций
   */
  async handleTestCommand(bot, msg) {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    try {
      const user = await this.ensureUser(msg.from);

      await bot.sendMessage(chatId, 
        '🧪 <b>Тестирование новых функций MISTIKA</b>\n\n' +
        'Выберите, что вы хотите протестировать:', {
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: '🎨 Тест генерации изображений',
                callback_data: 'test_image_generation'
              }
            ],
            [
              {
                text: '⚡ Параллельная генерация карт',
                callback_data: 'test_parallel_generation'
              }
            ],
            [
              {
                text: '🔄 Генерация с fallback',
                callback_data: 'test_fallback_generation'
              }
            ],
            [
              {
                text: '🎴 Доступные стили',
                callback_data: 'test_available_styles'
              }
            ],
            [
              {
                text: '💊 Здоровье Kandinsky API',
                callback_data: 'test_kandinsky_health'
              }
            ],
            [
              {
                text: '📋 Мои настройки генерации',
                callback_data: 'test_show_settings'
              }
            ],
            [
              {
                text: '🏠 Главное меню',
                callback_data: 'back_to_menu'
              }
            ]
          ]
        }
      });

    } catch (error) {
      console.error('Error in test command:', error);
      await bot.sendMessage(chatId, 
        '❌ Ошибка при запуске тестирования.\n' +
        'Попробуйте позже.', {
        reply_markup: {
          inline_keyboard: [[
            { text: '🔄 Попробовать снова', callback_data: 'restart' }
          ]]
        }
      });
    }
  }

  /**
   * Обработчик тестирования генерации изображений
   */
  async handleTestImageGeneration(bot, chatId, messageId, from) {
    try {
      // Получаем пользователя и его настройки
      const user = await this.ensureUser(from);
      const userPreferences = user.preferences || {};
      const cardGeneration = userPreferences.cardGeneration || {};
      const style = cardGeneration.defaultStyle || 'mystic';
      
      await bot.editMessageText(
        '🎨 <b>Тестирование генерации изображений</b>\n\n' +
        `🎨 <b>Стиль:</b> ${style}\n` +
        '⏳ Запускаем тестовую генерацию...', {
        chat_id: chatId,
        message_id: messageId,
        parse_mode: 'HTML'
      });

      console.log(`🧪 Bot: Testing image generation for user ${user.telegramId} with style: ${style}`);

      const result = await database.testImageGeneration();

      let resultText;
      if (result.success) {
        resultText = '✅ <b>Тест генерации прошел успешно!</b>\n\n' +
          `🔍 <b>Результат:</b> ${result.isMock ? 'Fallback режим' : 'AI генерация'}\n` +
          `🆔 <b>UUID:</b> ${result.uuid}\n` +
          `📏 <b>Размер данных:</b> ${result.imageLength} байт`;
      } else {
        resultText = '❌ <b>Тест генерации не удался</b>\n\n' +
          `🚫 <b>Ошибка:</b> ${result.error}`;
      }

      await bot.editMessageText(resultText, {
        chat_id: chatId,
        message_id: messageId,
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [
            [{ text: '🔄 Повторить тест', callback_data: 'test_image_generation' }],
            [{ text: '⬅️ Назад к тестам', callback_data: 'test_menu' }],
            [{ text: '🏠 Главное меню', callback_data: 'back_to_menu' }]
          ]
        }
      });

    } catch (error) {
      console.error('Error in image generation test:', error);
      await bot.editMessageText(
        '❌ <b>Ошибка при тестировании</b>\n\n' +
        `Детали: ${error.message}`, {
        chat_id: chatId,
        message_id: messageId,
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [
            [{ text: '⬅️ Назад к тестам', callback_data: 'test_menu' }]
          ]
        }
      });
    }
  }

  /**
   * Обработчик тестирования параллельной генерации
   */
  async handleTestParallelGeneration(bot, chatId, messageId, from) {
    try {
      // Получаем пользователя и его настройки
      const user = await this.ensureUser(from);
      const userPreferences = user.preferences || {};
      const cardGeneration = userPreferences.cardGeneration || {};
      const style = cardGeneration.defaultStyle || 'mystic';
      
      await bot.editMessageText(
        '⚡ <b>Тестирование параллельной генерации</b>\n\n' +
        `🎨 <b>Стиль:</b> ${style}\n` +
        '⏳ Генерируем 3 карты одновременно...', {
        chat_id: chatId,
        message_id: messageId,
        parse_mode: 'HTML'
      });

      console.log(`🧪 Bot: Testing parallel generation for user ${user.telegramId} with style: ${style}`);

      // Создаем тестовые карты
      const testCards = [
        { name: 'Маг', description: 'Карта новых начинаний и возможностей' },
        { name: 'Жрица', description: 'Карта интуиции и тайного знания' },
        { name: 'Императрица', description: 'Карта изобилия и творчества' }
      ];

      const startTime = Date.now();
      const result = await database.generateMultipleCardImages(testCards, {
        style: style,
        maxConcurrent: 3
      });
      const duration = Date.now() - startTime;

      let resultText;
      if (result.success) {
        const stats = result.stats;
        resultText = '✅ <b>Параллельная генерация завершена!</b>\n\n' +
          `⏱️ <b>Время:</b> ${(duration / 1000).toFixed(1)} сек\n` +
          `📊 <b>Статистика:</b>\n` +
          `  • Всего: ${stats.total}\n` +
          `  • Успешно: ${stats.successful}\n` +
          `  • Ошибок: ${stats.failed}\n\n` +
          `🎯 <b>Успешность:</b> ${Math.round((stats.successful / stats.total) * 100)}%`;
      } else {
        resultText = '❌ <b>Параллельная генерация не удалась</b>\n\n' +
          `🚫 <b>Ошибка:</b> ${result.error}`;
      }

      await bot.editMessageText(resultText, {
        chat_id: chatId,
        message_id: messageId,
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [
            [{ text: '🔄 Повторить тест', callback_data: 'test_parallel_generation' }],
            [{ text: '⬅️ Назад к тестам', callback_data: 'test_menu' }],
            [{ text: '🏠 Главное меню', callback_data: 'back_to_menu' }]
          ]
        }
      });

    } catch (error) {
      console.error('Error in parallel generation test:', error);
      await bot.editMessageText(
        '❌ <b>Ошибка при тестировании параллельной генерации</b>\n\n' +
        `Детали: ${error.message}`, {
        chat_id: chatId,
        message_id: messageId,
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [
            [{ text: '⬅️ Назад к тестам', callback_data: 'test_menu' }]
          ]
        }
      });
    }
  }

  /**
   * Обработчик проверки доступных стилей
   */
  async handleTestAvailableStyles(bot, chatId, messageId) {
    try {
      await bot.editMessageText(
        '🎴 <b>Загрузка доступных стилей...</b>', {
        chat_id: chatId,
        message_id: messageId,
        parse_mode: 'HTML'
      });

      const result = await database.getAvailableStyles();

      let resultText;
      if (result.success) {
        resultText = '🎨 <b>Доступные стили колод:</b>\n\n';
        Object.entries(result.styles).forEach(([key, style]) => {
          resultText += `${style.emoji} <b>${style.name}</b>\n`;
          if (style.description) {
            resultText += `<i>${style.description}</i>\n\n`;
          }
        });
        resultText += `📊 <b>Всего стилей:</b> ${result.count}`;
      } else {
        resultText = '❌ <b>Не удалось загрузить стили</b>\n\n' +
          `🚫 <b>Ошибка:</b> ${result.error}`;
      }

      await bot.editMessageText(resultText, {
        chat_id: chatId,
        message_id: messageId,
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [
            [{ text: '🔄 Обновить список', callback_data: 'test_available_styles' }],
            [{ text: '⬅️ Назад к тестам', callback_data: 'test_menu' }],
            [{ text: '🏠 Главное меню', callback_data: 'back_to_menu' }]
          ]
        }
      });

    } catch (error) {
      console.error('Error in styles test:', error);
      await bot.editMessageText(
        '❌ <b>Ошибка при загрузке стилей</b>\n\n' +
        `Детали: ${error.message}`, {
        chat_id: chatId,
        message_id: messageId,
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [
            [{ text: '⬅️ Назад к тестам', callback_data: 'test_menu' }]
          ]
        }
      });
    }
  }

  /**
   * Обработчик проверки здоровья Kandinsky API
   */
  async handleTestKandinskyHealth(bot, chatId, messageId) {
    try {
      await bot.editMessageText(
        '💊 <b>Проверка здоровья Kandinsky API...</b>', {
        chat_id: chatId,
        message_id: messageId,
        parse_mode: 'HTML'
      });

      const result = await database.checkKandinskyHealth();

      let resultText;
      if (result.success) {
        const health = result.kandinsky;
        resultText = '💊 <b>Статус Kandinsky API</b>\n\n';
        
        if (health.available) {
          resultText += '✅ <b>Сервис доступен</b>\n\n';
          resultText += `🆔 <b>Pipeline ID:</b> ${health.pipelineId}\n`;
          resultText += `📡 <b>Статус:</b> ${health.pipelineStatus}\n`;
        } else {
          resultText += '❌ <b>Сервис недоступен</b>\n\n';
          if (health.error) {
            resultText += `🚫 <b>Ошибка:</b> ${health.error}\n`;
          }
          if (health.status) {
            resultText += `📡 <b>HTTP Status:</b> ${health.status}\n`;
          }
        }
        
        resultText += `🔑 <b>API Key:</b> ${health.apiKey}\n`;
        resultText += `🔐 <b>Secret Key:</b> ${health.secretKey}`;
      } else {
        resultText = '❌ <b>Ошибка проверки здоровья API</b>\n\n' +
          `🚫 <b>Детали:</b> ${result.error}`;
      }

      await bot.editMessageText(resultText, {
        chat_id: chatId,
        message_id: messageId,
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [
            [{ text: '🔄 Повторить проверку', callback_data: 'test_kandinsky_health' }],
            [{ text: '⬅️ Назад к тестам', callback_data: 'test_menu' }],
            [{ text: '🏠 Главное меню', callback_data: 'back_to_menu' }]
          ]
        }
      });

    } catch (error) {
      console.error('Error in Kandinsky health test:', error);
      await bot.editMessageText(
        '❌ <b>Ошибка при проверке здоровья API</b>\n\n' +
        `Детали: ${error.message}`, {
        chat_id: chatId,
        message_id: messageId,
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [
            [{ text: '⬅️ Назад к тестам', callback_data: 'test_menu' }]
          ]
        }
      });
    }
  }

  /**
   * Обработчик callback'ов для тестирования
   */
  async handleTestCallback(bot, chatId, messageId, data, from) {
    try {
      console.log(`Processing test callback: ${data} for user ${from.id}`);

      switch (data) {
        case 'test_menu':
          await this.handleTestCommand(bot, { chat: { id: chatId }, from: from, message_id: messageId });
          break;

        case 'test_image_generation':
          await this.handleTestImageGeneration(bot, chatId, messageId, from);
          break;

        case 'test_parallel_generation':
          await this.handleTestParallelGeneration(bot, chatId, messageId, from);
          break;

        case 'test_available_styles':
          await this.handleTestAvailableStyles(bot, chatId, messageId);
          break;

        case 'test_kandinsky_health':
          await this.handleTestKandinskyHealth(bot, chatId, messageId);
          break;

        case 'test_show_settings':
          await this.handleShowUserSettings(bot, chatId, messageId, from);
          break;

        default:
          console.warn(`Unknown test callback: ${data}`);
          await bot.answerCallbackQuery(query.id, {
            text: 'Неизвестная команда теста',
            show_alert: true
          });
      }

    } catch (error) {
      console.error('Error in test callback:', error);
      await bot.editMessageText(
        '❌ <b>Ошибка при выполнении теста</b>\n\n' +
        `Детали: ${error.message}`, {
        chat_id: chatId,
        message_id: messageId,
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [
            [{ text: '⬅️ Назад к тестам', callback_data: 'test_menu' }],
            [{ text: '🏠 Главное меню', callback_data: 'back_to_menu' }]
          ]
        }
      });
    }
  }

  /**
   * Показать текущие настройки пользователя
   */
  async handleShowUserSettings(bot, chatId, messageId, from) {
    try {
      const user = await this.ensureUser(from);
      
      // Парсим preferences если они пришли как строка
      let userPreferences = {};
      if (typeof user.preferences === 'string') {
        try {
          userPreferences = JSON.parse(user.preferences);
        } catch (error) {
          console.error('Error parsing user preferences:', error);
          userPreferences = {};
        }
      } else {
        userPreferences = user.preferences || {};
      }
      
      const cardGeneration = userPreferences.cardGeneration || {};
      
      console.log(`📋 Bot: Showing settings for user ${user.telegramId}:`, userPreferences);
      
      const settingsText = '📋 <b>Ваши текущие настройки генерации карт</b>\n\n' +
        `🎨 <b>Стиль по умолчанию:</b> ${cardGeneration.defaultStyle || 'mystic'}\n` +
        `🔄 <b>Автогенерация:</b> ${cardGeneration.autoGenerate !== false ? 'ВКЛ ✅' : 'ВЫКЛ ❌'}\n` +
        `⚡ <b>Параллельная генерация:</b> ${cardGeneration.parallelGeneration !== false ? 'ВКЛ ✅' : 'ВЫКЛ ❌'}\n` +
        `🔮 <b>Резервные изображения:</b> ${cardGeneration.fallbackEnabled !== false ? 'ВКЛ ✅' : 'ВЫКЛ ❌'}\n` +
        `💎 <b>Высокое качество:</b> ${cardGeneration.highQuality ? 'ВКЛ ✅' : 'ВЫКЛ ❌'}\n\n` +
        '💡 <i>Изменить настройки можно в веб-приложении (Профиль → Генерация изображений)</i>';

      await bot.editMessageText(settingsText, {
        chat_id: chatId,
        message_id: messageId,
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [
            ...(process.env.WEBAPP_URL ? [[{ text: '🌐 Открыть настройки', web_app: { url: `${process.env.WEBAPP_URL}/profile` } }]] : []),
            [{ text: '⬅️ Назад к тестам', callback_data: 'test_menu' }],
            [{ text: '🏠 Главное меню', callback_data: 'back_to_menu' }]
          ]
        }
      });

    } catch (error) {
      console.error('Error showing user settings:', error);
      await bot.editMessageText(
        '❌ <b>Ошибка при получении настроек</b>\n\n' +
        `Детали: ${error.message}`, {
        chat_id: chatId,
        message_id: messageId,
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [
            [{ text: '⬅️ Назад к тестам', callback_data: 'test_menu' }]
          ]
        }
      });
    }
  }
}

module.exports = new BotHandlers();