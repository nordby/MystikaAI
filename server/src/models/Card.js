// server/src/models/Card.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Card = sequelize.define('Card', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    tarotId: {
      type: DataTypes.STRING(20),
      unique: true,
      allowNull: false,
      comment: 'Unique identifier for tarot card (e.g., "major_0", "wands_ace")'
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    nameEn: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    arcana: {
      type: DataTypes.ENUM('major', 'minor'),
      allowNull: false
    },
    suit: {
      type: DataTypes.ENUM('wands', 'cups', 'swords', 'pentacles'),
      allowNull: true,
      comment: 'Only for minor arcana'
    },
    number: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 0,
        max: 21
      },
      comment: 'Number for major arcana (0-21) or minor arcana (1-10)'
    },
    court: {
      type: DataTypes.ENUM('page', 'knight', 'queen', 'king'),
      allowNull: true,
      comment: 'Only for court cards'
    },
    element: {
      type: DataTypes.ENUM('fire', 'water', 'air', 'earth'),
      allowNull: true
    },
    keywords: {
      type: DataTypes.JSON,
      defaultValue: {
        upright: [],
        reversed: []
      }
    },
    meanings: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: {
        upright: {
          general: '',
          love: '',
          career: '',
          health: '',
          spiritual: ''
        },
        reversed: {
          general: '',
          love: '',
          career: '',
          health: '',
          spiritual: ''
        }
      }
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    imageUrl: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    sortOrder: {
      type: DataTypes.INTEGER,
      defaultValue: 0
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
      { fields: ['tarotId'] },
      { fields: ['arcana'] },
      { fields: ['suit'] },
      { fields: ['isActive'] }
    ]
  });

  // Методы экземпляра
  Card.prototype.getMeaning = function(position = 'upright', category = 'general') {
    const meanings = this.meanings[position];
    return meanings ? meanings[category] || meanings.general : '';
  };

  Card.prototype.getKeywords = function(position = 'upright') {
    const keywords = this.keywords[position];
    return Array.isArray(keywords) ? keywords : [];
  };

  Card.prototype.toReadingObject = function(reversed = false) {
    return {
      id: this.tarotId,
      name: this.name,
      nameEn: this.nameEn,
      arcana: this.arcana,
      suit: this.suit,
      number: this.number,
      court: this.court,
      element: this.element,
      reversed,
      keywords: this.getKeywords(reversed ? 'reversed' : 'upright'),
      meaning: this.getMeaning(reversed ? 'reversed' : 'upright'),
      imageUrl: this.imageUrl
    };
  };

  // Статические методы (отключены для отладки)
  // Card.findByTarotId = async function(tarotId) {
  //   return await this.findOne({
  //     where: { tarotId, isActive: true }
  //   });
  // };

  // Ассоциации
  Card.associate = function(models) {
    // Карты используются в гаданиях через TarotReading
    // Прямые ассоциации пока не нужны
  };

  return Card;
};