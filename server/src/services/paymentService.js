// server/src/services/paymentService.js
const crypto = require('crypto');
const axios = require('axios');
const logger = require('../utils/logger');
const { Subscription, User } = require('../models');

class PaymentService {
  constructor() {
    this.providers = {
      yookassa: {
        shopId: process.env.YOOKASSA_SHOP_ID,
        secretKey: process.env.YOOKASSA_SECRET_KEY,
        endpoint: 'https://api.yookassa.ru/v3'
      },
      paypal: {
        clientId: process.env.PAYPAL_CLIENT_ID,
        clientSecret: process.env.PAYPAL_CLIENT_SECRET,
        endpoint: process.env.NODE_ENV === 'production' 
          ? 'https://api.paypal.com' 
          : 'https://api.sandbox.paypal.com'
      },
      telegramStars: {
        botToken: process.env.TELEGRAM_BOT_TOKEN,
        endpoint: 'https://api.telegram.org'
      }
    };
    
    this.plans = {
      monthly: {
        id: 'monthly',
        name: 'Месячная подписка',
        price: 299,
        currency: 'RUB',
        duration: 30,
        features: [
          'unlimited_readings',
          'ai_interpretations', 
          'voice_input',
          'photo_analysis',
          'premium_spreads',
          'full_history'
        ]
      },
      quarterly: {
        id: 'quarterly',
        name: 'Квартальная подписка',
        price: 799,
        currency: 'RUB',
        duration: 90,
        discount: 10,
        features: [
          'unlimited_readings',
          'ai_interpretations',
          'voice_input', 
          'photo_analysis',
          'premium_spreads',
          'full_history',
          'priority_support'
        ]
      },
      yearly: {
        id: 'yearly',
        name: 'Годовая подписка',
        price: 2999,
        currency: 'RUB',
        duration: 365,
        discount: 20,
        features: [
          'unlimited_readings',
          'ai_interpretations',
          'voice_input',
          'photo_analysis', 
          'premium_spreads',
          'full_history',
          'priority_support',
          'exclusive_content'
        ]
      }
    };
  }

  /**
   * Получение доступных планов подписки
   */
  getSubscriptionPlans() {
    return Object.values(this.plans).map(plan => ({
      ...plan,
      discountedPrice: plan.discount 
        ? Math.round(plan.price * (1 - plan.discount / 100))
        : plan.price,
      pricePerMonth: Math.round(plan.price / (plan.duration / 30)),
      featured: plan.id === 'quarterly'
    }));
  }

  /**
   * Создание платежа через YooKassa
   */
  async createYookassaPayment(planId, userId, returnUrl) {
    try {
      const plan = this.plans[planId];
      if (!plan) {
        throw new Error('План подписки не найден');
      }

      const user = await User.findByPk(userId);
      if (!user) {
        throw new Error('Пользователь не найден');
      }

      const idempotencyKey = crypto.randomUUID();
      const amount = plan.discount 
        ? Math.round(plan.price * (1 - plan.discount / 100))
        : plan.price;

      const paymentData = {
        amount: {
          value: amount.toFixed(2),
          currency: plan.currency
        },
        confirmation: {
          type: 'redirect',
          return_url: returnUrl
        },
        capture: true,
        description: `Подписка MISTIKA: ${plan.name}`,
        metadata: {
          userId: userId,
          planId: planId,
          telegramId: user.telegramId
        }
      };

      const response = await axios.post(
        `${this.providers.yookassa.endpoint}/payments`,
        paymentData,
        {
          headers: {
            'Content-Type': 'application/json',
            'Idempotence-Key': idempotencyKey,
            'Authorization': `Basic ${Buffer.from(
              `${this.providers.yookassa.shopId}:${this.providers.yookassa.secretKey}`
            ).toString('base64')}`
          }
        }
      );

      logger.info('YooKassa payment created', {
        paymentId: response.data.id,
        userId,
        planId,
        amount
      });

      return {
        paymentId: response.data.id,
        confirmationUrl: response.data.confirmation.confirmation_url,
        status: response.data.status,
        amount: amount,
        currency: plan.currency,
        provider: 'yookassa'
      };

    } catch (error) {
      logger.error('Error creating YooKassa payment', {
        error: error.message,
        planId,
        userId
      });
      throw new Error('Ошибка создания платежа');
    }
  }

