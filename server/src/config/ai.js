// server/src/config/ai.js
const logger = require('../utils/logger');

class AIConfig {
  constructor() {
    this.providers = {
      yandex: {
        enabled: process.env.YANDEX_GPT_ENABLED === 'true',
        apiKey: process.env.YANDEX_GPT_API_KEY,
        folderId: process.env.YANDEX_CLOUD_FOLDER_ID,
        baseUrl: 'https://llm.api.cloud.yandex.net',
        model: process.env.YANDEX_GPT_MODEL || 'yandexgpt-lite',
        maxTokens: parseInt(process.env.YANDEX_GPT_MAX_TOKENS) || 2000,
        temperature: parseFloat(process.env.YANDEX_GPT_TEMPERATURE) || 0.6
      },
      
      kandinsky: {
        enabled: process.env.KANDINSKY_ENABLED === 'true',
        apiKey: process.env.KANDINSKY_API_KEY,
        secretKey: process.env.KANDINSKY_SECRET_KEY,
        baseUrl: 'https://api-key.fusionbrain.ai',
        version: 'v1',
        model: 'kandinsky-3',
        maxRetries: 3,
        retryDelay: 2000
      },
      
      whisper: {
        enabled: process.env.WHISPER_ENABLED === 'true',
        apiKey: process.env.OPENAI_API_KEY,
        baseUrl: 'https://api.openai.com/v1',
        model: 'whisper-1',
        language: 'ru',
        maxFileSize: 25 * 1024 * 1024 // 25MB
      },
      
      backup: {
        enabled: process.env.BACKUP_AI_ENABLED === 'true',
        provider: process.env.BACKUP_AI_PROVIDER || 'openai',
        apiKey: process.env.BACKUP_AI_API_KEY,
        model: process.env.BACKUP_AI_MODEL || 'gpt-3.5-turbo'
      }
    };

    this.rateLimits = {
      yandex: {
        requestsPerMinute: 10,
        tokensPerDay: 50000
      },
      kandinsky: {
        requestsPerMinute: 5,
        imagesPerDay: 100
      },
      whisper: {
        requestsPerMinute: 3,
        minutesPerDay: 60
      }
    };

    this.prompts = this.initializePrompts();
    this.maxRetries = 3;
    this.retryDelay = 1000;
  }

  /**
   * Валидация конфигурации AI
   */
  validate() {
    const errors = [];

    // Проверка Yandex GPT
    if (this.providers.yandex.enabled) {
      if (!this.providers.yandex.apiKey) {
        errors.push('YANDEX_GPT_API_KEY is required when Yandex GPT is enabled');
      }
      if (!this.providers.yandex.folderId) {
        errors.push('YANDEX_CLOUD_FOLDER_ID is required when Yandex GPT is enabled');
      }
    }

    // Проверка Kandinsky
    if (this.providers.kandinsky.enabled) {
      if (!this.providers.kandinsky.apiKey) {
        errors.push('KANDINSKY_API_KEY is required when Kandinsky is enabled');
      }
      if (!this.providers.kandinsky.secretKey) {
        errors.push('KANDINSKY_SECRET_KEY is required when Kandinsky is enabled');
      }
    }

    // Проверка Whisper
    if (this.providers.whisper.enabled) {
      if (!this.providers.whisper.apiKey) {
        errors.push('OPENAI_API_KEY is required when Whisper is enabled');
      }
    }

    // Проверка резервного провайдера
    if (this.providers.backup.enabled) {
      if (!this.providers.backup.apiKey) {
        errors.push('BACKUP_AI_API_KEY is required when backup AI is enabled');
      }
    }

    if (errors.length > 0) {
      throw new Error(`AI configuration errors: ${errors.join(', ')}`);
    }

    // Проверка доступности хотя бы одного провайдера
    const enabledProviders = Object.values(this.providers).filter(p => p.enabled).length;
    if (enabledProviders === 0) {
      logger.warn('No AI providers are enabled');
    }

    logger.info('AI configuration validated successfully', {
      enabledProviders: Object.keys(this.providers).filter(key => this.providers[key].enabled)
    });

    return true;
  }

