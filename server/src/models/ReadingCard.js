const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ReadingCard = sequelize.define('ReadingCard', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    readingId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'readings',
        key: 'id'
      }
    },
    cardId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'cards',
        key: 'id'
      }
    },
    position: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: {
          args: 0,
          msg: 'Position must be 0 or greater'
        }
      },
      comment: 'Position of card in the spread (0-based index)'
    },
    positionName: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        len: {
          args: [1, 100],
          msg: 'Position name must be between 1 and 100 characters'
        }
      },
      comment: 'Name of the position (e.g., "Past", "Present", "Future")'
    },
    isReversed: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'Whether the card is drawn in reversed position'
    },
    
    // Card-specific interpretation
    interpretation: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Specific interpretation for this card in this reading'
    },
    personalNotes: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'User personal notes about this card'
    },
    
    // Context and meaning
    contextualMeaning: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Meaning in the context of the specific position'
    },
    connectionToQuestion: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'How this card relates to the reading question'
    },
    
    // AI and automation
    aiInterpretation: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'AI-generated interpretation'
    },
    aiConfidence: {
      type: DataTypes.FLOAT,
      allowNull: true,
      validate: {
        min: 0,
        max: 1
      },
      comment: 'AI confidence score for this interpretation'
    },
    
    // Timing and interaction
    revealedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'When this card was revealed in the reading'
    },
    focusTime: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Time spent focusing on this card (in seconds)'
    },
    clickCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: 'Number of times this card was clicked/interacted with'
    },
    
    // Visual and presentation
    x: {
      type: DataTypes.FLOAT,
      allowNull: true,
      comment: 'X coordinate for card positioning'
    },
    y: {
      type: DataTypes.FLOAT,
      allowNull: true,
      comment: 'Y coordinate for card positioning'
    },
    rotation: {
      type: DataTypes.FLOAT,
      defaultValue: 0,
      comment: 'Card rotation angle in degrees'
    },
    scale: {
      type: DataTypes.FLOAT,
      defaultValue: 1.0,
      comment: 'Card scale factor'
    },
    
    // Metadata
    drawOrder: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Order in which the card was drawn (different from position)'
    },
    significance: {
      type: DataTypes.ENUM('low', 'medium', 'high', 'critical'),
      allowNull: true,
      comment: 'Assessed significance of this card in the reading'
    },
    dominance: {
      type: DataTypes.FLOAT,
      allowNull: true,
      validate: {
        min: 0,
        max: 1
      },
      comment: 'How dominant this card is in the overall reading (0-1)'
    },
    
    // User feedback
    userRating: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 1,
        max: 5
      },
      comment: 'User rating for accuracy of this card (1-5)'
    },
    resonance: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 1,
        max: 5
      },
      comment: 'How much this card resonated with the user (1-5)'
    },
    
    // Connections and relationships
    relatedCards: {
      type: DataTypes.ARRAY(DataTypes.UUID),
      defaultValue: [],
      comment: 'IDs of other cards in this reading that relate to this one'
    },
    
    // Additional context
    emotions: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: [],
      comment: 'Emotions associated with this card in this reading'
    },
    keywords: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: [],
      comment: 'Contextual keywords for this card in this reading'
    },
    themes: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: [],
      comment: 'Themes this card represents in this reading'
    },
    
    // Follow-up and tracking
    actionItems: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: [],
      comment: 'Action items suggested by this card'
    },
    followUpQuestions: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: [],
      comment: 'Questions for further contemplation'
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
    tableName: 'reading_cards',
    timestamps: true,
    indexes: [
      {
        fields: ['readingId']
      },
      {
        fields: ['cardId']
      },
      {
        fields: ['position']
      },
      {
        unique: true,
        fields: ['readingId', 'position'],
        name: 'unique_reading_position'
      },
      {
        fields: ['isReversed']
      },
      {
        fields: ['significance']
      },
      {
        fields: ['drawOrder']
      },
      {
        fields: ['revealedAt']
      }
    ]
  });

  // Instance methods
  ReadingCard.prototype.getEffectiveMeaning = function() {
    // Return contextual meaning if available, otherwise use card's meaning
    if (this.contextualMeaning) {
      return this.contextualMeaning;
    }
    
    if (this.card) {
      return this.card.getMeaning(this.isReversed ? 'reversed' : 'upright');
    }
    
    return null;
  };

  ReadingCard.prototype.getFinalInterpretation = function() {
    // Return user interpretation, AI interpretation, or contextual meaning in that order
    return this.interpretation || this.aiInterpretation || this.getEffectiveMeaning();
  };

  ReadingCard.prototype.incrementClickCount = async function() {
    this.clickCount += 1;
    await this.save();
  };

  ReadingCard.prototype.recordFocusTime = async function(seconds) {
    this.focusTime = (this.focusTime || 0) + seconds;
    await this.save();
  };

  ReadingCard.prototype.addRelatedCard = async function(cardId) {
    if (!this.relatedCards.includes(cardId)) {
      this.relatedCards = [...this.relatedCards, cardId];
      await this.save();
    }
  };

  ReadingCard.prototype.removeRelatedCard = async function(cardId) {
    this.relatedCards = this.relatedCards.filter(id => id !== cardId);
    await this.save();
  };

  ReadingCard.prototype.addKeyword = async function(keyword) {
    if (!this.keywords.includes(keyword)) {
      this.keywords = [...this.keywords, keyword];
      await this.save();
    }
  };

  ReadingCard.prototype.addTheme = async function(theme) {
    if (!this.themes.includes(theme)) {
      this.themes = [...this.themes, theme];
      await this.save();
    }
  };

  ReadingCard.prototype.addActionItem = async function(action) {
    if (!this.actionItems.includes(action)) {
      this.actionItems = [...this.actionItems, action];
      await this.save();
    }
  };

  ReadingCard.prototype.reveal = async function() {
    this.revealedAt = new Date();
    await this.save();
  };

  ReadingCard.prototype.setPosition = async function(x, y, rotation = 0, scale = 1.0) {
    this.x = x;
    this.y = y;
    this.rotation = rotation;
    this.scale = scale;
    await this.save();
  };

  ReadingCard.prototype.updateRating = async function(rating, resonance = null) {
    this.userRating = rating;
    if (resonance !== null) {
      this.resonance = resonance;
    }
    await this.save();
  };

  ReadingCard.prototype.generateContextualInterpretation = function(question = '', otherCards = []) {
    if (!this.card) return null;

    let interpretation = this.getFinalInterpretation();
    
    if (this.positionName) {
      interpretation = `In the ${this.positionName} position: ${interpretation}`;
    }
    
    if (question) {
      interpretation += ` This relates to your question about "${question}" by suggesting you consider these themes carefully.`;
    }
    
    if (this.isReversed) {
      interpretation += ' The reversed nature of this card indicates blocked energy or internal conflicts around these themes.';
    }
    
    return interpretation;
  };

  ReadingCard.prototype.getSummary = function() {
    return {
      id: this.id,
      position: this.position,
      positionName: this.positionName,
      isReversed: this.isReversed,
      cardName: this.card?.name,
      cardSuit: this.card?.suit,
      interpretation: this.getFinalInterpretation(),
      significance: this.significance,
      userRating: this.userRating,
      keywords: this.keywords,
      themes: this.themes
    };
  };

  ReadingCard.prototype.toJSON = function() {
    const values = Object.assign({}, this.get());
    
    // Add computed properties
    values.effectiveMeaning = this.getEffectiveMeaning();
    values.finalInterpretation = this.getFinalInterpretation();
    values.summary = this.getSummary();
    
    return values;
  };

  // Class methods
  ReadingCard.findByReading = function(readingId) {
    return this.findAll({
      where: { readingId },
      include: ['card'],
      order: [['position', 'ASC']]
    });
  };

  ReadingCard.findByCard = function(cardId) {
    return this.findAll({
      where: { cardId },
      include: ['reading', 'card'],
      order: [['createdAt', 'DESC']]
    });
  };

  ReadingCard.findReversedCards = function(readingId = null) {
    const where = { isReversed: true };
    if (readingId) where.readingId = readingId;
    
    return this.findAll({
      where,
      include: ['card'],
      order: [['createdAt', 'DESC']]
    });
  };

  ReadingCard.findBySignificance = function(significance, readingId = null) {
    const where = { significance };
    if (readingId) where.readingId = readingId;
    
    return this.findAll({
      where,
      include: ['card'],
      order: [['dominance', 'DESC']]
    });
  };

  ReadingCard.findHighlyRated = function(minRating = 4) {
    return this.findAll({
      where: {
        userRating: {
          [sequelize.Sequelize.Op.gte]: minRating
        }
      },
      include: ['card', 'reading'],
      order: [['userRating', 'DESC'], ['resonance', 'DESC']]
    });
  };

  ReadingCard.getCardStatistics = async function(cardId) {
    const stats = await this.findAll({
      where: { cardId },
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('id')), 'totalAppearances'],
        [sequelize.fn('AVG', sequelize.col('userRating')), 'avgRating'],
        [sequelize.fn('AVG', sequelize.col('resonance')), 'avgResonance'],
        [sequelize.fn('COUNT', sequelize.literal('CASE WHEN "isReversed" = true THEN 1 END')), 'reversedCount'],
        [sequelize.fn('AVG', sequelize.col('focusTime')), 'avgFocusTime']
      ],
      raw: true
    });

    const positionStats = await this.findAll({
      where: { cardId },
      attributes: [
        'positionName',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['positionName'],
      having: sequelize.literal('"positionName" IS NOT NULL'),
      raw: true
    });

    return {
      ...stats[0],
      positionDistribution: positionStats
    };
  };

  // Associations
  ReadingCard.associate = function(models) {
    ReadingCard.belongsTo(models.Reading, {
      foreignKey: 'readingId',
      as: 'reading'
    });
    
    ReadingCard.belongsTo(models.Card, {
      foreignKey: 'cardId',
      as: 'card'
    });
  };

  return ReadingCard;
};