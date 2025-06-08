// client/src/services/analytics.js

class AnalyticsService {
  constructor() {
    this.sessionId = this.generateSessionId();
    this.userId = null;
    this.events = [];
    this.isEnabled = true;
    this.apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';
  }

  // Генерация уникального ID сессии
  generateSessionId() {
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  // Инициализация аналитики
  init(userId = null) {
    this.userId = userId;
    this.trackEvent('session_start', {
      user_agent: navigator.userAgent,
      screen_resolution: `${screen.width}x${screen.height}`,
      timestamp: new Date().toISOString(),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    });
  }

  // Включение/отключение аналитики
  setEnabled(enabled) {
    this.isEnabled = enabled;
    if (enabled) {
      this.trackEvent('analytics_enabled');
    } else {
      this.trackEvent('analytics_disabled');
      this.flush(); // Отправляем накопленные события перед отключением
    }
  }

  // Базовый метод трекинга событий
  trackEvent(eventName, properties = {}) {
    if (!this.isEnabled) return;

    const event = {
      event_name: eventName,
      session_id: this.sessionId,
      user_id: this.userId,
      timestamp: new Date().toISOString(),
      properties: {
        ...properties,
        url: window.location.href,
        referrer: document.referrer
      }
    };

    this.events.push(event);

    // Автоматическая отправка при накоплении событий
    if (this.events.length >= 10) {
      this.flush();
    }

    console.debug('Analytics event:', event);
  }

  // Трекинг использования Таро
  trackCardReading(cardData) {
    this.trackEvent('card_reading', {
      spread_type: cardData.spreadType,
      cards_count: cardData.cards?.length || 1,
      question_length: cardData.question?.length || 0,
      has_question: !!cardData.question,
      reading_duration: cardData.duration || null
    });
  }

  // Трекинг получения дневной карты
  trackDailyCard(cardName, isReversed) {
    this.trackEvent('daily_card_drawn', {
      card_name: cardName,
      is_reversed: isReversed,
      day_of_week: new Date().getDay(),
      hour_of_day: new Date().getHours()
    });
  }

  // Трекинг нумерологических расчетов
  trackNumerology(calculationType, result) {
    this.trackEvent('numerology_calculation', {
      calculation_type: calculationType,
      result_number: result,
      has_birth_date: !!result.birthDate
    });
  }

  // Трекинг использования лунного календаря
  trackLunarCalendar(action, moonPhase) {
    this.trackEvent('lunar_calendar_usage', {
      action: action,
      moon_phase: moonPhase,
      date: new Date().toISOString().split('T')[0]
    });
  }

  // Трекинг использования голосового ввода
  trackVoiceInput(success, duration) {
    this.trackEvent('voice_input_usage', {
      success: success,
      duration_ms: duration,
      browser: this.getBrowserInfo().name
    });
  }

  // Трекинг платежей
  trackPayment(action, planType, amount = null) {
    this.trackEvent('payment_interaction', {
      action: action, // 'initiated', 'completed', 'failed', 'cancelled'
      plan_type: planType,
      amount: amount,
      currency: 'RUB'
    });
  }

  // Трекинг ошибок
  trackError(error, context = {}) {
    this.trackEvent('error_occurred', {
      error_message: error.message,
      error_stack: error.stack,
      context: context,
      user_agent: navigator.userAgent
    });
  }

  // Трекинг производительности
  trackPerformance(actionName, duration, success = true) {
    this.trackEvent('performance_metric', {
      action: actionName,
      duration_ms: duration,
      success: success,
      memory_usage: performance.memory ? {
        used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024),
        total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024)
      } : null
    });
  }

  // Трекинг взаимодействий с UI
  trackUIInteraction(elementType, elementId = null, action = 'click') {
    this.trackEvent('ui_interaction', {
      element_type: elementType,
      element_id: elementId,
      action: action,
      page: window.location.pathname
    });
  }

  // Трекинг времени на странице
  trackPageView(pageName) {
    if (this.currentPageStartTime) {
      const timeOnPage = Date.now() - this.currentPageStartTime;
      this.trackEvent('page_exit', {
        page: this.currentPage,
        time_on_page_ms: timeOnPage
      });
    }

    this.currentPage = pageName;
    this.currentPageStartTime = Date.now();
    
    this.trackEvent('page_view', {
      page: pageName,
      timestamp: new Date().toISOString()
    });
  }

  // Трекинг конверсий
  trackConversion(conversionType, value = null) {
    this.trackEvent('conversion', {
      type: conversionType, // 'registration', 'first_reading', 'subscription', etc.
      value: value,
      days_since_registration: this.getDaysSinceRegistration()
    });
  }

  // Отправка накопленных событий на сервер
  async flush() {
    if (this.events.length === 0) return;

    const eventsToSend = [...this.events];
    this.events = []; // Очищаем локальный буфер

    try {
      const response = await fetch(`${this.apiUrl}/analytics/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({
          events: eventsToSend,
          session_id: this.sessionId
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      console.debug(`Отправлено ${eventsToSend.length} событий аналитики`);
    } catch (error) {
      console.error('Ошибка отправки аналитики:', error);
      // Возвращаем события в буфер при ошибке
      this.events.unshift(...eventsToSend);
    }
  }

  // Получение информации о браузере
  getBrowserInfo() {
    const ua = navigator.userAgent;
    let browserName = 'Unknown';
    
    if (ua.includes('Chrome')) browserName = 'Chrome';
    else if (ua.includes('Firefox')) browserName = 'Firefox';
    else if (ua.includes('Safari')) browserName = 'Safari';
    else if (ua.includes('Edge')) browserName = 'Edge';
    else if (ua.includes('Opera')) browserName = 'Opera';

    return {
      name: browserName,
      version: this.getBrowserVersion(ua, browserName),
      mobile: /Mobi|Android/i.test(ua)
    };
  }

  // Получение версии браузера
  getBrowserVersion(ua, browserName) {
    const regex = new RegExp(`${browserName}\/([\\d\\.]+)`);
    const match = ua.match(regex);
    return match ? match[1] : 'Unknown';
  }

  // Получение количества дней с регистрации
  getDaysSinceRegistration() {
    const registrationDate = localStorage.getItem('registration_date');
    if (!registrationDate) return null;
    
    const diffTime = Date.now() - new Date(registrationDate).getTime();
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  }

  // Получение статистики сессии
  getSessionStats() {
    return {
      session_id: this.sessionId,
      events_count: this.events.length,
      session_duration: Date.now() - (this.sessionStartTime || Date.now()),
      user_id: this.userId
    };
  }

  // Очистка данных (GDPR)
  clearUserData() {
    this.userId = null;
    this.events = [];
    localStorage.removeItem('registration_date');
    this.trackEvent('user_data_cleared');
    this.flush();
  }

  // Экспорт пользовательских данных
  async exportUserData() {
    try {
      const response = await fetch(`${this.apiUrl}/analytics/export`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Ошибка экспорта данных:', error);
      throw error;
    }
  }

  // Отправка событий при закрытии страницы
  setupBeforeUnload() {
    window.addEventListener('beforeunload', () => {
      if (this.events.length > 0) {
        // Используем sendBeacon для надежной отправки
        navigator.sendBeacon(
          `${this.apiUrl}/analytics/events`,
          JSON.stringify({
            events: this.events,
            session_id: this.sessionId
          })
        );
      }
    });

    // Отправляем события периодически
    setInterval(() => {
      if (this.events.length > 0) {
        this.flush();
      }
    }, 30000); // Каждые 30 секунд
  }
}

export default new AnalyticsService();