// bot/src/handlers/premium.js
const { formatPremiumFeatures, formatSubscriptionStatus } = require('../utils/messages');
const { createPremiumKeyboard, createSubscriptionKeyboard } = require('../utils/keyboards');

/**
 * Обработчик информации о премиум возможностях
 */
async function handlePremiumInfo(bot, callbackQuery, api) {
    const chatId = callbackQuery.message.chat.id;
    const userId = callbackQuery.from.id;

    try {
        await bot.answerCallbackQuery(callbackQuery.id);

        // Получаем информацию о текущей подписке
        const subscriptionResponse = await api.get('/payments/subscription');
        const subscription = subscriptionResponse.data.subscription;

        // Получаем доступные планы
        const plansResponse = await api.get('/payments/plans');
        const plans = plansResponse.data.plans;

        const premiumText = formatPremiumFeatures(subscription, plans);

        await bot.sendMessage(chatId, premiumText, {
            parse_mode: 'HTML',
            reply_markup: createPremiumKeyboard(subscription, plans)
        });

    } catch (error) {
        console.error('Ошибка получения информации о премиум:', error);
        
        await bot.sendMessage(chatId,
            '❌ <b>Ошибка</b>\n\n' +
            'Не удалось загрузить информацию о премиум возможностях.\n' +
            'Попробуйте позже.', {
            parse_mode: 'HTML',
            reply_markup: {
                inline_keyboard: [[
                    {
                        text: '🔄 Попробовать снова',
                        callback_data: 'premium_info'
                    }
                ]]
            }
        });
    }
}

/**
 * Обработчик выбора плана подписки
 */
async function handleSelectPlan(bot, callbackQuery, api) {
    const chatId = callbackQuery.message.chat.id;
    const userId = callbackQuery.from.id;
    const planId = callbackQuery.data.split('_')[2];

    try {
        await bot.answerCallbackQuery(callbackQuery.id, {
            text: 'Создаю платеж...'
        });

        // Создаем платеж
        const paymentResponse = await api.post('/payments/create', {
            planId: planId,
            paymentMethod: 'telegram'
        });

        if (paymentResponse.data.success) {
            const payment = paymentResponse.data.payment;
            
            await bot.sendMessage(chatId,
                '💳 <b>Оплата подписки</b>\n\n' +
                `💎 План: ${payment.planName}\n` +
                `💰 Сумма: ${payment.amount} ${payment.currency}\n\n` +
                '🔒 Безопасная оплата через Telegram', {
                parse_mode: 'HTML',
                reply_markup: {
                    inline_keyboard: [
                        [
                            {
                                text: '💳 Оплатить',
                                url: payment.paymentUrl
                            }
                        ],
                        [
                            {
                                text: '📋 Другие способы оплаты',
                                web_app: { 
                                    url: `${process.env.WEBAPP_URL}/premium/payment/${payment.id}` 
                                }
                            }
                        ],
                        [
                            {
                                text: '↩️ Назад к планам',
                                callback_data: 'premium_info'
                            }
                        ]
                    ]
                }
            });
        } else {
            throw new Error(paymentResponse.data.message);
        }

    } catch (error) {
        console.error('Ошибка создания платежа:', error);
        
        await bot.answerCallbackQuery(callbackQuery.id, {
            text: 'Ошибка создания платежа'
        });

        await bot.sendMessage(chatId,
            '❌ <b>Ошибка оплаты</b>\n\n' +
            'Не удалось создать платеж. Попробуйте позже или свяжитесь с поддержкой.', {
            parse_mode: 'HTML',
            reply_markup: {
                inline_keyboard: [
                    [
                        {
                            text: '🔄 Попробовать снова',
                            callback_data: `select_plan_${planId}`
                        }
                    ],
                    [
                        {
                            text: '💬 Поддержка',
                            url: 'https://t.me/mistika_support'
                        }
                    ]
                ]
            }
        });
    }
}

/**
 * Обработчик статуса подписки
 */
async function handleSubscriptionStatus(bot, callbackQuery, api) {
    const chatId = callbackQuery.message.chat.id;
    const userId = callbackQuery.from.id;

    try {
        await bot.answerCallbackQuery(callbackQuery.id);

        const response = await api.get('/payments/subscription');
        const subscription = response.data.subscription;

        const statusText = formatSubscriptionStatus(subscription);

        await bot.sendMessage(chatId, statusText, {
            parse_mode: 'HTML',
            reply_markup: createSubscriptionKeyboard(subscription)
        });

    } catch (error) {
        console.error('Ошибка получения статуса подписки:', error);
        
        await bot.sendMessage(chatId,
            '❌ Не удалось загрузить статус подписки', {
            reply_markup: {
                inline_keyboard: [[
                    {
                        text: '🔄 Обновить',
                        callback_data: 'subscription_status'
                    }
                ]]
            }
        });
    }
}

/**
 * Обработчик отмены подписки
 */
