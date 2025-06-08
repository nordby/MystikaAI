// shared/utils/validation.js

/**
 * Базовые валидаторы
 */
const BaseValidators = {
    /**
     * Проверка на обязательное поле
     */
    required: (value, fieldName = 'Field') => {
        if (value === null || value === undefined || value === '') {
            return `${fieldName} is required`;
        }
        return null;
    },

    /**
     * Проверка типа строки
     */
    string: (value, fieldName = 'Field') => {
        if (typeof value !== 'string') {
            return `${fieldName} must be a string`;
        }
        return null;
    },

    /**
     * Проверка типа числа
     */
    number: (value, fieldName = 'Field') => {
        if (typeof value !== 'number' || isNaN(value)) {
            return `${fieldName} must be a number`;
        }
        return null;
    },

    /**
     * Проверка типа булева
     */
    boolean: (value, fieldName = 'Field') => {
        if (typeof value !== 'boolean') {
            return `${fieldName} must be a boolean`;
        }
        return null;
    },

    /**
     * Проверка массива
     */
    array: (value, fieldName = 'Field') => {
        if (!Array.isArray(value)) {
            return `${fieldName} must be an array`;
        }
        return null;
    },

    /**
     * Проверка объекта
     */
    object: (value, fieldName = 'Field') => {
        if (typeof value !== 'object' || value === null || Array.isArray(value)) {
            return `${fieldName} must be an object`;
        }
        return null;
    },

    /**
     * Проверка UUID
     */
    uuid: (value, fieldName = 'Field') => {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(value)) {
            return `${fieldName} must be a valid UUID`;
        }
        return null;
    },

    /**
     * Проверка даты
     */
    date: (value, fieldName = 'Field') => {
        const date = new Date(value);
        if (isNaN(date.getTime())) {
            return `${fieldName} must be a valid date`;
        }
        return null;
    },

    /**
     * Проверка минимальной длины
     */
    minLength: (value, min, fieldName = 'Field') => {
        if (typeof value === 'string' && value.length < min) {
            return `${fieldName} must be at least ${min} characters long`;
        }
        if (Array.isArray(value) && value.length < min) {
            return `${fieldName} must contain at least ${min} items`;
        }
        return null;
    },

    /**
     * Проверка максимальной длины
     */
    maxLength: (value, max, fieldName = 'Field') => {
        if (typeof value === 'string' && value.length > max) {
            return `${fieldName} must be no more than ${max} characters long`;
        }
        if (Array.isArray(value) && value.length > max) {
            return `${fieldName} must contain no more than ${max} items`;
        }
        return null;
    },

    /**
     * Проверка минимального значения
     */
    min: (value, min, fieldName = 'Field') => {
        if (typeof value === 'number' && value < min) {
            return `${fieldName} must be at least ${min}`;
        }
        return null;
    },

    /**
     * Проверка максимального значения
     */
    max: (value, max, fieldName = 'Field') => {
        if (typeof value === 'number' && value > max) {
            return `${fieldName} must be no more than ${max}`;
        }
        return null;
    },

    /**
     * Проверка регулярного выражения
     */
    pattern: (value, regex, fieldName = 'Field') => {
        if (typeof value === 'string' && !regex.test(value)) {
            return `${fieldName} has invalid format`;
        }
        return null;
    },

    /**
     * Проверка на одно из допустимых значений
     */
    oneOf: (value, allowedValues, fieldName = 'Field') => {
        if (!allowedValues.includes(value)) {
            return `${fieldName} must be one of: ${allowedValues.join(', ')}`;
        }
        return null;
    }
};

/**
 * Специализированные валидаторы
 */
