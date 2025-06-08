// server/src/services/telegramService.js
const axios = require('axios');
const crypto = require('crypto');
const logger = require('../utils/logger');
const { User, Reading, Subscription } = require('../models');

class TelegramService {
  constructor() {
    this.botToken = process.env.TELEGRAM_BOT_TOKEN;
    this.botUsername = process.env.TELEGRAM_BOT_USERNAME;
    this.webhookUrl = process.env.TELEGRAM_WEBHOOK_URL;
    this.webAppUrl = process.env.WEBAPP_URL || 'https://your-domain.com';
    this.apiUrl = `https://api.telegram.org/bot${this.botToken}`;
    
    if (!this.botToken) {
      logger.error('TELEGRAM_BOT_TOKEN is not set');
    }
  }

  /**
   * Настройка webhook для бота
   */
  async setWebhook() {
    try {
      const response = await axios.post(`${this.apiUrl}/setWebhook`, {
        url: this.webhookUrl,
        allowed_updates: [
          'message',
          'callback_query',
          'inline_query',
          'pre_checkout_query',
          'successful_payment'
        ],
        drop_pending_updates: true
      });

      if (response.data.ok) {
        logger.info('Telegram webhook set successfully', {
          webhookUrl: this.webhookUrl
        });
      } else {
        logger.error('Failed to set Telegram webhook', {
          error: response.data.description
        });
      }

      return response.data;

    } catch (error) {
      logger.error('Error setting Telegram webhook', {
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Удаление webhook
   */
  async deleteWebhook() {
    try {
      const response = await axios.post(`${this.apiUrl}/deleteWebhook`);
      
      if (response.data.ok) {
        logger.info('Telegram webhook deleted successfully');
      }

      return response.data;

    } catch (error) {
      logger.error('Error deleting Telegram webhook', {
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Получение информации о боте
   */
  async getBotInfo() {
    try {
      const response = await axios.get(`${this.apiUrl}/getMe`);
      return response.data;

    } catch (error) {
      logger.error('Error getting bot info', {
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Отправка сообщения пользователю
   */
  async sendMessage(chatId, text, options = {}) {
    try {
      const messageData = {
        chat_id: chatId,
        text: text,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
        ...options
      };

      const response = await axios.post(`${this.apiUrl}/sendMessage`, messageData);
      
      if (response.data.ok) {
        logger.debug('Message sent successfully', {
          chatId,
          messageId: response.data.result.message_id
        });
      }

      return response.data;

    } catch (error) {
      logger.error('Error sending message', {
        error: error.message,
        chatId,
        text: text.substring(0, 100)
      });
      throw error;
    }
  }

  /**
   * Отправка фото с подписью
   */
  async sendPhoto(chatId, photo, caption = '', options = {}) {
    try {
      const photoData = {
        chat_id: chatId,
        photo: photo,
        caption: caption,
        parse_mode: 'HTML',
        ...options
      };

      const response = await axios.post(`${this.apiUrl}/sendPhoto`, photoData);
      return response.data;

    } catch (error) {
      logger.error('Error sending photo', {
        error: error.message,
        chatId
      });
      throw error;
    }
  }

  /**
   * Редактирование сообщения
   */
  async editMessage(chatId, messageId, text, options = {}) {
    try {
      const editData = {
        chat_id: chatId,
        message_id: messageId,
        text: text,
        parse_mode: 'HTML',
        ...options
      };

      const response = await axios.post(`${this.apiUrl}/editMessageText`, editData);
      return response.data;

    } catch (error) {
      logger.error('Error editing message', {
        error: error.message,
        chatId,
        messageId
      });
      throw error;
    }
  }

  /**
   * Отправка инлайн клавиатуры
   */
  createInlineKeyboard(buttons) {
    return {
      reply_markup: {
        inline_keyboard: buttons
      }
    };
  }

  /**
   * Создание кнопки для WebApp
   */
  createWebAppButton(text, url = null) {
    return {
      text: text,
      web_app: {
        url: url || this.webAppUrl
      }
    };
  }

  /**
   * Обработка входящих сообщений
   */
  async handleMessage(message) {
    try {
      const chatId = message.chat.id;
      const userId = message.from.id;
      const text = message.text;

      // Получаем или создаем пользователя
      let user = await this.getOrCreateUser(message.from);

      if (text?.startsWith('/start')) {
        await this.handleStartCommand(chatId, user, text);
      } else if (text?.startsWith('/daily')) {
        await this.handleDailyCommand(chatId, user);
      } else if (text?.startsWith('/premium')) {
        await this.handlePremiumCommand(chatId, user);
      } else if (text?.startsWith('/help')) {
        await this.handleHelpCommand(chatId);
      } else if (text?.startsWith('/stats')) {
        await this.handleStatsCommand(chatId, user);
      } else {
        await this.handleUnknownCommand(chatId);
      }

    } catch (error) {
      logger.error('Error handling message', {
        error: error.message,
        message
      });
    }
  }

  /**
   * Обработка callback запросов
   */
  async handleCallbackQuery(callbackQuery) {
    try {
      const chatId = callbackQuery.message.chat.id;
      const messageId = callbackQuery.message.message_id;
      const data = callbackQuery.data;
      const userId = callbackQuery.from.id;

      // Подтверждаем получение callback
      await this.answerCallbackQuery(callbackQuery.id);

      const user = await User.findOne({
        where: { telegramId: userId.toString() }
      });

      if (data.startsWith('daily_card')) {
        await this.handleDailyCardCallback(chatId, messageId, user);
      } else if (data.startsWith('premium_info')) {
        await this.handlePremiumInfoCallback(chatId, messageId, user);
      } else if (data.startsWith('open_app')) {
        await this.handleOpenAppCallback(chatId, messageId, user);
      }

    } catch (error) {
      logger.error('Error handling callback query', {
        error: error.message,
        callbackQuery
      });
    }
  }

  /**
   * Обработка команды /start
   */
  async handleStartCommand(chatId, user, text) {
    const referralCode = text.split(' ')[1];
    
    if (referralCode && referralCode !== user.telegramId) {
      // Обрабатываем реферальную ссылку
      await this.handleReferral(user, referralCode);
    }

    const welcomeText = `
🔮 <b>Добро пожаловать в MISTIKA!</b>

Я помогу вам открыть тайны Вселенной через карты Таро, нумерологию и лунный календарь.

<b>Что я умею:</b>
🎴 Гадание на картах Таро
🔢 Нумерологические расчеты  
🌙 Лунный календарь
🤖 AI-интерпретации
🎤 Голосовые гадания

<b>Начните свой мистический путь прямо сейчас!</b>
    `;

    const keyboard = this.createInlineKeyboard([
      [this.createWebAppButton('🔮 Открыть MISTIKA')],
      [
        { text: '🎴 Дневная карта', callback_data: 'daily_card' },
        { text: '💎 Premium', callback_data: 'premium_info' }
      ],
      [
        { text: '📊 Статистика', callback_data: 'stats' },
        { text: '❓ Помощь', callback_data: 'help' }
      ]
    ]);

    await this.sendMessage(chatId, welcomeText, keyboard);
  }

  /**
   * Обработка команды /daily
   */
  async handleDailyCommand(chatId, user) {
    try {
      // Проверяем лимиты
      const today = new Date().toDateString();
      const todaysReadings = await Reading.count({
        where: {
          userId: user.id,
          type: 'daily_card',
          createdAt: {
            [require('sequelize').Op.gte]: new Date(today)
          }
        }
      });

      if (!user.isPremium && todaysReadings >= 1) {
        const upgradeText = `
⏰ <b>Лимит исчерпан</b>

Вы уже получили дневную карту сегодня.
Оформите Premium для безлимитных гаданий!
        `;

        const keyboard = this.createInlineKeyboard([
          [{ text: '💎 Получить Premium', callback_data: 'premium_info' }],
          [this.createWebAppButton('🔮 Открыть приложение')]
        ]);

        await this.sendMessage(chatId, upgradeText, keyboard);
        return;
      }

      // Генерируем дневную карту (упрощенная версия)
      const cards = await this.generateDailyCard(user);
      
      const cardText = `
🎴 <b>Ваша карта дня</b>

<b>${cards.name}</b>
${cards.meaning}

<i>${cards.advice}</i>

Откройте приложение для полной интерпретации!
      `;

      const keyboard = this.createInlineKeyboard([
        [this.createWebAppButton('🔮 Полная интерпретация')],
        [{ text: '📱 Поделиться', callback_data: 'share_reading' }]
      ]);

      await this.sendPhoto(chatId, cards.imageUrl, cardText, keyboard);

    } catch (error) {
      logger.error('Error handling daily command', {
        error: error.message,
        chatId,
        userId: user.id
      });

      await this.sendMessage(chatId, 
        '😔 Произошла ошибка при получении дневной карты. Попробуйте позже.'
      );
    }
  }

  /**
   * Обработка команды /premium
   */
  async handlePremiumCommand(chatId, user) {
    const subscription = await Subscription.getActiveByUser(user.id);
    
    if (subscription) {
      const premiumText = `
👑 <b>MISTIKA Premium активна</b>

<b>Статус:</b> ${subscription.status}
<b>До окончания:</b> ${subscription.getDaysRemaining()} дней
<b>Автопродление:</b> ${subscription.autoRenewal ? 'Включено' : 'Отключено'}

<b>Ваши возможности:</b>
✅ Безлимитные гадания
✅ AI-интерпретации
✅ Голосовые гадания
✅ Анализ фотографий
✅ Эксклюзивные расклады
      `;

      const keyboard = this.createInlineKeyboard([
        [this.createWebAppButton('🔮 Открыть приложение')],
        [{ text: '⚙️ Управление подпиской', callback_data: 'manage_subscription' }]
      ]);

      await this.sendMessage(chatId, premiumText, keyboard);
    } else {
      const premiumText = `
💎 <b>MISTIKA Premium</b>

<b>Откройте безграничные возможности:</b>
🔮 Безлимитные гадания
🤖 AI-интерпретации с персонализацией
🎤 Голосовые гадания (60 мин/день)
📸 Мистический анализ фотографий
✨ Эксклюзивные расклады
📜 Полная история гаданий
🎯 Приоритетная поддержка

<b>Планы подписки:</b>
📅 Месяц - 299₽
💰 Квартал - 799₽ (-10%)
🎁 Год - 2999₽ (-20%)
      `;

      const keyboard = this.createInlineKeyboard([
        [{ text: '💎 Оформить Premium', callback_data: 'buy_premium' }],
        [this.createWebAppButton('🔮 Открыть приложение')],
        [{ text: '🎁 7 дней бесплатно', callback_data: 'free_trial' }]
      ]);

      await this.sendMessage(chatId, premiumText, keyboard);
    }
  }

  /**
   * Обработка команды /help
   */
  async handleHelpCommand(chatId) {
    const helpText = `
❓ <b>Помощь MISTIKA</b>

<b>Основные команды:</b>
/start - Главное меню
/daily - Дневная карта
/premium - Информация о Premium
/stats - Ваша статистика
/help - Эта справка

<b>Как пользоваться:</b>
🔮 Нажмите "Открыть MISTIKA" для полного доступа
🎴 Используйте /daily для быстрой дневной карты
💎 Оформите Premium для всех возможностей

<b>Поддержка:</b>
📧 Email: support@mistika.app
💬 Telegram: @mistika_support
    `;

    const keyboard = this.createInlineKeyboard([
      [this.createWebAppButton('🔮 Открыть MISTIKA')],
      [{ text: '💬 Связаться с поддержкой', url: 'https://t.me/mistika_support' }]
    ]);

    await this.sendMessage(chatId, helpText, keyboard);
  }

  /**
   * Обработка команды /stats
   */
  async handleStatsCommand(chatId, user) {
    try {
      const [totalReadings, todayReadings, subscription] = await Promise.all([
        Reading.count({ where: { userId: user.id } }),
        Reading.count({
          where: {
            userId: user.id,
            createdAt: {
              [require('sequelize').Op.gte]: new Date().setHours(0, 0, 0, 0)
            }
          }
        }),
        Subscription.getActiveByUser(user.id)
      ]);

      const statsText = `
📊 <b>Ваша статистика</b>

<b>Гадания:</b>
📅 Сегодня: ${todayReadings}
📈 Всего: ${totalReadings}

<b>Статус:</b> ${subscription ? '👑 Premium' : '🆓 Бесплатный'}
<b>Участник с:</b> ${user.createdAt.toLocaleDateString('ru-RU')}

${subscription ? 
  `<b>Premium до:</b> ${subscription.endDate.toLocaleDateString('ru-RU')}` : 
  `<b>Лимит сегодня:</b> ${3 - todayReadings} гаданий`
}
      `;

      const keyboard = this.createInlineKeyboard([
        [this.createWebAppButton('🔮 Открыть приложение')],
        ...(subscription ? [] : [[{ text: '💎 Получить Premium', callback_data: 'premium_info' }]])
      ]);

      await this.sendMessage(chatId, statsText, keyboard);

    } catch (error) {
      logger.error('Error handling stats command', {
        error: error.message,
        chatId,
        userId: user.id
      });
    }
  }

  /**
   * Обработка неизвестных команд
   */
  async handleUnknownCommand(chatId) {
    const unknownText = `
🤔 Я не понимаю эту команду.

Используйте /help для списка доступных команд или откройте приложение для полного функционала.
    `;

    const keyboard = this.createInlineKeyboard([
      [this.createWebAppButton('🔮 Открыть MISTIKA')],
      [{ text: '❓ Помощь', callback_data: 'help' }]
    ]);

    await this.sendMessage(chatId, unknownText, keyboard);
  }

  /**
   * Подтверждение callback запроса
   */
  async answerCallbackQuery(callbackQueryId, text = null, showAlert = false) {
    try {
      await axios.post(`${this.apiUrl}/answerCallbackQuery`, {
        callback_query_id: callbackQueryId,
        text: text,
        show_alert: showAlert
      });

    } catch (error) {
      logger.error('Error answering callback query', {
        error: error.message,
        callbackQueryId
      });
    }
  }

  /**
   * Получение или создание пользователя из Telegram данных
   */
  async getOrCreateUser(telegramUser) {
    try {
      let user = await User.findOne({
        where: { telegramId: telegramUser.id.toString() }
      });

      if (!user) {
        user = await User.create({
          telegramId: telegramUser.id.toString(),
          firstName: telegramUser.first_name,
          lastName: telegramUser.last_name,
          username: telegramUser.username,
          languageCode: telegramUser.language_code || 'ru',
          isPremium: false,
          isActive: true
        });

        logger.info('New user created from Telegram', {
          userId: user.id,
          telegramId: telegramUser.id
        });
      } else {
        // Обновляем данные пользователя
        await user.update({
          firstName: telegramUser.first_name,
          lastName: telegramUser.last_name,
          username: telegramUser.username,
          languageCode: telegramUser.language_code || user.languageCode,
          lastSeen: new Date()
        });
      }

      return user;

    } catch (error) {
      logger.error('Error getting or creating user', {
        error: error.message,
        telegramUser
      });
      throw error;
    }
  }

  /**
   * Обработка реферальной ссылки
   */
  async handleReferral(user, referralCode) {
    try {
      const referrer = await User.findOne({
        where: { telegramId: referralCode }
      });

      if (referrer && referrer.id !== user.id) {
        // Добавляем реферала
        await user.update({
          referredBy: referrer.id
        });

        // Начисляем бонус рефереру (например, дополнительные дни Premium)
        logger.info('Referral processed', {
          userId: user.id,
          referrerId: referrer.id
        });
      }

    } catch (error) {
      logger.error('Error handling referral', {
        error: error.message,
        userId: user.id,
        referralCode
      });
    }
  }

  /**
   * Генерация дневной карты (упрощенная версия)
   */
  async generateDailyCard(user) {
    // Упрощенная генерация карты для демонстрации
    const cards = [
      {
        name: 'Солнце',
        meaning: 'Радость, успех, позитивная энергия',
        advice: 'Сегодня благоприятный день для новых начинаний',
        imageUrl: 'https://example.com/tarot/sun.jpg'
      },
      {
        name: 'Луна',
        meaning: 'Интуиция, тайны, подсознание',
        advice: 'Доверьтесь своей интуиции сегодня',
        imageUrl: 'https://example.com/tarot/moon.jpg'
      },
      {
        name: 'Звезда',
        meaning: 'Надежда, вдохновение, духовное руководство',
        advice: 'Следуйте за своими мечтами',
        imageUrl: 'https://example.com/tarot/star.jpg'
      }
    ];

    // Псевдослучайный выбор на основе даты и ID пользователя
    const today = new Date().toDateString();
    const hash = crypto.createHash('md5').update(today + user.id).digest('hex');
    const index = parseInt(hash.substring(0, 2), 16) % cards.length;

    return cards[index];
  }

  /**
   * Отправка уведомления пользователю
   */
  async sendNotification(telegramId, title, message, options = {}) {
    try {
      const text = `
<b>${title}</b>

${message}
      `;

      await this.sendMessage(telegramId, text, options);

    } catch (error) {
      logger.error('Error sending notification', {
        error: error.message,
        telegramId,
        title
      });
    }
  }

  /**
   * Валидация данных от Telegram WebApp
   */
  validateWebAppData(initData) {
    try {
      const urlParams = new URLSearchParams(initData);
      const hash = urlParams.get('hash');
      urlParams.delete('hash');

      const dataCheckString = Array.from(urlParams.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, value]) => `${key}=${value}`)
        .join('\n');

      const secretKey = crypto.createHmac('sha256', 'WebAppData').update(this.botToken).digest();
      const calculatedHash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');

      return calculatedHash === hash;

    } catch (error) {
      logger.error('Error validating WebApp data', {
        error: error.message
      });
      return false;
    }
  }
}

module.exports = new TelegramService();