// shared/constants/tarot.js
const TAROT_CARDS = {
  major: [
    { id: 0, name: 'Шут', nameEn: 'The Fool', unicode: '🃏', element: 'air' },
    { id: 1, name: 'Маг', nameEn: 'The Magician', unicode: '🎩', element: 'fire' },
    { id: 2, name: 'Верховная Жрица', nameEn: 'The High Priestess', unicode: '🌙', element: 'water' },
    { id: 3, name: 'Императрица', nameEn: 'The Empress', unicode: '👑', element: 'earth' },
    { id: 4, name: 'Император', nameEn: 'The Emperor', unicode: '🏛️', element: 'fire' },
    { id: 5, name: 'Иерофант', nameEn: 'The Hierophant', unicode: '⛪', element: 'earth' },
    { id: 6, name: 'Влюбленные', nameEn: 'The Lovers', unicode: '💕', element: 'air' },
    { id: 7, name: 'Колесница', nameEn: 'The Chariot', unicode: '🚗', element: 'water' },
    { id: 8, name: 'Справедливость', nameEn: 'Justice', unicode: '⚖️', element: 'air' },
    { id: 9, name: 'Отшельник', nameEn: 'The Hermit', unicode: '🕯️', element: 'earth' },
    { id: 10, name: 'Колесо Фортуны', nameEn: 'Wheel of Fortune', unicode: '🎰', element: 'fire' },
    { id: 11, name: 'Сила', nameEn: 'Strength', unicode: '🦁', element: 'fire' },
    { id: 12, name: 'Повешенный', nameEn: 'The Hanged Man', unicode: '🙃', element: 'water' },
    { id: 13, name: 'Смерть', nameEn: 'Death', unicode: '💀', element: 'water' },
    { id: 14, name: 'Умеренность', nameEn: 'Temperance', unicode: '⚗️', element: 'fire' },
    { id: 15, name: 'Дьявол', nameEn: 'The Devil', unicode: '😈', element: 'earth' },
    { id: 16, name: 'Башня', nameEn: 'The Tower', unicode: '🏗️', element: 'fire' },
    { id: 17, name: 'Звезда', nameEn: 'The Star', unicode: '⭐', element: 'air' },
    { id: 18, name: 'Луна', nameEn: 'The Moon', unicode: '🌙', element: 'water' },
    { id: 19, name: 'Солнце', nameEn: 'The Sun', unicode: '☀️', element: 'fire' },
    { id: 20, name: 'Суд', nameEn: 'Judgement', unicode: '📯', element: 'fire' },
    { id: 21, name: 'Мир', nameEn: 'The World', unicode: '🌍', element: 'earth' }
  ],
  minor: {
    wands: [
      { id: 'wands_1', name: 'Туз Жезлов', nameEn: 'Ace of Wands', unicode: '🔥', suit: 'wands', number: 1 },
      { id: 'wands_2', name: 'Двойка Жезлов', nameEn: 'Two of Wands', unicode: '🔥', suit: 'wands', number: 2 },
      { id: 'wands_3', name: 'Тройка Жезлов', nameEn: 'Three of Wands', unicode: '🔥', suit: 'wands', number: 3 },
      { id: 'wands_4', name: 'Четверка Жезлов', nameEn: 'Four of Wands', unicode: '🔥', suit: 'wands', number: 4 },
      { id: 'wands_5', name: 'Пятерка Жезлов', nameEn: 'Five of Wands', unicode: '🔥', suit: 'wands', number: 5 },
      { id: 'wands_6', name: 'Шестерка Жезлов', nameEn: 'Six of Wands', unicode: '🔥', suit: 'wands', number: 6 },
      { id: 'wands_7', name: 'Семерка Жезлов', nameEn: 'Seven of Wands', unicode: '🔥', suit: 'wands', number: 7 },
      { id: 'wands_8', name: 'Восьмерка Жезлов', nameEn: 'Eight of Wands', unicode: '🔥', suit: 'wands', number: 8 },
      { id: 'wands_9', name: 'Девятка Жезлов', nameEn: 'Nine of Wands', unicode: '🔥', suit: 'wands', number: 9 },
      { id: 'wands_10', name: 'Десятка Жезлов', nameEn: 'Ten of Wands', unicode: '🔥', suit: 'wands', number: 10 },
      { id: 'wands_page', name: 'Паж Жезлов', nameEn: 'Page of Wands', unicode: '👦', suit: 'wands', court: 'page' },
      { id: 'wands_knight', name: 'Рыцарь Жезлов', nameEn: 'Knight of Wands', unicode: '🤴', suit: 'wands', court: 'knight' },
      { id: 'wands_queen', name: 'Королева Жезлов', nameEn: 'Queen of Wands', unicode: '👸', suit: 'wands', court: 'queen' },
      { id: 'wands_king', name: 'Король Жезлов', nameEn: 'King of Wands', unicode: '👑', suit: 'wands', court: 'king' }
    ],
    cups: [
      { id: 'cups_1', name: 'Туз Кубков', nameEn: 'Ace of Cups', unicode: '💧', suit: 'cups', number: 1 },
      { id: 'cups_2', name: 'Двойка Кубков', nameEn: 'Two of Cups', unicode: '💧', suit: 'cups', number: 2 },
      { id: 'cups_3', name: 'Тройка Кубков', nameEn: 'Three of Cups', unicode: '💧', suit: 'cups', number: 3 },
      { id: 'cups_4', name: 'Четверка Кубков', nameEn: 'Four of Cups', unicode: '💧', suit: 'cups', number: 4 },
      { id: 'cups_5', name: 'Пятерка Кубков', nameEn: 'Five of Cups', unicode: '💧', suit: 'cups', number: 5 },
      { id: 'cups_6', name: 'Шестерка Кубков', nameEn: 'Six of Cups', unicode: '💧', suit: 'cups', number: 6 },
      { id: 'cups_7', name: 'Семерка Кубков', nameEn: 'Seven of Cups', unicode: '💧', suit: 'cups', number: 7 },
      { id: 'cups_8', name: 'Восьмерка Кубков', nameEn: 'Eight of Cups', unicode: '💧', suit: 'cups', number: 8 },
      { id: 'cups_9', name: 'Девятка Кубков', nameEn: 'Nine of Cups', unicode: '💧', suit: 'cups', number: 9 },
      { id: 'cups_10', name: 'Десятка Кубков', nameEn: 'Ten of Cups', unicode: '💧', suit: 'cups', number: 10 },
      { id: 'cups_page', name: 'Паж Кубков', nameEn: 'Page of Cups', unicode: '👦', suit: 'cups', court: 'page' },
      { id: 'cups_knight', name: 'Рыцарь Кубков', nameEn: 'Knight of Cups', unicode: '🤴', suit: 'cups', court: 'knight' },
      { id: 'cups_queen', name: 'Королева Кубков', nameEn: 'Queen of Cups', unicode: '👸', suit: 'cups', court: 'queen' },
      { id: 'cups_king', name: 'Король Кубков', nameEn: 'King of Cups', unicode: '👑', suit: 'cups', court: 'king' }
    ],
    swords: [
      { id: 'swords_1', name: 'Туз Мечей', nameEn: 'Ace of Swords', unicode: '⚔️', suit: 'swords', number: 1 },
      { id: 'swords_2', name: 'Двойка Мечей', nameEn: 'Two of Swords', unicode: '⚔️', suit: 'swords', number: 2 },
      { id: 'swords_3', name: 'Тройка Мечей', nameEn: 'Three of Swords', unicode: '⚔️', suit: 'swords', number: 3 },
      { id: 'swords_4', name: 'Четверка Мечей', nameEn: 'Four of Swords', unicode: '⚔️', suit: 'swords', number: 4 },
      { id: 'swords_5', name: 'Пятерка Мечей', nameEn: 'Five of Swords', unicode: '⚔️', suit: 'swords', number: 5 },
      { id: 'swords_6', name: 'Шестерка Мечей', nameEn: 'Six of Swords', unicode: '⚔️', suit: 'swords', number: 6 },
      { id: 'swords_7', name: 'Семерка Мечей', nameEn: 'Seven of Swords', unicode: '⚔️', suit: 'swords', number: 7 },
      { id: 'swords_8', name: 'Восьмерка Мечей', nameEn: 'Eight of Swords', unicode: '⚔️', suit: 'swords', number: 8 },
      { id: 'swords_9', name: 'Девятка Мечей', nameEn: 'Nine of Swords', unicode: '⚔️', suit: 'swords', number: 9 },
      { id: 'swords_10', name: 'Десятка Мечей', nameEn: 'Ten of Swords', unicode: '⚔️', suit: 'swords', number: 10 },
      { id: 'swords_page', name: 'Паж Мечей', nameEn: 'Page of Swords', unicode: '👦', suit: 'swords', court: 'page' },
      { id: 'swords_knight', name: 'Рыцарь Мечей', nameEn: 'Knight of Swords', unicode: '🤴', suit: 'swords', court: 'knight' },
      { id: 'swords_queen', name: 'Королева Мечей', nameEn: 'Queen of Swords', unicode: '👸', suit: 'swords', court: 'queen' },
      { id: 'swords_king', name: 'Король Мечей', nameEn: 'King of Swords', unicode: '👑', suit: 'swords', court: 'king' }
    ],
    pentacles: [
      { id: 'pentacles_1', name: 'Туз Пентаклей', nameEn: 'Ace of Pentacles', unicode: '🌍', suit: 'pentacles', number: 1 },
      { id: 'pentacles_2', name: 'Двойка Пентаклей', nameEn: 'Two of Pentacles', unicode: '🌍', suit: 'pentacles', number: 2 },
      { id: 'pentacles_3', name: 'Тройка Пентаклей', nameEn: 'Three of Pentacles', unicode: '🌍', suit: 'pentacles', number: 3 },
      { id: 'pentacles_4', name: 'Четверка Пентаклей', nameEn: 'Four of Pentacles', unicode: '🌍', suit: 'pentacles', number: 4 },
      { id: 'pentacles_5', name: 'Пятерка Пентаклей', nameEn: 'Five of Pentacles', unicode: '🌍', suit: 'pentacles', number: 5 },
      { id: 'pentacles_6', name: 'Шестерка Пентаклей', nameEn: 'Six of Pentacles', unicode: '🌍', suit: 'pentacles', number: 6 },
      { id: 'pentacles_7', name: 'Семерка Пентаклей', nameEn: 'Seven of Pentacles', unicode: '🌍', suit: 'pentacles', number: 7 },
      { id: 'pentacles_8', name: 'Восьмерка Пентаклей', nameEn: 'Eight of Pentacles', unicode: '🌍', suit: 'pentacles', number: 8 },
      { id: 'pentacles_9', name: 'Девятка Пентаклей', nameEn: 'Nine of Pentacles', unicode: '🌍', suit: 'pentacles', number: 9 },
      { id: 'pentacles_10', name: 'Десятка Пентаклей', nameEn: 'Ten of Pentacles', unicode: '🌍', suit: 'pentacles', number: 10 },
      { id: 'pentacles_page', name: 'Паж Пентаклей', nameEn: 'Page of Pentacles', unicode: '👦', suit: 'pentacles', court: 'page' },
      { id: 'pentacles_knight', name: 'Рыцарь Пентаклей', nameEn: 'Knight of Pentacles', unicode: '🤴', suit: 'pentacles', court: 'knight' },
      { id: 'pentacles_queen', name: 'Королева Пентаклей', nameEn: 'Queen of Pentacles', unicode: '👸', suit: 'pentacles', court: 'queen' },
      { id: 'pentacles_king', name: 'Король Пентаклей', nameEn: 'King of Pentacles', unicode: '👑', suit: 'pentacles', court: 'king' }
    ]
  }
};

