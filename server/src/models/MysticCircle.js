// server/src/models/MysticCircle.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const MysticCircle = sequelize.define('MysticCircle', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [3, 100]
    }
  },
  
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  
  type: {
    type: DataTypes.ENUM(
      'personal',
      'relationship',
      'career',
      'spiritual',
      'health',
      'financial',
      'family',
      'custom'
    ),
    allowNull: false,
    defaultValue: 'personal'
  },
  
  status: {
    type: DataTypes.ENUM('active', 'completed', 'paused', 'archived'),
    allowNull: false,
    defaultValue: 'active'
  },
  
  centerElement: {
    type: DataTypes.JSON,
    allowNull: false,
    comment: 'Центральный элемент круга (карта, символ, намерение)'
  },
  
  elements: {
    type: DataTypes.JSON,
    allowNull: false,
    comment: 'Элементы мистического круга'
  },
  
  intentions: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Намерения и цели'
  },
  
  energyMapping: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Карта энергий и их значений'
  },
  
  configuration: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: {
      radius: 'medium',
      sectors: 8,
      clockwise: true,
      startPosition: 'north'
    },
    comment: 'Конфигурация круга'
  },
  
  results: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Результаты анализа и интерпретации'
  },
  
  insights: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Инсайты и открытия'
  },
  
  progress: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Прогресс по целям и намерениям'
  },
  
  startDate: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  
  completionDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  
  duration: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Длительность в днях'
  },
  
  phase: {
    type: DataTypes.ENUM(
      'preparation',
      'activation',
      'manifestation',
      'integration',
      'completion'
    ),
    allowNull: false,
    defaultValue: 'preparation'
  },
  
  visibility: {
    type: DataTypes.ENUM('private', 'friends', 'public'),
    allowNull: false,
    defaultValue: 'private'
  },
  
  tags: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Теги для категоризации'
  },
  
  attachments: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Прикрепленные изображения, аудио, заметки'
  },
  
  collaborators: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Участники совместного круга'
  },
  
  reminders: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Настройки напоминаний'
  },
  
  statistics: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Статистика использования'
  },
  
  metadata: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Дополнительные метаданные'
  }
}, {
  tableName: 'mystic_circles',
  timestamps: true,
  paranoid: true,
  
  indexes: [
    {
      fields: ['userId']
    },
    {
      fields: ['type']
    },
    {
      fields: ['status']
    },
    {
      fields: ['phase']
    },
    {
      fields: ['visibility']
    },
    {
      fields: ['startDate']
    },
    {
      fields: ['completionDate']
    }
  ],
  
  scopes: {
    active: {
      where: {
        status: 'active'
      }
    },
    completed: {
      where: {
        status: 'completed'
      }
    },
    public: {
      where: {
        visibility: 'public'
      }
    },
    byType: (type) => ({
      where: {
        type: type
      }
    }),
    byPhase: (phase) => ({
      where: {
        phase: phase
      }
    }),
    recent: {
      order: [['createdAt', 'DESC']]
    }
  }
});

// Методы экземпляра
MysticCircle.prototype.toJSON = function() {
  const values = Object.assign({}, this.get());
  
  return {
    id: values.id,
    name: values.name,
    description: values.description,
    type: values.type,
    status: values.status,
    centerElement: values.centerElement,
    elements: values.elements,
    intentions: values.intentions,
    energyMapping: values.energyMapping,
    configuration: values.configuration,
    results: values.results,
    insights: values.insights,
    progress: values.progress,
    startDate: values.startDate,
    completionDate: values.completionDate,
    duration: values.duration,
    phase: values.phase,
    visibility: values.visibility,
    tags: values.tags,
    attachments: values.attachments,
    collaborators: values.collaborators,
    statistics: values.statistics,
    daysActive: this.getDaysActive(),
    progressPercentage: this.getProgressPercentage(),
    isActive: this.isActive(),
    isCompleted: this.isCompleted(),
    createdAt: values.createdAt,
    updatedAt: values.updatedAt
  };
};

MysticCircle.prototype.isActive = function() {
  return this.status === 'active';
};

MysticCircle.prototype.isCompleted = function() {
  return this.status === 'completed' && this.completionDate !== null;
};

