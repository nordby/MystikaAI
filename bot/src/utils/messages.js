// bot/src/utils/messages.js

/**
 * Форматирование приветственного сообщения
 */
function formatWelcomeMessage(user, isNewUser = false) {
    const greeting = isNewUser ? 'Добро пожаловать' : 'С возвращением';
    
    return `🔮 <b>${greeting}, ${user.firstName}!</b>\n\n` +
           '✨ <b>MISTIKA</b> — это ваш персональный мистический помощник.\n\n' +
           '🎴 <b>Что я умею:</b>\n' +
           '• 🌅 Дневные карты Таро\n' +
           '• 🎯 Различные расклады\n' +
           '• 🔢 Нумерологические расчеты\n' +
           '• 🌙 Лунный календарь\n' +
           '• 📸 Анализ фотографий (Премиум)\n' +
           '• 🎤 Голосовые гадания (Премиум)\n\n' +
           '🎁 <b>Бонус для новичков:</b>\n' +
           '• 3 бесплатных гадания\n' +
           '• Доступ к базовым раскладам\n' +
           '• Ежедневная карта\n\n' +
           '👇 <i>Выберите, что хотите узнать:</i>';
}

/**
 * Форматирование сообщения с картой
 */
function formatCardMessage(card, isReversed, interpretation, date = null) {
    const reversedText = isReversed ? ' (Перевернутая)' : '';
    const dateText = date ? `\n📅 <i>${new Date(date).toLocaleDateString('ru-RU')}</i>` : '';
    
    return `🎴 <b>${card.card_name}${reversedText}</b>\n\n` +
           `🃏 <i>${card.suit} - ${card.card_type}</i>\n\n` +
           `💫 <b>Значение:</b>\n${interpretation}\n\n` +
           `🔮 <b>Ключевые слова:</b>\n${isReversed ? card.keywords_reversed : card.keywords_upright}${dateText}`;
}

/**
 * Форматирование сообщения дневной карты
 */
function formatDailyCardMessage(cardData) {
    const { card, isReversed, interpretation, date } = cardData;
    
    return `🌅 <b>Ваша карта дня</b>\n\n` +
           formatCardMessage(card, isReversed, interpretation, date) + '\n\n' +
           '💡 <i>Держите эту энергию в сердце весь день!</i>';
}

/**
 * Форматирование премиум возможностей
 */
function formatPremiumFeatures(subscription, plans) {
    const isPremium = subscription && subscription.status === 'active';
    
    let text = '💎 <b>ПРЕМИУМ ВОЗМОЖНОСТИ</b>\n\n';
    
    if (isPremium) {
        text += '✅ <b>У вас активна премиум подписка!</b>\n\n';
        text += `📅 Действует до: ${new Date(subscription.expiresAt).toLocaleDateString('ru-RU')}\n\n`;
    }
    
    text += '🌟 <b>Премиум включает:</b>\n' +
            '• 🎴 Безлимитные гадания\n' +
            '• 🎯 Эксклюзивные расклады\n' +
            '• 🤖 AI анализ фотографий\n' +
            '• 🎤 Голосовые гадания\n' +
            '• 🎨 Персональные карты\n' +
            '• 🔮 Детальные интерпретации\n' +
            '• 📊 Подробная статистика\n' +
            '• ⚡ Приоритетная поддержка\n' +
            '• 🎁 Ранний доступ к новинкам\n\n';
    
    if (!isPremium && plans && plans.length > 0) {
        text += '💰 <b>Тарифы:</b>\n';
        plans.forEach(plan => {
            text += `• ${plan.name}: ${plan.price} ${plan.currency}/${plan.period}\n`;
        });
        text += '\n';
    }
    
    text += isPremium ? 
            '🎉 <i>Наслаждайтесь всеми возможностями!</i>' :
            '🎯 <i>Откройте полный потенциал мистических практик!</i>';
    
    return text;
}

/**
 * Форматирование статуса подписки
 */
function formatSubscriptionStatus(subscription) {
    if (!subscription || subscription.status !== 'active') {
        return '📊 <b>Статус подписки</b>\n\n' +
               '❌ <b>Подписка неактивна</b>\n\n' +
               'Оформите премиум подписку для доступа ко всем возможностям!';
    }
    
    const expiresAt = new Date(subscription.expiresAt);
    const now = new Date();
    const daysLeft = Math.ceil((expiresAt - now) / (1000 * 60 * 60 * 24));
    
    let statusText = '📊 <b>Статус подписки</b>\n\n' +
                     `✅ <b>Премиум активен</b>\n` +
                     `💎 План: ${subscription.planName}\n` +
                     `📅 Действует до: ${expiresAt.toLocaleDateString('ru-RU')}\n` +
                     `⏰ Осталось дней: ${daysLeft}\n\n`;
    
    if (daysLeft <= 3) {
        statusText += '⚠️ <b>Подписка скоро истекает!</b>\n' +
                     'Продлите подписку, чтобы не потерять доступ к премиум функциям.\n\n';
    }
    
    statusText += subscription.autoRenew ? 
                  '🔄 <i>Автопродление включено</i>' :
                  '⏸️ <i>Автопродление отключено</i>';
    
    return statusText;
}

