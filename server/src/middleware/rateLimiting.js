// server/src/middleware/rateLimiting.js
const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');
const redis = require('redis');
const logger = require('../utils/logger');

class RateLimitingMiddleware {
  constructor() {
    this.redisClient = null;
    this.initRedis();
  }

  /**
   * Инициализация Redis клиента
   */
  async initRedis() {
    try {
      if (process.env.REDIS_URL) {
        this.redisClient = redis.createClient({
          url: process.env.REDIS_URL,
          socket: {
            connectTimeout: 60000,
            commandTimeout: 5000,
            reconnectDelay: 100
          },
          retry_delay_on_failure: 100
        });

        this.redisClient.on('error', (err) => {
          logger.error('Redis rate limiting error', { error: err.message });
        });

        this.redisClient.on('connect', () => {
          logger.info('Redis connected for rate limiting');
        });

        await this.redisClient.connect();
      }
    } catch (error) {
      logger.warn('Redis not available for rate limiting, using memory store', {
        error: error.message
      });
      this.redisClient = null;
    }
  }

  /**
   * Создание лимитера с настройками
   */
  createLimiter(options = {}) {
    const defaultOptions = {
      windowMs: 15 * 60 * 1000, // 15 минут
      max: 100, // максимум запросов за окно
      message: {
        success: false,
        message: 'Слишком много запросов. Попробуйте позже.',
        retryAfter: Math.ceil(options.windowMs / 1000) || 900
      },
      standardHeaders: true,
      legacyHeaders: false,
      skip: (req) => {
        // Пропускаем лимиты для внутренних запросов
        return req.ip === '127.0.0.1' || req.ip === '::1';
      },
      keyGenerator: (req) => {
        // Генерируем ключ на основе IP и пользователя
        const baseKey = req.ip;
        const userKey = req.user?.id || req.headers['x-user-id'] || '';
        return `${baseKey}:${userKey}`;
      },
      handler: (req, res) => {
        logger.warn('Rate limit exceeded', {
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          url: req.url,
          method: req.method,
          userId: req.user?.id
        });

        res.status(429).json(options.message || {
          success: false,
          message: 'Слишком много запросов. Попробуйте позже.',
          retryAfter: Math.ceil(options.windowMs / 1000) || 900
        });
      },
      ...options
    };

    // Используем Redis store если доступен
    if (this.redisClient && this.redisClient.isReady) {
      defaultOptions.store = new RedisStore({
        client: this.redisClient,
        prefix: 'rl:mistika:'
      });
    }

    return rateLimit(defaultOptions);
  }

  /**
   * Лимиты для API авторизации
   */
  authLimiter() {
    return this.createLimiter({
      windowMs: 15 * 60 * 1000, // 15 минут
      max: 10, // 10 попыток авторизации
      message: {
        success: false,
        message: 'Слишком много попыток авторизации. Попробуйте через 15 минут.',
        retryAfter: 900
      },
      skipSuccessfulRequests: true
    });
  }

  /**
   * Строгие лимиты для критических операций
   */
  strictLimiter() {
    return this.createLimiter({
      windowMs: 60 * 60 * 1000, // 1 час
      max: 5, // 5 попыток в час
      message: {
        success: false,
        message: 'Слишком много попыток выполнения данной операции. Попробуйте через час.',
        retryAfter: 3600
      }
    });
  }

  /**
   * Лимиты для AI запросов
   */
  aiLimiter() {
    return this.createLimiter({
      windowMs: 60 * 60 * 1000, // 1 час
      max: (req) => {
        // Различные лимиты для разных типов пользователей
        if (req.user?.isPremium) return 100;
        if (req.user?.isVip) return 500;
        return 10; // Бесплатные пользователи
      },
      message: {
        success: false,
        message: 'Достигнут лимит AI запросов. Оформите Premium для увеличения лимитов.',
        retryAfter: 3600
      },
      keyGenerator: (req) => {
        return req.user?.id || req.ip;
      }
    });
  }

  /**
   * Лимиты для гаданий
   */
  readingLimiter() {
    return this.createLimiter({
      windowMs: 24 * 60 * 60 * 1000, // 24 часа
      max: (req) => {
        if (req.user?.isPremium) return 1000; // Безлимит для премиум
        if (req.user?.isVip) return 2000;
        return 3; // 3 гадания в день для бесплатных
      },
      message: {
        success: false,
        message: 'Достигнут дневной лимит гаданий. Оформите Premium для безлимитного доступа.',
        retryAfter: 86400
      },
      keyGenerator: (req) => {
        return req.user?.id || req.ip;
      }
    });
  }

  /**
   * Лимиты для загрузки файлов
   */
  uploadLimiter() {
    return this.createLimiter({
      windowMs: 60 * 60 * 1000, // 1 час
      max: 20, // 20 загрузок в час
      message: {
        success: false,
        message: 'Слишком много загрузок файлов. Попробуйте позже.',
        retryAfter: 3600
      }
    });
  }

  /**
   * Лимиты для поиска
   */
  searchLimiter() {
    return this.createLimiter({
      windowMs: 60 * 1000, // 1 минута
      max: 30, // 30 поисковых запросов в минуту
      message: {
        success: false,
        message: 'Слишком много поисковых запросов. Подождите минуту.',
        retryAfter: 60
      }
    });
  }

  /**
   * Лимиты для отправки сообщений/email
   */
  messagingLimiter() {
    return this.createLimiter({
      windowMs: 60 * 60 * 1000, // 1 час
      max: 10, // 10 сообщений в час
      message: {
        success: false,
        message: 'Достигнут лимит отправки сообщений. Попробуйте через час.',
        retryAfter: 3600
      }
    });
  }

