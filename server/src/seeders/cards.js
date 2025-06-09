// server/src/seeders/cards.js
const { TAROT_CARDS } = require('../../../shared/constants/tarot');

/**
 * Заполнение базы данных картами таро
 */
async function seedCards(Card) {
  try {
    console.log('Starting cards seeding...');

    // Проверяем, есть ли уже карты в базе
    const existingCardsCount = await Card.count();
    if (existingCardsCount > 0) {
      console.log(`Cards already exist in database: ${existingCardsCount} cards`);
      return;
    }

    const cardsToCreate = [];

    // Старшие арканы
    TAROT_CARDS.major.forEach(card => {
      cardsToCreate.push({
        tarotId: `major_${card.id}`,
        name: card.name,
        nameEn: card.nameEn,
        arcana: 'major',
        suit: null,
        number: card.id,
        court: null,
        element: card.element,
        keywords: {
          upright: ['энергия', 'сила', 'перемены'],
          reversed: ['блокировка', 'задержка', 'внутренние конфликты']
        },
        meanings: {
          upright: {
            general: `Карта ${card.name} символизирует важный этап духовного развития`,
            love: `В любви ${card.name} указывает на глубокие чувства`,
            career: `В карьере эта карта означает важные изменения`,
            health: `Для здоровья карта предвещает восстановление энергии`,
            spiritual: `Духовно карта говорит о росте и развитии`
          },
          reversed: {
            general: `В перевернутом виде ${card.name} указывает на внутренние блоки`,
            love: `В любви может означать недопонимание`,
            career: `В работе - препятствия и задержки`,
            health: `Нужно обратить внимание на самочувствие`,
            spiritual: `Время для внутренней работы`
          }
        },
        description: `Карта ${card.name} - одна из важнейших в колоде Таро`,
        imageUrl: `/images/cards/${card.nameEn.toLowerCase().replace(/\s+/g, '_')}.jpg`,
        isActive: true,
        sortOrder: card.id
      });
    });

    // Младшие арканы
    Object.keys(TAROT_CARDS.minor).forEach(suitName => {
      TAROT_CARDS.minor[suitName].forEach(card => {
        cardsToCreate.push({
          tarotId: card.id,
          name: card.name,
          nameEn: card.nameEn,
          arcana: 'minor',
          suit: card.suit,
          number: card.number || null,
          court: card.court || null,
          element: getSuitElement(card.suit),
          keywords: {
            upright: getSuitKeywords(card.suit, 'upright'),
            reversed: getSuitKeywords(card.suit, 'reversed')
          },
          meanings: {
            upright: {
              general: `${card.name} в прямом положении означает ${getSuitMeaning(card.suit, 'upright')}`,
              love: getSuitLoveMeaning(card.suit, 'upright'),
              career: getSuitCareerMeaning(card.suit, 'upright'),
              health: getSuitHealthMeaning(card.suit, 'upright'),
              spiritual: getSuitSpiritualMeaning(card.suit, 'upright')
            },
            reversed: {
              general: `${card.name} в обратном положении означает ${getSuitMeaning(card.suit, 'reversed')}`,
              love: getSuitLoveMeaning(card.suit, 'reversed'),
              career: getSuitCareerMeaning(card.suit, 'reversed'),
              health: getSuitHealthMeaning(card.suit, 'reversed'),
              spiritual: getSuitSpiritualMeaning(card.suit, 'reversed')
            }
          },
          description: `${card.name} относится к масти ${getSuitNameRu(card.suit)}`,
          imageUrl: `/images/cards/${card.nameEn.toLowerCase().replace(/\s+/g, '_')}.jpg`,
          isActive: true,
          sortOrder: getSuitOrder(card.suit) * 100 + (card.number || getCourtOrder(card.court))
        });
      });
    });

    // Массовое создание карт
    await Card.bulkCreate(cardsToCreate);
    
    console.log(`Successfully seeded ${cardsToCreate.length} cards`);
    
  } catch (error) {
    console.error('Error seeding cards:', error);
    throw error;
  }
}

// Вспомогательные методы
function getSuitElement(suit) {
  const elements = {
    'wands': 'fire',
    'cups': 'water',
    'swords': 'air',
    'pentacles': 'earth'
  };
  return elements[suit];
}

function getSuitKeywords(suit, position) {
  const keywords = {
    'wands': {
      upright: ['энергия', 'страсть', 'творчество', 'действие'],
      reversed: ['выгорание', 'импульсивность', 'застой']
    },
    'cups': {
      upright: ['эмоции', 'любовь', 'интуиция', 'духовность'],
      reversed: ['эмоциональные блоки', 'иллюзии', 'разочарование']
    },
    'swords': {
      upright: ['мысли', 'общение', 'правда', 'ясность'],
      reversed: ['конфликты', 'ментальные блоки', 'ложь']
    },
    'pentacles': {
      upright: ['материальное', 'стабильность', 'практичность', 'ресурсы'],
      reversed: ['финансовые проблемы', 'жадность', 'потери']
    }
  };
  return keywords[suit][position];
}