/**
 * Форматирование реферальной программы
 */
function formatReferralProgram(referralData) {
    return '🎁 <b>РЕФЕРАЛЬНАЯ ПРОГРАММА</b>\n\n' +
           '👥 <b>Приглашайте друзей и получайте бонусы!</b>\n\n' +
           '🎯 <b>За каждого приглашенного друга:</b>\n' +
           '• 💎 3 дня премиума\n' +
           '• 🎴 10 бесплатных гаданий\n' +
           '• 🌟 Эксклюзивные карты\n\n' +
           '🎁 <b>Ваш друг получит:</b>\n' +
           '• 🎊 Приветственный бонус\n' +
           '• 🎴 5 бесплатных гаданий\n' +
           '• 💎 1 день премиума\n\n' +
           `📊 <b>Ваша статистика:</b>\n` +
           `👥 Приглашено: ${referralData.totalReferrals || 0}\n` +
           `🎁 Бонусы получены: ${referralData.totalRewards || 0}\n` +
           `🔗 Ваш код: <code>${referralData.referralCode}</code>\n\n` +
           '📱 <i>Поделитесь ссылкой с друзьями!</i>';
}

/**
 * Форматирование статистики рефералов
 */
function formatReferralStats(stats) {
    return `📊 <b>СТАТИСТИКА РЕФЕРАЛОВ</b>\n\n` +
           `👥 <b>Всего приглашено:</b> ${stats.totalReferrals || 0}\n` +
           `✅ <b>Активных рефералов:</b> ${stats.activeReferrals || 0}\n` +
           `🎁 <b>Всего наград:</b> ${stats.totalRewards || 0}\n` +
           `💎 <b>Бонусных дней:</b> ${stats.bonusDays || 0}\n` +
           `🎴 <b>Бонусных гаданий:</b> ${stats.bonusReadings || 0}\n\n` +
           `🔗 <b>Ваш код:</b> <code>${stats.referralCode}</code>\n\n` +
           `📈 <b>Прогресс до следующей награды:</b>\n` +
           `${stats.progressToNext || 0}/5 рефералов`;
}

/**
 * Форматирование нумерологического анализа
 */
function formatNumerologyReading(numerologyData) {
    const { lifePathNumber, destinyNumber, personalityNumber, analysis } = numerologyData;
    
    return `🔢 <b>НУМЕРОЛОГИЧЕСКИЙ АНАЛИЗ</b>\n\n` +
           `🎯 <b>Число жизненного пути:</b> ${lifePathNumber}\n` +
           `${analysis.lifePath}\n\n` +
           `⭐ <b>Число судьбы:</b> ${destinyNumber}\n` +
           `${analysis.destiny}\n\n` +
           `🎭 <b>Число личности:</b> ${personalityNumber}\n` +
           `${analysis.personality}\n\n` +
           `💫 <b>Общий прогноз:</b>\n${analysis.forecast}`;
}

/**
 * Форматирование лунного календаря
 */
function formatLunarCalendar(lunarData) {
    const { moonPhase, lunarDay, zodiacSign, recommendations } = lunarData;
    
    return `🌙 <b>ЛУННЫЙ КАЛЕНДАРЬ</b>\n\n` +
           `${moonPhase.symbol} <b>${moonPhase.name}</b>\n` +
           `📅 Лунный день: ${lunarDay}\n` +
           `♐ Луна в ${zodiacSign.name}\n\n` +
           `🌟 <b>Энергия дня:</b>\n${moonPhase.energy}\n\n` +
           `✅ <b>Рекомендуется:</b>\n` +
           recommendations.recommended.slice(0, 3).map(r => `• ${r}`).join('\n') + '\n\n' +
           `❌ <b>Избегать:</b>\n` +
           recommendations.avoid.slice(0, 3).map(a => `• ${a}`).join('\n');
}

/**
 * Форматирование ошибки
 */
function formatErrorMessage(error, context = '') {
    const errorMessages = {
        'RATE_LIMIT': '⏰ Слишком много запросов. Попробуйте через минуту.',
        'PREMIUM_REQUIRED': '💎 Эта функция доступна только для премиум пользователей.',
        'DAILY_LIMIT': '📅 Дневной лимит исчерпан. Попробуйте завтра.',
        'INVALID_DATA': '❌ Некорректные данные. Проверьте введенную информацию.',
        'SERVER_ERROR': '🔧 Технические неполадки. Попробуйте позже.',
        'NETWORK_ERROR': '🌐 Проблемы с соединением. Проверьте интернет.'
    };
    
    const message = errorMessages[error] || '❌ Произошла ошибка. Попробуйте позже.';
    
    return context ? `${message}\n\n<i>${context}</i>` : message;
}

/**
 * Мистические сообщения для загрузки
 */
