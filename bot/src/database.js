// bot/src/database.js
const axios = require('axios');

class BotDatabase {
  constructor() {
    this.serverUrl = process.env.SERVER_URL || 'http://localhost:3001';
    this.apiTimeout = parseInt(process.env.API_TIMEOUT) || 10000;
    this.retryAttempts = 3;
    this.retryDelay = 1000;
  }

  /**
   * Инициализация подключения к серверу
   */
  async initialize() {
    try {
      console.log('Connecting to MISTIKA Server...');
      
      // Проверка доступности сервера
      const response = await this.makeRequest('GET', '/health');
      
      if (response.status === 'OK') {
        console.log('Successfully connected to MISTIKA Server');
        return true;
      } else {
        throw new Error('Server health check failed');
      }
    } catch (error) {
      console.error('Failed to connect to server:', error.message);
      throw error;
    }
  }

  /**
   * Выполнение HTTP запроса к серверу
   */
  async makeRequest(method, endpoint, data = null, options = {}) {
    const config = {
      method,
      url: `${this.serverUrl}/api/v1${endpoint}`,
      timeout: this.apiTimeout,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'MISTIKA-Bot/1.0',
        ...options.headers
      },
      ...options
    };

    if (data) {
      config.data = data;
    }

    let lastError;
    
    for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
      try {
        const response = await axios(config);
        return response.data;
      } catch (error) {
        lastError = error;
        
        console.warn(`Request attempt ${attempt} failed:`, {
          endpoint,
          error: error.message,
          status: error.response?.status
        });

        // Не повторяем запрос при ошибках клиента (4xx)
        if (error.response?.status >= 400 && error.response?.status < 500) {
          break;
        }

        // Задержка перед повтором
        if (attempt < this.retryAttempts) {
          await new Promise(resolve => setTimeout(resolve, this.retryDelay * attempt));
        }
      }
    }

    throw lastError;
  }

  /**
   * Методы для работы с пользователями
   */
  async getUserByTelegramId(telegramId) {
    try {
      return await this.makeRequest('GET', `/users/telegram/${telegramId}`);
    } catch (error) {
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  }

  async createUser(userData) {
    return await this.makeRequest('POST', '/users', userData);
  }

  async updateUser(userId, userData) {
    return await this.makeRequest('PUT', `/users/${userId}`, userData);
  }

  /**
   * Методы для работы с гаданиями
   */
  async createReading(readingData) {
    return await this.makeRequest('POST', '/readings', readingData);
  }

  async getReading(readingId) {
    return await this.makeRequest('GET', `/readings/${readingId}`);
  }

  async getUserReadings(userId, page = 1, limit = 10) {
    return await this.makeRequest('GET', `/readings?userId=${userId}&page=${page}&limit=${limit}`);
  }

  /**
   * Методы для работы с картами дня
   */
  async getDailyCard(userId, date = null) {
    const dateParam = date ? `?date=${date}` : '';
    return await this.makeRequest('GET', `/cards/daily/${userId}${dateParam}`);
  }

  /**
   * Методы для работы с нумерологией
   */
  async getNumerologyAnalysis(userId, birthDate, fullName = null) {
    const data = { birthDate };
    if (fullName) data.fullName = fullName;
    
    return await this.makeRequest('POST', `/numerology/analysis/${userId}`, data);
  }

  /**
   * Методы для работы с лунным календарем
   */
  async getLunarCalendar(startDate, endDate) {
    return await this.makeRequest('GET', `/lunar/calendar?start=${startDate}&end=${endDate}`);
  }

  async getLunarRecommendations(date = null) {
    const dateParam = date ? `?date=${date}` : '';
    return await this.makeRequest('GET', `/lunar/recommendations${dateParam}`);
  }

  /**
   * Методы для работы с подписками
   */
  async getUserSubscription(userId) {
    try {
      return await this.makeRequest('GET', `/subscriptions/user/${userId}`);
    } catch (error) {
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  }

  async createSubscription(subscriptionData) {
    return await this.makeRequest('POST', '/subscriptions', subscriptionData);
  }

  /**
   * Методы для работы с платежами
   */
  async createPayment(paymentData) {
    return await this.makeRequest('POST', '/payments', paymentData);
  }

  async getPaymentStatus(paymentId) {
    return await this.makeRequest('GET', `/payments/${paymentId}/status`);
  }

  /**
   * Методы для работы с уведомлениями
   */
  async getUserNotifications(userId) {
    return await this.makeRequest('GET', `/notifications/user/${userId}`);
  }

  async markNotificationRead(notificationId) {
    return await this.makeRequest('POST', `/notifications/${notificationId}/read`);
  }

  /**
   * Методы для аналитики
   */
  async trackEvent(eventData) {
    try {
      return await this.makeRequest('POST', '/analytics/events', eventData);
    } catch (error) {
      // Не прерываем работу бота при ошибках аналитики
      console.warn('Analytics tracking failed:', error.message);
      return null;
    }
  }

  async getUserStats(userId) {
    return await this.makeRequest('GET', `/analytics/users/${userId}/stats`);
  }

  /**
   * Методы для админки
   */
  async getBotStats() {
    return await this.makeRequest('GET', '/admin/bot/stats');
  }

  async broadcastMessage(messageData) {
    return await this.makeRequest('POST', '/admin/broadcast', messageData);
  }

  /**
   * Проверка здоровья подключения
   */
  async healthCheck() {
    try {
      const response = await this.makeRequest('GET', '/health');
      return {
        healthy: true,
        server: response,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        healthy: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Кэширование для уменьшения нагрузки на сервер
   */
  setupCache() {
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 минут

    // Очистка кэша каждые 10 минут
    setInterval(() => {
      const now = Date.now();
      for (const [key, { timestamp }] of this.cache.entries()) {
        if (now - timestamp > this.cacheTimeout) {
          this.cache.delete(key);
        }
      }
    }, 10 * 60 * 1000);
  }

  /**
   * Получение данных с кэшированием
   */
  async getCached(key, fetcher) {
    if (!this.cache) {
      this.setupCache();
    }

    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }

    try {
      const data = await fetcher();
      this.cache.set(key, {
        data,
        timestamp: Date.now()
      });
      return data;
    } catch (error) {
      // Возвращаем устаревшие данные из кэша при ошибке
      if (cached) {
        console.warn('Using stale cached data due to error:', error.message);
        return cached.data;
      }
      throw error;
    }
  }

  /**
   * Инвалидация кэша
   */
  invalidateCache(pattern = null) {
    if (!this.cache) return;

    if (pattern) {
      for (const key of this.cache.keys()) {
        if (key.includes(pattern)) {
          this.cache.delete(key);
        }
      }
    } else {
      this.cache.clear();
    }
  }
}

module.exports = new BotDatabase();