  /**
   * Лимиты для экспорта данных
   */
  exportLimiter() {
    return this.createLimiter({
      windowMs: 24 * 60 * 60 * 1000, // 24 часа
      max: 3, // 3 экспорта в день
      message: {
        success: false,
        message: 'Достигнут дневной лимит экспорта данных.',
        retryAfter: 86400
      }
    });
  }

  /**
   * Прогрессивные лимиты (увеличиваются со временем)
   */
  progressiveLimiter() {
    return this.createLimiter({
      windowMs: 15 * 60 * 1000, // 15 минут
      max: (req) => {
        const userRegistrationDate = req.user?.createdAt;
        if (!userRegistrationDate) return 10;

        const daysSinceRegistration = Math.floor(
          (Date.now() - new Date(userRegistrationDate).getTime()) / (1000 * 60 * 60 * 24)
        );

        // Увеличиваем лимит на 5 запросов каждые 30 дней
        return 10 + Math.floor(daysSinceRegistration / 30) * 5;
      },
      keyGenerator: (req) => {
        return req.user?.id || req.ip;
      }
    });
  }

  /**
   * Динамические лимиты на основе нагрузки системы
   */
  adaptiveLimiter() {
    return this.createLimiter({
      windowMs: 60 * 1000, // 1 минута
      max: (req) => {
        // Простая логика адаптации (в продакшене можно использовать метрики системы)
        const currentHour = new Date().getHours();
        const isBusinessHours = currentHour >= 9 && currentHour <= 18;
        
        let baseLimit = 60;
        
        // Уменьшаем лимиты в час пик
        if (isBusinessHours) {
          baseLimit *= 0.7;
        }
        
        // Увеличиваем для премиум пользователей
        if (req.user?.isPremium) {
          baseLimit *= 2;
        }
        
        return Math.floor(baseLimit);
      }
    });
  }

  /**
   * Лимиты для webhook'ов (более мягкие)
   */
  webhookLimiter() {
    return this.createLimiter({
      windowMs: 60 * 1000, // 1 минута
      max: 1000, // Высокий лимит для webhook'ов
      message: {
        success: false,
        message: 'Webhook rate limit exceeded',
        retryAfter: 60
      },
      keyGenerator: (req) => {
        // Используем заголовок или IP для идентификации источника webhook'а
        return req.headers['x-webhook-source'] || req.ip;
      }
    });
  }

  /**
   * Middleware для сброса лимитов для определенных пользователей
   */
  resetLimitsMiddleware() {
    return async (req, res, next) => {
      try {
        // Админы и VIP пользователи могут иметь особые привилегии
        if (req.user?.role === 'admin' || req.user?.isVip) {
          // Можно добавить логику сброса или обхода лимитов
          req.skipRateLimit = true;
        }
        next();
      } catch (error) {
        logger.error('Error in reset limits middleware', {
          error: error.message
        });
        next();
      }
    };
  }

  /**
   * Middleware для логирования превышений лимитов
   */
  rateLimitLogger() {
    return (req, res, next) => {
      const originalSend = res.send;
      
      res.send = function(data) {
        if (res.statusCode === 429) {
          logger.warn('Rate limit exceeded - detailed log', {
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            url: req.url,
            method: req.method,
            userId: req.user?.id,
            headers: {
              'x-forwarded-for': req.headers['x-forwarded-for'],
              'x-real-ip': req.headers['x-real-ip']
            },
            timestamp: new Date().toISOString()
          });
        }
        originalSend.call(this, data);
      };
      
      next();
    };
  }

  /**
   * Глобальные лимиты для всего API
   */
  globalLimiter() {
    return this.createLimiter({
      windowMs: 15 * 60 * 1000, // 15 минут
      max: 1000, // 1000 запросов на IP
      message: {
        success: false,
        message: 'Слишком много запросов с вашего IP адреса.',
        retryAfter: 900
      }
    });
  }

  /**
   * Получение статистики по лимитам
   */
  async getLimitStats(key) {
    if (!this.redisClient || !this.redisClient.isReady) {
      return null;
    }

    try {
      const stats = await this.redisClient.get(`rl:mistika:${key}`);
      return stats ? JSON.parse(stats) : null;
    } catch (error) {
      logger.error('Error getting limit stats', {
        error: error.message,
        key
      });
      return null;
    }
  }

  /**
   * Ручной сброс лимитов для пользователя
   */
  async resetUserLimits(userId) {
    if (!this.redisClient || !this.redisClient.isReady) {
      return false;
    }

    try {
      const pattern = `rl:mistika:*:${userId}`;
      const keys = await this.redisClient.keys(pattern);
      
      if (keys.length > 0) {
        await this.redisClient.del(keys);
        logger.info('User rate limits reset', { userId, keysCleared: keys.length });
        return true;
      }
      
      return false;
    } catch (error) {
      logger.error('Error resetting user limits', {
        error: error.message,
        userId
      });
      return false;
    }
  }

  /**
   * Получение информации о текущих лимитах пользователя
   */
  async getUserLimitInfo(userId, limitType = 'general') {
    const key = `${userId}:${limitType}`;
    const stats = await this.getLimitStats(key);
    
    if (!stats) {
      return {
        remaining: 'unknown',
        resetTime: null,
        total: 'unknown'
      };
    }

    return {
      remaining: stats.remaining,
      resetTime: stats.resetTime,
      total: stats.total,
      used: stats.total - stats.remaining
    };
  }
}

module.exports = new RateLimitingMiddleware();