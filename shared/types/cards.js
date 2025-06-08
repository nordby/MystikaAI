// shared/types/cards.js

/**
 * Типы карт
 */
const CARD_TYPES = {
    MAJOR_ARCANA: 'major_arcana',
    MINOR_ARCANA: 'minor_arcana',
    COURT_CARD: 'court_card'
};

/**
 * Масти младших арканов
 */
const SUITS = {
    WANDS: 'wands',        // Жезлы
    CUPS: 'cups',          // Кубки
    SWORDS: 'swords',      // Мечи
    PENTACLES: 'pentacles' // Пентакли
};

/**
 * Придворные карты
 */
const COURT_RANKS = {
    PAGE: 'page',     // Паж
    KNIGHT: 'knight', // Рыцарь
    QUEEN: 'queen',   // Королева
    KING: 'king'      // Король
};

/**
 * Элементы стихий
 */
const ELEMENTS = {
    FIRE: 'fire',       // Огонь
    WATER: 'water',     // Вода
    AIR: 'air',         // Воздух
    EARTH: 'earth'      // Земля
};

/**
 * Соответствие мастей элементам
 */
const SUIT_ELEMENTS = {
    [SUITS.WANDS]: ELEMENTS.FIRE,
    [SUITS.CUPS]: ELEMENTS.WATER,
    [SUITS.SWORDS]: ELEMENTS.AIR,
    [SUITS.PENTACLES]: ELEMENTS.EARTH
};

/**
 * Астрологические соответствия
 */
const ASTROLOGICAL_SIGNS = {
    ARIES: 'aries',
    TAURUS: 'taurus',
    GEMINI: 'gemini',
    CANCER: 'cancer',
    LEO: 'leo',
    VIRGO: 'virgo',
    LIBRA: 'libra',
    SCORPIO: 'scorpio',
    SAGITTARIUS: 'sagittarius',
    CAPRICORN: 'capricorn',
    AQUARIUS: 'aquarius',
    PISCES: 'pisces'
};

/**
 * Планеты
 */
const PLANETS = {
    SUN: 'sun',
    MOON: 'moon',
    MERCURY: 'mercury',
    VENUS: 'venus',
    MARS: 'mars',
    JUPITER: 'jupiter',
    SATURN: 'saturn',
    URANUS: 'uranus',
    NEPTUNE: 'neptune',
    PLUTO: 'pluto'
};

/**
 * Типы позиций карт
 */
const CARD_ORIENTATIONS = {
    UPRIGHT: 'upright',   // Прямая
    REVERSED: 'reversed'  // Перевернутая
};

/**
 * Типы гаданий
 */
const READING_TYPES = {
    DAILY: 'daily',           // Дневная карта
    ONE_CARD: 'one_card',     // Одна карта
    THREE_CARD: 'three_card', // Три карты
    CELTIC_CROSS: 'celtic_cross', // Кельтский крест
    CUSTOM: 'custom',         // Пользовательский расклад
    RELATIONSHIP: 'relationship', // Отношения
    CAREER: 'career',         // Карьера
    HEALTH: 'health',         // Здоровье
    SPIRITUAL: 'spiritual'    // Духовность
};

/**
 * Статусы гаданий
 */
const READING_STATUS = {
    PENDING: 'pending',     // Ожидает
    IN_PROGRESS: 'in_progress', // В процессе
    COMPLETED: 'completed', // Завершено
    CANCELLED: 'cancelled'  // Отменено
};

/**
 * Схема карты
 */
const CARD_SCHEMA = {
    id: 'uuid',
    cardNumber: 'number',
    cardName: 'string',
    cardNameEn: 'string',
    suit: SUITS,
    cardType: CARD_TYPES,
    courtRank: COURT_RANKS,
    element: ELEMENTS,
    astrologicalSign: ASTROLOGICAL_SIGNS,
    planet: PLANETS,
    keywordsUpright: 'string[]',
    keywordsReversed: 'string[]',
    meaningUpright: 'string',
    meaningReversed: 'string',
    descriptionShort: 'string',
    descriptionLong: 'string',
    symbolism: 'string',
    advice: 'string',
    imageUrl: 'string',
    imageAlt: 'string',
    metadata: {
        difficulty: 'number', // 1-5
        popularity: 'number', // 0-100
        category: 'string[]',
        tags: 'string[]'
    },
    createdAt: 'date',
    updatedAt: 'date'
};

/**
 * Схема гадания
 */
const READING_SCHEMA = {
    id: 'uuid',
    userId: 'uuid',
    type: READING_TYPES,
    status: READING_STATUS,
    question: 'string?',
    spreadId: 'string?',
    cards: [{
        cardId: 'uuid',
        position: 'number',
        orientation: CARD_ORIENTATIONS,
        interpretation: 'string',
        positionMeaning: 'string?'
    }],
    aiInterpretation: 'string?',
    notes: 'string?',
    tags: 'string[]',
    isPublic: 'boolean',
    createdAt: 'date',
    updatedAt: 'date'
};