function getSuitMeaning(suit, position) {
  const meanings = {
    'wands': {
      upright: 'активную энергию и творческие начинания',
      reversed: 'блокировки в энергии и недостаток мотивации'
    },
    'cups': {
      upright: 'эмоциональное благополучие и гармонию в отношениях',
      reversed: 'эмоциональные трудности и разочарования'
    },
    'swords': {
      upright: 'ясность мысли и правильные решения',
      reversed: 'ментальные конфликты и путаницу'
    },
    'pentacles': {
      upright: 'материальную стабильность и практические достижения',
      reversed: 'финансовые трудности и потерю ресурсов'
    }
  };
  return meanings[suit][position];
}

function getSuitLoveMeaning(suit, position) {
  const meanings = {
    'wands': {
      upright: 'страстные отношения и новые романы',
      reversed: 'охлаждение чувств и конфликты'
    },
    'cups': {
      upright: 'глубокую любовь и эмоциональную близость',
      reversed: 'проблемы в отношениях и недопонимание'
    },
    'swords': {
      upright: 'честность в отношениях и ясные намерения',
      reversed: 'ссоры и болезненные разрывы'
    },
    'pentacles': {
      upright: 'стабильные отношения и совместные планы',
      reversed: 'материальные разногласия в паре'
    }
  };
  return meanings[suit][position];
}

function getSuitCareerMeaning(suit, position) {
  const meanings = {
    'wands': {
      upright: 'карьерный рост и новые проекты',
      reversed: 'профессиональное выгорание и препятствия'
    },
    'cups': {
      upright: 'творческую работу и коллективную гармонию',
      reversed: 'конфликты с коллегами и неудовлетворенность'
    },
    'swords': {
      upright: 'интеллектуальные задачи и лидерство',
      reversed: 'рабочие конфликты и стрессы'
    },
    'pentacles': {
      upright: 'финансовую стабильность и материальный успех',
      reversed: 'денежные проблемы и потерю работы'
    }
  };
  return meanings[suit][position];
}

function getSuitHealthMeaning(suit, position) {
  const meanings = {
    'wands': {
      upright: 'высокую энергию и физическую активность',
      reversed: 'усталость и недостаток сил'
    },
    'cups': {
      upright: 'эмоциональное здоровье и душевное равновесие',
      reversed: 'депрессию и эмоциональные расстройства'
    },
    'swords': {
      upright: 'ментальную ясность и хорошую концентрацию',
      reversed: 'стресс и нервные расстройства'
    },
    'pentacles': {
      upright: 'физическое здоровье и материальное благополучие',
      reversed: 'проблемы со здоровьем и материальные трудности'
    }
  };
  return meanings[suit][position];
}

function getSuitSpiritualMeaning(suit, position) {
  const meanings = {
    'wands': {
      upright: 'духовную энергию и внутренний огонь',
      reversed: 'духовную блокировку и потерю цели'
    },
    'cups': {
      upright: 'интуитивное развитие и эмоциональную мудрость',
      reversed: 'духовную путаницу и иллюзии'
    },
    'swords': {
      upright: 'ментальную дисциплину и поиск истины',
      reversed: 'духовные сомнения и ментальный хаос'
    },
    'pentacles': {
      upright: 'заземление и связь с материальным миром',
      reversed: 'отрыв от реальности и духовную нестабильность'
    }
  };
  return meanings[suit][position];
}

function getSuitNameRu(suit) {
  const names = {
    'wands': 'Жезлов',
    'cups': 'Кубков',
    'swords': 'Мечей',
    'pentacles': 'Пентаклей'
  };
  return names[suit];
}

function getSuitOrder(suit) {
  const orders = {
    'wands': 1,
    'cups': 2,
    'swords': 3,
    'pentacles': 4
  };
  return orders[suit];
}

function getCourtOrder(court) {
  if (!court) return 0;
  const orders = {
    'page': 11,
    'knight': 12,
    'queen': 13,
    'king': 14
  };
  return orders[court];
}

module.exports = { seedCards, getSuitElement, getSuitKeywords, getSuitMeaning, getSuitLoveMeaning, getSuitCareerMeaning, getSuitHealthMeaning, getSuitSpiritualMeaning, getSuitNameRu, getSuitOrder, getCourtOrder };