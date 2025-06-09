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
      mystic: 'мистический стиль, таинственный, магический, эзотерический',
      classic: 'классический стиль таро, традиционный, Райдер-Уэйт',
      modern: 'современный стиль, минималистичный, стилизованный',
      fantasy: 'фэнтези стиль, волшебный, сказочный, яркий'
    };

    const basePrompt = `Карта Таро "${cardName}", ${cardDescription}, ${stylePrompts[style] || stylePrompts.mystic}`;
    
    const enhancedPrompt = `${basePrompt}, высокое качество, детализированное изображение, красивая композиция, профессиональная иллюстрация, золотые акценты, мистические символы, эзотерическая атмосфера, 4K качество`;

    return enhancedPrompt;
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