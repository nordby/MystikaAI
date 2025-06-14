// server/src/services/numerologyService.js
const logger = require('../utils/logger');
const aiService = require('./aiService');

class NumerologyService {
  constructor() {
    this.aiService = aiService;
    this.numberMeanings = {
      1: {
        name: 'Единица',
        keywords: ['лидерство', 'независимость', 'инициатива', 'новые начинания'],
        description: 'Число лидеров и пионеров. Символизирует независимость, оригинальность и стремление к достижениям.',
        positive: ['лидерские качества', 'самостоятельность', 'творческий потенциал', 'решительность'],
        negative: ['эгоизм', 'упрямство', 'нетерпимость', 'агрессивность'],
        career: ['руководитель', 'предприниматель', 'изобретатель', 'художник'],
        relationships: 'Нужен партнер, который будет поддерживать ваши амбиции, но не конкурировать с вами.'
      },
      2: {
        name: 'Двойка',
        keywords: ['сотрудничество', 'дипломатия', 'партнерство', 'гармония'],
        description: 'Число партнерства и сотрудничества. Символизирует дипломатию, чувствительность и стремление к гармонии.',
        positive: ['дипломатичность', 'чувствительность', 'терпение', 'миротворчество'],
        negative: ['нерешительность', 'зависимость', 'излишняя чувствительность', 'пассивность'],
        career: ['дипломат', 'психолог', 'медиатор', 'социальный работник'],
        relationships: 'Вы прирожденный партнер, ищущий глубокие эмоциональные связи и взаимопонимание.'
      },
      3: {
        name: 'Тройка',
        keywords: ['творчество', 'общение', 'оптимизм', 'самовыражение'],
        description: 'Число творчества и самовыражения. Символизирует артистизм, общительность и жизнерадостность.',
        positive: ['креативность', 'коммуникабельность', 'оптимизм', 'вдохновение'],
        negative: ['поверхностность', 'рассеянность', 'неорганизованность', 'критичность'],
        career: ['актер', 'писатель', 'учитель', 'журналист'],
        relationships: 'Вам нужен партнер, который разделяет вашу любовь к жизни и творчеству.'
      },
      4: {
        name: 'Четверка',
        keywords: ['стабильность', 'практичность', 'трудолюбие', 'надежность'],
        description: 'Число стабильности и порядка. Символизирует практичность, методичность и преданность.',
        positive: ['надежность', 'организованность', 'практичность', 'упорство'],
        negative: ['консерватизм', 'негибкость', 'скучность', 'ограниченность'],
        career: ['бухгалтер', 'инженер', 'строитель', 'администратор'],
        relationships: 'Вы ищете стабильные, долгосрочные отношения, основанные на доверии и преданности.'
      },
      5: {
        name: 'Пятерка',
        keywords: ['свобода', 'приключения', 'изменения', 'любознательность'],
        description: 'Число свободы и приключений. Символизирует любознательность, адаптабельность и стремление к переменам.',
        positive: ['адаптабельность', 'любознательность', 'энтузиазм', 'свободолюбие'],
        negative: ['непостоянство', 'безответственность', 'импульсивность', 'беспокойство'],
        career: ['путешественник', 'журналист', 'торговый представитель', 'исследователь'],
        relationships: 'Вам нужна свобода в отношениях и партнер, готовый к приключениям и переменам.'
      },
      6: {
        name: 'Шестерка',
        keywords: ['забота', 'ответственность', 'семья', 'служение'],
        description: 'Число заботы и ответственности. Символизирует любовь к семье, желание помогать и защищать.',
        positive: ['заботливость', 'ответственность', 'сострадание', 'верность'],
        negative: ['навязчивость', 'мученичество', 'беспокойство', 'критичность'],
        career: ['врач', 'учитель', 'социальный работник', 'консультант'],
        relationships: 'Семья и близкие отношения для вас приоритет. Вы прирожденный опекун и защитник.'
      },
      7: {
        name: 'Семерка',
        keywords: ['духовность', 'мудрость', 'анализ', 'интуиция'],
        description: 'Число мудрости и духовности. Символизирует глубокие размышления, интуицию и стремление к истине.',
        positive: ['мудрость', 'интуиция', 'аналитический ум', 'духовность'],
        negative: ['замкнутость', 'критичность', 'перфекционизм', 'отчужденность'],
        career: ['исследователь', 'философ', 'аналитик', 'духовный наставник'],
        relationships: 'Вам нужен интеллектуальный и духовно развитый партнер, способный к глубоким беседам.'
      },
      8: {
        name: 'Восьмерка',
        keywords: ['материальный успех', 'власть', 'амбиции', 'достижения'],
        description: 'Число материального успеха и власти. Символизирует амбиции, организаторские способности и стремление к достижениям.',
        positive: ['амбициозность', 'организаторские способности', 'практичность', 'целеустремленность'],
        negative: ['материализм', 'жестокость', 'диктаторство', 'нетерпимость'],
        career: ['руководитель', 'финансист', 'предприниматель', 'политик'],
        relationships: 'Вы ищете партнера, который поддержит ваши амбиции и разделит стремление к успеху.'
      },
      9: {
        name: 'Девятка',
        keywords: ['универсальность', 'сострадание', 'мудрость', 'служение человечеству'],
        description: 'Число завершения и мудрости. Символизирует сострадание, альтруизм и стремление служить человечеству.',
        positive: ['сострадание', 'мудрость', 'щедрость', 'альтруизм'],
        negative: ['эмоциональность', 'импульсивность', 'нетерпимость', 'эгоцентризм'],
        career: ['филантроп', 'художник', 'целитель', 'общественный деятель'],
        relationships: 'Вы ищете глубокие, духовные связи и готовы отдавать больше, чем получать.'
      },
      11: {
        name: 'Мастер-число 11',
        keywords: ['интуиция', 'вдохновение', 'духовное просветление', 'идеализм'],
        description: 'Мастер-число интуиции и вдохновения. Символизирует высокую чувствительность и духовные способности.',
        positive: ['интуиция', 'вдохновение', 'идеализм', 'духовность'],
        negative: ['нервозность', 'фанатизм', 'нереалистичность', 'крайности'],
        career: ['духовный учитель', 'психолог', 'художник', 'изобретатель'],
        relationships: 'Вам нужен духовно развитый партнер, способный понять вашу чувствительную натуру.'
      },
      22: {
        name: 'Мастер-число 22',
        keywords: ['материализация', 'строительство', 'практический идеализм', 'видение'],
        description: 'Мастер-число практического идеализма. Символизирует способность воплощать великие идеи в реальность.',
        positive: ['практический идеализм', 'организаторские способности', 'видение', 'созидание'],
        negative: ['внутреннее напряжение', 'самокритичность', 'перфекционизм', 'давление'],
        career: ['архитектор', 'инженер', 'общественный лидер', 'реформатор'],
        relationships: 'Вы ищете партнера, который разделяет ваши высокие идеалы и поддерживает ваши масштабные планы.'
      },
      33: {
        name: 'Мастер-число 33',
        keywords: ['мастер-учитель', 'сострадание', 'исцеление', 'служение'],
        description: 'Мастер-число сострадания и служения. Символизирует высшую форму любви и самопожертвования.',
        positive: ['безусловная любовь', 'сострадание', 'мудрость', 'исцеление'],
        negative: ['мученичество', 'эмоциональные перегрузки', 'жертвенность', 'истощение'],
        career: ['целитель', 'духовный учитель', 'гуманитарный работник', 'консультант'],
        relationships: 'Ваши отношения основаны на безусловной любви и взаимном духовном росте.'
      }
    };
  }

  /**
   * Вычисление числа жизненного пути
   */
  calculateLifePath(birthDate) {
    try {
      const date = new Date(birthDate);
      if (isNaN(date.getTime())) {
        throw new Error('Некорректная дата рождения');
      }

      const day = date.getDate();
      const month = date.getMonth() + 1;
      const year = date.getFullYear();

      let sum = this.reduceToSingleDigit(day) + 
                this.reduceToSingleDigit(month) + 
                this.reduceToSingleDigit(year);

      return this.reduceToSingleDigitWithMaster(sum);

    } catch (error) {
      logger.error('Error calculating life path', { error: error.message, birthDate });
      throw error;
    }
  }

  /**
   * Вычисление числа судьбы (полное имя)
   */
  calculateDestinyNumber(fullName) {
    try {
      const letterValues = {
        'а': 1, 'б': 2, 'в': 3, 'г': 4, 'д': 5, 'е': 6, 'ё': 6, 'ж': 7, 'з': 8, 'и': 9,
        'й': 1, 'к': 2, 'л': 3, 'м': 4, 'н': 5, 'о': 6, 'п': 7, 'р': 8, 'с': 9, 'т': 1,
        'у': 2, 'ф': 3, 'х': 4, 'ц': 5, 'ч': 6, 'ш': 7, 'щ': 8, 'ъ': 9, 'ы': 1, 'ь': 2,
        'э': 3, 'ю': 4, 'я': 5,
        'a': 1, 'b': 2, 'c': 3, 'd': 4, 'e': 5, 'f': 6, 'g': 7, 'h': 8, 'i': 9,
        'j': 1, 'k': 2, 'l': 3, 'm': 4, 'n': 5, 'o': 6, 'p': 7, 'q': 8, 'r': 9,
        's': 1, 't': 2, 'u': 3, 'v': 4, 'w': 5, 'x': 6, 'y': 7, 'z': 8
      };

      let sum = 0;
      const name = fullName.toLowerCase().replace(/[^а-яёa-z]/g, '');

      for (let char of name) {
        if (letterValues[char]) {
          sum += letterValues[char];
        }
      }

      return this.reduceToSingleDigitWithMaster(sum);

    } catch (error) {
      logger.error('Error calculating destiny number', { error: error.message, fullName });
      throw error;
    }
  }

