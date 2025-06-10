import { useState, useEffect } from 'react';

export const useTelegram = () => {
    const [webApp, setWebApp] = useState(null);
    const [user, setUser] = useState(null);

    useEffect(() => {
        // Проверяем что мы в Telegram WebApp
        if (window.Telegram?.WebApp) {
            const tgWebApp = window.Telegram.WebApp;
            setWebApp(tgWebApp);
            
            // Получаем данные пользователя
            if (tgWebApp.initDataUnsafe?.user) {
                setUser(tgWebApp.initDataUnsafe.user);
            }
        } 
        // РЕЖИМ РАЗРАБОТКИ - для тестирования в браузере
        else if (process.env.NODE_ENV === 'development' || process.env.REACT_APP_FORCE_DEV === 'true') {
            // Создаем моковые данные пользователя для разработки
            const mockUser = {
                id: 123456789,
                first_name: 'Test',
                last_name: 'User',
                username: 'testuser',
                language_code: 'ru'
            };
            setUser(mockUser);
        }
    }, []);

    const showAlert = (message) => {
        if (webApp) {
            webApp?.showAlert(message);
        } else {
            // Fallback для браузера
            alert(message);
        }
    };

    const showConfirm = (message) => {
        return new Promise((resolve) => {
            if (webApp) {
                webApp?.showConfirm(message, resolve);
            } else {
                // Fallback для браузера
                resolve(confirm(message));
            }
        });
    };

    const hapticFeedback = (type = 'medium') => {
        webApp?.HapticFeedback?.impactOccurred(type);
    };

    const openInvoice = (url) => {
        webApp?.openInvoice(url);
    };

    const close = () => {
        webApp?.close();
    };

    return {
        webApp,
        user,
        showAlert,
        showConfirm,
        hapticFeedback,
        openInvoice,
        close,
        isSupported: !!window.Telegram?.WebApp,
        // Добавляем флаг режима разработки
        isDevelopment: (process.env.NODE_ENV === 'development' && !window.Telegram?.WebApp) || process.env.REACT_APP_FORCE_DEV === 'true'
    };
};