/**
 * Методы работы с картами
 */
const CARD_METHODS = {
    /**
     * Получение полного имени карты
     */
    getFullName: (card) => {
        if (card.cardType === CARD_TYPES.MAJOR_ARCANA) {
            return card.cardName;
        }
        
        if (card.cardType === CARD_TYPES.COURT_CARD) {
            return `${card.courtRank} ${card.suit}`;
        }
        
        return `${card.cardNumber} ${card.suit}`;
    },

    /**
     * Получение элемента карты
     */
    getElement: (card) => {
        if (card.element) {
            return card.element;
        }
        
        return SUIT_ELEMENTS[card.suit] || null;
    },

    /**
     * Получение значения карты в зависимости от ориентации
     */
    getMeaning: (card, isReversed = false) => {
        return isReversed ? card.meaningReversed : card.meaningUpright;
    },

    /**
     * Получение ключевых слов
     */
    getKeywords: (card, isReversed = false) => {
        return isReversed ? card.keywordsReversed : card.keywordsUpright;
    },

    /**
     * Проверка совместимости карт
     */
    areCompatible: (card1, card2) => {
        const element1 = CARD_METHODS.getElement(card1);
        const element2 = CARD_METHODS.getElement(card2);
        
        const compatibleElements = {
            [ELEMENTS.FIRE]: [ELEMENTS.AIR, ELEMENTS.FIRE],
            [ELEMENTS.WATER]: [ELEMENTS.EARTH, ELEMENTS.WATER],
            [ELEMENTS.AIR]: [ELEMENTS.FIRE, ELEMENTS.AIR],
            [ELEMENTS.EARTH]: [ELEMENTS.WATER, ELEMENTS.EARTH]
        };
        
        return compatibleElements[element1]?.includes(element2) || false;
    },

    /**
     * Генерация URL изображения карты
     */
    getImageUrl: (card, isReversed = false) => {
        const baseUrl = card.imageUrl;
        return isReversed ? `${baseUrl}?reversed=true` : baseUrl;
    },

    /**
     * Получение сложности карты
     */
    getDifficulty: (card) => {
        if (card.cardType === CARD_TYPES.MAJOR_ARCANA) {
            return 3; // Средняя сложность
        }
        
        if (card.cardType === CARD_TYPES.COURT_CARD) {
            return 4; // Высокая сложность
        }
        
        return 2; // Низкая сложность
    }
};

/**
 * Методы работы с гаданиями
 */
const READING_METHODS = {
    /**
     * Расчет общей энергии расклада
     */
    calculateOverallEnergy: (reading) => {
        const cards = reading.cards || [];
        if (cards.length === 0) return null;
        
        const elements = cards.map(cardReading => {
            // Здесь нужно получить карту по cardId
            // Упрощенная версия
            return 'neutral';
        });
        
        // Логика расчета общей энергии
        return 'balanced';
    },

    /**
     * Получение основной темы расклада
     */
    getMainTheme: (reading) => {
        const themes = {
            [READING_TYPES.DAILY]: 'Энергия дня',
            [READING_TYPES.RELATIONSHIP]: 'Отношения',
            [READING_TYPES.CAREER]: 'Карьера и работа',
            [READING_TYPES.HEALTH]: 'Здоровье и благополучие',
            [READING_TYPES.SPIRITUAL]: 'Духовное развитие',
            [READING_TYPES.CELTIC_CROSS]: 'Общий жизненный расклад'
        };
        
        return themes[reading.type] || 'Общее гадание';
    },

    /**
     * Проверка завершенности гадания
     */
    isComplete: (reading) => {
        return reading.status === READING_STATUS.COMPLETED && 
               reading.cards && 
               reading.cards.length > 0;
    }
};

/**
 * События карт и гаданий
 */
const CARD_EVENTS = {
    CARD_DRAWN: 'card.drawn',
    READING_CREATED: 'reading.created',
    READING_COMPLETED: 'reading.completed',
    INTERPRETATION_GENERATED: 'interpretation.generated',
    SPREAD_SHARED: 'spread.shared'
};

module.exports = {
    CARD_TYPES,
    SUITS,
    COURT_RANKS,
    ELEMENTS,
    SUIT_ELEMENTS,
    ASTROLOGICAL_SIGNS,
    PLANETS,
    CARD_ORIENTATIONS,
    READING_TYPES,
    READING_STATUS,
    CARD_SCHEMA,
    READING_SCHEMA,
    CARD_METHODS,
    READING_METHODS,
    CARD_EVENTS
};