  /**
   * Вычисление числа души (день рождения)
   */
  calculateSoulNumber(birthDate) {
    try {
      const date = new Date(birthDate);
      if (isNaN(date.getTime())) {
        throw new Error('Некорректная дата рождения');
      }

      const day = date.getDate();
      return this.reduceToSingleDigitWithMaster(day);

    } catch (error) {
      logger.error('Error calculating soul number', { error: error.message, birthDate });
      throw error;
    }
  }

  /**
   * Вычисление числа личности (согласные в имени)
   */
  calculatePersonalityNumber(fullName) {
    try {
      const consonants = 'бвгджзйклмнпрстфхцчшщъьbcdfghjklmnpqrstvwxyz';
      const letterValues = {
        'б': 2, 'в': 3, 'г': 4, 'д': 5, 'ж': 7, 'з': 8, 'й': 1, 'к': 2, 'л': 3, 'м': 4,
        'н': 5, 'п': 7, 'р': 8, 'с': 9, 'т': 1, 'ф': 3, 'х': 4, 'ц': 5, 'ч': 6, 'ш': 7,
        'щ': 8, 'ъ': 9, 'ь': 2,
        'b': 2, 'c': 3, 'd': 4, 'f': 6, 'g': 7, 'h': 8, 'j': 1, 'k': 2, 'l': 3, 'm': 4,
        'n': 5, 'p': 7, 'q': 8, 'r': 9, 's': 1, 't': 2, 'v': 4, 'w': 5, 'x': 6, 'y': 7, 'z': 8
      };

      let sum = 0;
      const name = fullName.toLowerCase();

      for (let char of name) {
        if (consonants.includes(char) && letterValues[char]) {
          sum += letterValues[char];
        }
      }

      return this.reduceToSingleDigitWithMaster(sum);

    } catch (error) {
      logger.error('Error calculating personality number', { error: error.message, fullName });
      throw error;
    }
  }

  /**
   * Анализ совместимости по числам с ИИ-улучшением
   */
  async calculateCompatibility(number1, number2, name1 = '', name2 = '') {
    try {
      const compatibilityMatrix = {
        1: { high: [1, 5, 7], medium: [3, 9], low: [2, 4, 6, 8] },
        2: { high: [2, 4, 8], medium: [1, 6], low: [3, 5, 7, 9] },
        3: { high: [3, 6, 9], medium: [1, 5], low: [2, 4, 7, 8] },
        4: { high: [2, 4, 8], medium: [6, 7], low: [1, 3, 5, 9] },
        5: { high: [1, 5, 9], medium: [3, 7], low: [2, 4, 6, 8] },
        6: { high: [3, 6, 9], medium: [2, 4, 8], low: [1, 5, 7] },
        7: { high: [4, 7], medium: [1, 5], low: [2, 3, 6, 8, 9] },
        8: { high: [2, 4, 8], medium: [6], low: [1, 3, 5, 7, 9] },
        9: { high: [3, 6, 9], medium: [1, 5], low: [2, 4, 7, 8] }
      };

      const matrix = compatibilityMatrix[number1] || compatibilityMatrix[number1 % 9] || compatibilityMatrix[9];
      
      let compatibility;
      if (matrix.high.includes(number2)) {
        compatibility = 'high';
      } else if (matrix.medium.includes(number2)) {
        compatibility = 'medium';
      } else {
        compatibility = 'low';
      }

      const basicDescriptions = {
        high: 'Отличная совместимость! Ваши числа гармонично дополняют друг друга.',
        medium: 'Хорошая совместимость. Возможны некоторые различия, но они преодолимы.',
        low: 'Сложная совместимость. Потребуется больше усилий для понимания друг друга.'
      };

      // Расширенный базовый результат с fallback анализом
      const enhancedFallback = this.getEnhancedCompatibilityFallback(
        number1, 
        number2, 
        name1 || 'Пользователь', 
        name2 || 'Партнер', 
        compatibility, 
        compatibility === 'high' ? 85 : compatibility === 'medium' ? 65 : 35
      );

      const baseResult = {
        level: compatibility,
        percentage: compatibility === 'high' ? 85 : compatibility === 'medium' ? 65 : 35,
        description: enhancedFallback.description,
        advice: enhancedFallback.advice,
        detailedAnalysis: enhancedFallback.detailedAnalysis,
        strengths: enhancedFallback.strengths,
        challenges: enhancedFallback.challenges,
        recommendations: enhancedFallback.recommendations,
        aiEnhanced: false
      };

      // Попытка получить ИИ-анализ совместимости
      console.log('🔍 Проверка условий для ИИ-анализа совместимости:', {
        hasAiService: !!this.aiService,
        hasClaudeKey: !!(this.aiService && this.aiService.claudeApiKey),
        name1: name1 || 'не указано',
        name2: name2 || 'не указано'
      });

      if (this.aiService && this.aiService.claudeApiKey) {
        // Используем fallback имена если они не переданы
        const effectiveName1 = name1 || 'Пользователь';
        const effectiveName2 = name2 || 'Партнер';
        
        try {
          console.log('🚀 Запуск ИИ-анализа совместимости...');
          const aiCompatibility = await this.generateAICompatibilityAnalysis({
            number1,
            number2,
            name1: effectiveName1,
            name2: effectiveName2,
            basicLevel: compatibility,
            basicPercentage: baseResult.percentage
          });

          if (aiCompatibility) {
            console.log('✅ ИИ-анализ совместимости получен:', {
              hasDetailedAnalysis: !!aiCompatibility.detailedAnalysis,
              strengthsCount: aiCompatibility.strengths?.length || 0,
              challengesCount: aiCompatibility.challenges?.length || 0
            });
            
            return {
              ...baseResult,
              description: aiCompatibility.description || baseResult.description,
              advice: aiCompatibility.advice || baseResult.advice,
              detailedAnalysis: aiCompatibility.detailedAnalysis,
              challenges: aiCompatibility.challenges,
              strengths: aiCompatibility.strengths,
              recommendations: aiCompatibility.recommendations,
              aiEnhanced: true
            };
          }
        } catch (error) {
          console.error('❌ ИИ-анализ совместимости не удался:', error.message);
          logger.warn('AI compatibility analysis failed, using fallback', { error: error.message });
        }
      } else {
        console.log('⚠️ ИИ недоступен для анализа совместимости');
      }

      return baseResult;

    } catch (error) {
      logger.error('Error calculating compatibility', { error: error.message, number1, number2 });
      throw error;
    }
  }

  /**
   * Расширенный анализ совместимости для Premium
   */
  async calculateAdvancedCompatibility(person1, person2) {
    try {
      const { birthDate: date1, name: name1 } = person1;
      const { birthDate: date2, name: name2 } = person2;

      // Базовая совместимость
      const lifePath1 = this.calculateLifePath(date1);
      const lifePath2 = this.calculateLifePath(date2);
      const baseCompatibility = await this.calculateCompatibility(lifePath1, lifePath2);

      // Дополнительные числа для расширенного анализа
      const destiny1 = this.calculateDestinyNumber(name1);
      const destiny2 = this.calculateDestinyNumber(name2);
      const soul1 = this.calculateSoulNumber(date1);
      const soul2 = this.calculateSoulNumber(date2);

      // Совместимость по числам судьбы
      const destinyCompatibility = await this.calculateCompatibility(destiny1, destiny2);
      
      // Совместимость душ
      const soulCompatibility = await this.calculateCompatibility(soul1, soul2);

      // Общий результат
      const overallPercentage = Math.round(
        (baseCompatibility.percentage + destinyCompatibility.percentage + soulCompatibility.percentage) / 3
      );

      return {
        overall: {
          percentage: overallPercentage,
          level: this.getCompatibilityLevel(overallPercentage),
          description: `Общая совместимость ${overallPercentage}% - ${this.getCompatibilityLevel(overallPercentage)}`
        },
        lifePath: baseCompatibility,
        destiny: destinyCompatibility,
        soul: soulCompatibility,
        recommendations: this.generateCompatibilityRecommendations(overallPercentage),
        person1: {
          lifePath: lifePath1,
          destiny: destiny1,
          soul: soul1
        },
        person2: {
          lifePath: lifePath2,
          destiny: destiny2,
          soul: soul2
        }
      };

    } catch (error) {
      logger.error('Error in advanced compatibility calculation', { error: error.message });
      throw error;
    }
  }

