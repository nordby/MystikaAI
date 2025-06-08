// server/src/config/telegram.js
const logger = require('../utils/logger');

class TelegramConfig {
  constructor() {
    this.botToken = process.env.TELEGRAM_BOT_TOKEN;
    this.webhookUrl = process.env.TELEGRAM_WEBHOOK_URL;
    this.webhookPath = process.env.TELEGRAM_WEBHOOK_PATH || '/webhook/telegram';
    this.webhookSecret = process.env.TELEGRAM_WEBHOOK_SECRET;
    this.adminIds = this.parseAdminIds(process.env.TELEGRAM_ADMIN_IDS);
    this.apiUrl = 'https://api.telegram.org/bot';
    this.maxRetries = 3;
    this.retryDelay = 1000;
  }

  /**
   * Валидация конфигурации
   */
  validate() {
    const errors = [];

    if (!this.botToken) {
      errors.push('TELEGRAM_BOT_TOKEN is required');
    } else if (!this.isValidBotToken(this.botToken)) {
      errors.push('TELEGRAM_BOT_TOKEN has invalid format');
    }

    if (this.webhookUrl && !this.isValidUrl(this.webhookUrl)) {
      errors.push('TELEGRAM_WEBHOOK_URL has invalid format');
    }

    if (this.webhookSecret && this.webhookSecret.length < 8) {
      errors.push('TELEGRAM_WEBHOOK_SECRET must be at least 8 characters');
    }

    if (errors.length > 0) {
      throw new Error(`Telegram configuration errors: ${errors.join(', ')}`);
    }

    logger.info('Telegram configuration validated successfully');
    return true;
  }

  /**
   * Получение конфигурации бота
   */
  getBotConfig() {
    return {
      token: this.botToken,
      apiUrl: this.getApiUrl(),
      webhook: {
        url: this.webhookUrl,
        path: this.webhookPath,
        secret: this.webhookSecret
      },
      adminIds: this.adminIds,
      options: {
        maxRetries: this.maxRetries,
        retryDelay: this.retryDelay
      }
    };
  }

  /**
   * Получение URL API
   */
  getApiUrl() {
    return `${this.apiUrl}${this.botToken}`;
  }

  /**
   * Получение URL для webhook
   */
  getWebhookUrl() {
    if (!this.webhookUrl) return null;
    return `${this.webhookUrl}${this.webhookPath}`;
  }

  /**
   * Проверка валидности токена бота
   */
  isValidBotToken(token) {
    if (!token || typeof token !== 'string') return false;
    
    // Формат токена: ботID:токен (например, 123456789:ABCdefGHIjklMNOpqrsTUVwxyz)
    const tokenRegex = /^\d{8,10}:[A-Za-z0-9_-]{35}$/;
    return tokenRegex.test(token);
  }

  /**
   * Проверка валидности URL
   */
  isValidUrl(url) {
    try {
      const urlObj = new URL(url);
      return urlObj.protocol === 'https:';
    } catch {
      return false;
    }
  }

  /**
   * Парсинг ID администраторов
   */
  parseAdminIds(adminIdsString) {
    if (!adminIdsString) return [];
    
    try {
      return adminIdsString
        .split(',')
        .map(id => parseInt(id.trim()))
        .filter(id => !isNaN(id) && id > 0);
    } catch (error) {
      logger.warn('Failed to parse admin IDs', { error: error.message });
      return [];
    }
  }

  /**
   * Проверка, является ли пользователь администратором
   */
  isAdmin(userId) {
    return this.adminIds.includes(parseInt(userId));
  }

  /**
   * Получение конфигурации команд бота
   */
  getBotCommands() {
    return [
      {
        command: 'start',
        description: 'Запуск бота и начало работы'
      },
      {
        command: 'help',
        description: 'Помощь и список команд'
      },
      {
        command: 'reading',
        description: 'Создать новое гадание'
      },
      {
        command: 'daily',
        description: 'Карта дня'
      },
      {
        command: 'lunar',
        description: 'Лунный календарь'
      },
      {
        command: 'numerology',
        description: 'Нумерологический анализ'
      },
      {
        command: 'premium',
        description: 'Информация о Premium подписке'
      },
      {
        command: 'profile',
        description: 'Мой профиль'
      },
      {
        command: 'history',
        description: 'История гаданий'
      },
      {
        command: 'settings',
        description: 'Настройки'
      }
    ];
  }

