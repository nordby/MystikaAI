// client/src/index.js
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/globals.css';

// Проверка окружения Telegram WebApp
if (window.Telegram?.WebApp) {
  const tg = window.Telegram.WebApp;
  
  // Инициализация Telegram WebApp
  tg.ready();
  
  // Установка цветовой схемы
  tg.setHeaderColor('#1a1a2e');
  tg.setBackgroundColor('#0f0f1e');
  
  // Расширение на весь экран
  tg.expand();
  
  // Включение режима закрытия по свайпу
  tg.isClosingConfirmationEnabled = true;
  
  // Логирование для отладки
  console.log('Telegram WebApp инициализирован:', {
    initData: tg.initData,
    initDataUnsafe: tg.initDataUnsafe,
    version: tg.version,
    platform: tg.platform,
    colorScheme: tg.colorScheme
  });
} else {
  console.warn('Приложение запущено вне Telegram');
}

// Рендеринг приложения
const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Регистрация Service Worker для PWA (опционально)
if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then(
      (registration) => {
        console.log('ServiceWorker зарегистрирован:', registration);
      },
      (err) => {
        console.log('Ошибка регистрации ServiceWorker:', err);
      }
    );
  });
}