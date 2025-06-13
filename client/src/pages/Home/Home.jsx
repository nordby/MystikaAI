import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useTelegram } from '../../hooks/useTelegram';

const Home = () => {
  const { user, webApp, tg } = useTelegram();
  const [greeting, setGreeting] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    // Настройка Telegram WebApp
    if (tg) {
      tg.ready();
      tg.expand();
      tg.enableClosingConfirmation();
      
      // Настройка MainButton для главного действия
      tg.MainButton.text = "🌅 Карта дня";
      tg.MainButton.color = "#6A5ACD";
      tg.MainButton.textColor = "#FFFFFF";
      tg.MainButton.show();
      
      tg.MainButton.onClick(() => {
        tg.HapticFeedback.impactOccurred('medium');
        window.location.href = '/daily';
      });
    }

    // Генерация приветствия на основе времени
    const hour = new Date().getHours();
    let timeGreeting;
    if (hour < 6) timeGreeting = 'Доброй ночи';
    else if (hour < 12) timeGreeting = 'Доброе утро';
    else if (hour < 18) timeGreeting = 'Добрый день';
    else timeGreeting = 'Добрый вечер';
    
    setGreeting(timeGreeting);

    return () => {
      if (tg) {
        tg.MainButton.hide();
        tg.MainButton.offClick();
      }
    };
  }, [tg]);

  const MysticCard = ({ icon, title, subtitle, color, to, premium = false }) => (
    <Link to={to}>
      <motion.div
        className="relative"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onTap={() => tg?.HapticFeedback.impactOccurred('light')}
      >
        <div className={`bg-gradient-to-br ${color} rounded-3xl p-6 shadow-xl border-2 border-white/20 relative overflow-hidden backdrop-blur-sm`}>
          {premium && (
            <div className="absolute top-3 right-3 bg-yellow-400 text-purple-900 text-xs font-bold px-2 py-1 rounded-full">
              Premium
            </div>
          )}
          
          {/* Фоновый блик */}
          <div className="absolute top-0 left-0 right-0 h-6 bg-white/10 rounded-t-3xl"></div>
          
          <div className="flex items-center space-x-4">
            <div className="text-4xl">{icon}</div>
            <div className="flex-1">
              <h3 className="text-white font-bold text-lg">{title}</h3>
              <p className="text-white/80 text-sm">{subtitle}</p>
            </div>
            <div className="text-white/60 text-xl">→</div>
          </div>
          
          {/* Магические частицы */}
          <div className="absolute inset-0 pointer-events-none">
            {[...Array(3)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 bg-white/30 rounded-full"
                style={{
                  left: `${30 + i * 20}%`,
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
        </div>
      </motion.div>
    </Link>
  );

  const UserStatusCard = () => (
    <motion.div
      className="bg-white/10 backdrop-blur-lg rounded-3xl p-6 border border-white/20 shadow-xl"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <div className="flex items-center space-x-4">
        <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-2xl">
          {user?.first_name ? user.first_name.charAt(0).toUpperCase() : '🔮'}
        </div>
        <div className="flex-1">
          <h2 className="text-white text-xl font-bold">
            {greeting}, {user?.first_name || 'Мистик'}!
          </h2>
          <div className="flex items-center space-x-4 mt-1">
            <span className="text-purple-200 text-sm">
              {user?.isPremium ? '💎 Premium' : '✨ Бесплатный доступ'}
            </span>
            {user?.totalReadings && (
              <span className="text-purple-200 text-sm">
                📚 {user.totalReadings} гаданий
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );

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
        {[...Array(30)].map((_, i) => (
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

      {/* Контент */}
      <div className="relative z-10 px-4 py-6 pb-20">
        
        {/* Приветствие пользователя */}
        <UserStatusCard />
        
        {/* Дневная карта - главная функция */}
        <motion.div
          className="mt-6 mb-8"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <MysticCard
            icon="🌅"
            title="Карта дня"
            subtitle="Ваше ежедневное послание от карт"
            color="from-amber-600 to-orange-700"
            to="/daily"
          />
        </motion.div>

        {/* Основные функции */}
        <motion.div
          className="space-y-4 mb-8"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          <h3 className="text-white text-lg font-semibold mb-4">Основные функции</h3>
          
          <MysticCard
            icon="🔮"
            title="Новое гадание"
            subtitle="Задайте вопрос картам Таро"
            color="from-purple-600 to-indigo-700"
            to="/spreads"
          />
          
          <MysticCard
            icon="🔢"
            title="Нумерология"
            subtitle="Узнайте тайны чисел вашей судьбы"
            color="from-emerald-600 to-teal-700"
            to="/numerology"
          />
          
          <MysticCard
            icon="🌙"
            title="Лунный календарь"
            subtitle="Следуйте циклам Луны для гармонии"
            color="from-blue-600 to-purple-700"
            to="/lunar"
          />
        </motion.div>

        {/* Дополнительные функции */}
        <motion.div
          className="space-y-4 mb-8"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
        >
          <h3 className="text-white text-lg font-semibold mb-4">Дополнительно</h3>
          
          <div className="grid grid-cols-2 gap-4">
            <MysticCard
              icon="👤"
              title="Профиль"
              subtitle="Ваши настройки"
              color="from-gray-600 to-gray-700"
              to="/profile"
            />
            
            <MysticCard
              icon="💎"
              title="Премиум"
              subtitle="Больше возможностей"
              color="from-yellow-600 to-orange-700"
              to="/premium"
              premium
            />
            
            <MysticCard
              icon="👥"
              title="Друзья"
              subtitle="Пригласите близких"
              color="from-pink-500 to-rose-600"
              to="/friends"
            />
            
            <MysticCard
              icon="📚"
              title="История"
              subtitle="Ваши гадания"
              color="from-indigo-500 to-blue-600"
              to="/history"
            />
          </div>
        </motion.div>

        {/* Информационный блок */}
        <motion.div
          className="text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
            <p className="text-purple-300 text-sm mb-2">
              ✨ Добро пожаловать в мир мистики!
            </p>
            <p className="text-white/60 text-xs">
              Откройте тайны вселенной с помощью древних карт Таро и мудрости чисел
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Home;