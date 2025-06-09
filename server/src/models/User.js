// server/src/models/User.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    telegramId: {
      type: DataTypes.BIGINT,
      unique: true,
      allowNull: false,
      index: true
    },
    username: {
      type: DataTypes.STRING(32),
      allowNull: true
    },
    firstName: {
      type: DataTypes.STRING(64),
      allowNull: true
    },
    lastName: {
      type: DataTypes.STRING(64),
      allowNull: true
    },
    languageCode: {
      type: DataTypes.STRING(10),
      defaultValue: 'ru'
    },
    isBot: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    isPremium: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    premiumExpiresAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    subscriptionType: {
      type: DataTypes.ENUM('basic', 'premium', 'premium_plus'),
      defaultValue: 'basic'
    },
    totalReadings: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    dailyReadingsUsed: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    lastDailyReset: {
      type: DataTypes.DATEONLY,
      defaultValue: DataTypes.NOW
    },
    birthDate: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    timezone: {
      type: DataTypes.STRING(50),
      defaultValue: 'Europe/Moscow'
    },
    preferences: {
      type: DataTypes.JSON,
      defaultValue: {
        notifications: {
          dailyCard: true,
          lunarPhases: false,
          premiumReminders: true
        },
        theme: 'dark',
        cardDeck: 'classic',
        readingStyle: 'detailed'
      }
    },
    metadata: {
      type: DataTypes.JSON,
      defaultValue: {}
    },
    lastSeenAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    isBlocked: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    blockedReason: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    referralCode: {
      type: DataTypes.STRING(20),
      unique: true,
      allowNull: true
    },
    referredBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'Users',
        key: 'id'
      }
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
    tableName: 'users',
    timestamps: true,
    indexes: [
      {
        fields: ['telegramId']
      },
      {
        fields: ['username']
      },
      {
        fields: ['isPremium']
      },
      {
        fields: ['isActive']
      },
      {
        fields: ['referralCode']
      },
      {
        fields: ['createdAt']
      }
    ]
  });

  // Методы модели
  User.prototype.toSafeObject = function() {
    const user = this.toJSON();
    delete user.metadata;
    return user;
  };

  User.prototype.canMakeReading = function() {
    if (this.isPremium) return true;
    
    const today = new Date().toISOString().split('T')[0];
    if (this.lastDailyReset !== today) {
      return true; // Новый день, можно сбросить лимит
    }
    
    return this.dailyReadingsUsed < 3; // Лимит для бесплатных пользователей
  };

  User.prototype.resetDailyLimit = function() {
    const today = new Date().toISOString().split('T')[0];
    if (this.lastDailyReset !== today) {
      this.dailyReadingsUsed = 0;
      this.lastDailyReset = today;
    }
  };

  User.prototype.incrementReadings = function() {
    this.totalReadings += 1;
    this.dailyReadingsUsed += 1;
  };

  User.prototype.isPremiumActive = function() {
    if (!this.isPremium) return false;
    if (!this.premiumExpiresAt) return true; // Вечная подписка
    return new Date() < new Date(this.premiumExpiresAt);
  };

  User.prototype.generateReferralCode = function() {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = 'REF';
    for (let i = 0; i < 6; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    this.referralCode = result;
    return result;
  };

  // Статические методы (отключены для отладки)
  // User.findByTelegramId = async function(telegramId) {
  //   return await this.findOne({
  //     where: { telegramId }
  //   });
  // };

  // Хуки модели (отключены для отладки)
  // User.beforeCreate((user) => {
  //   if (!user.referralCode) {
  //     user.generateReferralCode();
  //   }
  // });

  // Ассоциации
  User.associate = function(models) {
    // Гадания пользователя
    User.hasMany(models.TarotReading, {
      foreignKey: 'userId',
      as: 'readings'
    });

    // Рефералы
    User.belongsTo(models.User, {
      foreignKey: 'referredBy',
      as: 'referrer'
    });

    User.hasMany(models.User, {
      foreignKey: 'referredBy',
      as: 'referrals'
    });
  };

  return User;
};