async function handleCancelSubscription(bot, callbackQuery, api) {
    const chatId = callbackQuery.message.chat.id;
    const userId = callbackQuery.from.id;

    try {
        // Показываем подтверждение
        await bot.sendMessage(chatId,
            '⚠️ <b>Отмена подписки</b>\n\n' +
            'Вы уверены, что хотите отменить подписку?\n\n' +
            '❗️ После отмены вы потеряете доступ к премиум функциям:\n' +
            '• Безлимитные гадания\n' +
            '• Эксклюзивные расклады\n' +
            '• AI анализ фотографий\n' +
            '• Персональные карты\n' +
            '• Приоритетная поддержка', {
            parse_mode: 'HTML',
            reply_markup: {
                inline_keyboard: [
                    [
                        {
                            text: '✅ Да, отменить',
                            callback_data: 'confirm_cancel_subscription'
                        }
                    ],
                    [
                        {
                            text: '❌ Нет, оставить',
                            callback_data: 'subscription_status'
                        }
                    ]
                ]
            }
        });

        await bot.answerCallbackQuery(callbackQuery.id);

    } catch (error) {
        console.error('Ошибка обработки отмены подписки:', error);
        await bot.answerCallbackQuery(callbackQuery.id, {
            text: 'Ошибка'
        });
    }
}

/**
 * Подтверждение отмены подписки
 */
async function handleConfirmCancelSubscription(bot, callbackQuery, api) {
    const chatId = callbackQuery.message.chat.id;
    const userId = callbackQuery.from.id;

    try {
        await bot.answerCallbackQuery(callbackQuery.id, {
            text: 'Отменяю подписку...'
        });

        const response = await api.post('/payments/cancel-subscription');
        
        if (response.data.success) {
            await bot.editMessageText(
                '✅ <b>Подписка отменена</b>\n\n' +
                'Ваша подписка успешно отменена.\n' +
                'Премиум функции будут доступны до окончания текущего периода.\n\n' +
                '💡 Вы можете возобновить подписку в любое время!', {
                chat_id: chatId,
                message_id: callbackQuery.message.message_id,
                parse_mode: 'HTML',
                reply_markup: {
                    inline_keyboard: [
                        [
                            {
                                text: '🔄 Возобновить подписку',
                                callback_data: 'premium_info'
                            }
                        ],
                        [
                            {
                                text: '📊 Статус подписки',
                                callback_data: 'subscription_status'
                            }
                        ]
                    ]
                }
            });
        } else {
            throw new Error(response.data.message);
        }

    } catch (error) {
        console.error('Ошибка отмены подписки:', error);
        
        await bot.answerCallbackQuery(callbackQuery.id, {
            text: 'Ошибка отмены'
        });

        await bot.editMessageText(
            '❌ <b>Ошибка</b>\n\n' +
            'Не удалось отменить подписку. Попробуйте позже или обратитесь в поддержку.', {
            chat_id: chatId,
            message_id: callbackQuery.message.message_id,
            parse_mode: 'HTML',
            reply_markup: {
                inline_keyboard: [
                    [
                        {
                            text: '🔄 Попробовать снова',
                            callback_data: 'cancel_subscription'
                        }
                    ],
                    [
                        {
                            text: '💬 Поддержка',
                            url: 'https://t.me/mistika_support'
                        }
                    ]
                ]
            }
        });
    }
}

/**
 * Обработчик истории платежей
 */
async function handlePaymentHistory(bot, callbackQuery, api) {
    const chatId = callbackQuery.message.chat.id;
    const userId = callbackQuery.from.id;

    try {
        await bot.answerCallbackQuery(callbackQuery.id, {
            text: 'Загружаю историю...'
        });

        const response = await api.get('/payments/history?limit=5');
        
        if (response.data.success && response.data.history.payments.length > 0) {
            let historyText = '📋 <b>История платежей</b>\n\n';
            
            response.data.history.payments.forEach((payment, index) => {
                const date = new Date(payment.createdAt).toLocaleDateString('ru-RU');
                const status = payment.status === 'completed' ? '✅' : payment.status === 'pending' ? '⏳' : '❌';
                historyText += `${index + 1}. ${date} - ${payment.amount} ${payment.currency} ${status}\n`;
                historyText += `   ${payment.planName}\n\n`;
            });

            historyText += '💡 <i>Полная история доступна в приложении</i>';

            await bot.sendMessage(chatId, historyText, {
                parse_mode: 'HTML',
                reply_markup: {
                    inline_keyboard: [
                        [
                            {
                                text: '📱 Открыть в приложении',
                                web_app: { 
                                    url: `${process.env.WEBAPP_URL}/premium/history` 
                                }
                            }
                        ],
                        [
                            {
                                text: '📊 Статус подписки',
                                callback_data: 'subscription_status'
                            }
                        ]
                    ]
                }
            });
        } else {
            await bot.sendMessage(chatId,
                '📋 <b>История платежей пуста</b>\n\n' +
                'У вас пока нет платежей.\n' +
                'Оформите премиум подписку!', {
                parse_mode: 'HTML',
                reply_markup: {
                    inline_keyboard: [[
                        {
                            text: '💎 Оформить подписку',
                            callback_data: 'premium_info'
                        }
                    ]]
                }
            });
        }

    } catch (error) {
        console.error('Ошибка получения истории платежей:', error);
        
        await bot.sendMessage(chatId,
            '❌ Не удалось загрузить историю платежей', {
            reply_markup: {
                inline_keyboard: [[
                    {
                        text: '🔄 Попробовать снова',
                        callback_data: 'payment_history'
                    }
                ]]
            }
        });
    }
}

module.exports = {
    handlePremiumInfo,
    handleSelectPlan,
    handleSubscriptionStatus,
    handleCancelSubscription,
    handleConfirmCancelSubscription,
    handlePaymentHistory
};