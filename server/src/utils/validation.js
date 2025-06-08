// server/src/utils/validation.js
const validator = require('validator');
const logger = require('./logger');

class ValidationUtils {
  /**
   * Валидация Telegram данных
   */
  validateTelegramWebAppData(initData, botToken) {
    try {
      if (!initData || !botToken) {
        return { isValid: false, error: 'Отсутствуют необходимые данные' };
      }

      const urlParams = new URLSearchParams(initData);
      const hash = urlParams.get('hash');
      urlParams.delete('hash');

      const dataCheckString = Array.from(urlParams.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, value]) => `${key}=${value}`)
        .join('\n');

      const crypto = require('crypto');
      const secretKey = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest();
      const expectedHash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');

      if (hash !== expectedHash) {
        return { isValid: false, error: 'Некорректная подпись данных' };
      }

      // Проверяем время действия (данные действительны 24 часа)
      const authDate = urlParams.get('auth_date');
      if (authDate) {
        const authTime = parseInt(authDate) * 1000;
        const currentTime = Date.now();
        const maxAge = 24 * 60 * 60 * 1000; // 24 часа

        if (currentTime - authTime > maxAge) {
          return { isValid: false, error: 'Данные авторизации устарели' };
        }
      }

      return { isValid: true, data: Object.fromEntries(urlParams) };

    } catch (error) {
      logger.error('Telegram validation error', { error: error.message });
      return { isValid: false, error: 'Ошибка валидации данных Telegram' };
    }
  }

  /**
   * Валидация email адреса
   */
  validateEmail(email) {
    if (!email || typeof email !== 'string') {
      return { isValid: false, error: 'Email обязателен' };
    }

    if (!validator.isEmail(email)) {
      return { isValid: false, error: 'Некорректный формат email' };
    }

    // Дополнительные проверки
    if (email.length > 254) {
      return { isValid: false, error: 'Email слишком длинный' };
    }

    const domain = email.split('@')[1];
    if (domain && domain.length > 63) {
      return { isValid: false, error: 'Домен email слишком длинный' };
    }

    return { isValid: true };
  }

  /**
   * Валидация пароля
   */
  validatePassword(password) {
    if (!password || typeof password !== 'string') {
      return { isValid: false, error: 'Пароль обязателен' };
    }

    const minLength = 8;
    const maxLength = 128;

    if (password.length < minLength) {
      return { isValid: false, error: `Пароль должен содержать минимум ${minLength} символов` };
    }

    if (password.length > maxLength) {
      return { isValid: false, error: `Пароль не должен превышать ${maxLength} символов` };
    }

    // Проверка на сложность
    const hasLowerCase = /[a-z]/.test(password);
    const hasUpperCase = /[A-Z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

    const complexityScore = [hasLowerCase, hasUpperCase, hasNumbers, hasSpecialChar].filter(Boolean).length;

    if (complexityScore < 3) {
      return {
        isValid: false,
        error: 'Пароль должен содержать строчные и заглавные буквы, цифры и специальные символы'
      };
    }

    return { isValid: true };
  }

  /**
   * Валидация UUID
   */
  validateUUID(uuid, version = 4) {
    if (!uuid || typeof uuid !== 'string') {
      return { isValid: false, error: 'UUID обязателен' };
    }

    if (!validator.isUUID(uuid, version)) {
      return { isValid: false, error: `Некорректный формат UUID версии ${version}` };
    }

    return { isValid: true };
  }

  /**
   * Валидация даты
   */
  validateDate(date, options = {}) {
    if (!date) {
      return { isValid: false, error: 'Дата обязательна' };
    }

    let dateObj;
    if (typeof date === 'string') {
      if (!validator.isISO8601(date)) {
        return { isValid: false, error: 'Дата должна быть в формате ISO8601' };
      }
      dateObj = new Date(date);
    } else if (date instanceof Date) {
      dateObj = date;
    } else {
      return { isValid: false, error: 'Некорректный формат даты' };
    }

    if (isNaN(dateObj.getTime())) {
      return { isValid: false, error: 'Некорректная дата' };
    }

    // Дополнительные проверки
    if (options.minDate && dateObj < options.minDate) {
      return { isValid: false, error: 'Дата слишком ранняя' };
    }

    if (options.maxDate && dateObj > options.maxDate) {
      return { isValid: false, error: 'Дата слишком поздняя' };
    }

    if (options.futureOnly && dateObj <= new Date()) {
      return { isValid: false, error: 'Дата должна быть в будущем' };
    }

    if (options.pastOnly && dateObj >= new Date()) {
      return { isValid: false, error: 'Дата должна быть в прошлом' };
    }

    return { isValid: true, date: dateObj };
  }

  /**
   * Валидация номера телефона
   */
  validatePhoneNumber(phone) {
    if (!phone || typeof phone !== 'string') {
      return { isValid: false, error: 'Номер телефона обязателен' };
    }

    // Убираем все пробелы и символы кроме цифр и +
    const cleanPhone = phone.replace(/[^\d+]/g, '');

    if (!validator.isMobilePhone(cleanPhone, 'any', { strictMode: false })) {
      return { isValid: false, error: 'Некорректный формат номера телефона' };
    }

    return { isValid: true, phone: cleanPhone };
  }

  /**
   * Валидация URL
   */
  validateURL(url, options = {}) {
    if (!url || typeof url !== 'string') {
      return { isValid: false, error: 'URL обязателен' };
    }

    const validatorOptions = {
      protocols: options.protocols || ['http', 'https'],
      require_protocol: options.requireProtocol !== false,
      require_host: options.requireHost !== false,
      require_port: options.requirePort || false,
      require_valid_protocol: options.requireValidProtocol !== false,
      allow_underscores: options.allowUnderscores || false,
      host_whitelist: options.hostWhitelist || false,
      host_blacklist: options.hostBlacklist || false,
      allow_trailing_dot: options.allowTrailingDot || false,
      allow_protocol_relative_urls: options.allowProtocolRelative || false
    };

    if (!validator.isURL(url, validatorOptions)) {
      return { isValid: false, error: 'Некорректный формат URL' };
    }

    return { isValid: true };
  }

  /**
   * Валидация числового значения
   */
  validateNumber(value, options = {}) {
    if (value === null || value === undefined || value === '') {
      if (options.required) {
        return { isValid: false, error: 'Числовое значение обязательно' };
      }
      return { isValid: true };
    }

    const num = Number(value);
    if (isNaN(num)) {
      return { isValid: false, error: 'Значение должно быть числом' };
    }

    if (options.integer && !Number.isInteger(num)) {
      return { isValid: false, error: 'Значение должно быть целым числом' };
    }

    if (options.min !== undefined && num < options.min) {
      return { isValid: false, error: `Значение должно быть не менее ${options.min}` };
    }

    if (options.max !== undefined && num > options.max) {
      return { isValid: false, error: `Значение должно быть не более ${options.max}` };
    }

    if (options.positive && num <= 0) {
      return { isValid: false, error: 'Значение должно быть положительным' };
    }

    return { isValid: true, value: num };
  }

  /**
   * Валидация строки
   */
  validateString(value, options = {}) {
    if (!value || typeof value !== 'string') {
      if (options.required) {
        return { isValid: false, error: 'Строка обязательна' };
      }
      return { isValid: true };
    }

    const trimmed = options.trim !== false ? value.trim() : value;

    if (options.minLength && trimmed.length < options.minLength) {
      return { isValid: false, error: `Минимальная длина: ${options.minLength} символов` };
    }

    if (options.maxLength && trimmed.length > options.maxLength) {
      return { isValid: false, error: `Максимальная длина: ${options.maxLength} символов` };
    }

    if (options.pattern && !options.pattern.test(trimmed)) {
      return { isValid: false, error: options.patternError || 'Значение не соответствует требуемому формату' };
    }

    if (options.enum && !options.enum.includes(trimmed)) {
      return { isValid: false, error: `Допустимые значения: ${options.enum.join(', ')}` };
    }

    return { isValid: true, value: trimmed };
  }

  /**
   * Валидация массива
   */
  validateArray(value, options = {}) {
    if (!Array.isArray(value)) {
      if (options.required) {
        return { isValid: false, error: 'Массив обязателен' };
      }
      return { isValid: true };
    }

    if (options.minItems && value.length < options.minItems) {
      return { isValid: false, error: `Минимальное количество элементов: ${options.minItems}` };
    }

    if (options.maxItems && value.length > options.maxItems) {
      return { isValid: false, error: `Максимальное количество элементов: ${options.maxItems}` };
    }

    if (options.uniqueItems) {
      const unique = [...new Set(value)];
      if (unique.length !== value.length) {
        return { isValid: false, error: 'Все элементы массива должны быть уникальными' };
      }
    }

    return { isValid: true };
  }

  /**
   * Валидация объекта
   */
  validateObject(value, schema) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return { isValid: false, error: 'Значение должно быть объектом' };
    }

    const errors = {};
    const validatedData = {};

    for (const [field, rules] of Object.entries(schema)) {
      const fieldValue = value[field];
      let result = { isValid: true };

      // Проверяем обязательность поля
      if (rules.required && (fieldValue === undefined || fieldValue === null || fieldValue === '')) {
        errors[field] = `Поле ${field} обязательно`;
        continue;
      }

      // Если поле не обязательно и отсутствует, пропускаем валидацию
      if (!rules.required && (fieldValue === undefined || fieldValue === null)) {
        continue;
      }

      // Валидация по типу
      switch (rules.type) {
        case 'string':
          result = this.validateString(fieldValue, rules);
          break;
        case 'number':
          result = this.validateNumber(fieldValue, rules);
          break;
        case 'email':
          result = this.validateEmail(fieldValue);
          break;
        case 'uuid':
          result = this.validateUUID(fieldValue, rules.version);
          break;
        case 'date':
          result = this.validateDate(fieldValue, rules);
          break;
        case 'url':
          result = this.validateURL(fieldValue, rules);
          break;
        case 'array':
          result = this.validateArray(fieldValue, rules);
          break;
        case 'phone':
          result = this.validatePhoneNumber(fieldValue);
          break;
        default:
          if (rules.custom && typeof rules.custom === 'function') {
            result = rules.custom(fieldValue);
          }
      }

      if (!result.isValid) {
        errors[field] = result.error;
      } else if (result.value !== undefined) {
        validatedData[field] = result.value;
      } else {
        validatedData[field] = fieldValue;
      }
    }

    if (Object.keys(errors).length > 0) {
      return { isValid: false, errors };
    }

    return { isValid: true, data: validatedData };
  }

  /**
   * Санитизация HTML
   */
  sanitizeHTML(html) {
    if (!html || typeof html !== 'string') {
      return '';
    }

    // Базовая санитизация - удаляем потенциально опасные теги
    return html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
      .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
      .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '')
      .replace(/<link\b[^<]*(?:(?!<\/link>)<[^<]*)*<\/link>/gi, '')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '');
  }

  /**
   * Валидация данных карты Таро
   */
  validateTarotCard(cardData) {
    const schema = {
      name: { type: 'string', required: true, minLength: 1, maxLength: 100 },
      suit: { 
        type: 'string', 
        enum: ['major_arcana', 'cups', 'wands', 'pentacles', 'swords'] 
      },
      number: { type: 'number', integer: true, min: 0, max: 21 },
      isReversed: { type: 'boolean' },
      meaning: { type: 'string', maxLength: 1000 },
      keywords: { type: 'array', maxItems: 10 }
    };

    return this.validateObject(cardData, schema);
  }

  /**
   * Валидация данных расклада
   */
  validateSpread(spreadData) {
    const schema = {
      name: { type: 'string', required: true, minLength: 2, maxLength: 100 },
      type: { 
        type: 'string', 
        required: true,
        enum: ['daily_card', 'one_card', 'three_cards', 'celtic_cross', 'custom', 'numerology', 'lunar'] 
      },
      cardsCount: { type: 'number', required: true, integer: true, min: 1, max: 20 },
      difficulty: { 
        type: 'string', 
        enum: ['beginner', 'intermediate', 'advanced', 'expert'] 
      },
      description: { type: 'string', maxLength: 2000 },
      positions: { type: 'array', maxItems: 20 }
    };

    return this.validateObject(spreadData, schema);
  }

  /**
   * Валидация данных гадания
   */
  validateReading(readingData) {
    const schema = {
      question: { type: 'string', minLength: 5, maxLength: 1000 },
      spreadId: { type: 'uuid', required: true },
      cards: { type: 'array', required: true, minItems: 1, maxItems: 20 },
      type: { type: 'string', required: true },
      isPublic: { type: 'boolean' },
      tags: { type: 'array', maxItems: 10 }
    };

    return this.validateObject(readingData, schema);
  }

  /**
   * Валидация файла
   */
  validateFile(file, options = {}) {
    if (!file) {
      return { isValid: false, error: 'Файл обязателен' };
    }

    // Проверка размера
    if (options.maxSize && file.size > options.maxSize) {
      return { 
        isValid: false, 
        error: `Размер файла не должен превышать ${Math.round(options.maxSize / 1024 / 1024)} МБ` 
      };
    }

    // Проверка типа MIME
    if (options.allowedMimeTypes && !options.allowedMimeTypes.includes(file.mimetype)) {
      return { 
        isValid: false, 
        error: `Разрешены только файлы типов: ${options.allowedMimeTypes.join(', ')}` 
      };
    }

    // Проверка расширения
    if (options.allowedExtensions) {
      const extension = file.originalname.split('.').pop()?.toLowerCase();
      if (!options.allowedExtensions.includes(extension)) {
        return { 
          isValid: false, 
          error: `Разрешены только файлы с расширениями: ${options.allowedExtensions.join(', ')}` 
        };
      }
    }

    return { isValid: true };
  }

  /**
   * Валидация IP адреса
   */
  validateIP(ip) {
    if (!ip || typeof ip !== 'string') {
      return { isValid: false, error: 'IP адрес обязателен' };
    }

    if (!validator.isIP(ip)) {
      return { isValid: false, error: 'Некорректный формат IP адреса' };
    }

    return { isValid: true };
  }

  /**
   * Валидация JSON строки
   */
  validateJSON(jsonString) {
    if (!jsonString || typeof jsonString !== 'string') {
      return { isValid: false, error: 'JSON строка обязательна' };
    }

    try {
      const parsed = JSON.parse(jsonString);
      return { isValid: true, data: parsed };
    } catch (error) {
      return { isValid: false, error: 'Некорректный формат JSON' };
    }
  }

  /**
   * Валидация пагинации
   */
  validatePagination(params) {
    const schema = {
      page: { type: 'number', integer: true, min: 1 },
      limit: { type: 'number', integer: true, min: 1, max: 100 },
      sortBy: { type: 'string', maxLength: 50 },
      sortOrder: { type: 'string', enum: ['asc', 'desc'] }
    };

    return this.validateObject(params, schema);
  }
}

module.exports = new ValidationUtils();