function getMysticalLoadingMessage(type = 'general') {
    const messages = {
        tarot: [
            '🌙 *Призываю мудрость древних*\n\n🔮 Прошу духов карт показать истину...',
            '✨ *Подключаюсь к энергии Вселенной*\n\n🃏 Карты шепчут свои секреты...',
            '🌟 *Раскрываю завесу тайн*\n\n🔮 Древние знания пробуждаются...',
            '🌙 *Вызываю силы Таро*\n\n✨ Карты готовы открыть свои тайны...',
            '🔮 *Сосредотачиваюсь на космических энергиях*\n\n🌟 Вселенная готовит ответ...'
        ],
        numerology: [
            '🔢 *Вычисляю числовые вибрации*\n\n✨ Раскрываю тайны чисел...',
            '🌟 *Подключаюсь к нумерологической матрице*\n\n🔢 Числа открывают свои секреты...',
            '🔮 *Анализирую космические частоты*\n\n🌙 Вселенная шепчет через числа...',
            '✨ *Декодирую вибрации судьбы*\n\n🔢 Древняя математика пробуждается...'
        ],
        lunar: [
            '🌙 *Подключаюсь к лунным циклам*\n\n✨ Луна делится своей мудростью...',
            '🌟 *Читаю лунные письмена*\n\n🌙 Небесные тела раскрывают тайны...',
            '🔮 *Сонастраиваюсь с лунной энергией*\n\n✨ Космические ритмы оживают...',
            '🌙 *Вызываю силы небесных светил*\n\n🌟 Луна готовит откровения...'
        ],
        premium: [
            '💎 *Активирую премиум-энергии*\n\n✨ Открываю доступ к тайным знаниям...',
            '🌟 *Подключаюсь к элитному каналу*\n\n💎 Эксклюзивная мудрость пробуждается...',
            '🔮 *Настраиваю премиум-частоты*\n\n✨ Высшие силы готовят ответ...'
        ],
        general: [
            '✨ *Подготавливаю мистический ритуал*\n\n🔮 Собираю энергии Вселенной...',
            '🌟 *Открываю портал знаний*\n\n✨ Древние силы пробуждаются...',
            '🔮 *Настраиваюсь на космические частоты*\n\n🌙 Вселенная готовит откровение...',
            '✨ *Призываю духов-наставников*\n\n🌟 Мудрость веков собирается...'
        ]
    };

    const typeMessages = messages[type] || messages.general;
    return typeMessages[Math.floor(Math.random() * typeMessages.length)];
}

/**
 * Серия мистических сообщений для многоэтапной загрузки
 */
function getMysticalLoadingSequence(type = 'general') {
    const sequences = {
        tarot: [
            '🌙 *Призываю мудрость древних*\n\n🔮 Подготавливаю священное пространство...',
            '✨ *Перемешиваю колоду Таро*\n\n🃏 Карты выбирают свой путь...',
            '🌟 *Раскладываю карты на алтаре*\n\n🔮 Духи карт показывают истину...'
        ],
        numerology: [
            '🔢 *Вычисляю числовые вибрации*\n\n✨ Анализирую дату рождения...',
            '🌟 *Декодирую имя в числа*\n\n🔢 Раскрываю численную матрицу...',
            '🔮 *Сопоставляю космические частоты*\n\n✨ Завершаю нумерологический расчет...'
        ],
        lunar: [
            '🌙 *Подключаюсь к лунным циклам*\n\n✨ Считываю фазу Луны...',
            '🌟 *Анализирую положение светил*\n\n🌙 Определяю лунный день...',
            '🔮 *Формирую лунные рекомендации*\n\n✨ Космические ритмы готовы...'
        ]
    };

    return sequences[type] || sequences.tarot;
}

/**
 * Форматирование справочной информации
 */
function formatHelpMessage() {
    return '📚 <b>СПРАВКА ПО БОТУ</b>\n\n' +
           '🎴 <b>Основные команды:</b>\n' +
           '/start - Запуск бота\n' +
           '/daily - Дневная карта\n' +
           '/spreads - Расклады Таро\n' +
           '/numerology - Нумерология\n' +
           '/lunar - Лунный календарь\n' +
           '/premium - Премиум подписка\n' +
           '/help - Эта справка\n\n' +
           '💡 <b>Быстрые действия:</b>\n' +
           '• Нажмите кнопки в меню\n' +
           '• Используйте инлайн клавиатуру\n' +
           '• Отправьте фото для анализа\n' +
           '• Запишите голосовое сообщение\n\n' +
           '🔗 <b>Полезные ссылки:</b>\n' +
           '• Веб-приложение: /webapp\n' +
           '• Поддержка: @mistika_support\n' +
           '• Канал новостей: @mistika_news';
}

module.exports = {
    formatWelcomeMessage,
    formatCardMessage,
    formatDailyCardMessage,
    formatPremiumFeatures,
    formatSubscriptionStatus,
    formatReferralProgram,
    formatReferralStats,
    formatNumerologyReading,
    formatLunarCalendar,
    formatErrorMessage,
    formatHelpMessage,
    getMysticalLoadingMessage,
    getMysticalLoadingSequence
};