// shared/types/user.js

/**
 * Типы пользователей
 */
const USER_TYPES = {
    FREE: 'free',
    PREMIUM: 'premium',
    ADMIN: 'admin'
};

/**
 * Статусы пользователей
 */
const USER_STATUS = {
    ACTIVE: 'active',
    INACTIVE: 'inactive',
    BANNED: 'banned',
    PENDING: 'pending'
};

/**
 * Роли пользователей
 */
const USER_ROLES = {
    USER: 'user',
    MODERATOR: 'moderator',
    ADMIN: 'admin',
    SUPER_ADMIN: 'super_admin'
};

/**
 * Настройки уведомлений
 */
const NOTIFICATION_TYPES = {
    DAILY_CARD: 'daily_card',
    PREMIUM_EXPIRY: 'premium_expiry',
    NEW_FEATURES: 'new_features',
    PROMOTIONAL: 'promotional',
    SYSTEM: 'system'
};

/**
 * Предпочтения пользователя
 */
const USER_PREFERENCES = {
    LANGUAGE: {
        RU: 'ru',
        EN: 'en',
        ES: 'es',
        FR: 'fr'
    },
    THEME: {
        LIGHT: 'light',
        DARK: 'dark',
        AUTO: 'auto'
    },
    TIMEZONE: {
        UTC: 'UTC',
        MOSCOW: 'Europe/Moscow',
        NEW_YORK: 'America/New_York',
        LONDON: 'Europe/London'
    }
};

/**
 * Лимиты для бесплатных пользователей
 */
const FREE_USER_LIMITS = {
    DAILY_CARDS: 1,
    SPREADS: 3,
    AI_ANALYSIS: 0,
    VOICE_READINGS: 0,
    CUSTOM_SPREADS: 0,
    PHOTO_ANALYSIS: 0
};

/**
 * Источники регистрации
 */
const REGISTRATION_SOURCES = {
    TELEGRAM: 'telegram',
    WEBAPP: 'webapp',
    REFERRAL: 'referral',
    SOCIAL: 'social',
    DIRECT: 'direct'
};

/**
 * Валидация пользовательских данных
 */
const USER_VALIDATION = {
    TELEGRAM_ID: {
        type: 'number',
        required: true,
        min: 1
    },
    FIRST_NAME: {
        type: 'string',
        required: true,
        minLength: 1,
        maxLength: 100
    },
    LAST_NAME: {
        type: 'string',
        required: false,
        maxLength: 100
    },
    USERNAME: {
        type: 'string',
        required: false,
        pattern: /^[a-zA-Z0-9_]{5,32}$/
    },
    EMAIL: {
        type: 'string',
        required: false,
        pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    },
    BIRTH_DATE: {
        type: 'date',
        required: false,
        min: new Date('1900-01-01'),
        max: new Date()
    }
};

/**
 * Схема пользователя
 */
const USER_SCHEMA = {
    id: 'uuid',
    telegramId: 'bigint',
    firstName: 'string',
    lastName: 'string?',
    username: 'string?',
    email: 'string?',
    birthDate: 'date?',
    type: USER_TYPES,
    status: USER_STATUS,
    role: USER_ROLES,
    languageCode: 'string',
    timezone: 'string',
    preferences: {
        theme: USER_PREFERENCES.THEME,
        notifications: {
            [NOTIFICATION_TYPES.DAILY_CARD]: 'boolean',
            [NOTIFICATION_TYPES.PREMIUM_EXPIRY]: 'boolean',
            [NOTIFICATION_TYPES.NEW_FEATURES]: 'boolean',
            [NOTIFICATION_TYPES.PROMOTIONAL]: 'boolean',
            [NOTIFICATION_TYPES.SYSTEM]: 'boolean'
        },
        privacy: {
            shareStats: 'boolean',
            allowAnalytics: 'boolean',
            publicProfile: 'boolean'
        }
    },
    limits: {
        dailyCards: 'number',
        spreads: 'number',
        aiAnalysis: 'number',
        voiceReadings: 'number',
        photoAnalysis: 'number'
    },
    stats: {
        totalReadings: 'number',
        lastReadingAt: 'date?',
        joinedAt: 'date',
        lastActiveAt: 'date',
        currentStreak: 'number',
        longestStreak: 'number'
    },
    referral: {
        referralCode: 'string',
        referredBy: 'uuid?',
        totalReferrals: 'number',
        activeReferrals: 'number'
    },
    subscription: {
        isActive: 'boolean',
        planId: 'uuid?',
        expiresAt: 'date?',
        autoRenew: 'boolean'
    },
    metadata: {
        registrationSource: REGISTRATION_SOURCES,
        ipAddress: 'string?',
        userAgent: 'string?',
        deviceInfo: 'object?'
    },
    createdAt: 'date',
    updatedAt: 'date'
};

