// client/src/utils/constants.js

/**
 * Константы для клиентского приложения
 */

// API конфигурация
export const API_CONFIG = {
  BASE_URL: process.env.REACT_APP_API_URL || 'http://localhost:3000/api',
  TIMEOUT: 30000,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000
};

// Telegram WebApp конфигурация
export const TELEGRAM_CONFIG = {
  BOT_USERNAME: process.env.REACT_APP_TELEGRAM_BOT_USERNAME || '',
  WEBAPP_URL: process.env.REACT_APP_WEBAPP_URL || 'http://localhost:3001',
  THEME_PARAMS: {
    bg_color: '#1a1a1a',
    text_color: '#ffffff',
    hint_color: '#708499',
    link_color: '#6ab7ff',
    button_color: '#5288c1',
    button_text_color: '#ffffff'
  }
};

// Ограничения пользователей
export const USER_LIMITS = {
  FREE: {
    DAILY_READINGS: 3,
    HISTORY_DAYS: 7,
    AI_INTERPRETATIONS: 1,
    VOICE_MINUTES: 0,
    PHOTO_ANALYSES: 0
  },
  PREMIUM: {
    DAILY_READINGS: -1, // безлимит
    HISTORY_DAYS: -1,   // безлимит
    AI_INTERPRETATIONS: -1,
    VOICE_MINUTES: 60,
    PHOTO_ANALYSES: 10
  }
};

// Типы гаданий
export const READING_TYPES = {
  DAILY_CARD: 'daily_card',
  ONE_CARD: 'one_card',
  THREE_CARDS: 'three_cards',
  CELTIC_CROSS: 'celtic_cross',
  CUSTOM: 'custom',
  NUMEROLOGY: 'numerology',
  LUNAR: 'lunar'
};

// Статусы гаданий
export const READING_STATUS = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  SAVED: 'saved',
  SHARED: 'shared'
};

// Позиции карт в раскладах
export const SPREAD_POSITIONS = {
  THREE_CARDS: {
    PAST: { id: 'past', name: 'Прошлое', position: 0 },
    PRESENT: { id: 'present', name: 'Настоящее', position: 1 },
    FUTURE: { id: 'future', name: 'Будущее', position: 2 }
  },
  CELTIC_CROSS: {
    PRESENT: { id: 'present', name: 'Текущая ситуация', position: 0 },
    CHALLENGE: { id: 'challenge', name: 'Препятствие', position: 1 },
    DISTANT_PAST: { id: 'distant_past', name: 'Далекое прошлое', position: 2 },
    RECENT_PAST: { id: 'recent_past', name: 'Недавнее прошлое', position: 3 },
    POSSIBLE_OUTCOME: { id: 'possible_outcome', name: 'Возможный исход', position: 4 },
    NEAR_FUTURE: { id: 'near_future', name: 'Ближайшее будущее', position: 5 },
    YOUR_APPROACH: { id: 'your_approach', name: 'Ваш подход', position: 6 },
    EXTERNAL_INFLUENCES: { id: 'external_influences', name: 'Внешние влияния', position: 7 },
    HOPES_FEARS: { id: 'hopes_fears', name: 'Надежды и страхи', position: 8 },
    FINAL_OUTCOME: { id: 'final_outcome', name: 'Итоговый результат', position: 9 }
  }
};

// Категории карт Таро
export const TAROT_CATEGORIES = {
  MAJOR_ARCANA: 'major_arcana',
  MINOR_ARCANA: 'minor_arcana',
  CUPS: 'cups',
  WANDS: 'wands',
  PENTACLES: 'pentacles',
  SWORDS: 'swords'
};

// Типы интерпретаций
export const INTERPRETATION_TYPES = {
  BASIC: 'basic',
  DETAILED: 'detailed',
  AI_ENHANCED: 'ai_enhanced',
  PERSONALIZED: 'personalized'
};

