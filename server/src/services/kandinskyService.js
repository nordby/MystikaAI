// server/src/services/kandinskyService.js
const axios = require('axios');
const FormData = require('form-data');
const logger = require('../utils/logger');

class KandinskyService {
  constructor() {
    this.apiKey = process.env.KANDINSKY_API_KEY || 'B4B24FCE7AC25253335CDA16B337E707';
    this.secretKey = process.env.KANDINSKY_SECRET_KEY || '5CCEF344FFEB62C085035E5B3BCA3DAF';
    
    // Согласно официальной документации
    this.baseUrl = 'https://api-key.fusionbrain.ai/';
    
    this.maxRetries = 3;
    this.retryDelay = 2000;
    this.maxWaitTime = 120000; // 2 минуты
    this.pipelineId = null; // Будет получен при инициализации
  }

  /**
   * Получение доступных pipeline согласно документации
   */
  async getPipeline() {
    try {
      if (this.pipelineId) {
        return this.pipelineId;
      }

      const response = await axios.get(`${this.baseUrl}key/api/v1/pipelines`, {
        headers: this.getHeaders(),
        timeout: 10000
      });

      const pipelines = response.data;
      if (!pipelines || pipelines.length === 0) {
        throw new Error('No pipelines available');
      }

      // Берем первый доступный pipeline (Kandinsky 3.1)
      this.pipelineId = pipelines[0].id;
      logger.info('Pipeline obtained', { 
        pipelineId: this.pipelineId,
        name: pipelines[0].name,
        version: pipelines[0].version
      });
      
      return this.pipelineId;

    } catch (error) {
      logger.error('Failed to get pipeline', { 
        error: error.message,
        status: error.response?.status
      });
      throw error;
    }
  }

  /**
   * Генерация изображения карты Таро с помощью Kandinsky API
   */
  async generateCardImage(cardName, cardDescription, options = {}) {
    try {
      const {
        style = 'mystic',
        width = 680,
        height = 1024
      } = options;

      // Формируем промпт для генерации изображения карты Таро
      const prompt = this.buildCardPrompt(cardName, cardDescription, style);
      
      logger.info('Generating card image', {
        cardName,
        style,
        prompt: prompt.substring(0, 100) + '...'
      });

      // Получаем pipeline
      const pipelineId = await this.getPipeline();
      
      // Запускаем генерацию согласно документации
      const uuid = await this.startGeneration(prompt, pipelineId, { width, height });
      
      // Ожидаем результат
      const imageData = await this.waitForGeneration(uuid);
      
      logger.info('Card image generated successfully', {
        cardName,
        uuid,
        imageSize: imageData.length
      });

      return {
        success: true,
        imageData,
        prompt,
        uuid,
        cardName,
        isMock: false
      };

    } catch (error) {
      logger.error('Failed to generate card image', {
        error: error.message,
        cardName,
        stack: error.stack
      });

      // Возвращаем mock как fallback
      logger.warn('Falling back to mock image generation');
      const mockImageData = this.createMockTarotCard(cardName, style);
      
      return {
        success: true,
        imageData: mockImageData,
        prompt: this.buildCardPrompt(cardName, cardDescription, style),
        uuid: 'fallback-' + Date.now(),
        cardName,
        isMock: true,
        originalError: error.message
      };
    }
  }

