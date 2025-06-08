// shared/constants/tarots.js

// Старшие арканы Таро
export const MAJOR_ARCANA = [
    {
        id: 0,
        name: 'Шут',
        englishName: 'The Fool',
        number: 0,
        element: 'Воздух',
        planet: 'Уран',
        zodiac: 'Водолей',
        keywords: ['начало', 'невинность', 'спонтанность', 'свобода'],
        meaning: 'Новые начинания, невинность, спонтанность, свободный дух',
        reversedMeaning: 'Безрассудство, неосторожность, отсутствие направления',
        description: 'Шут символизирует чистое начало, первый шаг в путешествии души.',
        imageUrl: '/images/cards/major/00-fool.jpg'
    },
    {
        id: 1,
        name: 'Маг',
        englishName: 'The Magician',
        number: 1,
        element: 'Воздух',
        planet: 'Меркурий',
        zodiac: 'Близнецы',
        keywords: ['сила воли', 'манифестация', 'ресурсы', 'действие'],
        meaning: 'Сила воли, концентрация, манифестация желаний, использование ресурсов',
        reversedMeaning: 'Манипуляции, нехватка энергии, неуверенность в себе',
        description: 'Маг обладает всеми инструментами для реализации своих планов.',
        imageUrl: '/images/cards/major/01-magician.jpg'
    },
    {
        id: 2,
        name: 'Жрица',
        englishName: 'The High Priestess',
        number: 2,
        element: 'Вода',
        planet: 'Луна',
        zodiac: 'Рак',
        keywords: ['интуиция', 'тайна', 'подсознание', 'мудрость'],
        meaning: 'Интуиция, тайные знания, внутренняя мудрость, мистицизм',
        reversedMeaning: 'Отрицание интуиции, поверхностность, секреты',
        description: 'Жрица - хранительница сакральных знаний и внутренней мудрости.',
        imageUrl: '/images/cards/major/02-high-priestess.jpg'
    },
    {
        id: 3,
        name: 'Императрица',
        englishName: 'The Empress',
        number: 3,
        element: 'Земля',
        planet: 'Венера',
        zodiac: 'Телец',
        keywords: ['плодородие', 'творчество', 'изобилие', 'материнство'],
        meaning: 'Плодородие, творческая энергия, изобилие, материнская забота',
        reversedMeaning: 'Бесплодие, зависимость, отсутствие роста',
        description: 'Императрица олицетворяет творческую силу природы и материнскую энергию.',
        imageUrl: '/images/cards/major/03-empress.jpg'
    },
    {
        id: 4,
        name: 'Император',
        englishName: 'The Emperor',
        number: 4,
        element: 'Огонь',
        planet: 'Марс',
        zodiac: 'Овен',
        keywords: ['власть', 'структура', 'отцовство', 'авторитет'],
        meaning: 'Власть, лидерство, структура, отцовская защита',
        reversedMeaning: 'Тирания, отсутствие контроля, слабость',
        description: 'Император представляет земную власть, порядок и отцовскую энергию.',
        imageUrl: '/images/cards/major/04-emperor.jpg'
    },
    {
        id: 5,
        name: 'Иерофант',
        englishName: 'The Hierophant',
        number: 5,
        element: 'Земля',
        planet: 'Венера',
        zodiac: 'Телец',
        keywords: ['традиция', 'образование', 'религия', 'соответствие'],
        meaning: 'Традиционные ценности, образование, религия, духовное руководство',
        reversedMeaning: 'Бунт против традиций, неортодоксальность, невежество',
        description: 'Иерофант - мост между земным и божественным, учитель духовных истин.',
        imageUrl: '/images/cards/major/05-hierophant.jpg'
    }
    // ... остальные карты старших арканов
];

