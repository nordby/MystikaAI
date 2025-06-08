// server/src/utils/helpers.js
const crypto = require('crypto');
const path = require('path');
const fs = require('fs').promises;
const logger = require('./logger');

class HelperUtils {
  /**
   * Генерация случайной строки
   */
  generateRandomString(length = 32, charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789') {
    let result = '';
    for (let i = 0; i < length; i++) {
      result += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return result;
  }

  /**
   * Генерация slug из строки
   */
  generateSlug(text) {
    if (!text || typeof text !== 'string') return '';
    
    return text
      .toLowerCase()
      .replace(/[а-я]/g, (char) => {
        const map = {
          'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo',
          'ж': 'zh', 'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm',
          'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u',
          'ф': 'f', 'х': 'h', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'sch',
          'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya'
        };
        return map[char] || char;
      })
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }

  /**
   * Форматирование даты для отображения
   */
  formatDate(date, locale = 'ru-RU', options = {}) {
    try {
      const dateObj = date instanceof Date ? date : new Date(date);
      
      const defaultOptions = {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        ...options
      };

      return dateObj.toLocaleDateString(locale, defaultOptions);
    } catch (error) {
      logger.error('Date formatting error', { error: error.message, date });
      return 'Некорректная дата';
    }
  }

  /**
   * Форматирование времени "назад"
   */
  formatTimeAgo(date, locale = 'ru-RU') {
    try {
      const now = new Date();
      const targetDate = date instanceof Date ? date : new Date(date);
      const diffMs = now - targetDate;
      const diffSec = Math.floor(diffMs / 1000);
      const diffMin = Math.floor(diffSec / 60);
      const diffHour = Math.floor(diffMin / 60);
      const diffDay = Math.floor(diffHour / 24);
      const diffWeek = Math.floor(diffDay / 7);
      const diffMonth = Math.floor(diffDay / 30);
      const diffYear = Math.floor(diffDay / 365);

      if (diffSec < 60) return 'только что';
      if (diffMin < 60) return `${diffMin} мин назад`;
      if (diffHour < 24) return `${diffHour} ч назад`;
      if (diffDay < 7) return `${diffDay} дн назад`;
      if (diffWeek < 4) return `${diffWeek} нед назад`;
      if (diffMonth < 12) return `${diffMonth} мес назад`;
      return `${diffYear} лет назад`;
    } catch (error) {
      logger.error('Time ago formatting error', { error: error.message, date });
      return 'некорректная дата';
    }
  }

  /**
   * Форматирование размера файла
   */
  formatFileSize(bytes) {
    if (bytes === 0) return '0 Б';
    
    const sizes = ['Б', 'КБ', 'МБ', 'ГБ', 'ТБ'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  }

  /**
   * Обрезка текста с многоточием
   */
  truncateText(text, maxLength = 100, suffix = '...') {
    if (!text || typeof text !== 'string') return '';
    if (text.length <= maxLength) return text;
    
    return text.substring(0, maxLength - suffix.length).trim() + suffix;
  }

  /**
   * Капитализация первой буквы
   */
  capitalize(text) {
    if (!text || typeof text !== 'string') return '';
    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
  }

  /**
   * Капитализация каждого слова
   */
  capitalizeWords(text) {
    if (!text || typeof text !== 'string') return '';
    return text.replace(/\w\S*/g, (txt) => 
      txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
    );
  }

  /**
   * Удаление HTML тегов
   */
  stripHtml(html) {
    if (!html || typeof html !== 'string') return '';
    return html.replace(/<[^>]*>/g, '');
  }

  /**
   * Экранирование HTML
   */
  escapeHtml(text) {
    if (!text || typeof text !== 'string') return '';
    
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    
    return text.replace(/[&<>"']/g, (m) => map[m]);
  }

  /**
   * Генерация хеша от строки
   */
  generateHash(text, algorithm = 'md5') {
    try {
      return crypto.createHash(algorithm).update(text).digest('hex');
    } catch (error) {
      logger.error('Hash generation error', { error: error.message, text, algorithm });
      throw error;
    }
  }

  /**
   * Проверка на пустое значение
   */
  isEmpty(value) {
    if (value === null || value === undefined) return true;
    if (typeof value === 'string') return value.trim().length === 0;
    if (Array.isArray(value)) return value.length === 0;
    if (typeof value === 'object') return Object.keys(value).length === 0;
    return false;
  }

  /**
   * Глубокое клонирование объекта
   */
  deepClone(obj) {
    if (obj === null || typeof obj !== 'object') return obj;
    if (obj instanceof Date) return new Date(obj.getTime());
    if (obj instanceof Array) return obj.map(item => this.deepClone(item));
    if (typeof obj === 'object') {
      const clonedObj = {};
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          clonedObj[key] = this.deepClone(obj[key]);
        }
      }
      return clonedObj;
    }
  }

  /**
   * Слияние объектов
   */
  mergeObjects(target, ...sources) {
    if (!target || typeof target !== 'object') return {};
    
    const result = this.deepClone(target);
    
    for (const source of sources) {
      if (source && typeof source === 'object') {
        for (const key in source) {
          if (source.hasOwnProperty(key)) {
            if (typeof source[key] === 'object' && !Array.isArray(source[key]) && source[key] !== null) {
              result[key] = this.mergeObjects(result[key] || {}, source[key]);
            } else {
              result[key] = source[key];
            }
          }
        }
      }
    }
    
    return result;
  }

  /**
   * Задержка выполнения
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Retry механизм
   */
  async retry(fn, options = {}) {
    const {
      attempts = 3,
      delay = 1000,
      backoff = true,
      onRetry = null
    } = options;

    let lastError;
    
    for (let i = 0; i < attempts; i++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        
        if (i === attempts - 1) break;
        
        if (onRetry) {
          await onRetry(error, i + 1);
        }
        
        const currentDelay = backoff ? delay * Math.pow(2, i) : delay;
        await this.sleep(currentDelay);
      }
    }
    
    throw lastError;
  }

  /**
   * Chunking массива
   */
  chunkArray(array, size) {
    if (!Array.isArray(array) || size <= 0) return [];
    
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  /**
   * Удаление дубликатов из массива
   */
  uniqueArray(array, key = null) {
    if (!Array.isArray(array)) return [];
    
    if (key) {
      const seen = new Set();
      return array.filter(item => {
        const value = item[key];
        if (seen.has(value)) return false;
        seen.add(value);
        return true;
      });
    }
    
    return [...new Set(array)];
  }

  /**
   * Группировка массива объектов по ключу
   */
  groupBy(array, key) {
    if (!Array.isArray(array)) return {};
    
    return array.reduce((groups, item) => {
      const group = item[key];
      if (!groups[group]) {
        groups[group] = [];
      }
      groups[group].push(item);
      return groups;
    }, {});
  }

  /**
   * Сортировка массива объектов
   */
  sortBy(array, key, order = 'asc') {
    if (!Array.isArray(array)) return [];
    
    return array.sort((a, b) => {
      const aVal = a[key];
      const bVal = b[key];
      
      if (aVal < bVal) return order === 'asc' ? -1 : 1;
      if (aVal > bVal) return order === 'asc' ? 1 : -1;
      return 0;
    });
  }

  /**
   * Генерация пагинации
   */
  generatePagination(page, limit, total) {
    const totalPages = Math.ceil(total / limit);
    const offset = (page - 1) * limit;
    
    return {
      page: parseInt(page),
      limit: parseInt(limit),
      total: parseInt(total),
      totalPages,
      offset,
      hasNext: page < totalPages,
      hasPrev: page > 1,
      nextPage: page < totalPages ? page + 1 : null,
      prevPage: page > 1 ? page - 1 : null
    };
  }

  /**
   * Конвертация query параметров в объект фильтров
   */
  parseFilters(query) {
    const filters = {};
    
    for (const [key, value] of Object.entries(query)) {
      if (value === undefined || value === null || value === '') continue;
      
      // Обработка операторов фильтрации
      if (key.includes('__')) {
        const [field, operator] = key.split('__');
        if (!filters[field]) filters[field] = {};
        
        switch (operator) {
          case 'gt':
          case 'gte':
          case 'lt':
          case 'lte':
          case 'ne':
            filters[field][operator] = value;
            break;
          case 'in':
            filters[field].in = Array.isArray(value) ? value : value.split(',');
            break;
          case 'like':
            filters[field].like = `%${value}%`;
            break;
          case 'ilike':
            filters[field].ilike = `%${value}%`;
            break;
          default:
            filters[field] = value;
        }
      } else {
        filters[key] = value;
      }
    }
    
    return filters;
  }

  /**
   * Маскирование чувствительных данных в объекте
   */
  maskSensitiveData(obj, sensitiveFields = ['password', 'token', 'secret', 'key']) {
    if (!obj || typeof obj !== 'object') return obj;
    
    const masked = this.deepClone(obj);
    
    const maskValue = (value) => {
      if (typeof value === 'string' && value.length > 0) {
        return '*'.repeat(Math.min(value.length, 8));
      }
      return value;
    };
    
    const processObject = (target) => {
      for (const key in target) {
        if (target.hasOwnProperty(key)) {
          const lowerKey = key.toLowerCase();
          const isSensitive = sensitiveFields.some(field => lowerKey.includes(field));
          
          if (isSensitive) {
            target[key] = maskValue(target[key]);
          } else if (typeof target[key] === 'object' && target[key] !== null) {
            processObject(target[key]);
          }
        }
      }
    };
    
    processObject(masked);
    return masked;
  }

  /**
   * Конвертация объекта в query string
   */
  objectToQueryString(obj) {
    if (!obj || typeof obj !== 'object') return '';
    
    const params = new URLSearchParams();
    
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          value.forEach(v => params.append(key, v));
        } else {
          params.append(key, value);
        }
      }
    }
    
