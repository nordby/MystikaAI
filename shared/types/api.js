// shared/types/api.js

/**
 * HTTP методы
 */
const HTTP_METHODS = {
    GET: 'GET',
    POST: 'POST',
    PUT: 'PUT',
    PATCH: 'PATCH',
    DELETE: 'DELETE',
    OPTIONS: 'OPTIONS'
};

/**
 * HTTP статус коды
 */
const HTTP_STATUS = {
    // Успешные ответы
    OK: 200,
    CREATED: 201,
    ACCEPTED: 202,
    NO_CONTENT: 204,
    
    // Перенаправления
    MOVED_PERMANENTLY: 301,
    FOUND: 302,
    NOT_MODIFIED: 304,
    
    // Ошибки клиента
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    METHOD_NOT_ALLOWED: 405,
    CONFLICT: 409,
    UNPROCESSABLE_ENTITY: 422,
    TOO_MANY_REQUESTS: 429,
    
    // Ошибки сервера
    INTERNAL_SERVER_ERROR: 500,
    NOT_IMPLEMENTED: 501,
    BAD_GATEWAY: 502,
    SERVICE_UNAVAILABLE: 503,
    GATEWAY_TIMEOUT: 504
};

/**
 * Типы контента
 */
const CONTENT_TYPES = {
    JSON: 'application/json',
    FORM_DATA: 'multipart/form-data',
    URL_ENCODED: 'application/x-www-form-urlencoded',
    TEXT: 'text/plain',
    HTML: 'text/html',
    XML: 'application/xml'
};

/**
 * Стандартная структура API ответа
 */
const API_RESPONSE_SCHEMA = {
    success: 'boolean',
    data: 'any?',
    message: 'string?',
    error: {
        code: 'string?',
        message: 'string?',
        details: 'any?'
    },
    meta: {
        timestamp: 'string',
        version: 'string?',
        requestId: 'string?'
    },
    pagination: {
        page: 'number?',
        limit: 'number?',
        total: 'number?',
        totalPages: 'number?',
        hasNext: 'boolean?',
        hasPrev: 'boolean?'
    }
};

/**
 * Коды ошибок приложения
 */
const ERROR_CODES = {
    // Общие ошибки
    INTERNAL_ERROR: 'INTERNAL_ERROR',
    VALIDATION_ERROR: 'VALIDATION_ERROR',
    NOT_FOUND: 'NOT_FOUND',
    ALREADY_EXISTS: 'ALREADY_EXISTS',
    
    // Аутентификация и авторизация
    AUTH_REQUIRED: 'AUTH_REQUIRED',
    INVALID_TOKEN: 'INVALID_TOKEN',
    TOKEN_EXPIRED: 'TOKEN_EXPIRED',
    INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',
    
    // Лимиты и ограничения
    RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
    DAILY_LIMIT_EXCEEDED: 'DAILY_LIMIT_EXCEEDED',
    PREMIUM_REQUIRED: 'PREMIUM_REQUIRED',
    
    // Пользователи
    USER_NOT_FOUND: 'USER_NOT_FOUND',
    USER_ALREADY_EXISTS: 'USER_ALREADY_EXISTS',
    USER_BANNED: 'USER_BANNED',
    
    // Карты и гадания
    CARD_NOT_FOUND: 'CARD_NOT_FOUND',
    READING_NOT_FOUND: 'READING_NOT_FOUND',
    INVALID_SPREAD: 'INVALID_SPREAD',
    
    // Платежи
    PAYMENT_FAILED: 'PAYMENT_FAILED',
    PAYMENT_CANCELLED: 'PAYMENT_CANCELLED',
    SUBSCRIPTION_NOT_FOUND: 'SUBSCRIPTION_NOT_FOUND',
    INVALID_PROMO_CODE: 'INVALID_PROMO_CODE',
    
    // AI и анализ
    AI_SERVICE_UNAVAILABLE: 'AI_SERVICE_UNAVAILABLE',
    ANALYSIS_FAILED: 'ANALYSIS_FAILED',
    UNSUPPORTED_FILE_TYPE: 'UNSUPPORTED_FILE_TYPE',
    FILE_TOO_LARGE: 'FILE_TOO_LARGE',
    
    // Telegram
    TELEGRAM_ERROR: 'TELEGRAM_ERROR',
    WEBHOOK_VERIFICATION_FAILED: 'WEBHOOK_VERIFICATION_FAILED'
};

/**
 * Типы API эндпоинтов
 */
const ENDPOINT_TYPES = {
    PUBLIC: 'public',      // Публичные эндпоинты
    PROTECTED: 'protected', // Требуют аутентификации
    PREMIUM: 'premium',    // Требуют премиум подписку
    ADMIN: 'admin'         // Требуют права администратора
};

/**
 * Параметры пагинации
 */
const PAGINATION_DEFAULTS = {
    PAGE: 1,
    LIMIT: 20,
    MAX_LIMIT: 100
};

/**
 * Параметры кэширования
 */
const CACHE_TYPES = {
    NO_CACHE: 'no-cache',
    SHORT: 'short',    // 5 минут
    MEDIUM: 'medium',  // 1 час
    LONG: 'long'       // 24 часа
};

/**
 * Схемы запросов
 */