/**
 * Методы работы с пользователем
 */
const USER_METHODS = {
    /**
     * Проверка премиум статуса
     */
    isPremium: (user) => {
        return user.type === USER_TYPES.PREMIUM && 
               user.subscription.isActive && 
               new Date(user.subscription.expiresAt) > new Date();
    },

    /**
     * Проверка лимитов
     */
    canPerformAction: (user, actionType) => {
        if (USER_METHODS.isPremium(user)) {
            return true;
        }
        
        const limit = user.limits[actionType] || FREE_USER_LIMITS[actionType.toUpperCase()];
        return user.stats.dailyUsage[actionType] < limit;
    },

    /**
     * Получение отображаемого имени
     */
    getDisplayName: (user) => {
        if (user.lastName) {
            return `${user.firstName} ${user.lastName}`;
        }
        return user.firstName;
    },

    /**
     * Проверка прав доступа
     */
    hasPermission: (user, permission) => {
        const rolePermissions = {
            [USER_ROLES.USER]: ['read_own', 'update_own'],
            [USER_ROLES.MODERATOR]: ['read_own', 'update_own', 'moderate_content'],
            [USER_ROLES.ADMIN]: ['read_all', 'update_all', 'moderate_content', 'manage_users'],
            [USER_ROLES.SUPER_ADMIN]: ['*']
        };

        const permissions = rolePermissions[user.role] || [];
        return permissions.includes('*') || permissions.includes(permission);
    },

    /**
     * Форматирование настроек пользователя
     */
    getFormattedPreferences: (user) => {
        return {
            theme: user.preferences.theme || USER_PREFERENCES.THEME.AUTO,
            language: user.languageCode || USER_PREFERENCES.LANGUAGE.RU,
            timezone: user.timezone || USER_PREFERENCES.TIMEZONE.UTC,
            notifications: {
                dailyCard: user.preferences.notifications[NOTIFICATION_TYPES.DAILY_CARD] ?? true,
                premiumExpiry: user.preferences.notifications[NOTIFICATION_TYPES.PREMIUM_EXPIRY] ?? true,
                newFeatures: user.preferences.notifications[NOTIFICATION_TYPES.NEW_FEATURES] ?? false,
                promotional: user.preferences.notifications[NOTIFICATION_TYPES.PROMOTIONAL] ?? false,
                system: user.preferences.notifications[NOTIFICATION_TYPES.SYSTEM] ?? true
            }
        };
    }
};

/**
 * События пользователя
 */
const USER_EVENTS = {
    CREATED: 'user.created',
    UPDATED: 'user.updated',
    DELETED: 'user.deleted',
    PREMIUM_ACTIVATED: 'user.premium.activated',
    PREMIUM_EXPIRED: 'user.premium.expired',
    SUBSCRIPTION_RENEWED: 'user.subscription.renewed',
    SUBSCRIPTION_CANCELLED: 'user.subscription.cancelled',
    LIMITS_EXCEEDED: 'user.limits.exceeded',
    STREAK_ACHIEVED: 'user.streak.achieved'
};

module.exports = {
    USER_TYPES,
    USER_STATUS,
    USER_ROLES,
    NOTIFICATION_TYPES,
    USER_PREFERENCES,
    FREE_USER_LIMITS,
    REGISTRATION_SOURCES,
    USER_VALIDATION,
    USER_SCHEMA,
    USER_METHODS,
    USER_EVENTS
};