// Уровни доступа к функциям
export const FEATURE_ACCESS = {
  FREE: 'free',
  PREMIUM: 'premium',
  VIP: 'vip'
};

// Настройки анимации
export const ANIMATION_SETTINGS = {
  CARD_FLIP_DURATION: 600,
  CARD_DEAL_DELAY: 200,
  FADE_DURATION: 300,
  SLIDE_DURATION: 400,
  MYSTIC_PULSE_DURATION: 3000
};

// Настройки аудио
export const AUDIO_SETTINGS = {
  MAX_RECORDING_TIME: 300, // 5 минут
  SAMPLE_RATE: 44100,
  BIT_DEPTH: 16,
  CHANNELS: 1,
  FORMAT: 'wav'
};

// Размеры изображений
export const IMAGE_SIZES = {
  CARD_THUMBNAIL: { width: 120, height: 180 },
  CARD_MEDIUM: { width: 200, height: 300 },
  CARD_LARGE: { width: 300, height: 450 },
  PROFILE_AVATAR: { width: 100, height: 100 },
  ANALYSIS_PHOTO: { width: 800, height: 600 }
};

// Форматы файлов
export const FILE_FORMATS = {
  IMAGES: ['jpg', 'jpeg', 'png', 'webp'],
  AUDIO: ['wav', 'mp3', 'ogg'],
  DOCUMENTS: ['pdf', 'txt']
};

// Максимальные размеры файлов (в байтах)
export const FILE_SIZE_LIMITS = {
  IMAGE: 5 * 1024 * 1024, // 5MB
  AUDIO: 10 * 1024 * 1024, // 10MB
  DOCUMENT: 2 * 1024 * 1024 // 2MB
};

// Локализация
export const LOCALES = {
  RU: 'ru-RU',
  EN: 'en-US',
  ES: 'es-ES',
  FR: 'fr-FR',
  DE: 'de-DE'
};

// Настройки уведомлений
export const NOTIFICATION_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info'
};

export const NOTIFICATION_DURATION = {
  SHORT: 3000,
  MEDIUM: 5000,
  LONG: 8000,
  PERSISTENT: -1
};

// Клавиши локального хранилища
export const STORAGE_KEYS = {
  USER_PREFERENCES: 'mistika_user_preferences',
  READING_HISTORY: 'mistika_reading_history',
  THEME_SETTINGS: 'mistika_theme_settings',
  LANGUAGE: 'mistika_language',
  TUTORIAL_COMPLETED: 'mistika_tutorial_completed',
  LAST_DAILY_CARD: 'mistika_last_daily_card',
  PREMIUM_STATUS: 'mistika_premium_status'
};

// Настройки кэширования
export const CACHE_SETTINGS = {
  CARDS_TTL: 24 * 60 * 60 * 1000, // 24 часа
  READINGS_TTL: 7 * 24 * 60 * 60 * 1000, // 7 дней
  USER_DATA_TTL: 60 * 60 * 1000, // 1 час
  AI_RESPONSES_TTL: 30 * 24 * 60 * 60 * 1000 // 30 дней
};

// URL маршруты
export const ROUTES = {
  HOME: '/',
  DAILY_CARD: '/daily',
  SPREADS: '/spreads',
  HISTORY: '/history',
  PROFILE: '/profile',
  PREMIUM: '/premium',
  FRIENDS: '/friends',
  SETTINGS: '/settings',
  NUMEROLOGY: '/numerology',
  LUNAR: '/lunar',
  VOICE_READING: '/voice',
  PHOTO_ANALYSIS: '/photo'
};

// События аналитики
export const ANALYTICS_EVENTS = {
  PAGE_VIEW: 'page_view',
  CARD_DRAWN: 'card_drawn',
  READING_COMPLETED: 'reading_completed',
  PREMIUM_UPGRADE: 'premium_upgrade',
  SHARE_READING: 'share_reading',
  AI_INTERPRETATION: 'ai_interpretation',
  VOICE_RECORDING: 'voice_recording',
  PHOTO_ANALYSIS: 'photo_analysis'
};

