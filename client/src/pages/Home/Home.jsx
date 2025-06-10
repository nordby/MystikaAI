import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useTelegram } from '../../hooks/useTelegram';

const Home = () => {
  const { user, webApp, tg } = useTelegram();
  const [cardRevealed, setCardRevealed] = useState(false);
  const [userStats, setUserStats] = useState({ 
    crystals: 12450, 
    level: 15, 
    streak: 12,
    energy: 750,
    maxEnergy: 1000,
    coins: 89234,
    profit: 2350
  });
  const [dailyReward, setDailyReward] = useState(true);
  const [tapCount, setTapCount] = useState(0);
  const [floatingCoins, setFloatingCoins] = useState([]);

  useEffect(() => {
    // Настройка Telegram WebApp
    if (tg) {
      tg.ready();
      tg.expand();
      tg.enableClosingConfirmation();
      
      // Настройка MainButton для главного действия
      tg.MainButton.text = "🔮 СДЕЛАТЬ РАСКЛАД";
      tg.MainButton.color = "#6A5ACD";
      tg.MainButton.textColor = "#FFFFFF";
      tg.MainButton.show();
      
      tg.MainButton.onClick(() => {
        tg.HapticFeedback.impactOccurred('heavy');
        window.location.href = '/spreads';
      });
    }

    // Автоматическое раскрытие карты
    const timer = setTimeout(() => {
      setCardRevealed(true);
      if (tg) tg.HapticFeedback.impactOccurred('light');
    }, 1500);

    return () => {
      clearTimeout(timer);
      if (tg) {
        tg.MainButton.hide();
        tg.MainButton.offClick();
      }
    };
  }, [tg]);

  const TarotCard = ({ isRevealed }) => (
    <motion.div
      className="relative w-32 h-48 mx-auto"
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.8, type: "spring", bounce: 0.4 }}
      style={{ perspective: '1000px' }}
      onTap={() => {
        setCardRevealed(!cardRevealed);
        if (tg) tg.HapticFeedback.impactOccurred('medium');
      }}
    >
      <motion.div
        className="relative w-full h-full preserve-3d"
        animate={{ rotateY: isRevealed ? 180 : 0 }}
        transition={{ duration: 0.8, ease: "easeInOut" }}
      >
        {/* Рубашка карты */}
        <div className="absolute inset-0 backface-hidden">
          <div className="w-full h-full rounded-2xl shadow-xl relative overflow-hidden border-4 border-gradient-mystic">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-purple-900 to-violet-900" />
            <div className="absolute inset-2 border-2 border-yellow-400/60 rounded-xl" />
            
            {/* Центральная пентаграмма */}
            <div className="absolute inset-0 flex items-center justify-center">
              <motion.div
                className="w-16 h-16 text-yellow-400"
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
              >
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
              </motion.div>
            </div>
            
            {/* Декоративные элементы по углам */}
            {[0, 90, 180, 270].map((rotation, i) => (
              <div
                key={i}
                className="absolute w-6 h-6 text-yellow-400/40"
                style={{
                  top: rotation === 0 || rotation === 90 ? '8px' : 'auto',
                  bottom: rotation === 180 || rotation === 270 ? '8px' : 'auto',
                  left: rotation === 0 || rotation === 270 ? '8px' : 'auto',
                  right: rotation === 90 || rotation === 180 ? '8px' : 'auto',
                  transform: `rotate(${rotation}deg)`
                }}
              >
                ✧
              </div>
            ))}
          </div>
        </div>

        {/* Лицо карты */}
        <div className="absolute inset-0 backface-hidden rotate-y-180">
          <div className="w-full h-full rounded-2xl shadow-xl relative overflow-hidden border-4 border-yellow-400">
            <div className="absolute inset-0 bg-gradient-to-br from-yellow-100 via-purple-50 to-indigo-100" />
            
            {/* Рамка */}
            <div className="absolute inset-2 border-2 border-purple-800 rounded-xl bg-white/90" />
            
            {/* Изображение "Мага" */}
            <div className="absolute inset-4 flex flex-col items-center justify-center">
              {/* Символ бесконечности */}
              <div className="text-purple-800 text-lg mb-1">∞</div>
              
              {/* Фигура */}
              <div className="w-8 h-12 bg-purple-800 rounded-t-full relative mb-2">
                {/* Жезл */}
                <div className="absolute -left-2 top-1 w-4 h-1 bg-yellow-500 rounded rotate-45"></div>
              </div>
              
              {/* Алтарь */}
              <div className="w-12 h-3 bg-purple-600 rounded flex items-center justify-center space-x-1">
                <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full"></div>
                <div className="w-1.5 h-1.5 bg-red-400 rounded"></div>
                <div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div>
              </div>
              
              {/* Название */}
              <div className="text-purple-800 text-xs font-bold mt-2">I - МАГ</div>
            </div>
            
            {/* Магическое свечение */}
            <motion.div
              className="absolute inset-0 rounded-2xl"
              animate={{
                boxShadow: [
                  '0 0 20px rgba(255, 215, 0, 0.4)',
                  '0 0 40px rgba(255, 215, 0, 0.6)',
                  '0 0 20px rgba(255, 215, 0, 0.4)'
                ]
              }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </div>
        </div>
      </motion.div>
    </motion.div>
  );

  const StatCard = ({ value, label, icon, color = "purple", gradient }) => (
    <motion.div
      className="relative flex-1"
      whileTap={{ scale: 0.95 }}
      onTap={() => tg?.HapticFeedback.impactOccurred('light')}
    >
      <div className={`${gradient} rounded-2xl p-4 shadow-xl border-2 border-white/20 backdrop-blur-sm`}>
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="text-white font-bold text-lg">{value}</div>
            <div className="text-white/80 text-xs">{label}</div>
          </div>
          <div className="text-2xl">{icon}</div>
        </div>
        {/* Gaming style highlight */}
        <div className="absolute top-1 left-1 right-1 h-2 bg-white/20 rounded-t-xl"></div>
      </div>
    </motion.div>
  );

  const FloatingCoin = ({ id, x, y }) => (
    <motion.div
      key={id}
      className="absolute pointer-events-none z-50"
      style={{ left: x, top: y }}
      initial={{ opacity: 1, scale: 1, y: 0 }}
      animate={{ opacity: 0, scale: 1.5, y: -100 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1 }}
      onAnimationComplete={() => {
        setFloatingCoins(prev => prev.filter(coin => coin.id !== id));
      }}
    >
      <div className="text-2xl font-bold text-yellow-400">+{Math.floor(Math.random() * 50) + 10}</div>
    </motion.div>
  );

  const MysticButton = ({ icon, title, subtitle, color, onTap, premium = false }) => (
    <motion.div
      className="relative"
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onTap={() => {
        tg?.HapticFeedback.impactOccurred('medium');
        onTap?.();
      }}
    >
      <div className={`bg-gradient-to-br ${color} rounded-3xl p-6 shadow-xl border-4 border-yellow-400/50 relative overflow-hidden`}>
        {premium && (
          <div className="absolute top-2 right-2 bg-yellow-400 text-purple-900 text-xs font-bold px-2 py-1 rounded-full">
            VIP
          </div>
        )}
        
        {/* Фоновый блик */}
        <div className="absolute top-0 left-0 right-0 h-8 bg-white/20 rounded-t-3xl"></div>
        
        <div className="flex items-center space-x-4">
          <div className="text-4xl">{icon}</div>
          <div className="flex-1">
            <h3 className="text-white font-bold text-lg">{title}</h3>
            <p className="text-white/80 text-sm">{subtitle}</p>
          </div>
          <div className="text-yellow-400 text-xl">→</div>
        </div>
        
        {/* Магические частицы */}
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(3)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-yellow-400 rounded-full"
              style={{
                left: `${30 + i * 20}%`,
                top: `${20 + i * 15}%`,
              }}
              animate={{
                scale: [0, 1, 0],
                opacity: [0, 1, 0],
              }}
              transition={{
                duration: 2,
                delay: i * 0.4,
                repeat: Infinity,
              }}
            />
          ))}
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
      <div className="relative z-10 px-4 pb-20">
        
        {/* Хедер с статистикой */}
        <motion.div
          className="pt-4 pb-6"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-white text-xl font-bold">Добро пожаловать!</h1>
              <p className="text-purple-200 text-sm">{user?.first_name || 'Мистик'}</p>
            </div>
            
            {dailyReward && (
              <motion.div
                className="bg-gradient-to-r from-yellow-400 to-orange-400 rounded-2xl px-4 py-2 shadow-lg"
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                onTap={() => {
                  setDailyReward(false);
                  tg?.HapticFeedback.notificationOccurred('success');
                }}
              >
                <div className="text-center">
                  <div className="text-purple-900 font-bold text-sm">🎁 Подарок</div>
                  <div className="text-purple-800 text-xs">Нажми!</div>
                </div>
              </motion.div>
            )}
          </div>
          
          {/* Gaming Stats Top Bar */}
          <div className="space-y-3">
            {/* Coins & Level */}
            <div className="flex space-x-3">
              <StatCard 
                value={userStats.coins.toLocaleString()} 
                label="Coins" 
                icon="🪙" 
                gradient="bg-gradient-to-r from-yellow-500 to-orange-500"
              />
              <StatCard 
                value={`${userStats.level}`} 
                label="Level" 
                icon="⭐" 
                gradient="bg-gradient-to-r from-purple-500 to-pink-500"
              />
              <StatCard 
                value={`+${userStats.profit}/h`} 
                label="Profit" 
                icon="💰" 
                gradient="bg-gradient-to-r from-green-500 to-emerald-500"
              />
            </div>
            
            {/* Energy Bar */}
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
              <div className="flex items-center justify-between mb-2">
                <span className="text-white text-sm font-medium">⚡ Energy</span>
                <span className="text-white text-sm">{userStats.energy}/{userStats.maxEnergy}</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-3 relative overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-blue-400 to-cyan-400 rounded-full"
                  style={{ width: `${(userStats.energy / userStats.maxEnergy) * 100}%` }}
                  animate={{ 
                    boxShadow: [
                      '0 0 10px rgba(59, 130, 246, 0.5)',
                      '0 0 20px rgba(59, 130, 246, 0.8)',
                      '0 0 10px rgba(59, 130, 246, 0.5)'
                    ]
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Main Tap Area - Gaming Style */}
        <motion.div
          className="text-center mb-8 relative"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <div className="bg-gradient-to-br from-purple-900/80 via-indigo-900/80 to-blue-900/80 backdrop-blur-xl rounded-3xl p-6 border-2 border-purple-400/30 shadow-2xl relative overflow-hidden">
            {/* Gaming header */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white text-xl font-bold flex items-center">
                🔮 Mystika Exchange
              </h2>
              <div className="text-yellow-400 text-sm font-bold">
                Tap to earn!
              </div>
            </div>
            
            {/* Main tap button */}
            <motion.div
              className="relative w-48 h-48 mx-auto mb-4 cursor-pointer"
              whileTap={{ scale: 0.9 }}
              animate={{ 
                scale: [1, 1.02, 1],
                boxShadow: [
                  '0 0 50px rgba(147, 51, 234, 0.4)',
                  '0 0 80px rgba(147, 51, 234, 0.6)',
                  '0 0 50px rgba(147, 51, 234, 0.4)'
                ]
              }}
              transition={{ duration: 2, repeat: Infinity }}
              onTap={(event) => {
                const rect = event.currentTarget.getBoundingClientRect();
                const x = event.clientX - rect.left;
                const y = event.clientY - rect.top;
                
                const coinId = Date.now() + Math.random();
                setFloatingCoins(prev => [...prev, { id: coinId, x, y }]);
                
                setTapCount(prev => prev + 1);
                setUserStats(prev => ({ ...prev, coins: prev.coins + Math.floor(Math.random() * 50) + 10 }));
                
                tg?.HapticFeedback.impactOccurred('heavy');
              }}
            >
              <div className="w-full h-full rounded-full bg-gradient-to-br from-purple-400 via-purple-500 to-purple-600 border-4 border-yellow-400 shadow-2xl flex items-center justify-center relative overflow-hidden">
                {/* Central crystal */}
                <motion.div
                  className="text-8xl"
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                >
                  💎
                </motion.div>
                
                {/* Ripple effect */}
                <motion.div
                  className="absolute inset-0 rounded-full border-4 border-white/30"
                  animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
                
                {/* Gaming particles */}
                {[...Array(6)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-2 h-2 bg-yellow-400 rounded-full"
                    style={{
                      left: `${20 + (i * 15)}%`,
                      top: `${20 + (i * 10)}%`,
                    }}
                    animate={{
                      scale: [0, 1, 0],
                      opacity: [0, 1, 0],
                      rotate: [0, 180, 360]
                    }}
                    transition={{
                      duration: 2,
                      delay: i * 0.3,
                      repeat: Infinity,
                    }}
                  />
                ))}
              </div>
              
              {/* Floating coins */}
              <AnimatePresence>
                {floatingCoins.map(coin => (
                  <FloatingCoin key={coin.id} {...coin} />
                ))}
              </AnimatePresence>
            </motion.div>
            
            {/* Tap counter */}
            <motion.div
              className="text-center"
              animate={{ scale: tapCount > 0 ? [1, 1.1, 1] : 1 }}
            >
              <div className="text-yellow-400 font-bold text-lg mb-1">
                💫 {tapCount} taps today
              </div>
              <div className="text-purple-200 text-sm">
                Keep tapping to unlock mystical powers!
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Gaming Features */}
        <motion.div
          className="space-y-4 mb-8"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          <div className="grid grid-cols-2 gap-3">
            <MysticButton
              icon="🔮"
              title="Spreads"
              subtitle="Unlock fortunes"
              color="from-purple-600 to-indigo-700"
              onTap={() => window.location.href = '/spreads'}
              premium
            />
            
            <MysticButton
              icon="🏪"
              title="Shop"
              subtitle="Buy upgrades"
              color="from-yellow-600 to-orange-700"
              onTap={() => window.location.href = '/premium'}
            />
            
            <MysticButton
              icon="🎯"
              title="Tasks"
              subtitle="Daily missions"
              color="from-emerald-600 to-teal-700"
              onTap={() => window.location.href = '/daily'}
            />
            
            <MysticButton
              icon="🌙"
              title="Lunar"
              subtitle="Moon phases"
              color="from-blue-600 to-purple-700"
              onTap={() => window.location.href = '/lunar'}
            />
          </div>
        </motion.div>

        {/* Gaming Bottom Navigation */}
        <motion.div
          className="space-y-4 mb-6"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
        >
          {/* Mining boost */}
          <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl p-4 border-2 border-green-400">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="text-3xl">⚡</div>
                <div>
                  <div className="text-white font-bold">Mining Boost</div>
                  <div className="text-green-200 text-sm">2x earnings for 1h</div>
                </div>
              </div>
              <motion.button
                className="bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2 text-white font-bold text-sm"
                whileTap={{ scale: 0.95 }}
                onTap={() => tg?.HapticFeedback.impactOccurred('medium')}
              >
                Activate
              </motion.button>
            </div>
          </div>
          
          {/* Quick actions */}
          <div className="grid grid-cols-4 gap-3">
            <Link to="/friends">
              <motion.div
                className="bg-gradient-to-br from-pink-500 to-rose-600 rounded-xl p-3 shadow-lg border border-pink-400 text-center"
                whileTap={{ scale: 0.95 }}
                onTap={() => tg?.HapticFeedback.impactOccurred('light')}
              >
                <div className="text-2xl mb-1">👥</div>
                <div className="text-white font-bold text-xs">Friends</div>
              </motion.div>
            </Link>
            
            <Link to="/history">
              <motion.div
                className="bg-gradient-to-br from-indigo-500 to-blue-600 rounded-xl p-3 shadow-lg border border-indigo-400 text-center"
                whileTap={{ scale: 0.95 }}
                onTap={() => tg?.HapticFeedback.impactOccurred('light')}
              >
                <div className="text-2xl mb-1">📈</div>
                <div className="text-white font-bold text-xs">Stats</div>
              </motion.div>
            </Link>
            
            <Link to="/numerology">
              <motion.div
                className="bg-gradient-to-br from-purple-500 to-violet-600 rounded-xl p-3 shadow-lg border border-purple-400 text-center"
                whileTap={{ scale: 0.95 }}
                onTap={() => tg?.HapticFeedback.impactOccurred('light')}
              >
                <div className="text-2xl mb-1">🔢</div>
                <div className="text-white font-bold text-xs">Numbers</div>
              </motion.div>
            </Link>
            
            <Link to="/profile">
              <motion.div
                className="bg-gradient-to-br from-orange-500 to-red-600 rounded-xl p-3 shadow-lg border border-orange-400 text-center"
                whileTap={{ scale: 0.95 }}
                onTap={() => tg?.HapticFeedback.impactOccurred('light')}
              >
                <div className="text-2xl mb-1">⚙️</div>
                <div className="text-white font-bold text-xs">Settings</div>
              </motion.div>
            </Link>
          </div>
        </motion.div>

        {/* Gaming footer */}
        <motion.div
          className="text-center pb-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
            <p className="text-purple-300 text-sm mb-2">
              🎮 Level up your mystical powers!
            </p>
            <div className="flex justify-center space-x-4 text-xs text-white/60">
              <span>⭐ {userStats.level}/100</span>
              <span>🏆 {userStats.streak} day streak</span>
              <span>💎 {userStats.crystals} gems</span>
            </div>
          </div>
        </motion.div>
      </div>

      <style jsx>{`
        .preserve-3d {
          transform-style: preserve-3d;
        }
        .backface-hidden {
          backface-visibility: hidden;
        }
        .rotate-y-180 {
          transform: rotateY(180deg);
        }
        .border-gradient-mystic {
          border-image: linear-gradient(45deg, #ffd700, #9333ea, #ffd700) 1;
        }
      `}</style>
    </div>
  );
};

export default Home;