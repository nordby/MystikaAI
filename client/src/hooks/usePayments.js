// client/src/hooks/usePayments.js
import { useState, useEffect } from 'react';
import apiService from '../services/api';
import telegramService from '../services/telegram';
import analyticsService from '../services/analytics';

export const usePayments = () => {
  const [loading, setLoading] = useState(false);
  const [subscriptionInfo, setSubscriptionInfo] = useState(null);
  const [paymentPlans, setPaymentPlans] = useState([]);
  const [currentPayment, setCurrentPayment] = useState(null);
  const [error, setError] = useState(null);

  // Планы подписки
  const defaultPlans = [
    {
      id: 'mystic',
      name: 'Мистик',
      price: 299,
      period: 'месяц',
      features: [
        'Безлимитные гадания',
        'Расширенные расклады',
        'Персональные интерпретации',
        'Лунный календарь'
      ],
      popular: false
    },
    {
      id: 'master',
      name: 'Мастер',
      price: 599,
      period: 'месяц',
      features: [
        'Все возможности Мистик',
        'AI интерпретации',
        'Голосовые вопросы',
        'Персональная колода карт',
        'Анализ фотографий'
      ],
      popular: true
    },
    {
      id: 'grandmaster',
      name: 'Гранд Мастер',
      price: 999,
      period: 'месяц',
      features: [
        'Все возможности Мастер',
        'NFT карты',
        'Эксклюзивные расклады',
        'Персональный мистический советник',
        'Приоритетная поддержка'
      ],
      popular: false
    }
  ];

  // Загрузка информации о подписке
  const loadSubscriptionInfo = async () => {
    try {
      setLoading(true);
      const response = await apiService.getSubscriptionInfo();
      setSubscriptionInfo(response.subscription);
    } catch (err) {
      setError('Не удалось загрузить информацию о подписке');
      console.error('Ошибка загрузки подписки:', err);
    } finally {
      setLoading(false);
    }
  };

  // Создание платежа
  const createPayment = async (planId, period = 'month') => {
    try {
      setLoading(true);
      setError(null);

      analyticsService.trackPayment('initiated', planId);

      const paymentData = {
        plan_id: planId,
        period: period,
        return_url: window.location.href,
        telegram_user_id: telegramService.getUserData()?.telegram_id
      };

      const response = await apiService.createPayment(paymentData);
      
      if (response.success) {
        setCurrentPayment(response.payment);
        
        // Открываем страницу оплаты
        if (response.payment.payment_url) {
          telegramService.openLink(response.payment.payment_url);
        }

        return response.payment;
      } else {
        throw new Error(response.message);
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Ошибка создания платежа';
      setError(errorMessage);
      analyticsService.trackPayment('failed', planId);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Подтверждение платежа
  const confirmPayment = async (paymentId) => {
    try {
      setLoading(true);
      const response = await apiService.confirmPayment(paymentId);
      
      if (response.success) {
        analyticsService.trackPayment('completed', response.plan_id);
        analyticsService.trackConversion('subscription', response.amount);
        
        // Обновляем информацию о подписке
        await loadSubscriptionInfo();
        
        telegramService.showAlert('🎉 Подписка успешно оформлена!');
        return true;
      } else {
        throw new Error(response.message);
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Ошибка подтверждения платежа';
      setError(errorMessage);
      analyticsService.trackPayment('failed', paymentId);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Отмена текущей подписки
  const cancelSubscription = async () => {
    try {
      setLoading(true);
      
      const confirmed = await new Promise((resolve) => {
        telegramService.showConfirm(
          'Вы уверены, что хотите отменить подписку?',
          resolve
        );
      });

      if (!confirmed) return false;

      const response = await apiService.cancelSubscription();
      
      if (response.success) {
        await loadSubscriptionInfo();
        telegramService.showAlert('Подписка успешно отменена');
        return true;
      } else {
        throw new Error(response.message);
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Ошибка отмены подписки';
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Проверка статуса подписки
  const checkSubscriptionStatus = () => {
    if (!subscriptionInfo) return 'basic';
    
    if (subscriptionInfo.expires_at && new Date(subscriptionInfo.expires_at) < new Date()) {
      return 'expired';
    }
    
    return subscriptionInfo.type;
  };

  // Проверка доступности функции
  const hasFeature = (feature) => {
    const status = checkSubscriptionStatus();
    
    const featureMap = {
      'unlimited_readings': ['mystic', 'master', 'grandmaster'],
      'ai_interpretations': ['master', 'grandmaster'],
      'voice_input': ['master', 'grandmaster'],
      'personal_deck': ['master', 'grandmaster'],
      'photo_analysis': ['master', 'grandmaster'],
      'nft_cards': ['grandmaster'],
      'priority_support': ['grandmaster']
    };

    return featureMap[feature]?.includes(status) || false;
  };

  // Получение оставшихся дней подписки
  const getDaysRemaining = () => {
    if (!subscriptionInfo?.expires_at) return null;
    
    const expiresAt = new Date(subscriptionInfo.expires_at);
    const now = new Date();
    const diffTime = expiresAt - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return Math.max(0, diffDays);
  };

  // Получение рекомендуемого плана
  const getRecommendedPlan = () => {
    const currentStatus = checkSubscriptionStatus();
    
    if (currentStatus === 'basic') {
      return 'mystic';
    } else if (currentStatus === 'mystic') {
      return 'master';
    } else if (currentStatus === 'master') {
      return 'grandmaster';
    }
    
    return null;
  };

  // Форматирование цены
  const formatPrice = (price) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0
    }).format(price);
  };

  // Инициализация при монтировании
  useEffect(() => {
    loadSubscriptionInfo();
  }, []);

  // Установка планов подписки
  useEffect(() => {
    setPaymentPlans(defaultPlans);
  }, []);

  return {
    // Состояние
    loading,
    subscriptionInfo,
    paymentPlans,
    currentPayment,
    error,
    
    // Методы
    createPayment,
    confirmPayment,
    cancelSubscription,
    loadSubscriptionInfo,
    
    // Утилиты
    checkSubscriptionStatus,
    hasFeature,
    getDaysRemaining,
    getRecommendedPlan,
    formatPrice,
    
    // Сброс ошибки
    clearError: () => setError(null)
  };
};