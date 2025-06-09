// server/src/models/TarotReading.js
const { DataTypes, Op } = require('sequelize');

module.exports = (sequelize) => {
  const TarotReading = sequelize.define('TarotReading', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    type: {
      type: DataTypes.ENUM(
        'single_card',
        'single_cards',
        'three_card',
        'three_cards',
        'celtic_cross',
        'relationship',
        'career',
        'daily_card',
        'lunar_reading',
        'custom'
      ),
      allowNull: false
    },
    spreadName: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    question: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    questionCategory: {
      type: DataTypes.ENUM(
        'love',
        'career',
        'health',
        'finance',
        'spiritual',
        'general',
        'family',
        'decision'
      ),
      defaultValue: 'general'
    },
    cards: {
      type: DataTypes.JSON,
      allowNull: false,
      validate: {
        isValidCards(value) {
          if (!Array.isArray(value) || value.length === 0) {
            throw new Error('Cards must be a non-empty array');
          }
          
          for (const card of value) {
            if (!card.id && !card.name) {
              throw new Error('Each card must have id or name property');
            }
          }
        }
      }
    },
    positions: {
      type: DataTypes.JSON,
      allowNull: false,
      validate: {
        isValidPositions(value) {
          if (!Array.isArray(value) || value.length === 0) {
            throw new Error('Positions must be a non-empty array');
          }
        }
      }
    },
    interpretation: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    summary: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    advice: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    mood: {
      type: DataTypes.ENUM('positive', 'neutral', 'negative', 'mixed'),
      defaultValue: 'neutral'
    },
    confidence: {
      type: DataTypes.DECIMAL(3, 2),
      defaultValue: 0.75,
      validate: {
        min: 0,
        max: 1
      }
    },
    aiModel: {
      type: DataTypes.STRING(50),
      defaultValue: 'yandexgpt-lite'
    },
    aiPromptVersion: {
      type: DataTypes.STRING(20),
      defaultValue: 'v1.0'
    },
    language: {
      type: DataTypes.STRING(10),
      defaultValue: 'ru'
    },
    isDaily: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    isShared: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    shareCode: {
      type: DataTypes.STRING(20),
      unique: true,
      allowNull: true
    },
    tags: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: []
    },
    metadata: {
      type: DataTypes.JSON,
      defaultValue: {}
    },
    userFeedback: {
      type: DataTypes.JSON,
      defaultValue: {},
      validate: {
        isValidFeedback(value) {
          if (value && typeof value === 'object') {
            const { rating, helpful, accuracy } = value;
            if (rating && (rating < 1 || rating > 5)) {
              throw new Error('Rating must be between 1 and 5');
            }
          }
        }
      }
    },
    processingTime: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Time in milliseconds to generate reading'
    },
    viewCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    lastViewedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'For temporary readings'
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
    tableName: 'tarot_readings',
    timestamps: true,
    indexes: [
      {
        fields: ['userId']
      },
      {
        fields: ['type']
      },
      {
        fields: ['questionCategory']
      },
      {
        fields: ['isDaily']
      },
      {
        fields: ['isShared']
      },
      {
        fields: ['shareCode']
      },
      {
        fields: ['createdAt']
      },
      {
        fields: ['mood']
      },
      {
        fields: ['tags'],
        using: 'gin'
      }
    ]
  });

  // Методы экземпляра
  TarotReading.prototype.toPublicObject = function() {
    const reading = this.toJSON();
    if (!this.isShared) {
      delete reading.userId;
      delete reading.metadata;
    }
    return reading;
  };

  TarotReading.prototype.incrementViewCount = async function() {
    this.viewCount += 1;
    this.lastViewedAt = new Date();
    await this.save();
  };

  TarotReading.prototype.generateShareCode = function() {
    const characters = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    this.shareCode = result;
    return result;
  };

  TarotReading.prototype.getCardCount = function() {
    return this.cards ? this.cards.length : 0;
  };

  TarotReading.prototype.hasReversedCards = function() {
    return this.cards ? this.cards.some(card => card.reversed) : false;
  };

  TarotReading.prototype.getMajorArcanaCount = function() {
    if (!this.cards) return 0;
    return this.cards.filter(card => 
      typeof card.id === 'number' && card.id >= 0 && card.id <= 21
    ).length;
  };

  TarotReading.prototype.updateFeedback = async function(feedback) {
    this.userFeedback = {
      ...this.userFeedback,
      ...feedback,
      updatedAt: new Date()
    };
    await this.save();
  };

  TarotReading.prototype.isExpired = function() {
    if (!this.expiresAt) return false;
    return new Date() > new Date(this.expiresAt);
  };

  // Статические методы (отключены для отладки)
  // TarotReading.findByShareCode = async function(shareCode) {
  //   return await this.findOne({
  //     where: { 
  //       shareCode,
  //       isShared: true 
  //     },
  //     include: ['user']
  //   });
  // };

  // Хуки модели (отключены для отладки)
  // TarotReading.beforeCreate((reading) => {
  //   if (reading.isShared && !reading.shareCode) {
  //     reading.generateShareCode();
  //   }
  // });

  // Ассоциации
  TarotReading.associate = function(models) {
    TarotReading.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user'
    });
  };

  return TarotReading;
};