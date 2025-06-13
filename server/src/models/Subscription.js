// server/src/models/Subscription.js
const { DataTypes, Op } = require('sequelize');

module.exports = (sequelize) => {
  const Subscription = sequelize.define('Subscription', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  
  planId: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: 'Идентификатор тарифного плана'
  },
  
  planName: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  
  status: {
    type: DataTypes.ENUM(
      'active',
      'cancelled',
      'expired',
      'suspended',
      'pending',
      'trial'
    ),
    allowNull: false,
    defaultValue: 'pending'
  },
  
  type: {
    type: DataTypes.ENUM('monthly', 'quarterly', 'yearly', 'lifetime'),
    allowNull: false
  },
  
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 0
    }
  },
  
  currency: {
    type: DataTypes.STRING(3),
    allowNull: false,
    defaultValue: 'RUB',
    validate: {
      len: [3, 3]
    }
  },
  
  startDate: {
    type: DataTypes.DATE,
    allowNull: false
  },
  
  endDate: {
    type: DataTypes.DATE,
    allowNull: false
  },
  
  trialEndDate: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Дата окончания пробного периода'
  },
  
  nextBillingDate: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Дата следующего списания'
  },
  
  autoRenewal: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  },
  
  paymentMethod: {
    type: DataTypes.ENUM(
      'card',
      'paypal',
      'apple_pay',
      'google_pay',
      'bank_transfer',
      'crypto',
      'telegram_stars'
    ),
    allowNull: true
  },
  
  paymentProvider: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: 'Название платежной системы'
  },
  
  externalSubscriptionId: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: 'ID подписки в внешней системе'
  },
  
  lastPaymentDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  
  lastPaymentAmount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  
  failedPaymentCount: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  
  features: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Доступные возможности подписки'
  },
  
  limits: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Лимиты подписки'
  },
  
  metadata: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Дополнительные данные'
  },
  
  cancellationReason: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  
  cancellationDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  
  refundAmount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  
  refundDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Внутренние заметки'
  }
}, {
  tableName: 'subscriptions',
  timestamps: true,
  paranoid: true,
  
  indexes: [
    {
      fields: ['userId']
    },
    {
      fields: ['status']
    },
    {
      fields: ['planId']
    },
    {
      fields: ['endDate']
    },
    {
      fields: ['nextBillingDate']
    },
    {
      fields: ['externalSubscriptionId']
    },
    {
      unique: true,
      fields: ['userId', 'status'],
      where: {
        status: 'active'
      },
      name: 'unique_active_subscription_per_user'
    }
  ],
  
  scopes: {
    active: {
      where: {
        status: 'active',
        endDate: {
          [Op.gt]: new Date()
        }
      }
    },
    expired: {
      where: {
        endDate: {
          [Op.lt]: new Date()
        }
      }
    },
    expiringSoon: (days = 7) => ({
      where: {
        status: 'active',
        endDate: {
          [Op.between]: [
            new Date(),
            new Date(Date.now() + days * 24 * 60 * 60 * 1000)
          ]
        }
      }
    }),
    trial: {
      where: {
        status: 'trial'
      }
    },
    autoRenewal: {
      where: {
        autoRenewal: true,
        status: 'active'
      }
    }
  }
});

// Методы экземпляра
Subscription.prototype.toJSON = function() {
  const values = Object.assign({}, this.get());
  
  return {
    id: values.id,
    planId: values.planId,
    planName: values.planName,
    status: values.status,
    type: values.type,
    price: parseFloat(values.price),
    currency: values.currency,
    startDate: values.startDate,
    endDate: values.endDate,
    trialEndDate: values.trialEndDate,
    nextBillingDate: values.nextBillingDate,
    autoRenewal: values.autoRenewal,
    paymentMethod: values.paymentMethod,
    features: values.features,
    limits: values.limits,
    daysRemaining: this.getDaysRemaining(),
    isActive: this.isActive(),
    isTrial: this.isTrial(),
    createdAt: values.createdAt,
    updatedAt: values.updatedAt
  };
};

Subscription.prototype.isActive = function() {
  return this.status === 'active' && new Date() < this.endDate;
};

Subscription.prototype.isTrial = function() {
  return this.status === 'trial' || (
    this.trialEndDate && new Date() < this.trialEndDate
  );
};

Subscription.prototype.isExpired = function() {
  return new Date() >= this.endDate;
};

