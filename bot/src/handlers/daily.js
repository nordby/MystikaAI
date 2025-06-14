// bot/src/handlers/daily.js
const { createDailyCardKeyboard } = require('../utils/keyboards');
const { dailyCardMessage, formatCardMessage } = require('../utils/messages');
const apiService = require('../services/api');
const logger = require('../utils/logger');

/**
 * Обработчик команды /daily - получение дневной карты
 */
async function handleDaily(bot, msg, userToken) {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    try {
        // Отправляем сообщение о загрузке
        const loadingMsg = await bot.sendMessage(chatId, 
            '🔮 <i>Перемешиваю карты...</i>\n' +
            '✨ <i>Настраиваюсь на вашу энергию...</i>', {
            parse_mode: 'HTML'
        });

        // Получаем дневную карту через API
        const response = await apiService.getDailyCard(userToken);

        if (response.success) {
            const { card, isReversed, interpretation, date } = response;

            // Удаляем сообщение о загрузке
            await bot.deleteMessage(chatId, loadingMsg.message_id);

            // Формируем сообщение с картой
            const cardText = formatCardMessage(card, isReversed, interpretation, date);

            // Отправляем карту с изображением (если есть)
            if (card.imageUrl) {
                await bot.sendPhoto(chatId, card.imageUrl, {
                    caption: cardText,
                    parse_mode: 'HTML',
                    reply_markup: createDailyCardKeyboard(card.id)
                });
            } else {
                await bot.sendMessage(chatId, cardText, {
                    parse_mode: 'HTML',
                    reply_markup: createDailyCardKeyboard(card.id)
                });
            }

            // Дополнительные кнопки для действий
            await bot.sendMessage(chatId, 
                '🎯 <b>Что вы хотите узнать еще?</b>', {
                parse_mode: 'HTML',
                reply_markup: {
                    inline_keyboard: [
                        ...(process.env.WEBAPP_URL ? [[
                            {
                                text: '🎴 Другие расклады',
                                web_app: { 
                                    url: `${process.env.WEBAPP_URL}/spreads` 
                                }
                            }
                        ]] : []),
                        [
                            {
                                text: '📖 История гаданий',
                                web_app: { 
                                    url: `${process.env.WEBAPP_URL}/history` 
                                }
                            },
                            {
                                text: '🔢 Нумерология',
                                callback_data: 'numerology_today'
                            }
                        ],
                        [
                            {
                                text: '🌙 Лунный календарь',
                                callback_data: 'lunar_today'
                            }
                        ]
                    ]
                }
            });

        } else if (response.data.upgradeRequired) {
            // Если дневная карта уже получена для бесплатного пользователя
            await bot.deleteMessage(chatId, loadingMsg.message_id);
            
            await bot.sendMessage(chatId,
                '🌅 <b>Дневная карта уже получена</b>\n\n' +
                'Вы уже получили свою карту дня сегодня.\n' +
                'Премиум пользователи могут получать карты без ограничений!\n\n' +
                '💎 Узнайте больше о преимуществах подписки:', {
                parse_mode: 'HTML',
                reply_markup: {
                    inline_keyboard: [
                        [
                            {
                                text: '💎 Премиум возможности',
                                callback_data: 'premium_info'
                            }
                        ],
                        [
                            {
                                text: '📖 Посмотреть сегодняшнюю карту',
                                web_app: { 
                                    url: `${process.env.WEBAPP_URL}/daily` 
                                }
                            }
                        ]
                    ]
                }
            });
        } else {
            throw new Error(response.data.message || 'Неизвестная ошибка');
        }

    } catch (error) {
        console.error('Ошибка получения дневной карты:', error);
        
        // Удаляем сообщение о загрузке если оно еще есть
        try {
            await bot.deleteMessage(chatId, loadingMsg.message_id);
        } catch (e) {
            // Сообщение уже удалено
        }

        if (error.response?.status === 401) {
            await bot.sendMessage(chatId,
                '🔐 <b>Требуется авторизация</b>\n\n' +
                'Пожалуйста, начните сначала с команды /start', {
                parse_mode: 'HTML',
                reply_markup: {
                    inline_keyboard: [[
                        {
                            text: '🔄 Начать заново',
                            callback_data: 'restart'
                        }
                    ]]
                }
            });
        } else if (error.response?.status === 429) {
            await bot.sendMessage(chatId,
                '⏰ <b>Лимит исчерпан</b>\n\n' +
                'Вы уже получили максимальное количество карт на сегодня.\n' +
                'Попробуйте завтра или оформите премиум подписку!', {
                parse_mode: 'HTML',
                reply_markup: {
                    inline_keyboard: [[
                        {
                            text: '💎 Узнать о Премиум',
                            callback_data: 'premium_info'
                        }
                    ]]
                }
            });
        } else {
            await bot.sendMessage(chatId,
                '❌ <b>Не удалось получить дневную карту</b>\n\n' +
                'Попробуйте еще раз через несколько секунд.\n' +
                '<i>Иногда карты просто не готовы открыться...</i>', {
                parse_mode: 'HTML',
                reply_markup: {
                    inline_keyboard: [
                        [
                            {
                                text: '🔄 Попробовать снова',
                                callback_data: 'daily_card'
                            }
                        ],
                        ...(process.env.WEBAPP_URL ? [[
                            {
                                text: '🎴 Другие расклады',
                                web_app: { 
                                    url: `${process.env.WEBAPP_URL}/spreads` 
                                }
                            }
                        ]] : [])
                    ]
                }
            });
        }
    }
}

