// client/src/utils/calculations.js

// Нумерологические расчеты
export const numerologyCalculations = {
  
  // Сокращение числа до однозначного
  reduceNumber(num) {
    while (num > 9 && num !== 11 && num !== 22 && num !== 33) {
      num = num.toString().split('').reduce((sum, digit) => sum + parseInt(digit), 0);
    }
    return num;
  },

  // Число жизненного пути
  calculateLifePath(birthDate) {
    const date = new Date(birthDate);
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    
    const daySum = this.reduceNumber(day);
    const monthSum = this.reduceNumber(month);
    const yearSum = this.reduceNumber(year);
    
    return this.reduceNumber(daySum + monthSum + yearSum);
  },

  // Число судьбы (по полному имени)
  calculateDestinyNumber(fullName) {
    const letterValues = {
      'а': 1, 'б': 2, 'в': 3, 'г': 4, 'д': 5, 'е': 6, 'ё': 6, 'ж': 7, 'з': 8, 'и': 9,
      'й': 1, 'к': 2, 'л': 3, 'м': 4, 'н': 5, 'о': 6, 'п': 7, 'р': 8, 'с': 9,
      'т': 1, 'у': 2, 'ф': 3, 'х': 4, 'ц': 5, 'ч': 6, 'ш': 7, 'щ': 8, 'ъ': 9,
      'ы': 1, 'ь': 2, 'э': 3, 'ю': 4, 'я': 5
    };

    const name = fullName.toLowerCase().replace(/[^а-яё]/g, '');
    let sum = 0;
    
    for (let char of name) {
      sum += letterValues[char] || 0;
    }
    
    return this.reduceNumber(sum);
  },

  // Число души (по гласным)
  calculateSoulNumber(fullName) {
    const vowels = 'аеёиоуыэюя';
    const letterValues = {
      'а': 1, 'е': 6, 'ё': 6, 'и': 9, 'о': 6, 'у': 2, 'ы': 1, 'э': 3, 'ю': 4, 'я': 5
    };

    const name = fullName.toLowerCase().replace(/[^а-яё]/g, '');
    let sum = 0;
    
    for (let char of name) {
      if (vowels.includes(char)) {
        sum += letterValues[char] || 0;
      }
    }
    
    return this.reduceNumber(sum);
  },

  // Число личности (по согласным)
  calculatePersonalityNumber(fullName) {
    const vowels = 'аеёиоуыэюя';
    const letterValues = {
      'б': 2, 'в': 3, 'г': 4, 'д': 5, 'ж': 7, 'з': 8, 'й': 1, 'к': 2, 'л': 3,
      'м': 4, 'н': 5, 'п': 7, 'р': 8, 'с': 9, 'т': 1, 'ф': 3, 'х': 4, 'ц': 5,
      'ч': 6, 'ш': 7, 'щ': 8, 'ъ': 9, 'ь': 2
    };

    const name = fullName.toLowerCase().replace(/[^а-яё]/g, '');
    let sum = 0;
    
    for (let char of name) {
      if (!vowels.includes(char)) {
        sum += letterValues[char] || 0;
      }
    }
    
    return this.reduceNumber(sum);
  },

  // Число дня рождения
  calculateBirthdayNumber(birthDate) {
    const date = new Date(birthDate);
    const day = date.getDate();
    return this.reduceNumber(day);
  },

  // Персональный год
  calculatePersonalYear(birthDate, targetYear = new Date().getFullYear()) {
    const date = new Date(birthDate);
    const month = date.getMonth() + 1;
    const day = date.getDate();
    
    const monthSum = this.reduceNumber(month);
    const daySum = this.reduceNumber(day);
    const yearSum = this.reduceNumber(targetYear);
    
    return this.reduceNumber(monthSum + daySum + yearSum);
  },

  // Персональный месяц
  calculatePersonalMonth(birthDate, targetMonth, targetYear = new Date().getFullYear()) {
    const personalYear = this.calculatePersonalYear(birthDate, targetYear);
    const monthNumber = this.reduceNumber(targetMonth);
    
    return this.reduceNumber(personalYear + monthNumber);
  },

  // Персональный день
  calculatePersonalDay(birthDate, targetDate) {
    const date = new Date(targetDate);
    const personalMonth = this.calculatePersonalMonth(
      birthDate, 
      date.getMonth() + 1, 
      date.getFullYear()
    );
    const dayNumber = this.reduceNumber(date.getDate());
    
    return this.reduceNumber(personalMonth + dayNumber);
  },

  // Совместимость двух чисел
  calculateCompatibility(number1, number2) {
    const compatibilityMatrix = {
      1: { 1: 85, 2: 70, 3: 90, 4: 65, 5: 95, 6: 75, 7: 60, 8: 80, 9: 85 },
      2: { 1: 70, 2: 80, 3: 75, 4: 90, 5: 65, 6: 95, 7: 70, 8: 85, 9: 60 },
      3: { 1: 90, 2: 75, 3: 85, 4: 70, 5: 95, 6: 80, 7: 85, 8: 65, 9: 90 },
      4: { 1: 65, 2: 90, 3: 70, 4: 80, 5: 60, 6: 85, 7: 75, 8: 95, 9: 65 },
      5: { 1: 95, 2: 65, 3: 95, 4: 60, 5: 85, 6: 70, 7: 90, 8: 75, 9: 95 },
      6: { 1: 75, 2: 95, 3: 80, 4: 85, 5: 70, 6: 90, 7: 65, 8: 80, 9: 75 },
      7: { 1: 60, 2: 70, 3: 85, 4: 75, 5: 90, 6: 65, 7: 95, 8: 70, 9: 85 },
      8: { 1: 80, 2: 85, 3: 65, 4: 95, 5: 75, 6: 80, 7: 70, 8: 90, 9: 60 },
      9: { 1: 85, 2: 60, 3: 90, 4: 65, 5: 95, 6: 75, 7: 85, 8: 60, 9: 95 }
    };

    return compatibilityMatrix[number1]?.[number2] || 50;
  }
};

