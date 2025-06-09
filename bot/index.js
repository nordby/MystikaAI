// bot/index.js
const TelegramBot = require('./src/bot');
const config = require('./src/config');
const logger = require('./src/utils/logger');
const database = require('./src/database');
const handlers = require('./src/handlers');

class MistikaTelegramBot {
  constructor() {
    this.bot = null;
    this.isRunning = false;
    this.config = config;
  }

  /**
   * Инициализация бота
   */
  async initialize() {
    try {
      logger.info('Initializing MISTIKA Telegram Bot...');

      // Валидация конфигурации
      this.config.validate();

      // Инициализация базы данных
      await database.initialize();

      // Очистка webhook если используется polling
      if (!this.config.useWebhook) {
        const tempBot = new TelegramBot(this.config.botToken);
        await tempBot.deleteWebHook();
      }

      // Создание экземпляра бота
      this.bot = new TelegramBot(this.config.botToken, {
        polling: !this.config.useWebhook ? {
          interval: 2000,
          autoStart: false,
          params: {
            timeout: 10
          }
        } : false,
        webhook: this.config.useWebhook ? {
          port: this.config.webhookPort,
          host: this.config.webhookHost
        } : false
      });

      // Настройка обработчиков
      await this.setupHandlers();

      // Настройка webhook если используется
      if (this.config.useWebhook) {
        await this.setupWebhook();
      }

      // Установка команд бота
      await this.setupBotCommands();

      logger.info('MISTIKA Telegram Bot initialized successfully', {
        mode: this.config.useWebhook ? 'webhook' : 'polling',
        botUsername: this.config.botUsername
      });

      return true;
    } catch (error) {
      logger.error('Failed to initialize bot', { error: error.message });
      throw error;
    }
  }

  /**
   * Настройка обработчиков событий
   */
  async setupHandlers() {
    try {
      // Регистрация всех обработчиков
      handlers.registerAll(this.bot);

      // Обработка ошибок
      this.bot.on('error', (error) => {
        logger.error('Bot error', { error: error.message, stack: error.stack });
      });

      // Обработка отключения
      this.bot.on('disconnected', () => {
        logger.warn('Bot disconnected');
        this.isRunning = false;
      });

      // Обработка подключения
      this.bot.on('connected', () => {
        logger.info('Bot connected');
        this.isRunning = true;
      });

      logger.info('Bot handlers setup completed');
    } catch (error) {
      logger.error('Failed to setup handlers', { error: error.message });
      throw error;
    }
  }

  /**
   * Настройка webhook
   */
  async setupWebhook() {
    try {
      if (!this.config.webhookUrl) {
        throw new Error('Webhook URL is required for webhook mode');
      }

      const webhookOptions = {
        url: this.config.webhookUrl,
        certificate: this.config.webhookCert,
        max_connections: this.config.maxConnections || 40,
        allowed_updates: ['message', 'callback_query', 'inline_query', 'pre_checkout_query']
      };

      if (this.config.webhookSecret) {
        webhookOptions.secret_token = this.config.webhookSecret;
      }

      await this.bot.setWebHook(this.config.webhookUrl, webhookOptions);
      
      logger.info('Webhook setup completed', {
        url: this.config.webhookUrl,
        maxConnections: webhookOptions.max_connections
      });
    } catch (error) {
      logger.error('Failed to setup webhook', { error: error.message });
      throw error;
    }
  }

