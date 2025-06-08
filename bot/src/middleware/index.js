// bot/src/middleware/rateLimiter.js
class RateLimiter {
  constructor() {
    this.users = new Map();
    this.windowMs = 60 * 1000; // 1 минута
    this.maxRequests = 30;
  }

  async check(context) {
    const userId = context.from?.id;
    if (!userId) return;

    const now = Date.now();
    const userKey = userId.toString();
    
    if (!this.users.has(userKey)) {
      this.users.set(userKey, {
        requests: 1,
        resetTime: now + this.windowMs
      });
      return;
    }

    const userData = this.users.get(userKey);
    
    if (now > userData.resetTime) {
      userData.requests = 1;
      userData.resetTime = now + this.windowMs;
    } else {
      userData.requests++;
    }

    if (userData.requests > this.maxRequests) {
      await context.bot.sendMessage(context.chat.id, 
        '⏱️ Слишком много запросов. Подождите немного.');
      context.processed = true;
    }
  }
}

// bot/src/middleware/errorHandler.js
class ErrorHandler {
  async wrap(context) {
    try {
      // Middleware выполняется в другом месте
    } catch (error) {
      console.error('Middleware error:', error);
      
      try {
        await context.bot.sendMessage(context.chat.id, 
          '❌ Произошла ошибка. Попробуйте позже.');
      } catch (sendError) {
        console.error('Failed to send error message:', sendError);
      }
      
      context.processed = true;
    }
  }
}

// bot/src/middleware/user.js
class UserMiddleware {
  async loadUser(context) {
    if (context.from) {
      context.user = {
        id: context.from.id,
        username: context.from.username,
        firstName: context.from.first_name,
        lastName: context.from.last_name,
        languageCode: context.from.language_code
      };
    }
  }
}

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

module.exports = {
  rateLimiter: new RateLimiter(),
  errorHandler: new ErrorHandler(),
  userMiddleware: new UserMiddleware(),
  analyticsMiddleware: new AnalyticsMiddleware()
};