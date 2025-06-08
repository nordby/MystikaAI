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
    }, []);

    const showAlert = (message) => {
        webApp?.showAlert(message);
    };

    const showConfirm = (message) => {
        return new Promise((resolve) => {
            webApp?.showConfirm(message, resolve);
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
        isSupported: !!window.Telegram?.WebApp
    };
};