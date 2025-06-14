// bot/src/handlers/premium.js
const apiService = require('../services/api');
const logger = require('../utils/logger');

/**
 * Получение читаемого названия плана подписки
 */
function getSubscriptionPlanName(planId) {
    const planNames = {
        'monthly_premium': 'Месячный Premium',
        'yearly_premium': 'Годовой Premium',
        'yearly_premium_plus': 'Годовой Premium Plus'
    };
    return planNames[planId] || planId;
}

/**
 * Обработчик команды /premium - показ планов подписки
 */
async function handlePremium(bot, msg, userToken) {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    try {
        // Получаем статус подписки пользователя
        const subscriptionResponse = await apiService.get(`/api/v1/payments/subscription/${userId}`);
        const { isPremium, subscription } = subscriptionResponse;

        if (isPremium && subscription) {
            // Пользователь уже имеет премиум
            const daysLeft = subscription.daysLeft;
            const expiresAt = new Date(subscription.endDate).toLocaleDateString('ru-RU');
            const tier = subscription.tier || 'premium';
            const isPremiumPlus = tier === 'premium_plus';
            
            let featuresText = '✨ <b>Ваши возможности:</b>\n' +
                '• Безлимитные гадания\n' +
                '• Все расклады Таро\n' +
                '• ИИ-анализ карт\n' +
                '• Генерация изображений\n' +
                '• Экспорт раскладов в PDF\n' +
                '• Расширенная нумерология\n' +
                '• Голосовой ввод вопросов';
            
            if (isPremiumPlus) {
                featuresText += '\n• Приоритетная поддержка\n' +
                    '• Эксклюзивные расклады\n' +
                    '• Анализ фотографий\n' +
                    '• NFT коллекционные карты\n' +
                    '• Детальная аналитика';
            }
            
            await bot.sendMessage(chatId,
                `💎 <b>У вас активна ${isPremiumPlus ? 'Premium Plus' : 'Premium'} подписка!</b>\n\n` +
                `📅 <b>Действует до:</b> ${expiresAt}\n` +
                `⏰ <b>Осталось дней:</b> ${daysLeft}\n` +
                `📦 <b>План:</b> ${getSubscriptionPlanName(subscription.planId)}\n\n` +
                featuresText, {
                parse_mode: 'HTML',
                reply_markup: {
                    inline_keyboard: [
                        [
                            {
                                text: '🔮 Открыть приложение',
                                web_app: { url: `${process.env.WEBAPP_URL || 'https://mystika.systems.cv'}/spreads` }
                            }
                        ],
                        [
                            {
                                text: '📊 Моя статистика',
                                web_app: { url: `${process.env.WEBAPP_URL || 'https://mystika.systems.cv'}/profile` }
                            }
                        ]
                    ]
                }
            });
            return;
        }

        // Показываем планы подписки
        await showSubscriptionPlans(bot, chatId, userId);

    } catch (error) {
        logger.error('Premium handler error:', error.message);
        await bot.sendMessage(chatId,
            '❌ <b>Ошибка получения информации о подписке</b>\n\n' +
            'Попробуйте еще раз через несколько секунд.', {
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
 * Показ планов подписки
 */
async function showSubscriptionPlans(bot, chatId, userId) {
    try {
        const plansResponse = await apiService.get('/api/v1/payments/plans');
        const { plans } = plansResponse;

        let plansText = '💎 <b>MISTIKA Premium</b>\n\n' +
            '🌟 <b>Откройте полный потенциал мистических практик!</b>\n\n';

        const keyboards = [];

        plans.forEach((plan, index) => {
            const isYearly = plan.id.includes('yearly');
            const isPremiumPlus = plan.id.includes('premium_plus');
            let savings = '';
            
            if (isYearly && !isPremiumPlus) {
                savings = ' 🔥 СКИДКА 40%';
            } else if (isPremiumPlus) {
                savings = ' ⭐ VIP';
            }
            
            plansText += `${index + 1}. <b>${plan.name}</b>${savings}\n`;
            plansText += `   💰 ${plan.price} ⭐ Stars\n`;
            plansText += `   📅 ${plan.duration} дней\n`;
            plansText += `   📝 ${plan.description}\n\n`;

            keyboards.push([{
                text: `${isPremiumPlus ? '⭐ ' : isYearly ? '🔥 ' : ''}${plan.name} - ${plan.price} ⭐`,
                callback_data: `buy_premium_${plan.id}`
            }]);
        });

        plansText += '✨ <b>Что входит в Premium:</b>\n';
        plans[0].features.forEach(feature => {
            plansText += `• ${feature}\n`;
        });

        keyboards.push([
            {
                text: '💫 Как получить Stars?',
                callback_data: 'how_to_get_stars'
            }
        ]);

        await bot.sendMessage(chatId, plansText, {
            parse_mode: 'HTML',
            reply_markup: {
                inline_keyboard: keyboards
            }
        });

    } catch (error) {
        logger.error('Show subscription plans error:', error.message);
        throw error;
    }
}

/**
 * Обработчик покупки премиум подписки
 */
async function handleBuyPremium(bot, callbackQuery, userToken) {
    logger.info('handleBuyPremium called', { callbackQuery, userToken });
    
    const chatId = callbackQuery.message.chat.id;
    const userId = callbackQuery.from.id;
    const planId = callbackQuery.data.replace('buy_premium_', '');

    try {
        logger.info('Starting premium purchase', { userId, planId, chatId });

        // Создаем Telegram Stars invoice
        logger.info('Creating stars invoice', { planId, userId });
        const invoiceResponse = await apiService.post('/api/v1/payments/stars/invoice', {
            planId: planId,
            userId: userId
        }, {
            headers: {
                'Authorization': `Bearer ${userToken}`
            }
        });

        logger.info('Invoice response received', { invoiceResponse });
        const { invoice } = invoiceResponse;

        // Отправляем invoice пользователю
        await bot.sendInvoice(chatId, 
            invoice.title,
            invoice.description,
            invoice.payload,
            invoice.provider_token,
            invoice.currency,
            invoice.prices,
            {
                start_parameter: invoice.start_parameter,
                photo_url: invoice.photo_url,
                photo_width: invoice.photo_width,
                photo_height: invoice.photo_height,
                need_name: invoice.need_name,
                need_phone_number: invoice.need_phone_number,
                need_email: invoice.need_email,
                need_shipping_address: invoice.need_shipping_address,
                send_phone_number_to_provider: invoice.send_phone_number_to_provider,
                send_email_to_provider: invoice.send_email_to_provider,
                is_flexible: invoice.is_flexible
            });

        logger.info('Invoice sent successfully', {
            userId: userId,
            planId: planId,
            price: invoiceResponse.price
        });

    } catch (error) {
        logger.error('Buy premium error:', { 
            message: error.message, 
            stack: error.stack,
            userId: userId,
            planId: planId,
            chatId: chatId
        });

        await bot.sendMessage(chatId,
            '❌ <b>Не удалось создать invoice</b>\n\n' +
            'Попробуйте еще раз или обратитесь в поддержку.', {
            parse_mode: 'HTML',
            reply_markup: {
                inline_keyboard: [[
                    {
                        text: '🔄 Попробовать снова',
                        callback_data: `buy_premium_${planId}`
                    }
                ]]
            }
        });
    }
}

/**
 * Информация о том, как получить Telegram Stars
 */
async function handleHowToGetStars(bot, callbackQuery) {
    const chatId = callbackQuery.message.chat.id;

    try {
        await bot.answerCallbackQuery(callbackQuery.id);

        await bot.sendMessage(chatId,
            '⭐ <b>Как получить Telegram Stars?</b>\n\n' +
            '🔸 <b>В мобильном приложении Telegram:</b>\n' +
            '1. Откройте Настройки\n' +
            '2. Выберите "Telegram Stars"\n' +
            '3. Нажмите "Купить Stars"\n' +
            '4. Выберите количество и оплатите\n\n' +
            '🔸 <b>В Telegram Premium:</b>\n' +
            '• Получайте Stars бесплатно каждый месяц\n\n' +
            '🔸 <b>Способы оплаты:</b>\n' +
            '• Банковская карта\n' +
            '• Apple Pay / Google Pay\n' +
            '• Telegram Wallet\n\n' +
            '💡 <b>1 Star ≈ 0.014 USD</b>\n' +
            'Месячная подписка (50 ⭐) ≈ 0.70 USD\n' +
            'Годовая подписка (360 ⭐) ≈ 5.04 USD', {
            parse_mode: 'HTML',
            reply_markup: {
                inline_keyboard: [
                    [
                        {
                            text: '💎 Выбрать план подписки',
                            callback_data: 'premium_info'
                        }
                    ],
                    [
                        {
                            text: '🌐 Подробнее о Stars',
                            url: 'https://telegram.org/blog/telegram-stars'
                        }
                    ]
                ]
            }
        });

    } catch (error) {
        logger.error('How to get stars error:', error.message);
        await bot.answerCallbackQuery(callbackQuery.id, {
            text: 'Ошибка загрузки информации'
        });
    }
}

/**
 * Обработчик информации о премиум возможностях (callback)
 */
async function handlePremiumInfo(bot, callbackQuery, userToken) {
    const chatId = callbackQuery.message.chat.id;
    const userId = callbackQuery.from.id;

    try {
        await bot.answerCallbackQuery(callbackQuery.id);
        await showSubscriptionPlans(bot, chatId, userId);
    } catch (error) {
        logger.error('Premium info callback error:', error.message);
        await bot.answerCallbackQuery(callbackQuery.id, {
            text: 'Ошибка загрузки информации'
        });
    }
}

/**
 * Обработка pre-checkout запроса
 */
async function handlePreCheckoutQuery(bot, preCheckoutQuery) {
    const { id, invoice_payload, total_amount, currency, from } = preCheckoutQuery;
    
    try {
        
        logger.info('Pre-checkout query received', {
            queryId: id,
            payload: invoice_payload,
            amount: total_amount,
            currency: currency,
            userId: from.id
        });

        // Отправляем данные на сервер для валидации
        const response = await apiService.post('/api/v1/payments/stars/pre-checkout', {
            id: id,
            invoice_payload: invoice_payload,
            total_amount: total_amount,
            currency: currency,
            user_id: from.id
        });

        // Отвечаем Telegram на pre-checkout query
        logger.info('Server response received', { 
            queryId: id, 
            response: response
        });
        
        logger.info('Answering pre-checkout query', { 
            queryId: id, 
            ok: response.ok, 
            errorMessage: response.error_message 
        });
        
        await bot.answerPreCheckoutQuery(id, response.ok, {
            error_message: response.error_message
        });

    } catch (error) {
        logger.error('Pre-checkout query error:', {
            message: error.message,
            stack: error.stack,
            queryId: id,
            userId: from.id
        });
        
        try {
            await bot.answerPreCheckoutQuery(preCheckoutQuery.id, false, {
                error_message: 'Внутренняя ошибка сервера'
            });
        } catch (answerError) {
            logger.error('Failed to answer pre-checkout query:', answerError.message);
        }
    }
}

/**
 * Обработка успешного платежа
 */
async function handleSuccessfulPayment(bot, msg) {
    try {
        const { successful_payment } = msg;
        const chatId = msg.chat.id;
        const userId = msg.from.id;

        logger.info('Successful payment received', {
            userId: userId,
            payment: successful_payment,
            telegramChargeId: successful_payment?.telegram_payment_charge_id,
            totalAmount: successful_payment?.total_amount
        });

        // Отправляем данные о платеже на сервер
        const response = await apiService.post('/api/v1/payments/stars/successful-payment', {
            telegram_payment_charge_id: successful_payment.telegram_payment_charge_id,
            provider_payment_charge_id: successful_payment.provider_payment_charge_id,
            invoice_payload: successful_payment.invoice_payload,
            total_amount: successful_payment.total_amount,
            currency: successful_payment.currency
        });

        if (response.success) {
            const { subscription } = response;
            const expiresAt = new Date(subscription.expiresAt).toLocaleDateString('ru-RU');
            
            await bot.sendMessage(chatId,
                '🎉 <b>Поздравляем! Премиум подписка активирована!</b>\n\n' +
                `💎 <b>План:</b> ${subscription.planId === 'monthly_premium' ? 'Месячный' : 'Годовой'}\n` +
                `📅 <b>Действует до:</b> ${expiresAt}\n\n` +
                '✨ <b>Теперь вам доступно:</b>\n' +
                '• Безлимитные гадания\n' +
                '• Все расклады Таро\n' +
                '• ИИ-анализ карт\n' +
                '• Генерация изображений\n' +
                '• Персональные рекомендации\n\n' +
                '🚀 <b>Начните пользоваться прямо сейчас!</b>', {
                parse_mode: 'HTML',
                reply_markup: {
                    inline_keyboard: [
                        [
                            {
                                text: '🔮 Открыть приложение',
                                web_app: { url: `${process.env.WEBAPP_URL || 'https://mystika.systems.cv'}` }
                            }
                        ],
                        [
                            {
                                text: '🌅 Карта дня',
                                callback_data: 'daily_card'
                            },
                            {
                                text: '🌙 Лунный календарь',
                                callback_data: 'lunar_today'
                            }
                        ]
                    ]
                }
            });
        } else {
            throw new Error(response.message || 'Payment processing failed');
        }

    } catch (error) {
        logger.error('Successful payment handling error:', error.message);
        
        await bot.sendMessage(msg.chat.id,
            '⚠️ <b>Платеж получен, но возникла ошибка при активации</b>\n\n' +
            'Обратитесь в поддержку для решения вопроса.\n' +
            'Ваш платеж будет обработан вручную.', {
            parse_mode: 'HTML',
            reply_markup: {
                inline_keyboard: [[
                    {
                        text: '📞 Связаться с поддержкой',
                        url: 'https://t.me/mistika_support'
                    }
                ]]
            }
        });
    }
}

/**
 * Обработчик callback для премиум функций
 */
async function handlePremiumCallback(bot, query, api) {
    const data = query.data;
    
    if (data === 'premium_info') {
        await handlePremiumInfo(bot, query, api);
    } else if (data === 'premium_plans') {
        await showSubscriptionPlans(bot, query, api);
    } else if (data.startsWith('buy_premium_')) {
        await handleBuyPremium(bot, query, api);
    } else if (data === 'how_to_get_stars') {
        await handleHowToGetStars(bot, query, api);
    }
}

module.exports = {
    handlePremium,
    handlePremiumCallback,
    showSubscriptionPlans,
    handleBuyPremium,
    handleHowToGetStars,
    handlePremiumInfo,
    handlePreCheckoutQuery,
    handleSuccessfulPayment
};