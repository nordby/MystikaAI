import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Star, Users, Sparkles, Moon, Hash } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTelegram } from '../../hooks/useTelegram';

const Home = () => {
  const { user, webApp } = useTelegram();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const features = [
    {
      icon: Calendar,
      title: 'Карта дня',
      description: 'Получите персональный совет на сегодня',
      link: '/daily',
      color: 'from-purple-500 to-pink-500'
    },
    {
      icon: Star,
      title: 'Расклады Таро',
      description: 'Различные расклады для ответов на вопросы',
      link: '/spreads',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      icon: Hash,
      title: 'Нумерология',
      description: 'Узнайте тайны своего числа судьбы',
      link: '/numerology',
      color: 'from-green-500 to-emerald-500'
    },
    {
      icon: Moon,
      title: 'Лунный календарь',
      description: 'Следите за фазами луны и их влиянием',
      link: '/lunar',
      color: 'from-indigo-500 to-purple-500'
    },
    {
      icon: Users,
      title: 'Друзья',
      description: 'Делитесь гаданиями с друзьями',
      link: '/friends',
      color: 'from-orange-500 to-red-500'
    },
    {
      icon: Sparkles,
      title: 'AR Гадание',
      description: 'Сканируйте реальные карты камерой',
      link: '/ar-reading',
      color: 'from-teal-500 to-blue-500'
    }
  ];

  const greetingTime = () => {
    const hour = currentTime.getHours();
    if (hour < 6) return 'Доброй ночи';
    if (hour < 12) return 'Доброе утро';
    if (hour < 18) return 'Добрый день';
    return 'Добрый вечер';
  };

  return (
    <div className="home-page min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      {/* Заголовок */}
      <motion.div 
        className="hero-section text-white text-center py-12 px-6"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-4xl font-bold mb-4">
          {greetingTime()}, {user?.first_name || 'Искатель'}! ✨
        </h1>
        <p className="text-xl opacity-90 mb-2">
          Добро пожаловать в мир мистики и предсказаний
        </p>
        <div className="text-sm opacity-75">
          {currentTime.toLocaleDateString('ru-RU', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </div>
      </motion.div>

      {/* Основные функции */}
      <div className="features-grid max-w-6xl mx-auto px-6 pb-12">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Link to={feature.link}>
                <div className={`feature-card bg-gradient-to-br ${feature.color} rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1`}>
                  <feature.icon size={40} className="mb-4" />
                  <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                  <p className="text-sm opacity-90">{feature.description}</p>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Быстрые действия */}
      <motion.div 
        className="quick-actions max-w-4xl mx-auto px-6 pb-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
      >
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6">
          <h2 className="text-xl font-bold text-white mb-4 text-center">
            Быстрые действия
          </h2>
          <div className="flex flex-wrap justify-center gap-4">
            <Link 
              to="/daily"
              className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg transition-all"
            >
              📅 Карта дня
            </Link>
            <Link 
              to="/spreads?type=love"
              className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg transition-all"
            >
              ❤️ Любовный расклад
            </Link>
            <Link 
              to="/spreads?type=career"
              className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg transition-all"
            >
              💼 Карьера
            </Link>
            <Link 
              to="/lunar"
              className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg transition-all"
            >
              🌙 Лунная фаза
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Home;