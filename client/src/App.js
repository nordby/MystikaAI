// client/src/App.js
import React, { useEffect, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

// Stores
import useAuthStore from './store/authStore';
import useUserStore from './store/userStore';
import useSettingsStore from './store/settingsStore';

// Hooks
import { useTelegram } from './hooks/useTelegram';

// Components
import Layout from './components/common/Layout';
import Loading from './components/common/Loading';
import ErrorBoundary from './components/common/ErrorBoundary';

// Lazy loading страниц
const Home = lazy(() => import('./pages/Home'));
const DailyCard = lazy(() => import('./pages/DailyCard'));
const Spreads = lazy(() => import('./pages/Spreads'));
const History = lazy(() => import('./pages/History'));
const Profile = lazy(() => import('./pages/Profile'));
const Premium = lazy(() => import('./pages/Premium'));
const Friends = lazy(() => import('./pages/Friends'));
const Numerology = lazy(() => import('./pages/Numerology'));
const LunarCalendar = lazy(() => import('./pages/LunarCalendar'));

// Константы
import { ROUTES } from './utils/constants';

function App() {
  const { tg, user: telegramUser, isDevelopment } = useTelegram();
  const { login, isAuthenticated, isLoading: authLoading } = useAuthStore();
  const { fetchUserProfile } = useUserStore();
  const { theme, loadSettings } = useSettingsStore();

  // Инициализация при загрузке
  useEffect(() => {
    const initApp = async () => {
      console.log('App init:', { telegramUser, isDevelopment, isAuthenticated });
      
      if (telegramUser && !isDevelopment) {
        try {
          // Авторизация через Telegram
          await login({
            telegramId: telegramUser.id,
            firstName: telegramUser.first_name,
            lastName: telegramUser.last_name,
            username: telegramUser.username,
            photoUrl: telegramUser.photo_url,
            languageCode: telegramUser.language_code
          });

          // Загрузка профиля и настроек
          await fetchUserProfile();
          await loadSettings();
        } catch (error) {
          console.error('Ошибка инициализации:', error);
        }
      } else if (isDevelopment) {
        try {
          // В режиме разработки только загружаем настройки
          await loadSettings();
        } catch (error) {
          console.error('Ошибка загрузки настроек в dev режиме:', error);
        }
      }
    };

    initApp();
  }, [telegramUser, isDevelopment]);

  // Применение темы
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    
    // Синхронизация с темой Telegram
    if (tg) {
      const isDark = theme === 'dark' || tg.colorScheme === 'dark';
      document.documentElement.classList.toggle('dark', isDark);
    }
  }, [theme, tg]);

  // Показать загрузку при инициализации
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{
        background: 'var(--gradient-background)'
      }}>
        <div className="mystical-loading"></div>
      </div>
    );
  }

  // Проверяем авторизацию ИЛИ режим разработки
  const shouldRenderApp = isAuthenticated || isDevelopment;
  console.log('Render check:', { isAuthenticated, isDevelopment, shouldRenderApp });

  return (
    <ErrorBoundary>
      <Router>
        <div className="min-h-screen text-white" style={{
          background: 'var(--gradient-background)',
          color: 'var(--text-primary)'
        }}>
          <AnimatePresence mode="wait">
            {shouldRenderApp ? (
              <Layout>
                {/* Уведомление для режима разработки */}
                {isDevelopment && (
                  <div style={{
                    background: 'var(--gradient-primary)',
                    color: 'var(--primary-dark)'
                  }} className="text-center p-2 text-sm font-medium">
                    🚧 РЕЖИМ РАЗРАБОТКИ - Тестирование вне Telegram
                  </div>
                )}
                
                <Suspense 
                  fallback={
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center justify-center min-h-[60vh]"
                    >
                      <div className="mystical-loading"></div>
                    </motion.div>
                  }
                >
                  <Routes>
                    <Route path={ROUTES.HOME} element={<Home />} />
                    <Route path={ROUTES.DAILY} element={<DailyCard />} />
                    <Route path={ROUTES.SPREADS} element={<Spreads />} />
                    <Route path={ROUTES.HISTORY} element={<History />} />
                    <Route path={ROUTES.PROFILE} element={<Profile />} />
                    <Route path={ROUTES.PREMIUM} element={<Premium />} />
                    <Route path={ROUTES.FRIENDS} element={<Friends />} />
                    <Route path={ROUTES.NUMEROLOGY} element={<Numerology />} />
                    <Route path={ROUTES.LUNAR} element={<LunarCalendar />} />
                    <Route path="*" element={<Navigate to={ROUTES.HOME} replace />} />
                  </Routes>
                </Suspense>
              </Layout>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center justify-center min-h-screen p-4"
              >
                <div className="text-center">
                  <h1 className="text-6xl font-bold mb-4 orbitron gradient-text">
                    🔮 MYSTIKA
                  </h1>
                  <p style={{ color: 'var(--text-secondary)' }} className="mb-8 text-lg">
                    Откройте тайны будущего в Web3
                  </p>
                  <p style={{ color: 'var(--text-secondary)' }} className="mb-8">
                    Пожалуйста, откройте приложение через Telegram
                  </p>
                  <a
                    href={`https://t.me/${process.env.REACT_APP_TELEGRAM_BOT_USERNAME}`}
                    className="mystical-btn inline-flex items-center font-medium"
                  >
                    <span className="mr-2">📱</span>
                    Открыть в Telegram
                  </a>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Toast уведомления в стиле MYSTIKA */}
          <Toaster
            position="top-center"
            toastOptions={{
              duration: 4000,
              style: {
                background: 'rgba(26, 0, 26, 0.9)',
                color: 'var(--text-primary)',
                border: '1px solid rgba(255, 0, 255, 0.3)',
                borderRadius: '15px',
                padding: '16px',
                backdropFilter: 'blur(10px)',
                boxShadow: '0 10px 30px rgba(0, 255, 255, 0.2)',
              },
              success: {
                iconTheme: {
                  primary: 'var(--accent-blue)',
                  secondary: 'var(--primary-dark)',
                },
              },
              error: {
                iconTheme: {
                  primary: 'var(--accent-pink)',
                  secondary: 'var(--primary-dark)',
                },
              },
            }}
          />
        </div>
      </Router>
    </ErrorBoundary>
  );
}

export default App;