  /**
   * Анализ имени для Premium
   */
  async analyzeNameNumerology(fullName) {
    try {
      const destiny = this.calculateDestinyNumber(fullName);
      const vowels = this.calculateVowelNumber(fullName);
      const consonants = this.calculateConsonantNumber(fullName);

      const analysis = {
        destiny: {
          number: destiny,
          meaning: this.getNumberMeaning(destiny),
          description: 'Число судьбы показывает вашу жизненную миссию и цель'
        },
        vowels: {
          number: vowels,
          meaning: this.getNumberMeaning(vowels),
          description: 'Число гласных раскрывает ваши внутренние желания и мотивы'
        },
        consonants: {
          number: consonants,
          meaning: this.getNumberMeaning(consonants),
          description: 'Число согласных показывает, как вас воспринимают окружающие'
        },
        recommendations: this.generateNameRecommendations(destiny, vowels, consonants)
      };

      // Добавляем ИИ-анализ если доступен
      if (this.aiService && typeof this.aiService.analyzeNameNumerology === 'function') {
        try {
          const aiAnalysis = await this.aiService.analyzeNameNumerology(fullName, analysis);
          if (aiAnalysis) {
            analysis.aiInsights = aiAnalysis;
            analysis.aiEnhanced = true;
          }
        } catch (error) {
          logger.warn('AI name analysis failed', { error: error.message });
        }
      }

      return analysis;

    } catch (error) {
      logger.error('Error in name analysis', { error: error.message, fullName });
      throw error;
    }
  }

  /**
   * Персональный год для Premium
   */
  calculatePersonalYear(birthDate, targetYear = new Date().getFullYear()) {
    try {
      const date = new Date(birthDate);
      const month = date.getMonth() + 1;
      const day = date.getDate();

      const sum = this.reduceToSingleDigit(month) + 
                  this.reduceToSingleDigit(day) + 
                  this.reduceToSingleDigit(targetYear);

      return this.reduceToSingleDigit(sum);

    } catch (error) {
      logger.error('Error calculating personal year', { error: error.message, birthDate, targetYear });
      throw error;
    }
  }

  /**
   * Кармические уроки для Premium Plus
   */
  calculateKarmicLessons(fullName, birthDate) {
    try {
      const nameNumbers = this.getNameNumbers(fullName);
      const missingNumbers = [];
      
      // Находим отсутствующие числа от 1 до 9
      for (let i = 1; i <= 9; i++) {
        if (!nameNumbers.includes(i)) {
          missingNumbers.push(i);
        }
      }

      const karmicLessons = missingNumbers.map(number => ({
        number,
        lesson: this.getKarmicLesson(number),
        challenge: this.getKarmicChallenge(number),
        solution: this.getKarmicSolution(number)
      }));

      return {
        missingNumbers,
        lessons: karmicLessons,
        totalLessons: karmicLessons.length,
        description: `У вас ${karmicLessons.length} кармических урока для проработки`
      };

    } catch (error) {
      logger.error('Error calculating karmic lessons', { error: error.message });
      throw error;
    }
  }

  /**
   * Персональный нумерологический прогноз
   */
  async generatePersonalForecast(birthDate, currentDate = new Date()) {
    // Убеждаемся, что работаем с правильной датой
    if (!currentDate || isNaN(currentDate.getTime())) {
      currentDate = new Date();
    }
    try {
      const lifePath = this.calculateLifePath(birthDate);
      const personalYear = this.calculatePersonalYear(birthDate, currentDate);
      const personalMonth = this.calculatePersonalMonth(birthDate, currentDate);
      const personalDay = this.calculatePersonalDay(birthDate, currentDate);

      // Попытка получить ИИ-прогноз
      let aiForecast = null;
      if (this.aiService && this.aiService.claudeApiKey) {
        try {
          aiForecast = await this.generateAIForecast({
            lifePath,
            personalYear,
            personalMonth,
            personalDay,
            birthDate,
            currentDate
          });
        } catch (error) {
          logger.warn('AI forecast failed, using fallback', { error: error.message });
        }
      }

      const currentYear = currentDate.getFullYear();
      
      console.log('📊 Генерация прогноза:', {
        currentDate: currentDate.toISOString(),
        currentYear,
        personalYear,
        personalMonth,
        personalDay
      });
      
      return {
        lifePath: {
          number: lifePath,
          meaning: this.numberMeanings[lifePath]
        },
        personalYear: {
          number: personalYear,
          year: currentYear,
          meaning: this.getPersonalYearMeaning(personalYear),
          description: aiForecast?.yearDescription || this.getPersonalYearMeaning(personalYear)
        },
        yearThemes: aiForecast?.yearThemes || ['Основная тема года'],
        yearAdvice: aiForecast?.yearAdvice || this.generateAdvice(lifePath, personalYear, personalMonth, personalDay),
        personalMonth: {
          number: personalMonth,
          meaning: this.getPersonalPeriodMeaning(personalMonth),
          period: currentDate.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' })
        },
        personalDay: {
          number: personalDay,
          meaning: this.getPersonalPeriodMeaning(personalDay),
          period: currentDate.toLocaleDateString('ru-RU')
        },
        advice: aiForecast?.advice || this.generateAdvice(lifePath, personalYear, personalMonth, personalDay),
        aiEnhanced: aiForecast ? true : false
      };

    } catch (error) {
      logger.error('Error generating personal forecast', { error: error.message, birthDate });
      throw error;
    }
  }

  /**
   * Полный нумерологический анализ
   */
  async generateFullAnalysis(birthDate, fullName) {
    try {
      const lifePath = this.calculateLifePath(birthDate);
      const destiny = this.calculateDestinyNumber(fullName);
      const soul = this.calculateSoulNumber(birthDate);
      const personality = this.calculatePersonalityNumber(fullName);

      // Попытка получить ИИ-анализ
      let aiAnalysis = null;
      console.log('🔍 Checking AI service availability:', {
        hasAiService: !!this.aiService,
        hasClaudeKey: !!this.aiService?.claudeApiKey,
        claudeKeyLength: this.aiService?.claudeApiKey?.length
      });
      
      if (this.aiService && this.aiService.claudeApiKey) {
        try {
          console.log('🚀 Attempting AI analysis for numerology...');
          aiAnalysis = await this.generateAIAnalysis({
            lifePath,
            destiny,
            soul,
            personality,
            birthDate,
            fullName
          });
          console.log('✅ AI analysis completed:', { hasResult: !!aiAnalysis });
        } catch (error) {
          console.error('❌ AI analysis failed:', error.message);
          logger.warn('AI analysis failed, using fallback', { error: error.message });
        }
      } else {
        console.log('❌ AI service not available - Claude API key missing');
      }

      const analysis = {
        lifePath: {
          number: lifePath,
          meaning: this.numberMeanings[lifePath],
          description: aiAnalysis?.lifePath?.description || 'Ваш жизненный путь и основные уроки',
          aiInsight: aiAnalysis?.lifePath?.insight
        },
        destiny: {
          number: destiny,
          meaning: this.numberMeanings[destiny],
          description: aiAnalysis?.destiny?.description || 'Ваше предназначение и потенциал',
          aiInsight: aiAnalysis?.destiny?.insight
        },
        soul: {
          number: soul,
          meaning: this.numberMeanings[soul],
          description: aiAnalysis?.soul?.description || 'Ваши внутренние желания и мотивации',
          aiInsight: aiAnalysis?.soul?.insight
        },
        personality: {
          number: personality,
          meaning: this.numberMeanings[personality],
          description: aiAnalysis?.personality?.description || 'Как вас воспринимают окружающие',
          aiInsight: aiAnalysis?.personality?.insight
        },
        summary: aiAnalysis?.summary || this.generateSummary(lifePath, destiny, soul, personality),
        recommendations: aiAnalysis?.recommendations || this.generateRecommendations(lifePath, destiny, soul, personality),
        aiEnhanced: aiAnalysis ? true : false
      };

      return analysis;

    } catch (error) {
      logger.error('Error generating full analysis', { error: error.message, birthDate, fullName });
      throw error;
    }
  }

  /**
   * Приведение к однозначному числу
   */
  reduceToSingleDigit(number) {
    while (number > 9) {
      number = number.toString().split('').reduce((sum, digit) => sum + parseInt(digit), 0);
    }
    return number;
  }

  /**
   * Приведение к однозначному числу с учетом мастер-чисел
   */
  reduceToSingleDigitWithMaster(number) {
    while (number > 9) {
      // Сохраняем мастер-числа
      if (number === 11 || number === 22 || number === 33) {
        return number;
      }
      number = number.toString().split('').reduce((sum, digit) => sum + parseInt(digit), 0);
    }
    return number;
  }

  /**
   * Вычисление персонального года
   */
  calculatePersonalYear(birthDate, currentDate) {
    const birth = new Date(birthDate);
    const day = birth.getDate();
    const month = birth.getMonth() + 1;
    const year = currentDate.getFullYear();

    const sum = this.reduceToSingleDigit(day) + 
                this.reduceToSingleDigit(month) + 
                this.reduceToSingleDigit(year);

    return this.reduceToSingleDigitWithMaster(sum);
  }

