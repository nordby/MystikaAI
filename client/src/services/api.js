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
    return this.client.get('/cards/random');
  }

  async getCards(filters = {}) {
    return this.client.get('/cards/', { params: filters });
  }

  async getRandomCards(count = 1) {
    return this.client.get('/cards/random-multiple', { params: { count } });
  }

  async getCard(cardId) {
    return this.client.get(`/cards/${cardId}`);
  }

  async getCardMeaning(cardId) {
    return this.client.get(`/cards/${cardId}/meaning`);
  }

  // Расклады
  async getSpreads() {
    return this.client.get('/spreads/');
  }

  async getSpread(spreadId) {
    return this.client.get(`/spreads/${spreadId}`);
  }

  async createReading(readingData) {
    return this.client.post('/readings/', readingData);
  }

  async performSpreadReading(readingData) {
    return this.client.post('/spreads/reading', readingData);
  }

  async getReadingHistory() {
    return this.client.get('/spreads/reading/history');
  }

  async getReading(readingId) {
    return this.client.get(`/spreads/reading/${readingId}`);
  }

  async getUserReadings(userId) {
    return this.client.get(`/readings/user/${userId}`);
  }

  async getSpecificReading(readingId) {
    return this.client.get(`/readings/${readingId}`);
  }

  async createCustomSpread(spreadData) {
    return this.client.post('/spreads/custom', spreadData);
  }

  async getMyCustomSpreads() {
    return this.client.get('/spreads/custom/my');
  }

  async deleteCustomSpread(spreadId) {
    return this.client.delete(`/spreads/custom/${spreadId}`);
  }

  // Платежи
  async getSubscriptionPlans() {
    return this.client.get('/payments/plans');
  }

  async getSubscriptionInfo() {
    return this.client.get('/payments/subscription');
  }

  async createPayment(planData) {
    return this.client.post('/payments/create', planData);
  }

  async confirmPayment(paymentData) {
    return this.client.post('/payments/confirm', paymentData);
  }

  async cancelSubscription() {
    return this.client.post('/payments/cancel-subscription');
  }

  async resumeSubscription() {
    return this.client.post('/payments/resume-subscription');
  }

  async getPaymentHistory() {
    return this.client.get('/payments/history');
  }

  async getInvoice(paymentId) {
    return this.client.get(`/payments/invoice/${paymentId}`);
  }

  async applyPromoCode(code) {
    return this.client.post('/payments/promo-code', { code });
  }

  // AI функции
  async generateAIInterpretation(interpretationData) {
    return this.client.post('/ai/interpret', interpretationData);
  }

  async generateCardImage(imageData) {
    return this.client.post('/ai/generate-card-image', imageData);
  }

  async generateSpreadImages(spreadData) {
    return this.client.post('/ai/generate-spread-images', spreadData);
  }

  async checkAIHealth() {
    return this.client.get('/ai/health');
  }

  async checkKandinskyHealth() {
    return this.client.get('/ai/kandinsky/health');
  }

  // Analytics
  async trackEvent(eventData) {
    return this.client.post('/analytics/events', eventData);
  }

  async getUserStats(userId) {
    return this.client.get(`/analytics/users/${userId}/stats`);
  }

  // Telegram
  async sendMessage(messageData) {
    return this.client.post('/telegram/send-message', messageData);
  }

  async sendCard(cardData) {
    return this.client.post('/telegram/send-card', cardData);
  }

  async sendNotification(notificationData) {
    return this.client.post('/telegram/send-notification', notificationData);
  }

  async getTelegramUserInfo(telegramId) {
    return this.client.get(`/telegram/user-info/${telegramId}`);
  }

  // Note: Numerology and Lunar endpoints are not implemented in backend yet
  // These will return 404 until backend routes are created

  // Нумерология (placeholder - needs backend implementation)
  async calculateNumerology(birthData) {
    return this.client.post('/numerology/calculate', birthData);
  }

  async getNumerologyProfile() {
    return this.client.get('/numerology/profile');
  }

  async getCompatibility(partnerData) {
    return this.client.post('/numerology/compatibility', partnerData);
  }

  // Лунный календарь (placeholder - needs backend implementation)
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