// bot/src/handlers/referral.js
const { formatReferralStats, formatReferralProgram } = require('../utils/messages');
const { createReferralKeyboard } = require('../utils/keyboards');

/**
 * Обработчик реферальной программы
 */
async function handleReferralProgram(bot, callbackQuery, api) {
    const chatId = callbackQuery.message.chat.id;
    const userId = callbackQuery.from.id;

    try {
        await bot.answerCallbackQuery(callbackQuery.id);

        // Получаем реферальную статистику пользователя
        const response = await api.get('/auth/referral-stats');
        const referralData = response.data;

        const programText = formatReferralProgram(referralData);

        await bot.sendMessage(chatId, programText, {
            parse_mode: 'HTML',
            reply_markup: createReferralKeyboard(referralData.referralCode)
        });

    } catch (error) {
        console.error('Ошибка получения реферальной программы:', error);
        
        await bot.sendMessage(chatId,
            '❌ <b>Ошибка</b>\n\n' +
            'Не удалось загрузить информацию о реферальной программе.\n' +
            'Попробуйте позже.', {
            parse_mode: 'HTML',
            reply_markup: {
                inline_keyboard: [[
                    {
                        text: '🔄 Попробовать снова',
                        callback_data: 'referral_program'
                    }
                ]]
            }
        });
    }
}

/**
 * Обработчик статистики рефералов
 */
async function handleReferralStats(bot, callbackQuery, api) {
    const chatId = callbackQuery.message.chat.id;
    const userId = callbackQuery.from.id;

    try {
        await bot.answerCallbackQuery(callbackQuery.id, {
            text: 'Загружаю статистику...'
        });

        const response = await api.get('/auth/referral-stats');
        const stats = response.data;

        const statsText = formatReferralStats(stats);

        await bot.sendMessage(chatId, statsText, {
            parse_mode: 'HTML',
            reply_markup: {
                inline_keyboard: [
                    [
                        {
                            text: '🔗 Поделиться ссылкой',
                            callback_data: 'share_referral_link'
                        }
                    ],
                    [
                        {
                            text: '🎁 Мои награды',
                            callback_data: 'referral_rewards'
                        }
                    ],
                    [
                        {
                            text: '📊 Реферальная программа',
                            callback_data: 'referral_program'
                        }
                    ]
                ]
            }
        });

    } catch (error) {
        console.error('Ошибка получения статистики рефералов:', error);
        
        await bot.sendMessage(chatId,
            '❌ Не удалось загрузить статистику рефералов', {
            reply_markup: {
                inline_keyboard: [[
                    {
                        text: '🔄 Попробовать снова',
                        callback_data: 'referral_stats'
                    }
                ]]
            }
        });
    }
}

/**
 * Обработчик приглашения друзей
 */
async function handleInviteFriends(bot, callbackQuery, api) {
    const chatId = callbackQuery.message.chat.id;
    const userId = callbackQuery.from.id;

    try {
        await bot.answerCallbackQuery(callbackQuery.id);

        // Получаем реферальную ссылку
        const response = await api.get('/auth/referral-link');
        const { referralLink, referralCode } = response.data;

        const inviteText = 
            '🎁 <b>Приглашай друзей и получай бонусы!</b>\n\n' +
            '✨ <b>За каждого друга вы получите:</b>\n' +
            '• 🎯 3 дня бесплатного премиума\n' +
            '• 🎴 10 бесплатных раскладов\n' +
            '• 🔮 Эксклюзивные карты\n\n' +
            '🌟 <b>Ваш друг получит:</b>\n' +
            '• 🎁 Приветственный бонус\n' +
            '• 🎴 5 бесплатных гаданий\n' +
            '• 🔓 Доступ к премиум функциям на 1 день\n\n' +
            `🔗 <b>Ваш реферальный код:</b> <code>${referralCode}</code>\n\n` +
            '👇 <i>Поделитесь ссылкой с друзьями:</i>';

        await bot.sendMessage(chatId, inviteText, {
            parse_mode: 'HTML',
            reply_markup: {
                inline_keyboard: [
                    [
                        {
                            text: '📤 Поделиться ссылкой',
                            switch_inline_query: `🎴 Попробуй мистическое Таро-приложение! Получи бесплатные гадания по моей ссылке: ${referralLink}`
                        }
                    ],
                    [
                        {
                            text: '📋 Копировать ссылку',
                            callback_data: 'copy_referral_link'
                        },
                        {
                            text: '📱 Открыть ссылку',
                            url: referralLink
                        }
                    ],
                    [
                        {
                            text: '📊 Моя статистика',
                            callback_data: 'referral_stats'
                        }
                    ]
                ]
            }
        });

    } catch (error) {
        console.error('Ошибка приглашения друзей:', error);
        
        await bot.sendMessage(chatId,
            '❌ Не удалось получить реферальную ссылку', {
            reply_markup: {
                inline_keyboard: [[
                    {
                        text: '🔄 Попробовать снова',
                        callback_data: 'invite_friends'
                    }
                ]]
            }
        });
    }
}

/**
 * Обработчик копирования реферальной ссылки
 */
