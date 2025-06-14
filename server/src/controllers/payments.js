// server/src/controllers/payments.js
const logger = require('../utils/logger');

// Lazy loading for models
const getModels = () => {
  const { User, Subscription } = require('../models');
  return { User, Subscription };
};

/**
 * Получение планов подписки
 */
const getSubscriptionPlans = async (req, res) => {
    try {
        // Планы подписки для Telegram Stars
        const plans = [
            {
                id: 'monthly_premium',
                name: 'Премиум месяц',
                description: 'Полный доступ ко всем функциям на месяц',
                price: 100, // Telegram Stars
                currency: 'XTR',
                duration: 30, // дней
                tier: 'premium',
                features: [
                    'Безлимитные гадания',
                    'Все расклады Таро',
                    'ИИ-анализ карт',
                    'Генерация изображений',
                    'Экспорт раскладов в PDF',
                    'Расширенная нумерология'
                ]
            },
            {
                id: 'yearly_premium',
                name: 'Премиум год',
                description: 'Полный доступ на год со скидкой 40%',
                price: 600, // Telegram Stars (вместо 600)
                currency: 'XTR',
                duration: 365, // дней
                tier: 'premium',
                features: [
                    'Все возможности месячного плана',
                    'Скидка 40%',
                    'Голосовой ввод вопросов',
                    'Персональный таролог-ИИ',
                    'Полная история раскладов'
                ]
            },
            {
                id: 'yearly_premium_plus',
                name: 'Premium Plus год',
                description: 'VIP доступ с эксклюзивными возможностями',
                price: 1000, // Telegram Stars
                currency: 'XTR',
                duration: 365, // дней
                tier: 'premium_plus',
                features: [
                    'Все возможности Premium',
                    'Приоритетная поддержка',
                    'Эксклюзивные расклады',
                    'Анализ фотографий',
                    'NFT коллекционные карты',
                    'Детальная аналитика точности'
                ]
            }
        ];
        
        res.json({
            success: true,
            plans
        });

    } catch (error) {
        logger.error('Ошибка получения планов подписки:', error);
        res.status(500).json({
            success: false,
            message: 'Не удалось получить планы подписки'
        });
    }
};

/**
 * Создание Telegram Stars invoice
 */
const createStarsInvoice = async (req, res) => {
    try {
        const { planId } = req.body;
        const userId = req.body.userId; // Это telegramId от бота
        
        if (!planId) {
            return res.status(400).json({
                success: false,
                message: 'ID плана обязателен'
            });
        }
        
        if (!userId) {
            return res.status(400).json({
                success: false,
                message: 'ID пользователя обязателен'
            });
        }

        // Получаем план
        const plans = {
            'monthly_premium': {
                name: 'Премиум месяц',
                description: 'Полный доступ ко всем функциям на месяц',
                price: 100,
                duration: 30,
                tier: 'premium'
            },
            'yearly_premium': {
                name: 'Премиум год', 
                description: 'Полный доступ на год со скидкой 40%',
                price: 600,
                duration: 365,
                tier: 'premium'
            },
            'yearly_premium_plus': {
                name: 'Premium Plus год',
                description: 'VIP доступ с эксклюзивными возможностями',
                price: 1000,
                duration: 365,
                tier: 'premium_plus'
            }
        };

        const plan = plans[planId];
        if (!plan) {
            return res.status(400).json({
                success: false,
                message: 'Неизвестный план подписки'
            });
        }

        // Создаем данные для invoice
        const invoiceData = {
            title: plan.name,
            description: plan.description,
            payload: JSON.stringify({
                userId: userId, // Это telegramId из бота
                planId: planId,
                duration: plan.duration,
                timestamp: Date.now()
            }),
            currency: 'XTR', // Telegram Stars
            prices: [{
                label: plan.name,
                amount: plan.price // В Stars
            }],
            provider_token: '', // Пустой для Stars
            start_parameter: `premium_${planId}_${userId}`,
            photo_url: 'https://via.placeholder.com/512x512/4A5568/FFFFFF?text=MISTIKA+Premium',
            photo_width: 512,
            photo_height: 512,
            need_name: false,
            need_phone_number: false,
            need_email: false,
            need_shipping_address: false,
            send_phone_number_to_provider: false,
            send_email_to_provider: false,
            is_flexible: false
        };

        res.json({
            success: true,
            invoice: invoiceData,
            planId: planId,
            price: plan.price,
            currency: 'XTR'
        });

    } catch (error) {
        logger.error('Ошибка создания Stars invoice:', error);
        res.status(500).json({
            success: false,
            message: 'Не удалось создать invoice'
        });
    }
};