Subscription.prototype.getDaysRemaining = function() {
  const now = new Date();
  const end = new Date(this.endDate);
  const diffTime = end - now;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

Subscription.prototype.getDaysUntilBilling = function() {
  if (!this.nextBillingDate) return null;
  
  const now = new Date();
  const billing = new Date(this.nextBillingDate);
  const diffTime = billing - now;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

Subscription.prototype.canAccess = function(feature) {
  if (!this.isActive()) return false;
  
  if (!this.features || !Array.isArray(this.features)) {
    return false;
  }
  
  return this.features.includes(feature);
};

Subscription.prototype.getRemainingLimit = function(limitType) {
  if (!this.limits || !this.limits[limitType]) {
    return null;
  }
  
  const limit = this.limits[limitType];
  if (limit === -1) return -1; // безлимит
  
  // Здесь должна быть логика подсчета использованных лимитов
  // Пока возвращаем полный лимит
  return limit;
};

Subscription.prototype.extend = async function(days) {
  const newEndDate = new Date(this.endDate);
  newEndDate.setDate(newEndDate.getDate() + days);
  
  await this.update({ endDate: newEndDate });
  return this;
};

Subscription.prototype.cancel = async function(reason = null) {
  await this.update({
    status: 'cancelled',
    cancellationDate: new Date(),
    cancellationReason: reason,
    autoRenewal: false
  });
  return this;
};

Subscription.prototype.suspend = async function(reason = null) {
  await this.update({
    status: 'suspended',
    notes: reason
  });
  return this;
};

Subscription.prototype.reactivate = async function() {
  if (this.isExpired()) {
    throw new Error('Невозможно реактивировать истекшую подписку');
  }
  
  await this.update({
    status: 'active',
    failedPaymentCount: 0
  });
  return this;
};

// Статические методы
Subscription.getActiveByUser = function(userId) {
  return this.scope('active').findOne({
    where: { userId }
  });
};

Subscription.getExpiringSoon = function(days = 7) {
  return this.scope(['expiringSoon']).findAll({
    include: [{
      model: sequelize.models.User,
      as: 'user',
      attributes: ['id', 'telegramId', 'firstName', 'email']
    }]
  });
};

Subscription.getForRenewal = function() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  
  const dayAfter = new Date(tomorrow);
  dayAfter.setDate(dayAfter.getDate() + 1);
  
  return this.scope('autoRenewal').findAll({
    where: {
      nextBillingDate: {
        [Op.between]: [tomorrow, dayAfter]
      }
    },
    include: [{
      model: sequelize.models.User,
      as: 'user'
    }]
  });
};

Subscription.createTrial = async function(userId, trialDays = 7) {
  const startDate = new Date();
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + trialDays);
  
  return this.create({
    userId,
    planId: 'trial',
    planName: 'Пробный период',
    status: 'trial',
    type: 'trial',
    price: 0,
    currency: 'RUB',
    startDate,
    endDate,
    trialEndDate: endDate,
    autoRenewal: false,
    features: ['unlimited_readings', 'ai_interpretations', 'voice_input'],
    limits: {
      daily_readings: -1,
      ai_interpretations: -1,
      voice_minutes: 60
    }
  });
};

// Хуки
Subscription.beforeCreate(async (subscription) => {
  // Проверяем, нет ли уже активной подписки у пользователя
  const existingActive = await Subscription.getActiveByUser(subscription.userId);
  if (existingActive) {
    throw new Error('У пользователя уже есть активная подписка');
  }
  
  // Устанавливаем дату следующего биллинга для автопродления
  if (subscription.autoRenewal && subscription.status === 'active') {
    subscription.nextBillingDate = new Date(subscription.endDate);
  }
});

Subscription.afterCreate(async (subscription) => {
  // Логируем создание подписки
  console.log(`Создана подписка ${subscription.id} для пользователя ${subscription.userId}`);
});

Subscription.beforeUpdate(async (subscription) => {
  // Если подписка становится неактивной, отключаем автопродление
  if (subscription.changed('status') && 
      !['active', 'trial'].includes(subscription.status)) {
    subscription.autoRenewal = false;
    subscription.nextBillingDate = null;
  }
  
  // Если включается автопродление, устанавливаем дату биллинга
  if (subscription.changed('autoRenewal') && 
      subscription.autoRenewal && 
      subscription.status === 'active') {
    subscription.nextBillingDate = new Date(subscription.endDate);
  }
});

// Ассоциации
Subscription.associate = function(models) {
  Subscription.belongsTo(models.User, {
    foreignKey: 'userId',
    as: 'user'
  });
};

  return Subscription;
};