const SpecializedValidators = {
    /**
     * Проверка email
     */
    email: (value, fieldName = 'Email') => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
            return `${fieldName} must be a valid email address`;
        }
        return null;
    },

    /**
     * Проверка Telegram ID
     */
    telegramId: (value, fieldName = 'Telegram ID') => {
        if (typeof value !== 'number' || value <= 0 || !Number.isInteger(value)) {
            return `${fieldName} must be a positive integer`;
        }
        return null;
    },

    /**
     * Проверка Telegram username
     */
    telegramUsername: (value, fieldName = 'Username') => {
        const usernameRegex = /^[a-zA-Z0-9_]{5,32}$/;
        if (!usernameRegex.test(value)) {
            return `${fieldName} must be 5-32 characters long and contain only letters, numbers, and underscores`;
        }
        return null;
    },

    /**
     * Проверка даты рождения
     */
    birthDate: (value, fieldName = 'Birth date') => {
        const date = new Date(value);
        const now = new Date();
        const minDate = new Date('1900-01-01');
        
        if (isNaN(date.getTime())) {
            return `${fieldName} must be a valid date`;
        }
        
        if (date < minDate || date > now) {
            return `${fieldName} must be between 1900 and today`;
        }
        
        return null;
    },

    /**
     * Проверка языкового кода
     */
    languageCode: (value, fieldName = 'Language code') => {
        const supportedLanguages = ['ru', 'en', 'es', 'fr', 'de', 'it'];
        if (!supportedLanguages.includes(value)) {
            return `${fieldName} must be one of supported languages: ${supportedLanguages.join(', ')}`;
        }
        return null;
    },

    /**
     * Проверка часового пояса
     */
    timezone: (value, fieldName = 'Timezone') => {
        try {
            Intl.DateTimeFormat(undefined, { timeZone: value });
            return null;
        } catch (error) {
            return `${fieldName} must be a valid timezone`;
        }
    },

    /**
     * Проверка номера карты Таро
     */
    tarotCardNumber: (value, fieldName = 'Card number') => {
        if (typeof value !== 'number' || value < 0 || value > 77 || !Number.isInteger(value)) {
            return `${fieldName} must be an integer between 0 and 77`;
        }
        return null;
    },

    /**
     * Проверка типа файла
     */
    fileType: (value, allowedTypes, fieldName = 'File') => {
        if (!value || !value.mimetype) {
            return `${fieldName} is required`;
        }
        
        if (!allowedTypes.includes(value.mimetype)) {
            return `${fieldName} must be one of allowed types: ${allowedTypes.join(', ')}`;
        }
        
        return null;
    },

    /**
     * Проверка размера файла
     */
    fileSize: (value, maxSize, fieldName = 'File') => {
        if (!value || !value.size) {
            return `${fieldName} is required`;
        }
        
        if (value.size > maxSize) {
            const maxSizeMB = Math.round(maxSize / (1024 * 1024));
            return `${fieldName} must be no larger than ${maxSizeMB}MB`;
        }
        
        return null;
    },

    /**
     * Проверка сложности пароля
     */
    password: (value, fieldName = 'Password') => {
        if (typeof value !== 'string') {
            return `${fieldName} must be a string`;
        }
        
        if (value.length < 8) {
            return `${fieldName} must be at least 8 characters long`;
        }
        
        if (!/(?=.*[a-z])/.test(value)) {
            return `${fieldName} must contain at least one lowercase letter`;
        }
        
        if (!/(?=.*[A-Z])/.test(value)) {
            return `${fieldName} must contain at least one uppercase letter`;
        }
        
        if (!/(?=.*\d)/.test(value)) {
            return `${fieldName} must contain at least one number`;
        }
        
        return null;
    },

    /**
     * Проверка промокода
     */
    promoCode: (value, fieldName = 'Promo code') => {
        const promoRegex = /^[A-Z0-9]{4,20}$/;
        if (!promoRegex.test(value)) {
            return `${fieldName} must be 4-20 characters long and contain only uppercase letters and numbers`;
        }
        return null;
    }
};

/**
 * Валидатор схем
 */
class SchemaValidator {
    constructor(schema) {
        this.schema = schema;
    }

    /**
     * Валидация объекта по схеме
     */
    validate(data) {
        const errors = {};
        
        // Проверяем каждое поле схемы
        for (const [fieldName, rules] of Object.entries(this.schema)) {
            const value = data[fieldName];
            const fieldErrors = this.validateField(value, rules, fieldName);
            
            if (fieldErrors.length > 0) {
                errors[fieldName] = fieldErrors;
            }
        }
        
        // Проверяем лишние поля
        for (const fieldName of Object.keys(data)) {
            if (!this.schema[fieldName]) {
                if (!errors._unknown) errors._unknown = [];
                errors._unknown.push(`Unknown field: ${fieldName}`);
            }
        }
        
        return {
            isValid: Object.keys(errors).length === 0,
            errors
        };
    }

