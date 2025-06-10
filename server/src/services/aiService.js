// server/src/services/aiService.js
const axios = require('axios');
const logger = require('../utils/logger');

class AIService {
  constructor() {
    this.claudeApiKey = process.env.CLAUDE_API_KEY;
    this.openaiApiKey = process.env.OPENAI_API_KEY;
    this.defaultModel = 'claude-3-haiku-20240307';
    this.maxRetries = 3;
    this.retryDelay = 1000;
  }

  /**
   * Основной метод для интерпретации гадания
   */
  async interpretReading(cards, question, user, options = {}) {
    const startTime = Date.now();
    
    try {
      const {
        spreadType = 'single_card',
        positions = [],
        language = 'ru',
        style = 'detailed',
        model = this.defaultModel
      } = options;

      // Формирование промпта
      const prompt = this.buildPrompt(cards, question, spreadType, positions, language, style, user);

      // Получение интерпретации от ИИ
      let interpretation;
      
      if (model.startsWith('claude')) {
        interpretation = await this.getClaudeInterpretation(prompt, model);
      } else if (model.startsWith('gpt')) {
        interpretation = await this.getOpenAIInterpretation(prompt, model);
      } else {
        // Fallback на локальную интерпретацию
        interpretation = await this.getLocalInterpretation(cards, question, spreadType);
      }

      const processingTime = Date.now() - startTime;

      // Анализ настроения и уверенности
      const mood = this.analyzeMood(interpretation);
      const confidence = this.calculateConfidence(cards, question, interpretation);

      logger.info('AI interpretation completed', {
        userId: user.id,
        model,
        processingTime,
        cardCount: cards.length,
        mood,
        confidence
      });

      return {
        interpretation: interpretation.main,
        summary: interpretation.summary,
        advice: interpretation.advice,
        mood,
        confidence,
        processingTime,
        model,
        language
      };

    } catch (error) {
      logger.error('AI interpretation failed', {
        error: error.message,
        userId: user.id,
        cardCount: cards.length,
        model: options.model
      });

      // Fallback на базовую интерпретацию
      return await this.getFallbackInterpretation(cards, question, options);
    }
  }