  /**
   * Установка команд бота
   */
  async setupBotCommands() {
    try {
      const commands = [
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

      await this.bot.setMyCommands(commands);
      logger.info('Bot commands setup completed', { commandsCount: commands.length });
    } catch (error) {
      logger.error('Failed to setup bot commands', { error: error.message });
      throw error;
    }
  }

  /**
   * Запуск бота
   */
  async start() {
    try {
      if (this.isRunning) {
        logger.warn('Bot is already running');
        return;
      }

      if (!this.bot) {
        await this.initialize();
      }

      if (this.config.useWebhook) {
        // В режиме webhook бот уже запущен при инициализации
        this.isRunning = true;
        logger.info('Bot started in webhook mode');
      } else {
        // Добавляем задержку перед запуском polling
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Запуск polling
        await this.bot.startPolling();
        this.isRunning = true;
        logger.info('Bot started in polling mode');
      }

      // Уведомление администраторов о запуске
      await this.notifyAdmins('🤖 MISTIKA Bot запущен и готов к работе!');

    } catch (error) {
      logger.error('Failed to start bot', { error: error.message });
      throw error;
    }
  }

  /**
   * Остановка бота
   */
  async stop() {
    try {
      if (!this.isRunning) {
        logger.warn('Bot is not running');
        return;
      }

      // Уведомление администраторов об остановке
      await this.notifyAdmins('🔴 MISTIKA Bot останавливается...');

      if (this.config.useWebhook) {
        // Удаление webhook
        await this.bot.deleteWebHook();
      } else {
        // Остановка polling
        await this.bot.stopPolling();
      }

      this.isRunning = false;
      logger.info('Bot stopped successfully');
    } catch (error) {
      logger.error('Failed to stop bot', { error: error.message });
      throw error;
    }
  }

  /**
   * Перезапуск бота
   */
  async restart() {
    try {
      logger.info('Restarting bot...');
      await this.stop();
      await this.start();
      logger.info('Bot restarted successfully');
    } catch (error) {
      logger.error('Failed to restart bot', { error: error.message });
      throw error;
    }
  }

  /**
   * Отправка уведомления администраторам
   */
  async notifyAdmins(message, options = {}) {
    try {
      const adminIds = this.config.adminIds;
      if (!adminIds || adminIds.length === 0) {
        return;
      }

      const promises = adminIds.map(async (adminId) => {
        try {
          await this.bot.sendMessage(adminId, message, options);
        } catch (error) {
          logger.warn('Failed to notify admin', { adminId, error: error.message });
        }
      });

      await Promise.allSettled(promises);
    } catch (error) {
      logger.error('Failed to notify admins', { error: error.message });
    }
  }

  /**
   * Получение информации о боте
   */
  async getBotInfo() {
    try {
      if (!this.bot) {
        return null;
      }

      const info = await this.bot.getMe();
      const webhookInfo = this.config.useWebhook ? await this.bot.getWebHookInfo() : null;

      return {
        ...info,
        isRunning: this.isRunning,
        mode: this.config.useWebhook ? 'webhook' : 'polling',
        webhook: webhookInfo,
        config: {
          adminIds: this.config.adminIds,
          useWebhook: this.config.useWebhook,
          environment: process.env.NODE_ENV
        }
      };
    } catch (error) {
      logger.error('Failed to get bot info', { error: error.message });
      return null;
    }
  }

  /**
   * Проверка здоровья бота
   */
  async healthCheck() {
    try {
      if (!this.bot || !this.isRunning) {
        return {
          healthy: false,
          status: 'Bot not running',
          timestamp: new Date().toISOString()
        };
      }

      // Проверяем подключение к Telegram API
      const me = await this.bot.getMe();
      
      if (!me) {
        return {
          healthy: false,
          status: 'Cannot connect to Telegram API',
          timestamp: new Date().toISOString()
        };
      }

      // Проверяем базу данных
      const dbHealth = await database.healthCheck();
      
      return {
        healthy: true,
        status: 'All systems operational',
        bot: {
          id: me.id,
          username: me.username,
          firstName: me.first_name
        },
        database: dbHealth,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Health check failed', { error: error.message });
      return {
        healthy: false,
        status: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Получение статистики бота
   */
  async getStats() {
    try {
      const stats = await database.getBotStats();
      return {
        ...stats,
        isRunning: this.isRunning,
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Failed to get bot stats', { error: error.message });
      return null;
    }
  }
}

// Создание экземпляра бота
const mistikaBotInstance = new MistikaTelegramBot();

// Обработка graceful shutdown
process.on('SIGINT', async () => {
  logger.info('Received SIGINT, shutting down gracefully...');
  await mistikaBotInstance.stop();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('Received SIGTERM, shutting down gracefully...');
  await mistikaBotInstance.stop();
  process.exit(0);
});

// Обработка необработанных ошибок
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection', { reason, promise });
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception', { error: error.message, stack: error.stack });
  process.exit(1);
});

module.exports = mistikaBotInstance;

// Автозапуск если файл запущен напрямую
if (require.main === module) {
  mistikaBotInstance.start().catch((error) => {
    logger.error('Failed to start bot', { error: error.message });
    process.exit(1);
  });
}