const SPREAD_TYPES = {
  single: {
    id: 'single',
    name: 'Одна карта',
    nameEn: 'Single Card',
    description: 'Простое гадание на одну карту',
    positions: [{ name: 'Ваша карта', meaning: 'Основной ответ на вопрос' }],
    minCards: 1,
    maxCards: 1,
    isPremium: false
  },
  three: {
    id: 'three',
    name: 'Три карты',
    nameEn: 'Three Cards',
    description: 'Прошлое, настоящее, будущее',
    positions: [
      { name: 'Прошлое', meaning: 'Что привело к текущей ситуации' },
      { name: 'Настоящее', meaning: 'Текущее состояние дел' },
      { name: 'Будущее', meaning: 'Что ждет в ближайшем будущем' }
    ],
    minCards: 3,
    maxCards: 3,
    isPremium: false
  },
  celtic: {
    id: 'celtic',
    name: 'Кельтский крест',
    nameEn: 'Celtic Cross',
    description: 'Полное и подробное гадание',
    positions: [
      { name: 'Текущая ситуация', meaning: 'Ваше положение сейчас' },
      { name: 'Препятствие', meaning: 'Что мешает достижению цели' },
      { name: 'Далекое прошлое', meaning: 'Корни ситуации' },
      { name: 'Возможное будущее', meaning: 'Что может произойти' },
      { name: 'Возможный исход', meaning: 'Вероятный результат' },
      { name: 'Ближайшее будущее', meaning: 'События в скором времени' },
      { name: 'Ваш подход', meaning: 'Как вы относитесь к ситуации' },
      { name: 'Внешние влияния', meaning: 'Влияние окружающих' },
      { name: 'Надежды и страхи', meaning: 'Ваши внутренние переживания' },
      { name: 'Финальный исход', meaning: 'Окончательный результат' }
    ],
    minCards: 10,
    maxCards: 10,
    isPremium: true
  },
  relationship: {
    id: 'relationship',
    name: 'Отношения',
    nameEn: 'Relationship',
    description: 'Гадание на отношения между людьми',
    positions: [
      { name: 'Вы', meaning: 'Ваше состояние в отношениях' },
      { name: 'Партнер', meaning: 'Состояние партнера' },
      { name: 'Отношения', meaning: 'Связь между вами' },
      { name: 'Препятствия', meaning: 'Что мешает гармонии' },
      { name: 'Совет', meaning: 'Как улучшить отношения' }
    ],
    minCards: 5,
    maxCards: 5,
    isPremium: true
  }
};

const CARD_MEANINGS = {
  major: {
    0: {
      upright: 'Новые начинания, спонтанность, свобода, оригинальность',
      reversed: 'Безрассудство, импульсивность, отсутствие планов',
      keywords: ['начало', 'свобода', 'путешествие', 'риск']
    },
    1: {
      upright: 'Сила воли, творчество, уверенность, навыки',
      reversed: 'Манипуляции, плохое планирование, неиспользованные таланты',
      keywords: ['сила', 'творчество', 'воля', 'мастерство']
    },
    2: {
      upright: 'Интуиция, тайные знания, подсознание, мистерия',
      reversed: 'Секреты, скрытая информация, отсутствие центра',
      keywords: ['интуиция', 'тайна', 'мудрость', 'женственность']
    }
  }
};

module.exports = {
  TAROT_CARDS,
  SPREAD_TYPES,
  CARD_MEANINGS
};