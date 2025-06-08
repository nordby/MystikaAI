// client/src/services/api.js
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

class ApiService {
  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // Interceptor для добавления токена
    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('auth_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Interceptor для обработки ответов
    this.client.interceptors.response.use(
      (response) => response.data,
      (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('auth_token');
          window.location.href = '/';
        }
        return Promise.reject(error);
      }
    );
  }

  // Аутентификация
  async authenticateTelegram(telegramData) {
    return this.client.post('/auth/telegram', telegramData);
  }

  async getProfile() {
    return this.client.get('/auth/profile');
  }

  async updateProfile(profileData) {
    return this.client.put('/auth/profile', profileData);
  }

  // Карты
  async getDailyCard() {
    return this.client.get('/cards/daily');
  }

  async getPersonalDeck() {
    return this.client.get('/cards/personal-deck');
  }

  async generatePersonalDeck() {
    return this.client.post('/cards/generate-deck');
  }

  async getCardMeaning(cardId) {
    return this.client.get(`/cards/${cardId}/meaning`);
  }

  // Расклады
  async getSpreadTemplates() {
    return this.client.get('/spreads/templates');
  }

  async performReading(readingData) {
    return this.client.post('/spreads/reading', readingData);
  }

  async getReadingHistory(params = {}) {
    return this.client.get('/spreads/history', { params });
  }

  async getReading(readingId) {
    return this.client.get(`/spreads/${readingId}`);
  }

  async rateReading(readingId, rating) {
    return this.client.post(`/spreads/${readingId}/rate`, { rating });
  }

  // Платежи
  async getSubscriptionInfo() {
    return this.client.get('/payments/subscription');
  }

  async createPayment(planData) {
    return this.client.post('/payments/create', planData);
  }

  async confirmPayment(paymentId) {
    return this.client.post(`/payments/${paymentId}/confirm`);
  }

  // AI функции
  async generateAIInterpretation(cards, question) {
    return this.client.post('/ai/interpret', { cards, question });
  }

  async processVoiceInput(audioBlob) {
    const formData = new FormData();
    formData.append('audio', audioBlob);
    return this.client.post('/ai/voice', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  }

  // Нумерология
  async calculateNumerology(birthData) {
    return this.client.post('/numerology/calculate', birthData);
  }

  async getNumerologyProfile() {
    return this.client.get('/numerology/profile');
  }

  async getCompatibility(partnerData) {
    return this.client.post('/numerology/compatibility', partnerData);
  }

  // Лунный календарь
  async getCurrentMoonPhase() {
    return this.client.get('/lunar/current');
  }

  async getLunarCalendar(year, month) {
    return this.client.get('/lunar/calendar', { params: { year, month } });
  }

  async getPersonalRecommendations() {
    return this.client.get('/lunar/personal');
  }
}

export default new ApiService();