// server/src/routes/auth.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth');
const authMiddleware = require('../middleware/auth');
const rateLimitingMiddleware = require('../middleware/rateLimiting');
const validationMiddleware = require('../middleware/validation');

// Middleware для ограничения частоты запросов
const authLimiter = rateLimitingMiddleware.createLimiter({
  windowMs: 15 * 60 * 1000, // 15 минут
  max: 10, // максимум 10 попыток за 15 минут
  message: 'Слишком много попыток авторизации. Попробуйте позже.'
});

const strictAuthLimiter = rateLimitingMiddleware.createLimiter({
  windowMs: 15 * 60 * 1000, // 15 минут
  max: 5, // максимум 5 попыток за 15 минут
  message: 'Слишком много попыток. Попробуйте позже.'
});

// Схемы валидации
const telegramAuthSchema = {
  telegramId: {
    in: ['body'],
    isString: {
      errorMessage: 'Telegram ID должен быть строкой'
    },
    notEmpty: {
      errorMessage: 'Telegram ID обязателен'
    }
  },
  firstName: {
    in: ['body'],
    optional: true,
    isString: {
      errorMessage: 'Имя должно быть строкой'
    },
    isLength: {
      options: { max: 100 },
      errorMessage: 'Имя не должно превышать 100 символов'
    }
  },
  lastName: {
    in: ['body'],
    optional: true,
    isString: {
      errorMessage: 'Фамилия должна быть строкой'
    },
    isLength: {
      options: { max: 100 },
      errorMessage: 'Фамилия не должна превышать 100 символов'
    }
  },
  username: {
    in: ['body'],
    optional: true,
    isString: {
      errorMessage: 'Username должен быть строкой'
    },
    isLength: {
      options: { max: 50 },
      errorMessage: 'Username не должен превышать 50 символов'
    }
  },
  languageCode: {
    in: ['body'],
    optional: true,
    isString: {
      errorMessage: 'Код языка должен быть строкой'
    },
    isLength: {
      options: { min: 2, max: 5 },
      errorMessage: 'Код языка должен быть от 2 до 5 символов'
    }
  },
  avatar: {
    in: ['body'],
    optional: true,
    isURL: {
      errorMessage: 'Аватар должен быть корректным URL'
    }
  }
};

const refreshTokenSchema = {
  refreshToken: {
    in: ['body'],
    isString: {
      errorMessage: 'Refresh token должен быть строкой'
    },
    notEmpty: {
      errorMessage: 'Refresh token обязателен'
    }
  }
};

const updateProfileSchema = {
  firstName: {
    in: ['body'],
    optional: true,
    isString: {
      errorMessage: 'Имя должно быть строкой'
    },
    isLength: {
      options: { min: 1, max: 100 },
      errorMessage: 'Имя должно быть от 1 до 100 символов'
    }
  },
  lastName: {
    in: ['body'],
    optional: true,
    isString: {
      errorMessage: 'Фамилия должна быть строкой'
    },
    isLength: {
      options: { max: 100 },
      errorMessage: 'Фамилия не должна превышать 100 символов'
    }
  },
  email: {
    in: ['body'],
    optional: true,
    isEmail: {
      errorMessage: 'Некорректный email адрес'
    },
    normalizeEmail: true
  },
  bio: {
    in: ['body'],
    optional: true,
    isString: {
      errorMessage: 'Биография должна быть строкой'
    },
    isLength: {
      options: { max: 500 },
      errorMessage: 'Биография не должна превышать 500 символов'
    }
  },
  birthDate: {
    in: ['body'],
    optional: true,
    isISO8601: {
      errorMessage: 'Некорректная дата рождения'
    }
  },
  timezone: {
    in: ['body'],
    optional: true,
    isString: {
      errorMessage: 'Часовой пояс должен быть строкой'
    }
  },
  preferences: {
    in: ['body'],
    optional: true,
    isObject: {
      errorMessage: 'Настройки должны быть объектом'
    }
  }
};

// Роуты

/**
 * @route   POST /api/auth/telegram
 * @desc    Авторизация через Telegram WebApp
 * @access  Public
 */
router.post('/telegram',
  authLimiter,
  validationMiddleware.validateRequest(telegramAuthSchema),
  authController.telegramAuth
);

/**
 * @route   POST /api/auth/refresh
 * @desc    Обновление токена доступа
 * @access  Public
 */
router.post('/refresh',
  authLimiter,
  validationMiddleware.validateRequest(refreshTokenSchema),
  authController.refreshToken
);

/**
 * @route   POST /api/auth/logout
 * @desc    Выход из системы
 * @access  Private
 */
router.post('/logout',
  authMiddleware.authenticate,
  authController.logout
);

/**
 * @route   GET /api/auth/profile
 * @desc    Получение профиля текущего пользователя
 * @access  Private
 */
router.get('/profile',
  authMiddleware.authenticate,
  authController.getProfile
);

/**
 * @route   PUT /api/auth/profile
 * @desc    Обновление профиля пользователя
 * @access  Private
 */
router.put('/profile',
  authMiddleware.authenticate,
  validationMiddleware.validateRequest(updateProfileSchema),
  authController.updateProfile
);

/**
 * @route   DELETE /api/auth/profile
 * @desc    Удаление аккаунта пользователя
 * @access  Private
 */
router.delete('/profile',
  authMiddleware.authenticate,
  strictAuthLimiter,
  authController.deleteAccount
);

