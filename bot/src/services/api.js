// bot/src/services/api.js
const axios = require('axios');
const config = require('../config');
const logger = require('../utils/logger');

class ApiService {
  constructor() {
    this.baseURL = config.serverUrl;
    this.timeout = 60000;
    this.retries = 3;
    
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: this.timeout,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'MISTIKA-Bot/1.0'
      }
    });

    this.setupInterceptors();
  }

  /**
   * Настройка перехватчиков для запросов и ответов
   */
  setupInterceptors() {
    // Перехватчик запросов
    this.client.interceptors.request.use(
      (config) => {
        logger.debug('API Request', {
          method: config.method,
          url: config.url,
          data: config.data ? 'present' : 'none'
        });
        return config;
      },
      (error) => {
        logger.error('API Request Error', { error: error.message });
        return Promise.reject(error);
      }
    );

    // Перехватчик ответов
    this.client.interceptors.response.use(
      (response) => {
        logger.debug('API Response', {
          status: response.status,
          url: response.config.url
        });
        return response;
      },
      (error) => {
        logger.error('API Response Error', {
          status: error.response?.status,
          url: error.config?.url,
          message: error.message
        });
        return Promise.reject(error);
      }
    );
  }

  /**
   * Универсальный метод для выполнения запросов с повторными попытками
   */
  async makeRequest(method, endpoint, data = null, options = {}) {
    let lastError;

    for (let attempt = 1; attempt <= this.retries; attempt++) {
      try {
        const config = {
          method,
          url: endpoint,
          ...options
        };

        if (data) {
          if (method.toLowerCase() === 'get') {
            config.params = data;
          } else {
            config.data = data;
          }
        }

        const response = await this.client(config);
        return response.data;

      } catch (error) {
        lastError = error;
        
        if (attempt === this.retries) {
          logger.error(`API request failed after ${this.retries} attempts`, {
            method,
            endpoint,
            error: error.message
          });
          break;
        }

        // Ждем перед повторной попыткой
        await this.delay(attempt * 1000);
      }
    }

    throw lastError;
  }

  /**
   * Задержка между попытками
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * HTTP GET запрос
   */
  async get(endpoint, options = {}) {
    return await this.makeRequest('GET', endpoint, null, options);
  }

  /**
   * HTTP POST запрос
   */
  async post(endpoint, data = null, options = {}) {
    return await this.makeRequest('POST', endpoint, data, options);
  }

  /**
   * HTTP PUT запрос
   */
  async put(endpoint, data = null, options = {}) {
    return await this.makeRequest('PUT', endpoint, data, options);
  }

  /**
   * HTTP DELETE запрос
   */
  async delete(endpoint, options = {}) {
    return await this.makeRequest('DELETE', endpoint, null, options);
  }

  // ===== USER API =====

  /**
   * Создание или обновление пользователя
   */
  async createOrUpdateUser(userData) {
    try {
      return await this.makeRequest('POST', '/api/v1/auth/telegram', userData);
    } catch (error) {
      logger.error('Failed to create/update user', { 
        telegramId: userData.telegramId,
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * Получение пользователя по Telegram ID
   */
  async getUserByTelegramId(telegramId) {
    try {
      return await this.makeRequest('GET', `/api/v1/auth/user/${telegramId}`);
    } catch (error) {
      if (error.response?.status === 404) {
        return null; // Пользователь не найден
      }
      logger.error('Failed to get user', { telegramId, error: error.message });
      throw error;
    }
  }

  /**
   * Обновление данных пользователя
   */
  async updateUser(userId, updateData) {
    try {
      return await this.makeRequest('PUT', `/api/v1/auth/user/${userId}`, updateData);
    } catch (error) {
      logger.error('Failed to update user', { userId, error: error.message });
      throw error;
    }
  }

  // ===== CARDS API =====

  /**
   * Получение всех карт
   */
  async getAllCards() {
    try {
      return await this.makeRequest('GET', '/api/v1/cards');
    } catch (error) {
      logger.error('Failed to get all cards', { error: error.message });
      throw error;
    }
  }

  /**
   * Получение случайной карты
   */
  async getRandomCard(options = {}) {
    try {
      return await this.makeRequest('GET', '/api/v1/cards/random', options);
    } catch (error) {
      logger.error('Failed to get random card', { error: error.message });
      throw error;
    }
  }

  /**
   * Получение нескольких случайных карт
   */
  async getRandomCards(count, options = {}) {
    try {
      const params = { count, ...options };
      return await this.makeRequest('GET', '/api/v1/cards/random-multiple', params);
    } catch (error) {
      logger.error('Failed to get random cards', { count, error: error.message });
      throw error;
    }
  }

  /**
   * Получение карты по ID
   */
  async getCard(cardId) {
    try {
      return await this.makeRequest('GET', `/api/v1/cards/${cardId}`);
    } catch (error) {
      logger.error('Failed to get card', { cardId, error: error.message });
      throw error;
    }
  }

  // ===== READINGS API =====

  /**
   * Создание нового гадания (требует аутентификации)
   */
  async createReading(readingData, userToken) {
    try {
      const options = {
        headers: {
          'Authorization': `Bearer ${userToken}`
        }
      };
      return await this.makeRequest('POST', '/api/v1/readings', readingData, options);
    } catch (error) {
      logger.error('Failed to create reading', { error: error.message });
      throw error;
    }
  }

  /**
   * Получение гаданий пользователя
   */
  async getUserReadings(userToken, options = {}) {
    try {
      const requestOptions = {
        headers: {
          'Authorization': `Bearer ${userToken}`
        }
      };
      return await this.makeRequest('GET', '/api/v1/readings', options, requestOptions);
    } catch (error) {
      logger.error('Failed to get user readings', { error: error.message });
      throw error;
    }
  }

  /**
   * Получение дневной карты
   */
  async getDailyCard(userToken) {
    try {
      const options = {
        headers: {
          'Authorization': `Bearer ${userToken}`
        }
      };
      return await this.makeRequest('GET', '/api/v1/readings/daily', {}, options);
    } catch (error) {
      logger.error('Failed to get daily card', { error: error.message });
      throw error;
    }
  }

  /**
   * Получение статистики гаданий
   */
  async getReadingStats(userToken) {
    try {
      const options = {
        headers: {
          'Authorization': `Bearer ${userToken}`
        }
      };
      return await this.makeRequest('GET', '/api/v1/readings/stats', {}, options);
    } catch (error) {
      logger.error('Failed to get reading stats', { error: error.message });
      throw error;
    }
  }

  /**
   * Получение конкретного гадания
   */
  async getReading(readingId, userToken) {
    try {
      const options = {
        headers: {
          'Authorization': `Bearer ${userToken}`
        }
      };
      return await this.makeRequest('GET', `/api/v1/readings/${readingId}`, {}, options);
    } catch (error) {
      logger.error('Failed to get reading', { readingId, error: error.message });
      throw error;
    }
  }

  /**
   * Поделиться гаданием
   */
  async shareReading(readingId, userToken) {
    try {
      const options = {
        headers: {
          'Authorization': `Bearer ${userToken}`
        }
      };
      return await this.makeRequest('POST', `/api/v1/readings/${readingId}/share`, {}, options);
    } catch (error) {
      logger.error('Failed to share reading', { readingId, error: error.message });
      throw error;
    }
  }

  /**
   * Получение публичного гадания по коду
   */
  async getSharedReading(shareCode) {
    try {
      return await this.makeRequest('GET', `/api/v1/readings/shared/${shareCode}`);
    } catch (error) {
      logger.error('Failed to get shared reading', { shareCode, error: error.message });
      throw error;
    }
  }

  // ===== HEALTH CHECK =====

  /**
   * Проверка состояния API сервера
   */
  async healthCheck() {
    try {
      const response = await this.makeRequest('GET', '/health');
      return response;
    } catch (error) {
      logger.error('API health check failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Проверка состояния API v1
   */
  async apiStatus() {
    try {
      const response = await this.makeRequest('GET', '/api/v1');
      return response;
    } catch (error) {
      logger.error('API v1 status check failed', { error: error.message });
      throw error;
    }
  }
}

module.exports = new ApiService();