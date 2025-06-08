const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Card = sequelize.define('Card', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: {
          msg: 'Card name cannot be empty'
        },
        len: {
          args: [1, 100],
          msg: 'Card name must be between 1 and 100 characters'
        }
      }
    },
    nameTranslations: {
      type: DataTypes.JSONB,
      defaultValue: {},
      comment: 'Card name translations for different languages'
    },
    suit: {
      type: DataTypes.ENUM('major', 'cups', 'pentacles', 'swords', 'wands'),
      allowNull: false,
      validate: {
        notEmpty: {
          msg: 'Card suit is required'
        }
      }
    },
    rank: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: {
          args: 0,
          msg: 'Rank must be 0 or greater'
        },
        max: {
          args: 21,
          msg: 'Rank must be 21 or less for Major Arcana'
        }
      }
    },
    type: {
      type: DataTypes.ENUM('major', 'minor'),
      allowNull: false,
      validate: {
        notEmpty: {
          msg: 'Card type is required'
        }
      }
    },
    number: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Card number in the deck (0-77)'
    },
    keywords: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: [],
      comment: 'Array of keywords associated with the card'
    },
    element: {
      type: DataTypes.ENUM('fire', 'water', 'earth', 'air', 'spirit'),
      allowNull: true,
      comment: 'Elemental association of the card'
    },
    astrology: {
      type: DataTypes.JSONB,
      defaultValue: {},
      comment: 'Astrological associations (planet, sign, etc.)'
    },
    numerology: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Numerological value of the card'
    },
    
    // Meanings
    meaningUpright: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: {
          msg: 'Upright meaning is required'
        }
      }
    },
    meaningReversed: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: {
          msg: 'Reversed meaning is required'
        }
      }
    },
    meaningLove: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Specific meaning for love readings'
    },
    meaningCareer: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Specific meaning for career readings'
    },
    meaningFinance: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Specific meaning for financial readings'
    },
    meaningHealth: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Specific meaning for health readings'
    },
    meaningSpiritual: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Specific meaning for spiritual readings'
    },
    
    // Translations for meanings
    meaningTranslations: {
      type: DataTypes.JSONB,
      defaultValue: {},
      comment: 'Translations of meanings in different languages'
    },
    
    // Images
    imageUpright: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        isUrl: {
          msg: 'Upright image must be a valid URL'
        }
      }
    },
    imageReversed: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        isUrl: {
          msg: 'Reversed image must be a valid URL'
        }
      }
    },
    imageAlt: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Alt text for accessibility'
    },
    
    // Symbolism and interpretation
    symbolism: {
      type: DataTypes.JSONB,
      defaultValue: {},
      comment: 'Detailed symbolism explanations'
    },
    questionsToAsk: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: [],
      comment: 'Questions to contemplate when this card appears'
    },
    affirmations: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: [],
      comment: 'Positive affirmations related to this card'
    },
    
    // Metadata
    difficulty: {
      type: DataTypes.ENUM('beginner', 'intermediate', 'advanced'),
      defaultValue: 'beginner',
      comment: 'Interpretation difficulty level'
    },
    popularity: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: 'How often this card appears in readings'
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      comment: 'Whether this card is active in the deck'
    },
    
    // AI and machine learning
    aiKeywords: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: [],
      comment: 'AI-generated keywords for better interpretation'
    },
    sentimentScore: {
      type: DataTypes.FLOAT,
      allowNull: true,
      validate: {
        min: -1,
        max: 1
      },
      comment: 'Sentiment analysis score (-1 to 1)'
    },
    complexityScore: {
      type: DataTypes.FLOAT,
      allowNull: true,
      validate: {
        min: 0,
        max: 10
      },
      comment: 'Interpretation complexity score (0-10)'
    },
    
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    updatedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'cards',
    timestamps: true,
    indexes: [
      {
        fields: ['suit']
      },
      {
        fields: ['type']
      },
      {
        fields: ['rank']
      },
      {
        fields: ['number']
      },
      {
        unique: true,
        fields: ['suit', 'rank'],
        name: 'unique_suit_rank'
      },
      {
        fields: ['keywords'],
        using: 'gin'
      },
      {
        fields: ['isActive']
      },
      {
        fields: ['popularity']
      }
    ]
  });

  // Instance methods
  Card.prototype.getMeaning = function(position = 'upright', context = 'general') {
    const meanings = {
      upright: this.meaningUpright,
      reversed: this.meaningReversed,
      love: this.meaningLove,
      career: this.meaningCareer,
      finance: this.meaningFinance,
      health: this.meaningHealth,
      spiritual: this.meaningSpiritual
    };

    return meanings[context] || meanings[position] || this.meaningUpright;
  };

  Card.prototype.getTranslatedName = function(language = 'en') {
    if (language === 'en' || !this.nameTranslations[language]) {
      return this.name;
    }
    return this.nameTranslations[language];
  };

  Card.prototype.getTranslatedMeaning = function(position = 'upright', language = 'en') {
    if (language === 'en' || !this.meaningTranslations[language]) {
      return this.getMeaning(position);
    }
    
    const translations = this.meaningTranslations[language];
    return translations[`meaning${position.charAt(0).toUpperCase() + position.slice(1)}`] || this.getMeaning(position);
  };

  Card.prototype.getImage = function(reversed = false) {
    if (reversed && this.imageReversed) {
      return this.imageReversed;
    }
    return this.imageUpright || `/images/cards/${this.suit}/${this.name.toLowerCase().replace(/\s+/g, '-')}.jpg`;
  };

  Card.prototype.incrementPopularity = async function() {
    this.popularity += 1;
    await this.save();
  };

  Card.prototype.getAstrologyInfo = function() {
    return {
      planet: this.astrology.planet || null,
      sign: this.astrology.sign || null,
      house: this.astrology.house || null,
      ...this.astrology
    };
  };

  Card.prototype.getElementalInfo = function() {
    const elementalMappings = {
      major: 'spirit',
      cups: 'water',
      pentacles: 'earth',
      swords: 'air',
      wands: 'fire'
    };

    return {
      element: this.element || elementalMappings[this.suit],
      suit: this.suit,
      type: this.type
    };
  };

  Card.prototype.generateInterpretation = function(position = 'upright', context = 'general', question = '') {
    const meaning = this.getMeaning(position, context);
    const keywords = this.keywords.slice(0, 3).join(', ');
    
    let interpretation = `The ${this.name} `;
    
    if (position === 'reversed') {
      interpretation += '(reversed) ';
    }
    
    interpretation += `suggests ${meaning.toLowerCase()}`;
    
    if (keywords) {
      interpretation += `. Key themes include: ${keywords}.`;
    }
    
    if (question) {
      interpretation += ` In relation to your question about "${question}", this card encourages you to consider these aspects carefully.`;
    }
    
    return interpretation;
  };

  Card.prototype.toJSON = function() {
    const values = Object.assign({}, this.get());
    
    // Add computed properties
    values.meaning = {
      upright: this.meaningUpright,
      reversed: this.meaningReversed,
      love: this.meaningLove,
      career: this.meaningCareer,
      finance: this.meaningFinance,
      health: this.meaningHealth,
      spiritual: this.meaningSpiritual
    };
    
    values.images = {
      upright: this.getImage(false),
      reversed: this.getImage(true)
    };
    
    values.elemental = this.getElementalInfo();
    values.astrology = this.getAstrologyInfo();
    
    return values;
  };

  // Class methods
  Card.findBySuit = function(suit) {
    return this.findAll({ 
      where: { suit, isActive: true },
      order: [['rank', 'ASC']]
    });
  };

  Card.findMajorArcana = function() {
    return this.findAll({ 
      where: { type: 'major', isActive: true },
      order: [['rank', 'ASC']]
    });
  };

  Card.findMinorArcana = function() {
    return this.findAll({ 
      where: { type: 'minor', isActive: true },
      order: [['suit', 'ASC'], ['rank', 'ASC']]
    });
  };

  Card.findByKeyword = function(keyword) {
    return this.findAll({
      where: {
        keywords: {
          [sequelize.Sequelize.Op.contains]: [keyword]
        },
        isActive: true
      }
    });
  };

  Card.getRandomCard = function() {
    return this.findOne({
      where: { isActive: true },
      order: sequelize.random()
    });
  };

  Card.getRandomCards = function(count = 1) {
    return this.findAll({
      where: { isActive: true },
      order: sequelize.random(),
      limit: count
    });
  };

  Card.getPopularCards = function(limit = 10) {
    return this.findAll({
      where: { isActive: true },
      order: [['popularity', 'DESC']],
      limit
    });
  };

  Card.searchCards = function(query) {
    return this.findAll({
      where: {
        [sequelize.Sequelize.Op.or]: [
          {
            name: {
              [sequelize.Sequelize.Op.iLike]: `%${query}%`
            }
          },
          {
            keywords: {
              [sequelize.Sequelize.Op.contains]: [query]
            }
          },
          {
            meaningUpright: {
              [sequelize.Sequelize.Op.iLike]: `%${query}%`
            }
          }
        ],
        isActive: true
      }
    });
  };

  // Associations
  Card.associate = function(models) {
    Card.hasMany(models.ReadingCard, {
      foreignKey: 'cardId',
      as: 'readingCards'
    });
    
    Card.belongsToMany(models.Reading, {
      through: models.ReadingCard,
      foreignKey: 'cardId',
      as: 'readings'
    });
  };

  return Card;
};