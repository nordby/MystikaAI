// server/src/config/redis.js
const redis = require('redis');
const logger = require('../utils/logger');

class RedisConfig {
  constructor() {
    this.client = null;
    this.subscriber = null;
    this.publisher = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 10;
    this.reconnectDelay = 1000;
  }

  /**
   * Инициализация Redis подключения
   */
  async initialize() {
    try {
      const redisOptions = {
        url: process.env.REDIS_URL || 'redis://localhost:6379',
        socket: {
          connectTimeout: parseInt(process.env.REDIS_CONNECT_TIMEOUT) || 60000,
          commandTimeout: parseInt(process.env.REDIS_COMMAND_TIMEOUT) || 5000,
          reconnectDelay: this.reconnectDelay
        },
        retry_delay_on_failure: 100,
        enable_offline_queue: false,
        lazyConnect: true
      };

      // Основной клиент
      this.client = redis.createClient(redisOptions);
      
      // Отдельные клиенты для pub/sub
      this.subscriber = redis.createClient(redisOptions);
      this.publisher = redis.createClient(redisOptions);

      // Настройка обработчиков событий
      this.setupEventHandlers(this.client, 'main');
      this.setupEventHandlers(this.subscriber, 'subscriber');
      this.setupEventHandlers(this.publisher, 'publisher');

      // Подключение
      await Promise.all([
        this.client.connect(),
        this.subscriber.connect(),
        this.publisher.connect()
      ]);

      this.isConnected = true;
      this.reconnectAttempts = 0;

      logger.info('Redis connected successfully', {
        url: this.maskUrl(process.env.REDIS_URL || 'redis://localhost:6379')
      });

      return true;

    } catch (error) {
      logger.error('Redis connection failed', { 
        error: error.message,
        attempts: this.reconnectAttempts 
      });
      
      this.isConnected = false;
      await this.handleReconnection();
      return false;
    }
  }

  /**
   * Настройка обработчиков событий
   */
  setupEventHandlers(client, type) {
    client.on('connect', () => {
      logger.info(`Redis ${type} client connecting`);
    });

    client.on('ready', () => {
      logger.info(`Redis ${type} client ready`);
      this.isConnected = true;
      this.reconnectAttempts = 0;
    });

    client.on('error', (error) => {
      logger.error(`Redis ${type} client error`, { 
        error: error.message,
        code: error.code 
      });
      this.isConnected = false;
    });

    client.on('end', () => {
      logger.warn(`Redis ${type} client connection ended`);
      this.isConnected = false;
    });

    client.on('reconnecting', () => {
      this.reconnectAttempts++;
      logger.info(`Redis ${type} client reconnecting`, { 
        attempt: this.reconnectAttempts 
      });
    });
  }

