// client/src/pages/Spreads/Spreads.jsx
import React, { useState, useEffect } from 'react';
import { useAuthStore } from '@store/authStore';
import { useCardsStore } from '@store/cardsStore';
import { getAvailableSpreads, createReading } from '@services/api';
import { READING_TYPES, FEATURE_ACCESS, USER_LIMITS, ROUTES } from '@utils/constants';
import Button from '@components/common/Button';
import Loading from '@components/common/Loading';
import Modal from '@components/common/Modal';
import OneCardSpread from '@components/spreads/OneCardSpread';
import ThreeCardSpread from '@components/spreads/ThreeCardSpread';
import CelticCross from '@components/spreads/CelticCross';
import CustomSpread from '@components/spreads/CustomSpread';
import './Spreads.css';

const Spreads = () => {
  const { user, isAuthenticated } = useAuthStore();
  const { spreads, setSpreads } = useCardsStore();
  const [loading, setLoading] = useState(true);
  const [selectedSpread, setSelectedSpread] = useState(null);
  const [readingModalOpen, setReadingModalOpen] = useState(false);
  const [questionModalOpen, setQuestionModalOpen] = useState(false);
  const [question, setQuestion] = useState('');
  const [category, setCategory] = useState('all');
  const [notifications, setNotifications] = useState([]);

  const spreadsData = [
    {
      id: 'one_card',
      type: READING_TYPES.ONE_CARD,
      name: 'Одна карта',
      description: 'Быстрый ответ на конкретный вопрос',
      difficulty: 'Начинающий',
      duration: '2-3 мин',
      cardsCount: 1,
      access: FEATURE_ACCESS.FREE,
      category: 'simple',
      icon: '🃏',
      features: ['Простота', 'Быстрый результат', 'Подходит для ежедневного использования']
    },
    {
      id: 'three_cards',
      type: READING_TYPES.THREE_CARDS,
      name: 'Три карты',
      description: 'Прошлое, настоящее и будущее',
      difficulty: 'Начинающий',
      duration: '5-7 мин',
      cardsCount: 3,
      access: FEATURE_ACCESS.FREE,
      category: 'simple',
      icon: '🃖',
      features: ['Временная перспектива', 'Контекст ситуации', 'Развитие событий']
    },
    {
      id: 'celtic_cross',
      type: READING_TYPES.CELTIC_CROSS,
      name: 'Кельтский крест',
      description: 'Комплексный анализ ситуации',
      difficulty: 'Продвинутый',
      duration: '15-20 мин',
      cardsCount: 10,
      access: FEATURE_ACCESS.PREMIUM,
      category: 'complex',
      icon: '✨',
      features: ['Глубокий анализ', 'Многосторонний взгляд', 'Детальная интерпретация']
    },
    {
      id: 'love_spread',
      type: READING_TYPES.CUSTOM,
      name: 'Расклад любви',
      description: 'Специально для вопросов о отношениях',
      difficulty: 'Средний',
      duration: '10-12 мин',
      cardsCount: 7,
      access: FEATURE_ACCESS.PREMIUM,
      category: 'relationships',
      icon: '💕',
      features: ['Отношения', 'Совместимость', 'Будущее пары']
    },
    {
      id: 'career_spread',
      type: READING_TYPES.CUSTOM,
      name: 'Карьерный путь',
      description: 'Для вопросов о работе и карьере',
      difficulty: 'Средний',
      duration: '8-10 мин',
      cardsCount: 5,
      access: FEATURE_ACCESS.PREMIUM,
      category: 'career',
      icon: '💼',
      features: ['Карьера', 'Профессиональный рост', 'Возможности']
    },
    {
      id: 'chakra_spread',
      type: READING_TYPES.CUSTOM,
      name: 'Чакральный расклад',
      description: 'Энергетическое состояние семи чакр',
      difficulty: 'Продвинутый',
      duration: '12-15 мин',
      cardsCount: 7,
      access: FEATURE_ACCESS.PREMIUM,
      category: 'spiritual',
      icon: '🧘',
      features: ['Энергетика', 'Духовное развитие', 'Баланс чакр']
    },
    {
      id: 'decision_spread',
      type: READING_TYPES.CUSTOM,
      name: 'Выбор пути',
      description: 'Поможет принять важное решение',
      difficulty: 'Средний',
      duration: '8-10 мин',
      cardsCount: 6,
      access: FEATURE_ACCESS.FREE,
      category: 'decision',
      icon: '🛤️',
      features: ['Принятие решений', 'Анализ вариантов', 'Последствия выбора']
    },
    {
      id: 'year_spread',
      type: READING_TYPES.CUSTOM,
      name: 'Расклад на год',
      description: 'Прогноз на весь год по месяцам',
      difficulty: 'Эксперт',
      duration: '25-30 мин',
      cardsCount: 13,
      access: FEATURE_ACCESS.PREMIUM,
      category: 'forecast',
      icon: '📅',
      features: ['Годовой прогноз', 'Планирование', 'Ключевые события']
    }
  ];

  const categories = [
    { id: 'all', name: 'Все расклады', icon: '🔮' },
    { id: 'simple', name: 'Простые', icon: '🃏' },
    { id: 'complex', name: 'Сложные', icon: '✨' },
    { id: 'relationships', name: 'Отношения', icon: '💕' },
    { id: 'career', name: 'Карьера', icon: '💼' },
    { id: 'spiritual', name: 'Духовность', icon: '🧘' },
    { id: 'decision', name: 'Решения', icon: '🛤️' },
    { id: 'forecast', name: 'Прогнозы', icon: '📅' }
  ];

  useEffect(() => {
    loadSpreads();
  }, []);

  const loadSpreads = async () => {
    try {
      setLoading(true);
      // В реальном приложении здесь был бы запрос к API
      // const spreadsData = await getAvailableSpreads();
      setSpreads(spreadsData);
    } catch (error) {
      console.error('Ошибка загрузки раскладов:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSpreadSelect = (spread) => {
    if (!isAuthenticated) {
      addNotification('Необходима авторизация для проведения гаданий', 'warning');
      return;
    }

    if (spread.access === FEATURE_ACCESS.PREMIUM && !user?.isPremium) {
      addNotification('Данный расклад доступен только для Premium пользователей', 'warning');
      return;
    }

    // Проверяем лимиты бесплатного пользователя
    if (!user?.isPremium) {
      const todayReadings = user?.todayReadings || 0;
      if (todayReadings >= USER_LIMITS.FREE.DAILY_READINGS) {
        addNotification('Достигнут лимит бесплатных гаданий на сегодня', 'warning');
        return;
      }
    }

    setSelectedSpread(spread);
    setQuestionModalOpen(true);
  };

  const handleStartReading = () => {
    if (question.trim().length < 5) {
      addNotification('Вопрос должен содержать минимум 5 символов', 'error');
      return;
    }

    setQuestionModalOpen(false);
    setReadingModalOpen(true);
  };

  const handleReadingComplete = async (readingData) => {
    try {
      const newReading = await createReading({
        type: selectedSpread.type,
        spreadId: selectedSpread.id,
        question: question,
        cards: readingData.cards,
        interpretation: readingData.interpretation
      });
      
      addNotification('Гадание завершено и сохранено!', 'success');
      setReadingModalOpen(false);
      setSelectedSpread(null);
      setQuestion('');
    } catch (error) {
      console.error('Ошибка сохранения гадания:', error);
      addNotification('Ошибка сохранения гадания', 'error');
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

  const isSpreadAvailable = (spread) => {
    if (!isAuthenticated) return false;
    if (spread.access === FEATURE_ACCESS.PREMIUM && !user?.isPremium) return false;
    if (!user?.isPremium) {
      const todayReadings = user?.todayReadings || 0;
      if (todayReadings >= USER_LIMITS.FREE.DAILY_READINGS) return false;
    }
    return true;
  };

  const filteredSpreads = spreadsData.filter(spread => 
    category === 'all' || spread.category === category
  );

  const renderSpreadComponent = () => {
    if (!selectedSpread) return null;

    const commonProps = {
      question,
      onComplete: handleReadingComplete,
      onClose: () => setReadingModalOpen(false)
    };

    switch (selectedSpread.type) {
      case READING_TYPES.ONE_CARD:
        return <OneCardSpread {...commonProps} />;
      case READING_TYPES.THREE_CARDS:
        return <ThreeCardSpread {...commonProps} />;
      case READING_TYPES.CELTIC_CROSS:
        return <CelticCross {...commonProps} />;
      case READING_TYPES.CUSTOM:
        return <CustomSpread {...commonProps} spreadId={selectedSpread.id} />;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="spreads-page">
        <Loading text="Загрузка раскладов..." />
      </div>
    );
  }

  return (
    <div className="spreads-page">
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

      {/* Заголовок */}
      <div className="spreads-header">
        <h1>Расклады Таро</h1>
        <p>Выберите подходящий расклад для вашего вопроса</p>
      </div>

      {/* Категории */}
      <div className="categories-section">
        <div className="categories-grid">
          {categories.map(cat => (
            <button
              key={cat.id}
              className={`category-button ${category === cat.id ? 'active' : ''}`}
              onClick={() => setCategory(cat.id)}
            >
              <span className="category-icon">{cat.icon}</span>
              <span className="category-name">{cat.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Статистика пользователя */}
      {isAuthenticated && (
        <div className="user-stats">
          <div className="stats-card">
            <div className="stat-item">
              <span className="stat-label">Сегодня:</span>
              <span className="stat-value">
                {user?.todayReadings || 0}
                {!user?.isPremium && ` / ${USER_LIMITS.FREE.DAILY_READINGS}`}
              </span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Всего гаданий:</span>
              <span className="stat-value">{user?.totalReadings || 0}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Статус:</span>
              <span className={`stat-value ${user?.isPremium ? 'premium' : 'free'}`}>
                {user?.isPremium ? 'Premium' : 'Бесплатный'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Сетка раскладов */}
      <div className="spreads-grid">
        {filteredSpreads.map(spread => {
          const available = isSpreadAvailable(spread);
          const isPremium = spread.access === FEATURE_ACCESS.PREMIUM;
          
          return (
            <div 
              key={spread.id} 
              className={`spread-card ${!available ? 'disabled' : ''} ${isPremium ? 'premium' : ''}`}
            >
              {isPremium && <div className="premium-badge">Premium</div>}
              
              <div className="spread-header">
                <div className="spread-icon">{spread.icon}</div>
                <div className="spread-info">
                  <h3>{spread.name}</h3>
                  <p className="spread-description">{spread.description}</p>
                </div>
              </div>

              <div className="spread-details">
                <div className="detail-item">
                  <span className="detail-label">Сложность:</span>
                  <span className="detail-value">{spread.difficulty}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Время:</span>
                  <span className="detail-value">{spread.duration}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Карт:</span>
                  <span className="detail-value">{spread.cardsCount}</span>
                </div>
              </div>

              <div className="spread-features">
                {spread.features.map((feature, index) => (
                  <span key={index} className="feature-tag">
                    {feature}
                  </span>
                ))}
              </div>

              <div className="spread-actions">
                {available ? (
                  <Button
                    variant="primary"
                    onClick={() => handleSpreadSelect(spread)}
                    className="spread-button"
                  >
                    Начать гадание
                  </Button>
                ) : (
                  <div className="spread-unavailable">
                    {!isAuthenticated ? (
                      <span>Требуется авторизация</span>
                    ) : isPremium && !user?.isPremium ? (
                      <Button
                        variant="outline"
                        onClick={() => window.location.href = ROUTES.PREMIUM}
                        className="upgrade-button"
                      >
                        Получить Premium
                      </Button>
                    ) : (
                      <span>Лимит исчерпан</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Информационный блок */}
      <div className="info-section">
        <div className="info-card">
          <h3>Как выбрать расклад?</h3>
          <ul>
            <li><strong>Простые вопросы</strong> - используйте расклад "Одна карта"</li>
            <li><strong>Анализ ситуации</strong> - подойдет расклад "Три карты"</li>
            <li><strong>Сложные вопросы</strong> - попробуйте "Кельтский крест"</li>
            <li><strong>Специфические темы</strong> - выберите тематический расклад</li>
          </ul>
        </div>
      </div>

      {/* Модальное окно для вопроса */}
      <Modal
        isOpen={questionModalOpen}
        onClose={() => setQuestionModalOpen(false)}
        title="Сформулируйте ваш вопрос"
      >
        <div className="question-modal-content">
          <div className="selected-spread-info">
            <div className="spread-preview">
              <span className="spread-icon-large">{selectedSpread?.icon}</span>
              <h4>{selectedSpread?.name}</h4>
              <p>{selectedSpread?.description}</p>
            </div>
          </div>
          
          <div className="question-form">
            <label htmlFor="question">Ваш вопрос:</label>
            <textarea
              id="question"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Четко сформулируйте ваш вопрос..."
              rows={4}
              maxLength={500}
            />
            <div className="character-count">
              {question.length} / 500
            </div>
          </div>

          <div className="question-tips">
            <h5>Советы для хорошего вопроса:</h5>
            <ul>
              <li>Будьте конкретны в формулировке</li>
              <li>Избегайте вопросов "да/нет"</li>
              <li>Фокусируйтесь на том, что вы можете контролировать</li>
              <li>Открытость к неожиданным ответам</li>
            </ul>
          </div>

          <div className="modal-actions">
            <Button
              variant="secondary"
              onClick={() => setQuestionModalOpen(false)}
            >
              Отмена
            </Button>
            <Button
              variant="primary"
              onClick={handleStartReading}
              disabled={question.trim().length < 5}
            >
              Начать гадание
            </Button>
          </div>
        </div>
      </Modal>

      {/* Модальное окно гадания */}
      <Modal
        isOpen={readingModalOpen}
        onClose={() => setReadingModalOpen(false)}
        title={selectedSpread?.name}
        size="xl"
      >
        {renderSpreadComponent()}
      </Modal>
    </div>
  );
};

export default Spreads;