  /**
   * Создание подписки через PayPal
   */
  async createPayPalSubscription(planId, userId) {
    try {
      const plan = this.plans[planId];
      if (!plan) {
        throw new Error('План подписки не найден');
      }

      const accessToken = await this.getPayPalAccessToken();
      
      const subscriptionData = {
        plan_id: `mistika_${planId}`,
        subscriber: {
          name: {
            given_name: 'MISTIKA',
            surname: 'User'
          }
        },
        application_context: {
          brand_name: 'MISTIKA',
          locale: 'ru-RU',
          shipping_preference: 'NO_SHIPPING',
          user_action: 'SUBSCRIBE_NOW',
          payment_method: {
            payer_selected: 'PAYPAL',
            payee_preferred: 'IMMEDIATE_PAYMENT_REQUIRED'
          },
          return_url: `${process.env.CLIENT_URL}/payment/success`,
          cancel_url: `${process.env.CLIENT_URL}/payment/cancel`
        }
      };

      const response = await axios.post(
        `${this.providers.paypal.endpoint}/v1/billing/subscriptions`,
        subscriptionData,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
            'Accept': 'application/json',
            'Prefer': 'return=representation'
          }
        }
      );

      logger.info('PayPal subscription created', {
        subscriptionId: response.data.id,
        userId,
        planId
      });