const REQUEST_SCHEMAS = {
    // Аутентификация
    TELEGRAM_AUTH: {
        telegramId: 'number',
        firstName: 'string',
        lastName: 'string?',
        username: 'string?',
        languageCode: 'string?'
    },
    
    // Карты
    CARD_INTERPRETATION: {
        cardId: 'uuid',
        isReversed: 'boolean?',
        question: 'string?',
        context: 'string?'
    },
    
    // Гадания
    CREATE_READING: {
        type: 'string',
        question: 'string?',
        spreadId: 'string?',
        cardCount: 'number?'
    },
    
    // Платежи
    CREATE_PAYMENT: {
        planId: 'uuid',
        paymentMethod: 'string',
        promoCode: 'string?'
    },
    
    // AI анализ
    ANALYZE_PHOTO: {
        image: 'file',
        question: 'string?',
        focusArea: 'string?'
    }
};

/**
 * Схемы ответов
 */
const RESPONSE_SCHEMAS = {
    // Пользователь
    USER_PROFILE: {
        id: 'uuid',
        telegramId: 'number',
        firstName: 'string',
        lastName: 'string?',
        username: 'string?',
        isPremium: 'boolean',
        subscription: 'object?',
        stats: 'object',
        preferences: 'object'
    },
    
    // Карта
    CARD_DATA: {
        id: 'uuid',
        cardName: 'string',
        suit: 'string?',
        cardType: 'string',
        meaningUpright: 'string',
        meaningReversed: 'string',
        imageUrl: 'string',
        keywords: 'string[]'
    },
    
    // Гадание
    READING_RESULT: {
        id: 'uuid',
        type: 'string',
        question: 'string?',
        cards: 'array',
        interpretation: 'string?',
        createdAt: 'string'
    },
    
    // Платеж
    PAYMENT_INFO: {
        id: 'uuid',
        amount: 'number',
        currency: 'string',
        status: 'string',
        paymentUrl: 'string?',
        expiresAt: 'string?'
    }
};

/**
 * Конфигурация rate limiting
 */
const RATE_LIMITS = {
    DEFAULT: {
        windowMs: 15 * 60 * 1000, // 15 минут
        max: 100 // максимум запросов
    },
    STRICT: {
        windowMs: 15 * 60 * 1000,
        max: 20
    },
    PREMIUM_ONLY: {
        windowMs: 60 * 60 * 1000, // 1 час
        max: 5
    },
    AI_ANALYSIS: {
        windowMs: 60 * 60 * 1000,
        max: 10
    }
};

/**
 * Конфигурация CORS
 */
const CORS_CONFIG = {
    ALLOWED_ORIGINS: [
        'https://t.me',
        'https://web.telegram.org',
        process.env.WEBAPP_URL
    ],
    ALLOWED_METHODS: [
        HTTP_METHODS.GET,
        HTTP_METHODS.POST,
        HTTP_METHODS.PUT,
        HTTP_METHODS.DELETE,
        HTTP_METHODS.OPTIONS
    ],
    ALLOWED_HEADERS: [
        'Content-Type',
        'Authorization',
        'X-Requested-With',
        'X-API-Key'
    ],
    MAX_AGE: 86400 // 24 часа
};

/**
 * Утилиты для работы с API
 */
const API_UTILS = {
    /**
     * Создание стандартного успешного ответа
     */
    createSuccessResponse: (data, message = null, meta = {}) => ({
        success: true,
        data,
        message,
        meta: {
            timestamp: new Date().toISOString(),
            ...meta
        }
    }),

    /**
     * Создание стандартного ответа с ошибкой
     */
    createErrorResponse: (code, message, details = null, status = HTTP_STATUS.BAD_REQUEST) => ({
        success: false,
        error: {
            code,
            message,
            details
        },
        meta: {
            timestamp: new Date().toISOString()
        }
    }),

    /**
     * Создание ответа с пагинацией
     */
    createPaginatedResponse: (data, pagination) => ({
        success: true,
        data,
        pagination,
        meta: {
            timestamp: new Date().toISOString()
        }
    }),

    /**
     * Валидация параметров пагинации
     */
    validatePagination: (page, limit) => {
        const validPage = Math.max(1, parseInt(page) || PAGINATION_DEFAULTS.PAGE);
        const validLimit = Math.min(
            PAGINATION_DEFAULTS.MAX_LIMIT,
            Math.max(1, parseInt(limit) || PAGINATION_DEFAULTS.LIMIT)
        );
        
        return { page: validPage, limit: validLimit };
    },

    /**
     * Создание метаданных пагинации
     */
    createPaginationMeta: (page, limit, total) => {
        const totalPages = Math.ceil(total / limit);
        
        return {
            page,
            limit,
            total,
            totalPages,
            hasNext: page < totalPages,
            hasPrev: page > 1
        };
    }
};

module.exports = {
    HTTP_METHODS,
    HTTP_STATUS,
    CONTENT_TYPES,
    API_RESPONSE_SCHEMA,
    ERROR_CODES,
    ENDPOINT_TYPES,
    PAGINATION_DEFAULTS,
    CACHE_TYPES,
    REQUEST_SCHEMAS,
    RESPONSE_SCHEMAS,
    RATE_LIMITS,
    CORS_CONFIG,
    API_UTILS
};