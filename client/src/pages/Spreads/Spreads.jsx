// client/src/pages/Spreads/Spreads.jsx
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTelegram } from '../../hooks/useTelegram';
import useAuthStore from '../../store/authStore';
import useCardsStore from '../../store/cardsStore';
import { getAvailableSpreads } from '../../services/api';
import Button from '../../components/common/Button';
import Loading from '../../components/common/Loading';
import { Modal } from '../../components/common/Modal';
import OneCardSpread from '../../components/spreads/OneCardSpread';
import ThreeCardSpread from '../../components/spreads/ThreeCardSpread';
import CelticCross from '../../components/spreads/CelticCross';
import CustomSpread from '../../components/spreads/CustomSpread';

const Spreads = () => {
  const { user, isAuthenticated } = useAuthStore();
  const { spreads, setSpreads } = useCardsStore();
  const { tg } = useTelegram();
  const [loading, setLoading] = useState(true);
  const [selectedSpread, setSelectedSpread] = useState(null);
  const [readingModalOpen, setReadingModalOpen] = useState(false);
  const [questionModalOpen, setQuestionModalOpen] = useState(false);
  const [question, setQuestion] = useState('');
  const [notifications, setNotifications] = useState([]);

  const spreadsData = [
    {
      id: 'one_card',
      name: 'Одна карта',
      description: 'Быстрый ответ на конкретный вопрос',
      cardsCount: 1,
      isPremium: false,
      icon: '🃏',
      color: 'from-blue-600 to-cyan-700'
    },
    {
      id: 'three_cards',
      name: 'Три карты',
      description: 'Прошлое, настоящее и будущее',
      cardsCount: 3,
      isPremium: false,
      icon: '🃖',
      color: 'from-green-600 to-emerald-700'
    },
    {
      id: 'love_spread',
      name: 'Расклад любви',
      description: 'Специально для вопросов о отношениях',
      cardsCount: 5,
      isPremium: true,
      icon: '💕',
      color: 'from-pink-600 to-rose-700'
    },
    {
      id: 'career_spread',
      name: 'Карьерный путь',
      description: 'Для вопросов о работе и карьере',
      cardsCount: 5,
      isPremium: true,
      icon: '💼',
      color: 'from-orange-600 to-amber-700'
    },
    {
      id: 'celtic_cross',
      name: 'Кельтский крест',
      description: 'Комплексный анализ ситуации',
      cardsCount: 10,
      isPremium: true,
      icon: '✨',
      color: 'from-purple-600 to-violet-700'
    },
    {
      id: 'year_spread',
      name: 'Расклад на год',
      description: 'Прогноз на весь год по месяцам',
      cardsCount: 12,
      isPremium: true,
      icon: '📅',
      color: 'from-indigo-600 to-blue-700'
    }
  ];

  useEffect(() => {
    // Настройка Telegram WebApp
    if (tg) {
      tg.ready();
      tg.MainButton.hide();
      tg.BackButton.show();
      tg.BackButton.onClick(() => {
        window.history.back();
      });
    }

    loadSpreads();
    
    return () => {
      if (tg) {
        tg.BackButton.hide();
        tg.BackButton.offClick();
      }
    };
  }, [tg]);

  const loadSpreads = async () => {
    try {
      setLoading(true);
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

    if (spread.isPremium && !user?.isPremium) {
      addNotification('Данный расклад доступен только для Premium пользователей', 'warning');
      return;
    }

    setSelectedSpread(spread);
    setQuestionModalOpen(true);
    tg?.HapticFeedback.impactOccurred('medium');
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
    if (spread.isPremium && !user?.isPremium) return false;
    return true;
  };

  const SpreadCard = ({ spread, index }) => {
    const available = isSpreadAvailable(spread);
    
    return (
      <motion.div
        className="relative"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: index * 0.1 }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <div 
          className={`bg-gradient-to-br ${spread.color} rounded-3xl p-6 shadow-xl border-2 border-white/20 relative overflow-hidden backdrop-blur-sm cursor-pointer ${!available ? 'opacity-50' : ''}`}
          onClick={() => available && handleSpreadSelect(spread)}
        >
          {spread.isPremium && (
            <div className="absolute top-3 right-3 bg-yellow-400 text-purple-900 text-xs font-bold px-2 py-1 rounded-full">
              Premium
            </div>
          )}
          
          {/* Фоновый блик */}
          <div className="absolute top-0 left-0 right-0 h-6 bg-white/10 rounded-t-3xl"></div>
          
          <div className="flex items-center space-x-4">
            <div className="text-5xl">{spread.icon}</div>
            <div className="flex-1">
              <h3 className="text-white font-bold text-xl">{spread.name}</h3>
              <p className="text-white/80 text-sm mt-1">{spread.description}</p>
              <div className="flex items-center mt-2 space-x-4">
                <span className="text-white/60 text-xs">
                  📱 {spread.cardsCount} {spread.cardsCount === 1 ? 'карта' : 'карт'}
                </span>
              </div>
            </div>
            <div className="text-white/60 text-2xl">→</div>
          </div>
          
          {/* Магические частицы */}
          <div className="absolute inset-0 pointer-events-none">
            {[...Array(4)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 bg-white/30 rounded-full"
                style={{
                  left: `${20 + i * 20}%`,
                  top: `${30 + i * 15}%`,
                }}
                animate={{
                  scale: [0, 1, 0],
                  opacity: [0, 1, 0],
                }}
                transition={{
                  duration: 3,
                  delay: i * 0.5,
                  repeat: Infinity,
                }}
              />
            ))}
          </div>
          
          {!available && (
            <div className="absolute inset-0 bg-black/50 rounded-3xl flex items-center justify-center">
              <div className="text-white text-center">
                {!isAuthenticated ? (
                  <span>Требуется авторизация</span>
                ) : spread.isPremium && !user?.isPremium ? (
                  <span>Premium Required</span>
                ) : (
                  <span>Недоступно</span>
                )}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    );
  };

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
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-violet-900 flex items-center justify-center">
        <Loading text="Загрузка раскладов..." />
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-violet-900 relative overflow-hidden"
      style={{ 
        paddingTop: 'env(safe-area-inset-top)',
        paddingBottom: 'env(safe-area-inset-bottom)',
        minHeight: 'var(--tg-viewport-height, 100vh)'
      }}
    >
      {/* Звёздное небо */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-yellow-300 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              opacity: [0.3, 1, 0.3],
              scale: [0.5, 1.5, 0.5],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              delay: Math.random() * 2,
              repeat: Infinity,
            }}
          />
        ))}
      </div>

      {/* Уведомления */}
      {notifications.length > 0 && (
        <div className="fixed top-4 left-4 right-4 z-50 space-y-2">
          {notifications.map(notification => (
            <motion.div
              key={notification.id}
              className={`p-4 rounded-2xl shadow-xl backdrop-blur-sm border ${
                notification.type === 'error' ? 'bg-red-500/90 border-red-400' :
                notification.type === 'warning' ? 'bg-yellow-500/90 border-yellow-400' :
                'bg-green-500/90 border-green-400'
              }`}
              initial={{ opacity: 0, y: -50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -50 }}
            >
              <div className="text-white text-sm">{notification.message}</div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Контент */}
      <div className="relative z-10 px-4 py-6 pb-20">
        
        {/* Заголовок */}
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-white text-3xl font-bold mb-2">🔮 Расклады Таро</h1>
          <p className="text-purple-200">Выберите подходящий расклад для вашего вопроса</p>
        </motion.div>

        {/* Статистика пользователя */}
        {isAuthenticated && (
          <motion.div
            className="bg-white/10 backdrop-blur-lg rounded-3xl p-6 border border-white/20 shadow-xl mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-white font-bold text-lg">Ваша статистика</h3>
                <p className="text-purple-200 text-sm">
                  {user?.isPremium ? '💎 Premium пользователь' : '✨ Бесплатный доступ'}
                </p>
              </div>
              <div className="text-right">
                <div className="text-white font-bold text-2xl">{user?.totalReadings || 0}</div>
                <div className="text-purple-200 text-sm">всего гаданий</div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Бесплатные расклады */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <h3 className="text-white text-xl font-semibold mb-4">✨ Бесплатные расклады</h3>
          <div className="space-y-4">
            {spreadsData.filter(spread => !spread.isPremium).map((spread, index) => (
              <SpreadCard key={spread.id} spread={spread} index={index} />
            ))}
          </div>
        </motion.div>

        {/* Premium расклады */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <h3 className="text-white text-xl font-semibold mb-4">💎 Premium расклады</h3>
          <div className="space-y-4">
            {spreadsData.filter(spread => spread.isPremium).map((spread, index) => (
              <SpreadCard key={spread.id} spread={spread} index={index} />
            ))}
          </div>
        </motion.div>

        {/* Информационный блок */}
        <motion.div
          className="text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
            <h3 className="text-white font-bold text-lg mb-4">💡 Как выбрать расклад?</h3>
            <div className="text-left space-y-2 text-sm text-purple-200">
              <div>🃏 <strong>Одна карта</strong> - для быстрых ответов</div>
              <div>🃖 <strong>Три карты</strong> - для анализа ситуации</div>
              <div>💕 <strong>Расклад любви</strong> - для вопросов о отношениях</div>
              <div>💼 <strong>Карьерный путь</strong> - для рабочих вопросов</div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Модальное окно для вопроса */}
      <Modal
        isOpen={questionModalOpen}
        onClose={() => setQuestionModalOpen(false)}
        title="Сформулируйте ваш вопрос"
      >
        <div className="p-6">
          <div className="text-center mb-6">
            <div className="text-6xl mb-4">{selectedSpread?.icon}</div>
            <h4 className="text-xl font-bold text-gray-800">{selectedSpread?.name}</h4>
            <p className="text-gray-600">{selectedSpread?.description}</p>
          </div>
          
          <div className="mb-6">
            <label htmlFor="question" className="block text-sm font-medium text-gray-700 mb-2">
              Ваш вопрос:
            </label>
            <textarea
              id="question"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Четко сформулируйте ваш вопрос..."
              rows={4}
              maxLength={500}
              className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
            />
            <div className="text-right text-sm text-gray-500 mt-1">
              {question.length} / 500
            </div>
          </div>

          <div className="bg-purple-50 rounded-xl p-4 mb-6">
            <h5 className="font-medium text-purple-900 mb-2">💡 Советы для хорошего вопроса:</h5>
            <ul className="text-sm text-purple-700 space-y-1">
              <li>• Будьте конкретны в формулировке</li>
              <li>• Избегайте вопросов "да/нет"</li>
              <li>• Фокусируйтесь на том, что можете контролировать</li>
            </ul>
          </div>

          <div className="flex space-x-3">
            <Button
              variant="secondary"
              onClick={() => setQuestionModalOpen(false)}
              className="flex-1"
            >
              Отмена
            </Button>
            <Button
              variant="primary"
              onClick={handleStartReading}
              disabled={question.trim().length < 5}
              className="flex-1"
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