/**
 * Обработка pre-checkout запроса от Telegram
 */
const handlePreCheckout = async (req, res) => {
    try {
        const { id, invoice_payload, total_amount, currency } = req.body;
        
        logger.info('Pre-checkout query received', {
            queryId: id,
            payload: invoice_payload,
            amount: total_amount,
            currency: currency
        });

        // Проверяем валидность платежа
        let payloadData;
        try {
            payloadData = JSON.parse(invoice_payload);
        } catch (parseError) {
            logger.error('Invalid payload format', { payload: invoice_payload });
            return res.json({
                ok: false,
                error_message: 'Неверный формат данных платежа'
            });
        }

        // Проверяем план
        const plans = {
            'monthly_premium': { price: 100, duration: 30, tier: 'premium' },
            'yearly_premium': { price: 600, duration: 365, tier: 'premium' },
            'yearly_premium_plus': { price: 1000, duration: 365, tier: 'premium_plus' }
        };

        const plan = plans[payloadData.planId];
        if (!plan) {
            return res.json({
                ok: false,
                error_message: 'Неизвестный план подписки'
            });
        }

        // Проверяем сумму
        if (total_amount !== plan.price || currency !== 'XTR') {
            return res.json({
                ok: false,
                error_message: 'Неверная сумма или валюта'
            });
        }

        // Проверяем пользователя (userId в payload это telegramId)
        const { User } = getModels();
        const user = await User.findOne({ where: { telegramId: payloadData.userId } });
        if (!user) {
            return res.json({
                ok: false,
                error_message: 'Пользователь не найден'
            });
        }

        // Все проверки пройдены
        logger.info('Pre-checkout validation passed', { 
            userId: payloadData.userId,
            planId: payloadData.planId,
            amount: total_amount
        });
        
        res.json({ ok: true });

    } catch (error) {
        logger.error('Pre-checkout handling error:', error);
        res.json({
            ok: false,
            error_message: 'Внутренняя ошибка сервера'
        });
    }
};

/**
 * Обработка успешного платежа
 */
