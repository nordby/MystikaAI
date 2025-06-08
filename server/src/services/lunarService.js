// server/src/services/lunarService.js
const logger = require('../utils/logger');

class LunarService {
  constructor() {
    this.lunarPhases = {
      NEW_MOON: {
        name: 'Новолуние',
        emoji: '🌑',
        energy: 'Время новых начинаний',
        description: 'Период обновления и планирования. Идеальное время для постановки целей и намерений.',
        duration: [29, 30, 1],
        activities: {
          recommended: [
            'Планирование новых проектов',
            'Постановка целей',
            'Медитация и самоанализ',
            'Очищение пространства',
            'Начало новых отношений'
          ],
          avoid: [
            'Принятие важных решений',
            'Крупные покупки',
            'Конфликты и споры'
          ]
        },
        tarotFocus: ['будущее', 'новые возможности', 'скрытый потенциал']
      },
      WAXING_CRESCENT: {
        name: 'Растущая Луна',
        emoji: '🌒',
        energy: 'Время роста и развития',
        description: 'Период активного роста и развития. Время воплощать планы в действие.',
        duration: [2, 3, 4, 5, 6, 7],
        activities: {
          recommended: [
            'Активные действия по целям',
            'Изучение нового',
            'Налаживание связей',
            'Физические упражнения',
            'Творческие проекты'
          ],
          avoid: [
            'Пассивность',
            'Откладывание дел',
            'Негативные мысли'
          ]
        },
        tarotFocus: ['развитие ситуации', 'рост', 'прогресс']
      },
      FIRST_QUARTER: {
        name: 'Первая четверть',
        emoji: '🌓',
        energy: 'Время преодоления препятствий',
        description: 'Период проверки на прочность. Время принимать решения и преодолевать трудности.',
        duration: [8],
        activities: {
          recommended: [
            'Решение проблем',
            'Принятие решений',
            'Переговоры',
            'Работа над собой',
            'Преодоление страхов'
          ],
          avoid: [
            'Избегание проблем',
            'Промедление',
            'Уступки под давлением'
          ]
        },
        tarotFocus: ['препятствия', 'выбор', 'решительность']
      },
      WAXING_GIBBOUS: {
        name: 'Растущая Луна (выпуклая)',
        emoji: '🌔',
        energy: 'Время совершенствования',
        description: 'Период доработки и совершенствования. Время анализировать и улучшать.',
        duration: [9, 10, 11, 12, 13, 14],
        activities: {
          recommended: [
            'Анализ результатов',
            'Корректировка планов',
            'Обучение и развитие',
            'Укрепление отношений',
            'Саморазвитие'
          ],
          avoid: [
            'Самодовольство',
            'Игнорирование критики',
            'Спешка'
          ]
        },
        tarotFocus: ['совершенствование', 'анализ', 'подготовка']
      },
      FULL_MOON: {
        name: 'Полнолуние',
        emoji: '🌕',
        energy: 'Время кульминации и озарений',
        description: 'Период максимальной энергии и завершения. Время сбора урожая и празднования.',
        duration: [15],
        activities: {
          recommended: [
            'Завершение проектов',
            'Празднование успехов',
            'Благодарность',
            'Освобождение от ненужного',
            'Мощные ритуалы'
          ],
          avoid: [
            'Начало новых дел',
            'Важные решения в эмоциях',
            'Конфликты'
          ]
        },
        tarotFocus: ['кульминация', 'результаты', 'истина']
      },
      WANING_GIBBOUS: {
        name: 'Убывающая Луна (выпуклая)',
        emoji: '🌖',
        energy: 'Время благодарности и передачи опыта',
        description: 'Период делиться знаниями и благодарить. Время учить других и отдавать.',
        duration: [16, 17, 18, 19, 20, 21],
        activities: {
          recommended: [
            'Обучение других',
            'Благотворительность',
            'Делиться опытом',
            'Наставничество',
            'Выражение благодарности'
          ],
          avoid: [
            'Эгоизм',
            'Накопительство',
            'Жадность'
          ]
        },
        tarotFocus: ['передача знаний', 'благодарность', 'мудрость']
      },
      LAST_QUARTER: {
        name: 'Последняя четверть',
        emoji: '🌗',
        energy: 'Время освобождения и прощения',
        description: 'Период отпускания и прощения. Время избавляться от ненужного.',
        duration: [22],
        activities: {
          recommended: [
            'Прощение обид',
            'Избавление от ненужного',
            'Завершение отношений',
            'Очищение',
            'Подведение итогов'
          ],
          avoid: [
            'Цепляние за прошлое',
            'Накопление негатива',
            'Новые обязательства'
          ]
        },
        tarotFocus: ['освобождение', 'прощение', 'завершение']
      },
      WANING_CRESCENT: {
        name: 'Убывающая Луна',
        emoji: '🌘',
        energy: 'Время отдыха и восстановления',
        description: 'Период покоя и восстановления сил. Время готовиться к новому циклу.',
        duration: [23, 24, 25, 26, 27, 28],
        activities: {
          recommended: [
            'Отдых и восстановление',
            'Медитация',
            'Планирование будущего',
            'Уединение',
            'Духовные практики'
          ],
          avoid: [
            'Активная деятельность',
            'Стресс',
            'Переутомление'
          ]
        },
        tarotFocus: ['восстановление', 'покой', 'подготовка']
      }
    };

    this.zodiacSigns = {
      ARIES: {
        name: 'Овен',
        emoji: '♈',
        element: 'Огонь',
        dates: { start: [3, 21], end: [4, 19] },
        energy: 'Инициатива и лидерство',
        qualities: ['решительность', 'энергичность', 'первопроходство'],
        activities: ['начинание проектов', 'спорт', 'лидерство'],
        avoid: ['пассивность', 'долгие раздумья']
      },
      TAURUS: {
        name: 'Телец',
        emoji: '♉',
        element: 'Земля',
        dates: { start: [4, 20], end: [5, 20] },
        energy: 'Стабильность и материальность',
        qualities: ['настойчивость', 'практичность', 'надежность'],
        activities: ['финансовые вопросы', 'строительство', 'садоводство'],
        avoid: ['спешка', 'резкие изменения']
      },
      GEMINI: {
        name: 'Близнецы',
        emoji: '♊',
        element: 'Воздух',
        dates: { start: [5, 21], end: [6, 20] },
        energy: 'Общение и обмен информацией',
        qualities: ['любознательность', 'общительность', 'адаптивность'],
        activities: ['обучение', 'общение', 'путешествия'],
        avoid: ['изоляция', 'монотонность']
      },
      CANCER: {
        name: 'Рак',
        emoji: '♋',
        element: 'Вода',
        dates: { start: [6, 21], end: [7, 22] },
        energy: 'Забота и интуиция',
        qualities: ['эмпатия', 'интуиция', 'заботливость'],
        activities: ['семейные дела', 'уход за домом', 'кулинария'],
        avoid: ['агрессия', 'публичность']
      },
      LEO: {
        name: 'Лев',
        emoji: '♌',
        element: 'Огонь',
        dates: { start: [7, 23], end: [8, 22] },
        energy: 'Творчество и самовыражение',
        qualities: ['творчество', 'великодушие', 'харизма'],
        activities: ['творческие проекты', 'публичные выступления', 'развлечения'],
        avoid: ['скромность', 'самокритика']
      },
      VIRGO: {
        name: 'Дева',
        emoji: '♍',
        element: 'Земля',
        dates: { start: [8, 23], end: [9, 22] },
        energy: 'Анализ и совершенствование',
        qualities: ['внимательность', 'практичность', 'перфекционизм'],
        activities: ['организация', 'анализ', 'здоровье'],
        avoid: ['хаос', 'небрежность']
      },
      LIBRA: {
        name: 'Весы',
        emoji: '♎',
        element: 'Воздух',
        dates: { start: [9, 23], end: [10, 22] },
        energy: 'Гармония и партнерство',
        qualities: ['дипломатичность', 'справедливость', 'эстетика'],
        activities: ['переговоры', 'искусство', 'отношения'],
        avoid: ['конфликты', 'неуравновешенность']
      },
      SCORPIO: {
        name: 'Скорпион',
        emoji: '♏',
        element: 'Вода',
        dates: { start: [10, 23], end: [11, 21] },
        energy: 'Трансформация и глубина',
        qualities: ['интенсивность', 'проницательность', 'трансформация'],
        activities: ['исследования', 'психология', 'мистика'],
        avoid: ['поверхностность', 'ложь']
      },
      SAGITTARIUS: {
        name: 'Стрелец',
        emoji: '♐',
        element: 'Огонь',
        dates: { start: [11, 22], end: [12, 21] },
        energy: 'Расширение и философия',
        qualities: ['оптимизм', 'философичность', 'свободолюбие'],
        activities: ['путешествия', 'обучение', 'духовный поиск'],
        avoid: ['ограничения', 'рутина']
      },
      CAPRICORN: {
        name: 'Козерог',
        emoji: '♑',
        element: 'Земля',
        dates: { start: [12, 22], end: [1, 19] },
        energy: 'Достижения и структура',
        qualities: ['амбициозность', 'дисциплина', 'ответственность'],
        activities: ['карьерные вопросы', 'планирование', 'структурирование'],
        avoid: ['легкомыслие', 'хаос']
      },
      AQUARIUS: {
        name: 'Водолей',
        emoji: '♒',
        element: 'Воздух',
        dates: { start: [1, 20], end: [2, 18] },
        energy: 'Инновации и дружба',
        qualities: ['оригинальность', 'независимость', 'гуманность'],
        activities: ['инновации', 'групповая работа', 'технологии'],
        avoid: ['консерватизм', 'изоляция']
      },
      PISCES: {
        name: 'Рыбы',
        emoji: '♓',
        element: 'Вода',
        dates: { start: [2, 19], end: [3, 20] },
        energy: 'Интуиция и сострадание',
        qualities: ['интуиция', 'сострадание', 'духовность'],
        activities: ['медитация', 'искусство', 'помощь другим'],
        avoid: ['материализм', 'жестокость']
      }
    };
  }

