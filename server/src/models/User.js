const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');

module.exports = (sequelize) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: {
          msg: 'Please provide a valid email address'
        }
      }
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        len: {
          args: [6, 255],
          msg: 'Password must be at least 6 characters long'
        }
      }
    },
    firstName: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        len: {
          args: [1, 50],
          msg: 'First name must be between 1 and 50 characters'
        }
      }
    },
    lastName: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        len: {
          args: [1, 50],
          msg: 'Last name must be between 1 and 50 characters'
        }
      }
    },
    displayName: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        len: {
          args: [1, 100],
          msg: 'Display name must be between 1 and 100 characters'
        }
      }
    },
    avatar: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        isUrl: {
          msg: 'Avatar must be a valid URL'
        }
      }
    },
    dateOfBirth: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    timezone: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: 'UTC'
    },
    language: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'en',
      validate: {
        isIn: {
          args: [['en', 'es', 'fr', 'de', 'it', 'ru']],
          msg: 'Language must be a supported language code'
        }
      }
    },
    isEmailVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    emailVerificationToken: {
      type: DataTypes.STRING,
      allowNull: true
    },
    passwordResetToken: {
      type: DataTypes.STRING,
      allowNull: true
    },
    passwordResetExpires: {
      type: DataTypes.DATE,
      allowNull: true
    },
    lastLoginAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    loginCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    role: {
      type: DataTypes.ENUM('user', 'admin', 'moderator'),
      defaultValue: 'user'
    },
    
    // Subscription fields
    subscriptionType: {
      type: DataTypes.ENUM('free', 'basic', 'premium', 'yearly'),
      defaultValue: 'free'
    },
    subscriptionStatus: {
      type: DataTypes.ENUM('active', 'inactive', 'cancelled', 'expired'),
      defaultValue: 'inactive'
    },
    subscriptionStartDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    subscriptionEndDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    stripeCustomerId: {
      type: DataTypes.STRING,
      allowNull: true
    },
    stripeSubscriptionId: {
      type: DataTypes.STRING,
      allowNull: true
    },

    // Preferences
    preferences: {
      type: DataTypes.JSONB,
      defaultValue: {
        theme: 'dark',
        notifications: {
          email: true,
          browser: true,
          dailyReading: false,
          weeklyInsight: true,
          newFeatures: true,
          marketing: false
        },
        privacy: {
          shareReadings: false,
          publicProfile: false,
          dataCollection: true,
          analytics: true
        },
        cardSettings: {
          backDesign: 'celestial',
          autoReverse: true,
          reverseChance: 0.3,
          showReversed: true
        },
        readingSettings: {
          autoSave: true,
          confirmBeforeExit: true,
          showInterpretations: true,
          defaultSpread: 'threeCard',
          guidedMode: false
        }
      }
    },

    // Statistics
    stats: {
      type: DataTypes.JSONB,
      defaultValue: {
        totalReadings: 0,
        readingsThisMonth: 0,
        favoriteSpread: null,
        totalTimeSpent: 0,
        streakDays: 0,
        lastReadingDate: null
      }
    },

    // Security and tracking
    ipAddress: {
      type: DataTypes.STRING,
      allowNull: true
    },
    userAgent: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    twoFactorEnabled: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    twoFactorSecret: {
      type: DataTypes.STRING,
      allowNull: true
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
        unique: true,
        fields: ['email']
      },
      {
        fields: ['subscriptionType']
      },
      {
        fields: ['subscriptionStatus']
      },
      {
        fields: ['isActive']
      },
      {
        fields: ['createdAt']
      }
    ],
    hooks: {
      beforeCreate: async (user) => {
        if (user.password) {
          user.password = await bcrypt.hash(user.password, 12);
        }
        if (user.email) {
          user.email = user.email.toLowerCase();
        }
      },
      beforeUpdate: async (user) => {
        if (user.changed('password')) {
          user.password = await bcrypt.hash(user.password, 12);
        }
        if (user.changed('email')) {
          user.email = user.email.toLowerCase();
        }
      }
    }
  });

  // Instance methods
  User.prototype.comparePassword = async function(candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
  };

  User.prototype.createPasswordResetToken = function() {
    const resetToken = require('crypto').randomBytes(32).toString('hex');
    this.passwordResetToken = require('crypto')
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');
    this.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
    return resetToken;
  };

  User.prototype.createEmailVerificationToken = function() {
    const verificationToken = require('crypto').randomBytes(32).toString('hex');
    this.emailVerificationToken = require('crypto')
      .createHash('sha256')
      .update(verificationToken)
      .digest('hex');
    return verificationToken;
  };

  User.prototype.getFullName = function() {
    if (this.firstName && this.lastName) {
      return `${this.firstName} ${this.lastName}`;
    }
    return this.displayName || this.email.split('@')[0];
  };

  User.prototype.updateLoginInfo = async function(ipAddress, userAgent) {
    this.lastLoginAt = new Date();
    this.loginCount += 1;
    this.ipAddress = ipAddress;
    this.userAgent = userAgent;
    await this.save();
  };

  User.prototype.incrementReadingCount = async function() {
    const stats = { ...this.stats };
    stats.totalReadings += 1;
    stats.readingsThisMonth += 1;
    stats.lastReadingDate = new Date().toISOString();
    
    // Update streak
    const lastReading = new Date(stats.lastReadingDate);
    const today = new Date();
    const daysDiff = Math.floor((today - lastReading) / (1000 * 60 * 60 * 24));
    
    if (daysDiff <= 1) {
      if (daysDiff === 1) {
        stats.streakDays += 1;
      }
    } else {
      stats.streakDays = 1;
    }
    
    this.stats = stats;
    await this.save();
  };

  User.prototype.hasActiveSubscription = function() {
    return this.subscriptionStatus === 'active' && 
           this.subscriptionEndDate && 
           new Date(this.subscriptionEndDate) > new Date();
  };

  User.prototype.getSubscriptionFeatures = function() {
    const features = {
      free: {
        dailyReadings: 3,
        spreads: ['threeCard'],
        historyDays: 7,
        support: 'community'
      },
      basic: {
        dailyReadings: 15,
        spreads: ['threeCard', 'celtic', 'relationship'],
        historyDays: 30,
        support: 'email'
      },
      premium: {
        dailyReadings: Infinity,
        spreads: 'all',
        historyDays: Infinity,
        support: 'priority'
      },
      yearly: {
        dailyReadings: Infinity,
        spreads: 'all',
        historyDays: Infinity,
        support: 'priority',
        consultation: true
      }
    };

    return features[this.subscriptionType] || features.free;
  };

  User.prototype.canPerformReading = function() {
    const features = this.getSubscriptionFeatures();
    const today = new Date().toDateString();
    
    if (features.dailyReadings === Infinity) return true;
    
    // Check daily limit (would need to track daily readings in stats)
    const todayReadings = this.stats.readingsToday || 0;
    return todayReadings < features.dailyReadings;
  };

  User.prototype.updatePreferences = async function(newPreferences) {
    this.preferences = { ...this.preferences, ...newPreferences };
    await this.save();
  };

  User.prototype.toJSON = function() {
    const values = Object.assign({}, this.get());
    delete values.password;
    delete values.passwordResetToken;
    delete values.passwordResetExpires;
    delete values.emailVerificationToken;
    delete values.twoFactorSecret;
    return values;
  };

  // Class methods
  User.findByEmail = function(email) {
    return this.findOne({ where: { email: email.toLowerCase() } });
  };

  User.findActiveUsers = function() {
    return this.findAll({ where: { isActive: true } });
  };

  User.findBySubscriptionType = function(type) {
    return this.findAll({ where: { subscriptionType: type } });
  };

  // Associations will be defined in the main model index file
  User.associate = function(models) {
    User.hasMany(models.Reading, {
      foreignKey: 'userId',
      as: 'readings'
    });
    
    User.hasMany(models.Payment, {
      foreignKey: 'userId',
      as: 'payments'
    });
    
    User.hasMany(models.UserSession, {
      foreignKey: 'userId',
      as: 'sessions'
    });
    
    User.belongsToMany(models.Reading, {
      through: 'UserFavoriteReadings',
      foreignKey: 'userId',
      as: 'favoriteReadings'
    });
  };

  return User;
};