// Астрологические расчеты
export const astroCalculations = {
  
  // Определение знака зодиака
  getZodiacSign(birthDate) {
    const date = new Date(birthDate);
    const month = date.getMonth() + 1;
    const day = date.getDate();

    const signs = [
      { name: 'Козерог', start: [12, 22], end: [1, 19] },
      { name: 'Водолей', start: [1, 20], end: [2, 18] },
      { name: 'Рыбы', start: [2, 19], end: [3, 20] },
      { name: 'Овен', start: [3, 21], end: [4, 19] },
      { name: 'Телец', start: [4, 20], end: [5, 20] },
      { name: 'Близнецы', start: [5, 21], end: [6, 20] },
      { name: 'Рак', start: [6, 21], end: [7, 22] },
      { name: 'Лев', start: [7, 23], end: [8, 22] },
      { name: 'Дева', start: [8, 23], end: [9, 22] },
      { name: 'Весы', start: [9, 23], end: [10, 22] },
      { name: 'Скорпион', start: [10, 23], end: [11, 21] },
      { name: 'Стрелец', start: [11, 22], end: [12, 21] }
    ];

    for (let sign of signs) {
      if (
        (month === sign.start[0] && day >= sign.start[1]) ||
        (month === sign.end[0] && day <= sign.end[1])
      ) {
        return sign.name;
      }
    }

    return 'Козерог'; // fallback
  },

  // Элемент знака зодиака
  getZodiacElement(sign) {
    const elements = {
      'Овен': 'Огонь', 'Лев': 'Огонь', 'Стрелец': 'Огонь',
      'Телец': 'Земля', 'Дева': 'Земля', 'Козерог': 'Земля',
      'Близнецы': 'Воздух', 'Весы': 'Воздух', 'Водолей': 'Воздух',
      'Рак': 'Вода', 'Скорпион': 'Вода', 'Рыбы': 'Вода'
    };

    return elements[sign] || 'Неизвестно';
  },

  // Качество знака зодиака
  getZodiacQuality(sign) {
    const qualities = {
      'Овен': 'Кардинальный', 'Рак': 'Кардинальный', 'Весы': 'Кардинальный', 'Козерог': 'Кардинальный',
      'Телец': 'Фиксированный', 'Лев': 'Фиксированный', 'Скорпион': 'Фиксированный', 'Водолей': 'Фиксированный',
      'Близнецы': 'Мутабельный', 'Дева': 'Мутабельный', 'Стрелец': 'Мутабельный', 'Рыбы': 'Мутабельный'
    };

    return qualities[sign] || 'Неизвестно';
  }
};

// Утилиты для работы с датами
export const dateUtils = {
  
  // Форматирование даты
  formatDate(date, format = 'dd.mm.yyyy') {
    const d = new Date(date);
    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const year = d.getFullYear();

    return format
      .replace('dd', day)
      .replace('mm', month)
      .replace('yyyy', year);
  },

  // Разница в годах
  getAgeInYears(birthDate) {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    
    if (today.getMonth() < birth.getMonth() || 
        (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  },

  // Проверка високосного года
  isLeapYear(year) {
    return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
  },

  // Получение дня недели
  getDayOfWeek(date) {
    const days = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];
    return days[new Date(date).getDay()];
  }
};

// Утилиты для работы с цветами
export const colorUtils = {
  
  // Получение цвета по числу
  getColorByNumber(number) {
    const colors = {
      1: '#FF4444', // Красный
      2: '#FF8800', // Оранжевый  
      3: '#FFDD00', // Желтый
      4: '#44FF44', // Зеленый
      5: '#00AAFF', // Голубой
      6: '#4444FF', // Синий
      7: '#8844FF', // Фиолетовый
      8: '#FF44AA', // Розовый
      9: '#FFFFFF'  // Белый
    };

    return colors[number] || '#888888';
  },

  // Получение цвета знака зодиака
  getZodiacColor(sign) {
    const colors = {
      'Овен': '#FF4444',
      'Телец': '#44AA44',
      'Близнецы': '#FFAA00',
      'Рак': '#88CCEE',
      'Лев': '#FFD700',
      'Дева': '#8FBC8F',
      'Весы': '#FFB6C1',
      'Скорпион': '#8B0000',
      'Стрелец': '#9370DB',
      'Козерог': '#2F4F4F',
      'Водолей': '#00CED1',
      'Рыбы': '#9ACD32'
    };

    return colors[sign] || '#888888';
  }
};