/**
 * @route   POST /api/auth/verify-telegram
 * @desc    Верификация данных от Telegram WebApp
 * @access  Public
 */
router.post('/verify-telegram',
  authLimiter,
  authController.verifyTelegramData
);

/**
 * @route   GET /api/auth/sessions
 * @desc    Получение активных сессий пользователя
 * @access  Private
 */
router.get('/sessions',
  authMiddleware.authenticate,
  authController.getUserSessions
);

/**
 * @route   DELETE /api/auth/sessions/:sessionId
 * @desc    Завершение конкретной сессии
 * @access  Private
 */
router.delete('/sessions/:sessionId',
  authMiddleware.authenticate,
  authController.terminateSession
);

/**
 * @route   DELETE /api/auth/sessions
 * @desc    Завершение всех сессий кроме текущей
 * @access  Private
 */
router.delete('/sessions',
  authMiddleware.authenticate,
  authController.terminateAllSessions
);

/**
 * @route   POST /api/auth/change-password
 * @desc    Изменение пароля (если используется)
 * @access  Private
 */
router.post('/change-password',
  authMiddleware.authenticate,
  strictAuthLimiter,
  validationMiddleware.validateRequest({
    currentPassword: {
      in: ['body'],
      isString: {
        errorMessage: 'Текущий пароль должен быть строкой'
      },
      notEmpty: {
        errorMessage: 'Текущий пароль обязателен'
      }
    },
    newPassword: {
      in: ['body'],
      isString: {
        errorMessage: 'Новый пароль должен быть строкой'
      },
      isLength: {
        options: { min: 8, max: 128 },
        errorMessage: 'Пароль должен содержать от 8 до 128 символов'
      },
      matches: {
        options: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]/,
        errorMessage: 'Пароль должен содержать минимум одну строчную, одну заглавную букву и одну цифру'
      }
    }
  }),
  authController.changePassword
);

/**
 * @route   POST /api/auth/export-data
 * @desc    Экспорт данных пользователя (GDPR)
 * @access  Private
 */
router.post('/export-data',
  authMiddleware.authenticate,
  rateLimitingMiddleware.createLimiter({
    windowMs: 60 * 60 * 1000, // 1 час
    max: 3, // максимум 3 экспорта в час
    message: 'Слишком много запросов на экспорт данных'
  }),
  authController.exportUserData
);

/**
 * @route   GET /api/auth/privacy-settings
 * @desc    Получение настроек приватности
 * @access  Private
 */
router.get('/privacy-settings',
  authMiddleware.authenticate,
  authController.getPrivacySettings
);

/**
 * @route   PUT /api/auth/privacy-settings
 * @desc    Обновление настроек приватности
 * @access  Private
 */
router.put('/privacy-settings',
  authMiddleware.authenticate,
  validationMiddleware.validateRequest({
    showProfile: {
      in: ['body'],
      optional: true,
      isBoolean: {
        errorMessage: 'showProfile должно быть булевым значением'
      }
    },
    showReadings: {
      in: ['body'],
      optional: true,
      isBoolean: {
        errorMessage: 'showReadings должно быть булевым значением'
      }
    },
    showStatistics: {
      in: ['body'],
      optional: true,
      isBoolean: {
        errorMessage: 'showStatistics должно быть булевым значением'
      }
    },
    allowFriendRequests: {
      in: ['body'],
      optional: true,
      isBoolean: {
        errorMessage: 'allowFriendRequests должно быть булевым значением'
      }
    }
  }),
  authController.updatePrivacySettings
);

/**
 * @route   POST /api/auth/upload-avatar
 * @desc    Загрузка аватара пользователя
 * @access  Private
 */
router.post('/upload-avatar',
  authMiddleware.authenticate,
  rateLimitingMiddleware.createLimiter({
    windowMs: 15 * 60 * 1000, // 15 минут
    max: 5, // максимум 5 загрузок за 15 минут
    message: 'Слишком много попыток загрузки аватара'
  }),
  authController.uploadAvatar
);

/**
 * @route   GET /api/auth/stats
 * @desc    Получение статистики пользователя
 * @access  Private
 */
router.get('/stats',
  authMiddleware.authenticate,
  authController.getUserStats
);

/**
 * @route   POST /api/auth/deactivate
 * @desc    Временная деактивация аккаунта
 * @access  Private
 */
router.post('/deactivate',
  authMiddleware.authenticate,
  strictAuthLimiter,
  validationMiddleware.validateRequest({
    reason: {
      in: ['body'],
      optional: true,
      isString: {
        errorMessage: 'Причина должна быть строкой'
      },
      isLength: {
        options: { max: 500 },
        errorMessage: 'Причина не должна превышать 500 символов'
      }
    }
  }),
  authController.deactivateAccount
);

/**
 * @route   POST /api/auth/reactivate
 * @desc    Реактивация аккаунта
 * @access  Public
 */
router.post('/reactivate',
  authLimiter,
  validationMiddleware.validateRequest({
    telegramId: {
      in: ['body'],
      isString: {
        errorMessage: 'Telegram ID должен быть строкой'
      },
      notEmpty: {
        errorMessage: 'Telegram ID обязателен'
      }
    }
  }),
  authController.reactivateAccount
);

// Middleware для обработки ошибок валидации
router.use((error, req, res, next) => {
  if (error.type === 'validation') {
    return res.status(400).json({
      success: false,
      message: 'Ошибка валидации данных',
      errors: error.errors
    });
  }
  next(error);
});

module.exports = router;