// bot/src/handlers/index.js
const database = require('../database');
const config = require('../config');
const { TAROT_CARDS } = require('../data/tarot');
const NumerologyHandler = require('./numerology');

class BotHandlers {
  constructor() {
    this.handlers = new Map();
    this.commandHandlers = new Map();
    this.callbackHandlers = new Map();
    
    // Инициализация Maps для состояний
    this.pendingQuestions = new Map();
    this.pendingReadings = new Map();
    this.pendingNumerology = new Map();
    
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

      // Формируем caption с ограничением длины для Telegram (максимум 1024 символа)
      let caption = `🌅 <b>Карта дня</b>\n\n🃏 <b>${cardWithState.name}</b>${isReversed ? ' (перевернутая)' : ''}`;
      
      // Добавляем интерпретацию если поместится
      if (interpretationText) {
        const withInterpretation = caption + `\n\n${interpretationText}`;
        if (withInterpretation.length <= 950) { // Оставляем место для совета
          caption = withInterpretation;
        }
      }
      
      // Добавляем совет если поместится
      if (advice) {
        const withAdvice = caption + `\n\n✨ <i>Совет дня:</i> ${advice}`;
        if (withAdvice.length <= 1020) {
          caption = withAdvice;
        }
      }

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
          }, {
            filename: `daily_card_${cardWithState.name.replace(/\s+/g, '_')}.png`,
            contentType: 'image/png'
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
          // Очищаем любые активные сессии нумерологии
          this.pendingNumerology?.delete(chatId);
          await this.handleReadingCommand(bot, msg);
          break;
        case '🃏 Дневная карта':
        case '📅 Карта дня':
          // Очищаем любые активные сессии нумерологии
          this.pendingNumerology?.delete(chatId);
          await this.handleDailyCommand(bot, msg);
          break;
        case '🌙 Лунный календарь':
          // Очищаем любые активные сессии нумерологии
          this.pendingNumerology?.delete(chatId);
          await this.handleLunarCommand(bot, msg);
          break;
        case '🔢 Нумерология':
          // НЕ очищаем сессию нумерологии, так как пользователь явно хочет работать с нумерологией
          await this.handleNumerologyCommand(bot, msg);
          break;
        case '👤 Профиль':
          // Очищаем любые активные сессии нумерологии
          this.pendingNumerology?.delete(chatId);
          await this.handleProfileCommand(bot, msg);
          break;
        case '💎 Премиум':
          // Очищаем любые активные сессии нумерологии
          this.pendingNumerology?.delete(chatId);
          await this.handlePremiumCommand(bot, msg);
          break;
        case '📱 Приложение':
          // Очищаем любые активные сессии нумерологии
          this.pendingNumerology?.delete(chatId);
          await this.handleAppCommand(bot, msg);
          break;
        case '⚙️ Настройки':
          // Очищаем любые активные сессии нумерологии
          this.pendingNumerology?.delete(chatId);
          await this.handleSettingsCommand(bot, msg);
          break;
        case '❓ Помощь':
          // Очищаем любые активные сессии нумерологии
          this.pendingNumerology?.delete(chatId);
          await this.handleHelpCommand(bot, msg);
          break;
        default:
          // Проверяем, ожидаем ли мы ввод для нумерологии (новая система)
          if (this.numerologyHandler.userSessions.has(chatId)) {
            await this.numerologyHandler.handleTextInput({
              message: { text },
              from: { id: msg.from.id },
              reply: (text, options) => bot.sendMessage(chatId, text, options)
            });
            return;
          }
          
          // Проверяем старую систему нумерологии
          if (this.pendingNumerology && this.pendingNumerology.has(chatId)) {
            const session = this.pendingNumerology.get(chatId);
            // Проверяем, что сессия не устарела (максимум 10 минут)
            if (session && (Date.now() - session.timestamp) < 10 * 60 * 1000) {
              await this.handleNumerologyInput(bot, msg);
              return;
            } else {
              // Удаляем устаревшую сессию
              this.pendingNumerology.delete(chatId);
            }
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
        `<b>Тип подписки:</b> ${user.subscriptionType || 'basic'}\n` +
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
    await bot.sendMessage(msg.chat.id, '📋 История в разработке...');
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
          new Promise((_, reject) => setTimeout(() => reject(new Error('Image generation timeout')), 180000))
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

  async handlePremiumCallback(bot, chatId, messageId, data, from) {
    try {
      switch (data) {
          
        case 'extend_premium':
          await bot.editMessageText('💎 *Продление Premium*\n\nВыберите план подписки:', {
            chat_id: chatId,
            message_id: messageId,
            parse_mode: 'Markdown',
            reply_markup: {
              inline_keyboard: [
                [{ text: '1 месяц - 299₽', callback_data: 'premium_plan_month' }],
                [{ text: '3 месяца - 799₽ (-33%)', callback_data: 'premium_plan_3month' }],
                [{ text: '1 год - 2999₽ (-50%)', callback_data: 'premium_plan_year' }],
                [{ text: '⬅️ Назад', callback_data: 'premium' }]
              ]
            }
          });
          break;
          
        case 'premium_stats':
          await bot.editMessageText('📊 *Premium статистика*\n\nФункция в разработке...', {
            chat_id: chatId,
            message_id: messageId,
            parse_mode: 'Markdown',
            reply_markup: {
              inline_keyboard: [
                [{ text: '⬅️ Назад', callback_data: 'premium' }]
              ]
            }
          });
          break;
          
        case 'premium_plan_month':
        case 'premium_plan_3month':
        case 'premium_plan_year':
          await bot.editMessageText('💳 *Оплата Premium*\n\nИнтеграция с платежной системой в разработке...', {
            chat_id: chatId,
            message_id: messageId,
            parse_mode: 'Markdown',
            reply_markup: {
              inline_keyboard: [
                [{ text: '⬅️ Назад к планам', callback_data: 'extend_premium' }],
                [{ text: '🏠 Главное меню', callback_data: 'back_to_menu' }]
              ]
            }
          });
          break;
          
        default:
          await bot.editMessageText('💎 Обработка Premium...', {
            chat_id: chatId,
            message_id: messageId
          });
      }
    } catch (error) {
      console.error('Error in premium callback:', error);
      await bot.editMessageText('❌ Ошибка при обработке Premium. Попробуйте позже.', {
        chat_id: chatId,
        message_id: messageId,
        reply_markup: {
          inline_keyboard: [
            [{ text: '🔄 Попробовать снова', callback_data: 'premium' }],
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
          // Отправляем новое сообщение вместо редактирования (так как исходное может быть изображением)
          await bot.sendMessage(chatId, '🔮 *Подробное толкование карты дня*\n\nЗагружаю расширенную интерпретацию...', {
            parse_mode: 'Markdown'
          });
          
          // Получаем подробную интерпретацию карты дня
          await this.handleDailyCommand(bot, { chat: { id: chatId }, from });
          break;
          
        default:
          await bot.editMessageText('📅 Загрузка карты дня...', {
            chat_id: chatId,
            message_id: messageId
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


        case 'back_to_spread':
          await bot.editMessageText('🔮 Возвращаюсь к раскладу...', {
            chat_id: chatId,
            message_id: messageId
          });
          // Здесь можно добавить логику возврата к раскладу
          break;

        case 'daily_card':
          // Очищаем активные сессии нумерологии
          this.pendingNumerology?.delete(chatId);
          await this.handleDailyCommand(bot, { chat: { id: chatId }, from });
          break;

        case 'back_to_menu':
          // Очищаем активные сессии нумерологии
          this.pendingNumerology?.delete(chatId);
          await this.showMainMenu(bot, chatId, messageId);
          break;

        case 'back_to_profile':
          // Очищаем активные сессии нумерологии
          this.pendingNumerology?.delete(chatId);
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
          this.pendingNumerology?.delete(chatId);
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
          await this.handleMyNumerologyProfile(bot, chatId, messageId, from);
          break;

        case 'numerology_personal_reading':
          await bot.editMessageText('🔮 Персональное нумерологическое гадание в разработке...', { chat_id: chatId, message_id: messageId });
          break;

        case 'numerology_compatibility':
          await this.handleNumerologyCompatibility(bot, chatId, messageId, from);
          break;

        case 'numerology_name':
          await this.handleNumerologyNameAnalysis(bot, chatId, messageId, from);
          break;

        case 'numerology_forecast':
        case 'numerology_year':
          await this.handleNumerologyForecast(bot, chatId, messageId, from);
          break;

        case 'numerology_cancel':
          // Очищаем сессию нумерологии и возвращаемся в главное меню
          this.pendingNumerology?.delete(chatId);
          await this.handleNumerologyMenu(bot, chatId, messageId, from);
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
          // Отображение сохраненного профиля
          const userProfile = this.userProfiles.get(chatId);
          if (!userProfile || !userProfile.profile) {
            await bot.editMessageText('❌ Профиль не найден. Создайте профиль сначала.', {
              chat_id: chatId,
              message_id: messageId,
              reply_markup: {
                inline_keyboard: [
                  [{ text: '🔢 Создать профиль', callback_data: 'numerology_calculate' }],
                  [{ text: '🔙 Назад', callback_data: 'numerology_menu' }]
                ]
              }
            });
          } else {
            const profile = userProfile.profile;
            let message = `👤 *Ваш нумерологический профиль*\n\n`;
            message += `📛 *Имя:* ${userProfile.fullName}\n`;
            message += `📅 *Дата рождения:* ${userProfile.birthDate.toLocaleDateString('ru-RU')}\n\n`;
            message += `🛤 *Жизненный путь:* ${profile.lifePath.number}\n`;
            message += `⭐ *Судьба:* ${profile.destiny.number}\n`;
            message += `💫 *Душа:* ${profile.soul.number}\n`;
            message += `👤 *Личность:* ${profile.personality.number}\n`;

            await bot.editMessageText(message, {
              chat_id: chatId,
              message_id: messageId,
              parse_mode: 'Markdown',
              reply_markup: {
                inline_keyboard: [
                  [{ text: '📊 Подробный анализ', callback_data: 'numerology_detailed' }],
                  [{ text: '🔙 Назад', callback_data: 'numerology_menu' }]
                ]
              }
            });
          }
          break;

        case 'help':
          await this.handleHelpCommand(bot, { chat: { id: chatId }, from });
          break;

        case 'settings':
        case 'settings_notifications':
        case 'settings_theme':
        case 'settings_language':
        case 'settings_deck':
          await this.handleSettingsCommand(bot, { chat: { id: chatId }, from });
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
   * Получение AI интерпретации для нумерологии
   */
  async getNumerologyInterpretation(numerologyResult, user) {
    try {
      // Создаем символические карты для нумерологии
      const numerologyCards = [
        {
          name: `Число судьбы ${numerologyResult.lifePathNumber}`,
          description: 'Основной жизненный путь и предназначение',
          type: 'numerology',
          number: numerologyResult.lifePathNumber
        },
        {
          name: `Число личности ${numerologyResult.personalityNumber}`,
          description: 'Как вас воспринимают окружающие',
          type: 'numerology',
          number: numerologyResult.personalityNumber
        },
        {
          name: `Число души ${numerologyResult.soulNumber}`,
          description: 'Ваши внутренние желания и мотивация',
          type: 'numerology',
          number: numerologyResult.soulNumber
        }
      ];

      const response = await database.makeRequest('POST', '/ai/interpret', {
        cards: numerologyCards,
        spreadType: 'numerology',
        positions: [
          { name: 'Число судьбы', description: 'Основной жизненный путь и предназначение' },
          { name: 'Число личности', description: 'Как вас воспринимают окружающие' },
          { name: 'Число души', description: 'Ваши внутренние желания и мотивация' }
        ],
        question: `Дай подробную интерпретацию нумерологического профиля. Число судьбы: ${numerologyResult.lifePathNumber}, Число личности: ${numerologyResult.personalityNumber}, Число души: ${numerologyResult.soulNumber}. Какие это говорит о характере, предназначении и жизненном пути человека?`,
        user: {
          id: user.id,
          language: user.languageCode || 'ru'
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

      switch (numerologyData.step) {
        case 'waiting_birthdate':
          await this.processNumerologyBirthDate(bot, chatId, input, msg.from, numerologyData);
          break;
          
        case 'waiting_fullname':
          await this.processNumerologyFullName(bot, chatId, input, msg.from, numerologyData);
          break;
          
        case 'waiting_partner_birthdate':
          await this.processNumerologyPartnerBirthDate(bot, chatId, input, msg.from, numerologyData);
          break;
          
        case 'waiting_partner_name':
          await this.processNumerologyPartnerName(bot, chatId, input, msg.from, numerologyData);
          break;
          
        case 'waiting_name_analysis':
          await this.processNameAnalysis(bot, chatId, input, msg.from);
          break;
      }

    } catch (error) {
      console.error('Error in numerology input:', error);
      await bot.sendMessage(msg.chat.id, 'Произошла ошибка. Попробуйте еще раз.');
      this.pendingNumerology?.delete(msg.chat.id);
    }
  }

  // Обработка даты рождения
  async processNumerologyBirthDate(bot, chatId, text, from, session) {
    const dateRegex = /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/;
    const match = text.match(dateRegex);

    if (!match) {
      await bot.sendMessage(chatId, '❌ Неверный формат даты. Введите дату в формате ДД.ММ.ГГГГ (например: 15.03.1990)');
      return;
    }

    const [, day, month, year] = match;
    const birthDate = new Date(year, month - 1, day);

    if (isNaN(birthDate.getTime()) || birthDate > new Date()) {
      await bot.sendMessage(chatId, '❌ Некорректная дата. Проверьте правильность ввода.');
      return;
    }

    // Инициализируем data если не существует
    if (!session.data) {
      session.data = {};
    }
    
    session.data.birthDate = birthDate;
    session.step = 'waiting_fullname';
    this.pendingNumerology.set(chatId, session);

    await bot.sendMessage(chatId, `✅ Дата рождения: ${day}.${month}.${year}\n\n👤 Теперь введите ваше полное имя (Фамилия Имя Отчество):`, {
      reply_markup: {
        inline_keyboard: [
          [{ text: '❌ Отмена', callback_data: 'numerology_menu' }]
        ]
      }
    });
  }

  // Обработка полного имени
  async processNumerologyFullName(bot, chatId, text, from, session) {
    if (text.length < 2) {
      await bot.sendMessage(chatId, '❌ Слишком короткое имя. Введите полное имя.');
      return;
    }

    session.data.fullName = text;
    
    try {
      // Рассчитываем профиль
      const numerologyService = require('../../../server/src/services/numerologyService');
      const profile = await numerologyService.generateFullAnalysis(
        session.data.birthDate,
        session.data.fullName
      );

      // Получаем ИИ интерпретацию нумерологического профиля
      let aiInterpretation = null;
      try {
        const aiResponse = await database.makeRequest('POST', '/ai/interpret', {
          cards: [{
            name: `Нумерология: Личностный профиль`,
            description: `НУМЕРОЛОГИЧЕСКИЙ АНАЛИЗ (НЕ ТАРО): Полное имя: ${session.data.fullName}, дата рождения: ${session.data.birthDate.toDateString()}. Число жизненного пути: ${profile.lifePath.number} (${profile.lifePath.meaning?.description}), Число судьбы: ${profile.destiny.number} (${profile.destiny.meaning?.description}), Число души: ${profile.soul.number}, Число личности: ${profile.personality.number}`,
            isReversed: false
          }],
          spreadType: 'numerology_profile',
          positions: [{ name: 'Нумерологический портрет', description: 'Полный анализ личности через числа' }],
          question: `Проведи НУМЕРОЛОГИЧЕСКИЙ (не таро) анализ личности. Игнорируй упоминания карт таро - это нумерология. Создай персональную интерпретацию на основе чисел жизненного пути, судьбы, души и личности.`,
          user: { id: session.userId, language: 'ru' }
        });
        
        aiInterpretation = aiResponse.interpretation;
        console.log('Numerology AI interpretation received:', JSON.stringify(aiResponse, null, 2));
      } catch (error) {
        console.log('Numerology AI interpretation failed:', error.message);
      }

      // Сохраняем профиль пользователя для будущего использования (НЕ удаляем!)
      this.userProfiles.set(chatId, {
        profile: profile,
        birthDate: session.data.birthDate,
        fullName: session.data.fullName,
        aiInterpretation: aiInterpretation,
        createdAt: new Date(),
        userId: session.userId
      });

      await this.sendNumerologyProfileResult(bot, chatId, profile, aiInterpretation);
      
      // Очищаем только временную сессию ввода (профиль остается сохраненным!)
      this.pendingNumerology.delete(chatId);
    } catch (error) {
      console.error('Ошибка расчета профиля:', error);
      await bot.sendMessage(chatId, '❌ Ошибка расчета. Попробуйте позже.');
      this.pendingNumerology.delete(chatId);
    }
  }

  // Обработка анализа имени
  async processNameAnalysis(bot, chatId, text, from) {
    try {
      const numerologyService = require('../../../server/src/services/numerologyService');
      const destinyNumber = await numerologyService.calculateDestinyNumber(text);
      const nameNumber = await numerologyService.calculateNameNumber(text);
      
      let message = `📝 *Анализ имени "${text}"*\n\n`;
      message += `⭐ *Число судьбы:* ${destinyNumber}\n`;
      message += `📚 *Число имени:* ${nameNumber}\n\n`;
      
      // Получаем ИИ интерпретацию имени
      let aiInterpretation = null;
      try {
        const aiResponse = await database.makeRequest('POST', '/ai/interpret', {
          cards: [{
            name: `Нумерология: Анализ имени`,
            description: `НУМЕРОЛОГИЧЕСКИЙ АНАЛИЗ (НЕ ТАРО): Анализ имени "${text}". Число судьбы: ${destinyNumber}, Число имени: ${nameNumber}. Значение числа судьбы: ${numerologyService.numberMeanings[destinyNumber]?.description || 'анализ числа'}`,
            isReversed: false
          }],
          spreadType: 'numerology_name',
          positions: [{ name: 'Влияние имени', description: 'Как имя влияет на судьбу и характер' }],
          question: `Проведи НУМЕРОЛОГИЧЕСКИЙ (не таро) анализ имени "${text}". Игнорируй упоминания карт таро - это нумерология. Расскажи о влиянии имени на характер и судьбу человека.`,
          user: { id: from.id, language: 'ru' }
        });
        
        aiInterpretation = aiResponse.interpretation;
        console.log('Name analysis AI interpretation received:', JSON.stringify(aiResponse, null, 2));
      } catch (error) {
        console.log('Name analysis AI interpretation failed:', error.message);
      }

      if (aiInterpretation && aiInterpretation.interpretation) {
        message += `🤖 *ИИ-анализ:*\n${aiInterpretation.interpretation}\n\n`;
        
        if (aiInterpretation.advice) {
          message += `💡 *Рекомендации:*\n${aiInterpretation.advice}`;
        }
      } else {
        // Получаем описание числа
        const meaning = numerologyService.numberMeanings[destinyNumber];
        if (meaning) {
          message += `💬 *Значение:* ${meaning.description}\n\n`;
          message += `🔑 *Ключевые слова:* ${meaning.keywords.join(', ')}`;
        }
      }

      const keyboard = {
        inline_keyboard: [
          [{ text: '🔄 Другое имя', callback_data: 'numerology_name' }],
          [{ text: '🔙 Назад', callback_data: 'numerology_menu' }]
        ]
      };

      await bot.sendMessage(chatId, message, { 
        parse_mode: 'Markdown', 
        reply_markup: keyboard 
      });

      this.pendingNumerology.delete(chatId);
    } catch (error) {
      console.error('Ошибка анализа имени:', error);
      await bot.sendMessage(chatId, 'Ошибка анализа. Попробуйте еще раз.');
    }
  }

  // Отправка результата профиля
  async sendNumerologyProfileResult(bot, chatId, profile, aiInterpretation = null) {
    try {
      let message = `🔢 *Ваш нумерологический профиль*\n\n`;

      // Основные числа
      message += `🛤 *Число жизненного пути:* ${profile.lifePath.number}\n`;
      message += `⭐ *Число судьбы:* ${profile.destiny.number}\n`;
      message += `💫 *Число души:* ${profile.soul.number}\n`;
      message += `👤 *Число личности:* ${profile.personality.number}\n\n`;

      // ИИ интерпретация или базовое описание
      if (aiInterpretation && aiInterpretation.interpretation) {
        message += `🤖 *ИИ-анализ:*\n${aiInterpretation.interpretation}\n\n`;
        
        if (aiInterpretation.advice) {
          message += `💡 *Рекомендации:*\n${aiInterpretation.advice}\n\n`;
        }
      } else {
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
      }

      const keyboard = {
        inline_keyboard: [
          [{ text: '✅ Профиль создан!', callback_data: 'numerology_menu' }]
        ]
      };

      await bot.sendMessage(chatId, message, { 
        parse_mode: 'Markdown', 
        reply_markup: keyboard 
      });
    } catch (error) {
      console.error('Ошибка отправки профиля:', error);
      await bot.sendMessage(chatId, 'Ошибка отображения результата.');
    }
  }

  /**
   * Обработчик "Мой профиль" - показывает сохраненный профиль пользователя
   */
  async handleMyNumerologyProfile(bot, chatId, messageId, from) {
    try {
      const userProfile = this.userProfiles.get(chatId);
      
      if (!userProfile || !userProfile.profile) {
        await bot.editMessageText('❌ Профиль не найден. Необходимо создать профиль заново.', {
          chat_id: chatId,
          message_id: messageId,
          reply_markup: {
            inline_keyboard: [
              [{ text: '🔢 Создать профиль', callback_data: 'numerology_create_profile' }],
              [{ text: '🔙 Назад', callback_data: 'numerology_menu' }]
            ]
          }
        });
        return;
      }

      const profile = userProfile.profile;
      let message = `👤 *Ваш нумерологический профиль*\n\n`;
      message += `📝 *Имя:* ${userProfile.fullName}\n`;
      message += `📅 *Дата рождения:* ${userProfile.birthDate.toLocaleDateString('ru-RU')}\n\n`;

      // Основные числа
      message += `🔢 *Ваши числа:*\n`;
      message += `🛤 Жизненный путь: *${profile.lifePath.number}*\n`;
      message += `⭐ Число судьбы: *${profile.destiny.number}*\n`;
      message += `💫 Число души: *${profile.soul.number}*\n`;
      message += `👤 Число личности: *${profile.personality.number}*\n\n`;

      // Краткое описание
      message += `💬 *Краткая характеристика:*\n${profile.lifePath.meaning?.description || 'Ваш уникальный жизненный путь'}`;

      const keyboard = {
        inline_keyboard: [
          [
            { text: '📊 Подробный анализ', callback_data: 'numerology_detailed' },
            { text: '🔄 Пересчитать', callback_data: 'numerology_create_profile' }
          ],
          [{ text: '🔙 Назад', callback_data: 'numerology_menu' }]
        ]
      };

      await bot.editMessageText(message, {
        chat_id: chatId,
        message_id: messageId,
        parse_mode: 'Markdown',
        reply_markup: keyboard
      });

    } catch (error) {
      console.error('Error in my numerology profile:', error);
      await bot.editMessageText('❌ Ошибка загрузки профиля. Попробуйте позже.', {
        chat_id: chatId,
        message_id: messageId,
        reply_markup: {
          inline_keyboard: [
            [{ text: '🔙 Назад', callback_data: 'numerology_menu' }]
          ]
        }
      });
    }
  }

  /**
   * Показывает подробный ИИ анализ профиля пользователя
   */
  async showDetailedNumerologyAnalysis(bot, chatId, messageId, from) {
    try {
      const userProfile = this.userProfiles.get(chatId);
      
      if (!userProfile || !userProfile.profile) {
        await bot.editMessageText('❌ Профиль не найден. Необходимо создать профиль заново.', {
          chat_id: chatId,
          message_id: messageId,
          reply_markup: {
            inline_keyboard: [
              [{ text: '🔢 Создать профиль', callback_data: 'numerology_create_profile' }],
              [{ text: '🔙 Назад', callback_data: 'numerology_menu' }]
            ]
          }
        });
        return;
      }

      // Показываем загрузку
      await bot.editMessageText('🔄 *Подготавливаю подробный анализ...*\n\nИИ создает персональную интерпретацию вашего профиля.', {
        chat_id: chatId,
        message_id: messageId,
        parse_mode: 'Markdown'
      });

      let message = `📊 *Подробный нумерологический анализ*\n\n`;
      message += `👤 *${userProfile.fullName}*\n`;
      message += `📅 ${userProfile.birthDate.toLocaleDateString('ru-RU')}\n\n`;

      // Если есть сохраненная ИИ интерпретация - используем ее
      if (userProfile.aiInterpretation && userProfile.aiInterpretation.interpretation) {
        message += `🤖 *ИИ-анализ:*\n${userProfile.aiInterpretation.interpretation}\n\n`;
        
        if (userProfile.aiInterpretation.advice) {
          message += `💡 *Персональные рекомендации:*\n${userProfile.aiInterpretation.advice}`;
        }
      } else {
        // Если ИИ анализа нет - создаем его заново
        try {
          const profile = userProfile.profile;
          const aiResponse = await database.makeRequest('POST', '/ai/interpret', {
            cards: [{
              name: `Нумерология: Детальный анализ`,
              description: `ДЕТАЛЬНЫЙ НУМЕРОЛОГИЧЕСКИЙ АНАЛИЗ (НЕ ТАРО): ${userProfile.fullName}, ${userProfile.birthDate.toDateString()}. Жизненный путь: ${profile.lifePath.number} (${profile.lifePath.meaning?.description}), Судьба: ${profile.destiny.number} (${profile.destiny.meaning?.description}), Душа: ${profile.soul.number}, Личность: ${profile.personality.number}`,
              isReversed: false
            }],
            spreadType: 'numerology_detailed',
            positions: [{ name: 'Глубинный анализ', description: 'Детальная интерпретация всех аспектов личности' }],
            question: `Проведи ДЕТАЛЬНЫЙ НУМЕРОЛОГИЧЕСКИЙ анализ. Игнорируй упоминания карт таро. Дай глубокую персональную интерпретацию с конкретными рекомендациями для жизни и развития.`,
            user: { id: from.id, language: 'ru' }
          });
          
          const aiInterpretation = aiResponse.interpretation;
          
          // Сохраняем новый ИИ анализ
          userProfile.aiInterpretation = aiInterpretation;
          this.userProfiles.set(chatId, userProfile);
          
          message += `🤖 *ИИ-анализ:*\n${aiInterpretation.interpretation}\n\n`;
          
          if (aiInterpretation.advice) {
            message += `💡 *Персональные рекомендации:*\n${aiInterpretation.advice}`;
          }
          
        } catch (error) {
          console.log('Detailed analysis AI failed:', error.message);
          
          // Fallback на статичный анализ
          const profile = userProfile.profile;
          message += `🔢 *Детальный анализ чисел:*\n\n`;
          
          message += `🛤 *Жизненный путь ${profile.lifePath.number}:*\n${profile.lifePath.meaning?.description}\n\n`;
          message += `⭐ *Число судьбы ${profile.destiny.number}:*\n${profile.destiny.meaning?.description}\n\n`;
          
          if (profile.lifePath.meaning?.positive) {
            message += `💪 *Сильные стороны:*\n`;
            profile.lifePath.meaning.positive.forEach(strength => {
              message += `• ${strength}\n`;
            });
          }
        }
      }

      const keyboard = {
        inline_keyboard: [
          [{ text: '👤 Мой профиль', callback_data: 'numerology_my_profile' }],
          [{ text: '🔙 К нумерологии', callback_data: 'numerology_menu' }]
        ]
      };

      await bot.editMessageText(message, {
        chat_id: chatId,
        message_id: messageId,
        parse_mode: 'Markdown',
        reply_markup: keyboard
      });

    } catch (error) {
      console.error('Error in detailed numerology analysis:', error);
      await bot.editMessageText('❌ Ошибка создания подробного анализа. Попробуйте позже.', {
        chat_id: chatId,
        message_id: messageId,
        reply_markup: {
          inline_keyboard: [
            [{ text: '🔙 Назад', callback_data: 'numerology_my_profile' }]
          ]
        }
      });
    }
  }

  // Обработка даты рождения партнера
  async processNumerologyPartnerBirthDate(bot, chatId, text, from, session) {
    const dateRegex = /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/;
    const match = text.match(dateRegex);

    if (!match) {
      await bot.sendMessage(chatId, '❌ Неверный формат даты. Введите дату в формате ДД.ММ.ГГГГ (например: 15.03.1990)');
      return;
    }

    const [, day, month, year] = match;
    const birthDate = new Date(year, month - 1, day);

    if (isNaN(birthDate.getTime()) || birthDate > new Date()) {
      await bot.sendMessage(chatId, '❌ Некорректная дата. Проверьте правильность ввода.');
      return;
    }

    // Инициализируем data если не существует
    if (!session.data) {
      session.data = {};
    }
    
    session.data.partnerBirthDate = birthDate;
    session.step = 'waiting_partner_name';
    this.pendingNumerology.set(chatId, session);

    await bot.sendMessage(chatId, `✅ Дата рождения партнера: ${day}.${month}.${year}\n\n👤 Теперь введите полное имя партнера:`, {
      reply_markup: {
        inline_keyboard: [
          [{ text: '❌ Отмена', callback_data: 'numerology_menu' }]
        ]
      }
    });
  }

  // Обработка полного имени партнера
  async processNumerologyPartnerName(bot, chatId, text, from, session) {
    if (text.length < 2) {
      await bot.sendMessage(chatId, '❌ Слишком короткое имя. Введите полное имя.');
      return;
    }

    session.data.partnerFullName = text;
    
    try {
      const numerologyService = require('../../../server/src/services/numerologyService');
      
      // Рассчитываем совместимость
      const compatibility = await numerologyService.calculateCompatibility(
        session.data.partnerBirthDate,
        session.data.partnerFullName
      );

      // Получаем ИИ интерпретацию совместимости
      let aiInterpretation = null;
      try {
        const aiResponse = await database.makeRequest('POST', '/ai/interpret', {
          cards: [{
            name: `Нумерология: Совместимость`,
            description: `НУМЕРОЛОГИЧЕСКИЙ АНАЛИЗ (НЕ ТАРО): Совместимость партнеров по числам судьбы. Партнер: ${session.data.partnerFullName}, дата рождения: ${session.data.partnerBirthDate.toDateString()}. Процент совместимости: ${compatibility.percentage}%. Базовая характеристика: ${compatibility.description}`,
            isReversed: false
          }],
          spreadType: 'numerology_compatibility',
          positions: [{ name: 'Нумерологическая совместимость', description: 'Анализ совместимости по нумерологическим числам партнеров' }],
          question: `Проведи НУМЕРОЛОГИЧЕСКИЙ (не таро) анализ совместимости партнеров. Игнорируй упоминания карт таро - это нумерология. Дай персональные рекомендации для отношений на основе числовых значений.`,
          user: { id: session.userId, language: 'ru' }
        });
        
        aiInterpretation = aiResponse.interpretation;
        console.log('Compatibility AI interpretation received:', JSON.stringify(aiResponse, null, 2));
      } catch (error) {
        console.log('Compatibility AI interpretation failed:', error.message);
      }

      await this.sendCompatibilityResult(bot, chatId, compatibility, aiInterpretation);
      
      // Очищаем сессию
      this.pendingNumerology.delete(chatId);
    } catch (error) {
      console.error('Ошибка расчета совместимости:', error);
      await bot.sendMessage(chatId, '❌ Ошибка расчета. Попробуйте позже.');
      this.pendingNumerology.delete(chatId);
    }
  }

  // Отправка результата совместимости
  async sendCompatibilityResult(bot, chatId, compatibility, aiInterpretation = null) {
    try {
      let message = `👥 *Анализ совместимости*\n\n`;

      if (aiInterpretation && aiInterpretation.interpretation) {
        message += `🤖 *ИИ-анализ совместимости:*\n${aiInterpretation.interpretation}\n\n`;
        
        if (aiInterpretation.advice) {
          message += `💡 *Рекомендации:*\n${aiInterpretation.advice}`;
        }
      } else {
        message += `💫 *Совместимость:* ${compatibility.percentage}%\n`;
        message += `💬 *Описание:* ${compatibility.description}\n\n`;
        message += `🔑 *Рекомендации:* ${compatibility.advice}`;
      }

      const keyboard = {
        inline_keyboard: [
          [{ text: '🔙 Назад', callback_data: 'numerology_menu' }]
        ]
      };

      await bot.sendMessage(chatId, message, { 
        parse_mode: 'Markdown', 
        reply_markup: keyboard 
      });
    } catch (error) {
      console.error('Ошибка отправки совместимости:', error);
      await bot.sendMessage(chatId, 'Ошибка отображения результата.');
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

    // Очистка pending нумерологии
    if (this.pendingNumerology) {
      for (const [chatId, data] of this.pendingNumerology.entries()) {
        if (now - data.timestamp > timeout) {
          this.pendingNumerology.delete(chatId);
          console.log(`Cleaned up pending numerology for chat ${chatId}`);
        }
      }
    }

    const totalPending = (this.pendingReadings?.size || 0) + (this.pendingNumerology?.size || 0) + (this.pendingQuestions?.size || 0);
    if (totalPending > 0) {
      console.log(`Active pending states: questions=${this.pendingQuestions?.size || 0}, readings=${this.pendingReadings?.size || 0}, numerology=${this.pendingNumerology?.size || 0}`);
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
   * Показать подробную нумерологическую интерпретацию
   */
  async showDetailedNumerologyAnalysis(bot, chatId, analysisData, messageId = null) {
    try {
      const { lifePathNumber, personalityNumber, destinyNumber, birthDate } = analysisData;

      const detailedText = `🔢 <b>Подробный нумерологический анализ</b>\n\n` +
        `📅 <b>Дата рождения:</b> ${birthDate}\n\n` +
        
        `🛤️ <b>Число жизненного пути: ${lifePathNumber}</b>\n` +
        `${this.getDetailedLifePathDescription(lifePathNumber)}\n\n` +
        
        `👤 <b>Число личности: ${personalityNumber}</b>\n` +
        `${this.getDetailedPersonalityDescription(personalityNumber)}\n\n` +
        
        `🎯 <b>Число судьбы: ${destinyNumber}</b>\n` +
        `${this.getDetailedDestinyDescription(destinyNumber)}\n\n` +
        
        `💎 <b>Совместимость и рекомендации:</b>\n` +
        `${this.getCompatibilityAdvice(lifePathNumber, personalityNumber)}\n\n` +
        
        `🌟 <b>Благоприятные дни:</b> ${this.getLuckyDays(lifePathNumber)}\n` +
        `🎨 <b>Счастливые цвета:</b> ${this.getLuckyColors(lifePathNumber)}\n` +
        `💎 <b>Камни-талисманы:</b> ${this.getLuckyStones(lifePathNumber)}`;

      const keyboard = {
        inline_keyboard: [
          [{ text: '🔮 Персональное гадание', callback_data: 'numerology_personal_reading' }],
          [{ text: '📊 Совместимость', callback_data: 'numerology_compatibility' }],
          [{ text: '🗓️ Прогноз на месяц', callback_data: 'numerology_monthly_forecast' }],
          [{ text: '⬅️ Назад к нумерологии', callback_data: 'numerology' }]
        ]
      };

      if (messageId) {
        await bot.editMessageText(detailedText, {
          chat_id: chatId,
          message_id: messageId,
          parse_mode: 'HTML',
          reply_markup: keyboard
        });
      } else {
        await bot.sendMessage(chatId, detailedText, {
          parse_mode: 'HTML',
          reply_markup: keyboard
        });
      }

    } catch (error) {
      console.error('Error showing detailed numerology analysis:', error);
      await bot.sendMessage(chatId, '❌ Ошибка при показе подробного анализа. Попробуйте позже.');
    }
  }

  /**
   * Получение подробного описания числа жизненного пути
   */
  getDetailedLifePathDescription(number) {
    const descriptions = {
      1: 'Вы прирожденный лидер с сильной волей и независимым характером. Ваша миссия - быть первопроходцем, инициатором новых идей и проектов. Вы обладаете уникальной способностью воплощать мечты в реальность.',
      2: 'Ваш путь - это путь сотрудничества и гармонии. Вы обладаете даром дипломатии и миротворчества. Ваша сила в способности объединять людей и создавать команды.',
      3: 'Вы творческая натура с яркой харизмой и талантом к самовыражению. Ваша миссия - вдохновлять других своим оптимизмом и креативностью. Искусство, общение и творчество - ваши стихии.',
      4: 'Вы строитель и организатор с практичным умом. Ваш путь - создавать прочные основы для будущего. Дисциплина, надежность и системность - ваши главные качества.',
      5: 'Ваш путь - это путь свободы и приключений. Вы обладаете любознательностью и стремлением к переменам. Ваша миссия - исследовать мир во всем его многообразии.',
      6: 'Вы прирожденный целитель и защитник семьи. Ваш путь связан с заботой о других, созданием гармонии в отношениях и домашнем очаге.',
      7: 'Ваш путь - это путь мудреца и исследователя тайн. Вы обладаете глубокой интуицией и аналитическим умом. Духовность и познание - ваши основные направления.',
      8: 'Вы прирожденный руководитель в материальном мире. Ваш путь связан с достижением успеха в бизнесе и управлении ресурсами. Амбиции и практичность - ваши сильные стороны.',
      9: 'Ваш путь - это путь мудрого наставника и гуманиста. Вы призваны служить человечеству, делиться знаниями и помогать в духовном развитии.'
    };
    return descriptions[number] || 'Уникальный путь, требующий индивидуального анализа.';
  }

  /**
   * Получение подробного описания числа личности
   */
  getDetailedPersonalityDescription(number) {
    const descriptions = {
      1: 'Окружающие видят в вас сильного, независимого человека с лидерскими качествами. Вы производите впечатление уверенной в себе личности.',
      2: 'Вы кажетесь мягким, дружелюбным и отзывчивым человеком. Окружающие чувствуют вашу поддержку и понимание.',
      3: 'Ваша харизма и оптимизм притягивают людей. Вы производите впечатление творческого, веселого и общительного человека.',
      4: 'Окружающие видят в вас надежного, практичного и организованного человека, на которого можно положиться.',
      5: 'Вы кажетесь динамичным, свободолюбивым и предприимчивым человеком, полным энергии и новых идей.',
      6: 'Окружающие воспринимают вас как заботливого, ответственного и семейного человека с развитым чувством справедливости.',
      7: 'Вы производите впечатление мудрого, загадочного и духовно развитого человека с глубоким внутренним миром.',
      8: 'Окружающие видят в вас успешного, амбициозного и влиятельного человека с сильным характером.',
      9: 'Вы кажетесь мудрым, щедрым и альтруистичным человеком с широким кругозором и гуманитарными взглядами.'
    };
    return descriptions[number] || 'Уникальное восприятие, требующее индивидуального анализа.';
  }

  /**
   * Получение подробного описания числа судьбы
   */
  getDetailedDestinyDescription(number) {
    const descriptions = {
      1: 'Ваше предназначение - стать лидером и первопроходцем. Судьба приготовила для вас роль инициатора важных проектов и новаторских идей.',
      2: 'Ваша судьба связана с созданием гармонии и сотрудничества. Вы призваны быть миротворцем и дипломатом.',
      3: 'Судьба приготовила для вас путь творческого самовыражения. Вы должны вдохновлять и радовать окружающих своими талантами.',
      4: 'Ваше предназначение - создавать прочные основы и системы. Судьба поручила вам роль строителя и организатора.',
      5: 'Ваша судьба связана с исследованиями и переменами. Вы призваны расширять границы возможного и нести свободу.',
      6: 'Судьба приготовила для вас роль защитника и целителя. Ваше предназначение - заботиться о семье и близких.',
      7: 'Ваша судьба связана с поиском истины и духовным развитием. Вы призваны быть мудрецом и наставником.',
      8: 'Судьба приготовила для вас путь материального успеха и влияния. Ваше предназначение - управлять и процветать.',
      9: 'Ваша судьба связана с служением человечеству. Вы призваны быть учителем, целителем и духовным наставником.'
    };
    return descriptions[number] || 'Уникальная судьба, требующая индивидуального понимания.';
  }

  /**
   * Получение советов по совместимости
   */
  getCompatibilityAdvice(lifePath, personality) {
    const advice = [
      'Лучшая совместимость с числами жизненного пути: ',
      this.getCompatibleNumbers(lifePath).join(', '),
      '\n\nВ отношениях важно: развивать качества, дополняющие ваш характер.',
      '\nИзбегайте: попыток кардинально изменить партнера под себя.'
    ];
    return advice.join('');
  }

  /**
   * Получение совместимых чисел
   */
  getCompatibleNumbers(number) {
    const compatibility = {
      1: [3, 5, 6],
      2: [4, 6, 8],
      3: [1, 5, 9],
      4: [2, 6, 8],
      5: [1, 3, 7],
      6: [1, 2, 4, 9],
      7: [5, 9],
      8: [2, 4, 6],
      9: [3, 6, 7]
    };
    return compatibility[number] || [1, 5, 9];
  }

  /**
   * Получение благоприятных дней
   */
  getLuckyDays(number) {
    const days = {
      1: 'Воскресенье, 1, 10, 19, 28 числа',
      2: 'Понедельник, 2, 11, 20, 29 числа',
      3: 'Четверг, 3, 12, 21, 30 числа',
      4: 'Воскресенье, 4, 13, 22, 31 числа',
      5: 'Среда, 5, 14, 23 числа',
      6: 'Пятница, 6, 15, 24 числа',
      7: 'Понедельник, 7, 16, 25 числа',
      8: 'Суббота, 8, 17, 26 числа',
      9: 'Вторник, 9, 18, 27 числа'
    };
    return days[number] || 'Все дни могут быть удачными';
  }

  /**
   * Получение счастливых цветов
   */
  getLuckyColors(number) {
    const colors = {
      1: '🔴 Красный, 🟠 Оранжевый, 🟡 Золотой',
      2: '🔵 Синий, 🟢 Зеленый, ⚪ Белый',
      3: '🟡 Желтый, 🟠 Оранжевый, 🟣 Фиолетовый',
      4: '🟤 Коричневый, 🟢 Зеленый, 🔵 Синий',
      5: '🔵 Синий, 🟣 Фиолетовый, ⚪ Серебряный',
      6: '🟢 Зеленый, 🔵 Синий, 🟣 Розовый',
      7: '🟣 Фиолетовый, 🔵 Морской волны, ⚪ Белый',
      8: '⚫ Черный, 🟤 Коричневый, 🟡 Золотой',
      9: '🔴 Красный, 🟠 Оранжевый, 🟡 Желтый'
    };
    return colors[number] || '🌈 Все цвета радуги';
  }

  /**
   * Получение камней-талисманов
   */
  getLuckyStones(number) {
    const stones = {
      1: '💎 Алмаз, 🔴 Рубин, 🟡 Топаз',
      2: '🌙 Лунный камень, 🟢 Изумруд, ⚪ Жемчуг',
      3: '🟡 Цитрин, 🟣 Аметист, 🟠 Сердолик',
      4: '🟢 Изумруд, 🔵 Сапфир, 🟫 Яшма',
      5: '🔵 Аквамарин, 🟣 Аметист, ⚪ Горный хрусталь',
      6: '🟢 Изумруд, 🔵 Сапфир, 🟣 Розовый кварц',
      7: '🟣 Аметист, 🔵 Лазурит, ⚪ Горный хрусталь',
      8: '⚫ Оникс, 🔴 Гранат, 🟡 Цитрин',
      9: '🔴 Рубин, 🟠 Сердолик, 🟡 Янтарь'
    };
    return stones[number] || '🔮 Кварц и аметист';
  }


  /**
   * Обработка нумерологической даты
   */
  async processNumerologyDate(bot, chatId, birthDate, from, messageId = null) {
    try {
      const user = await this.ensureUser(from);
      
      // Валидация даты
      const dateRegex = /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/;
      const match = birthDate.match(dateRegex);
      
      if (!match) {
        await bot.sendMessage(chatId, '❌ Неверный формат даты. Используйте ДД.ММ.ГГГГ (например: 15.03.1990)');
        return;
      }

      const [, day, month, year] = match;
      const dateObj = new Date(year, month - 1, day);
      
      if (dateObj.getDate() != day || dateObj.getMonth() != month - 1 || dateObj.getFullYear() != year) {
        await bot.sendMessage(chatId, '❌ Введена некорректная дата. Проверьте правильность ввода.');
        return;
      }

      await bot.sendChatAction(chatId, 'typing');

      // Расчет нумерологических чисел
      const analysis = this.calculateNumerologyNumbers(birthDate);
      
      // Получаем AI интерпретацию для нумерологии
      let aiInterpretation = null;
      try {
        aiInterpretation = await this.getNumerologyAIInterpretation(analysis, user);
      } catch (error) {
        console.log('Numerology AI interpretation failed:', error.message);
      }

      // Формируем базовый анализ
      const analysisText = `🔢 <b>Ваш нумерологический анализ</b>\n\n` +
        `📅 <b>Дата рождения:</b> ${birthDate}\n\n` +
        `🛤️ <b>Число жизненного пути:</b> ${analysis.lifePathNumber}\n` +
        `${this.getLifePathMeaning(analysis.lifePathNumber)}\n\n` +
        `👤 <b>Число личности:</b> ${analysis.personalityNumber}\n` +
        `${this.getPersonalityMeaning(analysis.personalityNumber)}\n\n` +
        `🎯 <b>Число судьбы:</b> ${analysis.destinyNumber}\n` +
        `${this.getDestinyMeaning(analysis.destinyNumber)}\n\n`;

      let finalText = analysisText;
      
      // Добавляем AI интерпретацию если есть
      if (aiInterpretation && aiInterpretation.success) {
        finalText += `🤖 <b>AI анализ:</b>\n${aiInterpretation.interpretation.interpretation || aiInterpretation.interpretation.main}\n\n`;
      }

      const keyboard = {
        inline_keyboard: [
          [{ text: '📋 Подробный анализ', callback_data: 'numerology_detailed' }],
          [{ text: '🔮 Персональное гадание', callback_data: 'numerology_personal_reading' }],
          [{ text: '📊 Совместимость', callback_data: 'numerology_compatibility' }],
          [{ text: '🔢 Новый анализ', callback_data: 'numerology' }]
        ]
      };

      if (messageId) {
        await bot.editMessageText(finalText, {
          chat_id: chatId,
          message_id: messageId,
          parse_mode: 'HTML',
          reply_markup: keyboard
        });
      } else {
        await bot.sendMessage(chatId, finalText, {
          parse_mode: 'HTML',
          reply_markup: keyboard
        });
      }

      // Сохраняем результат анализа
      this.pendingNumerology.set(chatId, {
        userId: user.id,
        step: 'completed',
        lastAnalysis: {
          ...analysis,
          birthDate,
          aiInterpretation
        },
        timestamp: Date.now()
      });

      // Сохраняем в базу данных
      try {
        const numerologyReading = {
          userId: user.id,
          type: 'numerology',
          spreadName: 'Нумерологический анализ',
          cards: [{ 
            name: `Число судьбы ${analysis.destinyNumber}`, 
            description: `Анализ для ${birthDate}` 
          }],
          positions: [{ 
            name: 'Нумерологический портрет', 
            description: 'Полный анализ личности через числа' 
          }],
          question: `Нумерологический анализ для даты рождения ${birthDate}`,
          interpretation: aiInterpretation?.interpretation?.interpretation || analysisText,
          metadata: {
            birthDate,
            lifePathNumber: analysis.lifePathNumber,
            personalityNumber: analysis.personalityNumber,
            destinyNumber: analysis.destinyNumber
          }
        };
        
        await database.createReading(numerologyReading);
      } catch (error) {
        console.log('Failed to save numerology reading to database:', error.message);
      }

    } catch (error) {
      console.error('Error processing numerology date:', error);
      await bot.sendMessage(chatId, '❌ Произошла ошибка при анализе. Попробуйте позже.');
    }
  }

  /**
   * Расчет нумерологических чисел
   */
  calculateNumerologyNumbers(birthDate) {
    const [day, month, year] = birthDate.split('.').map(Number);
    
    // Число жизненного пути (сумма всех цифр даты рождения)
    const lifePathNumber = this.reduceToSingleDigit(day + month + year);
    
    // Число личности (день рождения)
    const personalityNumber = this.reduceToSingleDigit(day);
    
    // Число судьбы (год рождения)
    const destinyNumber = this.reduceToSingleDigit(year);
    
    return {
      lifePathNumber,
      personalityNumber,
      destinyNumber,
      day,
      month,
      year
    };
  }

  /**
   * Приведение числа к однозначному
   */
  reduceToSingleDigit(number) {
    while (number > 9) {
      number = number.toString().split('').reduce((sum, digit) => sum + parseInt(digit), 0);
    }
    return number;
  }

  /**
   * Получить краткое значение числа жизненного пути
   */
  getLifePathMeaning(number) {
    const meanings = {
      1: 'Лидер, первопроходец, независимый',
      2: 'Миротворец, дипломат, сотрудничество',
      3: 'Творец, артист, вдохновение',
      4: 'Строитель, организатор, стабильность',
      5: 'Путешественник, свобода, перемены',
      6: 'Целитель, защитник семьи, забота',
      7: 'Мудрец, исследователь, духовность',
      8: 'Руководитель, материальный успех',
      9: 'Учитель, гуманист, служение'
    };
    return meanings[number] || 'Особый путь';
  }

  /**
   * Получить краткое значение числа личности
   */
  getPersonalityMeaning(number) {
    const meanings = {
      1: 'Сильный, уверенный, лидерские качества',
      2: 'Мягкий, отзывчивый, дружелюбный',
      3: 'Харизматичный, творческий, общительный',
      4: 'Надежный, практичный, организованный',
      5: 'Динамичный, свободолюбивый, энергичный',
      6: 'Заботливый, ответственный, семейный',
      7: 'Мудрый, загадочный, духовный',
      8: 'Успешный, амбициозный, влиятельный',
      9: 'Щедрый, альтруистичный, мудрый'
    };
    return meanings[number] || 'Уникальная личность';
  }

  /**
   * Получить краткое значение числа судьбы
   */
  getDestinyMeaning(number) {
    const meanings = {
      1: 'Предназначение лидера и новатора',
      2: 'Судьба миротворца и дипломата',
      3: 'Путь творчества и вдохновения',
      4: 'Миссия строителя и организатора',
      5: 'Судьба исследователя и реформатора',
      6: 'Предназначение защитника и целителя',
      7: 'Путь мудреца и наставника',
      8: 'Судьба руководителя и магната',
      9: 'Миссия учителя человечества'
    };
    return meanings[number] || 'Особое предназначение';
  }

  /**
   * Получить AI интерпретацию для нумерологии
   */
  async getNumerologyAIInterpretation(analysis, user) {
    try {
      // Создаем детальную карту для более точного анализа
      const numerologyCard = {
        name: `Нумерологический профиль для ${analysis.birthDate}`,
        description: `Полная дата: ${analysis.day}.${analysis.month}.${analysis.year}, ` +
          `Число жизненного пути: ${analysis.lifePathNumber} (${this.getLifePathMeaning(analysis.lifePathNumber)}), ` +
          `Число личности: ${analysis.personalityNumber} (${this.getPersonalityMeaning(analysis.personalityNumber)}), ` +
          `Число судьбы: ${analysis.destinyNumber} (${this.getDestinyMeaning(analysis.destinyNumber)}), ` +
          `День рождения: ${analysis.day}, Месяц: ${analysis.month}, Год: ${analysis.year}`
      };

      const detailedQuestion = `Проведите глубокий нумерологический анализ для человека, родившегося ${analysis.birthDate}. ` +
        `ЧИСЛА ДЛЯ АНАЛИЗА: ` +
        `Число жизненного пути: ${analysis.lifePathNumber} (сумма всех цифр даты рождения), ` +
        `Число личности: ${analysis.personalityNumber} (от дня рождения ${analysis.day}), ` +
        `Число судьбы: ${analysis.destinyNumber} (от года рождения ${analysis.year}). ` +
        `Дайте подробную персональную интерпретацию с акцентом на: ` +
        `1) Жизненную миссию и предназначение ` +
        `2) Характер и личностные качества ` +
        `3) Таланты и способности ` +
        `4) Рекомендации для личностного роста ` +
        `5) Совместимость с другими числами ` +
        `6) Карьерные предрасположенности ` +
        `7) Особенности текущего жизненного периода. ` +
        `Используйте профессиональную нумерологическую терминологию и дайте практические советы.`;

      const response = await database.makeRequest('POST', '/ai/interpret', {
        cards: [numerologyCard],
        spreadType: 'numerology',
        positions: [{ 
          name: 'Полный нумерологический портрет', 
          description: 'Детальный анализ личности, талантов и жизненного пути через числа даты рождения' 
        }],
        question: detailedQuestion,
        user: {
          id: user.id,
          language: user.languageCode || 'ru'
        }
      });

      return response;
    } catch (error) {
      console.error('Failed to get numerology AI interpretation:', error.message);
      throw error;
    }
  }

  /**
   * Персональное гадание на основе нумерологии
   */
  async handleNumerologyPersonalReading(bot, chatId, from, messageId = null) {
    try {
      const numerologyData = this.pendingNumerology.get(chatId);
      if (!numerologyData || !numerologyData.lastAnalysis) {
        await bot.editMessageText('❌ Сначала проведите нумерологический анализ.', {
          chat_id: chatId,
          message_id: messageId,
          reply_markup: {
            inline_keyboard: [
              [{ text: '🔢 Начать анализ', callback_data: 'numerology' }]
            ]
          }
        });
        return;
      }

      const user = await this.ensureUser(from);
      const analysis = numerologyData.lastAnalysis;

      await bot.sendChatAction(chatId, 'typing');

      // Генерируем персональный расклад на основе нумерологических чисел
      const personalCards = this.generatePersonalCards(analysis);
      
      // Получаем AI интерпретацию для персонального гадания
      const aiResponse = await database.makeRequest('POST', '/ai/interpret', {
        cards: personalCards,
        spreadType: 'numerology_personal',
        positions: [
          { name: 'Текущее состояние', description: 'Ваша энергия сейчас' },
          { name: 'Скрытые таланты', description: 'Нераскрытые способности' },
          { name: 'Путь развития', description: 'Направление роста' }
        ],
        question: `На основе нумерологического профиля (жизненный путь: ${analysis.lifePathNumber}, личность: ${analysis.personalityNumber}, судьба: ${analysis.destinyNumber}) дайте персональные рекомендации для текущего периода жизни`,
        user: {
          id: user.id,
          language: user.languageCode || 'ru'
        }
      });

      const interpretationText = aiResponse?.interpretation?.interpretation || 
        'Ваши числа говорят о периоде важных возможностей. Доверьтесь своей интуиции.';

      const responseText = `🔮 <b>Персональное гадание</b>\n\n` +
        `Основано на вашем нумерологическом профиле (${analysis.birthDate})\n\n` +
        `<b>Толкование:</b>\n${interpretationText}`;

      if (messageId) {
        await bot.editMessageText(responseText, {
          chat_id: chatId,
          message_id: messageId,
          parse_mode: 'HTML',
          reply_markup: {
            inline_keyboard: [
              [{ text: '🔢 Новый анализ', callback_data: 'numerology' }],
              [{ text: '⬅️ Назад', callback_data: 'numerology' }]
            ]
          }
        });
      } else {
        await bot.sendMessage(chatId, responseText, {
          parse_mode: 'HTML',
          reply_markup: {
            inline_keyboard: [
              [{ text: '🔢 Новый анализ', callback_data: 'numerology' }]
            ]
          }
        });
      }

    } catch (error) {
      console.error('Error in numerology personal reading:', error);
      await bot.sendMessage(chatId, '❌ Ошибка при создании персонального гадания.');
    }
  }

  /**
   * Анализ совместимости в нумерологии
   */
  async handleNumerologyCompatibility(bot, chatId, from, messageId = null) {
    try {
      const numerologyData = this.pendingNumerology.get(chatId);
      if (!numerologyData || !numerologyData.lastAnalysis) {
        await bot.editMessageText('❌ Сначала проведите нумерологический анализ.', {
          chat_id: chatId,
          message_id: messageId,
          reply_markup: {
            inline_keyboard: [
              [{ text: '🔢 Начать анализ', callback_data: 'numerology' }]
            ]
          }
        });
        return;
      }

      const analysis = numerologyData.lastAnalysis;
      const userNumber = analysis.lifePathNumber;

      // Анализ совместимости с разными числами
      const compatibilityData = this.getDetailedCompatibility(userNumber);

      const compatibilityText = `📊 <b>Анализ совместимости</b>\n\n` +
        `Ваше число жизненного пути: <b>${userNumber}</b>\n\n` +
        `<b>💚 Идеальная совместимость:</b>\n${compatibilityData.perfect.map(num => `${num} - ${this.getCompatibilityDescription(userNumber, num)}`).join('\n')}\n\n` +
        `<b>💛 Хорошая совместимость:</b>\n${compatibilityData.good.map(num => `${num} - ${this.getCompatibilityDescription(userNumber, num)}`).join('\n')}\n\n` +
        `<b>🟡 Требует работы:</b>\n${compatibilityData.challenging.map(num => `${num} - ${this.getCompatibilityDescription(userNumber, num)}`).join('\n')}\n\n` +
        `<i>Совместимость основана на гармонии энергий ваших чисел</i>`;

      if (messageId) {
        await bot.editMessageText(compatibilityText, {
          chat_id: chatId,
          message_id: messageId,
          parse_mode: 'HTML',
          reply_markup: {
            inline_keyboard: [
              [{ text: '🔢 Новый анализ', callback_data: 'numerology' }],
              [{ text: '⬅️ Назад', callback_data: 'numerology' }]
            ]
          }
        });
      } else {
        await bot.sendMessage(chatId, compatibilityText, {
          parse_mode: 'HTML',
          reply_markup: {
            inline_keyboard: [
              [{ text: '🔢 Новый анализ', callback_data: 'numerology' }]
            ]
          }
        });
      }

    } catch (error) {
      console.error('Error in numerology compatibility:', error);
      await bot.sendMessage(chatId, '❌ Ошибка при анализе совместимости.');
    }
  }

  /**
   * Генерация персональных карт на основе нумерологии
   */
  generatePersonalCards(analysis) {
    return [
      {
        name: `Энергия числа ${analysis.lifePathNumber}`,
        description: `Ваша основная жизненная энергия: ${this.getLifePathMeaning(analysis.lifePathNumber)}`
      },
      {
        name: `Скрытый потенциал ${analysis.personalityNumber}`,
        description: `Ваши неиспользованные таланты: ${this.getPersonalityMeaning(analysis.personalityNumber)}`
      },
      {
        name: `Путь судьбы ${analysis.destinyNumber}`,
        description: `Направление развития: ${this.getDestinyMeaning(analysis.destinyNumber)}`
      }
    ];
  }

  /**
   * Получить детальную совместимость
   */
  getDetailedCompatibility(userNumber) {
    const compatibility = {
      1: { perfect: [3, 5], good: [1, 9], challenging: [2, 4, 6, 7, 8] },
      2: { perfect: [6, 8], good: [2, 4], challenging: [1, 3, 5, 7, 9] },
      3: { perfect: [1, 9], good: [3, 5], challenging: [2, 4, 6, 7, 8] },
      4: { perfect: [2, 8], good: [4, 6], challenging: [1, 3, 5, 7, 9] },
      5: { perfect: [1, 7], good: [3, 5], challenging: [2, 4, 6, 8, 9] },
      6: { perfect: [2, 9], good: [4, 6], challenging: [1, 3, 5, 7, 8] },
      7: { perfect: [5, 9], good: [7], challenging: [1, 2, 3, 4, 6, 8] },
      8: { perfect: [2, 4], good: [6, 8], challenging: [1, 3, 5, 7, 9] },
      9: { perfect: [3, 6], good: [1, 7, 9], challenging: [2, 4, 5, 8] }
    };
    
    return compatibility[userNumber] || { perfect: [], good: [], challenging: [] };
  }

  /**
   * Получить описание совместимости между числами
   */
  getCompatibilityDescription(userNumber, partnerNumber) {
    const descriptions = {
      [`${userNumber}_${partnerNumber}`]: 'Гармоничное сочетание энергий',
      [`${partnerNumber}_${userNumber}`]: 'Взаимное дополнение'
    };
    
    // Базовые описания
    const baseDescriptions = {
      1: 'Лидерские качества',
      2: 'Поддержка и дипломатия', 
      3: 'Творчество и радость',
      4: 'Стабильность и надежность',
      5: 'Свобода и приключения',
      6: 'Забота и ответственность',
      7: 'Мудрость и духовность',
      8: 'Успех и материальность',
      9: 'Гуманизм и щедрость'
    };
    
    return descriptions[`${userNumber}_${partnerNumber}`] || baseDescriptions[partnerNumber] || 'Интересное сочетание';
  }

  /**
   * Обработчик меню нумерологии
   */
  async handleNumerologyMenu(bot, chatId, messageId, from) {
    try {
      const user = await this.ensureUser(from);
      
      // Проверяем, есть ли у пользователя сохраненный профиль
      const userProfile = this.userProfiles.get(chatId);
      const hasProfile = userProfile && userProfile.profile;

      let text, keyboard;

      if (!hasProfile) {
        // Если профиля нет - принудительное создание
        text = `🔢 *Добро пожаловать в Нумерологию!*\n\nДля начала работы необходимо создать ваш нумерологический профиль.\n\n✨ Это займет всего 2 минуты, но откроет доступ ко всем функциям:\n• Персональный анализ\n• Совместимость с партнером\n• Прогноз на год\n• И многое другое!`;
        
        keyboard = {
          inline_keyboard: [
            [{ text: '🔢 Создать мой профиль', callback_data: 'numerology_create_profile' }],
            [{ text: '🔙 Главное меню', callback_data: 'back_to_menu' }]
          ]
        };
      } else {
        // Если профиль есть - показываем полное меню
        text = `🔢 *Нумерология*\n\n👤 *Ваш профиль создан!*\n\nВыберите интересующий раздел:`;
        
        keyboard = {
          inline_keyboard: [
            [
              { text: '👤 Мой профиль', callback_data: 'numerology_my_profile' },
              { text: '👥 Совместимость', callback_data: 'numerology_compatibility' }
            ],
            [
              { text: '🎯 Персональный год', callback_data: 'numerology_year' },
              { text: '📝 Анализ имени', callback_data: 'numerology_name' }
            ],
            [
              { text: '📱 Открыть приложение', web_app: { url: process.env.WEBAPP_URL || 'https://mistika.app' } }
            ]
          ]
        };
      }

      if (messageId) {
        await bot.editMessageText(text, {
          chat_id: chatId,
          message_id: messageId,
          parse_mode: 'Markdown',
          reply_markup: keyboard
        });
      } else {
        await bot.sendMessage(chatId, text, {
          parse_mode: 'Markdown',
          reply_markup: keyboard
        });
      }

    } catch (error) {
      console.error('Error in numerology menu:', error);
      await bot.sendMessage(chatId, 'Произошла ошибка. Попробуйте позже.');
    }
  }

  /**
   * Обработчик расчета нумерологического профиля
   */
  async handleNumerologyCalculate(bot, chatId, messageId, from) {
    try {
      const user = await this.ensureUser(from);
      
      // Инициализируем сессию
      this.pendingNumerology.set(chatId, {
        userId: user.id,
        step: 'waiting_birthdate',
        data: {},
        timestamp: Date.now()
      });

      const text = `🔢 *Расчет нумерологического профиля*\n\nДля точного расчета мне понадобятся:\n1. Ваша дата рождения\n2. Ваше полное имя\n\n📅 Введите дату рождения в формате ДД.ММ.ГГГГ\nНапример: 15.03.1990`;

      const keyboard = {
        inline_keyboard: [
          [{ text: '❌ Отмена', callback_data: 'numerology_cancel' }]
        ]
      };

      if (messageId) {
        await bot.editMessageText(text, {
          chat_id: chatId,
          message_id: messageId,
          parse_mode: 'Markdown',
          reply_markup: keyboard
        });
      } else {
        await bot.sendMessage(chatId, text, {
          parse_mode: 'Markdown',
          reply_markup: keyboard
        });
      }

    } catch (error) {
      console.error('Error in numerology calculate:', error);
      await bot.sendMessage(chatId, 'Ошибка. Попробуйте позже.');
    }
  }

  /**
   * Обработчик анализа имени
   */
  async handleNumerologyNameAnalysis(bot, chatId, messageId, from) {
    try {
      const user = await this.ensureUser(from);
      
      this.pendingNumerology.set(chatId, {
        userId: user.id,
        step: 'waiting_name_analysis',
        data: {},
        timestamp: Date.now()
      });

      const text = `📝 *Анализ имени*\n\nВведите имя для нумерологического анализа:\n(можно ввести как полное имя, так и отдельные имена)`;

      const keyboard = {
        inline_keyboard: [
          [{ text: '❌ Отмена', callback_data: 'numerology_cancel' }]
        ]
      };

      if (messageId) {
        await bot.editMessageText(text, {
          chat_id: chatId,
          message_id: messageId,
          parse_mode: 'Markdown',
          reply_markup: keyboard
        });
      } else {
        await bot.sendMessage(chatId, text, {
          parse_mode: 'Markdown',
          reply_markup: keyboard
        });
      }

    } catch (error) {
      console.error('Error in numerology name analysis:', error);
      await bot.sendMessage(chatId, 'Ошибка. Попробуйте позже.');
    }
  }

  /**
   * Обработчик совместимости - использует сохраненный профиль пользователя
   */
  async handleNumerologyCompatibility(bot, chatId, messageId, from) {
    try {
      const user = await this.ensureUser(from);
      
      // Проверяем есть ли сохраненный профиль пользователя
      const userProfile = this.userProfiles.get(chatId);
      
      if (!userProfile || !userProfile.profile) {
        await bot.editMessageText('❌ *Для анализа совместимости нужен ваш профиль*\n\nСначала создайте свой нумерологический профиль, а затем сможете проверить совместимость с партнером.', {
          chat_id: chatId,
          message_id: messageId,
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [{ text: '🔢 Создать профиль', callback_data: 'numerology_create_profile' }],
              [{ text: '🔙 Назад', callback_data: 'numerology_menu' }]
            ]
          }
        });
        return;
      }

      // Профиль пользователя есть - запрашиваем данные партнера
      this.pendingNumerology.set(chatId, {
        userId: user.id,
        step: 'waiting_partner_birthdate',
        data: {
          userProfile: userProfile // Сохраняем профиль пользователя в сессии
        },
        timestamp: Date.now()
      });

      const text = `👥 *Анализ совместимости*\n\n✅ *Ваш профиль:* ${userProfile.fullName}\n\nТеперь введите данные партнера для расчета совместимости:\n\n📅 Дата рождения партнера (ДД.ММ.ГГГГ):`;

      const keyboard = {
        inline_keyboard: [
          [{ text: '❌ Отмена', callback_data: 'numerology_menu' }]
        ]
      };

      if (messageId) {
        await bot.editMessageText(text, {
          chat_id: chatId,
          message_id: messageId,
          parse_mode: 'Markdown',
          reply_markup: keyboard
        });
      } else {
        await bot.sendMessage(chatId, text, {
          parse_mode: 'Markdown',
          reply_markup: keyboard
        });
      }

    } catch (error) {
      console.error('Error in numerology compatibility:', error);
      await bot.sendMessage(chatId, 'Ошибка. Попробуйте позже.');
    }
  }

  /**
   * Обработчик персонального года/прогноза
   */
  async handleNumerologyForecast(bot, chatId, messageId, from) {
    try {
      const user = await this.ensureUser(from);
      
      // Здесь можно получить профиль пользователя из базы данных
      // Для примера используем расчет на основе текущей даты
      const currentYear = new Date().getFullYear();
      const personalYear = this.calculatePersonalYear(currentYear, from.id);

      // Получаем ИИ интерпретацию персонального года
      let aiInterpretation = null;
      try {
        const aiResponse = await database.makeRequest('POST', '/ai/interpret', {
          cards: [{
            name: `Нумерология: Персональный год`,
            description: `НУМЕРОЛОГИЧЕСКИЙ АНАЛИЗ (НЕ ТАРО): Персональный год ${currentYear}. Число года: ${personalYear}. Базовое значение: ${this.getPersonalYearMeaning(personalYear)}. Фокус года: ${this.getYearFocus(personalYear)}`,
            isReversed: false
          }],
          spreadType: 'numerology_year',
          positions: [{ name: 'Энергии года', description: 'Возможности и вызовы предстоящего года' }],
          question: `Проведи НУМЕРОЛОГИЧЕСКИЙ (не таро) прогноз на ${currentYear} год. Игнорируй упоминания карт таро - это нумерология. Дай персональные рекомендации на основе числа года ${personalYear}.`,
          user: { id: from.id, language: 'ru' }
        });
        
        aiInterpretation = aiResponse.interpretation;
        console.log('Personal year AI interpretation received:', JSON.stringify(aiResponse, null, 2));
      } catch (error) {
        console.log('Personal year AI interpretation failed:', error.message);
      }

      let text = `🎯 *Персональный год ${currentYear}*\n\n📊 *Ваше число года:* ${personalYear}\n\n`;

      if (aiInterpretation && aiInterpretation.interpretation) {
        text += `🤖 *ИИ-прогноз:*\n${aiInterpretation.interpretation}\n\n`;
        
        if (aiInterpretation.advice) {
          text += `💡 *Рекомендации:*\n${aiInterpretation.advice}`;
        }
      } else {
        text += `${this.getPersonalYearMeaning(personalYear)}\n\nЭто время для ${this.getYearFocus(personalYear)}`;
      }

      const keyboard = {
        inline_keyboard: [
          [{ text: '📱 Подробный анализ', web_app: { url: `${process.env.WEBAPP_URL || 'https://mistika.app'}/numerology` } }],
          [{ text: '🔙 Назад', callback_data: 'numerology_menu' }]
        ]
      };

      if (messageId) {
        await bot.editMessageText(text, {
          chat_id: chatId,
          message_id: messageId,
          parse_mode: 'Markdown',
          reply_markup: keyboard
        });
      } else {
        await bot.sendMessage(chatId, text, {
          parse_mode: 'Markdown',
          reply_markup: keyboard
        });
      }

    } catch (error) {
      console.error('Error in numerology forecast:', error);
      await bot.sendMessage(chatId, 'Ошибка. Попробуйте позже.');
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
}

module.exports = new BotHandlers();