  /**
   * Вычисление текущей лунной фазы
   */
  getCurrentMoonPhase(date = new Date()) {
    try {
      const lunarDay = this.calculateLunarDay(date);
      
      if (lunarDay === 1) return 'NEW_MOON';
      if (lunarDay >= 2 && lunarDay <= 7) return 'WAXING_CRESCENT';
      if (lunarDay === 8) return 'FIRST_QUARTER';
      if (lunarDay >= 9 && lunarDay <= 14) return 'WAXING_GIBBOUS';
      if (lunarDay === 15) return 'FULL_MOON';
      if (lunarDay >= 16 && lunarDay <= 21) return 'WANING_GIBBOUS';
      if (lunarDay === 22) return 'LAST_QUARTER';
      if (lunarDay >= 23) return 'WANING_CRESCENT';

      return 'WANING_CRESCENT'; // По умолчанию

    } catch (error) {
      logger.error('Error calculating current moon phase', { error: error.message, date });
      throw error;
    }
  }

  /**
   * Вычисление лунного дня
   */
  calculateLunarDay(date) {
    try {
      // Эталонное новолуние (можно настроить под более точные астрономические данные)
      const referenceNewMoon = new Date('2024-01-11T11:57:00Z');
      const lunarCycle = 29.53058867; // Синодический месяц в днях
      
      const timeDiff = date.getTime() - referenceNewMoon.getTime();
      const daysDiff = timeDiff / (1000 * 60 * 60 * 24);
      
      let lunarDay = (daysDiff % lunarCycle) + 1;
      if (lunarDay <= 0) lunarDay += lunarCycle;
      
      return Math.floor(lunarDay);

    } catch (error) {
      logger.error('Error calculating lunar day', { error: error.message, date });
      throw error;
    }
  }