    return params.toString();
  }

  /**
   * Проверка валидности JSON
   */
  isValidJSON(str) {
    try {
      JSON.parse(str);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Получение вложенного свойства объекта по пути
   */
  getNestedProperty(obj, path, defaultValue = null) {
    if (!obj || typeof obj !== 'object') return defaultValue;
    
    const keys = path.split('.');
    let current = obj;
    
    for (const key of keys) {
      if (current === null || current === undefined || !(key in current)) {
        return defaultValue;
      }
      current = current[key];
    }
    
    return current;
  }

  /**
   * Установка вложенного свойства объекта по пути
   */
  setNestedProperty(obj, path, value) {
    if (!obj || typeof obj !== 'object') return;
    
    const keys = path.split('.');
    let current = obj;
    
    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      if (!(key in current) || typeof current[key] !== 'object') {
        current[key] = {};
      }
      current = current[key];
    }
    
    current[keys[keys.length - 1]] = value;
  }

  /**
   * Нормализация номера телефона
   */
  normalizePhoneNumber(phone) {
    if (!phone || typeof phone !== 'string') return '';
    
    // Удаляем все символы кроме цифр и +
    let normalized = phone.replace(/[^\d+]/g, '');
    
    // Если номер начинается с 8, заменяем на +7
    if (normalized.startsWith('8') && normalized.length === 11) {
      normalized = '+7' + normalized.substring(1);
    }
    
    // Если номер начинается с 7, добавляем +
    if (normalized.startsWith('7') && normalized.length === 11) {
      normalized = '+' + normalized;
    }
    
    return normalized;
  }

  /**
   * Создание безопасного имени файла
   */
  createSafeFilename(filename) {
    if (!filename || typeof filename !== 'string') return 'file';
    
    const ext = path.extname(filename);
    const name = path.basename(filename, ext);
    
    const safeName = name
      .replace(/[^a-zA-Z0-9а-яё\-_]/g, '_')
      .replace(/_{2,}/g, '_')
      .replace(/^_|_$/g, '');
    
    const timestamp = Date.now();
    const random = this.generateRandomString(6, '0123456789abcdef');
    
    return `${safeName}_${timestamp}_${random}${ext}`;
  }

  /**
   * Получение MIME типа по расширению файла
   */
  getMimeType(filename) {
    const ext = path.extname(filename).toLowerCase();
    
    const mimeTypes = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.pdf': 'application/pdf',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.xls': 'application/vnd.ms-excel',
      '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      '.txt': 'text/plain',
      '.json': 'application/json',
      '.xml': 'application/xml',
      '.zip': 'application/zip',
      '.rar': 'application/x-rar-compressed',
      '.mp3': 'audio/mpeg',
      '.mp4': 'video/mp4',
      '.avi': 'video/x-msvideo',
      '.mov': 'video/quicktime'
    };
    
    return mimeTypes[ext] || 'application/octet-stream';
  }

  /**
   * Конвертация числа в читаемый формат
   */
  formatNumber(num, locale = 'ru-RU') {
    if (typeof num !== 'number' || isNaN(num)) return '0';
    
    return new Intl.NumberFormat(locale).format(num);
  }

  /**
   * Конвертация валюты в читаемый формат
   */
  formatCurrency(amount, currency = 'RUB', locale = 'ru-RU') {
    if (typeof amount !== 'number' || isNaN(amount)) return '0';
    
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency
    }).format(amount);
  }

  /**
   * Генерация цветов для аватара по имени
   */
  generateAvatarColor(name) {
    if (!name || typeof name !== 'string') return '#6366f1';
    
    const colors = [
      '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16',
      '#22c55e', '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9',
      '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef',
      '#ec4899', '#f43f5e'
    ];
    
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    return colors[Math.abs(hash) % colors.length];
  }

  /**
   * Проверка браузера по User-Agent
   */
  detectBrowser(userAgent) {
    if (!userAgent || typeof userAgent !== 'string') return 'unknown';
    
    const browsers = [
      { name: 'Chrome', pattern: /Chrome\/[\d.]+/ },
      { name: 'Firefox', pattern: /Firefox\/[\d.]+/ },
      { name: 'Safari', pattern: /Safari\/[\d.]+/ },
      { name: 'Edge', pattern: /Edge\/[\d.]+/ },
      { name: 'Opera', pattern: /Opera\/[\d.]+/ },
      { name: 'IE', pattern: /MSIE [\d.]+/ }
    ];
    
    for (const browser of browsers) {
      if (browser.pattern.test(userAgent)) {
        return browser.name;
      }
    }
    
    return 'unknown';
  }

  /**
   * Получение размеров изображения из base64
   */
  getImageDimensionsFromBase64(base64Data) {
    try {
      const matches = base64Data.match(/^data:image\/([a-zA-Z]+);base64,(.+)$/);
      if (!matches) return null;
      
      const imageType = matches[1];
      const data = matches[2];
      const buffer = Buffer.from(data, 'base64');
      
      // Простое определение размеров для JPEG и PNG
      if (imageType === 'jpeg' || imageType === 'jpg') {
        // Поиск SOF маркера в JPEG
        for (let i = 0; i < buffer.length - 10; i++) {
          if (buffer[i] === 0xFF && (buffer[i + 1] === 0xC0 || buffer[i + 1] === 0xC2)) {
            const height = buffer.readUInt16BE(i + 5);
            const width = buffer.readUInt16BE(i + 7);
            return { width, height };
          }
        }
      } else if (imageType === 'png') {
        // PNG IHDR chunk всегда начинается с байта 16
        if (buffer.length >= 24) {
          const width = buffer.readUInt32BE(16);
          const height = buffer.readUInt32BE(20);
          return { width, height };
        }
      }
      
      return null;
    } catch (error) {
      logger.error('Error getting image dimensions', { error: error.message });
      return null;
    }
  }
}

module.exports = new HelperUtils();