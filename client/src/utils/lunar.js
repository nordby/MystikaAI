// client/src/utils/lunar.js
import { MOON_PHASES, LUNAR_ZODIAC } from '@shared/constants/lunar';

/**
 * Утилиты для работы с лунным календарем
 */

/**
 * Получение текущей фазы луны
 */
export const getCurrentMoonPhase = () => {
  const today = new Date();
  const lunarDay = calculateLunarDay(today);
  
  if (lunarDay === 1) return 'NEW_MOON';
  if (lunarDay <= 7) return 'WAXING_CRESCENT';
  if (lunarDay === 8) return 'FIRST_QUARTER';
  if (lunarDay <= 14) return 'WAXING_GIBBOUS';
  if (lunarDay === 15) return 'FULL_MOON';
  if (lunarDay <= 21) return 'WANING_GIBBOUS';
  if (lunarDay === 22) return 'LAST_QUARTER';
  return 'WANING_CRESCENT';
};

/**
 * Расчет лунного дня
 */
export const calculateLunarDay = (date) => {
  // Упрощенный расчет для демонстрации
  // В реальном приложении нужно использовать астрономические данные
  const newMoonReference = new Date('2024-01-11'); // Эталонное новолуние
  const daysDiff = Math.floor((date - newMoonReference) / (1000 * 60 * 60 * 24));
  const lunarCycle = 29.53; // Лунный цикл в днях
  const lunarDay = (daysDiff % lunarCycle) + 1;
  return Math.floor(lunarDay);
};

/**
 * Получение лунного знака зодиака
 */
export const getLunarZodiacSign = (date) => {
  const zodiacSigns = ['ARIES', 'TAURUS', 'GEMINI', 'CANCER', 'LEO', 'VIRGO', 
                     'LIBRA', 'SCORPIO', 'SAGITTARIUS', 'CAPRICORN', 'AQUARIUS', 'PISCES'];
  const dayOfYear = Math.floor((date - new Date(date.getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24));
  const signIndex = Math.floor((dayOfYear / 30.44) % 12);
  return zodiacSigns[signIndex];
};

/**
 * Получение рекомендаций на день
 */
export const getDailyRecommendations = (date = new Date()) => {
  const moonPhase = getCurrentMoonPhase();
  const phaseData = MOON_PHASES[moonPhase];
  
  if (!phaseData) {
    return {
      recommended: ['Следуйте своей интуиции'],
      avoid: ['Поспешных решений']
    };
  }
  
  return phaseData.activities;
};

/**
 * Получение энергии дня
 */
export const getDailyEnergy = (date = new Date()) => {
  const moonPhase = getCurrentMoonPhase();
  const zodiacSign = getLunarZodiacSign(date);
  
  const phaseEnergy = MOON_PHASES[moonPhase]?.energy || 'Нейтральная энергия';
  const zodiacEnergy = LUNAR_ZODIAC[zodiacSign]?.energy || 'Сбалансированная энергия';
  
  return {
    moonPhase: phaseEnergy,
    zodiac: zodiacEnergy,
    combined: `${phaseEnergy} с влиянием ${zodiacEnergy.toLowerCase()}`
  };
};

/**
 * Проверка благоприятности дня для определенных действий
 */
export const isDayFavorableFor = (activity, date = new Date()) => {
  const recommendations = getDailyRecommendations(date);
  const activityKeywords = activity.toLowerCase();
  
  const isFavorable = recommendations.recommended.some(rec => 
    rec.toLowerCase().includes(activityKeywords)
  );
  
  const isUnfavorable = recommendations.avoid.some(avoid => 
    avoid.toLowerCase().includes(activityKeywords)
  );
  
  if (isFavorable) return 'favorable';
  if (isUnfavorable) return 'unfavorable';
  return 'neutral';
};

/**
 * Получение лунного календаря на период
 */
export const getLunarCalendar = (startDate, endDate) => {
  const calendar = [];
  const current = new Date(startDate);
  
  while (current <= endDate) {
    const lunarDay = calculateLunarDay(current);
    const moonPhase = getCurrentMoonPhase();
    const zodiacSign = getLunarZodiacSign(current);
    
    calendar.push({
      date: new Date(current),
      lunarDay,
      moonPhase: MOON_PHASES[moonPhase],
      zodiacSign: LUNAR_ZODIAC[zodiacSign],
      energy: getDailyEnergy(current),
      recommendations: getDailyRecommendations(current)
    });
    
    current.setDate(current.getDate() + 1);
  }
  
  return calendar;
};

/**
 * Форматирование лунных данных для отображения
 */
export const formatLunarData = (date = new Date()) => {
  const lunarDay = calculateLunarDay(date);
  const moonPhase = getCurrentMoonPhase();
  const zodiacSign = getLunarZodiacSign(date);
  
  return {
    date: date.toLocaleDateString('ru-RU'),
    lunarDay,
    moonPhase: MOON_PHASES[moonPhase],
    zodiacSign: LUNAR_ZODIAC[zodiacSign],
    energy: getDailyEnergy(date),
    recommendations: getDailyRecommendations(date)
  };
};

/**
 * Получение следующего новолуния
 */
export const getNextNewMoon = (fromDate = new Date()) => {
  const current = new Date(fromDate);
  
  // Ищем следующее новолуние (упрощенный расчет)
  while (calculateLunarDay(current) !== 1) {
    current.setDate(current.getDate() + 1);
    if (current.getTime() - fromDate.getTime() > 30 * 24 * 60 * 60 * 1000) {
      // Защита от бесконечного цикла
      break;
    }
  }
  
  return current;
};

/**
 * Получение следующего полнолуния
 */
export const getNextFullMoon = (fromDate = new Date()) => {
  const current = new Date(fromDate);
  
  // Ищем следующее полнолуние (упрощенный расчет)
  while (calculateLunarDay(current) !== 15) {
    current.setDate(current.getDate() + 1);
    if (current.getTime() - fromDate.getTime() > 30 * 24 * 60 * 60 * 1000) {
      // Защита от бесконечного цикла
      break;
    }
  }
  
  return current;
};