  /**
   * Получение знака зодиака для даты
   */
  getZodiacSign(date) {
    try {
      const month = date.getMonth() + 1;
      const day = date.getDate();

      for (const [sign, data] of Object.entries(this.zodiacSigns)) {
        const { start, end } = data.dates;
        
        if (
          (month === start[0] && day >= start[1]) ||
          (month === end[0] && day <= end[1]) ||
          (start[0] === 12 && month === 1 && day <= end[1]) // Козерог через Новый год
        ) {
          return sign;
        }
      }

      return 'CAPRICORN'; // По умолчанию

    } catch (error) {
      logger.error('Error getting zodiac sign', { error: error.message, date });
      throw error;
    }
  }

  /**
   * Получение рекомендаций на день
   */
  getDailyRecommendations(date = new Date()) {
    try {
      const moonPhase = this.getCurrentMoonPhase(date);
      const zodiacSign = this.getZodiacSign(date);
      const lunarDay = this.calculateLunarDay(date);

      const phaseData = this.lunarPhases[moonPhase];
      const zodiacData = this.zodiacSigns[zodiacSign];

      const recommendations = {
        date: date.toISOString().split('T')[0],
        lunarDay,
        moonPhase: {
          phase: moonPhase,
          name: phaseData.name,
          emoji: phaseData.emoji,
          energy: phaseData.energy,
          description: phaseData.description
        },
        zodiacSign: {
          sign: zodiacSign,
          name: zodiacData.name,
          emoji: zodiacData.emoji,
          element: zodiacData.element,
          energy: zodiacData.energy
        },
        activities: {
          recommended: [
            ...phaseData.activities.recommended,
            ...zodiacData.activities
          ],
          avoid: [
            ...phaseData.activities.avoid,
            ...zodiacData.avoid
          ]
        },
        tarotFocus: phaseData.tarotFocus,
        energy: this.combineEnergies(phaseData.energy, zodiacData.energy),
        specialAdvice: this.getSpecialAdvice(moonPhase, zodiacSign, lunarDay)
      };

      return recommendations;

    } catch (error) {
      logger.error('Error getting daily recommendations', { error: error.message, date });
      throw error;
    }
  }

