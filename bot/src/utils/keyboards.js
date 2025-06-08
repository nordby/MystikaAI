// bot/src/utils/keyboards.js

/**
 * Создание inline клавиатуры
 */
const createInlineKeyboard = (buttons) => {
  return {
    inline_keyboard: buttons
  };
};

/**
 * Создание reply клавиатуры
 */
const createReplyKeyboard = (buttons, options = {}) => {
  return {
    keyboard: buttons,
    resize_keyboard: true,
    one_time_keyboard: false,
    ...options
  };
};

/**
 * Создание клавиатуры главного меню
 */
const getMainMenuKeyboard = () => {
  return createReplyKeyboard([
    ['🃏 Дневная карта', '🔮 Гадание'],
    ['🔢 Нумерология', '🌙 Лунный календарь'],
    ['👥 Групповые гадания', '👫 Друзья'],
    ['💎 Премиум', '📱 Приложение']
  ]);
};

/**
 * Удаление клавиатуры
 */
const removeKeyboard = () => {
  return {
    remove_keyboard: true
  };
};

/**
 * Кнопка для веб-приложения
 */
const createWebAppButton = (text, url) => {
  return {
    text: text,
    web_app: { url: url }
  };
};

/**
 * Кнопка для URL
 */
const createUrlButton = (text, url) => {
  return {
    text: text,
    url: url
  };
};

/**
 * Кнопка для callback
 */
const createCallbackButton = (text, data) => {
  return {
    text: text,
    callback_data: data
  };
};

/**
 * Создание пагинации
 */
const createPaginationKeyboard = (currentPage, totalPages, prefix) => {
  const buttons = [];
  
  // Стрелки навигации
  const navButtons = [];
  if (currentPage > 1) {
    navButtons.push(createCallbackButton('⬅️', `${prefix}_prev_${currentPage - 1}`));
  }
  
  navButtons.push(createCallbackButton(`${currentPage}/${totalPages}`, 'noop'));
  
  if (currentPage < totalPages) {
    navButtons.push(createCallbackButton('➡️', `${prefix}_next_${currentPage + 1}`));
  }
  
  if (navButtons.length > 0) {
    buttons.push(navButtons);
  }
  
  // Быстрые переходы
  if (totalPages > 3) {
    const quickButtons = [];
    if (currentPage > 2) {
      quickButtons.push(createCallbackButton('1', `${prefix}_page_1`));
    }
    if (currentPage < totalPages - 1) {
      quickButtons.push(createCallbackButton(totalPages.toString(), `${prefix}_page_${totalPages}`));
    }
    
    if (quickButtons.length > 0) {
      buttons.push(quickButtons);
    }
  }
  
  return buttons;
};

/**
 * Клавиатура для числовых значений
 */
const createNumberKeyboard = (min, max, prefix) => {
  const buttons = [];
  let row = [];
  
  for (let i = min; i <= max; i++) {
    row.push(createCallbackButton(i.toString(), `${prefix}_${i}`));
    
    if (row.length === 3 || i === max) {
      buttons.push([...row]);
      row = [];
    }
  }
  
  return buttons;
};

/**
 * Клавиатура подтверждения
 */
const createConfirmKeyboard = (confirmData, cancelData) => {
  return createInlineKeyboard([
    [
      createCallbackButton('✅ Да', confirmData),
      createCallbackButton('❌ Нет', cancelData)
    ]
  ]);
};

/**
 * Клавиатура с возвратом
 */
const createBackKeyboard = (backData) => {
  return createInlineKeyboard([
    [createCallbackButton('🔙 Назад', backData)]
  ]);
};

/**
 * Клавиатура закрытия
 */
const createCloseKeyboard = () => {
  return createInlineKeyboard([
    [createCallbackButton('❌ Закрыть', 'close')]
  ]);
};

/**
 * Клавиатура выбора языка
 */
const createLanguageKeyboard = () => {
  return createInlineKeyboard([
    [
      createCallbackButton('🇷🇺 Русский', 'lang_ru'),
      createCallbackButton('🇺🇸 English', 'lang_en')
    ],
    [
      createCallbackButton('🇪🇸 Español', 'lang_es'),
      createCallbackButton('🇫🇷 Français', 'lang_fr')
    ]
  ]);
};

/**
 * Клавиатура настроек
 */
const createSettingsKeyboard = () => {
  return createInlineKeyboard([
    [
      createCallbackButton('🔔 Уведомления', 'settings_notifications'),
      createCallbackButton('🎨 Тема', 'settings_theme')
    ],
    [
      createCallbackButton('🌐 Язык', 'settings_language'),
      createCallbackButton('🔮 Колода', 'settings_deck')
    ],
    [
      createCallbackButton('🔙 Назад', 'main_menu')
    ]
  ]);
};

module.exports = {
  createInlineKeyboard,
  createReplyKeyboard,
  getMainMenuKeyboard,
  removeKeyboard,
  createWebAppButton,
  createUrlButton,
  createCallbackButton,
  createPaginationKeyboard,
  createNumberKeyboard,
  createConfirmKeyboard,
  createBackKeyboard,
  createCloseKeyboard,
  createLanguageKeyboard,
  createSettingsKeyboard
};