  /**
   * Получение интерпретации от Claude API
   */
  async getClaudeInterpretation(prompt, model) {
    if (!this.claudeApiKey) {
      throw new Error('Claude API key is not configured');
    }

    const enhancedPrompt = `Ты мастер-таролог с 20+ годами опыта и глубокими знаниями эзотерики, психологии и символизма карт Таро.

${prompt}

ВАЖНО: Дай ПОДРОБНУЮ и СОДЕРЖАТЕЛЬНУЮ интерпретацию (минимум 150 слов).

Структурируй ответ точно в таком формате:

**РЕЗЮМЕ:**
[Краткий вывод о ситуации в 2-3 предложения]

**ИНТЕРПРЕТАЦИЯ:**
[Подробная интерпретация каждой карты в контексте её позиции, минимум 4-5 предложений на карту. Объясни символизм, энергии, влияния, что это значит для человека]

**СОВЕТ:**
[Конкретные практические рекомендации и действия, 3-4 предложения]

Пиши мистично, но понятно. Будь конкретным и практичным. Используй эзотерическую терминологию.`;

    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      try {
        const response = await axios.post(
          'https://api.anthropic.com/v1/messages',
          {
            model: model,
            max_tokens: 1000,
            messages: [
              {
                role: 'user',
                content: enhancedPrompt
              }
            ]
          },
          {
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': this.claudeApiKey,
              'anthropic-version': '2023-06-01'
            },
            timeout: 30000
          }
        );

        const rawText = response.data.content[0].text;
        const parsed = this.parseClaudeResponse(rawText);

        logger.info('Claude interpretation successful', {
          model,
          attempt: attempt + 1,
          responseLength: rawText.length
        });

        return parsed;

      } catch (error) {
        logger.warn('Claude API attempt failed', {
          attempt: attempt + 1,
          error: error.message,
          status: error.response?.status
        });

        if (attempt < this.maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, this.retryDelay * (attempt + 1)));
        } else {
          throw error;
        }
      }
    }
  }

  /**
   * Парсинг ответа от Claude с улучшенным распознаванием структуры
   */
  parseClaudeResponse(text) {
    let summary = '';
    let main = '';
    let advice = '';
    
    // Ищем секции по маркерам
    const summaryMatch = text.match(/\*\*РЕЗЮМЕ:\*\*(.*?)(?=\*\*ИНТЕРПРЕТАЦИЯ:\*\*|\*\*СОВЕТ:\*\*|$)/is);
    const interpretationMatch = text.match(/\*\*ИНТЕРПРЕТАЦИЯ:\*\*(.*?)(?=\*\*СОВЕТ:\*\*|$)/is);
    const adviceMatch = text.match(/\*\*СОВЕТ:\*\*(.*?)$/is);
    
    if (summaryMatch) {
      summary = summaryMatch[1].trim();
    }
    
    if (interpretationMatch) {
      main = interpretationMatch[1].trim();
    }
    
    if (adviceMatch) {
      advice = adviceMatch[1].trim();
    }
    
    // Fallback парсинг если структурированный формат не найден
    if (!main && !summary && !advice) {
      const lines = text.split('\n').filter(line => line.trim());
      let currentSection = 'main';
      
      for (const line of lines) {
        const trimmed = line.trim();
        
        if (trimmed.match(/резюме|краткое|итоги?|summary/i)) {
          currentSection = 'summary';
          continue;
        } else if (trimmed.match(/интерпретац|толкован|значение|interpretation/i)) {
          currentSection = 'main';
          continue;
        } else if (trimmed.match(/совет|рекомендац|практич|advice/i)) {
          currentSection = 'advice';
          continue;
        }
        
        if (currentSection === 'summary' && !summary) {
          summary = trimmed;
        } else if (currentSection === 'advice' && !advice) {
          advice = trimmed;
        } else if (currentSection === 'main') {
          main += trimmed + '\n';
        }
      }
    }
    
    // Финальный fallback - если ничего не спарсилось
    if (!main && !summary && !advice) {
      const sentences = text.split('.').filter(s => s.trim());
      main = text;
      summary = sentences.slice(0, 2).join('.') + '.';
      advice = 'Доверьтесь своей интуиции и следуйте знакам, которые показывают карты.';
    }
    
    return {
      main: main.trim() || text,
      summary: summary || text.split('.').slice(0, 2).join('.') + '.',
      advice: advice || 'Доверьтесь своей интуиции и следуйте знакам, которые показывают карты.'
    };
  }

  /**
   * Локальная базовая интерпретация (fallback)
   */
  async getLocalInterpretation(cards, question, spreadType) {
    const interpretations = [];
    
    for (const card of cards) {
      const cardMeaning = card.getMeaning ? card.getMeaning(card.reversed ? 'reversed' : 'upright') : 'Значение карты';
      const keywords = card.getKeywords ? card.getKeywords(card.reversed ? 'reversed' : 'upright') : ['энергия', 'изменения'];
      
      interpretations.push({
        card: card.name,
        meaning: cardMeaning,
        keywords: keywords.slice(0, 3).join(', ')
      });
    }

    const main = this.generateLocalInterpretation(interpretations, question, spreadType);
    
    return {
      main,
      summary: this.generateSummary(interpretations),
      advice: this.generateAdvice(interpretations, question)
    };
  }

  /**
   * Формирование промпта для ИИ
   */
  buildPrompt(cards, question, spreadType, positions, language, style, user) {
    let prompt = `Проведи гадание на картах Таро.\n\n`;

    if (question) {
      prompt += `Вопрос: "${question}"\n\n`;
    }

    prompt += `Тип расклада: ${this.getSpreadTypeName(spreadType)}\n`;
    prompt += `Количество карт: ${cards.length}\n\n`;

    prompt += `Выпавшие карты:\n`;
    cards.forEach((card, index) => {
      const position = positions[index] ? ` (${positions[index].name})` : '';
      const orientation = card.reversed ? ' (перевёрнутая)' : ' (прямая)';
      prompt += `${index + 1}. ${card.name}${orientation}${position}\n`;
    });

    prompt += `\nДай подробную интерпретацию расклада.`;

    return prompt;
  }

  /**
   * Анализ настроения интерпретации
   */
  analyzeMood(interpretation) {
    const text = (interpretation.main + ' ' + interpretation.summary).toLowerCase();
    
    const positiveWords = ['удача', 'успех', 'радость', 'счастье', 'гармония', 'любовь'];
    const negativeWords = ['препятствие', 'трудность', 'проблема', 'потеря', 'конфликт'];
    
    let positiveCount = 0;
    let negativeCount = 0;
    
    positiveWords.forEach(word => {
      if (text.includes(word)) positiveCount++;
    });
    
    negativeWords.forEach(word => {
      if (text.includes(word)) negativeCount++;
    });
    
    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    return 'neutral';
  }

  /**
   * Расчёт уверенности в интерпретации
   */
  calculateConfidence(cards, question, interpretation) {
    let confidence = 0.7; // Базовая уверенность
    
    // Больше карт = больше уверенности
    confidence += Math.min(cards.length * 0.05, 0.2);
    
    // Наличие вопроса повышает уверенность
    if (question && question.length > 10) {
      confidence += 0.05;
    }
    
    return Math.min(confidence, 0.95);
  }

  /**
   * Fallback интерпретация при ошибках
   */
  async getFallbackInterpretation(cards, question, options) {
    const interpretation = await this.getLocalInterpretation(cards, question, options.spreadType);
    
    return {
      interpretation: interpretation.main,
      summary: interpretation.summary,
      advice: interpretation.advice,
      mood: 'neutral',
      confidence: 0.6,
      processingTime: 0,
      model: 'local-fallback',
      language: options.language || 'ru'
    };
  }

  /**
   * Генерация локальной интерпретации
   */
  generateLocalInterpretation(cardInterpretations, question, spreadType) {
    let interpretation = `Интерпретация расклада "${this.getSpreadTypeName(spreadType)}":\n\n`;
    
    cardInterpretations.forEach((card, index) => {
      interpretation += `${index + 1}. ${card.card}\n`;
      interpretation += `Значение: ${card.meaning}\n`;
      interpretation += `Ключевые слова: ${card.keywords}\n\n`;
    });
    
    if (question) {
      interpretation += `В контексте вашего вопроса карты указывают на важные аспекты ситуации. `;
    }
    
    interpretation += `Обратите внимание на энергии карт и их взаимодействие.`;
    
    return interpretation;
  }

  /**
   * Генерация резюме
   */
  generateSummary(cardInterpretations) {
    const cardNames = cardInterpretations.map(card => card.card).join(', ');
    return `Расклад включает карты: ${cardNames}. Общая энергия указывает на важные изменения.`;
  }

  /**
   * Генерация совета
   */
  generateAdvice(cardInterpretations, question) {
    return 'Доверьтесь своей интуиции и будьте открыты к переменам. Карты показывают путь к гармонии.';
  }

  /**
   * Получение названия типа расклада
   */
  getSpreadTypeName(type) {
    const names = {
      'single_card': 'Одна карта',
      'three_cards': 'Три карты',
      'celtic_cross': 'Кельтский крест',
      'relationship': 'Отношения',
      'career': 'Карьера',
      'daily_card': 'Карта дня',
      'lunar_reading': 'Лунное гадание'
    };
    
    return names[type] || type;
  }
}

module.exports = new AIService();