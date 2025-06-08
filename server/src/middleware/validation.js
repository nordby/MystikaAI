// server/src/middleware/validation.js
const { body, param, query, validationResult } = require('express-validator');
const logger = require('../utils/logger');

class ValidationMiddleware {
  /**
   * Создание middleware для валидации запроса на основе схемы
   */
  validateRequest(schema) {
    const validations = [];

    // Преобразуем схему в правила валидации
    for (const [field, rules] of Object.entries(schema)) {
      let validator;

      // Определяем тип валидатора
      switch (rules.in[0]) {
        case 'body':
          validator = body(field);
          break;
        case 'params':
          validator = param(field);
          break;
        case 'query':
          validator = query(field);
          break;
        default:
          validator = body(field);
      }

      // Применяем правила валидации
      if (rules.optional) {
        validator = validator.optional();
      } else if (rules.notEmpty) {
        validator = validator.notEmpty().withMessage(rules.notEmpty.errorMessage || `${field} не может быть пустым`);
      }

      if (rules.isString) {
        validator = validator.isString().withMessage(rules.isString.errorMessage || `${field} должно быть строкой`);
      }

      if (rules.isInt) {
        validator = validator.isInt(rules.isInt.options || {}).withMessage(rules.isInt.errorMessage || `${field} должно быть целым числом`);
      }

      if (rules.isFloat) {
        validator = validator.isFloat(rules.isFloat.options || {}).withMessage(rules.isFloat.errorMessage || `${field} должно быть числом`);
      }

      if (rules.isEmail) {
        validator = validator.isEmail().withMessage(rules.isEmail.errorMessage || `${field} должно быть корректным email`);
      }

      if (rules.isURL) {
        validator = validator.isURL(rules.isURL.options || {}).withMessage(rules.isURL.errorMessage || `${field} должно быть корректным URL`);
      }

      if (rules.isUUID) {
        validator = validator.isUUID(rules.isUUID.version || 4).withMessage(rules.isUUID.errorMessage || `${field} должно быть корректным UUID`);
      }

      if (rules.isISO8601) {
        validator = validator.isISO8601().withMessage(rules.isISO8601.errorMessage || `${field} должно быть корректной датой`);
      }

      if (rules.isBoolean) {
        validator = validator.isBoolean().withMessage(rules.isBoolean.errorMessage || `${field} должно быть булевым значением`);
      }

      if (rules.isArray) {
        validator = validator.isArray(rules.isArray.options || {}).withMessage(rules.isArray.errorMessage || `${field} должно быть массивом`);
      }

      if (rules.isObject) {
        validator = validator.isObject().withMessage(rules.isObject.errorMessage || `${field} должно быть объектом`);
      }

      if (rules.isLength) {
        validator = validator.isLength(rules.isLength.options).withMessage(rules.isLength.errorMessage || `${field} имеет некорректную длину`);
      }

      if (rules.matches) {
        validator = validator.matches(rules.matches.options).withMessage(rules.matches.errorMessage || `${field} не соответствует требуемому формату`);
      }

      if (rules.custom) {
        validator = validator.custom(rules.custom.validator).withMessage(rules.custom.errorMessage || `${field} не прошло пользовательскую валидацию`);
      }

      if (rules.normalizeEmail) {
        validator = validator.normalizeEmail();
      }

      if (rules.trim) {
        validator = validator.trim();
      }

      if (rules.escape) {
        validator = validator.escape();
      }

      validations.push(validator);
    }

    // Возвращаем middleware для обработки результатов валидации
    return [
      ...validations,
      this.handleValidationErrors
    ];
  }

  /**
   * Middleware для обработки ошибок валидации
   */
  handleValidationErrors(req, res, next) {
    try {
      const errors = validationResult(req);

      if (!errors.isEmpty()) {
        const formattedErrors = errors.array().map(error => ({
          field: error.param,
          message: error.msg,
          value: error.value,
          location: error.location
        }));

        logger.warn('Validation failed', {
          url: req.url,
          method: req.method,
          errors: formattedErrors,
          ip: req.ip,
          userAgent: req.get('User-Agent')
        });

        return res.status(400).json({
          success: false,
          message: 'Ошибка валидации данных',
          errors: formattedErrors
        });
      }

      next();

    } catch (error) {
      logger.error('Error in validation middleware', {
        error: error.message,
        stack: error.stack
      });

      res.status(500).json({
        success: false,
        message: 'Внутренняя ошибка сервера при валидации'
      });
    }
  }

