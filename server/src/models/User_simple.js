// server/src/models/User_simple.js
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
      allowNull: true
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    referralCode: {
      type: DataTypes.STRING(10),
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
    referralCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    lastSeenAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
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
    tableName: 'Users',
    timestamps: true
  });

  // Ассоциации
  User.associate = function(models) {
    // Минимальные ассоциации
  };

  return User;
};