      return {
        subscriptionId: response.data.id,
        approvalUrl: response.data.links.find(link => link.rel === 'approve')?.href,
        status: response.data.status,
        provider: 'paypal'
      };

    } catch (error) {
      logger.error('Error creating PayPal subscription', {
        error: error.message,
        planId,
        userId
      });
      throw new Error('Ошибка создания подписки PayPal');
    }
  }

  /**
   * Создание инвойса Telegram Stars
   */
  async createTelegramStarsInvoice(planId, userId, chatId) {
    try {
      const plan = this.plans[planId];
      if (!plan) {
        throw new Error('План подписки не найден');
      }

      // Конвертируем рубли в звезды (примерный курс 1 звезда = 1 рубль)
      const starsAmount = plan.discount 
        ? Math.round(plan.price * (1 - plan.discount / 100))
        : plan.price;

      const invoiceData = {
        chat_id: chatId,
        title: `MISTIKA Premium: ${plan.name}`,
        description: `Подписка на ${plan.duration} дней с полным доступом ко всем возможностям MISTIKA`,
        payload: JSON.stringify({
          userId,
          planId,
          type: 'subscription'
        }),
        provider_token: '', // Для Telegram Stars не нужен
        currency: 'XTR', // Telegram Stars
        prices: [{
          label: plan.name,
          amount: starsAmount
        }],
        photo_url: `${process.env.CLIENT_URL}/images/premium-subscription.jpg`,
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

      const response = await axios.post(
        `${this.providers.telegramStars.endpoint}/bot${this.providers.telegramStars.botToken}/sendInvoice`,
        invoiceData
      );

      logger.info('Telegram Stars invoice created', {
        messageId: response.data.result.message_id,
        userId,
        planId,
        starsAmount
      });

      return {
        messageId: response.data.result.message_id,
        amount: starsAmount,
        currency: 'XTR',
        provider: 'telegram_stars'
      };

    } catch (error) {
      logger.error('Error creating Telegram Stars invoice', {
        error: error.message,
        planId,
        userId,
        chatId
      });
      throw new Error('Ошибка создания инвойса Telegram Stars');
    }
  }

  /**
   * Обработка webhook от YooKassa
   */
  async handleYookassaWebhook(webhookData) {
    try {
      const { object: payment } = webhookData;
      const { userId, planId } = payment.metadata;

      if (payment.status === 'succeeded') {
        await this.activateSubscription(userId, planId, {
          provider: 'yookassa',
          externalId: payment.id,
          amount: parseFloat(payment.amount.value),
          currency: payment.amount.currency
        });

        logger.info('YooKassa payment succeeded', {
          paymentId: payment.id,
          userId,
          planId
        });
      }

      return { success: true };

    } catch (error) {
      logger.error('Error handling YooKassa webhook', {
        error: error.message,
        webhookData
      });
      throw error;
    }
  }

  /**
   * Обработка webhook от PayPal
   */
  async handlePayPalWebhook(webhookData) {
    try {
      const { event_type, resource } = webhookData;

      if (event_type === 'BILLING.SUBSCRIPTION.ACTIVATED') {
        const { custom_id } = resource;
        const { userId, planId } = JSON.parse(custom_id);

        await this.activateSubscription(userId, planId, {
          provider: 'paypal',
          externalId: resource.id
        });

        logger.info('PayPal subscription activated', {
          subscriptionId: resource.id,
          userId,
          planId
        });
      }

      return { success: true };

    } catch (error) {
      logger.error('Error handling PayPal webhook', {
        error: error.message,
        webhookData
      });
      throw error;
    }
  }

  /**
   * Обработка платежа Telegram Stars
   */
  async handleTelegramStarsPayment(preCheckoutQuery) {
    try {
      const payload = JSON.parse(preCheckoutQuery.invoice_payload);
      const { userId, planId } = payload;

      const plan = this.plans[planId];
      if (!plan) {
        return { ok: false, error_message: 'План подписки не найден' };
      }

      const user = await User.findByPk(userId);
      if (!user) {
        return { ok: false, error_message: 'Пользователь не найден' };
      }

      // Проверяем, что у пользователя нет активной подписки
      const existingSubscription = await Subscription.getActiveByUser(userId);
      if (existingSubscription) {
        return { ok: false, error_message: 'У вас уже есть активная подписка' };
      }

      return { ok: true };

    } catch (error) {
      logger.error('Error handling Telegram Stars pre-checkout', {
        error: error.message,
        preCheckoutQuery
      });
      return { ok: false, error_message: 'Внутренняя ошибка сервера' };
    }
  }

  /**
   * Активация подписки после успешного платежа
   */
  async activateSubscription(userId, planId, paymentData) {
    try {
      const plan = this.plans[planId];
      if (!plan) {
        throw new Error('План подписки не найден');
      }

      const user = await User.findByPk(userId);
      if (!user) {
        throw new Error('Пользователь не найден');
      }

      // Деактивируем существующие подписки
      const existingSubscriptions = await Subscription.findAll({
        where: {
          userId,
          status: ['active', 'trial']
        }
      });

      for (const sub of existingSubscriptions) {
        await sub.update({ status: 'cancelled' });
      }

      // Создаем новую подписку
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + plan.duration);

      const subscription = await Subscription.create({
        userId,
        planId,
        planName: plan.name,
        status: 'active',
        type: planId,
        price: paymentData.amount || plan.price,
        currency: paymentData.currency || plan.currency,
        startDate,
        endDate,
        autoRenewal: true,
        paymentMethod: paymentData.provider,
        paymentProvider: paymentData.provider,
        externalSubscriptionId: paymentData.externalId,
        lastPaymentDate: new Date(),
        lastPaymentAmount: paymentData.amount || plan.price,
        features: plan.features,
        limits: this.getPlanLimits(planId)
      });

      // Обновляем статус пользователя
      await user.update({
        isPremium: true,
        subscriptionId: subscription.id
      });

      logger.info('Subscription activated', {
        subscriptionId: subscription.id,
        userId,
        planId
      });

      return subscription;

    } catch (error) {
      logger.error('Error activating subscription', {
        error: error.message,
        userId,
        planId,
        paymentData
      });
      throw error;
    }
  }

  /**
   * Отмена подписки
   */
  async cancelSubscription(subscriptionId, userId, reason = null) {
    try {
      const subscription = await Subscription.findOne({
        where: {
          id: subscriptionId,
          userId
        }
      });

      if (!subscription) {
        throw new Error('Подписка не найдена');
      }

      if (!subscription.isActive()) {
        throw new Error('Подписка уже неактивна');
      }

      await subscription.cancel(reason);

      // Обновляем статус пользователя (премиум остается до конца периода)
      const user = await User.findByPk(userId);
      if (user) {
        await user.update({
          subscriptionCancelledAt: new Date()
        });
      }

      logger.info('Subscription cancelled', {
        subscriptionId,
        userId,
        reason
      });

      return subscription;

    } catch (error) {
      logger.error('Error cancelling subscription', {
        error: error.message,
        subscriptionId,
        userId
      });
      throw error;
    }
  }

  /**
   * Возврат средств
   */
  async processRefund(subscriptionId, amount = null, reason = null) {
    try {
      const subscription = await Subscription.findByPk(subscriptionId);
      if (!subscription) {
        throw new Error('Подписка не найдена');
      }

      const refundAmount = amount || subscription.lastPaymentAmount;

      // Логика возврата зависит от провайдера
      switch (subscription.paymentProvider) {
        case 'yookassa':
          await this.processYookassaRefund(
            subscription.externalSubscriptionId,
            refundAmount,
            subscription.currency
          );
          break;
        case 'paypal':
          await this.processPayPalRefund(
            subscription.externalSubscriptionId,
            refundAmount
          );
          break;
        case 'telegram_stars':
          // Telegram Stars не поддерживает автоматические возвраты
          logger.warn('Manual refund required for Telegram Stars', {
            subscriptionId
          });
          break;
      }

      await subscription.update({
        refundAmount,
        refundDate: new Date(),
        status: 'cancelled',
        cancellationReason: reason || 'Возврат средств'
      });

      logger.info('Refund processed', {
        subscriptionId,
        refundAmount,
        reason
      });

      return subscription;

    } catch (error) {
      logger.error('Error processing refund', {
        error: error.message,
        subscriptionId,
        amount
      });
      throw error;
    }
  }

  /**
   * Получение токена доступа PayPal
   */
  async getPayPalAccessToken() {
    try {
      const auth = Buffer.from(
        `${this.providers.paypal.clientId}:${this.providers.paypal.clientSecret}`
      ).toString('base64');

      const response = await axios.post(
        `${this.providers.paypal.endpoint}/v1/oauth2/token`,
        'grant_type=client_credentials',
        {
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );

      return response.data.access_token;

    } catch (error) {
      logger.error('Error getting PayPal access token', {
        error: error.message
      });
      throw new Error('Ошибка получения токена PayPal');
    }
  }

  /**
   * Возврат через YooKassa
   */
  async processYookassaRefund(paymentId, amount, currency) {
    try {
      const refundData = {
        amount: {
          value: amount.toFixed(2),
          currency
        },
        payment_id: paymentId
      };

      const response = await axios.post(
        `${this.providers.yookassa.endpoint}/refunds`,
        refundData,
        {
          headers: {
            'Content-Type': 'application/json',
            'Idempotence-Key': crypto.randomUUID(),
            'Authorization': `Basic ${Buffer.from(
              `${this.providers.yookassa.shopId}:${this.providers.yookassa.secretKey}`
            ).toString('base64')}`
          }
        }
      );

      return response.data;

    } catch (error) {
      logger.error('Error processing YooKassa refund', {
        error: error.message,
        paymentId,
        amount
      });
      throw error;
    }
  }

  /**
   * Возврат через PayPal
   */
  async processPayPalRefund(subscriptionId, amount) {
    // Реализация возврата через PayPal
    // Требует дополнительной логики для работы с транзакциями
    logger.info('PayPal refund requested', { subscriptionId, amount });
    return { status: 'pending' };
  }

  /**
   * Получение лимитов плана
   */
  getPlanLimits(planId) {
    const baseLimits = {
      daily_readings: -1, // безлимит
      ai_interpretations: -1,
      voice_minutes: 60,
      photo_analyses: 10,
      history_days: -1
    };

    switch (planId) {
      case 'yearly':
        return {
          ...baseLimits,
          voice_minutes: 120,
          photo_analyses: 20
        };
      default:
        return baseLimits;
    }
  }

  /**
   * Проверка истекающих подписок
   */
  async checkExpiringSubscriptions() {
    try {
      const expiringSoon = await Subscription.getExpiringSoon(3); // 3 дня
      
      for (const subscription of expiringSoon) {
        // Отправляем уведомление пользователю
        logger.info('Subscription expiring soon', {
          subscriptionId: subscription.id,
          userId: subscription.userId,
          daysRemaining: subscription.getDaysRemaining()
        });
        
        // Здесь можно добавить отправку уведомлений
      }

      return expiringSoon;

    } catch (error) {
      logger.error('Error checking expiring subscriptions', {
        error: error.message
      });
      throw error;
    }
  }
}

module.exports = new PaymentService();