  /**
   * Обработка переподключения
   */
  async handleReconnection() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      logger.error('Max Redis reconnection attempts reached');
      return;
    }

    const delay = Math.min(this.reconnectDelay * Math.pow(2, this.reconnectAttempts), 30000);
    
    setTimeout(async () => {
      logger.info('Attempting Redis reconnection', { 
        attempt: this.reconnectAttempts + 1,
        delay 
      });
      await this.initialize();
    }, delay);
  }

  /**
   * Получение основного клиента
   */
  getClient() {
    if (!this.isConnected || !this.client) {
      throw new Error('Redis client not connected');
    }
    return this.client;
  }

  /**
   * Получение subscriber клиента
   */
  getSubscriber() {
    if (!this.isConnected || !this.subscriber) {
      throw new Error('Redis subscriber not connected');
    }
    return this.subscriber;
  }

  /**
   * Получение publisher клиента
   */
  getPublisher() {
    if (!this.isConnected || !this.publisher) {
      throw new Error('Redis publisher not connected');
    }
    return this.publisher;
  }

  /**
   * Проверка подключения
   */
  async ping() {
    try {
      if (!this.client) return false;
      const result = await this.client.ping();
      return result === 'PONG';
    } catch (error) {
      logger.error('Redis ping failed', { error: error.message });
      return false;
    }
  }

  /**
   * Установка значения с TTL
   */
  async set(key, value, ttl = null) {
    try {
      const client = this.getClient();
      const serializedValue = JSON.stringify(value);
      
      if (ttl) {
        await client.setEx(key, ttl, serializedValue);
      } else {
        await client.set(key, serializedValue);
      }
      
      return true;
    } catch (error) {
      logger.error('Redis set error', { 
        error: error.message, 
        key: this.maskKey(key) 
      });
      return false;
    }
  }

  /**
   * Получение значения
   */
  async get(key) {
    try {
      const client = this.getClient();
      const value = await client.get(key);
      
      if (value === null) return null;
      return JSON.parse(value);
    } catch (error) {
      logger.error('Redis get error', { 
        error: error.message, 
        key: this.maskKey(key) 
      });
      return null;
    }
  }

  /**
   * Удаление ключа
   */
  async del(key) {
    try {
      const client = this.getClient();
      const result = await client.del(key);
      return result > 0;
    } catch (error) {
      logger.error('Redis del error', { 
        error: error.message, 
        key: this.maskKey(key) 
      });
      return false;
    }
  }

  /**
   * Проверка существования ключа
   */
  async exists(key) {
    try {
      const client = this.getClient();
      const result = await client.exists(key);
      return result === 1;
    } catch (error) {
      logger.error('Redis exists error', { 
        error: error.message, 
        key: this.maskKey(key) 
      });
      return false;
    }
  }

  /**
   * Установка TTL для ключа
   */
  async expire(key, ttl) {
    try {
      const client = this.getClient();
      const result = await client.expire(key, ttl);
      return result === 1;
    } catch (error) {
      logger.error('Redis expire error', { 
        error: error.message, 
        key: this.maskKey(key) 
      });
      return false;
    }
  }

  /**
   * Увеличение числового значения
   */
  async incr(key, increment = 1) {
    try {
      const client = this.getClient();
      const result = await client.incrBy(key, increment);
      return result;
    } catch (error) {
      logger.error('Redis incr error', { 
        error: error.message, 
        key: this.maskKey(key) 
      });
      return null;
    }
  }

  /**
   * Работа с hash'ами
   */
  async hset(key, field, value) {
    try {
      const client = this.getClient();
      const serializedValue = JSON.stringify(value);
      const result = await client.hSet(key, field, serializedValue);
      return result;
    } catch (error) {
      logger.error('Redis hset error', { 
        error: error.message, 
        key: this.maskKey(key),
        field 
      });
      return null;
    }
  }

  async hget(key, field) {
    try {
      const client = this.getClient();
      const value = await client.hGet(key, field);
      
      if (value === null) return null;
      return JSON.parse(value);
    } catch (error) {
      logger.error('Redis hget error', { 
        error: error.message, 
        key: this.maskKey(key),
        field 
      });
      return null;
    }
  }

  async hgetall(key) {
    try {
      const client = this.getClient();
      const hash = await client.hGetAll(key);
      
      const parsed = {};
      for (const [field, value] of Object.entries(hash)) {
        try {
          parsed[field] = JSON.parse(value);
        } catch {
          parsed[field] = value;
        }
      }
      
      return parsed;
    } catch (error) {
      logger.error('Redis hgetall error', { 
        error: error.message, 
        key: this.maskKey(key) 
      });
      return {};
    }
  }

  async hdel(key, field) {
    try {
      const client = this.getClient();
      const result = await client.hDel(key, field);
      return result > 0;
    } catch (error) {
      logger.error('Redis hdel error', { 
        error: error.message, 
        key: this.maskKey(key),
        field 
      });
      return false;
    }
  }

  /**
   * Работа со списками
   */
  async lpush(key, ...values) {
    try {
      const client = this.getClient();
      const serializedValues = values.map(v => JSON.stringify(v));
      const result = await client.lPush(key, serializedValues);
      return result;
    } catch (error) {
      logger.error('Redis lpush error', { 
        error: error.message, 
        key: this.maskKey(key) 
      });
      return null;
    }
  }

  async rpop(key) {
    try {
      const client = this.getClient();
      const value = await client.rPop(key);
      
      if (value === null) return null;
      return JSON.parse(value);
    } catch (error) {
      logger.error('Redis rpop error', { 
        error: error.message, 
        key: this.maskKey(key) 
      });
      return null;
    }
  }

  async llen(key) {
    try {
      const client = this.getClient();
      const result = await client.lLen(key);
      return result;
    } catch (error) {
      logger.error('Redis llen error', { 
        error: error.message, 
        key: this.maskKey(key) 
      });
      return 0;
    }
  }

  /**
   * Работа с множествами
   */
  async sadd(key, ...members) {
    try {
      const client = this.getClient();
      const serializedMembers = members.map(m => JSON.stringify(m));
      const result = await client.sAdd(key, serializedMembers);
      return result;
    } catch (error) {
      logger.error('Redis sadd error', { 
        error: error.message, 
        key: this.maskKey(key) 
      });
      return null;
    }
  }

  async smembers(key) {
    try {
      const client = this.getClient();
      const members = await client.sMembers(key);
      return members.map(m => {
        try {
          return JSON.parse(m);
        } catch {
          return m;
        }
      });
    } catch (error) {
      logger.error('Redis smembers error', { 
        error: error.message, 
        key: this.maskKey(key) 
      });
      return [];
    }
  }

  async srem(key, ...members) {
    try {
      const client = this.getClient();
      const serializedMembers = members.map(m => JSON.stringify(m));
      const result = await client.sRem(key, serializedMembers);
      return result;
    } catch (error) {
      logger.error('Redis srem error', { 
        error: error.message, 
        key: this.maskKey(key) 
      });
      return null;
    }
  }

  /**
   * Pub/Sub функциональность
   */
  async publish(channel, message) {
    try {
      const publisher = this.getPublisher();
      const serializedMessage = JSON.stringify(message);
      const result = await publisher.publish(channel, serializedMessage);
      return result;
    } catch (error) {
      logger.error('Redis publish error', { 
        error: error.message, 
        channel 
      });
      return null;
    }
  }

  async subscribe(channel, callback) {
    try {
      const subscriber = this.getSubscriber();
      
      await subscriber.subscribe(channel, (message) => {
        try {
          const parsed = JSON.parse(message);
          callback(parsed);
        } catch {
          callback(message);
        }
      });
      
      return true;
    } catch (error) {
      logger.error('Redis subscribe error', { 
        error: error.message, 
        channel 
      });
      return false;
    }
  }

  async unsubscribe(channel) {
    try {
      const subscriber = this.getSubscriber();
      await subscriber.unsubscribe(channel);
      return true;
    } catch (error) {
      logger.error('Redis unsubscribe error', { 
        error: error.message, 
        channel 
      });
      return false;
    }
  }

  /**
   * Выполнение транзакции
   */
  async multi(commands) {
    try {
      const client = this.getClient();
      const multi = client.multi();
      
      for (const command of commands) {
        const [method, ...args] = command;
        multi[method](...args);
      }
      
      const results = await multi.exec();
      return results;
    } catch (error) {
      logger.error('Redis multi error', { error: error.message });
      return null;
    }
  }

  /**
   * Поиск ключей по паттерну
   */
  async keys(pattern) {
    try {
      const client = this.getClient();
      const keys = await client.keys(pattern);
      return keys;
    } catch (error) {
      logger.error('Redis keys error', { 
        error: error.message, 
        pattern 
      });
      return [];
    }
  }

  /**
   * Получение информации о Redis
   */
  async info(section = null) {
    try {
      const client = this.getClient();
      const info = section ? await client.info(section) : await client.info();
      return info;
    } catch (error) {
      logger.error('Redis info error', { error: error.message });
      return null;
    }
  }

  /**
   * Очистка базы данных
   */
  async flushdb() {
    try {
      const client = this.getClient();
      await client.flushDb();
      logger.warn('Redis database flushed');
      return true;
    } catch (error) {
      logger.error('Redis flushdb error', { error: error.message });
      return false;
    }
  }

  /**
   * Закрытие всех соединений
   */
  async disconnect() {
    try {
      const promises = [];
      
      if (this.client) {
        promises.push(this.client.quit());
      }
      
      if (this.subscriber) {
        promises.push(this.subscriber.quit());
      }
      
      if (this.publisher) {
        promises.push(this.publisher.quit());
      }
      
      await Promise.all(promises);
      
      this.client = null;
      this.subscriber = null;
      this.publisher = null;
      this.isConnected = false;
      
      logger.info('Redis disconnected');
      return true;
    } catch (error) {
      logger.error('Redis disconnect error', { error: error.message });
      return false;
    }
  }

  /**
   * Маскирование URL для логов
   */
  maskUrl(url) {
    if (!url) return '';
    return url.replace(/:\/\/[^:]+:[^@]+@/, '://***:***@');
  }

  /**
   * Маскирование ключей для логов
   */
  maskKey(key) {
    if (!key || typeof key !== 'string') return '';
    if (key.length <= 10) return key;
    return key.substring(0, 5) + '***' + key.substring(key.length - 3);
  }

  /**
   * Проверка состояния подключения
   */
  isReady() {
    return this.isConnected && this.client && this.client.isReady;
  }

  /**
   * Получение статистики
   */
  async getStats() {
    try {
      const info = await this.info();
      if (!info) return null;

      const lines = info.split('\r\n');
      const stats = {};
      
      for (const line of lines) {
        if (line.includes(':')) {
          const [key, value] = line.split(':');
          stats[key] = isNaN(value) ? value : Number(value);
        }
      }
      
      return {
        connected: this.isConnected,
        version: stats.redis_version,
        uptime: stats.uptime_in_seconds,
        memory: {
          used: stats.used_memory,
          peak: stats.used_memory_peak,
          rss: stats.used_memory_rss
        },
        clients: stats.connected_clients,
        commands: stats.total_commands_processed,
        keyspace: stats.db0 || 'empty'
      };
    } catch (error) {
      logger.error('Redis stats error', { error: error.message });
      return null;
    }
  }
}

module.exports = new RedisConfig();