// Enhanced Lunar Service with AI Integration
const lunarService = require('./lunarService');
const aiService = require('./aiService');
const logger = require('../utils/logger');

class EnhancedLunarService {
  constructor() {
    this.baseService = lunarService;
  }

  /**
   * Получение расширенных рекомендаций с ИИ анализом
   */
  async getEnhancedDailyRecommendations(date = new Date(), userContext = {}) {
    try {
      // Получаем базовые астрологические данные
      const baseData = await this.baseService.getDailyRecommendations(date);
      
      // Создаем контекст для ИИ
      const aiContext = this.buildAIContext(baseData, userContext);
      
      // Генерируем улучшенные рекомендации через ИИ
      const aiRecommendations = await this.generateAIRecommendations(aiContext);
      
      return {
        ...baseData,
        aiEnhanced: true,
        personalizedAdvice: aiRecommendations.personalizedAdvice,
        detailedInterpretation: aiRecommendations.detailedInterpretation,
        practicalTips: aiRecommendations.practicalTips,
        energyForecast: aiRecommendations.energyForecast,
        manifestationAdvice: aiRecommendations.manifestationAdvice,
        relationships: aiRecommendations.relationships,
        career: aiRecommendations.career,
        health: aiRecommendations.health,
        spirituality: aiRecommendations.spirituality
      };
    } catch (error) {
      logger.error('Error getting enhanced daily recommendations', { error: error.message, date });
      // Fallback к базовым рекомендациям с имитацией ИИ-структуры
      const baseData = await this.baseService.getDailyRecommendations(date);
      return {
        ...baseData,
        aiEnhanced: false,
        personalizedAdvice: `Сегодня ${baseData.moonPhase.name.toLowerCase()} приносит особую энергию. ${baseData.moonPhase.energy}`,
        detailedInterpretation: `Энергия ${baseData.moonPhase.name.toLowerCase()} в сочетании с влиянием ${baseData.zodiacSign.name} создает благоприятные условия для духовного развития и самопознания.`,
        practicalTips: baseData.activities.recommended.slice(0, 5),
        energyForecast: `День будет насыщен энергией ${baseData.moonPhase.name.toLowerCase()}. Используйте это время для ${baseData.activities.recommended[0]?.toLowerCase() || 'медитации'}.`,
        manifestationAdvice: ['Визуализируйте ваши цели', 'Записывайте намерения', 'Практикуйте благодарность'],
        relationships: ['Проявляйте терпение к близким', 'Слушайте интуицию в общении'],
        career: ['Фокусируйтесь на приоритетах', 'Избегайте поспешных решений'],
        health: ['Больше отдыхайте', 'Пейте достаточно воды'],
        spirituality: ['Медитируйте перед сном', 'Ведите дневник благодарности']
      };
    }
  }

  /**
   * Создание контекста для ИИ анализа
   */
  buildAIContext(baseData, userContext) {
    return {
      lunarDay: baseData.lunarDay,
      moonPhase: {
        phase: baseData.moonPhase.phase,
        name: baseData.moonPhase.name,
        energy: baseData.moonPhase.energy,
        description: baseData.moonPhase.description
      },
      zodiacSign: {
        sign: baseData.zodiacSign.sign,
        name: baseData.zodiacSign.name,
        element: baseData.zodiacSign.element,
        energy: baseData.zodiacSign.energy
      },
      date: baseData.date,
      activities: baseData.activities,
      userProfile: {
        subscriptionType: userContext.subscriptionType || 'basic',
        interests: userContext.interests || [],
        previousReadings: userContext.previousReadings || 0,
        lifeArea: userContext.lifeArea || 'general'
      }
    };
  }