  /**
   * Инициализация промптов
   */
  initializePrompts() {
    return {
      tarot: {
        cardInterpretation: `Ты - опытный таролог с глубокими знаниями символизма карт Таро. 
Проанализируй выпавшую карту в контексте заданного вопроса.

Карта: {cardName}
Позиция: {position}
Вопрос: {question}

Дай краткую, но глубокую интерпретацию карты, учитывая:
1. Основное значение карты
2. Контекст вопроса
3. Позицию в раскладе
4. Практические советы

Стиль: мистический, но понятный. Длина: до 200 слов.`,

        spreadAnalysis: `Ты - мастер Таро, анализирующий полный расклад карт.

Расклад: {spreadName}
Карты: {cards}
Вопрос: {question}

Проведи комплексный анализ расклада:
1. Общая энергия расклада
2. Ключевые темы и послания
3. Взаимосвязи между картами
4. Практические рекомендации
5. Временные рамки (если применимо)

Стиль: профессиональный, интуитивный. Длина: до 500 слов.`,

        dailyCard: `Ты - духовный наставник, интерпретирующий карту дня.

Карта дня: {cardName}
Дата: {date}
Лунная фаза: {moonPhase}

Дай вдохновляющую интерпретацию карты дня:
1. Энергия дня
2. На что обратить внимание
3. Возможности и вызовы
4. Практические советы

Стиль: вдохновляющий, позитивный. Длина: до 150 слов.`
      },

      numerology: {
        lifePathAnalysis: `Ты - эксперт по нумерологии, анализирующий число жизненного пути.

Число жизненного пути: {lifePathNumber}
Имя: {name}
Дата рождения: {birthDate}

Дай подробный анализ числа жизненного пути:
1. Основные характеристики личности
2. Жизненные задачи и уроки
3. Таланты и способности
4. Вызовы и препятствия
5. Рекомендации для развития

Стиль: мудрый, поддерживающий. Длина: до 400 слов.`,

        compatibility: `Ты - нумеролог, анализирующий совместимость по числам.

Первый человек: число {number1}
Второй человек: число {number2}
Тип анализа: {analysisType}

Проанализируй совместимость:
1. Уровень совместимости (в процентах)
2. Сильные стороны союза
3. Потенциальные сложности
4. Рекомендации для гармонии

Стиль: объективный, конструктивный. Длина: до 300 слов.`
      },

      lunar: {
        phaseAnalysis: `Ты - астролог, специализирующийся на лунных циклах.

Лунная фаза: {moonPhase}
Дата: {date}
Знак зодиака: {zodiacSign}

Дай рекомендации для этой лунной фазы:
1. Энергия фазы
2. Благоприятные активности
3. Что следует избегать
4. Особенности влияния знака зодиака
5. Практические советы

Стиль: мудрый, практичный. Длина: до 250 слов.`,

        favorableDays: `Ты - астролог, определяющий благоприятные дни.

Активность: {activity}
Период: {startDate} - {endDate}
Лунные фазы: {moonPhases}

Определи наиболее благоприятные дни для данной активности:
1. Лучшие даты и время
2. Обоснование выбора
3. Дополнительные рекомендации
4. Дни, которых стоит избегать

Стиль: практичный, точный. Длина: до 200 слов.`
      },

      general: {
        photoAnalysis: `Ты - эксперт по анализу изображений в контексте эзотерики.

Описание изображения: {imageDescription}
Контекст: {context}

Проанализируй изображение с точки зрения символизма:
1. Ключевые символы и их значения
2. Энергетика изображения
3. Возможные послания
4. Практические интерпретации

Стиль: интуитивный, символический. Длина: до 200 слов.`,

        voiceInterpretation: `Ты - интерпретатор, анализирующий голосовые вопросы для гадания.

Транскрипция: {transcription}
Тип гадания: {divinationType}

Извлеки суть вопроса и подготовь для гадания:
1. Основной вопрос
2. Скрытые аспекты
3. Рекомендуемый тип расклада
4. Ключевые слова для анализа

Стиль: аналитический, ясный. Длина: до 150 слов.`
      }
    };
  }

  /**
   * Получение конфигурации для Yandex GPT
   */
  getYandexConfig() {
    if (!this.providers.yandex.enabled) {
      throw new Error('Yandex GPT is not enabled');
    }

    return {
      apiKey: this.providers.yandex.apiKey,
      folderId: this.providers.yandex.folderId,
      baseUrl: this.providers.yandex.baseUrl,
      model: this.providers.yandex.model,
      maxTokens: this.providers.yandex.maxTokens,
      temperature: this.providers.yandex.temperature,
      headers: {
        'Authorization': `Api-Key ${this.providers.yandex.apiKey}`,
        'Content-Type': 'application/json'
      }
    };
  }

  /**
   * Получение конфигурации для Kandinsky
   */
  getKandinskyConfig() {
    if (!this.providers.kandinsky.enabled) {
      throw new Error('Kandinsky is not enabled');
    }

    return {
      apiKey: this.providers.kandinsky.apiKey,
      secretKey: this.providers.kandinsky.secretKey,
      baseUrl: this.providers.kandinsky.baseUrl,
      version: this.providers.kandinsky.version,
      model: this.providers.kandinsky.model,
      maxRetries: this.providers.kandinsky.maxRetries,
      retryDelay: this.providers.kandinsky.retryDelay,
      headers: {
        'X-Key': `Key ${this.providers.kandinsky.apiKey}`,
        'X-Secret': `Secret ${this.providers.kandinsky.secretKey}`,
        'Content-Type': 'application/json'
      }
    };
  }

  /**
   * Получение конфигурации для Whisper
   */
  getWhisperConfig() {
    if (!this.providers.whisper.enabled) {
      throw new Error('Whisper is not enabled');
    }

    return {
      apiKey: this.providers.whisper.apiKey,
      baseUrl: this.providers.whisper.baseUrl,
      model: this.providers.whisper.model,
      language: this.providers.whisper.language,
      maxFileSize: this.providers.whisper.maxFileSize,
      headers: {
        'Authorization': `Bearer ${this.providers.whisper.apiKey}`,
        'Content-Type': 'multipart/form-data'
      }
    };
  }

