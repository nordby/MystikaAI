// client/src/pages/Premium/Premium.jsx
import React, { useState, useEffect } from 'react';
import { useAuthStore } from '@store/authStore';
import { useUserStore } from '@store/userStore';
import { getSubscriptionPlans, createSubscription, getSubscriptionStatus } from '@services/api';
import { USER_LIMITS, FEATURE_ACCESS, ERROR_MESSAGES, SUCCESS_MESSAGES } from '@utils/constants';
import Button from '@components/common/Button';
import Loading from '@components/common/Loading';
import Modal from '@components/common/Modal';
import PaymentModal from '@components/payments/PaymentModal';
import './Premium.css';

const Premium = () => {
  const { user, isAuthenticated } = useAuthStore();
  const { subscription, setSubscription } = useUserStore();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [featuresModalOpen, setFeaturesModalOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [plansData, subscriptionData] = await Promise.all([
        getSubscriptionPlans(),
        isAuthenticated ? getSubscriptionStatus() : Promise.resolve(null)
      ]);
      setPlans(plansData);
      if (subscriptionData) {
        setSubscription(subscriptionData);
      }
    } catch (error) {
      console.error('Ошибка загрузки данных:', error);
      addNotification(ERROR_MESSAGES.NETWORK_ERROR, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = (plan) => {
    if (!isAuthenticated) {
      addNotification('Необходима авторизация для оформления подписки', 'warning');
      return;
    }
    setSelectedPlan(plan);
    setPaymentModalOpen(true);
  };

  const handlePaymentSuccess = async (paymentData) => {
    try {
      const newSubscription = await createSubscription({
        planId: selectedPlan.id,
        paymentData
      });
      setSubscription(newSubscription);
      addNotification(SUCCESS_MESSAGES.PAYMENT_SUCCESS, 'success');
      setPaymentModalOpen(false);
      setSelectedPlan(null);
    } catch (error) {
      console.error('Ошибка создания подписки:', error);
      addNotification(ERROR_MESSAGES.PAYMENT_ERROR, 'error');
    }
  };

  const addNotification = (message, type) => {
    const notification = {
      id: Date.now(),
      message,
      type,
      timestamp: new Date()
    };
    setNotifications(prev => [notification, ...prev.slice(0, 4)]);
    
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== notification.id));
    }, 5000);
  };

  const features = [
    {
      title: 'Безлимитные гадания',
      description: 'Получайте неограниченное количество гаданий каждый день',
      icon: '🔮',
      free: USER_LIMITS.FREE.DAILY_READINGS,
      premium: 'Безлимит'
    },
    {
      title: 'AI интерпретации',
      description: 'Глубокие персонализированные толкования с помощью ИИ',
      icon: '🤖',
      free: USER_LIMITS.FREE.AI_INTERPRETATIONS,
      premium: 'Безлимит'
    },
    {
      title: 'Голосовые гадания',
      description: 'Задавайте вопросы голосом и получайте ответы',
      icon: '🎤',
      free: `${USER_LIMITS.FREE.VOICE_MINUTES} мин`,
      premium: `${USER_LIMITS.PREMIUM.VOICE_MINUTES} мин/день`
    },
    {
      title: 'Анализ фотографий',
      description: 'Мистический анализ ваших изображений через ИИ',
      icon: '📸',
      free: USER_LIMITS.FREE.PHOTO_ANALYSES,
      premium: `${USER_LIMITS.PREMIUM.PHOTO_ANALYSES}/день`
    },
    {
      title: 'Полная история',
      description: 'Безлимитный доступ ко всей истории гаданий',
      icon: '📜',
      free: `${USER_LIMITS.FREE.HISTORY_DAYS} дней`,
      premium: 'Вся история'
    },
    {
      title: 'Эксклюзивные расклады',
      description: 'Доступ к уникальным и сложным раскладам Таро',
      icon: '✨',
      free: 'Базовые',
      premium: 'Все расклады'
    },
    {
      title: 'Приоритетная поддержка',
      description: 'Быстрый ответ на ваши вопросы и предложения',
      icon: '🎯',
      free: 'Стандартная',
      premium: 'Приоритетная'
    },
    {
      title: 'Экспорт данных',
      description: 'Экспорт всех ваших гаданий в различных форматах',
      icon: '📥',
      free: 'Нет',
      premium: 'Доступно'
    }
  ];

  const testimonials = [
    {
      name: 'Анна М.',
      text: 'MISTIKA Premium изменила мой подход к гаданиям. AI интерпретации невероятно точны!',
      rating: 5,
      avatar: '👩'
    },
    {
      name: 'Сергей К.',
      text: 'Голосовые гадания - это фантастика! Так удобно задавать вопросы прямо в микрофон.',
      rating: 5,
      avatar: '👨'
    },
    {
      name: 'Мария Л.',
      text: 'Безлимитные гадания позволяют мне глубоко исследовать любую ситуацию. Рекомендую!',
      rating: 5,
      avatar: '👩‍🦰'
    }
  ];

  if (loading) {
    return (
      <div className="premium-page">
        <Loading text="Загрузка планов подписки..." />
      </div>
    );
  }

  const isPremium = subscription?.status === 'active';

  return (
    <div className="premium-page">
      {/* Уведомления */}
      {notifications.length > 0 && (
        <div className="notifications">
          {notifications.map(notification => (
            <div
              key={notification.id}
              className={`notification notification-${notification.type}`}
            >
              {notification.message}
            </div>
          ))}
        </div>
      )}

      {/* Статус подписки */}
      {isPremium && (
        <div className="subscription-status">
          <div className="status-card premium-active">
            <div className="status-icon">👑</div>
            <div className="status-content">
              <h3>MISTIKA Premium активна</h3>
              <p>
                Действует до: {new Date(subscription.expiresAt).toLocaleDateString('ru-RU')}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Заголовок */}
      <div className="premium-header">
        <h1>
          {isPremium ? 'Добро пожаловать в Premium!' : 'Откройте всю силу мистики'}
        </h1>
        <p>
          {isPremium 
            ? 'Наслаждайтесь всеми премиум возможностями MISTIKA'
            : 'Получите неограниченный доступ ко всем возможностям MISTIKA'
          }
        </p>
      </div>

      {!isPremium && (
        <>
          {/* Планы подписки */}
          <div className="plans-section">
            <h2>Выберите план</h2>
            <div className="plans-grid">
              {plans.map(plan => (
                <div 
                  key={plan.id} 
                  className={`plan-card ${plan.featured ? 'featured' : ''}`}
                >
                  {plan.featured && <div className="featured-badge">Популярный</div>}
                  
                  <div className="plan-header">
                    <h3>{plan.name}</h3>
                    <div className="plan-price">
                      <span className="currency">₽</span>
                      <span className="amount">{plan.price}</span>
                      <span className="period">/{plan.period}</span>
                    </div>
                    {plan.discount > 0 && (
                      <div className="plan-discount">
                        Скидка {plan.discount}%
                      </div>
                    )}
                  </div>
                  
                  <div className="plan-features">
                    {plan.features.map((feature, index) => (
                      <div key={index} className="feature-item">
                        <span className="feature-icon">✓</span>
                        <span className="feature-text">{feature}</span>
                      </div>
                    ))}
                  </div>
                  
                  <Button
                    variant={plan.featured ? 'primary' : 'outline'}
                    size="lg"
                    className="plan-button"
                    onClick={() => handleUpgrade(plan)}
                  >
                    {plan.featured ? 'Выбрать план' : 'Попробовать'}
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Сравнение возможностей */}
          <div className="features-comparison">
            <h2>Сравнение возможностей</h2>
            <div className="comparison-table">
              <div className="comparison-header">
                <div className="feature-name">Возможность</div>
                <div className="plan-column">Бесплатно</div>
                <div className="plan-column premium">Premium</div>
              </div>
              
              {features.map((feature, index) => (
                <div key={index} className="comparison-row">
                  <div className="feature-info">
                    <div className="feature-title">
                      <span className="feature-icon">{feature.icon}</span>
                      {feature.title}
                    </div>
                    <div className="feature-description">
                      {feature.description}
                    </div>
                  </div>
                  <div className="feature-value free">
                    {feature.free === 0 ? '❌' : feature.free}
                  </div>
                  <div className="feature-value premium">
                    ✅ {feature.premium}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="comparison-actions">
              <Button
                variant="primary"
                size="lg"
                onClick={() => setFeaturesModalOpen(true)}
              >
                Узнать больше о Premium
              </Button>
            </div>
          </div>
        </>
      )}

      {/* Отзывы */}
      <div className="testimonials-section">
        <h2>Что говорят наши пользователи</h2>
        <div className="testimonials-grid">
          {testimonials.map((testimonial, index) => (
            <div key={index} className="testimonial-card">
              <div className="testimonial-header">
                <div className="testimonial-avatar">{testimonial.avatar}</div>
                <div className="testimonial-info">
                  <div className="testimonial-name">{testimonial.name}</div>
                  <div className="testimonial-rating">
                    {'⭐'.repeat(testimonial.rating)}
                  </div>
                </div>
              </div>
              <div className="testimonial-text">
                "{testimonial.text}"
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* FAQ */}
      <div className="faq-section">
        <h2>Часто задаваемые вопросы</h2>
        <div className="faq-list">
          <div className="faq-item">
            <h4>Можно ли отменить подписку?</h4>
            <p>Да, вы можете отменить подписку в любое время. Доступ к Premium сохранится до конца оплаченного периода.</p>
          </div>
          <div className="faq-item">
            <h4>Работает ли подписка на всех устройствах?</h4>
            <p>Да, Premium подписка привязана к вашему аккаунту и работает на всех устройствах.</p>
          </div>
          <div className="faq-item">
            <h4>Есть ли пробный период?</h4>
            <p>Да, мы предлагаем 7-дневный бесплатный пробный период для новых пользователей.</p>
          </div>
          <div className="faq-item">
            <h4>Безопасны ли платежи?</h4>
            <p>Да, все платежи обрабатываются через защищенные платежные системы с шифрованием данных.</p>
          </div>
        </div>
      </div>

      {/* Модальное окно оплаты */}
      <PaymentModal
        isOpen={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        plan={selectedPlan}
        onSuccess={handlePaymentSuccess}
      />

      {/* Модальное окно с подробностями */}
      <Modal
        isOpen={featuresModalOpen}
        onClose={() => setFeaturesModalOpen(false)}
        title="Все возможности Premium"
        size="lg"
      >
        <div className="features-modal-content">
          <div className="features-grid">
            {features.map((feature, index) => (
              <div key={index} className="feature-card">
                <div className="feature-card-icon">{feature.icon}</div>
                <h4>{feature.title}</h4>
                <p>{feature.description}</p>
                <div className="feature-upgrade">
                  <span className="upgrade-from">Было: {feature.free}</span>
                  <span className="upgrade-arrow">→</span>
                  <span className="upgrade-to">Стало: {feature.premium}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="features-modal-actions">
            <Button
              variant="primary"
              size="lg"
              onClick={() => {
                setFeaturesModalOpen(false);
                if (plans.length > 0) {
                  handleUpgrade(plans.find(p => p.featured) || plans[0]);
                }
              }}
            >
              Получить Premium
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Premium;