  /**
   * Генерация рекомендаций через ИИ
   */
  async generateAIRecommendations(context) {
    const prompt = `
Ты - мистический астролог и эксперт по лунным циклам. Создай подробные персональные рекомендации на основе:

ЛУННЫЕ ДАННЫЕ:
- Лунный день: ${context.lunarDay}
- Фаза луны: ${context.moonPhase.name} (${context.moonPhase.energy})
- Астрологический знак: ${context.zodiacSign.name} (${context.zodiacSign.element})
- Энергия знака: ${context.zodiacSign.energy}

КОНТЕКСТ ПОЛЬЗОВАТЕЛЯ:
- Уровень подписки: ${context.userProfile.subscriptionType}
- Количество предыдущих обращений: ${context.userProfile.previousReadings}

Создай структурированный ответ на русском языке:

1. ПЕРСОНАЛЬНЫЙ СОВЕТ (2-3 предложения)
2. ДЕТАЛЬНАЯ ИНТЕРПРЕТАЦИЯ энергии дня (4-5 предложений)
3. ПРАКТИЧЕСКИЕ СОВЕТЫ (5-7 конкретных действий)
4. ПРОГНОЗ ЭНЕРГИИ на день (2-3 предложения)
5. СОВЕТЫ ПО ПРОЯВЛЕНИЮ желаний (3-4 совета)
6. ОТНОШЕНИЯ - что важно в общении сегодня (2-3 совета)
7. КАРЬЕРА И ДЕЛА - профессиональные рекомендации (2-3 совета)
8. ЗДОРОВЬЕ И САМОЧУВСТВИЕ (2-3 совета)
9. ДУХОВНЫЕ ПРАКТИКИ (2-3 рекомендации)

Пиши мистически, но практично. Используй астрологическую терминологию, но объясняй простым языком.
`;

    try {
      const response = await aiService.generateText(prompt, {
        temperature: 0.7,
        maxTokens: 1500
      });

      if (!response || typeof response !== 'string') {
        logger.warn('AI service returned invalid response', { response: typeof response });
        return this.getFallbackRecommendations(context);
      }

      return this.parseAIResponse(response);
    } catch (error) {
      logger.error('Error generating AI recommendations', { error: error.message });
      return this.getFallbackRecommendations(context);
    }
  }

  /**
   * Парсинг ответа ИИ
   */
  parseAIResponse(aiResponse) {
    try {
      const sections = aiResponse.split(/\d+\.\s+/);
      
      return {
        personalizedAdvice: this.extractSection(sections, 1) || 'Следуйте энергии луны и доверьтесь интуиции.',
        detailedInterpretation: this.extractSection(sections, 2) || 'Сегодня особое время для внутреннего роста.',
        practicalTips: this.extractListItems(this.extractSection(sections, 3)) || ['Медитируйте утром', 'Планируйте важные дела'],
        energyForecast: this.extractSection(sections, 4) || 'Энергия дня благоприятна для новых начинаний.',
        manifestationAdvice: this.extractListItems(this.extractSection(sections, 5)) || ['Визуализируйте цели', 'Записывайте желания'],
        relationships: this.extractListItems(this.extractSection(sections, 6)) || ['Будьте открыты к общению'],
        career: this.extractListItems(this.extractSection(sections, 7)) || ['Фокусируйтесь на приоритетах'],
        health: this.extractListItems(this.extractSection(sections, 8)) || ['Пейте больше воды'],
        spirituality: this.extractListItems(this.extractSection(sections, 9)) || ['Практикуйте благодарность']
      };
    } catch (error) {
      logger.error('Error parsing AI response', { error: error.message });
      return this.getFallbackRecommendations();
    }
  }

  /**
   * Извлечение секции из ответа
   */
  extractSection(sections, index) {
    if (sections && sections[index]) {
      const section = sections[index].trim();
      if (section) {
        const firstLine = section.split('\n')[0];
        return firstLine || null;
      }
    }
    return null;
  }

  /**
   * Извлечение списка из текста
   */
  extractListItems(text) {
    if (!text) return [];
    
    // Ищем элементы списка (начинающиеся с - или •)
    const listItems = text.match(/[-•]\s*([^\n]+)/g);
    if (listItems) {
      return listItems.map(item => item.replace(/^[-•]\s*/, '').trim());
    }
    
    // Если нет списка, разбиваем по предложениям
    return text.split('.').filter(item => item.trim().length > 10).slice(0, 3);
  }