/**
 * Обработчик получения истории дневных карт
 */
async function handleDailyHistory(bot, callbackQuery, api) {
    const chatId = callbackQuery.message.chat.id;
    const userId = callbackQuery.from.id;

    try {
        await bot.answerCallbackQuery(callbackQuery.id, {
            text: 'Загружаю историю...'
        });

        const response = await api.get('/cards/daily/history?limit=7');

        if (response.data.success && response.data.history.length > 0) {
            let historyText = '📖 <b>Ваши дневные карты за последнюю неделю:</b>\n\n';
            
            response.data.history.forEach((reading, index) => {
                const date = new Date(reading.date).toLocaleDateString('ru-RU');
                historyText += `${index + 1}. ${date} - ${reading.card.card_name}`;
                if (reading.isReversed) historyText += ' (перевернутая)';
                historyText += '\n';
            });

            if (response.data.upgradeRequired) {
                historyText += '\n💎 <i>Полная история доступна только в Premium</i>';
            } else {
                historyText += '\n💡 <i>Посмотрите полную историю в приложении</i>';
            }

            await bot.sendMessage(chatId, historyText, {
                parse_mode: 'HTML',
                reply_markup: {
                    inline_keyboard: [[
                        {
                            text: '📚 Полная история',
                            web_app: { 
                                url: `${process.env.WEBAPP_URL}/history/daily` 
                            }
                        }
                    ]]
                }
            });
        } else {
            await bot.sendMessage(chatId,
                '📖 <b>История дневных карт пуста</b>\n\n' +
                'Получите свою первую дневную карту!', {
                parse_mode: 'HTML',
                reply_markup: {
                    inline_keyboard: [[
                        {
                            text: '🌅 Получить карту дня',
                            callback_data: 'daily_card'
                        }
                    ]]
                }
            });
        }

    } catch (error) {
        console.error('Ошибка получения истории:', error);
        
        await bot.sendMessage(chatId,
            '❌ Не удалось загрузить историю дневных карт', {
            reply_markup: {
                inline_keyboard: [[
                    {
                        text: '🔄 Попробовать снова',
                        callback_data: 'daily_history'
                    }
                ]]
            }
        });
    }
}

/**
 * Обработчик настроек уведомлений о дневной карте
 */
async function handleDailyNotifications(bot, callbackQuery, api) {
    const chatId = callbackQuery.message.chat.id;
    const userId = callbackQuery.from.id;

    try {
        await bot.answerCallbackQuery(callbackQuery.id);

        // Получаем текущие настройки пользователя
        const response = await api.get('/auth/profile');
        const user = response.data.user;

        const notificationsEnabled = user.notifications_enabled;

        await bot.sendMessage(chatId,
            '🔔 <b>Настройки уведомлений</b>\n\n' +
            `Уведомления о дневной карте: ${notificationsEnabled ? '✅ Включены' : '❌ Отключены'}\n\n` +
            'Получайте ежедневные напоминания о вашей карте дня в удобное время.', {
            parse_mode: 'HTML',
            reply_markup: {
                inline_keyboard: [
                    [
                        {
                            text: notificationsEnabled ? '🔕 Отключить' : '🔔 Включить',
                            callback_data: `toggle_notifications_${!notificationsEnabled}`
                        }
                    ],
                    [
                        {
                            text: '⏰ Настроить время',
                            callback_data: 'set_notification_time'
                        }
                    ],
                    [
                        {
                            text: '🎯 Персонализация',
                            web_app: { 
                                url: `${process.env.WEBAPP_URL}/settings/notifications` 
                            }
                        }
                    ]
                ]
            }
        });

    } catch (error) {
        console.error('Ошибка настроек уведомлений:', error);
        await bot.answerCallbackQuery(callbackQuery.id, {
            text: 'Ошибка загрузки настроек'
        });
    }
}

/**
 * Обработчик переключения уведомлений
 */
async function handleToggleNotifications(bot, callbackQuery, api) {
    const chatId = callbackQuery.message.chat.id;
    const userId = callbackQuery.from.id;
    const enable = callbackQuery.data.includes('true');

    try {
        const response = await api.put('/auth/profile', {
            notifications_enabled: enable
        });

        if (response.data.success) {
            await bot.answerCallbackQuery(callbackQuery.id, {
                text: enable ? 'Уведомления включены ✅' : 'Уведомления отключены ❌'
            });

            // Обновляем сообщение
            await bot.editMessageText(
                '🔔 <b>Настройки уведомлений обновлены</b>\n\n' +
                `Уведомления о дневной карте: ${enable ? '✅ Включены' : '❌ Отключены'}\n\n` +
                'Изменения вступили в силу немедленно.', {
                chat_id: chatId,
                message_id: callbackQuery.message.message_id,
                parse_mode: 'HTML',
                reply_markup: {
                    inline_keyboard: [
                        [
                            {
                                text: enable ? '🔕 Отключить' : '🔔 Включить',
                                callback_data: `toggle_notifications_${!enable}`
                            }
                        ],
                        [
                            {
                                text: '🌅 Получить карту сейчас',
                                callback_data: 'daily_card'
                            }
                        ]
                    ]
                }
            });
        }

    } catch (error) {
        console.error('Ошибка переключения уведомлений:', error);
        await bot.answerCallbackQuery(callbackQuery.id, {
            text: 'Ошибка изменения настроек'
        });
    }
}

module.exports = {
    handleDaily,
    handleDailyHistory,
    handleDailyNotifications,
    handleToggleNotifications
};