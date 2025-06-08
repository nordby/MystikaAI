// server/src/utils/encryption.js
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const logger = require('./logger');

class EncryptionUtils {
  constructor() {
    this.algorithm = 'aes-256-gcm';
    this.jwtSecret = process.env.JWT_SECRET || 'default-secret-key';
    this.jwtRefreshSecret = process.env.JWT_REFRESH_SECRET || 'default-refresh-secret';
    this.encryptionKey = this.deriveKey(process.env.ENCRYPTION_KEY || 'default-encryption-key');
    this.saltRounds = 12;
  }

  /**
   * Генерация ключа шифрования из строки
   */
  deriveKey(password) {
    return crypto.scryptSync(password, 'salt', 32);
  }

  /**
   * Шифрование текста
   */
  encrypt(text) {
    try {
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipher(this.algorithm, this.encryptionKey);
      cipher.setAAD(Buffer.from('mistika-app', 'utf8'));

      let encrypted = cipher.update(text, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      const authTag = cipher.getAuthTag();
      
      return {
        encrypted,
        iv: iv.toString('hex'),
        authTag: authTag.toString('hex')
      };
    } catch (error) {
      logger.error('Encryption error', { error: error.message });
      throw new Error('Ошибка шифрования данных');
    }
  }

  /**
   * Расшифровка текста
   */
  decrypt(encryptedData) {
    try {
      const { encrypted, iv, authTag } = encryptedData;
      
      const decipher = crypto.createDecipher(this.algorithm, this.encryptionKey);
      decipher.setAAD(Buffer.from('mistika-app', 'utf8'));
      decipher.setAuthTag(Buffer.from(authTag, 'hex'));

      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      logger.error('Decryption error', { error: error.message });
      throw new Error('Ошибка расшифровки данных');
    }
  }

  /**
   * Хеширование пароля
   */
  async hashPassword(password) {
    try {
      const salt = await bcrypt.genSalt(this.saltRounds);
      return await bcrypt.hash(password, salt);
    } catch (error) {
      logger.error('Password hashing error', { error: error.message });
      throw new Error('Ошибка хеширования пароля');
    }
  }

  /**
   * Проверка пароля
   */
  async verifyPassword(password, hashedPassword) {
    try {
      return await bcrypt.compare(password, hashedPassword);
    } catch (error) {
      logger.error('Password verification error', { error: error.message });
      throw new Error('Ошибка проверки пароля');
    }
  }

  /**
   * Генерация JWT токена доступа
   */
  generateAccessToken(payload, expiresIn = '1h') {
    try {
      return jwt.sign(payload, this.jwtSecret, {
        expiresIn,
        issuer: 'mistika-app',
        audience: 'mistika-users'
      });
    } catch (error) {
      logger.error('Access token generation error', { error: error.message });
      throw new Error('Ошибка генерации токена доступа');
    }
  }

  /**
   * Генерация JWT refresh токена
   */
  generateRefreshToken(payload, expiresIn = '7d') {
    try {
      return jwt.sign(payload, this.jwtRefreshSecret, {
        expiresIn,
        issuer: 'mistika-app',
        audience: 'mistika-users'
      });
    } catch (error) {
      logger.error('Refresh token generation error', { error: error.message });
      throw new Error('Ошибка генерации refresh токена');
    }
  }

  /**
   * Верификация JWT токена доступа
   */
  verifyAccessToken(token) {
    try {
      return jwt.verify(token, this.jwtSecret, {
        issuer: 'mistika-app',
        audience: 'mistika-users'
      });
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new Error('Токен доступа истек');
      } else if (error.name === 'JsonWebTokenError') {
        throw new Error('Некорректный токен доступа');
      } else {
        logger.error('Access token verification error', { error: error.message });
        throw new Error('Ошибка верификации токена доступа');
      }
    }
  }

