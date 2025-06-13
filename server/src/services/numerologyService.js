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
   * Анализ совместимости по числам
   */
  calculateCompatibility(number1, number2) {
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

      const descriptions = {
        high: 'Отличная совместимость! Ваши числа гармонично дополняют друг друга.',
        medium: 'Хорошая совместимость. Возможны некоторые различия, но они преодолимы.',
        low: 'Сложная совместимость. Потребуется больше усилий для понимания друг друга.'
      };

      return {
        level: compatibility,
        percentage: compatibility === 'high' ? 85 : compatibility === 'medium' ? 65 : 35,
        description: descriptions[compatibility],
        advice: this.getCompatibilityAdvice(number1, number2, compatibility)
      };

    } catch (error) {
      logger.error('Error calculating compatibility', { error: error.message, number1, number2 });
      throw error;
    }
  }

  /**
   * Персональный нумерологический прогноз
   */
  async generatePersonalForecast(birthDate, currentDate = new Date()) {
    try {
      const lifePath = this.calculateLifePath(birthDate);
      const personalYear = this.calculatePersonalYear(birthDate, currentDate);
      const personalMonth = this.calculatePersonalMonth(birthDate, currentDate);
      const personalDay = this.calculatePersonalDay(birthDate, currentDate);

      // Попытка получить ИИ-прогноз
      let aiForecast = null;
      if (process.env.CLAUDE_API_KEY) {
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

      return {
        lifePath: {
          number: lifePath,
          meaning: this.numberMeanings[lifePath]
        },
        personalYear: personalYear,
        yearDescription: aiForecast?.yearDescription || this.getPersonalYearMeaning(personalYear),
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
      if (process.env.CLAUDE_API_KEY) {
        try {
          aiAnalysis = await this.generateAIAnalysis({
            lifePath,
            destiny,
            soul,
            personality,
            birthDate,
            fullName
          });
        } catch (error) {
          logger.warn('AI analysis failed, using fallback', { error: error.message });
        }
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
      
      const prompt = `Проведи глубокий нумерологический анализ человека с именем "${fullName}".

НУМЕРОЛОГИЧЕСКИЕ ДАННЫЕ:
• Число жизненного пути: ${lifePath}
• Число судьбы: ${destiny}
• Число души: ${soul}
• Число личности: ${personality}
• Возраст: ${age} лет
• Текущий год: ${currentYear}

ТРЕБОВАНИЯ К АНАЛИЗУ:
1. Анализируй ВЗАИМОДЕЙСТВИЕ всех чисел между собой
2. Учитывай уникальную комбинацию чисел
3. Давай персонализированные инсайты
4. Используй только русский язык без иностранных слов
5. Будь конкретным и практичным

СТРУКТУРА ОТВЕТА:
**ЧИСЛО ЖИЗНЕННОГО ПУТИ ${lifePath}:**
[Глубокий анализ основного жизненного урока и пути развития, 3-4 предложения]

**ЧИСЛО СУДЬБЫ ${destiny}:**
[Анализ предназначения и талантов, как реализовать потенциал, 3-4 предложения]

**ЧИСЛО ДУШИ ${soul}:**
[Анализ внутренних мотиваций и истинных желаний, 2-3 предложения]

**ЧИСЛО ЛИЧНОСТИ ${personality}:**
[Анализ внешнего образа и первого впечатления, 2-3 предложения]

**ОБЩИЙ АНАЛИЗ:**
[Синтез всех чисел, ключевые особенности личности, основные жизненные темы, 4-5 предложений]

**РЕКОМЕНДАЦИИ:**
[5-7 конкретных практических советов для жизни и развития]

Пиши глубоко, мудро, но понятно. Избегай общих фраз.`;

      const response = await this.aiService.interpretReading(
        [], // Нумерология не использует карты
        prompt,
        { id: 'numerology_user', language: 'ru' },
        {
          spreadType: 'numerology_analysis',
          language: 'ru',
          style: 'detailed'
        }
      );

      return this.parseAINumerologyResponse(response.interpretation);

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
      
      const prompt = `Создай персональный нумерологический прогноз для ${currentDate.getFullYear()} года.

НУМЕРОЛОГИЧЕСКИЕ ДАННЫЕ:
• Число жизненного пути: ${lifePath}
• Персональный год: ${personalYear}
• Персональный месяц: ${personalMonth}
• Персональный день: ${personalDay}
• Возраст: ${age} лет
• Текущий месяц: ${currentMonth}

ТРЕБОВАНИЯ К ПРОГНОЗУ:
1. Анализируй энергии всех циклов в комплексе
2. Учитывай жизненный путь как основу
3. Давай конкретные советы для текущего периода
4. Используй только русский язык
5. Будь практичным и вдохновляющим

СТРУКТУРА ОТВЕТА:
**ЭНЕРГИЯ ГОДА ${personalYear}:**
[Подробное описание энергий и возможностей текущего года, 4-5 предложений]

**КЛЮЧЕВЫЕ ТЕМЫ ГОДА:**
• [Тема 1]
• [Тема 2]
• [Тема 3]
• [Тема 4]

**РЕКОМЕНДАЦИИ ДЛЯ ГОДА:**
[5-6 конкретных практических советов для реализации потенциала года]

**СОВЕТЫ НА ТЕКУЩИЙ ПЕРИОД:**
[Специальные рекомендации с учетом текущего месяца и дня, 3-4 совета]

Пиши вдохновляюще, но конкретно. Избегай общих фраз.`;

      const response = await this.aiService.interpretReading(
        [],
        prompt,
        { id: 'forecast_user', language: 'ru' },
        {
          spreadType: 'numerology_forecast',
          language: 'ru',
          style: 'detailed'
        }
      );

      return this.parseAIForecastResponse(response.interpretation);

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
        advice: ''
      };

      // Извлекаем секции
      const yearEnergyMatch = text.match(/\*\*ЭНЕРГИЯ ГОДА.*?\*\*(.*?)(?=\*\*КЛЮЧЕВЫЕ ТЕМЫ|\*\*РЕКОМЕНДАЦИИ|$)/is);
      const themesMatch = text.match(/\*\*КЛЮЧЕВЫЕ ТЕМЫ ГОДА:\*\*(.*?)(?=\*\*РЕКОМЕНДАЦИИ|\*\*СОВЕТЫ|$)/is);
      const yearAdviceMatch = text.match(/\*\*РЕКОМЕНДАЦИИ ДЛЯ ГОДА:\*\*(.*?)(?=\*\*СОВЕТЫ НА ТЕКУЩИЙ ПЕРИОД|$)/is);
      const currentAdviceMatch = text.match(/\*\*СОВЕТЫ НА ТЕКУЩИЙ ПЕРИОД:\*\*(.*?)$/is);

      if (yearEnergyMatch) {
        parsed.yearDescription = yearEnergyMatch[1].trim();
      }

      if (themesMatch) {
        const themesText = themesMatch[1].trim();
        parsed.yearThemes = themesText
          .split('\n')
          .filter(line => line.includes('•'))
          .map(line => line.replace(/•/, '').trim())
          .filter(theme => theme.length > 0);
      }

      if (yearAdviceMatch) {
        parsed.yearAdvice = yearAdviceMatch[1].trim();
      }

      if (currentAdviceMatch) {
        parsed.advice = currentAdviceMatch[1].trim();
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
}

module.exports = new NumerologyService();