  /**
   * Получение лунного календаря на период
   */
  getLunarCalendar(startDate, endDate) {
    try {
      const calendar = [];
      const currentDate = new Date(startDate);

      while (currentDate <= endDate) {
        const dayData = this.getDailyRecommendations(currentDate);
        calendar.push(dayData);
        
        currentDate.setDate(currentDate.getDate() + 1);
      }

      return {
        period: {
          start: startDate.toISOString().split('T')[0],
          end: endDate.toISOString().split('T')[0],
          totalDays: calendar.length
        },
        calendar,
        summary: this.generateCalendarSummary(calendar)
      };

    } catch (error) {
      logger.error('Error generating lunar calendar', { error: error.message, startDate, endDate });
      throw error;
    }
  }

  /**
   * Поиск благоприятных дней для конкретной активности
   */
  findFavorableDays(activity, startDate, endDate) {
    try {
      const calendar = this.getLunarCalendar(startDate, endDate);
      const favorableDays = [];

      const activityKeywords = activity.toLowerCase();

      for (const day of calendar.calendar) {
        const isRecommended = day.activities.recommended.some(rec => 
          rec.toLowerCase().includes(activityKeywords) ||
          activityKeywords.includes(rec.toLowerCase())
        );

        const isAvoided = day.activities.avoid.some(avoid => 
          avoid.toLowerCase().includes(activityKeywords) ||
          activityKeywords.includes(avoid.toLowerCase())
        );

        if (isRecommended && !isAvoided) {
          favorableDays.push({
            ...day,
            favorabilityScore: this.calculateFavorabilityScore(day, activity)
          });
        }
      }

      return {
        activity,
        period: calendar.period,
        favorableDays: favorableDays.sort((a, b) => b.favorabilityScore - a.favorabilityScore),
        totalFound: favorableDays.length,
        bestDay: favorableDays.length > 0 ? favorableDays[0] : null
      };

    } catch (error) {
      logger.error('Error finding favorable days', { error: error.message, activity, startDate, endDate });
      throw error;
    }
  }

  /**
   * Анализ совместимости с лунными циклами
   */
  analyzeLunarCompatibility(birthDate, targetDate = new Date()) {
    try {
      const birthMoonPhase = this.getCurrentMoonPhase(birthDate);
      const currentMoonPhase = this.getCurrentMoonPhase(targetDate);
      
      const birthZodiac = this.getZodiacSign(birthDate);
      const currentZodiac = this.getZodiacSign(targetDate);

      const phaseCompatibility = this.calculatePhaseCompatibility(birthMoonPhase, currentMoonPhase);
      const zodiacCompatibility = this.calculateZodiacCompatibility(birthZodiac, currentZodiac);

      return {
        birthData: {
          date: birthDate.toISOString().split('T')[0],
          moonPhase: this.lunarPhases[birthMoonPhase],
          zodiacSign: this.zodiacSigns[birthZodiac]
        },
        currentData: {
          date: targetDate.toISOString().split('T')[0],
          moonPhase: this.lunarPhases[currentMoonPhase],
          zodiacSign: this.zodiacSigns[currentZodiac]
        },
        compatibility: {
          phase: phaseCompatibility,
          zodiac: zodiacCompatibility,
          overall: Math.round((phaseCompatibility.score + zodiacCompatibility.score) / 2),
          description: this.generateCompatibilityDescription(phaseCompatibility, zodiacCompatibility)
        },
        recommendations: this.generateCompatibilityRecommendations(phaseCompatibility, zodiacCompatibility)
      };

    } catch (error) {
      logger.error('Error analyzing lunar compatibility', { error: error.message, birthDate, targetDate });
      throw error;
    }
  }

