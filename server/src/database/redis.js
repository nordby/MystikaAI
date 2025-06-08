// server/src/database/redis.js
const redisConfig = require('../config/redis');
const logger = require('../utils/logger');
const helpers = require('../utils/helpers');

class RedisDatabase {
  constructor() {
    this.isInitialized = false;
    this.keyPrefixes = {
      session: 'session:',
      user: 'user:',
      reading: 'reading:',
      cache: 'cache:',
      rateLimit: 'rate_limit:',
      notification: 'notification:',
      subscription: 'subscription:',
      analytics: 'analytics:',
      queue: 'queue:',
      lock: 'lock:'
    };
    this.defaultTTL = {
      session: 24 * 60 * 60, // 24 часа
      cache: 60 * 60, // 1 час
      rateLimit: 60 * 60, // 1 час
      notification: 7 * 24 * 60 * 60, // 7 дней
      lock: 30, // 30 секунд
      temporary: 15 * 60 // 15 минут
    };
  }

  /**
   * Инициализация Redis базы данных
   */
  async initialize() {
    try {
      if (this.isInitialized) {
        return true;
      }

      const isConnected = await redisConfig.initialize();
      if (!isConnected) {
        throw new Error('Failed to connect to Redis');
      }

      // Проверка подключения
      const pingResult = await redisConfig.ping();
      if (!pingResult) {
        throw new Error('Redis ping failed');
      }

      this.isInitialized = true;
      logger.info('Redis database initialized successfully');
      return true;

    } catch (error) {
      logger.error('Redis database initialization failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Генерация ключа с префиксом
   */
  generateKey(prefix, identifier) {
    if (!this.keyPrefixes[prefix]) {
      throw new Error(`Unknown key prefix: ${prefix}`);
    }
    return `${this.keyPrefixes[prefix]}${identifier}`;
  }

  /**
   * Работа с сессиями пользователей
   */
  async setUserSession(userId, sessionData, ttl = null) {
    try {
      const key = this.generateKey('session', userId);
      const expiry = ttl || this.defaultTTL.session;
      
      const enrichedData = {
        ...sessionData,
        createdAt: new Date().toISOString(),
        lastActivity: new Date().toISOString(),
        ipAddress: sessionData.ipAddress || null,
        userAgent: sessionData.userAgent || null
      };

      return await redisConfig.set(key, enrichedData, expiry);
    } catch (error) {
      logger.error('Error setting user session', { error: error.message, userId });
      return false;
    }
  }

  async getUserSession(userId) {
    try {
      const key = this.generateKey('session', userId);
      const session = await redisConfig.get(key);
      
      if (session) {
        // Обновляем время последней активности
        session.lastActivity = new Date().toISOString();
        await redisConfig.set(key, session, this.defaultTTL.session);
      }
      
      return session;
    } catch (error) {
      logger.error('Error getting user session', { error: error.message, userId });
      return null;
    }
  }

  async deleteUserSession(userId) {
    try {
      const key = this.generateKey('session', userId);
      return await redisConfig.del(key);
    } catch (error) {
      logger.error('Error deleting user session', { error: error.message, userId });
      return false;
    }
  }

  /**
   * Кэширование данных пользователя
   */
  async setUserCache(userId, dataType, data, ttl = null) {
    try {
      const key = this.generateKey('user', `${userId}:${dataType}`);
      const expiry = ttl || this.defaultTTL.cache;
      
      const cacheData = {
        data,
        cachedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + expiry * 1000).toISOString()
      };

      return await redisConfig.set(key, cacheData, expiry);
    } catch (error) {
      logger.error('Error setting user cache', { error: error.message, userId, dataType });
      return false;
    }
  }

  async getUserCache(userId, dataType) {
    try {
      const key = this.generateKey('user', `${userId}:${dataType}`);
      const cached = await redisConfig.get(key);
      
      if (cached) {
        return cached.data;
      }
      
      return null;
    } catch (error) {
      logger.error('Error getting user cache', { error: error.message, userId, dataType });
      return null;
    }
  }

  async invalidateUserCache(userId, dataType = null) {
    try {
      if (dataType) {
        const key = this.generateKey('user', `${userId}:${dataType}`);
        return await redisConfig.del(key);
      } else {
        // Удаляем весь кэш пользователя
        const pattern = this.generateKey('user', `${userId}:*`);
        const keys = await redisConfig.keys(pattern);
        
        if (keys.length > 0) {
          const client = redisConfig.getClient();
          return await client.del(keys);
        }
        
        return 0;
      }
    } catch (error) {
      logger.error('Error invalidating user cache', { error: error.message, userId, dataType });
      return false;
    }
  }

  /**
   * Кэширование результатов гаданий
   */
  async cacheReading(readingId, readingData, ttl = null) {
    try {
      const key = this.generateKey('reading', readingId);
      const expiry = ttl || this.defaultTTL.cache;
      
      const cacheData = {
        ...readingData,
        cachedAt: new Date().toISOString()
      };

      return await redisConfig.set(key, cacheData, expiry);
    } catch (error) {
      logger.error('Error caching reading', { error: error.message, readingId });
      return false;
    }
  }

  async getCachedReading(readingId) {
    try {
      const key = this.generateKey('reading', readingId);
      return await redisConfig.get(key);
    } catch (error) {
      logger.error('Error getting cached reading', { error: error.message, readingId });
      return null;
    }
  }

  /**
   * Общее кэширование
   */
  async setCache(cacheKey, data, ttl = null) {
    try {
      const key = this.generateKey('cache', cacheKey);
      const expiry = ttl || this.defaultTTL.cache;
      
      const cacheData = {
        data,
        cachedAt: new Date().toISOString(),
        ttl: expiry
      };

      return await redisConfig.set(key, cacheData, expiry);
    } catch (error) {
      logger.error('Error setting cache', { error: error.message, cacheKey });
      return false;
    }
  }

  async getCache(cacheKey) {
    try {
      const key = this.generateKey('cache', cacheKey);
      const cached = await redisConfig.get(key);
      
      if (cached) {
        return cached.data;
      }
      
      return null;
    } catch (error) {
      logger.error('Error getting cache', { error: error.message, cacheKey });
      return null;
    }
  }

  async deleteCache(cacheKey) {
    try {
      const key = this.generateKey('cache', cacheKey);
      return await redisConfig.del(key);
    } catch (error) {
      logger.error('Error deleting cache', { error: error.message, cacheKey });
      return false;
    }
  }

  /**
   * Rate limiting
   */
  async checkRateLimit(identifier, maxRequests, windowSeconds) {
    try {
      const key = this.generateKey('rateLimit', identifier);
      const current = await redisConfig.get(key);
      
      if (!current) {
        // Первый запрос в окне
        await redisConfig.set(key, { count: 1, resetAt: Date.now() + windowSeconds * 1000 }, windowSeconds);
        return { allowed: true, remaining: maxRequests - 1, resetAt: Date.now() + windowSeconds * 1000 };
      }
      
      if (current.count >= maxRequests) {
        return { allowed: false, remaining: 0, resetAt: current.resetAt };
      }
      
      // Увеличиваем счетчик
      current.count++;
      await redisConfig.set(key, current, Math.ceil((current.resetAt - Date.now()) / 1000));
      
      return { 
        allowed: true, 
        remaining: maxRequests - current.count, 
        resetAt: current.resetAt 
      };
    } catch (error) {
      logger.error('Error checking rate limit', { error: error.message, identifier });
      // В случае ошибки разрешаем запрос
      return { allowed: true, remaining: maxRequests - 1, resetAt: Date.now() + windowSeconds * 1000 };
    }
  }

  async resetRateLimit(identifier) {
    try {
      const key = this.generateKey('rateLimit', identifier);
      return await redisConfig.del(key);
    } catch (error) {
      logger.error('Error resetting rate limit', { error: error.message, identifier });
      return false;
    }
  }

  /**
   * Уведомления
   */
  async setNotification(userId, notificationId, data, ttl = null) {
    try {
      const key = this.generateKey('notification', `${userId}:${notificationId}`);
      const expiry = ttl || this.defaultTTL.notification;
      
      const notification = {
        id: notificationId,
        userId,
        ...data,
        createdAt: new Date().toISOString(),
        read: false
      };

      return await redisConfig.set(key, notification, expiry);
    } catch (error) {
      logger.error('Error setting notification', { error: error.message, userId, notificationId });
      return false;
    }
  }

  async getUserNotifications(userId) {
    try {
      const pattern = this.generateKey('notification', `${userId}:*`);
      const keys = await redisConfig.keys(pattern);
      
      if (keys.length === 0) {
        return [];
      }
      
      const notifications = [];
      for (const key of keys) {
        const notification = await redisConfig.get(key);
        if (notification) {
          notifications.push(notification);
        }
      }
      
      // Сортируем по дате создания (новые сначала)
      return notifications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } catch (error) {
      logger.error('Error getting user notifications', { error: error.message, userId });
      return [];
    }
  }

  async markNotificationRead(userId, notificationId) {
    try {
      const key = this.generateKey('notification', `${userId}:${notificationId}`);
      const notification = await redisConfig.get(key);
      
      if (notification) {
        notification.read = true;
        notification.readAt = new Date().toISOString();
        return await redisConfig.set(key, notification, this.defaultTTL.notification);
      }
      
      return false;
    } catch (error) {
      logger.error('Error marking notification read', { error: error.message, userId, notificationId });
      return false;
    }
  }

  /**
   * Аналитика
   */
  async incrementAnalytics(metric, date = null, value = 1) {
    try {
      const dateStr = date ? helpers.formatDate(date, 'en-US', { year: 'numeric', month: '2-digit', day: '2-digit' }) 
                          : helpers.formatDate(new Date(), 'en-US', { year: 'numeric', month: '2-digit', day: '2-digit' });
      
      const key = this.generateKey('analytics', `${metric}:${dateStr}`);
      
      const current = await redisConfig.get(key) || 0;
      const newValue = current + value;
      
      // Устанавливаем TTL на 90 дней для аналитики
      await redisConfig.set(key, newValue, 90 * 24 * 60 * 60);
      
      return newValue;
    } catch (error) {
      logger.error('Error incrementing analytics', { error: error.message, metric });
      return null;
    }
  }

  async getAnalytics(metric, fromDate, toDate) {
    try {
      const result = {};
      const currentDate = new Date(fromDate);
      const endDate = new Date(toDate);
      
      while (currentDate <= endDate) {
        const dateStr = helpers.formatDate(currentDate, 'en-US', { year: 'numeric', month: '2-digit', day: '2-digit' });
        const key = this.generateKey('analytics', `${metric}:${dateStr}`);
        
        const value = await redisConfig.get(key) || 0;
        result[dateStr] = value;
        
        currentDate.setDate(currentDate.getDate() + 1);
      }
      
      return result;
    } catch (error) {
      logger.error('Error getting analytics', { error: error.message, metric });
      return {};
    }
  }

  /**
   * Очереди задач
   */
  async addToQueue(queueName, taskData, priority = 0) {
    try {
      const key = this.generateKey('queue', queueName);
      const task = {
        id: helpers.generateRandomString(16),
        data: taskData,
        priority,
        createdAt: new Date().toISOString(),
        attempts: 0
      };
      
      return await redisConfig.lpush(key, task);
    } catch (error) {
      logger.error('Error adding to queue', { error: error.message, queueName });
      return null;
    }
  }

  async processQueue(queueName, processor) {
    try {
      const key = this.generateKey('queue', queueName);
      const task = await redisConfig.rpop(key);
      
      if (!task) {
        return null;
      }
      
      try {
        await processor(task.data);
        logger.info('Queue task processed successfully', { queueName, taskId: task.id });
        return true;
      } catch (processingError) {
        // Возвращаем задачу в очередь при ошибке
        task.attempts++;
        task.lastError = processingError.message;
        task.lastAttempt = new Date().toISOString();
        
        if (task.attempts < 3) {
          await redisConfig.lpush(key, task);
        } else {
          logger.error('Queue task failed after max attempts', { 
            queueName, 
            taskId: task.id, 
            error: processingError.message 
          });
        }
        
        return false;
      }
    } catch (error) {
      logger.error('Error processing queue', { error: error.message, queueName });
      return null;
    }
  }

  async getQueueSize(queueName) {
    try {
      const key = this.generateKey('queue', queueName);
      return await redisConfig.llen(key);
    } catch (error) {
      logger.error('Error getting queue size', { error: error.message, queueName });
      return 0;
    }
  }

  /**
   * Блокировки
   */
  async acquireLock(lockName, ttl = null) {
    try {
      const key = this.generateKey('lock', lockName);
      const expiry = ttl || this.defaultTTL.lock;
      const lockValue = helpers.generateRandomString(16);
      
      // Используем SET с NX и EX для атомарной операции
      const client = redisConfig.getClient();
      const result = await client.set(key, lockValue, {
        NX: true,
        EX: expiry
      });
      
      if (result === 'OK') {
        return { acquired: true, lockValue };
      }
      
      return { acquired: false, lockValue: null };
    } catch (error) {
      logger.error('Error acquiring lock', { error: error.message, lockName });
      return { acquired: false, lockValue: null };
    }
  }

  async releaseLock(lockName, lockValue) {
    try {
      const key = this.generateKey('lock', lockName);
      const client = redisConfig.getClient();
      
      // Используем Lua скрипт для атомарного освобождения блокировки
      const script = `
        if redis.call("get", KEYS[1]) == ARGV[1] then
          return redis.call("del", KEYS[1])
        else
          return 0
        end
      `;
      
      const result = await client.eval(script, {
        keys: [key],
        arguments: [lockValue]
      });
      
      return result === 1;
    } catch (error) {
      logger.error('Error releasing lock', { error: error.message, lockName });
      return false;
    }
  }

  /**
   * Pub/Sub для real-time уведомлений
   */
  async publishEvent(channel, eventData) {
    try {
      const event = {
        ...eventData,
        timestamp: new Date().toISOString(),
        id: helpers.generateRandomString(16)
      };
      
      return await redisConfig.publish(channel, event);
    } catch (error) {
      logger.error('Error publishing event', { error: error.message, channel });
      return null;
    }
  }

  async subscribeToEvents(channel, callback) {
    try {
      return await redisConfig.subscribe(channel, callback);
    } catch (error) {
      logger.error('Error subscribing to events', { error: error.message, channel });
      return false;
    }
  }

  /**
   * Утилиты для мониторинга
   */
  async getStats() {
    try {
      const stats = await redisConfig.getStats();
      
      // Добавляем статистику по нашим ключам
      const ourStats = {};
      
      for (const [prefix, prefixValue] of Object.entries(this.keyPrefixes)) {
        const pattern = `${prefixValue}*`;
        const keys = await redisConfig.keys(pattern);
        ourStats[prefix] = {
          count: keys.length,
          pattern: prefixValue
        };
      }
      
      return {
        redis: stats,
        application: ourStats,
        isInitialized: this.isInitialized
      };
    } catch (error) {
      logger.error('Error getting Redis stats', { error: error.message });
      return null;
    }
  }

  async healthCheck() {
    try {
      if (!this.isInitialized) {
        return { healthy: false, reason: 'Not initialized' };
      }
      
      const ping = await redisConfig.ping();
      if (!ping) {
        return { healthy: false, reason: 'Ping failed' };
      }
      
      // Тест записи/чтения
      const testKey = this.generateKey('cache', 'health_check');
      const testValue = { timestamp: Date.now() };
      
      await redisConfig.set(testKey, testValue, 10);
      const retrieved = await redisConfig.get(testKey);
      await redisConfig.del(testKey);
      
      if (!retrieved || retrieved.timestamp !== testValue.timestamp) {
        return { healthy: false, reason: 'Read/write test failed' };
      }
      
      return { healthy: true, timestamp: new Date().toISOString() };
    } catch (error) {
      logger.error('Redis health check failed', { error: error.message });
      return { healthy: false, reason: error.message };
    }
  }

  /**
   * Очистка истекших данных
   */
  async cleanup() {
    try {
      let totalCleaned = 0;
      
      // Очищаем истекшие сессии (старше 7 дней)
      const oldSessionPattern = this.generateKey('session', '*');
      const sessionKeys = await redisConfig.keys(oldSessionPattern);
      
      for (const key of sessionKeys) {
        const session = await redisConfig.get(key);
        if (session && session.lastActivity) {
          const lastActivity = new Date(session.lastActivity);
          const daysSinceActivity = (Date.now() - lastActivity.getTime()) / (1000 * 60 * 60 * 24);
          
          if (daysSinceActivity > 7) {
            await redisConfig.del(key);
            totalCleaned++;
          }
        }
      }
      
      logger.info('Redis cleanup completed', { totalCleaned });
      return totalCleaned;
    } catch (error) {
      logger.error('Redis cleanup failed', { error: error.message });
      return 0;
    }
  }

  /**
   * Полное отключение
   */
  async disconnect() {
    try {
      await redisConfig.disconnect();
      this.isInitialized = false;
      logger.info('Redis database disconnected');
      return true;
    } catch (error) {
      logger.error('Error disconnecting Redis database', { error: error.message });
      return false;
    }
  }
}

module.exports = new RedisDatabase();