  /**
   * Вычисление персонального месяца
   */
  calculatePersonalMonth(birthDate, currentDate) {
    const personalYear = this.calculatePersonalYear(birthDate, currentDate);
    const currentMonth = currentDate.getMonth() + 1;
    
    const sum = personalYear + this.reduceToSingleDigit(currentMonth);
    return this.reduceToSingleDigitWithMaster(sum);
  }

  /**
   * Вычисление персонального дня
   */
  calculatePersonalDay(birthDate, currentDate) {
    const personalMonth = this.calculatePersonalMonth(birthDate, currentDate);
    const currentDay = currentDate.getDate();
    
    const sum = personalMonth + this.reduceToSingleDigit(currentDay);
    return this.reduceToSingleDigitWithMaster(sum);
  }

  /**
   * Получение значения персонального года
   */
  getPersonalYearMeaning(number) {
    const yearMeanings = {
      1: 'Год новых начинаний и возможностей',
      2: 'Год сотрудничества и партнерства',
      3: 'Год творчества и самовыражения',
      4: 'Год упорной работы и создания основ',
      5: 'Год перемен и новых возможностей',
      6: 'Год семьи и ответственности',
      7: 'Год духовного развития и самопознания',
      8: 'Год материальных достижений и признания',
      9: 'Год завершения циклов и подведения итогов'
    };

    return yearMeanings[number] || yearMeanings[number % 9] || 'Особое значение года';
  }

  /**
   * Получение значения персонального периода
   */
  getPersonalPeriodMeaning(number) {
    const periodMeanings = {
      1: 'Время для инициативы и лидерства',
      2: 'Время для терпения и сотрудничества',
      3: 'Время для творчества и общения',
      4: 'Время для работы и организации',
      5: 'Время для приключений и изменений',
      6: 'Время для заботы о близких',
      7: 'Время для размышлений и духовности',
      8: 'Время для бизнеса и достижений',
      9: 'Время для завершения дел и отдыха'
    };

    return periodMeanings[number] || periodMeanings[number % 9] || 'Особое время';
  }

  /**
   * Генерация советов по совместимости
   */
  getCompatibilityAdvice(number1, number2, level) {
    const advice = {
      high: [
        'Развивайте общие интересы и цели',
        'Поддерживайте открытое общение',
        'Цените различия как дополнения'
      ],
      medium: [
        'Работайте над пониманием различий',
        'Находите компромиссы в сложных ситуациях',
        'Развивайте терпение и эмпатию'
      ],
      low: [
        'Фокусируйтесь на общих ценностях',
        'Учитесь принимать различия',
        'Уделяйте больше времени общению'
      ]
    };

    return advice[level] || advice.medium;
  }

  /**
   * Генерация общих советов
   */
  generateAdvice(lifePath, personalYear, personalMonth, personalDay) {
    return [
      `Ваше число жизненного пути ${lifePath} указывает на важность развития ${this.numberMeanings[lifePath]?.keywords[0]}`,
      `Персональный год ${personalYear}: ${this.getPersonalYearMeaning(personalYear)}`,
      `В этом месяце (${personalMonth}): ${this.getPersonalPeriodMeaning(personalMonth)}`,
      `Сегодня (${personalDay}): ${this.getPersonalPeriodMeaning(personalDay)}`
    ];
  }

  /**
   * Генерация краткого резюме
   */
  generateSummary(lifePath, destiny, soul, personality) {
    return `Вы - человек с числом жизненного пути ${lifePath}, что делает вас ${this.numberMeanings[lifePath]?.keywords[0]}. ` +
           `Ваше предназначение (${destiny}) связано с ${this.numberMeanings[destiny]?.keywords[0]}, ` +
           `внутренне вас мотивирует ${this.numberMeanings[soul]?.keywords[0]} (${soul}), ` +
           `а окружающие видят в вас ${this.numberMeanings[personality]?.keywords[0]} (${personality}).`;
  }

  /**
   * Генерация персональных рекомендаций
   */
  generateRecommendations(lifePath, destiny, soul, personality) {
    const recommendations = [];

    // Рекомендации по жизненному пути
    const lifePathMeaning = this.numberMeanings[lifePath];
    if (lifePathMeaning) {
      recommendations.push({
        area: 'Жизненный путь',
        advice: `Развивайте ${lifePathMeaning.keywords.join(', ')}. ${lifePathMeaning.career[0]} может быть вашим призванием.`
      });
    }

    // Рекомендации по числу судьбы
    const destinyMeaning = this.numberMeanings[destiny];
    if (destinyMeaning) {
      recommendations.push({
        area: 'Предназначение',
        advice: `Ваш потенциал раскроется через ${destinyMeaning.keywords[0]}. Рассмотрите карьеру в области: ${destinyMeaning.career.join(', ')}.`
      });
    }

    // Рекомендации по отношениям
    const soulMeaning = this.numberMeanings[soul];
    if (soulMeaning) {
      recommendations.push({
        area: 'Отношения',
        advice: soulMeaning.relationships
      });
    }

    return recommendations;
  }

  /**
   * Вычисление числа по имени (используется для анализа имени)
   */
  calculateNameNumber(name) {
    try {
      return this.calculateDestinyNumber(name);
    } catch (error) {
      logger.error('Error calculating name number', { error: error.message, name });
      throw error;
    }
  }

  // Вспомогательные методы для расширенной нумерологии

  /**
   * Вычисление числа гласных
   */
  calculateVowelNumber(fullName) {
    const vowels = 'аеёиоуыэюяaeiouy';
    let sum = 0;
    const name = fullName.toLowerCase();

    for (let char of name) {
      if (vowels.includes(char)) {
        sum += this.getLetterValue(char);
      }
    }

    return this.reduceToSingleDigitWithMaster(sum);
  }

  /**
   * Вычисление числа согласных
   */
  calculateConsonantNumber(fullName) {
    const vowels = 'аеёиоуыэюяaeiouy ';
    let sum = 0;
    const name = fullName.toLowerCase();

    for (let char of name) {
      if (!vowels.includes(char) && this.getLetterValue(char) > 0) {
        sum += this.getLetterValue(char);
      }
    }

    return this.reduceToSingleDigitWithMaster(sum);
  }

  /**
   * Получение всех чисел в имени
   */
  getNameNumbers(fullName) {
    const numbers = new Set();
    const name = fullName.toLowerCase().replace(/[^а-яёa-z]/g, '');

    for (let char of name) {
      const value = this.getLetterValue(char);
      if (value > 0) {
        numbers.add(value);
      }
    }

    return Array.from(numbers);
  }

  /**
   * Получение значения буквы
   */
  getLetterValue(char) {
    const letterValues = {
      'а': 1, 'б': 2, 'в': 3, 'г': 4, 'д': 5, 'е': 6, 'ё': 6, 'ж': 7, 'з': 8, 'и': 9,
      'й': 1, 'к': 2, 'л': 3, 'м': 4, 'н': 5, 'о': 6, 'п': 7, 'р': 8, 'с': 9, 'т': 1,
      'у': 2, 'ф': 3, 'х': 4, 'ц': 5, 'ч': 6, 'ш': 7, 'щ': 8, 'ъ': 9, 'ы': 1, 'ь': 2,
      'э': 3, 'ю': 4, 'я': 5,
      'a': 1, 'b': 2, 'c': 3, 'd': 4, 'e': 5, 'f': 6, 'g': 7, 'h': 8, 'i': 9,
      'j': 1, 'k': 2, 'l': 3, 'm': 4, 'n': 5, 'o': 6, 'p': 7, 'q': 8, 'r': 9,
      's': 1, 't': 2, 'u': 3, 'v': 4, 'w': 5, 'x': 6, 'y': 7, 'z': 8
    };
    return letterValues[char] || 0;
  }

  /**
   * Генерация рекомендаций для анализа имени
   */
  generateNameRecommendations(destiny, vowels, consonants) {
    const recommendations = [];

    recommendations.push(`Ваше число судьбы ${destiny} указывает на ${this.getNumberMeaning(destiny).keywords.join(', ')}`);
    recommendations.push(`Внутренние желания (${vowels}) направлены на ${this.getNumberMeaning(vowels).keywords[0]}`);
    recommendations.push(`Окружающие видят в вас ${this.getNumberMeaning(consonants).keywords.join(' и ')}`);

    return recommendations;
  }

  /**
   * Получение кармического урока
   */
  getKarmicLesson(number) {
    const lessons = {
      1: 'Развитие лидерских качеств и независимости',
      2: 'Обучение сотрудничеству и дипломатии',
      3: 'Развитие творческого самовыражения',
      4: 'Формирование дисциплины и практичности',
      5: 'Принятие перемен и свободы',
      6: 'Развитие заботы и ответственности',
      7: 'Поиск духовной мудрости и знаний',
      8: 'Балансирование материального и духовного',
      9: 'Служение человечеству и развитие сострадания'
    };
    return lessons[number] || 'Универсальное развитие';
  }

  /**
   * Получение кармического вызова
   */
  getKarmicChallenge(number) {
    const challenges = {
      1: 'Преодоление эгоизма и упрямства',
      2: 'Избегание чрезмерной зависимости',
      3: 'Контроль рассеянности и поверхностности',
      4: 'Преодоление негибкости и консерватизма',
      5: 'Борьба с непостоянством и безответственностью',
      6: 'Избегание навязчивости и критичности',
      7: 'Преодоление замкнутости и отчужденности',
      8: 'Балансирование амбиций и человечности',
      9: 'Контроль эмоциональности и импульсивности'
    };
    return challenges[number] || 'Поиск гармонии';
  }