  /**
   * Получение промпта по типу и категории
   */
  getPrompt(category, type, variables = {}) {
    const prompt = this.prompts[category]?.[type];
    if (!prompt) {
      throw new Error(`Prompt not found: ${category}.${type}`);
    }

    return this.interpolatePrompt(prompt, variables);
  }

  /**
   * Интерполяция переменных в промпте
   */
  interpolatePrompt(template, variables) {
    return template.replace(/\{(\w+)\}/g, (match, key) => {
      return variables[key] || match;
    });
  }

  /**
   * Получение лимитов для провайдера
   */
  getRateLimits(provider) {
    return this.rateLimits[provider] || {
      requestsPerMinute: 5,
      tokensPerDay: 10000
    };
  }

  /**
   * Получение настроек для обработки ошибок
   */
  getErrorHandling() {
    return {
      maxRetries: this.maxRetries,
      retryDelay: this.retryDelay,
      retryConditions: [
        'ECONNRESET',
        'ETIMEDOUT',
        'ENOTFOUND',
        'EAI_AGAIN'
      ],
      fallbackEnabled: this.providers.backup.enabled,
      timeoutMs: 30000
    };
  }

  /**
   * Получение настроек кэширования
   */
  getCacheConfig() {
    return {
      enabled: process.env.AI_CACHE_ENABLED !== 'false',
      ttl: {
        tarotInterpretation: 60 * 60, // 1 час
        numerologyAnalysis: 24 * 60 * 60, // 24 часа
        lunarAnalysis: 12 * 60 * 60, // 12 часов
        imageGeneration: 7 * 24 * 60 * 60, // 7 дней
        voiceTranscription: 30 * 60 // 30 минут
      },
      keyPrefix: 'ai_cache:',
      compress: true
    };
  }

  /**
   * Получение настроек мониторинга
   */
  getMonitoringConfig() {
    return {
      logRequests: process.env.AI_LOG_REQUESTS === 'true',
      logResponses: process.env.AI_LOG_RESPONSES === 'true',
      trackUsage: true,
      alertThresholds: {
        errorRate: 0.1, // 10%
        responseTime: 10000, // 10 секунд
        dailyLimit: 0.9 // 90% от лимита
      },
      metricsEnabled: process.env.AI_METRICS_ENABLED === 'true'
    };
  }

  /**
   * Получение настроек безопасности
   */
  getSecurityConfig() {
    return {
      inputSanitization: true,
      outputFiltering: true,
      maxInputLength: 5000,
      maxOutputLength: 10000,
      blockedPatterns: [
        /password/i,
        /api[_-]?key/i,
        /token/i,
        /secret/i
      ],
      contentModeration: {
        enabled: true,
        strictMode: false,
        categories: ['hate', 'violence', 'sexual', 'self-harm']
      }
    };
  }

  /**
   * Проверка доступности провайдера
   */
  isProviderEnabled(provider) {
    return this.providers[provider]?.enabled || false;
  }

  /**
   * Получение списка активных провайдеров
   */
  getEnabledProviders() {
    return Object.keys(this.providers).filter(key => 
      this.providers[key].enabled
    );
  }

  /**
   * Маскирование API ключей для логов
   */
  maskApiKey(apiKey) {
    if (!apiKey || typeof apiKey !== 'string') return '';
    if (apiKey.length <= 8) return '*'.repeat(apiKey.length);
    
    return apiKey.substring(0, 4) + '*'.repeat(apiKey.length - 8) + apiKey.substring(apiKey.length - 4);
  }

  /**
   * Получение информации о конфигурации для логов
   */
  getConfigInfo() {
    const info = {
      environment: process.env.NODE_ENV || 'development',
      enabledProviders: this.getEnabledProviders(),
      hasBackup: this.providers.backup.enabled
    };

    // Добавляем замаскированную информацию о ключах
    Object.keys(this.providers).forEach(provider => {
      if (this.providers[provider].enabled) {
        info[`${provider}ApiKey`] = this.maskApiKey(this.providers[provider].apiKey);
      }
    });

    return info;
  }

  /**
   * Получение настроек для конкретного типа запроса
   */
  getRequestConfig(type) {
    const configs = {
      tarotInterpretation: {
        maxTokens: 300,
        temperature: 0.7,
        timeout: 15000
      },
      spreadAnalysis: {
        maxTokens: 600,
        temperature: 0.6,
        timeout: 20000
      },
      numerologyAnalysis: {
        maxTokens: 500,
        temperature: 0.5,
        timeout: 15000
      },
      imageGeneration: {
        width: 1024,
        height: 1024,
        steps: 20,
        timeout: 60000
      },
      voiceTranscription: {
        language: 'ru',
        temperature: 0.1,
        timeout: 30000
      }
    };

    return configs[type] || {
      maxTokens: 200,
      temperature: 0.6,
      timeout: 10000
    };
  }
}

module.exports = new AIConfig();