  /**
   * Получение конфигурации WebApp
   */
  getWebAppConfig() {
    return {
      url: process.env.WEBAPP_URL || 'https://mistika.example.com',
      shortName: 'MISTIKA',
      title: 'MISTIKA Tarot',
      description: 'Таро, нумерология и лунный календарь'
    };
  }

  /**
   * Получение настроек уведомлений
   */
  getNotificationSettings() {
    return {
      dailyCard: {
        enabled: process.env.DAILY_NOTIFICATIONS === 'true',
        time: process.env.DAILY_NOTIFICATION_TIME || '09:00',
        timezone: process.env.TIMEZONE || 'Europe/Moscow'
      },
      lunarPhases: {
        enabled: process.env.LUNAR_NOTIFICATIONS === 'true',
        phases: ['new_moon', 'full_moon']
      },
      premium: {
        expiration: {
          enabled: true,
          daysBefore: [7, 3, 1]
        }
      }
    };
  }

  /**
   * Получение лимитов для различных операций
   */
  getLimits() {
    return {
      messageLength: 4096,
      captionLength: 1024,
      buttonsPerRow: 8,
      buttonsPerMessage: 100,
      inlineQueryResults: 50,
      fileUpload: {
        photo: 10 * 1024 * 1024, // 10MB
        document: 50 * 1024 * 1024, // 50MB
        video: 50 * 1024 * 1024, // 50MB
        audio: 50 * 1024 * 1024, // 50MB
        voice: 1024 * 1024 // 1MB
      },
      apiCalls: {
        perSecond: 30,
        perMinute: 20,
        perGroup: 20
      }
    };
  }

  /**
   * Получение настроек клавиатуры
   */
  getKeyboardConfig() {
    return {
      mainMenu: {
        resize_keyboard: true,
        one_time_keyboard: false,
        keyboard: [
          [{ text: '🔮 Новое гадание' }, { text: '📅 Карта дня' }],
          [{ text: '🌙 Лунный календарь' }, { text: '🔢 Нумерология' }],
          [{ text: '👤 Профиль' }, { text: '⚙️ Настройки' }],
          [{ text: '💎 Premium' }, { text: '❓ Помощь' }]
        ]
      },
      spreadTypes: {
        inline_keyboard: [
          [
            { text: '🃏 Одна карта', callback_data: 'spread_one_card' },
            { text: '🃏🃏🃏 Три карты', callback_data: 'spread_three_cards' }
          ],
          [
            { text: '🌟 Кельтский крест', callback_data: 'spread_celtic_cross' },
            { text: '💫 Специальный', callback_data: 'spread_custom' }
          ],
          [{ text: '⬅️ Назад', callback_data: 'back_to_menu' }]
        ]
      },
      premium: {
        inline_keyboard: [
          [
            { text: '📅 Месяц - 299₽', callback_data: 'premium_monthly' },
            { text: '🎯 3 месяца - 799₽', callback_data: 'premium_quarterly' }
          ],
          [
            { text: '⭐ Год - 2999₽', callback_data: 'premium_yearly' },
            { text: '🎁 Пробный период', callback_data: 'premium_trial' }
          ],
          [{ text: '⬅️ Назад', callback_data: 'back_to_menu' }]
        ]
      }
    };
  }

  /**
   * Получение текстов сообщений
   */
  getMessages() {
    return {
      start: {
        new_user: `🔮 Добро пожаловать в MISTIKA!

Я помогу вам раскрыть тайны судьбы с помощью:
• 🃏 Таро гаданий
• 🔢 Нумерологии
• 🌙 Лунного календаря

Нажмите кнопку ниже, чтобы открыть приложение, или выберите действие из меню.`,
        
        returning_user: `🔮 С возвращением в MISTIKA!

Рад видеть вас снова. Что вас интересует сегодня?`
      },
      
      help: `❓ Помощь по использованию MISTIKA

🔮 Основные функции:
• /reading - Создать новое гадание
• /daily - Получить карту дня
• /lunar - Лунный календарь на сегодня
• /numerology - Нумерологический анализ
• /premium - Информация о Premium подписке

👤 Управление профилем:
• /profile - Мой профиль и статистика
• /history - История моих гаданий
• /settings - Настройки уведомлений

💎 Premium возможности:
• Безлимитные гадания
• Эксклюзивные расклады
• Детальная аналитика
• Экспорт гаданий

Если у вас есть вопросы, свяжитесь с поддержкой: @mistika_support`,

      premium: {
        info: `💎 MISTIKA Premium

Откройте все возможности мистического мира:

✨ Что входит в Premium:
• Безлимитные гадания (вместо 3 в день)
• Эксклюзивные расклады Таро
• Детальная нумерология
• Персональный лунный календарь
• История всех гаданий
• Экспорт результатов
• Приоритетная поддержка

🎯 Планы подписки:
• Месяц: 299₽
• 3 месяца: 799₽ (экономия 33%)
• Год: 2999₽ (экономия 50%)

🎁 Бесплатный пробный период 7 дней!`,

        trial_activated: `🎁 Пробный период Premium активирован!

У вас есть 7 дней полного доступа ко всем функциям Premium.
Наслаждайтесь безграничными возможностями MISTIKA!`,

        expired: `💎 Ваша Premium подписка истекла

Продлите подписку, чтобы продолжить пользоваться всеми возможностями MISTIKA.`
      },

      errors: {
        general: '❌ Произошла ошибка. Попробуйте позже.',
        rate_limit: '⏱️ Слишком много запросов. Подождите немного.',
        premium_required: '💎 Эта функция доступна только для Premium пользователей.',
        maintenance: '🔧 Сервис временно недоступен. Ведутся технические работы.'
      }
    };
  }