  /**
   * Получение решения кармического урока
   */
  getKarmicSolution(number) {
    const solutions = {
      1: 'Практикуйте умеренное лидерство и помощь другим',
      2: 'Развивайте здоровые границы в отношениях',
      3: 'Фокусируйтесь на глубоком творческом развитии',
      4: 'Добавьте гибкость в свои планы и методы',
      5: 'Найдите баланс между свободой и обязательствами',
      6: 'Заботьтесь о других, не забывая о себе',
      7: 'Делитесь своей мудростью с окружающими',
      8: 'Используйте успех для служения высшим целям',
      9: 'Направляйте эмоции на конструктивные действия'
    };
    return solutions[number] || 'Стремитесь к балансу во всем';
  }

  /**
   * Анализ благоприятных дат
   */
  getFavorableDates(birthDate, year = new Date().getFullYear()) {
    try {
      const lifePath = this.calculateLifePath(birthDate);
      const favorableDates = [];

      // Ищем даты с совместимыми числами
      for (let month = 1; month <= 12; month++) {
        for (let day = 1; day <= 28; day++) { // Используем 28 для простоты
          const date = new Date(year, month - 1, day);
          const dayNumber = this.reduceToSingleDigit(day);
          const monthNumber = this.reduceToSingleDigit(month);
          
          // Проверяем совместимость с числом жизненного пути
          const compatibility = this.calculateCompatibility(lifePath, dayNumber);
          
          if (compatibility.level === 'high') {
            favorableDates.push({
              date: date.toISOString().split('T')[0],
              dayNumber,
              monthNumber,
              compatibility: compatibility.percentage,
              description: `Благоприятный день для ${this.numberMeanings[dayNumber]?.keywords[0]}`
            });
          }
        }
      }

      return favorableDates.slice(0, 12); // Возвращаем первые 12 благоприятных дат

    } catch (error) {
      logger.error('Error getting favorable dates', { error: error.message, birthDate, year });
      throw error;
    }
  }

  /**
   * Генерация ИИ-анализа для нумерологического профиля
   */
  async generateAIAnalysis({ lifePath, destiny, soul, personality, birthDate, fullName }) {
    try {
      const age = new Date().getFullYear() - new Date(birthDate).getFullYear();
      const currentYear = new Date().getFullYear();
      
      const prompt = `🔮 Ты - мудрый нумеролог с 40-летним опытом чтения душ. Создай МАКСИМАЛЬНО ПОДРОБНЫЙ мистический анализ для "${fullName}".

🌟 СВЯЩЕННАЯ МАТРИЦА ДУШИ:
• Путь Судьбы: ${lifePath} - основной урок воплощения
• Число Предназначения: ${destiny} - миссия души в этой жизни  
• Вибрация Сущности: ${soul} - истинные желания души
• Маска Личности: ${personality} - как мир воспринимает энергию
• Возраст мудрости: ${age} лет (влияет на раскрытие потенциала)
• Год силы: ${currentYear}

✨ ТРЕБОВАНИЯ К АНАЛИЗУ:
КРИТИЧЕСКИ ВАЖНО: Пиши РАЗВЕРНУТО и ДЕТАЛЬНО! Минимум 400-500 слов общего текста.
Каждая секция должна содержать 6-10 предложений с глубокими мистическими инсайтами.
Используй богатый мистический язык, образы стихий, планет, но давай конкретные практические советы.

🎭 ПОЛНАЯ КАРТА ДУШИ:

**🛤️ ПУТЬ СУДЬБЫ (${lifePath}) - Священная Дорога Воплощения:**
[ДЕТАЛЬНО раскрой духовное значение этого пути: какие качества души должны расцвести, какие испытания закаляют характер, какие дары развиваются через преодоление, как этот путь связан с кармой прошлых жизней, какие уроки мудрости несет, как проявить мастерство этого числа. Минимум 7-8 глубоких предложений о трансформации]

**⭐ ПРЕДНАЗНАЧЕНИЕ ДУШИ (${destiny}) - Божественная Миссия:**  
[Подробно анализируй, как звучание имени "${fullName}" создает особую вибрацию судьбы, какие уникальные таланты заложены в эту комбинацию букв, как числовая вибрация имени влияет на жизненные события, какие врата возможностей открывает, как служить миру через раскрытие этого дара, какая карьера и призвание соответствуют этой энергии. 6-7 предложений о реализации духовной миссии]

**💎 СУЩНОСТЬ ДУШИ (${soul}) - Сокровенный Огонь:**
[Глубоко исследуй, что по-настоящему зажигает эту душу, какие потребности ведут к внутреннему счастью, какие страхи и желания движут изнутри, как найти баланс между душевными порывами и земными обязанностями, какие внутренние конфликты требуют исцеления, что дарует ощущение полноты. 5-6 предложений о глубинных мотивациях]

**🎭 МАСКА ЛИЧНОСТИ (${personality}) - Лик для Мира:**
[Детально опиши, как эта энергия проявляется во внешнем мире, какую атмосферу создает присутствие этого человека, как другие чувствуют его энергетическое поле, какое первое впечатление складывается при знакомстве, как использовать этот природный магнетизм для достижения целей, какие черты стоит развивать или смягчать. 5-6 предложений]

**🌟 МАГИЧЕСКАЯ АЛХИМИЯ ЧИСЕЛ - Уникальная Формула Бытия:**
[Создай синтез всех энергий: как числа ${lifePath}, ${destiny}, ${soul}, ${personality} взаимодействуют в едином танце судьбы, где они гармонируют, а где создают внутреннее напряжение, какие главные жизненные темы и вызовы несет эта комбинация, какие периоды жизни будут особенно значимыми, какие уникальные возможности открывает именно эта матрица чисел, как превратить противоречия в силу. 8-10 предложений о духовной алхимии]

**🔑 СЕМЬ КЛЮЧЕЙ МАСТЕРСТВА:**
• Духовная практика: [конкретная медитация, мантра или ритуал для развития главного качества]
• Профессиональное призвание: [детальные рекомендации по карьере и призванию] 
• Исцеление души: [способы гармонизации внутренних противоречий и травм]
• Кармическая работа: [методы проработки кармических уроков и долгов]
• Повседневная магия: [практические советы для ежедневного роста]
• Любовь и отношения: [как строить гармоничные связи, какой партнер подходит]
• Служение миру: [как использовать свои дары для помощи другим]

Пиши как просветленный мистик, который читает акашические записи души. Используй образы звезд, стихий, священной геометрии, но всегда возвращайся к практическим инструментам жизни!`;

      // Используем Claude напрямую для нумерологии
      const response = await this.aiService.getClaudeInterpretation(prompt, 'claude-3-haiku-20240307');
      
      return this.parseAINumerologyResponse(response.main || response);

    } catch (error) {
      logger.error('Error generating AI numerology analysis', { 
        error: error.message,
        lifePath,
        destiny,
        soul,
        personality
      });
      throw error;
    }
  }