  /**
   * Получение следующих значимых лунных событий
   */
  getUpcomingLunarEvents(startDate = new Date(), daysAhead = 30) {
    try {
      const events = [];
      const currentDate = new Date(startDate);
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + daysAhead);

      while (currentDate <= endDate) {
        const moonPhase = this.getCurrentMoonPhase(currentDate);
        const lunarDay = this.calculateLunarDay(currentDate);

        // Ключевые лунные события
        if ([1, 8, 15, 22].includes(lunarDay)) {
          events.push({
            date: new Date(currentDate).toISOString().split('T')[0],
            type: 'moon_phase',
            phase: moonPhase,
            lunarDay,
            name: this.lunarPhases[moonPhase].name,
            emoji: this.lunarPhases[moonPhase].emoji,
            significance: 'Ключевая фаза луны',
            energy: this.lunarPhases[moonPhase].energy,
            daysFromNow: Math.ceil((currentDate - startDate) / (1000 * 60 * 60 * 24))
          });
        }

        // Смена знаков зодиака
        const zodiacSign = this.getZodiacSign(currentDate);
        const previousDate = new Date(currentDate);
        previousDate.setDate(previousDate.getDate() - 1);
        const previousZodiac = this.getZodiacSign(previousDate);

        if (zodiacSign !== previousZodiac) {
          events.push({
            date: new Date(currentDate).toISOString().split('T')[0],
            type: 'zodiac_change',
            fromSign: previousZodiac,
            toSign: zodiacSign,
            name: `Переход в ${this.zodiacSigns[zodiacSign].name}`,
            emoji: this.zodiacSigns[zodiacSign].emoji,
            significance: 'Смена астрологического влияния',
            energy: this.zodiacSigns[zodiacSign].energy,
            daysFromNow: Math.ceil((currentDate - startDate) / (1000 * 60 * 60 * 24))
          });
        }

        currentDate.setDate(currentDate.getDate() + 1);
      }

      return {
        period: {
          start: startDate.toISOString().split('T')[0],
          end: endDate.toISOString().split('T')[0],
          daysAhead
        },
        events: events.sort((a, b) => a.daysFromNow - b.daysFromNow),
        nextMajorEvent: events.find(e => e.type === 'moon_phase') || null
      };

    } catch (error) {
      logger.error('Error getting upcoming lunar events', { error: error.message, startDate, daysAhead });
      throw error;
    }
  }

  /**
   * Комбинирование энергий фазы луны и знака зодиака
   */
  combineEnergies(moonEnergy, zodiacEnergy) {
    return `${moonEnergy} в сочетании с ${zodiacEnergy.toLowerCase()}`;
  }

  /**
   * Получение специальных советов
   */
  getSpecialAdvice(moonPhase, zodiacSign, lunarDay) {
    const advice = [];

    // Особые лунные дни
    if (lunarDay === 1) {
      advice.push('Новолуние - идеальное время для загадывания желаний и постановки намерений');
    } else if (lunarDay === 15) {
      advice.push('Полнолуние - время максимальной энергии, будьте осторожны с эмоциями');
    } else if ([8, 22].includes(lunarDay)) {
      advice.push('Четверть луны - время принятия важных решений');
    }

    // Особенности знаков
    const zodiacData = this.zodiacSigns[zodiacSign];
    if (zodiacData.element === 'Огонь') {
      advice.push('Огненная энергия способствует активным действиям и инициативе');
    } else if (zodiacData.element === 'Вода') {
      advice.push('Водная энергия усиливает интуицию и эмоциональную чувствительность');
    } else if (zodiacData.element === 'Воздух') {
      advice.push('Воздушная энергия благоприятствует общению и интеллектуальной деятельности');
    } else if (zodiacData.element === 'Земля') {
      advice.push('Земная энергия поддерживает практические дела и материальные вопросы');
    }

    return advice;
  }

  /**
   * Вычисление совместимости лунных фаз
   */
  calculatePhaseCompatibility(phase1, phase2) {
    const phaseOrder = ['NEW_MOON', 'WAXING_CRESCENT', 'FIRST_QUARTER', 'WAXING_GIBBOUS', 
                       'FULL_MOON', 'WANING_GIBBOUS', 'LAST_QUARTER', 'WANING_CRESCENT'];
    
    const index1 = phaseOrder.indexOf(phase1);
    const index2 = phaseOrder.indexOf(phase2);
    
    let distance = Math.abs(index1 - index2);
    if (distance > 4) distance = 8 - distance;

    const score = 100 - (distance * 15);

    return {
      score: Math.max(score, 20),
      level: score >= 80 ? 'high' : score >= 60 ? 'medium' : 'low',
      description: this.getPhaseCompatibilityDescription(distance)
    };
  }

  /**
   * Вычисление совместимости знаков зодиака
   */
  calculateZodiacCompatibility(sign1, sign2) {
    const compatibilityMatrix = {
      ARIES: { high: ['LEO', 'SAGITTARIUS'], medium: ['GEMINI', 'AQUARIUS'], low: ['CANCER', 'CAPRICORN'] },
      TAURUS: { high: ['VIRGO', 'CAPRICORN'], medium: ['CANCER', 'PISCES'], low: ['LEO', 'AQUARIUS'] },
      GEMINI: { high: ['LIBRA', 'AQUARIUS'], medium: ['ARIES', 'LEO'], low: ['VIRGO', 'PISCES'] },
      CANCER: { high: ['SCORPIO', 'PISCES'], medium: ['TAURUS', 'VIRGO'], low: ['ARIES', 'LIBRA'] },
      LEO: { high: ['ARIES', 'SAGITTARIUS'], medium: ['GEMINI', 'LIBRA'], low: ['TAURUS', 'SCORPIO'] },
      VIRGO: { high: ['TAURUS', 'CAPRICORN'], medium: ['CANCER', 'SCORPIO'], low: ['GEMINI', 'SAGITTARIUS'] },
      LIBRA: { high: ['GEMINI', 'AQUARIUS'], medium: ['LEO', 'SAGITTARIUS'], low: ['CANCER', 'CAPRICORN'] },
      SCORPIO: { high: ['CANCER', 'PISCES'], medium: ['VIRGO', 'CAPRICORN'], low: ['LEO', 'AQUARIUS'] },
      SAGITTARIUS: { high: ['ARIES', 'LEO'], medium: ['LIBRA', 'AQUARIUS'], low: ['VIRGO', 'PISCES'] },
      CAPRICORN: { high: ['TAURUS', 'VIRGO'], medium: ['SCORPIO', 'PISCES'], low: ['ARIES', 'LIBRA'] },
      AQUARIUS: { high: ['GEMINI', 'LIBRA'], medium: ['ARIES', 'SAGITTARIUS'], low: ['TAURUS', 'SCORPIO'] },
      PISCES: { high: ['CANCER', 'SCORPIO'], medium: ['TAURUS', 'CAPRICORN'], low: ['GEMINI', 'SAGITTARIUS'] }
    };

    const matrix = compatibilityMatrix[sign1];
    let level = 'medium';
    let score = 60;

    if (matrix.high.includes(sign2)) {
      level = 'high';
      score = 85;
    } else if (matrix.low.includes(sign2)) {
      level = 'low';
      score = 35;
    }

    return {
      score,
      level,
      description: this.getZodiacCompatibilityDescription(sign1, sign2, level)
    };
  }

  /**
   * Вычисление показателя благоприятности дня для активности
   */
  calculateFavorabilityScore(dayData, activity) {
    let score = 50; // Базовый счет

    // Бонусы за рекомендованные активности
    const matchingRecommendations = dayData.activities.recommended.filter(rec => 
      rec.toLowerCase().includes(activity.toLowerCase()) ||
      activity.toLowerCase().includes(rec.toLowerCase())
    );
    score += matchingRecommendations.length * 20;

    // Штрафы за нерекомендованные активности
    const matchingAvoid = dayData.activities.avoid.filter(avoid => 
      avoid.toLowerCase().includes(activity.toLowerCase()) ||
      activity.toLowerCase().includes(avoid.toLowerCase())
    );
    score -= matchingAvoid.length * 30;

    // Бонусы за особые лунные дни
    if ([1, 15].includes(dayData.lunarDay)) {
      score += 15;
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Генерация резюме календаря
   */
  generateCalendarSummary(calendar) {
    const phaseCount = {};
    const zodiacCount = {};

    for (const day of calendar) {
      const phase = day.moonPhase.phase;
      const zodiac = day.zodiacSign.sign;

      phaseCount[phase] = (phaseCount[phase] || 0) + 1;
      zodiacCount[zodiac] = (zodiacCount[zodiac] || 0) + 1;
    }

    const dominantPhase = Object.keys(phaseCount).reduce((a, b) => 
      phaseCount[a] > phaseCount[b] ? a : b
    );

    const dominantZodiac = Object.keys(zodiacCount).reduce((a, b) => 
      zodiacCount[a] > zodiacCount[b] ? a : b
    );

    return {
      dominantPhase: {
        phase: dominantPhase,
        name: this.lunarPhases[dominantPhase].name,
        days: phaseCount[dominantPhase]
      },
      dominantZodiac: {
        sign: dominantZodiac,
        name: this.zodiacSigns[dominantZodiac].name,
        days: zodiacCount[dominantZodiac]
      },
      phaseDistribution: phaseCount,
      zodiacDistribution: zodiacCount,
      recommendations: this.generatePeriodRecommendations(dominantPhase, dominantZodiac)
    };
  }

  /**
   * Описания совместимости фаз
   */
  getPhaseCompatibilityDescription(distance) {
    if (distance === 0) return 'Идеальная гармония - одинаковые лунные фазы';
    if (distance <= 1) return 'Отличная совместимость - близкие энергии';
    if (distance <= 2) return 'Хорошая совместимость - дополняющие энергии';
    if (distance <= 3) return 'Средняя совместимость - различные, но совместимые энергии';
    return 'Низкая совместимость - противоположные энергии';
  }

  /**
   * Описания совместимости знаков зодиака
   */
  getZodiacCompatibilityDescription(sign1, sign2, level) {
    const sign1Data = this.zodiacSigns[sign1];
    const sign2Data = this.zodiacSigns[sign2];

    if (level === 'high') {
      return `Отличная совместимость между ${sign1Data.name} и ${sign2Data.name}`;
    } else if (level === 'medium') {
      return `Хорошая совместимость между ${sign1Data.name} и ${sign2Data.name}`;
    } else {
      return `Сложная совместимость между ${sign1Data.name} и ${sign2Data.name}`;
    }
  }

  /**
   * Генерация общего описания совместимости
   */
  generateCompatibilityDescription(phaseComp, zodiacComp) {
    const overall = Math.round((phaseComp.score + zodiacComp.score) / 2);
    
    if (overall >= 80) {
      return 'Отличная астрологическая совместимость! Энергии гармонично дополняют друг друга.';
    } else if (overall >= 60) {
      return 'Хорошая астрологическая совместимость с небольшими различиями в энергиях.';
    } else {
      return 'Сложная астрологическая совместимость, требующая понимания и адаптации.';
    }
  }

  /**
   * Генерация рекомендаций по совместимости
   */
  generateCompatibilityRecommendations(phaseComp, zodiacComp) {
    const recommendations = [];

    if (phaseComp.level === 'low') {
      recommendations.push('Учитывайте различия в лунных циклах при планировании совместных дел');
    }

    if (zodiacComp.level === 'low') {
      recommendations.push('Работайте над пониманием различий в астрологических характеристиках');
    }

    if (phaseComp.level === 'high' && zodiacComp.level === 'high') {
      recommendations.push('Используйте гармоничные энергии для общих проектов и целей');
    }

    return recommendations;
  }

  /**
   * Рекомендации для периода
   */
  generatePeriodRecommendations(dominantPhase, dominantZodiac) {
    const phaseData = this.lunarPhases[dominantPhase];
    const zodiacData = this.zodiacSigns[dominantZodiac];

    return [
      `Период преимущественно под влиянием ${phaseData.name}: ${phaseData.energy}`,
      `Астрологическое влияние ${zodiacData.name}: ${zodiacData.energy}`,
      `Рекомендуемые активности: ${zodiacData.activities.join(', ')}`,
      `Избегайте: ${zodiacData.avoid.join(', ')}`
    ];
  }
}

module.exports = new LunarService();