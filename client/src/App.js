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
      if (telegramUser) {
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
      }
    };

    initApp();
  }, [telegramUser]);

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
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 flex items-center justify-center">
        <Loading size="large" />
      </div>
    );
  }

  // Проверяем авторизацию ИЛИ режим разработки
  const shouldRenderApp = isAuthenticated || isDevelopment;

  return (
    <ErrorBoundary>
      <Router>
        <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 text-white">
          <AnimatePresence mode="wait">
            {shouldRenderApp ? (
              <Layout>
                {/* Уведомление для режима разработки */}
                {isDevelopment && (
                  <div className="bg-yellow-600 text-black text-center p-2 text-sm font-medium">
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
                      <Loading />
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
                  <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                    🔮 MISTIKA
                  </h1>
                  <p className="text-gray-300 mb-8">
                    Пожалуйста, откройте приложение через Telegram
                  </p>
                  <a
                    href={`https://t.me/${process.env.REACT_APP_TELEGRAM_BOT_USERNAME}`}
                    className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-full font-medium transition-all transform hover:scale-105"
                  >
                    Открыть в Telegram
                  </a>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Toast уведомления */}
          <Toaster
            position="top-center"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#1a1a2e',
                color: '#fff',
                border: '1px solid rgba(139, 92, 246, 0.3)',
                borderRadius: '12px',
                padding: '16px',
              },
              success: {
                iconTheme: {
                  primary: '#10b981',
                  secondary: '#fff',
                },
              },
              error: {
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#fff',
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