const handleSuccessfulPayment = async (req, res) => {
    try {
        const { 
            telegram_payment_charge_id,
            provider_payment_charge_id,
            invoice_payload,
            total_amount,
            currency 
        } = req.body;

        logger.info('Successful payment received', {
            telegramChargeId: telegram_payment_charge_id,
            providerChargeId: provider_payment_charge_id,
            payload: invoice_payload,
            amount: total_amount,
            currency: currency
        });

        // Парсим данные платежа
        let payloadData;
        try {
            payloadData = JSON.parse(invoice_payload);
        } catch (parseError) {
            logger.error('Invalid payment payload', { payload: invoice_payload });
            return res.status(400).json({
                success: false,
                message: 'Неверный формат данных платежа'
            });
        }

        const { User, Subscription } = getModels();
        
        // Находим пользователя (userId в payload это telegramId)
        const user = await User.findOne({ where: { telegramId: payloadData.userId } });
        if (!user) {
            logger.error('User not found for payment', { telegramId: payloadData.userId });
            return res.status(404).json({
                success: false,
                message: 'Пользователь не найден'
            });
        }

        // Рассчитываем даты подписки
        const now = new Date();
        const expiresAt = new Date(now.getTime() + (payloadData.duration * 24 * 60 * 60 * 1000));

        // Деактивируем старые подписки
        await Subscription.update(
            { status: 'cancelled' },
            { where: { userId: user.id, status: 'active' } }
        );
        
        // Создаем новую подписку
        const subscription = await Subscription.create({
            userId: user.id, // Используем внутренний ID пользователя
            planId: payloadData.planId,
            planName: payloadData.planId === 'monthly_premium' ? 'Премиум месяц' : 'Премиум год',
            status: 'active',
            type: payloadData.planId === 'monthly_premium' ? 'monthly' : 'yearly',
            price: total_amount,
            currency: 'XTR',
            startDate: now,
            endDate: expiresAt,
            paymentMethod: 'telegram_stars',
            autoRenewal: false,
            metadata: {
                telegram_payment_charge_id,
                provider_payment_charge_id,
                amount: total_amount,
                currency: currency,
                timestamp: Date.now()
            }
        });
        
        const created = true;

        // Получаем план для определения tier
        const planTiers = {
            'monthly_premium': 'premium',
            'yearly_premium': 'premium', 
            'yearly_premium_plus': 'premium_plus'
        };
        
        // Обновляем статус пользователя
        await user.update({
            isPremium: true,
            premiumExpiresAt: expiresAt,
            subscriptionType: planTiers[payloadData.planId] || 'premium'
        });

        logger.info('Premium subscription activated', {
            userId: payloadData.userId,
            planId: payloadData.planId,
            expiresAt: expiresAt,
            isNewSubscription: created
        });

        res.json({
            success: true,
            subscription: {
                id: subscription.id,
                planId: payloadData.planId,
                status: 'active',
                expiresAt: expiresAt
            },
            message: 'Премиум подписка успешно активирована!'
        });

    } catch (error) {
        logger.error('Successful payment handling error:', error);
        res.status(500).json({
            success: false,
            message: 'Ошибка при активации подписки'
        });
    }
};

/**
 * Получение статуса подписки пользователя
 */
const getSubscriptionStatus = async (req, res) => {
    try {
        const userId = req.user?.id || req.params.userId;
        
        const { User, Subscription } = getModels();
        
        // Если userId это число (Telegram ID), ищем по telegramId
        let user;
        if (!isNaN(userId) && !req.user) {
            // Это запрос от бота с Telegram ID
            user = await User.findOne({
                where: { telegramId: userId },
                include: [{
                    model: Subscription,
                    as: 'subscriptions',
                    where: { status: 'active' },
                    required: false,
                    order: [['createdAt', 'DESC']],
                    limit: 1
                }]
            });
        } else {
            // Это аутентифицированный запрос с внутренним ID
            user = await User.findByPk(userId, {
                include: [{
                    model: Subscription,
                    as: 'subscriptions',
                    where: { status: 'active' },
                    required: false,
                    order: [['createdAt', 'DESC']],
                    limit: 1
                }]
            });
        }

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Пользователь не найден'
            });
        }

        const subscription = user.subscriptions?.[0];
        const now = new Date();
        
        // Проверяем актуальность подписки
        if (subscription && subscription.endDate > now) {
            res.json({
                success: true,
                isPremium: true,
                subscription: {
                    id: subscription.id,
                    planId: subscription.planId,
                    status: subscription.status,
                    startDate: subscription.startDate,
                    endDate: subscription.endDate,
                    daysLeft: Math.ceil((subscription.endDate - now) / (1000 * 60 * 60 * 24)),
                    tier: user.subscriptionType || 'premium'
                }
            });
        } else {
            // Пользователь не имеет активной подписки
            res.json({
                success: true,
                isPremium: false,
                subscription: null
            });
        }

    } catch (error) {
        logger.error('Get subscription status error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Ошибка получения статуса подписки'
        });
    }
};

module.exports = {
    getSubscriptionPlans,
    createStarsInvoice,
    handlePreCheckout,
    handleSuccessfulPayment,
    getSubscriptionStatus
};