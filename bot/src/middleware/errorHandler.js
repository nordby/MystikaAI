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

module.exports = new ErrorHandler();