  /**
   * Fallback рекомендации
   */
  getFallbackRecommendations(context = {}) {
    return {
      personalizedAdvice: 'Следуйте ритмам луны и доверьтесь своей интуиции.',
      detailedInterpretation: 'Сегодня особое время для внутреннего роста и духовного развития.',
      practicalTips: ['Медитируйте утром', 'Планируйте важные дела на первую половину дня', 'Уделите время размышлениям'],
      energyForecast: 'Энергия дня благоприятна для новых начинаний и творческих проектов.',
      manifestationAdvice: ['Визуализируйте ваши цели', 'Записывайте желания и намерения', 'Практикуйте благодарность'],
      relationships: ['Будьте открыты к новым знакомствам', 'Проявляйте эмпатию к близким'],
      career: ['Фокусируйтесь на долгосрочных целях', 'Избегайте конфликтов на работе'],
      health: ['Больше времени проводите на природе', 'Пейте достаточно воды'],
      spirituality: ['Практикуйте медитацию', 'Ведите дневник благодарности']
    };
  }

  /**
   * Расширенный лунный календарь с ИИ
   */
  async getEnhancedLunarCalendar(startDate, endDate, userContext = {}) {
    try {
      const baseCalendar = await this.baseService.getLunarCalendar(startDate, endDate);
      
      // Генерируем ИИ-анализ для ключевых дней
      const enhancedDays = await Promise.all(
        baseCalendar.calendar
          .filter(day => [1, 8, 15, 22].includes(day.lunarDay)) // Только ключевые дни
          .slice(0, 4) // Ограничиваем количество для производительности
          .map(async (day) => {
            const enhanced = await this.getEnhancedDailyRecommendations(new Date(day.date), userContext);
            return {
              ...day,
              enhanced: true,
              aiAdvice: enhanced.personalizedAdvice,
              practicalTips: enhanced.practicalTips?.slice(0, 3) || []
            };
          })
      );

      // Генерируем ИИ-сводку месяца
      const monthlyInsight = await this.generateMonthlyInsight(baseCalendar, userContext);

      return {
        ...baseCalendar,
        aiEnhanced: true,
        enhancedDays,
        monthlyInsight,
        keyRecommendations: this.extractKeyRecommendations(enhancedDays)
      };
    } catch (error) {
      logger.error('Error getting enhanced lunar calendar', { error: error.message });
      return await this.baseService.getLunarCalendar(startDate, endDate);
    }
  }

  /**
   * Генерация ИИ-анализа месяца
   */
  async generateMonthlyInsight(calendarData, userContext) {
    const prompt = `
Создай краткий астрологический прогноз на месяц на основе лунного календаря:

ПЕРИОД: ${calendarData.period.start} - ${calendarData.period.end}
БАЗОВАЯ СВОДКА: ${calendarData.summary}

Напиши 3-4 предложения с ключевыми темами месяца и общими рекомендациями.
Стиль: мистический, но практичный. На русском языке.
`;

    try {
      const response = await aiService.generateText(prompt, {
        temperature: 0.6,
        maxTokens: 300
      });
      return response;
    } catch (error) {
      return 'Этот месяц принесет важные изменения и новые возможности. Следуйте ритмам луны и доверьтесь интуиции.';
    }
  }

  /**
   * Извлечение ключевых рекомендаций
   */
  extractKeyRecommendations(enhancedDays) {
    const allTips = enhancedDays.flatMap(day => day.practicalTips || []);
    // Убираем дубли и берем топ-5
    return [...new Set(allTips)].slice(0, 5);
  }

  /**
   * Лунные ритуалы с ИИ
   */
  async getEnhancedRituals(date = new Date(), userContext = {}) {
    const dayData = await this.getEnhancedDailyRecommendations(date, userContext);
    
    const prompt = `
Создай 3 лунных ритуала для ${dayData.moonPhase.name} (${dayData.lunarDay} лунный день):

ЭНЕРГИЯ ДНЯ: ${dayData.moonPhase.energy}
ЗНАК ЗОДИАКА: ${dayData.zodiacSign.name}

Для каждого ритуала укажи:
1. Название ритуала
2. Время проведения (утро/день/вечер)
3. Что понадобится (2-3 простых предмета)
4. Пошаговые действия (3-4 шага)
5. Аффирмация или молитва

Ритуалы должны быть простыми и доступными для выполнения дома.
`;

    try {
      const response = await aiService.generateText(prompt, {
        temperature: 0.7,
        maxTokens: 800
      });

      return {
        phase: dayData.moonPhase.name,
        energy: dayData.moonPhase.energy,
        rituals: this.parseRitualsResponse(response),
        aiGenerated: true
      };
    } catch (error) {
      return this.getFallbackRituals(dayData);
    }
  }