  /**
   * Валидация Telegram данных
   */
  validateTelegramData() {
    return this.validateRequest({
      telegramId: {
        in: ['body'],
        isString: {
          errorMessage: 'Telegram ID должен быть строкой'
        },
        notEmpty: {
          errorMessage: 'Telegram ID обязателен'
        },
        isLength: {
          options: { min: 1, max: 20 },
          errorMessage: 'Telegram ID должен быть от 1 до 20 символов'
        }
      },
      hash: {
        in: ['body'],
        isString: {
          errorMessage: 'Hash должен быть строкой'
        },
        notEmpty: {
          errorMessage: 'Hash обязателен'
        }
      },
      authDate: {
        in: ['body'],
        isInt: {
          options: { min: 0 },
          errorMessage: 'Auth date должен быть положительным числом'
        }
      }
    });
  }

  /**
   * Валидация данных карты Таро
   */
  validateTarotCard() {
    return this.validateRequest({
      name: {
        in: ['body'],
        isString: {
          errorMessage: 'Название карты должно быть строкой'
        },
        isLength: {
          options: { min: 1, max: 100 },
          errorMessage: 'Название карты должно быть от 1 до 100 символов'
        }
      },
      suit: {
        in: ['body'],
        optional: true,
        isString: {
          errorMessage: 'Масть должна быть строкой'
        },
        isIn: {
          options: [['major_arcana', 'cups', 'wands', 'pentacles', 'swords']],
          errorMessage: 'Некорректная масть карты'
        }
      },
      number: {
        in: ['body'],
        optional: true,
        isInt: {
          options: { min: 0, max: 21 },
          errorMessage: 'Номер карты должен быть от 0 до 21'
        }
      },
      isReversed: {
        in: ['body'],
        optional: true,
        isBoolean: {
          errorMessage: 'isReversed должно быть булевым значением'
        }
      }
    });
  }

  /**
   * Валидация данных расклада
   */
  validateSpread() {
    return this.validateRequest({
      name: {
        in: ['body'],
        isString: {
          errorMessage: 'Название расклада должно быть строкой'
        },
        isLength: {
          options: { min: 2, max: 100 },
          errorMessage: 'Название расклада должно быть от 2 до 100 символов'
        }
      },
      type: {
        in: ['body'],
        isString: {
          errorMessage: 'Тип расклада должен быть строкой'
        },
        isIn: {
          options: [['daily_card', 'one_card', 'three_cards', 'celtic_cross', 'custom', 'numerology', 'lunar']],
          errorMessage: 'Некорректный тип расклада'
        }
      },
      cardsCount: {
        in: ['body'],
        isInt: {
          options: { min: 1, max: 20 },
          errorMessage: 'Количество карт должно быть от 1 до 20'
        }
      },
      difficulty: {
        in: ['body'],
        optional: true,
        isString: {
          errorMessage: 'Сложность должна быть строкой'
        },
        isIn: {
          options: [['beginner', 'intermediate', 'advanced', 'expert']],
          errorMessage: 'Некорректная сложность расклада'
        }
      }
    });
  }

  /**
   * Валидация данных гадания
   */
  validateReading() {
    return this.validateRequest({
      question: {
        in: ['body'],
        optional: true,
        isString: {
          errorMessage: 'Вопрос должен быть строкой'
        },
        isLength: {
          options: { min: 5, max: 1000 },
          errorMessage: 'Вопрос должен быть от 5 до 1000 символов'
        }
      },
      spreadId: {
        in: ['body'],
        isUUID: {
          errorMessage: 'ID расклада должен быть корректным UUID'
        }
      },
      cards: {
        in: ['body'],
        isArray: {
          options: { min: 1, max: 20 },
          errorMessage: 'Карты должны быть массивом от 1 до 20 элементов'
        }
      },
      type: {
        in: ['body'],
        isString: {
          errorMessage: 'Тип гадания должен быть строкой'
        }
      }
    });
  }

