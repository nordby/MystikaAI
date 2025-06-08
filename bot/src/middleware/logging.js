// bot/src/middleware/logging.js
const logger = require('../../utils/logger');

/**
 * Middleware для логирования активности бота
 */
class LoggingMiddleware {
    constructor() {
        this.startTime = Date.now();
        this.messageCount = 0;
        this.errorCount = 0;
        this.userSessions = new Map();
    }

    /**
     * Логирование входящих сообщений
     */
    logMessage(msg) {
        this.messageCount++;
        
        const user = msg.from;
        const chat = msg.chat;
        const messageType = this.getMessageType(msg);
        
        // Обновляем сессию пользователя
        this.updateUserSession(user.id);
        
        logger.info('Incoming message', {
            messageId: msg.message_id,
            userId: user.id,
            username: user.username,
            firstName: user.first_name,
            chatId: chat.id,
            chatType: chat.type,
            messageType: messageType,
            text: msg.text ? msg.text.substring(0, 100) : null,
            timestamp: new Date(msg.date * 1000).toISOString()
        });
    }

    /**
     * Логирование callback query
     */
    logCallbackQuery(callbackQuery) {
        const user = callbackQuery.from;
        const message = callbackQuery.message;
        
        this.updateUserSession(user.id);
        
        logger.info('Callback query', {
            callbackQueryId: callbackQuery.id,
            userId: user.id,
            username: user.username,
            firstName: user.first_name,
            chatId: message.chat.id,
            data: callbackQuery.data,
            timestamp: new Date().toISOString()
        });
    }

    /**
     * Логирование ошибок
     */
    logError(error, context = {}) {
        this.errorCount++;
        
        logger.error('Bot error', {
            error: error.message,
            stack: error.stack,
            context: context,
            timestamp: new Date().toISOString()
        });
    }

    /**
     * Логирование отправленных сообщений
     */
    logOutgoingMessage(chatId, messageType, options = {}) {
        logger.info('Outgoing message', {
            chatId: chatId,
            messageType: messageType,
            hasKeyboard: !!options.reply_markup,
            parseMode: options.parse_mode,
            timestamp: new Date().toISOString()
        });
    }

    /**
     * Логирование команд
     */
    logCommand(command, user, args = []) {
        this.updateUserSession(user.id);
        
        logger.info('Command executed', {
            command: command,
            userId: user.id,
            username: user.username,
            firstName: user.first_name,
            args: args,
            timestamp: new Date().toISOString()
        });
    }

    /**
     * Логирование API запросов
     */
    logApiRequest(method, url, userId, status, responseTime) {
        logger.info('API request', {
            method: method,
            url: url,
            userId: userId,
            status: status,
            responseTime: responseTime,
            timestamp: new Date().toISOString()
        });
    }

    /**
     * Определение типа сообщения
     */
    getMessageType(msg) {
        if (msg.text && msg.text.startsWith('/')) return 'command';
        if (msg.text) return 'text';
        if (msg.photo) return 'photo';
        if (msg.voice) return 'voice';
        if (msg.audio) return 'audio';
        if (msg.document) return 'document';
        if (msg.video) return 'video';
        if (msg.sticker) return 'sticker';
        if (msg.location) return 'location';
        if (msg.contact) return 'contact';
        return 'other';
    }

    /**
     * Обновление сессии пользователя
     */
    updateUserSession(userId) {
        const now = Date.now();
        const session = this.userSessions.get(userId) || {
            firstSeen: now,
            lastSeen: now,
            messageCount: 0
        };
        
        session.lastSeen = now;
        session.messageCount++;
        
        this.userSessions.set(userId, session);
    }

    /**
     * Получение статистики
     */
    getStats() {
        const now = Date.now();
        const uptime = now - this.startTime;
        
        return {
            uptime: uptime,
            totalMessages: this.messageCount,
            totalErrors: this.errorCount,
            activeUsers: this.userSessions.size,
            messagesPerMinute: (this.messageCount / (uptime / 60000)).toFixed(2),
            errorRate: ((this.errorCount / this.messageCount) * 100).toFixed(2)
        };
    }

    /**
     * Middleware для логирования сообщений
     */
    messageLogger() {
        return (msg, metadata) => {
            try {
                this.logMessage(msg);
            } catch (error) {
                console.error('Ошибка логирования сообщения:', error);
            }
        };
    }

    /**
     * Middleware для логирования callback query
     */
    callbackLogger() {
        return (callbackQuery) => {
            try {
                this.logCallbackQuery(callbackQuery);
            } catch (error) {
                console.error('Ошибка логирования callback query:', error);
            }
        };
    }

    /**
     * Wrapper для обработчиков с логированием ошибок
     */
    withErrorLogging(handler, handlerName = 'unknown') {
        return async (...args) => {
            try {
                await handler(...args);
            } catch (error) {
                this.logError(error, {
                    handler: handlerName,
                    args: args.map(arg => {
                        if (arg && typeof arg === 'object') {
                            return {
                                type: arg.constructor.name,
                                id: arg.id || arg.message_id || arg.chat?.id
                            };
                        }
                        return arg;
                    })
                });
                throw error;
            }
        };
    }

    /**
     * Периодическое логирование статистики
     */
    startStatsLogging(intervalMinutes = 60) {
        setInterval(() => {
            const stats = this.getStats();
            logger.info('Bot statistics', stats);
            
            // Очищаем старые сессии (старше 24 часов)
            const dayAgo = Date.now() - 24 * 60 * 60 * 1000;
            for (const [userId, session] of this.userSessions.entries()) {
                if (session.lastSeen < dayAgo) {
                    this.userSessions.delete(userId);
                }
            }
        }, intervalMinutes * 60 * 1000);
    }

    /**
     * Логирование производительности
     */
    async withPerformanceLogging(operation, operationName) {
        const startTime = Date.now();
        
        try {
            const result = await operation();
            const endTime = Date.now();
            const duration = endTime - startTime;
            
            logger.info('Performance metrics', {
                operation: operationName,
                duration: duration,
                status: 'success',
                timestamp: new Date().toISOString()
            });
            
            return result;
        } catch (error) {
            const endTime = Date.now();
            const duration = endTime - startTime;
            
            logger.error('Performance metrics', {
                operation: operationName,
                duration: duration,
                status: 'error',
                error: error.message,
                timestamp: new Date().toISOString()
            });
            
            throw error;
        }
    }
}

module.exports = LoggingMiddleware;