  /**
   * Парсинг ритуалов
   */
  parseRitualsResponse(response) {
    try {
      // Простой парсинг - можно улучшить
      if (!response || typeof response !== 'string') {
        return this.getFallbackRituals({ moonPhase: { name: 'Текущая фаза', energy: 'Гармония' }}).rituals;
      }
      
      const ritualSections = response.split(/\d+\./);
      const rituals = ritualSections.slice(1, 4).map((section, index) => {
        const trimmed = section.trim();
        return {
          id: index + 1,
          name: `Ритуал ${index + 1}`,
          description: trimmed.split('\n')[0] || 'Лунная медитация',
          time: 'Вечер',
          items: ['Свеча', 'Вода', 'Благовония'],
          steps: trimmed.split('\n').slice(1, 4).filter(step => step.trim()) || ['Зажгите свечу', 'Медитируйте 10 минут'],
          affirmation: 'Я принимаю энергию луны и следую своему пути.'
        };
      });
      
      return rituals.length > 0 ? rituals : this.getFallbackRituals({ moonPhase: { name: 'Текущая фаза', energy: 'Гармония' }}).rituals;
    } catch (error) {
      logger.error('Error parsing rituals response', { error: error.message, response: response?.substring(0, 100) });
      return this.getFallbackRituals({ moonPhase: { name: 'Текущая фаза', energy: 'Гармония' }}).rituals;
    }
  }

  /**
   * Fallback ритуалы
   */
  getFallbackRituals(dayData) {
    const phaseName = dayData?.moonPhase?.name || 'Текущая фаза';
    const energy = dayData?.moonPhase?.energy || 'Гармония и равновесие';
    
    return {
      phase: phaseName,
      energy: energy,
      rituals: [
        {
          id: 1,
          name: 'Лунная медитация',
          description: 'Настройка на энергию луны для внутреннего покоя',
          time: 'Вечер (за час до сна)',
          items: ['Свеча белого или серебристого цвета', 'Удобное место для сидения'],
          steps: [
            'Зажгите свечу и поставьте её перед собой',
            'Сядьте удобно, закройте глаза и расслабьтесь',
            'Дышите медленно и глубоко 5-7 раз',
            'Представьте лунный свет, наполняющий ваше тело',
            'Почувствуйте связь с лунной энергией',
            'Медитируйте 10-15 минут в тишине'
          ],
          affirmation: 'Я принимаю мудрость луны и следую своей интуиции.'
        },
        {
          id: 2,
          name: 'Очищение водой',
          description: 'Энергетическое очищение под лунным светом',
          time: 'Вечер',
          items: ['Стакан чистой воды', 'Окно с видом на луну'],
          steps: [
            'Налейте чистую воду в прозрачный стакан',
            'Поставьте стакан на подоконник на 30 минут',
            'Возьмите стакан и подумайте о своих намерениях',
            'Медленно выпейте воду, представляя очищение'
          ],
          affirmation: 'Лунная вода очищает моё тело и душу от негатива.'
        },
        {
          id: 3,
          name: 'Благодарность луне',
          description: 'Ритуал благодарности за прошедший день',
          time: 'Перед сном',
          items: ['Только ваши мысли и чувства'],
          steps: [
            'Выйдите на балкон или подойдите к окну',
            'Посмотрите на луну или в её направлении',
            'Мысленно поблагодарите за прошедший день',
            'Попросите защиты и мудрости на завтра',
            'Отправьте луне свою любовь и благодарность'
          ],
          affirmation: 'Благодарю луну за её мудрость и защиту.'
        }
      ],
      aiGenerated: false
    };
  }
}

module.exports = new EnhancedLunarService();