    /**
     * Валидация отдельного поля
     */
    validateField(value, rules, fieldName) {
        const errors = [];
        
        // Если поле не обязательное и значение пустое, пропускаем валидацию
        if (!rules.required && (value === null || value === undefined || value === '')) {
            return errors;
        }
        
        // Проверка обязательности
        if (rules.required) {
            const error = BaseValidators.required(value, fieldName);
            if (error) {
                errors.push(error);
                return errors; // Если поле обязательное и пустое, дальше не проверяем
            }
        }
        
        // Проверка типа
        if (rules.type) {
            const error = this.validateType(value, rules.type, fieldName);
            if (error) errors.push(error);
        }
        
        // Проверка длины
        if (rules.minLength !== undefined) {
            const error = BaseValidators.minLength(value, rules.minLength, fieldName);
            if (error) errors.push(error);
        }
        
        if (rules.maxLength !== undefined) {
            const error = BaseValidators.maxLength(value, rules.maxLength, fieldName);
            if (error) errors.push(error);
        }
        
        // Проверка диапазона значений
        if (rules.min !== undefined) {
            const error = BaseValidators.min(value, rules.min, fieldName);
            if (error) errors.push(error);
        }
        
        if (rules.max !== undefined) {
            const error = BaseValidators.max(value, rules.max, fieldName);
            if (error) errors.push(error);
        }
        
        // Проверка паттерна
        if (rules.pattern) {
            const error = BaseValidators.pattern(value, rules.pattern, fieldName);
            if (error) errors.push(error);
        }
        
        // Проверка допустимых значений
        if (rules.oneOf) {
            const error = BaseValidators.oneOf(value, rules.oneOf, fieldName);
            if (error) errors.push(error);
        }
        
        // Кастомные валидаторы
        if (rules.validator) {
            const error = rules.validator(value, fieldName);
            if (error) errors.push(error);
        }
        
        return errors;
    }

    /**
     * Проверка типа
     */
    validateType(value, type, fieldName) {
        switch (type) {
            case 'string':
                return BaseValidators.string(value, fieldName);
            case 'number':
                return BaseValidators.number(value, fieldName);
            case 'boolean':
                return BaseValidators.boolean(value, fieldName);
            case 'array':
                return BaseValidators.array(value, fieldName);
            case 'object':
                return BaseValidators.object(value, fieldName);
            case 'uuid':
                return BaseValidators.uuid(value, fieldName);
            case 'date':
                return BaseValidators.date(value, fieldName);
            case 'email':
                return SpecializedValidators.email(value, fieldName);
            case 'telegramId':
                return SpecializedValidators.telegramId(value, fieldName);
            default:
                return null;
        }
    }
}

/**
 * Предопределенные схемы валидации
 */
const ValidationSchemas = {
    /**
     * Схема для Telegram аутентификации
     */
    TELEGRAM_AUTH: {
        telegramId: { type: 'telegramId', required: true },
        firstName: { type: 'string', required: true, minLength: 1, maxLength: 100 },
        lastName: { type: 'string', required: false, maxLength: 100 },
        username: { 
            type: 'string', 
            required: false, 
            validator: SpecializedValidators.telegramUsername 
        },
        languageCode: { 
            type: 'string', 
            required: false, 
            validator: SpecializedValidators.languageCode 
        }
    },

    /**
     * Схема для создания гадания
     */
    CREATE_READING: {
        type: { 
            type: 'string', 
            required: true, 
            oneOf: ['daily', 'one_card', 'three_card', 'celtic_cross', 'custom'] 
        },
        question: { type: 'string', required: false, maxLength: 500 },
        spreadId: { type: 'string', required: false },
        cardCount: { type: 'number', required: false, min: 1, max: 10 }
    },

    /**
     * Схема для анализа фотографии
     */
    PHOTO_ANALYSIS: {
        question: { type: 'string', required: false, maxLength: 200 },
        focusArea: { type: 'string', required: false, maxLength: 100 }
    },

    /**
     * Схема для создания платежа
     */
    CREATE_PAYMENT: {
        planId: { type: 'uuid', required: true },
        paymentMethod: { 
            type: 'string', 
            required: true, 
            oneOf: ['card', 'telegram', 'apple_pay', 'google_pay'] 
        },
        promoCode: { 
            type: 'string', 
            required: false, 
            validator: SpecializedValidators.promoCode 
        }
    }
};

/**
 * Утилиты для валидации
 */
const ValidationUtils = {
    /**
     * Быстрая валидация с помощью предопределенной схемы
     */
    validateWithSchema: (data, schemaName) => {
        const schema = ValidationSchemas[schemaName];
        if (!schema) {
            throw new Error(`Unknown validation schema: ${schemaName}`);
        }
        
        const validator = new SchemaValidator(schema);
        return validator.validate(data);
    },

    /**
     * Санитизация строки
     */
    sanitizeString: (str) => {
        if (typeof str !== 'string') return str;
        return str.trim().replace(/[<>\"'&]/g, '');
    },

    /**
     * Нормализация телефонного номера
     */
    normalizePhone: (phone) => {
        if (typeof phone !== 'string') return phone;
        return phone.replace(/[^\d+]/g, '');
    },

    /**
     * Создание ошибки валидации
     */
    createValidationError: (field, message) => ({
        field,
        message,
        type: 'validation_error'
    })
};

module.exports = {
    BaseValidators,
    SpecializedValidators,
    SchemaValidator,
    ValidationSchemas,
    ValidationUtils
};