  /**
   * Генерация ИИ-прогноза для персонального года
   */
  async generateAIForecast({ lifePath, personalYear, personalMonth, personalDay, birthDate, currentDate }) {
    try {
      const age = new Date().getFullYear() - new Date(birthDate).getFullYear();
      const currentMonth = currentDate.toLocaleDateString('ru-RU', { month: 'long' });
      
      const prompt = `🌟 Ты - великий нумеролог-оракул с 40-летним опытом чтения временных потоков. Создай МАКСИМАЛЬНО ПОДРОБНЫЙ прогноз для ${currentDate.getFullYear()} года.

🔮 СВЯЩЕННАЯ КАРТА ВРЕМЕНИ:
• Основная Вибрация Жизни: ${lifePath} - корневая энергия воплощения
• Магическое Число Года: ${personalYear} - главный урок ${currentDate.getFullYear()} года
• Волна Месяца: ${personalMonth} - течение ${currentMonth}
• Импульс Дня: ${personalDay} - сегодняшняя возможность
• Цикл Мудрости: ${age} лет (влияет на готовность к урокам)

✨ ТРЕБОВАНИЯ К ПРОГНОЗУ:
КРИТИЧЕСКИ ВАЖНО: Пиши РАЗВЕРНУТО и ПОДРОБНО! Минимум 300-400 слов общего текста.
Каждая секция должна содержать 5-8 предложений с глубокими инсайтами.
Используй мистический язык, но давай конкретные практические рекомендации.

🎯 ПОЛНАЯ КАРТА ЭНЕРГИЙ ГОДА:

**🌊 ЭНЕРГЕТИЧЕСКАЯ ВОЛНА ГОДА ${personalYear} (${currentDate.getFullYear()}):**
[ПОДРОБНО раскрой мистическое значение этого года: как энергия числа ${personalYear} взаимодействует с вибрацией жизненного пути ${lifePath}, какие духовные врата открывает, какие кармические уроки принесет, как трансформирует сознание. Опиши энергетическую алхимию года детально - минимум 6-8 предложений]

**🗝️ СЕМЬ ВРАТ ТРАНСФОРМАЦИИ:**
• Духовное развитие: [детальная тема духовного роста в этом году]
• Материальная сфера: [конкретные уроки через деньги, карьеру, достижения]  
• Отношения и любовь: [что принесет любовь, дружба, семья - подробности]
• Творчество и самовыражение: [как выразить уникальность души]
• Здоровье и энергия: [энергетические потребности тела и духа]
• Интуиция и мудрость: [развитие внутреннего знания]
• Служение миру: [как использовать дары для помощи другим]

**🎪 МИСТИЧЕСКИЕ ИНСТРУКЦИИ И ПРАКТИКИ:**
[7-10 конкретных магических практик, медитаций, ритуалов и житейских советов: как использовать энергию года для максимального роста, какие действия усилят поток удачи, каких ловушек и испытаний избегать, какие талисманы носить, в какие дни принимать важные решения]

**🌙 ОСОБАЯ МАГИЯ ТЕКУЩЕГО ПЕРИОДА:**
[Детальная мудрость для ${currentMonth} месяца: как волна месяца (${personalMonth}) создает уникальную алхимию с энергией года ${personalYear}, что делать именно сейчас, какие возможности открыты только в этот период, специальные практики для этого времени. Минимум 5-6 конкретных рекомендаций]

**⚡ ЭНЕРГЕТИЧЕСКИЕ ТОЧКИ СИЛЫ ГОДА:**
[Назови 3-4 самых мощных периода года для этого человека, когда энергии будут особенно благоприятны для важных решений]

**🔮 СВЯЩЕННАЯ МАНТРА ГОДА:**
[Мощная вдохновляющая фраза-настрой из 8-12 слов, отражающая суть года]

Пиши как мудрый мистик, который видит тонкие энергии времени. Используй образы стихий, планет, космических ритмов, но всегда давай практические инструменты для жизни!`;

      // Используем Claude напрямую для прогноза
      const response = await this.aiService.getClaudeInterpretation(prompt, 'claude-3-haiku-20240307');
      
      return this.parseAIForecastResponse(response.main || response);

    } catch (error) {
      logger.error('Error generating AI forecast', { 
        error: error.message,
        lifePath,
        personalYear,
        personalMonth,
        personalDay
      });
      throw error;
    }
  }

  /**
   * Парсинг ответа ИИ для прогноза
   */
  parseAIForecastResponse(text) {
    try {
      const parsed = {
        yearDescription: '',
        yearThemes: [],
        yearAdvice: '',
        advice: '',
        powerPoints: '',
        mantra: ''
      };

      // Извлекаем основные секции с учетом новой структуры
      const yearEnergyMatch = text.match(/\*\*🌊 ЭНЕРГЕТИЧЕСКАЯ ВОЛНА ГОДА.*?\*\*(.*?)(?=\*\*🗝️|\*\*🎪|\*\*🌙|$)/is);
      const gatesMatch = text.match(/\*\*🗝️ СЕМЬ ВРАТ ТРАНСФОРМАЦИИ:\*\*(.*?)(?=\*\*🎪|\*\*🌙|\*\*⚡|$)/is);
      const practicesMatch = text.match(/\*\*🎪 МИСТИЧЕСКИЕ ИНСТРУКЦИИ И ПРАКТИКИ:\*\*(.*?)(?=\*\*🌙|\*\*⚡|\*\*🔮|$)/is);
      const currentPeriodMatch = text.match(/\*\*🌙 ОСОБАЯ МАГИЯ ТЕКУЩЕГО ПЕРИОДА:\*\*(.*?)(?=\*\*⚡|\*\*🔮|$)/is);
      const powerPointsMatch = text.match(/\*\*⚡ ЭНЕРГЕТИЧЕСКИЕ ТОЧКИ СИЛЫ ГОДА:\*\*(.*?)(?=\*\*🔮|$)/is);
      const mantraMatch = text.match(/\*\*🔮 СВЯЩЕННАЯ МАНТРА ГОДА:\*\*(.*?)$/is);

      if (yearEnergyMatch) {
        parsed.yearDescription = yearEnergyMatch[1].trim();
      }

      if (gatesMatch) {
        const gatesText = gatesMatch[1].trim();
        parsed.yearThemes = gatesText
          .split('\n')
          .filter(line => line.includes('•'))
          .map(line => line.replace(/•/, '').trim())
          .filter(theme => theme.length > 0);
      }

      if (practicesMatch) {
        parsed.yearAdvice = practicesMatch[1].trim();
      }

      if (currentPeriodMatch) {
        parsed.advice = currentPeriodMatch[1].trim();
      }

      if (powerPointsMatch) {
        parsed.powerPoints = powerPointsMatch[1].trim();
      }

      if (mantraMatch) {
        parsed.mantra = mantraMatch[1].trim();
      }

      // Fallback парсинг если структурированный формат не найден
      if (!parsed.yearDescription && !parsed.yearAdvice) {
        // Пытаемся найти основное содержание
        const lines = text.split('\n').filter(line => line.trim());
        let hasContent = false;
        
        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.length > 50 && !trimmed.includes('**')) {
            if (!hasContent) {
              parsed.yearDescription = trimmed;
              hasContent = true;
            } else {
              parsed.yearAdvice += trimmed + '\n';
            }
          }
        }
      }

      // Объединяем советы если нужно
      if (!parsed.advice && parsed.yearAdvice) {
        parsed.advice = parsed.yearAdvice;
      }