  /**
   * Формирование промпта для генерации изображения карты Таро
   */
  buildCardPrompt(cardName, cardDescription, style) {
    const stylePrompts = {
      mystic: 'мистический стиль, таинственный, магический, эзотерический, темные тона, золотые акценты',
      classic: 'классический стиль таро, традиционный, Райдер-Уэйт, винтажная палитра, исторический',
      modern: 'современный стиль, минималистичный, стилизованный, чистые линии, геометрические формы',
      fantasy: 'фэнтези стиль, волшебный, сказочный, яркий, драконы и единороги, магические существа',
      gothic: 'готический стиль, темный, драматичный, мрачный, средневековый, готические арки',
      vintage: 'винтажный стиль, старинный, ретро, антикварный, состаренная бумага, сепия',
      art_nouveau: 'стиль модерн, элегантный, декоративный, изящный, растительные орнаменты',
      minimalist: 'минималистский стиль, простой, лаконичный, монохромный, концептуальный',
      baroque: 'барочный стиль, роскошный, пышный, золоченый, величественный, богато украшенный',
      steampunk: 'стимпанк стиль, механический, викторианский, бронзовый, шестеренки и паровые машины'
    };

    const basePrompt = `Карта Таро "${cardName}", ${cardDescription}, ${stylePrompts[style] || stylePrompts.mystic}`;
    
    // Добавляем стиль-специфичные улучшения
    const styleEnhancements = {
      mystic: 'мистические символы, эзотерическая атмосфера, лунный свет, звездное небо',
      classic: 'традиционная иконография, классические символы таро, историческая точность',
      modern: 'современная графика, чистая композиция, типографские элементы',
      fantasy: 'волшебные эффекты, фантастические пейзажи, магические артефакты',
      gothic: 'готические витражи, средневековые замки, мистические руны, темная романтика',
      vintage: 'старинные рамки, потертые края, ретро типографика, антикварные детали',
      art_nouveau: 'изящные линии, цветочные мотивы, декоративные рамки, стиль Альфонса Мухи',
      minimalist: 'простые формы, негативное пространство, монохромная палитра',
      baroque: 'богатые орнаменты, золотые рамы, роскошные ткани, дворцовый интерьер',
      steampunk: 'викторианские механизмы, медные трубы, паровые двигатели, ретрофутуризм'
    };
    
    const enhancement = styleEnhancements[style] || styleEnhancements.mystic;
    const enhancedPrompt = `${basePrompt}, ${enhancement}, высокое качество, детализированное изображение, красивая композиция, профессиональная иллюстрация, 4K качество`;

    return enhancedPrompt;
  }