  /**
   * Валидация подписки
   */
  validateSubscription() {
    return this.validateRequest({
      planId: {
        in: ['body'],
        isString: {
          errorMessage: 'ID плана должен быть строкой'
        },
        isIn: {
          options: [['monthly', 'quarterly', 'yearly', 'trial']],
          errorMessage: 'Некорректный ID плана'
        }
      },
      paymentMethod: {
        in: ['body'],
        optional: true,
        isString: {
          errorMessage: 'Метод оплаты должен быть строкой'
        },
        isIn: {
          options: [['card', 'paypal', 'apple_pay', 'google_pay', 'bank_transfer', 'crypto', 'telegram_stars']],
          errorMessage: 'Некорректный метод оплаты'
        }
      }
    });
  }

  /**
   * Валидация нумерологических данных
   */
  validateNumerology() {
    return this.validateRequest({
      birthDate: {
        in: ['body'],
        isISO8601: {
          errorMessage: 'Дата рождения должна быть в формате ISO8601'
        }
      },
      fullName: {
        in: ['body'],
        optional: true,
        isString: {
          errorMessage: 'Полное имя должно быть строкой'
        },
        isLength: {
          options: { min: 2, max: 200 },
          errorMessage: 'Полное имя должно быть от 2 до 200 символов'
        }
      }
    });
  }

  /**
   * Валидация запроса лунного календаря
   */
  validateLunarCalendar() {
    return this.validateRequest({
      startDate: {
        in: ['query'],
        isISO8601: {
          errorMessage: 'Начальная дата должна быть в формате ISO8601'
        }
      },
      endDate: {
        in: ['query'],
        isISO8601: {
          errorMessage: 'Конечная дата должна быть в формате ISO8601'
        },
        custom: {
          validator: (value, { req }) => {
            const startDate = new Date(req.query.startDate);
            const endDate = new Date(value);
            if (endDate <= startDate) {
              throw new Error('Конечная дата должна быть больше начальной');
            }
            const daysDiff = (endDate - startDate) / (1000 * 60 * 60 * 24);
            if (daysDiff > 365) {
              throw new Error('Период не может превышать 365 дней');
            }
            return true;
          },
          errorMessage: 'Некорректный период дат'
        }
      }
    });
  }

  /**
   * Валидация ID параметров
   */
  validateId(paramName = 'id') {
    return [
      param(paramName)
        .isUUID()
        .withMessage(`${paramName} должен быть корректным UUID`),
      this.handleValidationErrors
    ];
  }

  /**
   * Валидация пагинации
   */
  validatePagination() {
    return this.validateRequest({
      page: {
        in: ['query'],
        optional: true,
        isInt: {
          options: { min: 1 },
          errorMessage: 'Номер страницы должен быть положительным числом'
        }
      },
      limit: {
        in: ['query'],
        optional: true,
        isInt: {
          options: { min: 1, max: 100 },
          errorMessage: 'Лимит должен быть от 1 до 100'
        }
      },
      sortBy: {
        in: ['query'],
        optional: true,
        isString: {
          errorMessage: 'Поле сортировки должно быть строкой'
        }
      },
      sortOrder: {
        in: ['query'],
        optional: true,
        isIn: {
          options: [['asc', 'desc']],
          errorMessage: 'Порядок сортировки должен быть asc или desc'
        }
      }
    });
  }