// Социальные сети
export const SOCIAL_PLATFORMS = {
  TELEGRAM: 'telegram',
  VKONTAKTE: 'vkontakte',
  ODNOKLASSNIKI: 'odnoklassniki',
  FACEBOOK: 'facebook',
  TWITTER: 'twitter',
  INSTAGRAM: 'instagram'
};

// Настройки производительности
export const PERFORMANCE_SETTINGS = {
  LAZY_LOADING_OFFSET: 200,
  VIRTUAL_SCROLL_ITEM_HEIGHT: 100,
  DEBOUNCE_DELAY: 300,
  THROTTLE_DELAY: 100
};

// Паттерны валидации
export const VALIDATION_PATTERNS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE: /^\+?[1-9]\d{1,14}$/,
  USERNAME: /^[a-zA-Z0-9_]{3,20}$/,
  PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/
};

// Сообщения об ошибках
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Ошибка сети. Проверьте подключение к интернету.',
  SERVER_ERROR: 'Ошибка сервера. Попробуйте позже.',
  UNAUTHORIZED: 'Необходима авторизация.',
  FORBIDDEN: 'Доступ запрещен.',
  NOT_FOUND: 'Ресурс не найден.',
  VALIDATION_ERROR: 'Ошибка валидации данных.',
  PAYMENT_ERROR: 'Ошибка обработки платежа.',
  AI_SERVICE_ERROR: 'Сервис ИИ временно недоступен.',
  VOICE_RECOGNITION_ERROR: 'Ошибка распознавания голоса.',
  PHOTO_ANALYSIS_ERROR: 'Ошибка анализа изображения.'
};

// Сообщения об успехе
export const SUCCESS_MESSAGES = {
  READING_SAVED: 'Гадание сохранено!',
  PAYMENT_SUCCESS: 'Платеж успешно обработан!',
  PROFILE_UPDATED: 'Профиль обновлен!',
  SHARING_SUCCESS: 'Ссылка скопирована в буфер обмена!',
  BACKUP_CREATED: 'Резервная копия создана!',
  SETTINGS_SAVED: 'Настройки сохранены!'
};

// Конфигурация темной/светлой темы
export const THEME_CONFIG = {
  DARK: 'dark',
  LIGHT: 'light',
  AUTO: 'auto'
};

// Настройки доступности
export const A11Y_SETTINGS = {
  HIGH_CONTRAST: 'high_contrast',
  REDUCED_MOTION: 'reduced_motion',
  LARGE_TEXT: 'large_text',
  KEYBOARD_NAVIGATION: 'keyboard_navigation'
};

// Версия приложения и API
export const VERSION_INFO = {
  APP_VERSION: '1.0.0',
  API_VERSION: 'v1',
  MIN_API_VERSION: 'v1',
  BUILD_NUMBER: process.env.REACT_APP_BUILD_NUMBER || 'dev'
};

// Экспорт всех констант
export default {
  API_CONFIG,
  TELEGRAM_CONFIG,
  USER_LIMITS,
  READING_TYPES,
  READING_STATUS,
  SPREAD_POSITIONS,
  TAROT_CATEGORIES,
  INTERPRETATION_TYPES,
  FEATURE_ACCESS,
  ANIMATION_SETTINGS,
  AUDIO_SETTINGS,
  IMAGE_SIZES,
  FILE_FORMATS,
  FILE_SIZE_LIMITS,
  LOCALES,
  NOTIFICATION_TYPES,
  NOTIFICATION_DURATION,
  STORAGE_KEYS,
  CACHE_SETTINGS,
  ROUTES,
  ANALYTICS_EVENTS,
  SOCIAL_PLATFORMS,
  PERFORMANCE_SETTINGS,
  VALIDATION_PATTERNS,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  THEME_CONFIG,
  A11Y_SETTINGS,
  VERSION_INFO
};