  /**
   * Получение конфигурации inline клавиатур
   */
  getInlineKeyboards() {
    return {
      webApp: {
        inline_keyboard: [
          [{
            text: '🔮 Открыть MISTIKA',
            web_app: { url: this.getWebAppConfig().url }
          }]
        ]
      },
      
      support: {
        inline_keyboard: [
          [
            { text: '💬 Чат поддержки', url: 'https://t.me/mistika_support' },
            { text: '📚 FAQ', url: 'https://mistika.example.com/faq' }
          ]
        ]
      }
    };
  }

  /**
   * Получение настроек файлов
   */
  getFileConfig() {
    return {
      allowedTypes: {
        images: ['image/jpeg', 'image/png', 'image/webp'],
        documents: ['application/pdf'],
        audio: ['audio/mpeg', 'audio/ogg']
      },
      maxSizes: {
        avatar: 5 * 1024 * 1024, // 5MB
        document: 20 * 1024 * 1024 // 20MB
      },
      uploadPath: process.env.UPLOAD_PATH || './uploads/telegram'
    };
  }

  /**
   * Получение настроек безопасности
   */
  getSecurityConfig() {
    return {
      rateLimiting: {
        windowMs: 60 * 1000, // 1 minute
        maxRequests: 30,
        skipAdmins: true
      },
      antiSpam: {
        enabled: true,
        maxIdenticalMessages: 3,
        timeWindow: 60 * 1000
      },
      blockedUsers: this.parseBlockedUsers(process.env.TELEGRAM_BLOCKED_USERS),
      allowedChats: this.parseAllowedChats(process.env.TELEGRAM_ALLOWED_CHATS)
    };
  }

  /**
   * Парсинг заблокированных пользователей
   */
  parseBlockedUsers(blockedUsersString) {
    if (!blockedUsersString) return [];
    
    try {
      return blockedUsersString
        .split(',')
        .map(id => parseInt(id.trim()))
        .filter(id => !isNaN(id) && id > 0);
    } catch (error) {
      logger.warn('Failed to parse blocked users', { error: error.message });
      return [];
    }
  }

  /**
   * Парсинг разрешенных чатов
   */
  parseAllowedChats(allowedChatsString) {
    if (!allowedChatsString) return [];
    
    try {
      return allowedChatsString
        .split(',')
        .map(id => id.trim())
        .filter(id => id.length > 0);
    } catch (error) {
      logger.warn('Failed to parse allowed chats', { error: error.message });
      return [];
    }
  }

  /**
   * Получение настроек локализации
   */
  getLocalizationConfig() {
    return {
      defaultLanguage: 'ru',
      supportedLanguages: ['ru', 'en'],
      dateFormat: {
        ru: 'dd.MM.yyyy',
        en: 'MM/dd/yyyy'
      },
      timeFormat: {
        ru: 'HH:mm',
        en: 'h:mm a'
      }
    };
  }

  /**
   * Маскирование токена для логов
   */
  maskToken(token) {
    if (!token) return '';
    const parts = token.split(':');
    if (parts.length !== 2) return '***';
    return `${parts[0]}:${'*'.repeat(parts[1].length)}`;
  }

  /**
   * Получение информации о конфигурации для логов
   */
  getConfigInfo() {
    return {
      hasToken: !!this.botToken,
      maskedToken: this.maskToken(this.botToken),
      hasWebhook: !!this.webhookUrl,
      adminsCount: this.adminIds.length,
      environment: process.env.NODE_ENV || 'development'
    };
  }
}

module.exports = new TelegramConfig();