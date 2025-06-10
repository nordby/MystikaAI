// bot/src/bot.js
const TelegramBot = require('node-telegram-bot-api');
const logger = require('./utils/logger');
const rateLimiter = require('./middleware/rateLimiter');
const errorHandler = require('./middleware/errorHandler');
const userMiddleware = require('./middleware/user');
const analyticsMiddleware = require('./middleware/analytics');
const authMiddleware = require('./middleware/auth');

class MistikaTelegramBot extends TelegramBot {
  constructor(token, options = {}) {
    super(token, options);
    
    this.middlewares = [];
    this.setupDefaultMiddlewares();
    this.setupErrorHandling();
  }

  setupDefaultMiddlewares() {
    this.use(errorHandler.wrap);
    this.use(rateLimiter.check);
    this.use(authMiddleware.authenticate);
    this.use(userMiddleware.loadUser);
    this.use(analyticsMiddleware.track);
  }

  setupErrorHandling() {
    this.on('polling_error', (error) => {
      logger.error('Telegram polling error', {
        error: error.message,
        code: error.code,
        stack: error.stack
      });
    });

    this.on('webhook_error', (error) => {
      logger.error('Telegram webhook error', {
        error: error.message,
        code: error.code,
        stack: error.stack
      });
    });
  }

  use(middleware) {
    this.middlewares.push(middleware);
  }

  async processMessage(msg, type = 'message') {
    try {
      const context = {
        bot: this,
        message: msg,
        type,
        user: null,
        chat: msg.chat,
        from: msg.from,
        date: new Date(msg.date * 1000),
        processed: false,
        data: {}
      };

      for (const middleware of this.middlewares) {
        try {
          await middleware(context);
          
          if (context.processed) {
            break;
          }
        } catch (middlewareError) {
          logger.error('Middleware error', {
            error: middlewareError.message,
            middleware: middleware.name,
            messageId: msg.message_id,
            userId: msg.from?.id
          });
          
          continue;
        }
      }

      return context;
    } catch (error) {
      logger.error('Error processing message', {
        error: error.message,
        messageId: msg.message_id,
        userId: msg.from?.id
      });
      throw error;
    }
  }

  async sendMessage(chatId, text, options = {}) {
    try {
      logger.debug('Sending message', {
        chatId,
        textLength: text.length,
        hasKeyboard: !!(options.reply_markup)
      });

      if (text.length > 4096) {
        logger.warn('Message too long, truncating', {
          chatId,
          originalLength: text.length
        });
        text = text.substring(0, 4090) + '...';
      }

      if (!options.parse_mode) {
        options.parse_mode = 'Markdown';
      }

      const result = await super.sendMessage(chatId, text, options);
      
      logger.debug('Message sent successfully', {
        chatId,
        messageId: result.message_id
      });

      return result;
    } catch (error) {
      logger.error('Failed to send message', {
        error: error.message,
        chatId,
        errorCode: error.code
      });

      if (error.code === 400 && error.message.includes('parse')) {
        try {
          logger.info('Retrying without parse_mode', { chatId });
          delete options.parse_mode;
          return await super.sendMessage(chatId, text, options);
        } catch (retryError) {
          logger.error('Retry also failed', {
            error: retryError.message,
            chatId
          });
          throw retryError;
        }
      }

      throw error;
    }
  }

  async sendNotification(chatId, notification) {
    try {
      const { type, title, message, data = {} } = notification;

      let result;
      
      switch (type) {
        case 'daily_card':
          result = await this.sendDailyCardNotification(chatId, title, message, data);
          break;
        case 'lunar_phase':
          result = await this.sendLunarPhaseNotification(chatId, title, message, data);
          break;
        case 'premium_expiring':
          result = await this.sendPremiumExpiringNotification(chatId, title, message, data);
          break;
        default:
          result = await this.sendMessage(chatId, `*${title}*\n\n${message}`);
      }

      logger.info('Notification sent', {
        chatId,
        type,
        messageId: result.message_id
      });

      return result;
    } catch (error) {
      logger.error('Failed to send notification', {
        error: error.message,
        chatId,
        notificationType: notification.type
      });
      throw error;
    }
  }

  async sendDailyCardNotification(chatId, title, message, data) {
    const keyboard = {
      inline_keyboard: [
        [{ text: '🔮 Подробнее', callback_data: `daily_details_${data.cardId}` }],
        [{ text: '🃏 Новое гадание', callback_data: 'new_reading' }]
      ]
    };

    return await this.sendMessage(chatId, `🌅 *${title}*\n\n${message}`, {
      reply_markup: keyboard
    });
  }

  async sendLunarPhaseNotification(chatId, title, message, data) {
    const keyboard = {
      inline_keyboard: [
        [{ text: '🌙 Лунный календарь', callback_data: 'lunar_calendar' }],
        [{ text: '🔮 Гадание по фазе', callback_data: `lunar_reading_${data.phase}` }]
      ]
    };

    return await this.sendMessage(chatId, `🌙 *${title}*\n\n${message}`, {
      reply_markup: keyboard
    });
  }

  async sendPremiumExpiringNotification(chatId, title, message, data) {
    const keyboard = {
      inline_keyboard: [
        [{ text: '💎 Продлить Premium', callback_data: 'extend_premium' }],
        [{ text: '💳 Изменить план', callback_data: 'change_plan' }]
      ]
    };

    return await this.sendMessage(chatId, `💎 *${title}*\n\n${message}`, {
      reply_markup: keyboard
    });
  }

  getMetrics() {
    return {
      middlewares: this.middlewares.length,
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = MistikaTelegramBot;