async function handleCopyReferralLink(bot, callbackQuery, api) {
    const chatId = callbackQuery.message.chat.id;
    const userId = callbackQuery.from.id;

    try {
        const response = await api.get('/auth/referral-link');
        const { referralLink } = response.data;

        await bot.answerCallbackQuery(callbackQuery.id, {
            text: 'Ссылка скопирована! 📋'
        });

        await bot.sendMessage(chatId,
            `🔗 <b>Ваша реферальная ссылка:</b>\n\n` +
            `<code>${referralLink}</code>\n\n` +
            '📋 <i>Ссылка скопирована в буфер обмена.\n' +
            'Отправьте её друзьям!</i>', {
            parse_mode: 'HTML',
            reply_markup: {
                inline_keyboard: [
                    [
                        {
                            text: '📤 Поделиться',
                            switch_inline_query: `🎴 Попробуй мистическое Таро-приложение! ${referralLink}`
                        }
                    ],
                    [
                        {
                            text: '🎁 Пригласить друзей',
                            callback_data: 'invite_friends'
                        }
                    ]
                ]
            }
        });

    } catch (error) {
        console.error('Ошибка копирования ссылки:', error);
        await bot.answerCallbackQuery(callbackQuery.id, {
            text: 'Ошибка копирования ссылки'
        });
    }
}

/**
 * Обработчик наград рефералов
 */
async function handleReferralRewards(bot, callbackQuery, api) {
    const chatId = callbackQuery.message.chat.id;
    const userId = callbackQuery.from.id;

    try {
        await bot.answerCallbackQuery(callbackQuery.id, {
            text: 'Загружаю награды...'
        });

        const response = await api.get('/auth/referral-rewards');
        const rewards = response.data.rewards;

        if (rewards.length > 0) {
            let rewardsText = '🎁 <b>Ваши реферальные награды:</b>\n\n';
            
            rewards.forEach((reward, index) => {
                const date = new Date(reward.earnedAt).toLocaleDateString('ru-RU');
                const statusEmoji = reward.claimed ? '✅' : '🎁';
                
                rewardsText += `${statusEmoji} <b>${reward.type}</b>\n`;
                rewardsText += `📅 ${date}\n`;
                rewardsText += `👤 За пользователя: ${reward.referredUserName || 'Скрыто'}\n`;
                
                if (!reward.claimed) {
                    rewardsText += '❗️ <i>Готово к получению</i>\n';
                }
                
                rewardsText += '\n';
            });

            const unclaimedRewards = rewards.filter(r => !r.claimed);
            
            const keyboard = [];
            
            if (unclaimedRewards.length > 0) {
                keyboard.push([
                    {
                        text: `🎁 Получить награды (${unclaimedRewards.length})`,
                        callback_data: 'claim_referral_rewards'
                    }
                ]);
            }
            
            keyboard.push([
                {
                    text: '📊 Статистика рефералов',
                    callback_data: 'referral_stats'
                }
            ]);

            await bot.sendMessage(chatId, rewardsText, {
                parse_mode: 'HTML',
                reply_markup: {
                    inline_keyboard: keyboard
                }
            });
        } else {
            await bot.sendMessage(chatId,
                '🎁 <b>Награды за рефералов</b>\n\n' +
                'У вас пока нет наград.\n' +
                'Приглашайте друзей и получайте бонусы!', {
                parse_mode: 'HTML',
                reply_markup: {
                    inline_keyboard: [
                        [
                            {
                                text: '🎯 Пригласить друзей',
                                callback_data: 'invite_friends'
                            }
                        ],
                        [
                            {
                                text: '📋 Правила программы',
                                callback_data: 'referral_program'
                            }
                        ]
                    ]
                }
            });
        }

    } catch (error) {
        console.error('Ошибка получения наград:', error);
        
        await bot.sendMessage(chatId,
            '❌ Не удалось загрузить награды', {
            reply_markup: {
                inline_keyboard: [[
                    {
                        text: '🔄 Попробовать снова',
                        callback_data: 'referral_rewards'
                    }
                ]]
            }
        });
    }
}

/**
 * Обработчик получения наград
 */
async function handleClaimReferralRewards(bot, callbackQuery, api) {
    const chatId = callbackQuery.message.chat.id;
    const userId = callbackQuery.from.id;

    try {
        await bot.answerCallbackQuery(callbackQuery.id, {
            text: 'Получаю награды...'
        });

        const response = await api.post('/auth/claim-referral-rewards');
        
        if (response.data.success) {
            const claimedRewards = response.data.claimedRewards;
            
            let rewardsText = '🎉 <b>Награды получены!</b>\n\n';
            
            claimedRewards.forEach(reward => {
                rewardsText += `✅ ${reward.description}\n`;
            });
            
            rewardsText += '\n🎊 <i>Награды добавлены на ваш аккаунт!</i>';

            await bot.editMessageText(rewardsText, {
                chat_id: chatId,
                message_id: callbackQuery.message.message_id,
                parse_mode: 'HTML',
                reply_markup: {
                    inline_keyboard: [
                        [
                            {
                                text: '🎴 Использовать бонусы',
                                web_app: { 
                                    url: `${process.env.WEBAPP_URL}/spreads` 
                                }
                            }
                        ],
                        [
                            {
                                text: '📊 Моя статистика',
                                callback_data: 'referral_stats'
                            }
                        ]
                    ]
                }
            });
        } else {
            throw new Error(response.data.message);
        }

    } catch (error) {
        console.error('Ошибка получения наград:', error);
        
        await bot.answerCallbackQuery(callbackQuery.id, {
            text: 'Ошибка получения наград'
        });
    }
}

module.exports = {
    handleReferralProgram,
    handleReferralStats,
    handleInviteFriends,
    handleCopyReferralLink,
    handleReferralRewards,
    handleClaimReferralRewards
};