  /**
   * Параллельная генерация нескольких изображений карт
   */
  async generateMultipleCardImages(cards, options = {}) {
    try {
      const {
        style = 'mystic',
        width = 680,
        height = 1024,
        maxConcurrent = 3 // Ограничиваем количество одновременных запросов
      } = options;

      logger.info('Starting parallel image generation', {
        cardCount: cards.length,
        style,
        maxConcurrent
      });

      // Получаем pipeline один раз для всех запросов
      const pipelineId = await this.getPipeline();

      // Разбиваем карты на батчи для параллельной обработки
      const batches = [];
      for (let i = 0; i < cards.length; i += maxConcurrent) {
        batches.push(cards.slice(i, i + maxConcurrent));
      }

      const results = [];

      // Обрабатываем каждый батч параллельно
      for (const batch of batches) {
        const batchPromises = batch.map(async (card) => {
          try {
            const prompt = this.buildCardPrompt(card.name, card.description, style);
            
            // Запускаем генерацию
            const uuid = await this.startGeneration(prompt, pipelineId, { width, height });
            
            return {
              card,
              uuid,
              prompt,
              status: 'started'
            };
          } catch (error) {
            logger.error('Failed to start generation for card', {
              cardName: card.name,
              error: error.message
            });
            return {
              card,
              error: error.message,
              status: 'failed'
            };
          }
        });

        const batchResults = await Promise.allSettled(batchPromises);
        
        // Извлекаем успешные результаты
        const startedGenerations = batchResults
          .filter(result => result.status === 'fulfilled' && result.value.status === 'started')
          .map(result => result.value);

        // Ждем завершения всех генераций в батче
        const completedPromises = startedGenerations.map(async (generation) => {
          try {
            const imageData = await this.waitForGeneration(generation.uuid);
            return {
              success: true,
              imageData,
              prompt: generation.prompt,
              uuid: generation.uuid,
              cardName: generation.card.name,
              card: generation.card,
              isMock: false
            };
          } catch (error) {
            logger.error('Generation failed for card', {
              cardName: generation.card.name,
              uuid: generation.uuid,
              error: error.message
            });
            return {
              success: false,
              error: error.message,
              cardName: generation.card.name,
              card: generation.card
            };
          }
        });

        const completedResults = await Promise.allSettled(completedPromises);
        results.push(...completedResults.map(result => 
          result.status === 'fulfilled' ? result.value : { success: false, error: 'Promise rejected' }
        ));

        // Небольшая задержка между батчами, чтобы не перегружать API
        if (batches.indexOf(batch) < batches.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      const successCount = results.filter(r => r.success).length;
      const failCount = results.length - successCount;

      logger.info('Parallel image generation completed', {
        total: results.length,
        successful: successCount,
        failed: failCount
      });

      return {
        success: true,
        results,
        stats: {
          total: results.length,
          successful: successCount,
          failed: failCount
        }
      };

    } catch (error) {
      logger.error('Parallel image generation failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Асинхронное предварительное кэширование популярных карт
   */
  async preGeneratePopularCards(popularCards, styles = ['mystic', 'classic'], options = {}) {
    try {
      const {
        priority = 'low', // low, normal, high
        delay = 5000 // Задержка между запросами в мс
      } = options;

      logger.info('Starting pre-generation of popular cards', {
        cardCount: popularCards.length,
        styles: styles.length,
        totalImages: popularCards.length * styles.length
      });

      // Создаем список всех комбинаций карта-стиль
      const combinations = [];
      for (const card of popularCards) {
        for (const style of styles) {
          combinations.push({ card, style });
        }
      }

      // Запускаем генерацию в фоновом режиме
      this.backgroundGeneration(combinations, delay);

      return {
        success: true,
        scheduled: combinations.length,
        message: 'Background generation started'
      };

    } catch (error) {
      logger.error('Failed to start pre-generation', { error: error.message });
      throw error;
    }
  }

  /**
   * Фоновая генерация изображений
   */
  async backgroundGeneration(combinations, delay) {
    for (const { card, style } of combinations) {
      try {
        // Проверяем, не было ли изображение уже сгенерировано
        // (здесь можно добавить проверку кэша)
        
        await this.generateCardImage(card.name, card.description, { style });
        
        logger.info('Background generation completed', {
          cardName: card.name,
          style
        });

        // Задержка между генерациями
        await new Promise(resolve => setTimeout(resolve, delay));

      } catch (error) {
        logger.warn('Background generation failed', {
          cardName: card.name,
          style,
          error: error.message
        });
        
        // Продолжаем с большей задержкой в случае ошибки
        await new Promise(resolve => setTimeout(resolve, delay * 2));
      }
    }

    logger.info('All background generations completed');
  }

  /**
   * Оптимизированная генерация с fallback на моковые изображения
   */
  async generateCardImageWithFallback(cardName, cardDescription, options = {}) {
    const {
      timeout = 30000, // 30 секунд timeout
      mockFallback = true
    } = options;

    try {
      // Устанавливаем timeout для генерации
      const generationPromise = this.generateCardImage(cardName, cardDescription, options);
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Generation timeout')), timeout)
      );

      const result = await Promise.race([generationPromise, timeoutPromise]);
      return result;

    } catch (error) {
      logger.warn('Image generation failed, using fallback', {
        cardName,
        error: error.message,
        mockFallback
      });

      if (mockFallback) {
        // Возвращаем моковое изображение
        return {
          success: true,
          imageData: null, // Будет использоваться дефолтное изображение
          prompt: `Mock: ${cardName}`,
          uuid: 'mock-' + Date.now(),
          cardName,
          isMock: true
        };
      }

      throw error;
    }
  }

  /**
   * Получение списка доступных стилей колод
   */
  getAvailableStyles() {
    return {
      mystic: {
        name: 'Мистический',
        description: 'Таинственный магический стиль с темными тонами и золотыми акцентами',
        emoji: '🔮'
      },
      classic: {
        name: 'Классический',
        description: 'Традиционный стиль Райдер-Уэйт с исторической точностью',
        emoji: '📜'
      },
      modern: {
        name: 'Современный',
        description: 'Минималистичный стиль с чистыми линиями и геометрией',
        emoji: '🔳'
      },
      fantasy: {
        name: 'Фэнтези',
        description: 'Волшебный сказочный стиль с магическими существами',
        emoji: '🧚'
      },
      gothic: {
        name: 'Готический',
        description: 'Темный драматичный стиль с готическими мотивами',
        emoji: '🏰'
      },
      vintage: {
        name: 'Винтажный',
        description: 'Старинный ретро стиль с состаренной бумагой',
        emoji: '📰'
      },
      art_nouveau: {
        name: 'Ар-нуво',
        description: 'Элегантный декоративный стиль с растительными орнаментами',
        emoji: '🌿'
      },
      minimalist: {
        name: 'Минимализм',
        description: 'Простой лаконичный концептуальный стиль',
        emoji: '⬜'
      },
      baroque: {
        name: 'Барокко',
        description: 'Роскошный пышный стиль с богатыми орнаментами',
        emoji: '👑'
      },
      steampunk: {
        name: 'Стимпанк',
        description: 'Викторианский механический стиль с шестеренками',
        emoji: '⚙️'
      }
    };
  }

  /**
   * Запуск генерации изображения согласно документации
   */
  async startGeneration(prompt, pipelineId, params) {
    try {
      // Параметры согласно документации
      const requestParams = {
        type: "GENERATE",
        numImages: 1,
        width: params.width,
        height: params.height,
        generateParams: {
          query: prompt
        }
      };

      // Формируем данные согласно примеру из документации
      const formData = new FormData();
      formData.append('pipeline_id', pipelineId);
      formData.append('params', JSON.stringify(requestParams), {
        contentType: 'application/json'
      });

      logger.info('Starting generation', { 
        pipelineId, 
        prompt: prompt.substring(0, 50) + '...',
        width: params.width,
        height: params.height
      });

      const response = await axios.post(`${this.baseUrl}key/api/v1/pipeline/run`, formData, {
        headers: {
          ...this.getHeaders(),
          ...formData.getHeaders()
        },
        timeout: 30000
      });

      const uuid = response.data.uuid;
      
      if (!uuid) {
        throw new Error('No UUID received from generation request');
      }

      logger.info('Generation started successfully', { uuid, pipelineId });
      
      return uuid;

    } catch (error) {
      logger.error('Failed to start generation', { 
        error: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      
      throw new Error(`Failed to start generation: ${error.message}`);
    }
  }

  /**
   * Ожидание завершения генерации согласно документации
   */
  async waitForGeneration(uuid) {
    const startTime = Date.now();
    let attempts = 0;
    const delay = 10000; // 10 секунд между проверками
    const maxAttempts = 12; // Максимум 2 минуты ожидания
    
    while (attempts < maxAttempts) {
      attempts++;
      
      try {
        const response = await axios.get(
          `${this.baseUrl}key/api/v1/pipeline/status/${uuid}`,
          {
            headers: this.getHeaders(),
            timeout: 10000
          }
        );

        const { status, result, errorDescription } = response.data;
        
        logger.debug('Generation status check', { 
          uuid, 
          status, 
          attempt: attempts,
          elapsed: Date.now() - startTime
        });

        if (status === 'DONE') {
          if (!result || !result.files || result.files.length === 0) {
            throw new Error('No images returned');
          }

          // Проверяем на цензуру
          if (result.censored) {
            logger.warn('Generated image was censored', { uuid });
            throw new Error('Generated image was censored');
          }

          // Возвращаем первое изображение в base64
          logger.info('Generation completed successfully', { 
            uuid, 
            attempts,
            elapsed: Date.now() - startTime
          });
          
          return result.files[0];
          
        } else if (status === 'FAIL') {
          throw new Error(`Generation failed: ${errorDescription || 'Unknown error'}`);
        }

        // Статусы INITIAL и PROCESSING - продолжаем ждать
        logger.debug(`Generation in progress: ${status}`, { uuid, attempt: attempts });
        
        // Ждем перед следующей проверкой
        await new Promise(resolve => setTimeout(resolve, delay));

      } catch (error) {
        logger.warn('Status check attempt failed', {
          uuid,
          attempt: attempts,
          error: error.message
        });

        // Если это не последняя попытка, продолжаем
        if (attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        
        throw error;
      }
    }

    throw new Error('Generation timeout exceeded (2 minutes)');
  }

  /**
   * Получение заголовков для API запросов согласно документации
   */
  getHeaders() {
    return {
      'X-Key': `Key ${this.apiKey}`,
      'X-Secret': `Secret ${this.secretKey}`
    };
  }

  /**
   * Генерация изображений для полного расклада
   */
  async generateSpreadImages(cards, spreadType) {
    try {
      const results = [];
      
      for (let i = 0; i < cards.length; i++) {
        const card = cards[i];
        
        logger.info(`Generating image for card ${i + 1}/${cards.length}`, {
          cardName: card.name,
          spreadType
        });

        try {
          const imageResult = await this.generateCardImage(
            card.name,
            card.description || 'Карта Таро',
            { style: 'mystic' }
          );

          results.push({
            cardIndex: i,
            cardName: card.name,
            ...imageResult
          });

          // Пауза между генерациями, чтобы не нагружать API
          if (i < cards.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }

        } catch (cardError) {
          logger.error(`Failed to generate image for card ${card.name}`, {
            error: cardError.message
          });
          
          results.push({
            cardIndex: i,
            cardName: card.name,
            success: false,
            error: cardError.message
          });
        }
      }

      const successCount = results.filter(r => r.success).length;
      
      logger.info('Spread image generation completed', {
        totalCards: cards.length,
        successCount,
        failureCount: cards.length - successCount
      });

      return {
        success: true,
        results,
        spreadType,
        successCount,
        totalCards: cards.length
      };

    } catch (error) {
      logger.error('Failed to generate spread images', {
        error: error.message,
        spreadType,
        cardCount: cards.length
      });

      return {
        success: false,
        error: error.message,
        spreadType,
        totalCards: cards.length
      };
    }
  }

  /**
   * Проверка доступности сервиса согласно документации
   */
  async checkServiceHealth() {
    try {
      // Проверяем доступность pipeline
      const pipelineId = await this.getPipeline();
      
      // Проверяем доступность генерации
      const availabilityResponse = await axios.get(
        `${this.baseUrl}key/api/v1/pipeline/${pipelineId}/availability`,
        {
          headers: this.getHeaders(),
          timeout: 10000
        }
      );

      const availability = availabilityResponse.data;

      return {
        available: !availability.pipeline_status || availability.pipeline_status !== 'DISABLED_BY_QUEUE',
        pipelineId,
        pipelineStatus: availability.pipeline_status || 'ACTIVE',
        apiKey: this.apiKey ? 'configured' : 'missing',
        secretKey: this.secretKey ? 'configured' : 'missing'
      };

    } catch (error) {
      logger.error('Service health check failed', {
        error: error.message,
        status: error.response?.status
      });

      return {
        available: false,
        error: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        apiKey: this.apiKey ? 'configured' : 'missing',
        secretKey: this.secretKey ? 'configured' : 'missing'
      };
    }
  }

  /**
   * Тестовая генерация для проверки API
   */
  async testGeneration() {
    try {
      logger.info('Starting API test generation');
      
      const result = await this.generateCardImage(
        'Тестовая карта',
        'Простое изображение для тестирования API',
        { style: 'mystic', width: 512, height: 512 }
      );
      
      return {
        success: true,
        isMock: result.isMock,
        uuid: result.uuid,
        imageLength: result.imageData?.length || 0
      };

    } catch (error) {
      logger.error('API test failed', { error: error.message });
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Создание красивого mock изображения для карты Таро
   */
  createMockTarotCard(cardName, style) {
    // Создаем простое, но валидное PNG изображение для карты Таро
    // Это минимальное 1x1 пиксель PNG изображение, но валидное
    const simplePNG = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
    
    // Можем вернуть разные цвета для разных стилей
    const colorVariants = {
      mystic: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP4/598PwAFWQH/A1/F2wAAAABJRU5ErkJggg==', // фиолетовый
      classic: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', // черный
      modern: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M/IAAABiABidY6LBQAAAABJRU5ErkJggg==', // серый
      fantasy: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+P+fAQABhABpWQDriwAAAABJRU5ErkJggg==' // синий
    };
    
    return colorVariants[style] || colorVariants.mystic;
  }

  /**
   * Простая хеш-функция для выбора консистентного изображения для карты
   */
  hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Конвертируем в 32-битное целое
    }
    return Math.abs(hash);
  }
}

module.exports = new KandinskyService();