MysticCircle.prototype.getDaysActive = function() {
  const start = new Date(this.startDate);
  const end = this.completionDate ? new Date(this.completionDate) : new Date();
  const diffTime = end - start;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

MysticCircle.prototype.getProgressPercentage = function() {
  if (!this.progress || !this.intentions) return 0;
  
  const totalIntentions = Array.isArray(this.intentions) ? this.intentions.length : 1;
  const completedIntentions = this.progress.completed || 0;
  
  return Math.round((completedIntentions / totalIntentions) * 100);
};

MysticCircle.prototype.updateProgress = async function(progressData) {
  const currentProgress = this.progress || {};
  const updatedProgress = { ...currentProgress, ...progressData };
  
  await this.update({ progress: updatedProgress });
  
  // Автоматически завершаем круг, если все цели достигнуты
  if (this.getProgressPercentage() >= 100 && this.status === 'active') {
    await this.complete();
  }
  
  return this;
};

MysticCircle.prototype.addInsight = async function(insight) {
  const currentInsights = this.insights || [];
  const newInsight = {
    id: require('crypto').randomUUID(),
    content: insight,
    timestamp: new Date(),
    phase: this.phase
  };
  
  currentInsights.push(newInsight);
  await this.update({ insights: currentInsights });
  
  return this;
};

MysticCircle.prototype.advancePhase = async function() {
  const phases = ['preparation', 'activation', 'manifestation', 'integration', 'completion'];
  const currentPhaseIndex = phases.indexOf(this.phase);
  
  if (currentPhaseIndex < phases.length - 1) {
    const nextPhase = phases[currentPhaseIndex + 1];
    await this.update({ phase: nextPhase });
    
    if (nextPhase === 'completion') {
      await this.complete();
    }
  }
  
  return this;
};

MysticCircle.prototype.complete = async function() {
  await this.update({
    status: 'completed',
    phase: 'completion',
    completionDate: new Date()
  });
  
  return this;
};

MysticCircle.prototype.pause = async function() {
  await this.update({ status: 'paused' });
  return this;
};

MysticCircle.prototype.resume = async function() {
  await this.update({ status: 'active' });
  return this;
};

MysticCircle.prototype.archive = async function() {
  await this.update({ status: 'archived' });
  return this;
};

MysticCircle.prototype.addElement = async function(element) {
  const currentElements = this.elements || [];
  const newElement = {
    id: require('crypto').randomUUID(),
    ...element,
    addedAt: new Date()
  };
  
  currentElements.push(newElement);
  await this.update({ elements: currentElements });
  
  return this;
};

MysticCircle.prototype.removeElement = async function(elementId) {
  const currentElements = this.elements || [];
  const filteredElements = currentElements.filter(el => el.id !== elementId);
  
  await this.update({ elements: filteredElements });
  return this;
};

MysticCircle.prototype.updateStatistics = async function() {
  const stats = this.statistics || {};
  const now = new Date();
  
  const updatedStats = {
    ...stats,
    lastViewed: now,
    viewCount: (stats.viewCount || 0) + 1,
    totalTimeSpent: this.getDaysActive(),
    phaseHistory: stats.phaseHistory || []
  };
  
  // Добавляем запись о смене фазы
  if (this.changed('phase')) {
    updatedStats.phaseHistory.push({
      phase: this.phase,
      timestamp: now
    });
  }
  
  await this.update({ statistics: updatedStats });
  return this;
};

// Статические методы
MysticCircle.getActiveByUser = function(userId) {
  return this.scope('active').findAll({
    where: { userId },
    order: [['updatedAt', 'DESC']]
  });
};

MysticCircle.getCompletedByUser = function(userId) {
  return this.scope('completed').findAll({
    where: { userId },
    order: [['completionDate', 'DESC']]
  });
};

MysticCircle.getPublicCircles = function(limit = 20) {
  return this.scope(['public', 'recent']).findAll({
    limit,
    include: [{
      model: sequelize.models.User,
      as: 'user',
      attributes: ['id', 'firstName', 'avatar']
    }]
  });
};

MysticCircle.getByType = function(type, userId = null) {
  const whereClause = { type };
  if (userId) {
    whereClause.userId = userId;
  }
  
  return this.findAll({
    where: whereClause,
    order: [['updatedAt', 'DESC']]
  });
};

MysticCircle.getStatistics = async function(userId = null) {
  const whereClause = userId ? { userId } : {};
  
  const [total, active, completed, byType] = await Promise.all([
    this.count({ where: whereClause }),
    this.count({ where: { ...whereClause, status: 'active' } }),
    this.count({ where: { ...whereClause, status: 'completed' } }),
    this.findAll({
      where: whereClause,
      attributes: [
        'type',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['type'],
      raw: true
    })
  ]);
  
  return {
    total,
    active,
    completed,
    byType: byType.reduce((acc, item) => {
      acc[item.type] = parseInt(item.count);
      return acc;
    }, {})
  };
};

// Хуки
MysticCircle.beforeCreate(async (circle) => {
  // Валидация конфигурации
  if (!circle.configuration || !circle.configuration.sectors) {
    circle.configuration = {
      radius: 'medium',
      sectors: 8,
      clockwise: true,
      startPosition: 'north',
      ...circle.configuration
    };
  }
  
  // Инициализация статистики
  circle.statistics = {
    createdAt: new Date(),
    viewCount: 0,
    phaseHistory: [{
      phase: circle.phase,
      timestamp: new Date()
    }]
  };
});

MysticCircle.afterCreate(async (circle) => {
  console.log(`Создан мистический круг ${circle.id} для пользователя ${circle.userId}`);
});

MysticCircle.beforeUpdate(async (circle) => {
  // Обновляем статистику при изменении фазы
  if (circle.changed('phase')) {
    await circle.updateStatistics();
  }
});

// Ассоциации
MysticCircle.associate = function(models) {
  MysticCircle.belongsTo(models.User, {
    foreignKey: 'userId',
    as: 'user'
  });
  
  // Связь с гаданиями (если круг связан с конкретными гаданиями)
  MysticCircle.hasMany(models.Reading, {
    foreignKey: 'mysticCircleId',
    as: 'readings'
  });
};

  return MysticCircle;
};