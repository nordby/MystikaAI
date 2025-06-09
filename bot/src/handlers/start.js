// bot/src/handlers/start.js
const { createMainKeyboard } = require('../utils/keyboards');
const { welcomeMessage } = require('../utils/messages');
const apiService = require('../services/api');
const logger = require('../utils/logger');

/**
 * Обработчик команды /start
 */
async function handleStart(bot, msg, referralCode = null) {
    const chatId = msg.chat.id;
    const user = msg.from;

    try {
        // Подготавливаем данные пользователя для регистрации/обновления
        const userData = {
            telegramId: user.id,
            username: user.username,
            firstName: user.first_name,
            lastName: user.last_name,
            languageCode: user.language_code || 'ru',
            referralCode: referralCode
        };

        // Отправляем данные на backend для регистрации/аутентификации
        const response = await apiService.createOrUpdateUser(userData);

        if (response.success) {
            const { user: authUser, token } = response;
            
            // Создаем приветственное сообщение
            const welcome = welcomeMessage(user.first_name, authUser.subscriptionType);
            
            // Отправляем приветствие с клавиатурой
            await bot.sendMessage(chatId, welcome, {
                parse_mode: 'HTML',
                reply_markup: createMainKeyboard(authUser.subscriptionType)
            });

            // Если это новый пользователь, показываем дополнительную информацию
            if (!authUser.totalReadings || authUser.totalReadings === 0) {
                await bot.sendMessage(chatId, 
                    '✨ <b>Добро пожаловать в мир мистики!</b>\n\n' +
                    '🔮 Получите свою первую карту дня\n' +
                    '📱 Откройте приложение для полного функционала\n' +
                    '💎 Изучите премиум возможности\n\n' +
                    '<i>Звезды уже готовят для вас особые послания...</i>', {
                    parse_mode: 'HTML',
                    reply_markup: {
                        inline_keyboard: [
                            [
                                {
                                    text: '🌅 Карта дня',
                                    callback_data: 'daily_card'
                                },
                                {
                                    text: '✨ Открыть приложение',
                                    web_app: { 
                                        url: process.env.WEBAPP_URL || 'https://mistika.app' 
                                    }
                                }
                            ]
                        ]
                    }
                });
            }

            // Если пользователь пришел по реферальной ссылке
            if (referralCode) {
                await bot.sendMessage(chatId,
                    '🎁 <b>Вы пришли по приглашению!</b>\n\n' +
                    'Получите бонусы за регистрацию:\n' +
                    '• Дополнительные гадания\n' +
                    '• Скидка на премиум подписку\n' +
                    '• Эксклюзивные расклады\n\n' +
                    '<i>Магия дружбы умножает силу предсказаний!</i>', {
                    parse_mode: 'HTML'
                });
            }

            // Отправляем кнопку для открытия веб-приложения
            await bot.sendMessage(chatId, 
                '🔮 <b>Войдите в магический портал Mistika:</b>', {
                parse_mode: 'HTML',
                reply_markup: {
                    inline_keyboard: [[
                        {
                            text: '✨ Открыть Mistika',
                            web_app: { 
                                url: process.env.WEBAPP_URL || 'https://mistika.app' 
                            }
                        }
                    ]]
                }
            });

        } else {
            throw new Error(response.message || 'Ошибка аутентификации');
        }

    } catch (error) {
        logger.error('Ошибка в handleStart:', error);
        
        await bot.sendMessage(chatId, 
            '❌ <b>Произошла ошибка при входе</b>\n\n' +
            'Попробуйте еще раз через несколько секунд.\n' +
            'Если проблема повторяется, обратитесь в поддержку.', {
            parse_mode: 'HTML',
            reply_markup: {
                inline_keyboard: [[
                    {
                        text: '🔄 Попробовать снова',
                        callback_data: 'restart'
                    }
                ]]
            }
        });
    }
}

/**
 * Обработчик повторного запуска
 */
async function handleRestart(bot, callbackQuery) {
    const msg = callbackQuery.message;
    const user = callbackQuery.from;
    
    await bot.answerCallbackQuery(callbackQuery.id, {
        text: 'Перезапуск...'
    });
    
    // Удаляем предыдущее сообщение
    await bot.deleteMessage(msg.chat.id, msg.message_id);
    
    // Запускаем заново
    await handleStart(bot, { 
        chat: msg.chat, 
        from: user 
    });
}

/**
 * Обработчик информации о боте
 */
async function handleAbout(bot, msg) {
    const chatId = msg.chat.id;
    
    const aboutText = `
🔮 <b>MISTIKA - Ваш личный мистический советник</b>

<b>Возможности:</b>
• 🌅 Ежедневные карты Таро
• 🎴 Различные расклады карт
• 🔢 Нумерологические расчеты
• 🌙 Лунный календарь и ритуалы
• 🎯 Персональные предсказания
• 👥 Мистические круги с друзьями

<b>Премиум функции:</b>
• 🎨 Персональные колоды карт
• 🔮 Безлимитные гадания
• 🤖 AI интерпретации
• 🎙️ Голосовые вопросы
• 📸 Анализ фотографий
• 💎 NFT карты

<b>Версия:</b> 2.0
<b>Разработчик:</b> @mistika_support

<i>Доверьтесь магии, и она откроет вам тайны вселенной!</i>
    `;
    
    await bot.sendMessage(chatId, aboutText, {
        parse_mode: 'HTML',
        reply_markup: {
            inline_keyboard: [
                [
                    {
                        text: '💎 Премиум',
                        callback_data: 'premium_info'
                    },
                    {
                        text: '👥 Поддержка',
                        url: 'https://t.me/mistika_support'
                    }
                ],
                [
                    {
                        text: '🌐 Сайт',
                        url: 'https://mistika.app'
                    },
                    {
                        text: '📚 Гайд',
                        callback_data: 'help_guide'
                    }
                ]
            ]
        }
    });
}

/**
 * Обработчик гайда по использованию
 */
async function handleGuide(bot, callbackQuery) {
    const chatId = callbackQuery.message.chat.id;
    
    await bot.answerCallbackQuery(callbackQuery.id);
    
    const guideText = `
📚 <b>Гайд по использованию MISTIKA</b>

<b>🔥 Быстрый старт:</b>
1. Нажмите "🔮 Гадание" для карты дня
2. Откройте приложение для полного функционала
3. Задайте вопрос картам
4. Получите интерпретацию

<b>💡 Советы:</b>
• Формулируйте вопросы четко и конкретно
• Лучшее время для гадания - утром или вечером
• Доверяйте первому впечатлению от карт
• Ведите дневник предсказаний

<b>🎯 Типы вопросов:</b>
• Любовь и отношения ❤️
• Карьера и финансы 💼
• Здоровье и благополучие 🌱
• Духовное развитие ✨

<b>🌙 Лунные циклы:</b>
• Новолуние - время начинаний
• Растущая луна - для роста и развития
• Полнолуние - пик энергии и реализация
• Убывающая луна - для очищения и отпускания
    `;
    
    await bot.sendMessage(chatId, guideText, {
        parse_mode: 'HTML',
        reply_markup: {
            inline_keyboard: [[
                {
                    text: '🔮 Попробовать сейчас',
                    web_app: { 
                        url: process.env.WEBAPP_URL || 'https://mistika.app' 
                    }
                }
            ]]
        }
    });
}

module.exports = {
    handleStart,
    handleRestart,
    handleAbout,
    handleGuide
};