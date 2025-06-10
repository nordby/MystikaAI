// bot/src/middleware/auth.js
const axios = require('axios');
const logger = require('../utils/logger');

/**
 * Middleware для аутентификации пользователей Telegram
 */
class AuthMiddleware {
    constructor(apiBaseUrl, botToken) {
        this.apiBaseUrl = apiBaseUrl;
        this.botToken = botToken;
        this.userCache = new Map();
        this.cacheTimeout = 5 * 60 * 1000; // 5 минут
    }

    /**
     * Проверка и регистрация пользователя
     */
    async authenticateUser(telegramUser) {
        try {
            const userId = telegramUser.id.toString();
            
            // Проверяем кэш
            const cachedUser = this.userCache.get(userId);
            if (cachedUser && Date.now() - cachedUser.timestamp < this.cacheTimeout) {
                return cachedUser.user;
            }

            // Формируем данные пользователя
            const userData = {
                telegramId: telegramUser.id,
                firstName: telegramUser.first_name,
                lastName: telegramUser.last_name || null,
                username: telegramUser.username || null,
                languageCode: telegramUser.language_code || 'ru'
            };

            // Отправляем запрос на регистрацию/аутентификацию
            const response = await axios.post(`${this.apiBaseUrl}/auth/telegram`, userData);
            
            if (response.data.success) {
                const user = response.data.user;
                
                // Кэшируем пользователя
                this.userCache.set(userId, {
                    user: user,
                    timestamp: Date.now()
                });
                
                return user;
            } else {
                throw new Error(response.data.message || 'Ошибка аутентификации');
            }

        } catch (error) {
            logger.error('Ошибка аутентификации пользователя:', error);
            throw error;
        }
    }

    /**
     * Получение API клиента для пользователя
     */
    async getApiClientForUser(telegramUser) {
        try {
            const user = await this.authenticateUser(telegramUser);
            
            // Создаем экземпляр axios с токеном пользователя
            const apiClient = axios.create({
                baseURL: this.apiBaseUrl,
                headers: {
                    'Authorization': `Bearer ${user.token}`,
                    'Content-Type': 'application/json'
                },
                timeout: 30000
            });

            // Добавляем перехватчик для обработки ошибок
            apiClient.interceptors.response.use(
                response => response,
                error => {
                    if (error.response?.status === 401) {
                        // Токен истек, удаляем из кэша
                        this.userCache.delete(telegramUser.id.toString());
                    }
                    return Promise.reject(error);
                }
            );

            return apiClient;

        } catch (error) {
            logger.error('Ошибка создания API клиента:', error);
            throw error;
        }
    }

    /**
     * Middleware для команд бота
     */
    withAuth(handler) {
        return async (bot, msg, ...args) => {
            try {
                const user = msg.from;
                if (!user) {
                    await bot.sendMessage(msg.chat.id, 
                        '❌ Ошибка аутентификации. Попробуйте перезапустить бота командой /start');
                    return;
                }

                // Получаем API клиент
                const api = await this.getApiClientForUser(user);
                
                // Вызываем оригинальный обработчик с API клиентом
                await handler(bot, msg, api, ...args);

            } catch (error) {
                logger.error('Ошибка в middleware аутентификации:', error);
                
                await bot.sendMessage(msg.chat.id,
                    '❌ <b>Ошибка аутентификации</b>\n\n' +
                    'Не удалось подтвердить вашу личность.\n' +
                    'Попробуйте перезапустить бота командой /start', {
                    parse_mode: 'HTML'
                });
            }
        };
    }

    /**
     * Middleware для callback query
     */
    withAuthCallback(handler) {
        return async (bot, callbackQuery, ...args) => {
            try {
                const user = callbackQuery.from;
                if (!user) {
                    await bot.answerCallbackQuery(callbackQuery.id, {
                        text: 'Ошибка аутентификации'
                    });
                    return;
                }

                // Получаем API клиент
                const api = await this.getApiClientForUser(user);
                
                // Вызываем оригинальный обработчик с API клиентом
                await handler(bot, callbackQuery, api, ...args);

            } catch (error) {
                logger.error('Ошибка в callback middleware:', error);
                
                await bot.answerCallbackQuery(callbackQuery.id, {
                    text: 'Ошибка аутентификации'
                });
                
                await bot.sendMessage(callbackQuery.message.chat.id,
                    '❌ <b>Ошибка аутентификации</b>\n\n' +
                    'Попробуйте перезапустить бота командой /start', {
                    parse_mode: 'HTML'
                });
            }
        };
    }

    /**
     * Проверка премиум статуса
     */
    requiresPremium(handler) {
        return this.withAuth(async (bot, msg, api, ...args) => {
            try {
                // Получаем информацию о пользователе
                const userResponse = await api.get('/auth/profile');
                const user = userResponse.data.user;

                if (!user.isPremium) {
                    await bot.sendMessage(msg.chat.id,
                        '💎 <b>Премиум функция</b>\n\n' +
                        'Эта функция доступна только для премиум пользователей.\n' +
                        'Оформите подписку для получения доступа ко всем возможностям!', {
                        parse_mode: 'HTML',
                        reply_markup: {
                            inline_keyboard: [[
                                {
                                    text: '💎 Узнать о премиум',
                                    callback_data: 'premium_info'
                                }
                            ]]
                        }
                    });
                    return;
                }

                // Пользователь имеет премиум, выполняем команду
                await handler(bot, msg, api, ...args);

            } catch (error) {
                logger.error('Ошибка проверки премиум статуса:', error);
                await bot.sendMessage(msg.chat.id,
                    '❌ Ошибка проверки статуса подписки');
            }
        });
    }

    /**
     * Проверка лимитов для бесплатных пользователей
     */
    checkLimits(limitType, maxCount = 3) {
        return this.withAuth(async (bot, msg, api, handler, ...args) => {
            try {
                const userResponse = await api.get('/auth/profile');
                const user = userResponse.data.user;

                // Премиум пользователи не имеют лимитов
                if (user.isPremium) {
                    await handler(bot, msg, api, ...args);
                    return;
                }

                // Проверяем лимиты для бесплатных пользователей
                const limitsResponse = await api.get(`/auth/limits/${limitType}`);
                const limits = limitsResponse.data;

                if (limits.used >= maxCount) {
                    await bot.sendMessage(msg.chat.id,
                        `⏰ <b>Лимит исчерпан</b>\n\n` +
                        `Вы использовали все ${maxCount} попытки на сегодня.\n` +
                        `Оформите премиум подписку для безлимитного доступа!`, {
                        parse_mode: 'HTML',
                        reply_markup: {
                            inline_keyboard: [
                                [
                                    {
                                        text: '💎 Оформить премиум',
                                        callback_data: 'premium_info'
                                    }
                                ],
                                [
                                    {
                                        text: '⏰ Попробовать завтра',
                                        callback_data: 'close_message'
                                    }
                                ]
                            ]
                        }
                    });
                    return;
                }

                // Лимит не исчерпан, выполняем команду
                await handler(bot, msg, api, ...args);

            } catch (error) {
                logger.error('Ошибка проверки лимитов:', error);
                await handler(bot, msg, api, ...args); // Выполняем в случае ошибки
            }
        });
    }

    /**
     * Очистка кэша пользователей
     */
    clearCache() {
        this.userCache.clear();
    }

    /**
     * Удаление пользователя из кэша
     */
    removeFromCache(telegramId) {
        this.userCache.delete(telegramId.toString());
    }
}

module.exports = AuthMiddleware;