// Масти младших арканов
export const MINOR_ARCANA_SUITS = {
    WANDS: {
        name: 'Жезлы',
        englishName: 'Wands',
        element: 'Огонь',
        keywords: ['творчество', 'страсть', 'энергия', 'рост'],
        description: 'Масть творческой энергии, амбиций и духовного роста'
    },
    CUPS: {
        name: 'Кубки',
        englishName: 'Cups',
        element: 'Вода',
        keywords: ['эмоции', 'любовь', 'отношения', 'интуиция'],
        description: 'Масть эмоций, любви, отношений и духовности'
    },
    SWORDS: {
        name: 'Мечи',
        englishName: 'Swords',
        element: 'Воздух',
        keywords: ['мысли', 'общение', 'конфликт', 'правда'],
        description: 'Масть интеллекта, общения, конфликтов и истины'
    },
    PENTACLES: {
        name: 'Пентакли',
        englishName: 'Pentacles',
        element: 'Земля',
        keywords: ['материальность', 'работа', 'деньги', 'здоровье'],
        description: 'Масть материального мира, денег, карьеры и здоровья'
    }
};

// Значения карт младших арканов
export const MINOR_ARCANA_RANKS = {
    ACE: { name: 'Туз', number: 1, meaning: 'Новые начинания, потенциал' },
    TWO: { name: 'Двойка', number: 2, meaning: 'Выбор, партнерство, баланс' },
    THREE: { name: 'Тройка', number: 3, meaning: 'Сотрудничество, развитие' },
    FOUR: { name: 'Четверка', number: 4, meaning: 'Стабильность, основание' },
    FIVE: { name: 'Пятерка', number: 5, meaning: 'Вызов, конфликт, изменение' },
    SIX: { name: 'Шестерка', number: 6, meaning: 'Гармония, помощь, память' },
    SEVEN: { name: 'Семерка', number: 7, meaning: 'Духовность, размышление' },
    EIGHT: { name: 'Восьмерка', number: 8, meaning: 'Материальный успех, мастерство' },
    NINE: { name: 'Девятка', number: 9, meaning: 'Завершение, мудрость' },
    TEN: { name: 'Десятка', number: 10, meaning: 'Кульминация, цикл завершен' },
    PAGE: { name: 'Паж', number: 11, meaning: 'Ученик, новые идеи, сообщения' },
    KNIGHT: { name: 'Рыцарь', number: 12, meaning: 'Действие, приключение, стремление' },
    QUEEN: { name: 'Королева', number: 13, meaning: 'Зрелость, интуиция, забота' },
    KING: { name: 'Король', number: 14, meaning: 'Мастерство, власть, контроль' }
};

// Элементы и их соответствия
export const ELEMENTS = {
    FIRE: {
        name: 'Огонь',
        suits: ['Жезлы'],
        keywords: ['энергия', 'страсть', 'действие', 'творчество'],
        zodiacSigns: ['Овен', 'Лев', 'Стрелец'],
        colors: ['красный', 'оранжевый', 'желтый']
    },
    WATER: {
        name: 'Вода',
        suits: ['Кубки'],
        keywords: ['эмоции', 'интуиция', 'любовь', 'подсознание'],
        zodiacSigns: ['Рак', 'Скорпион', 'Рыбы'],
        colors: ['синий', 'морской', 'фиолетовый']
    },
    AIR: {
        name: 'Воздух',
        suits: ['Мечи'],
        keywords: ['мысли', 'общение', 'логика', 'конфликт'],
        zodiacSigns: ['Близнецы', 'Весы', 'Водолей'],
        colors: ['желтый', 'белый', 'светло-голубой']
    },
    EARTH: {
        name: 'Земля',
        suits: ['Пентакли'],
        keywords: ['материальность', 'стабильность', 'практичность', 'рост'],
        zodiacSigns: ['Телец', 'Дева', 'Козерог'],
        colors: ['зеленый', 'коричневый', 'черный']
    }
};

