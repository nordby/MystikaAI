// server/src/models/Spread.js
const { DataTypes } = require('sequelize');
const sequelize = require('../database/connection');

const Spread = sequelize.define('Spread', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [2, 100]
    }
  },
  
  description: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [10, 1000]
    }
  },
  
  type: {
    type: DataTypes.ENUM(
      'daily_card',
      'one_card', 
      'three_cards',
      'celtic_cross',
      'custom',
      'numerology',
      'lunar'
    ),
    allowNull: false
  },
  
  cardsCount: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
    validate: {
      min: 1,
      max: 20
    }
  },
  
  positions: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Позиции карт в раскладе'
  },
  
  difficulty: {
    type: DataTypes.ENUM('beginner', 'intermediate', 'advanced', 'expert'),
    allowNull: false,
    defaultValue: 'beginner'
  },
  
  estimatedDuration: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Предполагаемая продолжительность в минутах'
  },
  
  category: {
    type: DataTypes.ENUM(
      'general',
      'love',
      'career',
      'health',
      'spiritual',
      'decision',
      'forecast'
    ),
    allowNull: false,
    defaultValue: 'general'
  },
  
  accessLevel: {
    type: DataTypes.ENUM('free', 'premium', 'vip'),
    allowNull: false,
    defaultValue: 'free'
  },
  
  instructions: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Инструкции по проведению расклада'
  },
  
  interpretation: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Правила интерпретации позиций'
  },
  
  icon: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: 'Emoji или код иконки'
  },
  
  imageUrl: {
    type: DataTypes.STRING(500),
    allowNull: true,
    validate: {
      isUrl: true
    }
  },
  
  popularity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: 'Счетчик использований'
  },
  
  isActive: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  },
  
  tags: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Теги для поиска и категоризации'
  },
  
  createdBy: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'Users',
      key: 'id'
    },
    comment: 'ID создателя (для пользовательских раскладов)'
  },
  
  isPublic: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: 'Доступен ли другим пользователям'
  },
  
  metadata: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Дополнительные метаданные'
  }
}, {
  tableName: 'spreads',
  timestamps: true,
  paranoid: true,
  
  indexes: [
    {
      fields: ['type']
    },
    {
      fields: ['category']
    },
    {
      fields: ['accessLevel']
    },
    {
      fields: ['isActive']
    },
    {
      fields: ['popularity']
    },
    {
      fields: ['createdBy']
    },
    {
      fields: ['isPublic']
    }
  ],
  
  scopes: {
    active: {
      where: {
        isActive: true
      }
    },
    public: {
      where: {
        isPublic: true
      }
    },
    free: {
      where: {
        accessLevel: 'free'
      }
    },
    premium: {
      where: {
        accessLevel: ['premium', 'vip']
      }
    },
    byCategory: (category) => ({
      where: {
        category: category
      }
    }),
    popular: {
      order: [['popularity', 'DESC']]
    }
  }
});

// Методы экземпляра
Spread.prototype.toJSON = function() {
  const values = Object.assign({}, this.get());
  
  // Форматируем данные для клиента
  return {
    id: values.id,
    name: values.name,
    description: values.description,
    type: values.type,
    cardsCount: values.cardsCount,
    positions: values.positions,
    difficulty: values.difficulty,
    estimatedDuration: values.estimatedDuration,
    category: values.category,
    accessLevel: values.accessLevel,
    instructions: values.instructions,
    interpretation: values.interpretation,
    icon: values.icon,
    imageUrl: values.imageUrl,
    popularity: values.popularity,
    tags: values.tags,
    isPublic: values.isPublic,
    createdAt: values.createdAt,
    updatedAt: values.updatedAt
  };
};

Spread.prototype.incrementPopularity = async function() {
  await this.increment('popularity');
  return this;
};

Spread.prototype.canBeAccessedBy = function(user) {
  if (!this.isActive) return false;
  
  switch (this.accessLevel) {
    case 'free':
      return true;
    case 'premium':
      return user && (user.isPremium || user.isVip);
    case 'vip':
      return user && user.isVip;
    default:
      return false;
  }
};

// Статические методы
Spread.getByType = function(type, user = null) {
  return this.scope('active').findAll({
    where: { type },
    order: [['popularity', 'DESC']]
  }).then(spreads => {
    return spreads.filter(spread => spread.canBeAccessedBy(user));
  });
};

Spread.getAvailableForUser = function(user = null) {
  const whereClause = { isActive: true };
  
  if (!user || (!user.isPremium && !user.isVip)) {
    whereClause.accessLevel = 'free';
  }
  
  return this.findAll({
    where: whereClause,
    order: [['popularity', 'DESC']]
  });
};

Spread.getPopular = function(limit = 10) {
  return this.scope(['active', 'popular']).findAll({
    limit
  });
};

Spread.searchByKeyword = function(keyword, user = null) {
  const searchPattern = `%${keyword}%`;
  
  return this.scope('active').findAll({
    where: {
      [sequelize.Sequelize.Op.or]: [
        { name: { [sequelize.Sequelize.Op.iLike]: searchPattern } },
        { description: { [sequelize.Sequelize.Op.iLike]: searchPattern } },
        { tags: { [sequelize.Sequelize.Op.contains]: [keyword] } }
      ]
    },
    order: [['popularity', 'DESC']]
  }).then(spreads => {
    return spreads.filter(spread => spread.canBeAccessedBy(user));
  });
};

// Хуки
Spread.beforeCreate(async (spread) => {
  // Валидация позиций
  if (spread.positions && Array.isArray(spread.positions)) {
    if (spread.positions.length !== spread.cardsCount) {
      throw new Error('Количество позиций должно соответствовать количеству карт');
    }
  }
  
  // Установка значений по умолчанию
  if (!spread.icon) {
    const iconMap = {
      'one_card': '🃏',
      'three_cards': '🃖',
      'celtic_cross': '✨',
      'love': '💕',
      'career': '💼',
      'spiritual': '🧘'
    };
    spread.icon = iconMap[spread.type] || '🔮';
  }
});

Spread.beforeUpdate(async (spread) => {
  // Проверяем изменения в критических полях
  if (spread.changed('cardsCount') && spread.positions) {
    if (spread.positions.length !== spread.cardsCount) {
      throw new Error('Количество позиций должно соответствовать количеству карт');
    }
  }
});

// Ассоциации устанавливаются в отдельном файле associations.js
Spread.associate = function(models) {
  // Связь с пользователем-создателем
  Spread.belongsTo(models.User, {
    foreignKey: 'createdBy',
    as: 'creator',
    allowNull: true
  });
  
  // Связь с гаданиями
  Spread.hasMany(models.Reading, {
    foreignKey: 'spreadId',
    as: 'readings'
  });
};

module.exports = Spread;