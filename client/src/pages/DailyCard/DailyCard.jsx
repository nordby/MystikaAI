import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const DailyCard = () => {
  const [dailyCard, setDailyCard] = useState(null);
  const [isRevealed, setIsRevealed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDailyCard();
  }, []);

  const fetchDailyCard = async () => {
    try {
      setLoading(true);
      // Имитация запроса к API
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const mockCard = {
        id: Math.floor(Math.random() * 78) + 1,
        name: 'Маг',
        image: '/images/cards/magician.jpg',
        meaning: 'Сегодня вы обладаете особой силой воплощения своих желаний в реальность. Используйте свои таланты и навыки максимально эффективно.',
        advice: 'Сосредоточьтесь на конкретных целях и действуйте решительно. Это время для новых начинаний.',
        energy: 'Активная, творческая энергия',
        keywords: ['сила воли', 'мастерство', 'концентрация', 'новые начинания'],
        date: new Date().toLocaleDateString('ru-RU')
      };
      
      setDailyCard(mockCard);
    } catch (error) {
      console.error('Ошибка загрузки карты дня:', error);
    } finally {
      setLoading(false);
    }
  };

  const revealCard = () => {
    setIsRevealed(true);
  };

  if (loading) {
    return (
      <div className="daily-card-page min-h-screen bg-gradient-to-br from-purple-900 to-blue-900 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="animate-spin text-6xl mb-4">🔮</div>
          <p className="text-xl">Вселенная выбирает вашу карту...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="daily-card-page min-h-screen bg-gradient-to-br from-purple-900 to-blue-900 p-6">
      <div className="max-w-2xl mx-auto">
        {/* Заголовок */}
        <motion.div 
          className="text-center text-white mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-3xl font-bold mb-2">Карта дня</h1>
          <p className="text-lg opacity-90">{dailyCard?.date}</p>
        </motion.div>

        {/* Карта */}
        <motion.div 
          className="card-container text-center mb-8"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
        >
          <div 
            className={`card-wrapper mx-auto cursor-pointer transition-transform duration-700 ${
              isRevealed ? 'transform-none' : 'hover:scale-105'
            }`}
            style={{ 
              width: '200px', 
              height: '320px',
              perspective: '1000px'
            }}
            onClick={!isRevealed ? revealCard : undefined}
          >
            <div 
              className={`card-inner relative w-full h-full transition-transform duration-700 transform-style-preserve-3d ${
                isRevealed ? 'rotate-y-180' : ''
              }`}
            >
              {/* Рубашка карты */}
              <div className="card-back absolute inset-0 backface-hidden bg-gradient-to-br from-purple-800 to-blue-800 rounded-xl flex items-center justify-center border-4 border-gold">
                <div className="text-center text-white">
                  <div className="text-4xl mb-2">🔮</div>
                  <p className="text-sm">Нажмите для открытия</p>
                </div>
              </div>

              {/* Лицо карты */}
              <div className="card-front absolute inset-0 backface-hidden rotate-y-180 bg-white rounded-xl border-4 border-gold shadow-2xl">
                <div className="p-4 h-full flex flex-col">
                  <div className="text-center mb-4">
                    <h3 className="text-xl font-bold text-gray-800">{dailyCard?.name}</h3>
                  </div>
                  <div className="flex-1 bg-gradient-to-b from-purple-100 to-blue-100 rounded-lg flex items-center justify-center">
                    <div className="text-6xl">🎭</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Интерпретация */}
        {isRevealed && (
          <motion.div 
            className="interpretation bg-white/90 backdrop-blur-sm rounded-2xl p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <h2 className="text-2xl font-bold text-gray-800 mb-4">{dailyCard?.name}</h2>
            
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-700 mb-2">Значение:</h3>
                <p className="text-gray-600">{dailyCard?.meaning}</p>
              </div>
              
              <div>
                <h3 className="font-semibold text-gray-700 mb-2">Совет дня:</h3>
                <p className="text-gray-600">{dailyCard?.advice}</p>
              </div>
              
              <div>
                <h3 className="font-semibold text-gray-700 mb-2">Энергия дня:</h3>
                <p className="text-gray-600">{dailyCard?.energy}</p>
              </div>
              
              <div>
                <h3 className="font-semibold text-gray-700 mb-2">Ключевые слова:</h3>
                <div className="flex flex-wrap gap-2">
                  {dailyCard?.keywords?.map((keyword, index) => (
                    <span 
                      key={index}
                      className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm"
                    >
                      {keyword}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button 
                onClick={() => {
                  setIsRevealed(false);
                  fetchDailyCard();
                }}
                className="flex-1 bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 transition-colors"
              >
                Новая карта
              </button>
              <button className="flex-1 bg-gray-600 text-white py-3 rounded-lg font-semibold hover:bg-gray-700 transition-colors">
                Поделиться
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default DailyCard;