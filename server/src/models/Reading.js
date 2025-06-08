const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Reading = sequelize.define('Reading', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    title: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        len: {
          args: [1, 200],
          msg: 'Title must be between 1 and 200 characters'
        }
      }
    },
    question: {
      type: DataTypes.TEXT,
      allowNull: true,
      validate: {
        len: {
          args: [0, 1000],
          msg: 'Question must be 1000 characters or less'
        }
      }
    },
    spreadType: {
      type: DataTypes.ENUM(
        'single-card',
        'three-card',
        'celtic-cross',
        'relationship',
        'career',
        'year-ahead',
        'moon-cycle',
        'chakra',
        'elements',
        'custom'
      ),
      allowNull: false,
      defaultValue: 'three-card'
    },
    spreadConfiguration: {
      type: DataTypes.JSONB,
      defaultValue: {},
      comment: 'Spread layout and position definitions'
    },
    
    // Reading metadata
    readingDate: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      allowNull: false
    },
    isPrivate: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      comment: 'Whether the reading is private to the user'
    },
    isShared: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'Whether the reading has been shared publicly'
    },
    shareCode: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true,
      comment: 'Unique code for sharing the reading'
    },
    isFavorite: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'Whether the user has marked this as favorite'
    },
    
    // Reading content
    interpretation: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Overall reading interpretation'
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'User notes about the reading'
    },
    mood: {
      type: DataTypes.ENUM('positive', 'neutral', 'negative', 'mixed'),
      allowNull: true,
      comment: 'Overall mood/sentiment of the reading'
    },
    accuracy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 1,
        max: 5
      },
      comment: 'User-rated accuracy (1-5 stars)'
    },
    helpfulness: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 1,
        max: 5
      },
      comment: 'User-rated helpfulness (1-5 stars)'
    },
    
    // AI and automation
    aiGenerated: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'Whether interpretation was AI-generated'
    },
    aiModel: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'AI model used for interpretation'
    },
    aiConfidence: {
      type: DataTypes.FLOAT,
      allowNull: true,
      validate: {
        min: 0,
        max: 1
      },
      comment: 'AI confidence score (0-1)'
    },
    
    // Context and tracking
    deviceType: {
      type: DataTypes.ENUM('mobile', 'tablet', 'desktop'),
      allowNull: true
    },
    location: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: 'Location data (if user permitted)'
    },
    sessionId: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Session identifier for tracking'
    },
    
    // Timing and duration
    startedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'When the reading session started'
    },
    completedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'When the reading was completed'
    },
    duration: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Reading duration in seconds'
    },
    
    // Status and workflow
    status: {
      type: DataTypes.ENUM('draft', 'completed', 'archived', 'deleted'),
      defaultValue: 'draft'
    },
    version: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
      comment: 'Version number for reading revisions'
    },
    
    // Analytics and insights
    viewCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: 'Number of times reading has been viewed'
    },
    lastViewedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    tags: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: [],
      comment: 'User-defined tags for categorization'
    },
    
    // Reminder and follow-up
    followUpDate: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Date for follow-up reading or review'
    },
    reminderSent: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
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
    tableName: 'readings',
    timestamps: true,
    indexes: [
      {
        fields: ['userId']
      },
      {
        fields: ['spreadType']
      },
      {
        fields: ['readingDate']
      },
      {
        fields: ['status']
      },
      {
        fields: ['isFavorite']
      },
      {
        fields: ['isShared']
      },
      {
        unique: true,
        fields: ['shareCode'],
        where: {
          shareCode: {
            [sequelize.Sequelize.Op.ne]: null
          }
        }
      },
      {
        fields: ['tags'],
        using: 'gin'
      },
      {
        fields: ['createdAt']
      }
    ]
  });

  // Instance methods
  Reading.prototype.generateShareCode = function() {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 12; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    this.shareCode = result;
    return result;
  };

  Reading.prototype.incrementViewCount = async function() {
    this.viewCount += 1;
    this.lastViewedAt = new Date();
    await this.save();
  };

  Reading.prototype.calculateDuration = function() {
    if (this.startedAt && this.completedAt) {
      this.duration = Math.floor((new Date(this.completedAt) - new Date(this.startedAt)) / 1000);
    }
  };

  Reading.prototype.addTag = async function(tag) {
    if (!this.tags.includes(tag)) {
      this.tags = [...this.tags, tag];
      await this.save();
    }
  };

  Reading.prototype.removeTag = async function(tag) {
    this.tags = this.tags.filter(t => t !== tag);
    await this.save();
  };

  Reading.prototype.toggleFavorite = async function() {
    this.isFavorite = !this.isFavorite;
    await this.save();
    return this.isFavorite;
  };

  Reading.prototype.archive = async function() {
    this.status = 'archived';
    await this.save();
  };

  Reading.prototype.complete = async function() {
    this.status = 'completed';
    this.completedAt = new Date();
    this.calculateDuration();
    await this.save();
  };

  Reading.prototype.share = async function() {
    if (!this.shareCode) {
      this.generateShareCode();
    }
    this.isShared = true;
    await this.save();
    return this.shareCode;
  };

  Reading.prototype.unshare = async function() {
    this.isShared = false;
    this.shareCode = null;
    await this.save();
  };

  Reading.prototype.setReminder = async function(date) {
    this.followUpDate = date;
    this.reminderSent = false;
    await this.save();
  };

  Reading.prototype.getReadingCards = async function() {
    const ReadingCard = sequelize.models.ReadingCard;
    return await ReadingCard.findAll({
      where: { readingId: this.id },
      include: ['card'],
      order: [['position', 'ASC']]
    });
  };

  Reading.prototype.getSummary = function() {
    return {
      id: this.id,
      title: this.title || 'Untitled Reading',
      question: this.question,
      spreadType: this.spreadType,
      readingDate: this.readingDate,
      mood: this.mood,
      cardCount: this.readingCards?.length || 0,
      isFavorite: this.isFavorite,
      tags: this.tags
    };
  };

  Reading.prototype.getDetailedInfo = function() {
    return {
      ...this.getSummary(),
      interpretation: this.interpretation,
      notes: this.notes,
      accuracy: this.accuracy,
      helpfulness: this.helpfulness,
      duration: this.duration,
      viewCount: this.viewCount,
      status: this.status,
      isShared: this.isShared,
      shareCode: this.shareCode
    };
  };

  Reading.prototype.toJSON = function() {
    const values = Object.assign({}, this.get());
    
    // Add computed properties
    values.summary = this.getSummary();
    
    if (this.readingCards) {
      values.cardCount = this.readingCards.length;
    }
    
    return values;
  };

  // Class methods
  Reading.findByUser = function(userId, options = {}) {
    return this.findAll({
      where: { 
        userId,
        status: options.status || ['completed', 'draft']
      },
      order: [['readingDate', 'DESC']],
      limit: options.limit,
      offset: options.offset,
      include: options.include
    });
  };

  Reading.findFavorites = function(userId) {
    return this.findAll({
      where: { 
        userId,
        isFavorite: true,
        status: ['completed', 'draft']
      },
      order: [['readingDate', 'DESC']]
    });
  };

  Reading.findByShareCode = function(shareCode) {
    return this.findOne({
      where: { 
        shareCode,
        isShared: true,
        status: 'completed'
      },
      include: ['readingCards', 'user']
    });
  };

  Reading.findBySpreadType = function(spreadType, userId = null) {
    const where = { 
      spreadType,
      status: 'completed'
    };
    
    if (userId) {
      where.userId = userId;
    } else {
      where.isShared = true;
    }
    
    return this.findAll({
      where,
      order: [['readingDate', 'DESC']]
    });
  };

  Reading.findByTag = function(tag, userId) {
    return this.findAll({
      where: {
        userId,
        tags: {
          [sequelize.Sequelize.Op.contains]: [tag]
        },
        status: ['completed', 'draft']
      },
      order: [['readingDate', 'DESC']]
    });
  };

  Reading.findRecentReadings = function(userId, days = 7) {
    const dateThreshold = new Date();
    dateThreshold.setDate(dateThreshold.getDate() - days);
    
    return this.findAll({
      where: {
        userId,
        readingDate: {
          [sequelize.Sequelize.Op.gte]: dateThreshold
        },
        status: ['completed', 'draft']
      },
      order: [['readingDate', 'DESC']]
    });
  };

  Reading.getStatistics = async function(userId) {
    const stats = await this.findAll({
      where: { userId, status: 'completed' },
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('id')), 'totalReadings'],
        [sequelize.fn('AVG', sequelize.col('accuracy')), 'avgAccuracy'],
        [sequelize.fn('AVG', sequelize.col('helpfulness')), 'avgHelpfulness'],
        [sequelize.fn('SUM', sequelize.col('duration')), 'totalDuration']
      ],
      raw: true
    });

    const spreadStats = await this.findAll({
      where: { userId, status: 'completed' },
      attributes: [
        'spreadType',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['spreadType'],
      raw: true
    });

    return {
      ...stats[0],
      spreadDistribution: spreadStats
    };
  };

  // Associations
  Reading.associate = function(models) {
    Reading.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user'
    });
    
    Reading.hasMany(models.ReadingCard, {
      foreignKey: 'readingId',
      as: 'readingCards'
    });
    
    Reading.belongsToMany(models.Card, {
      through: models.ReadingCard,
      foreignKey: 'readingId',
      as: 'cards'
    });
    
    Reading.belongsToMany(models.User, {
      through: 'UserFavoriteReadings',
      foreignKey: 'readingId',
      as: 'favoritedBy'
    });
  };

  return Reading;
};