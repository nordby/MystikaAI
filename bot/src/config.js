// bot/src/config.js
require('dotenv').config();

class BotConfig {
  constructor() {
    this.botToken = process.env.TELEGRAM_BOT_TOKEN;
    this.botUsername = process.env.TELEGRAM_BOT_USERNAME || 'mistika_bot';
    this.useWebhook = process.env.TELEGRAM_USE_WEBHOOK === 'true';
    this.webhookUrl = process.env.TELEGRAM_WEBHOOK_URL;
    this.webhookPath = process.env.TELEGRAM_WEBHOOK_PATH || '/webhook/telegram';
    this.webhookPort = parseInt(process.env.TELEGRAM_WEBHOOK_PORT) || 8443;
    this.webhookHost = process.env.TELEGRAM_WEBHOOK_HOST || '0.0.0.0';
    this.webhookSecret = process.env.TELEGRAM_WEBHOOK_SECRET;
    this.webhookCert = process.env.TELEGRAM_WEBHOOK_CERT;
    this.maxConnections = parseInt(process.env.TELEGRAM_MAX_CONNECTIONS) || 40;
    this.adminIds = this.parseAdminIds(process.env.TELEGRAM_ADMIN_IDS);
    this.serverUrl = process.env.SERVER_URL || 'http://localhost:3001';
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

    if (this.useWebhook) {
      if (!this.webhookUrl) {
        errors.push('TELEGRAM_WEBHOOK_URL is required when using webhook');
      } else if (!this.isValidUrl(this.webhookUrl)) {
        errors.push('TELEGRAM_WEBHOOK_URL has invalid format');
      }

      if (this.webhookSecret && this.webhookSecret.length < 8) {
        errors.push('TELEGRAM_WEBHOOK_SECRET must be at least 8 characters');
      }
    }

    if (errors.length > 0) {
      throw new Error(`Bot configuration errors: ${errors.join(', ')}`);
    }

    return true;
  }

  /**
   * Проверка валидности токена бота
   */
  isValidBotToken(token) {
    if (!token || typeof token !== 'string') return false;
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
      console.warn('Failed to parse admin IDs:', error.message);
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
   * Получение полного URL webhook
   */
  getWebhookUrl() {
    if (!this.webhookUrl) return null;
    return `${this.webhookUrl}${this.webhookPath}`;
  }

  /**
   * Получение конфигурации для бота
   */
  getBotOptions() {
    const options = {
      polling: !this.useWebhook
    };

    if (this.useWebhook) {
      options.webHook = {
        port: this.webhookPort,
        host: this.webhookHost
      };
    }

    return options;
  }

  /**
   * Получение команд бота
   */
  getBotCommands() {
    return [
      { command: 'start', description: '🔮 Запуск бота и начало работы' },
      { command: 'help', description: '❓ Помощь и список команд' },
      { command: 'reading', description: '🃏 Создать новое гадание' },
      { command: 'daily', description: '📅 Карта дня' },
      { command: 'lunar', description: '🌙 Лунный календарь' },
      { command: 'numerology', description: '🔢 Нумерологический анализ' },
      { command: 'premium', description: '💎 Информация о Premium' },
      { command: 'profile', description: '👤 Мой профиль' },
      { command: 'history', description: '📋 История гаданий' },
      { command: 'settings', description: '⚙️ Настройки' }
    ];
  }

  /**
   * Получение текстов сообщений
   */
  getMessages() {
    return {
      start: {
        new_user: `🔮 *Добро пожаловать в MISTIKA!*

Я помогу вам раскрыть тайны судьбы с помощью:
• 🃏 Таро гаданий
• 🔢 Нумерологии  
• 🌙 Лунного календаря

Выберите действие из меню ниже или нажмите на кнопку для открытия приложения.`,

        returning_user: `✨ Ты вернулся — и это не случайность.
        
Карты Таро уже дрогнули, чувствуя твое присутствие…
Спроси — и скрытое станет явным.`
      },

      help: `❓ <b>Помощь по использованию MISTIKA</b>

🔮 <b>Основные функции:</b>
• /reading - Создать новое гадание
• /daily - Получить карту дня
• /lunar - Лунный календарь на сегодня
• /numerology - Нумерологический анализ
• /premium - Информация о Premium подписке

👤 <b>Управление профилем:</b>
• /profile - Мой профиль и статистика
• /history - История моих гаданий
• /settings - Настройки уведомлений

💎 <b>Premium возможности:</b>
• Безлимитные гадания
• Эксклюзивные расклады
• Детальная аналитика
• Экспорт гаданий

Если у вас есть вопросы, свяжитесь с поддержкой: @mistika_support`,

      errors: {
        general: '❌ Произошла ошибка. Попробуйте позже.',
        rate_limit: '⏱️ Слишком много запросов. Подождите немного.',
        premium_required: '💎 Эта функция доступна только для Premium пользователей.',
        maintenance: '🔧 Сервис временно недоступен. Ведутся технические работы.'
      }
    };
  }

  /**
   * Получение настроек клавиатуры
   */
  getKeyboards() {
    return {
      mainMenu: {
        keyboard: [
          [{ text: '🔮 Новое гадание' }, { text: '📅 Карта дня' }],
          [{ text: '🌙 Лунный календарь' }, { text: '🔢 Нумерология' }],
          [{ text: '👤 Профиль' }, { text: '⚙️ Настройки' }],
          [{ text: '💎 Premium' }, { text: '❓ Помощь' }]
        ],
        resize_keyboard: true,
        one_time_keyboard: false
      },

      webApp: {
        inline_keyboard: [
          [{
            text: '🔮 Открыть MISTIKA',
            web_app: { url: process.env.WEBAPP_URL || 'https://mistika.com' }
          }]
        ]
      },

      premium: {
        inline_keyboard: [
          [
            { text: '📅 Месяц - 299₽', callback_data: 'premium_monthly' },
            { text: '🎯 3 месяца - 799₽', callback_data: 'premium_quarterly' }
          ],
          [
            { text: '⭐ Год - 2999₽', callback_data: 'premium_menu' },
            { text: '🎁 Пробный период', callback_data: 'premium_trial' }
          ],
          [{ text: '⬅️ Назад', callback_data: 'back_to_menu' }]
        ]
      }
    };
  }

  /**
   * Получение настроек безопасности
   */
  getSecurityConfig() {
    return {
      rateLimiting: {
        windowMs: 60 * 1000, // 1 минута
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
      console.warn('Failed to parse blocked users:', error.message);
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
      console.warn('Failed to parse allowed chats:', error.message);
      return [];
    }
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
   * Получение информации о конфигурации
   */
  getConfigInfo() {
    return {
      hasToken: !!this.botToken,
      maskedToken: this.maskToken(this.botToken),
      username: this.botUsername,
      useWebhook: this.useWebhook,
      webhookUrl: this.webhookUrl ? this.maskUrl(this.webhookUrl) : null,
      adminsCount: this.adminIds.length,
      environment: process.env.NODE_ENV || 'development'
    };
  }

  /**
   * Маскирование URL
   */
  maskUrl(url) {
    if (!url) return '';
    try {
      const urlObj = new URL(url);
      return `${urlObj.protocol}//${urlObj.hostname}:***${urlObj.pathname}`;
    } catch {
      return '***';
    }
  }
}

module.exports = new BotConfig();