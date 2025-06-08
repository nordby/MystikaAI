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

module.exports = new RateLimiter();