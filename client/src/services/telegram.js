// client/src/services/telegram.js

class TelegramService {
  constructor() {
    this.tg = window.Telegram?.WebApp;
    this.initWebApp();
  }

  initWebApp() {
    if (this.tg) {
      // Настройка WebApp
      this.tg.ready();
      this.tg.expand();
      
      // Настройка темы
      this.tg.setHeaderColor('#1a1a2e');
      this.tg.setBackgroundColor('#16213e');
      
      // Включение кнопки назад если нужно
      this.tg.BackButton.show();
      this.tg.BackButton.onClick(() => {
        window.history.back();
      });
    }
  }

  // Получение данных пользователя Telegram
  getUserData() {
    if (!this.tg?.initDataUnsafe?.user) {
      return null;
    }

    return {
      telegram_id: this.tg.initDataUnsafe.user.id,
      username: this.tg.initDataUnsafe.user.username,
      first_name: this.tg.initDataUnsafe.user.first_name,
      last_name: this.tg.initDataUnsafe.user.last_name,
      language_code: this.tg.initDataUnsafe.user.language_code,
      photo_url: this.tg.initDataUnsafe.user.photo_url
    };
  }

  // Получение стартового параметра (например, реферальный код)
  getStartParam() {
    return this.tg?.initDataUnsafe?.start_param;
  }

  // Показать главную кнопку
  showMainButton(text, onClick) {
    if (this.tg?.MainButton) {
      this.tg.MainButton.setText(text);
      this.tg.MainButton.show();
      this.tg.MainButton.onClick(onClick);
    }
  }

  // Скрыть главную кнопку
  hideMainButton() {
    if (this.tg?.MainButton) {
      this.tg.MainButton.hide();
    }
  }

  // Показать кнопку назад
  showBackButton(onClick) {
    if (this.tg?.BackButton) {
      this.tg.BackButton.show();
      this.tg.BackButton.onClick(onClick);
    }
  }

  // Скрыть кнопку назад
  hideBackButton() {
    if (this.tg?.BackButton) {
      this.tg.BackButton.hide();
    }
  }

  // Показать всплывающее окно
  showAlert(message) {
    if (this.tg?.showAlert) {
      this.tg.showAlert(message);
    } else {
      alert(message);
    }
  }

  // Показать диалог подтверждения
  showConfirm(message, callback) {
    if (this.tg?.showConfirm) {
      this.tg.showConfirm(message, callback);
    } else {
      const result = confirm(message);
      callback(result);
    }
  }

  // Закрыть WebApp
  close() {
    if (this.tg?.close) {
      this.tg.close();
    }
  }

  // Отправить данные в бот
  sendData(data) {
    if (this.tg?.sendData) {
      this.tg.sendData(JSON.stringify(data));
    }
  }

  // Открыть ссылку
  openLink(url) {
    if (this.tg?.openLink) {
      this.tg.openLink(url);
    } else {
      window.open(url, '_blank');
    }
  }

  // Открыть Telegram ссылку
  openTelegramLink(url) {
    if (this.tg?.openTelegramLink) {
      this.tg.openTelegramLink(url);
    } else {
      window.open(url, '_blank');
    }
  }

  // Запросить контакт
  requestContact(callback) {
    if (this.tg?.requestContact) {
      this.tg.requestContact(callback);
    }
  }

  // Вибрация
  vibrate() {
    if (this.tg?.HapticFeedback) {
      this.tg.HapticFeedback.impactOccurred('medium');
    }
  }

  // Поделиться
  shareToStory(mediaUrl, options = {}) {
    if (this.tg?.shareToStory) {
      this.tg.shareToStory(mediaUrl, options);
    }
  }

  // Получить цветовую схему
  getColorScheme() {
    return this.tg?.colorScheme || 'light';
  }

  // Получить данные темы
  getThemeParams() {
    return this.tg?.themeParams || {};
  }

  // Проверка доступности WebApp
  isWebAppAvailable() {
    return !!this.tg;
  }

  // Получить версию WebApp
  getVersion() {
    return this.tg?.version;
  }

  // Установить заголовок
  setHeaderColor(color) {
    if (this.tg?.setHeaderColor) {
      this.tg.setHeaderColor(color);
    }
  }

  // Установить цвет фона
  setBackgroundColor(color) {
    if (this.tg?.setBackgroundColor) {
      this.tg.setBackgroundColor(color);
    }
  }

  // Событие при изменении размера окна
  onViewportChanged(callback) {
    if (this.tg?.onEvent) {
      this.tg.onEvent('viewportChanged', callback);
    }
  }

  // Событие при изменении темы
  onThemeChanged(callback) {
    if (this.tg?.onEvent) {
      this.tg.onEvent('themeChanged', callback);
    }
  }

  // Валидация initData для безопасности
  validateInitData() {
    // Здесь должна быть проверка подписи initData
    // для предотвращения подделки данных
    return this.tg?.initData;
  }
}

export default new TelegramService();