      return parsed;

    } catch (error) {
      logger.error('Error parsing AI forecast response', { error: error.message, text });
      return null;
    }
  }

  /**
   * Парсинг ответа ИИ для нумерологического анализа
   */
  parseAINumerologyResponse(text) {
    try {
      const parsed = {
        lifePath: { description: '', insight: '' },
        destiny: { description: '', insight: '' },
        soul: { description: '', insight: '' },
        personality: { description: '', insight: '' },
        summary: '',
        recommendations: ''
      };

      // Извлекаем секции по ключевым словам
      const sections = {
        lifePath: text.match(/\*\*ЧИСЛО ЖИЗНЕННОГО ПУТИ.*?\*\*(.*?)(?=\*\*ЧИСЛО СУДЬБЫ|\*\*ОБЩИЙ АНАЛИЗ|$)/is),
        destiny: text.match(/\*\*ЧИСЛО СУДЬБЫ.*?\*\*(.*?)(?=\*\*ЧИСЛО ДУШИ|\*\*ОБЩИЙ АНАЛИЗ|$)/is),
        soul: text.match(/\*\*ЧИСЛО ДУШИ.*?\*\*(.*?)(?=\*\*ЧИСЛО ЛИЧНОСТИ|\*\*ОБЩИЙ АНАЛИЗ|$)/is),
        personality: text.match(/\*\*ЧИСЛО ЛИЧНОСТИ.*?\*\*(.*?)(?=\*\*ОБЩИЙ АНАЛИЗ|$)/is),
        summary: text.match(/\*\*ОБЩИЙ АНАЛИЗ:\*\*(.*?)(?=\*\*РЕКОМЕНДАЦИИ|$)/is),
        recommendations: text.match(/\*\*РЕКОМЕНДАЦИИ:\*\*(.*?)$/is)
      };

      // Заполняем извлеченными данными
      Object.keys(sections).forEach(key => {
        if (sections[key] && sections[key][1]) {
          const content = sections[key][1].trim();
          if (key === 'summary' || key === 'recommendations') {
            parsed[key] = content;
          } else {
            parsed[key].description = content;
            parsed[key].insight = content;
          }
        }
      });

      return parsed;

    } catch (error) {
      logger.error('Error parsing AI numerology response', { error: error.message, text });
      return null;
    }
  }

  /**
   * Генерация ИИ-анализа совместимости
   */
  async generateAICompatibilityAnalysis({ number1, number2, name1, name2, basicLevel, basicPercentage }) {
    try {
      console.log('🔮 Запуск ИИ-анализа совместимости:', { number1, number2, name1, name2, basicLevel });

      const number1Info = this.numberMeanings[number1] || this.numberMeanings[number1 % 9] || { name: 'Загадочное число', description: 'Особая энергия' };
      const number2Info = this.numberMeanings[number2] || this.numberMeanings[number2 % 9] || { name: 'Загадочное число', description: 'Особая энергия' };

      const prompt = `💕 Ты - мудрый мастер нумерологии отношений с 40-летним опытом чтения душ. Проведи МАКСИМАЛЬНО ПОДРОБНЫЙ анализ совместимости двух душ.

🌟 ЭНЕРГЕТИЧЕСКАЯ КАРТА СОЮЗА:
• Первая душа: "${name1}" - Число Жизненного Пути ${number1} (${number1Info.name})
• Вторая душа: "${name2}" - Число Жизненного Пути ${number2} (${number2Info.name})
• Базовая совместимость: ${basicLevel} (${basicPercentage}%)

🔥 КРИТИЧЕСКИ ВАЖНО:
- Пиши РАЗВЕРНУТО и ДЕТАЛЬНО! Минимум 500-600 слов общего текста
- Каждая секция должна содержать 4-6 предложений с глубокими мистическими инсайтами
- Используй метафоры энергий, чакр, астральных связей
- Давай конкретные практические советы

💫 ОБЯЗАТЕЛЬНАЯ СТРУКТУРА ЧТЕНИЯ:

**🎭 ТАНЕЦ ЭНЕРГИЙ:**
Как взаимодействуют эти числа в энергетическом плане: где они резонируют и создают гармонию, где возникают вибрационные конфликты, какая уникальная алхимия создается в этом союзе. Опиши энергетический поток между партнерами, как их ауры сплетаются или отталкиваются. Раскрой тайные механизмы притяжения через призму нумерологии.

**💎 СИЛЬНЫЕ СТОРОНЫ СОЮЗА:**
• Главная духовная сила отношений и как она проявляется в повседневности
• Что объединяет партнеров на уровне души и подсознания
• Уникальный дар этой пары миру и окружающим людям
• Скрытые таланты, которые раскрываются только вместе

**⚡ ВЫЗОВЫ И НАПРЯЖЕНИЯ:**
• Главный источник энергетических конфликтов и недопонимания
• Различия в жизненных ритмах и подходах, которые нужно принять
• Кармические уроки, которые души учат друг друга проходить
• Теневые аспекты чисел, которые могут создавать трения

**🌱 ПУТИ ГАРМОНИЗАЦИИ:**
• Конкретная духовная практика для укрепления энергетической связи
• Как трансформировать разногласия в возможности для роста
• Что каждому партнеру нужно развить в себе для гармонии
• Общие цели и проекты для укрепления союза
• Медитативные и энергетические техники для синхронизации

**🔮 ПРОГНОЗ РАЗВИТИЯ:**
Как будут развиваться отношения в различные жизненные циклы, какие духовные этапы их ждут, потенциал для долгосрочного кармического союза, влияние персональных лет на динамику отношений. Предскажи ключевые повороты и моменты роста.

Говори как древний мастер тайных знаний, который видит кармические связи душ через числа. Используй богатые метафоры энергий любви, но давай практичные советы для земной жизни.`;

      // Используем Claude с повышенным таймаутом для детального анализа
      const response = await this.aiService.getClaudeInterpretation(prompt, 'claude-3-sonnet-20240229');
      
      console.log('🎭 ИИ ответ получен:', { responseLength: response?.length || 0 });

      if (!response || response.length < 100) {
        console.warn('⚠️ Слишком короткий ответ ИИ, используем fallback');
        throw new Error('AI response too short');
      }
      
      const parsed = this.parseAICompatibilityResponse(response.main || response);
      console.log('📊 Парсинг завершен:', { 
        hasDetailedAnalysis: !!parsed?.detailedAnalysis, 
        strengthsCount: parsed?.strengths?.length || 0,
        challengesCount: parsed?.challenges?.length || 0,
        recommendationsCount: parsed?.recommendations?.length || 0
      });

      return parsed;

    } catch (error) {
      console.error('❌ Ошибка ИИ-анализа совместимости:', error.message);
      logger.error('Error generating AI compatibility analysis', { 
        error: error.message,
        number1,
        number2
      });
      
      // Возвращаем расширенный fallback вместо выброса ошибки
      return this.getEnhancedCompatibilityFallback(number1, number2, name1, name2, basicLevel, basicPercentage);
    }
  }

  /**
   * Расширенный fallback для совместимости без ИИ
   */
  getEnhancedCompatibilityFallback(number1, number2, name1, name2, basicLevel, basicPercentage) {
    const number1Info = this.numberMeanings[number1] || this.numberMeanings[number1 % 9] || { name: 'Загадочное число' };
    const number2Info = this.numberMeanings[number2] || this.numberMeanings[number2 % 9] || { name: 'Загадочное число' };

    // Создаем детальное описание на основе характеристик чисел
    const detailedAnalysis = `Энергетическое взаимодействие между числом ${number1} (${number1Info.name}) и числом ${number2} (${number2Info.name}) создает ${basicLevel === 'high' ? 'гармоничную' : basicLevel === 'medium' ? 'сбалансированную' : 'напряженную'} динамику отношений. ${number1Info.description || 'Первая энергия несет особые вибрации'}, которая встречается с ${number2Info.description || 'уникальной природой второго числа'}, создавая уникальную алхимию союза. ${basicLevel === 'low' ? 'Несмотря на сложности, эти различия могут стать источником взаимного роста и духовного развития.' : 'Это сочетание обладает большим потенциалом для создания крепких и значимых отношений.'}`;

    // Сильные стороны
    const strengths = basicLevel === 'high' ? [
      'Естественная гармония и взаимопонимание между партнерами',
      'Способность интуитивно чувствовать потребности друг друга',
      'Общие жизненные ценности и духовные устремления',
      'Взаимное вдохновение и поддержка в достижении целей'
    ] : basicLevel === 'medium' ? [
      'Возможность учиться друг у друга и расти вместе',
      'Баланс между сходством и различиями в характерах',
      'Способность находить компромиссы в сложных ситуациях',
      'Взаимодополняющие качества, создающие целостность'
    ] : [
      'Возможность глубокой трансформации через отношения',
      'Развитие терпения и понимания через преодоление различий',
      'Уникальный опыт роста через принятие инаковости партнера',
      'Потенциал для создания необычного и запоминающегося союза'
    ];

    // Вызовы
    const challenges = basicLevel === 'high' ? [
      'Риск слишком большой похожести, ведущей к стагнации',
      'Необходимость поддерживать индивидуальность в гармоничном союзе',
      'Важность не принимать взаимопонимание как данность'
    ] : basicLevel === 'medium' ? [
      'Необходимость постоянной работы над пониманием различий',
      'Балансирование между уступками и сохранением своей сущности',
      'Преодоление периодических недопониманий и конфликтов'
    ] : [
      'Значительные различия в подходах к жизни и ценностях',
      'Необходимость больших усилий для достижения взаимопонимания',
      'Риск эмоционального выгорания от постоянного преодоления трудностей',
      'Важность не пытаться изменить партнера под себя'
    ];

    // Рекомендации
    const recommendations = basicLevel === 'high' ? [
      'Развивайте общие интересы и духовные практики',
      'Поддерживайте романтику и не забывайте удивлять друг друга',
      'Создавайте новые вызовы и цели для совместного роста',
      'Цените и благодарите за гармонию в отношениях'
    ] : basicLevel === 'medium' ? [
      'Практикуйте активное слушание и эмпатию',
      'Находите время для честного обсуждения различий',
      'Развивайте терпение и принятие особенностей партнера',
      'Ищите компромиссы, которые учитывают потребности обеих сторон'
    ] : [
      'Фокусируйтесь на том, что вас объединяет, а не разделяет',
      'Развивайте искусство принятия и безусловной любви',
      'Учитесь видеть в различиях возможности для роста',
      'Обращайтесь за помощью к специалистам при серьезных конфликтах',
      'Практикуйте медитацию и работу с энергией для гармонизации'
    ];

    return {
      detailedAnalysis,
      strengths,
      challenges,
      recommendations,
      description: detailedAnalysis,
      advice: recommendations,
      aiEnhanced: false
    };
  }

  /**
   * Анализ кармических чисел и долгов души
   */
  async analyzeKarmicNumbers(birthDate, fullName) {
    try {
      const lifePath = this.calculateLifePath(birthDate);
      const destiny = this.calculateDestinyNumber(fullName);
      const soul = this.calculateSoulNumber(birthDate);
      
      // Проверяем на кармические числа
      const karmicNumbers = [];
      const possibleKarmic = [13, 14, 16, 19];
      
      // Анализируем промежуточные суммы для поиска кармических чисел
      const birthDateString = new Date(birthDate).toLocaleDateString('en-GB');
      const [day, month, year] = birthDateString.split('/').map(Number);
      
      // Проверяем дату рождения
      const daySum = day > 9 ? day : 0;
      const monthSum = month > 9 ? month : 0;
      const yearSum = year.toString().split('').reduce((sum, digit) => sum + parseInt(digit), 0);
      
      if (possibleKarmic.includes(daySum)) karmicNumbers.push({ number: daySum, source: 'day' });
      if (possibleKarmic.includes(monthSum)) karmicNumbers.push({ number: monthSum, source: 'month' });
      if (possibleKarmic.includes(yearSum)) karmicNumbers.push({ number: yearSum, source: 'year' });

      // Попытка получить ИИ-анализ кармы
      let aiKarmicAnalysis = null;
      if (this.aiService && this.aiService.claudeApiKey && karmicNumbers.length > 0) {
        try {
          aiKarmicAnalysis = await this.generateAIKarmicAnalysis({
            lifePath,
            destiny,
            soul,
            karmicNumbers,
            birthDate,
            fullName
          });
        } catch (error) {
          logger.warn('AI karmic analysis failed, using fallback', { error: error.message });
        }
      }

      return {
        hasKarmicNumbers: karmicNumbers.length > 0,
        karmicNumbers,
        karmicLessons: aiKarmicAnalysis?.lessons || this.getBasicKarmicLessons(karmicNumbers),
        challenges: aiKarmicAnalysis?.challenges || [],
        transformation: aiKarmicAnalysis?.transformation || '',
        spiritualGifts: aiKarmicAnalysis?.gifts || [],
        recommendations: aiKarmicAnalysis?.recommendations || [],
        aiEnhanced: aiKarmicAnalysis ? true : false
      };

    } catch (error) {
      logger.error('Error analyzing karmic numbers', { error: error.message, birthDate, fullName });
      throw error;
    }
  }

  /**
   * Генерация ИИ-анализа кармических уроков
   */
  async generateAIKarmicAnalysis({ lifePath, destiny, soul, karmicNumbers, birthDate, fullName }) {
    try {
      const karmicNumbersText = karmicNumbers.map(k => `${k.number} (из ${k.source})`).join(', ');
      
      const prompt = `🌌 Ты - мастер кармической нумерологии, читающий записи души. Проведи глубокий анализ кармических уроков для "${fullName}".

🔮 КАРМИЧЕСКАЯ КАРТА ДУШИ:
• Путь Судьбы: ${lifePath} - основной урок воплощения
• Число Предназначения: ${destiny} - миссия души
• Вибрация Сущности: ${soul} - истинные желания
• КАРМИЧЕСКИЕ ЧИСЛА: ${karmicNumbersText}

✨ ПРИНЦИПЫ КАРМИЧЕСКОГО ЧТЕНИЯ:
1. Кармические числа - это незавершенные уроки прошлых жизней
2. Они создают особые испытания и возможности
3. Через преодоление кармы душа обретает мастерство
4. Каждое кармическое число несет и вызов, и дар
5. Фокусируйся на ТРАНСФОРМАЦИИ через испытания

🌟 СТРУКТУРА КАРМИЧЕСКОГО АНАЛИЗА:

**⚡ КАРМИЧЕСКИЕ ВЫЗОВЫ:**
[Подробно раскрой, какие именно испытания несут эти кармические числа в данной комбинации, как они проявляются в жизни, почему душа выбрала эти уроки. 4-5 предложений]

**🎭 ПАТТЕРНЫ ПОВТОРЕНИЯ:**
• [Основной кармический паттерн, который повторяется]
• [Ситуации, которые будут возникать для урока]
• [Эмоциональные реакции, которые нужно трансформировать]

**💎 СКРЫТЫЕ ДАРЫ КАРМЫ:**
• [Уникальные способности, развивающиеся через испытания]
• [Мудрость, которая придет через преодоление]
• [Служение миру через трансформированную карму]

**🌅 ПУТИ ОСВОБОЖДЕНИЯ:**
• [Духовная практика для работы с кармой]
• [Конкретные действия для трансформации паттернов]
• [Как превратить вызовы в силу]
• [Медитации и аффирмации для исцеления]

**🔮 КАРМИЧЕСКОЕ ПРЕДНАЗНАЧЕНИЕ:**
[Как кармические уроки связаны с главной миссией души в этой жизни, что душа хочет завершить и какой дар принести миру. 3-4 предложения]

Говори как мудрый учитель кармы, который видит глубинные уроки души. Используй образы духовной алхимии, но давай практические инструменты.`;

      // Используем Claude напрямую для кармического анализа
      const response = await this.aiService.getClaudeInterpretation(prompt, 'claude-3-haiku-20240307');
      
      return this.parseAIKarmicResponse(response.main || response);

    } catch (error) {
      logger.error('Error generating AI karmic analysis', { 
        error: error.message,
        karmicNumbers
      });
      throw error;
    }
  }

  /**
   * Парсинг ответа ИИ для совместимости
   */
  parseAICompatibilityResponse(text) {
    try {
      const parsed = {
        detailedAnalysis: '',
        strengths: [],
        challenges: [],
        recommendations: [],
        description: ''
      };

      // Извлекаем секции
      const danceMatch = text.match(/\*\*🎭 ТАНЕЦ ЭНЕРГИЙ:\*\*(.*?)(?=\*\*💎|\*\*⚡|$)/is);
      const strengthsMatch = text.match(/\*\*💎 СИЛЬНЫЕ СТОРОНЫ СОЮЗА:\*\*(.*?)(?=\*\*⚡|\*\*🌱|$)/is);
      const challengesMatch = text.match(/\*\*⚡ ВЫЗОВЫ И НАПРЯЖЕНИЯ:\*\*(.*?)(?=\*\*🌱|\*\*🔮|$)/is);
      const recommendationsMatch = text.match(/\*\*🌱 ПУТИ ГАРМОНИЗАЦИИ:\*\*(.*?)(?=\*\*🔮|$)/is);

      if (danceMatch) {
        parsed.detailedAnalysis = danceMatch[1].trim();
        parsed.description = danceMatch[1].trim();
      }

      if (strengthsMatch) {
        parsed.strengths = strengthsMatch[1]
          .split('\n')
          .filter(line => line.includes('•'))
          .map(line => line.replace(/•/, '').trim())
          .filter(item => item.length > 0);
      }

      if (challengesMatch) {
        parsed.challenges = challengesMatch[1]
          .split('\n')
          .filter(line => line.includes('•'))
          .map(line => line.replace(/•/, '').trim())
          .filter(item => item.length > 0);
      }

      if (recommendationsMatch) {
        parsed.recommendations = recommendationsMatch[1]
          .split('\n')
          .filter(line => line.includes('•'))
          .map(line => line.replace(/•/, '').trim())
          .filter(item => item.length > 0);
        
        parsed.advice = parsed.recommendations;
      }

      return parsed;

    } catch (error) {
      logger.error('Error parsing AI compatibility response', { error: error.message, text });
      return null;
    }
  }

  /**
   * Парсинг ответа ИИ для кармического анализа
   */
  parseAIKarmicResponse(text) {
    try {
      const parsed = {
        lessons: '',
        challenges: [],
        transformation: '',
        gifts: [],
        recommendations: []
      };

      // Извлекаем секции
      const challengesMatch = text.match(/\*\*⚡ КАРМИЧЕСКИЕ ВЫЗОВЫ:\*\*(.*?)(?=\*\*🎭|\*\*💎|$)/is);
      const patternsMatch = text.match(/\*\*🎭 ПАТТЕРНЫ ПОВТОРЕНИЯ:\*\*(.*?)(?=\*\*💎|\*\*🌅|$)/is);
      const giftsMatch = text.match(/\*\*💎 СКРЫТЫЕ ДАРЫ КАРМЫ:\*\*(.*?)(?=\*\*🌅|\*\*🔮|$)/is);
      const liberationMatch = text.match(/\*\*🌅 ПУТИ ОСВОБОЖДЕНИЯ:\*\*(.*?)(?=\*\*🔮|$)/is);
      const destinyMatch = text.match(/\*\*🔮 КАРМИЧЕСКОЕ ПРЕДНАЗНАЧЕНИЕ:\*\*(.*?)$/is);

      if (challengesMatch) {
        parsed.lessons = challengesMatch[1].trim();
      }

      if (patternsMatch) {
        parsed.challenges = patternsMatch[1]
          .split('\n')
          .filter(line => line.includes('•'))
          .map(line => line.replace(/•/, '').trim())
          .filter(item => item.length > 0);
      }

      if (giftsMatch) {
        parsed.gifts = giftsMatch[1]
          .split('\n')
          .filter(line => line.includes('•'))
          .map(line => line.replace(/•/, '').trim())
          .filter(item => item.length > 0);
      }

      if (liberationMatch) {
        parsed.recommendations = liberationMatch[1]
          .split('\n')
          .filter(line => line.includes('•'))
          .map(line => line.replace(/•/, '').trim())
          .filter(item => item.length > 0);
      }

      if (destinyMatch) {
        parsed.transformation = destinyMatch[1].trim();
      }

      return parsed;

    } catch (error) {
      logger.error('Error parsing AI karmic response', { error: error.message, text });
      return null;
    }
  }

  /**
   * Базовые кармические уроки (fallback)
   */
  getBasicKarmicLessons(karmicNumbers) {
    const karmicMeanings = {
      13: 'Урок терпения и упорного труда. Избегайте ярлыков.',
      14: 'Урок умеренности и самоконтроля. Развивайте дисциплину.',
      16: 'Урок смирения и духовности. Преодолевайте эго.',
      19: 'Урок независимости через служение. Баланс лидерства и заботы.'
    };

    return karmicNumbers.map(k => karmicMeanings[k.number] || 'Особый кармический урок').join('; ');
  }

  /**
   * Получение значения числа (универсальный метод)
   */
  getNumberMeaning(number) {
    return this.numberMeanings[number] || {
      name: `Число ${number}`,
      keywords: ['особая энергия', 'уникальный путь'],
      description: 'Особое нумерологическое число с уникальной энергетикой.',
      positive: ['особые способности', 'уникальность'],
      negative: ['сложности понимания', 'особые вызовы'],
      career: ['особый путь'],
      relationships: 'Уникальный подход к отношениям.'
    };
  }

  /**
   * Получение значения числа жизненного пути (алиас для совместимости)
   */
  getLifePathMeaning(number) {
    return this.getNumberMeaning(number);
  }
}

module.exports = new NumerologyService();