// Астрологические соответствия
export const ASTROLOGICAL_CORRESPONDENCES = {
    PLANETS: {
        SUN: { name: 'Солнце', cards: ['Солнце'], keywords: ['энергия', 'успех', 'радость'] },
        MOON: { name: 'Луна', cards: ['Жрица', 'Луна'], keywords: ['интуиция', 'тайны', 'циклы'] },
        MERCURY: { name: 'Меркурий', cards: ['Маг'], keywords: ['общение', 'интеллект', 'торговля'] },
        VENUS: { name: 'Венера', cards: ['Императрица', 'Иерофант'], keywords: ['красота', 'любовь', 'гармония'] },
        MARS: { name: 'Марс', cards: ['Император', 'Башня'], keywords: ['действие', 'конфликт', 'энергия'] },
        JUPITER: { name: 'Юпитер', cards: ['Колесо Фортуны'], keywords: ['удача', 'экспансия', 'философия'] },
        SATURN: { name: 'Сатурн', cards: ['Мир'], keywords: ['ограничения', 'дисциплина', 'время'] }
    },
    ZODIAC_SIGNS: {
        ARIES: { name: 'Овен', element: 'Огонь', cards: ['Император'] },
        TAURUS: { name: 'Телец', element: 'Земля', cards: ['Иерофант'] },
        GEMINI: { name: 'Близнецы', element: 'Воздух', cards: ['Влюбленные'] },
        CANCER: { name: 'Рак', element: 'Вода', cards: ['Колесница'] },
        LEO: { name: 'Лев', element: 'Огонь', cards: ['Сила'] },
        VIRGO: { name: 'Дева', element: 'Земля', cards: ['Отшельник'] },
        LIBRA: { name: 'Весы', element: 'Воздух', cards: ['Правосудие'] },
        SCORPIO: { name: 'Скорпион', element: 'Вода', cards: ['Смерть'] },
        SAGITTARIUS: { name: 'Стрелец', element: 'Огонь', cards: ['Умеренность'] },
        CAPRICORN: { name: 'Козерог', element: 'Земля', cards: ['Дьявол'] },
        AQUARIUS: { name: 'Водолей', element: 'Воздух', cards: ['Звезда'] },
        PISCES: { name: 'Рыбы', element: 'Вода', cards: ['Луна'] }
    }
};

// Типы раскладов
export const SPREAD_TYPES = {
    ONE_CARD: {
        name: 'Одна карта',
        description: 'Простой расклад для быстрого совета',
        cardsCount: 1,
        positions: ['Совет дня']
    },
    THREE_CARD: {
        name: 'Три карты',
        description: 'Прошлое, настоящее, будущее',
        cardsCount: 3,
        positions: ['Прошлое', 'Настоящее', 'Будущее']
    },
    CELTIC_CROSS: {
        name: 'Кельтский крест',
        description: 'Подробный расклад на жизненную ситуацию',
        cardsCount: 10,
        positions: [
            'Суть вопроса',
            'Препятствие или помощь',
            'Далекое прошлое',
            'Недавнее прошлое',
            'Возможное будущее',
            'Ближайшее будущее',
            'Ваш подход',
            'Внешние влияния',
            'Надежды и страхи',
            'Итог'
        ]
    },
    RELATIONSHIP: {
        name: 'Отношения',
        description: 'Расклад на любовные отношения',
        cardsCount: 7,
        positions: [
            'Вы в отношениях',
            'Ваш партнер',
            'Связь между вами',
            'Что вас объединяет',
            'Что разделяет',
            'Путь развития',
            'Итог'
        ]
    }
};

// Цвета карт
export const CARD_COLORS = {
    MAJOR_ARCANA: '#8B4513', // Коричневый
    WANDS: '#FF4500',        // Красно-оранжевый
    CUPS: '#4169E1',         // Синий
    SWORDS: '#FFD700',       // Золотой
    PENTACLES: '#228B22'     // Зеленый
};