  /**
   * Верификация JWT refresh токена
   */
  verifyRefreshToken(token) {
    try {
      return jwt.verify(token, this.jwtRefreshSecret, {
        issuer: 'mistika-app',
        audience: 'mistika-users'
      });
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new Error('Refresh токен истек');
      } else if (error.name === 'JsonWebTokenError') {
        throw new Error('Некорректный refresh токен');
      } else {
        logger.error('Refresh token verification error', { error: error.message });
        throw new Error('Ошибка верификации refresh токена');
      }
    }
  }

  /**
   * Генерация случайного токена
   */
  generateRandomToken(length = 32) {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Генерация безопасного UUID
   */
  generateSecureUUID() {
    return crypto.randomUUID();
  }

  /**
   * Создание HMAC подписи
   */
  createHMAC(data, secret = null) {
    try {
      const key = secret || this.jwtSecret;
      return crypto.createHmac('sha256', key).update(data).digest('hex');
    } catch (error) {
      logger.error('HMAC creation error', { error: error.message });
      throw new Error('Ошибка создания HMAC подписи');
    }
  }

  /**
   * Проверка HMAC подписи
   */
  verifyHMAC(data, signature, secret = null) {
    try {
      const key = secret || this.jwtSecret;
      const expectedSignature = crypto.createHmac('sha256', key).update(data).digest('hex');
      return crypto.timingSafeEqual(
        Buffer.from(signature, 'hex'),
        Buffer.from(expectedSignature, 'hex')
      );
    } catch (error) {
      logger.error('HMAC verification error', { error: error.message });
      return false;
    }
  }

  /**
   * Шифрование файла
   */
  encryptFile(buffer) {
    try {
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipher('aes-256-cbc', this.encryptionKey);
      cipher.setInitializationVector(iv);

      const encrypted = Buffer.concat([
        cipher.update(buffer),
        cipher.final()
      ]);

      return {
        encrypted,
        iv: iv.toString('hex')
      };
    } catch (error) {
      logger.error('File encryption error', { error: error.message });
      throw new Error('Ошибка шифрования файла');
    }
  }

  /**
   * Расшифровка файла
   */
  decryptFile(encryptedBuffer, ivHex) {
    try {
      const iv = Buffer.from(ivHex, 'hex');
      const decipher = crypto.createDecipher('aes-256-cbc', this.encryptionKey);
      decipher.setInitializationVector(iv);

      const decrypted = Buffer.concat([
        decipher.update(encryptedBuffer),
        decipher.final()
      ]);

      return decrypted;
    } catch (error) {
      logger.error('File decryption error', { error: error.message });
      throw new Error('Ошибка расшифровки файла');
    }
  }

  /**
   * Генерация хеша файла
   */
  generateFileHash(buffer, algorithm = 'sha256') {
    try {
      return crypto.createHash(algorithm).update(buffer).digest('hex');
    } catch (error) {
      logger.error('File hash generation error', { error: error.message });
      throw new Error('Ошибка генерации хеша файла');
    }
  }

  /**
   * Маскирование чувствительных данных
   */
  maskSensitiveData(data, visibleChars = 4) {
    if (!data || typeof data !== 'string') return data;
    
    if (data.length <= visibleChars * 2) {
      return '*'.repeat(data.length);
    }

    const start = data.substring(0, visibleChars);
    const end = data.substring(data.length - visibleChars);
    const middle = '*'.repeat(data.length - visibleChars * 2);

    return start + middle + end;
  }

  /**
   * Безопасное сравнение строк (защита от timing attacks)
   */
  safeCompare(a, b) {
    if (typeof a !== 'string' || typeof b !== 'string') {
      return false;
    }

    if (a.length !== b.length) {
      return false;
    }

    return crypto.timingSafeEqual(
      Buffer.from(a, 'utf8'),
      Buffer.from(b, 'utf8')
    );
  }

  /**
   * Генерация ключа API
   */
  generateAPIKey(prefix = 'mk', length = 32) {
    const randomPart = crypto.randomBytes(length).toString('hex');
    return `${prefix}_${randomPart}`;
  }

  /**
   * Шифрование объекта JSON
   */
  encryptJSON(object) {
    try {
      const jsonString = JSON.stringify(object);
      return this.encrypt(jsonString);
    } catch (error) {
      logger.error('JSON encryption error', { error: error.message });
      throw new Error('Ошибка шифрования JSON объекта');
    }
  }

  /**
   * Расшифровка объекта JSON
   */
  decryptJSON(encryptedData) {
    try {
      const decryptedString = this.decrypt(encryptedData);
      return JSON.parse(decryptedString);
    } catch (error) {
      logger.error('JSON decryption error', { error: error.message });
      throw new Error('Ошибка расшифровки JSON объекта');
    }
  }

  /**
   * Генерация одноразового пароля (OTP)
   */
  generateOTP(length = 6) {
    const digits = '0123456789';
    let otp = '';
    
    for (let i = 0; i < length; i++) {
      const randomIndex = crypto.randomInt(0, digits.length);
      otp += digits[randomIndex];
    }
    
    return otp;
  }

  /**
   * Создание подписи для Telegram WebApp данных
   */
  createTelegramSignature(data, botToken) {
    try {
      const secretKey = crypto.createHmac('sha256', 'WebAppData')
        .update(botToken)
        .digest();
      
      const signature = crypto.createHmac('sha256', secretKey)
        .update(data)
        .digest('hex');
      
      return signature;
    } catch (error) {
      logger.error('Telegram signature creation error', { error: error.message });
      throw new Error('Ошибка создания подписи Telegram');
    }
  }

  /**
   * Проверка подписи Telegram WebApp данных
   */
  verifyTelegramSignature(data, signature, botToken) {
    try {
      const expectedSignature = this.createTelegramSignature(data, botToken);
      return this.safeCompare(signature, expectedSignature);
    } catch (error) {
      logger.error('Telegram signature verification error', { error: error.message });
      return false;
    }
  }

  /**
   * Шифрование данных для хранения в базе данных
   */
  encryptForStorage(data) {
    try {
      if (typeof data === 'object') {
        data = JSON.stringify(data);
      }
      
      const encrypted = this.encrypt(data.toString());
      return `encrypted:${encrypted.iv}:${encrypted.authTag}:${encrypted.encrypted}`;
    } catch (error) {
      logger.error('Storage encryption error', { error: error.message });
      throw new Error('Ошибка шифрования для хранения');
    }
  }

  /**
   * Расшифровка данных из базы данных
   */
  decryptFromStorage(encryptedString) {
    try {
      if (!encryptedString || !encryptedString.startsWith('encrypted:')) {
        return encryptedString; // Не зашифровано
      }
      
      const parts = encryptedString.split(':');
      if (parts.length !== 4) {
        throw new Error('Некорректный формат зашифрованных данных');
      }
      
      const [, iv, authTag, encrypted] = parts;
      const decrypted = this.decrypt({ encrypted, iv, authTag });
      
      // Пытаемся распарсить как JSON
      try {
        return JSON.parse(decrypted);
      } catch {
        return decrypted;
      }
    } catch (error) {
      logger.error('Storage decryption error', { error: error.message });
      throw new Error('Ошибка расшифровки из хранилища');
    }
  }

  /**
   * Создание fingerprint для устройства
   */
  createDeviceFingerprint(userAgent, ip, additionalData = {}) {
    try {
      const data = {
        userAgent,
        ip,
        timestamp: Date.now(),
        ...additionalData
      };
      
      return crypto.createHash('sha256')
        .update(JSON.stringify(data))
        .digest('hex');
    } catch (error) {
      logger.error('Device fingerprint creation error', { error: error.message });
      throw new Error('Ошибка создания отпечатка устройства');
    }
  }

  /**
   * Генерация session ID
   */
  generateSessionId() {
    const timestamp = Date.now().toString(36);
    const randomPart = crypto.randomBytes(16).toString('hex');
    return `${timestamp}_${randomPart}`;
  }

  /**
   * Проверка силы пароля
   */
  checkPasswordStrength(password) {
    const result = {
      score: 0,
      requirements: {
        length: password.length >= 8,
        uppercase: /[A-Z]/.test(password),
        lowercase: /[a-z]/.test(password),
        number: /\d/.test(password),
        special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)
      },
      feedback: []
    };

    // Подсчет баллов
    Object.values(result.requirements).forEach(req => {
      if (req) result.score += 1;
    });

    // Дополнительные проверки
    if (password.length >= 12) result.score += 1;
    if (password.length >= 16) result.score += 1;

    // Обратная связь
    if (!result.requirements.length) {
      result.feedback.push('Пароль должен содержать минимум 8 символов');
    }
    if (!result.requirements.uppercase) {
      result.feedback.push('Добавьте заглавные буквы');
    }
    if (!result.requirements.lowercase) {
      result.feedback.push('Добавьте строчные буквы');
    }
    if (!result.requirements.number) {
      result.feedback.push('Добавьте цифры');
    }
    if (!result.requirements.special) {
      result.feedback.push('Добавьте специальные символы');
    }

    // Определение уровня
    if (result.score >= 6) {
      result.level = 'strong';
    } else if (result.score >= 4) {
      result.level = 'medium';
    } else {
      result.level = 'weak';
    }

    return result;
  }
}

module.exports = new EncryptionUtils();