  /**
   * Валидация файла
   */
  validateFile(options = {}) {
    return (req, res, next) => {
      try {
        if (!req.file && !options.optional) {
          return res.status(400).json({
            success: false,
            message: 'Файл обязателен'
          });
        }

        if (req.file) {
          // Проверка размера файла
          if (options.maxSize && req.file.size > options.maxSize) {
            return res.status(400).json({
              success: false,
              message: `Размер файла не должен превышать ${options.maxSize} байт`
            });
          }

          // Проверка типа файла
          if (options.allowedTypes && !options.allowedTypes.includes(req.file.mimetype)) {
            return res.status(400).json({
              success: false,
              message: `Разрешены только файлы типов: ${options.allowedTypes.join(', ')}`
            });
          }

          // Проверка расширения файла
          if (options.allowedExtensions) {
            const fileExtension = req.file.originalname.split('.').pop()?.toLowerCase();
            if (!options.allowedExtensions.includes(fileExtension)) {
              return res.status(400).json({
                success: false,
                message: `Разрешены только файлы с расширениями: ${options.allowedExtensions.join(', ')}`
              });
            }
          }
        }

        next();

      } catch (error) {
        logger.error('Error in file validation', {
          error: error.message
        });

        res.status(500).json({
          success: false,
          message: 'Ошибка валидации файла'
        });
      }
    };
  }

  /**
   * Валидация AI запроса
   */
  validateAIRequest() {
    return this.validateRequest({
      prompt: {
        in: ['body'],
        isString: {
          errorMessage: 'Промт должен быть строкой'
        },
        isLength: {
          options: { min: 10, max: 2000 },
          errorMessage: 'Промт должен быть от 10 до 2000 символов'
        }
      },
      type: {
        in: ['body'],
        isString: {
          errorMessage: 'Тип запроса должен быть строкой'
        },
        isIn: {
          options: [['card_interpretation', 'photo_analysis', 'text_generation', 'voice_transcription']],
          errorMessage: 'Некорректный тип AI запроса'
        }
      },
      context: {
        in: ['body'],
        optional: true,
        isObject: {
          errorMessage: 'Контекст должен быть объектом'
        }
      }
    });
  }

  /**
   * Валидация поиска
   */
  validateSearch() {
    return this.validateRequest({
      query: {
        in: ['query'],
        isString: {
          errorMessage: 'Поисковый запрос должен быть строкой'
        },
        isLength: {
          options: { min: 2, max: 100 },
          errorMessage: 'Поисковый запрос должен быть от 2 до 100 символов'
        },
        trim: true,
        escape: true
      },
      type: {
        in: ['query'],
        optional: true,
        isString: {
          errorMessage: 'Тип поиска должен быть строкой'
        },
        isIn: {
          options: [['cards', 'spreads', 'readings', 'users']],
          errorMessage: 'Некорректный тип поиска'
        }
      }
    });
  }

  /**
   * Санитизация входных данных
   */
  sanitizeInput() {
    return (req, res, next) => {
      try {
        // Рекурсивная санитизация объекта
        const sanitizeObject = (obj) => {
          if (typeof obj === 'string') {
            // Базовая санитизация строк
            return obj.trim().replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
          }
          
          if (Array.isArray(obj)) {
            return obj.map(sanitizeObject);
          }
          
          if (obj && typeof obj === 'object') {
            const sanitized = {};
            for (const [key, value] of Object.entries(obj)) {
              sanitized[key] = sanitizeObject(value);
            }
            return sanitized;
          }
          
          return obj;
        };

        req.body = sanitizeObject(req.body);
        req.query = sanitizeObject(req.query);
        req.params = sanitizeObject(req.params);

        next();

      } catch (error) {
        logger.error('Error in sanitization middleware', {
          error: error.message
        });

        res.status(500).json({
          success: false,
          message: 'Ошибка обработки данных'
        });
      }
    };
  }

  /**
   * Кастомный валидатор для проверки существования пользователя
   */
  userExists() {
    return body('userId').custom(async (value) => {
      const { User } = require('../models');
      const user = await User.findByPk(value);
      if (!user) {
        throw new Error('Пользователь не найден');
      }
      return true;
    });
  }

  /**
   * Кастомный валидатор для проверки уникальности email
   */
  emailUnique() {
    return body('email').custom(async (value, { req }) => {
      const { User } = require('../models');
      const existingUser = await User.findOne({
        where: { email: value }
      });
      
      if (existingUser && existingUser.id !== req.user?.id) {
        throw new Error('Email уже используется');
      }
      return true;
    });
  }
}

module.exports = new ValidationMiddleware();