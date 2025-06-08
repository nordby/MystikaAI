// bot/src/middleware/analytics.js
class AnalyticsMiddleware {
  async track(context) {
    try {
      const eventData = {
        type: 'bot_interaction',
        userId: context.from?.id,
        chatId: context.chat?.id,
        messageType: context.type,
        timestamp: new Date().toISOString()
      };

      // Здесь можно отправлять данные в аналитику
      console.log('Analytics event:', eventData);
    } catch (error) {
      console.warn('Analytics tracking failed:', error);
    }
  }
}

module.exports = new AnalyticsMiddleware();