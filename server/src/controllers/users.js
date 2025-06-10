const { AppError } = require('../utils/errors');
const { validateEmail } = require('../utils/validation');
const { uploadFile, deleteFile } = require('../utils/fileUpload');
const { Op } = require('sequelize');

// Lazy loading for models
const getModels = () => {
  const { User, Reading, ReadingCard, Card } = require('../models');
  return { User, Reading, ReadingCard, Card };
};

class UsersController {
  // Get user profile
  static async getProfile(req, res, next) {
    try {
      const userId = req.user.id;

      const user = await User.findByPk(userId, {
        include: [
          {
            association: 'readings',
            limit: 10,
            order: [['createdAt', 'DESC']],
            include: ['readingCards']
          }
        ]
      });

      if (!user) {
        return next(new AppError('User not found', 404));
      }

      // Get additional statistics
      const stats = await Reading.getStatistics(userId);

      res.json({
        success: true,
        data: {
          user: user.toJSON(),
          statistics: stats
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // Update user profile
  static async updateProfile(req, res, next) {
    try {
      const userId = req.user.id;
      const {
        firstName,
        lastName,
        displayName,
        dateOfBirth,
        timezone,
        language
      } = req.body;

      const user = await User.findByPk(userId);
      if (!user) {
        return next(new AppError('User not found', 404));
      }

      // Update user fields
      const updateData = {};
      if (firstName !== undefined) updateData.firstName = firstName;
      if (lastName !== undefined) updateData.lastName = lastName;
      if (displayName !== undefined) updateData.displayName = displayName;
      if (dateOfBirth !== undefined) updateData.dateOfBirth = dateOfBirth;
      if (timezone !== undefined) updateData.timezone = timezone;
      if (language !== undefined) updateData.language = language;

      await user.update(updateData);

      res.json({
        success: true,
        message: 'Profile updated successfully',
        data: {
          user: user.toJSON()
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // Upload avatar
  static async uploadAvatar(req, res, next) {
    try {
      const userId = req.user.id;
      
      if (!req.file) {
        return next(new AppError('No file uploaded', 400));
      }

      const user = await User.findByPk(userId);
      if (!user) {
        return next(new AppError('User not found', 404));
      }

      // Delete old avatar if exists
      if (user.avatar) {
        try {
          await deleteFile(user.avatar);
        } catch (deleteError) {
          console.error('Failed to delete old avatar:', deleteError);
        }
      }

      // Upload new avatar
      const avatarUrl = await uploadFile(req.file, 'avatars');

      // Update user avatar
      user.avatar = avatarUrl;
      await user.save();

      res.json({
        success: true,
        message: 'Avatar uploaded successfully',
        data: {
          avatarUrl
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // Delete avatar
  static async deleteAvatar(req, res, next) {
    try {
      const userId = req.user.id;

      const user = await User.findByPk(userId);
      if (!user) {
        return next(new AppError('User not found', 404));
      }

      if (user.avatar) {
        try {
          await deleteFile(user.avatar);
        } catch (deleteError) {
          console.error('Failed to delete avatar:', deleteError);
        }
      }

      user.avatar = null;
      await user.save();

      res.json({
        success: true,
        message: 'Avatar deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  // Get user preferences
  static async getPreferences(req, res, next) {
    try {
      const userId = req.user.id;

      const user = await User.findByPk(userId);
      if (!user) {
        return next(new AppError('User not found', 404));
      }

      res.json({
        success: true,
        data: {
          preferences: user.preferences
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // Update user preferences
  static async updatePreferences(req, res, next) {
    try {
      const userId = req.user.id;
      const newPreferences = req.body;

      const user = await User.findByPk(userId);
      if (!user) {
        return next(new AppError('User not found', 404));
      }

      await user.updatePreferences(newPreferences);

      res.json({
        success: true,
        message: 'Preferences updated successfully',
        data: {
          preferences: user.preferences
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // Get user settings (combined preferences and profile)
  static async getSettings(req, res, next) {
    try {
      const userId = req.user.id;

      const user = await User.findByPk(userId);
      if (!user) {
        return next(new AppError('User not found', 404));
      }

      res.json({
        success: true,
        data: {
          theme: user.preferences.theme,
          language: user.language,
          timezone: user.timezone,
          notifications: user.preferences.notifications,
          privacy: user.preferences.privacy,
          cardSettings: user.preferences.cardSettings,
          readingSettings: user.preferences.readingSettings
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // Update user settings
  static async updateSettings(req, res, next) {
    try {
      const userId = req.user.id;
      const settings = req.body;

      const user = await User.findByPk(userId);
      if (!user) {
        return next(new AppError('User not found', 404));
      }

      // Update profile fields
      if (settings.language) user.language = settings.language;
      if (settings.timezone) user.timezone = settings.timezone;

      // Update preferences
      const updatedPreferences = { ...user.preferences };
      if (settings.theme) updatedPreferences.theme = settings.theme;
      if (settings.notifications) updatedPreferences.notifications = { ...updatedPreferences.notifications, ...settings.notifications };
      if (settings.privacy) updatedPreferences.privacy = { ...updatedPreferences.privacy, ...settings.privacy };
      if (settings.cardSettings) updatedPreferences.cardSettings = { ...updatedPreferences.cardSettings, ...settings.cardSettings };
      if (settings.readingSettings) updatedPreferences.readingSettings = { ...updatedPreferences.readingSettings, ...settings.readingSettings };

      user.preferences = updatedPreferences;
      await user.save();

      res.json({
        success: true,
        message: 'Settings updated successfully',
        data: {
          settings: {
            theme: user.preferences.theme,
            language: user.language,
            timezone: user.timezone,
            notifications: user.preferences.notifications,
            privacy: user.preferences.privacy,
            cardSettings: user.preferences.cardSettings,
            readingSettings: user.preferences.readingSettings
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // Get user statistics
  static async getStatistics(req, res, next) {
    try {
      const userId = req.user.id;

      const user = await User.findByPk(userId);
      if (!user) {
        return next(new AppError('User not found', 404));
      }

      // Get detailed reading statistics
      const readingStats = await Reading.getStatistics(userId);

      // Get favorite cards
      const favoriteCards = await ReadingCard.findAll({
        include: [
          {
            model: Reading,
            as: 'reading',
            where: { userId },
            attributes: []
          },
          {
            model: Card,
            as: 'card'
          }
        ],
        attributes: [
          'cardId',
          [Reading.sequelize.fn('COUNT', Reading.sequelize.col('ReadingCard.id')), 'count']
        ],
        group: ['cardId', 'card.id'],
        order: [[Reading.sequelize.fn('COUNT', Reading.sequelize.col('ReadingCard.id')), 'DESC']],
        limit: 10
      });

      // Get recent activity
      const recentReadings = await Reading.findRecentReadings(userId, 30);

      // Calculate streak and monthly stats
      const monthlyStats = await this.calculateMonthlyStats(userId);

      res.json({
        success: true,
        data: {
          userStats: user.stats,
          readingStats,
          favoriteCards: favoriteCards.map(fc => ({
            card: fc.card,
            count: parseInt(fc.get('count'))
          })),
          recentActivity: recentReadings.length,
          monthlyStats,
          subscription: {
            type: user.subscriptionType,
            status: user.subscriptionStatus,
            features: user.getSubscriptionFeatures()
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // Helper method to calculate monthly statistics
  static async calculateMonthlyStats(userId) {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const monthlyReadings = await Reading.count({
      where: {
        userId,
        readingDate: {
          [Op.between]: [startOfMonth, endOfMonth]
        },
        status: 'completed'
      }
    });

    const monthlySpreadStats = await Reading.findAll({
      where: {
        userId,
        readingDate: {
          [Op.between]: [startOfMonth, endOfMonth]
        },
        status: 'completed'
      },
      attributes: [
        'spreadType',
        [Reading.sequelize.fn('COUNT', Reading.sequelize.col('id')), 'count']
      ],
      group: ['spreadType'],
      raw: true
    });

    return {
      totalReadings: monthlyReadings,
      spreads: monthlySpreadStats,
      period: {
        start: startOfMonth,
        end: endOfMonth
      }
    };
  }

  // Get user readings
  static async getReadings(req, res, next) {
    try {
      const userId = req.user.id;
      const {
        page = 1,
        limit = 10,
        spreadType,
        status = 'completed',
        favorite,
        tag,
        startDate,
        endDate
      } = req.query;

      const offset = (page - 1) * limit;
      const where = { userId };

      // Apply filters
      if (spreadType) where.spreadType = spreadType;
      if (status) where.status = status;
      if (favorite === 'true') where.isFavorite = true;
      if (tag) where.tags = { [Op.contains]: [tag] };
      
      if (startDate || endDate) {
        where.readingDate = {};
        if (startDate) where.readingDate[Op.gte] = new Date(startDate);
        if (endDate) where.readingDate[Op.lte] = new Date(endDate);
      }

      const { count, rows: readings } = await Reading.findAndCountAll({
        where,
        include: [
          {
            association: 'readingCards',
            include: ['card']
          }
        ],
        order: [['readingDate', 'DESC']],
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      res.json({
        success: true,
        data: {
          readings: readings.map(r => r.toJSON()),
          pagination: {
            total: count,
            page: parseInt(page),
            limit: parseInt(limit),
            totalPages: Math.ceil(count / limit)
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // Get favorite readings
  static async getFavoriteReadings(req, res, next) {
    try {
      const userId = req.user.id;

      const favoriteReadings = await Reading.findFavorites(userId);

      res.json({
        success: true,
        data: {
          readings: favoriteReadings.map(r => r.toJSON())
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // Update subscription
  static async updateSubscription(req, res, next) {
    try {
      const userId = req.user.id;
      const {
        subscriptionType,
        subscriptionStatus,
        subscriptionStartDate,
        subscriptionEndDate,
        stripeCustomerId,
        stripeSubscriptionId
      } = req.body;

      const user = await User.findByPk(userId);
      if (!user) {
        return next(new AppError('User not found', 404));
      }

      const updateData = {};
      if (subscriptionType) updateData.subscriptionType = subscriptionType;
      if (subscriptionStatus) updateData.subscriptionStatus = subscriptionStatus;
      if (subscriptionStartDate) updateData.subscriptionStartDate = subscriptionStartDate;
      if (subscriptionEndDate) updateData.subscriptionEndDate = subscriptionEndDate;
      if (stripeCustomerId) updateData.stripeCustomerId = stripeCustomerId;
      if (stripeSubscriptionId) updateData.stripeSubscriptionId = stripeSubscriptionId;

      await user.update(updateData);

      res.json({
        success: true,
        message: 'Subscription updated successfully',
        data: {
          subscription: {
            type: user.subscriptionType,
            status: user.subscriptionStatus,
            startDate: user.subscriptionStartDate,
            endDate: user.subscriptionEndDate,
            features: user.getSubscriptionFeatures()
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // Check subscription status
  static async checkSubscription(req, res, next) {
    try {
      const userId = req.user.id;

      const user = await User.findByPk(userId);
      if (!user) {
        return next(new AppError('User not found', 404));
      }

      const isActive = user.hasActiveSubscription();
      const features = user.getSubscriptionFeatures();
      const canPerformReading = user.canPerformReading();

      res.json({
        success: true,
        data: {
          subscription: {
            type: user.subscriptionType,
            status: user.subscriptionStatus,
            isActive,
            startDate: user.subscriptionStartDate,
            endDate: user.subscriptionEndDate,
            features,
            canPerformReading
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // Export user data (GDPR compliance)
  static async exportData(req, res, next) {
    try {
      const userId = req.user.id;

      const user = await User.findByPk(userId, {
        include: [
          {
            association: 'readings',
            include: ['readingCards']
          }
        ]
      });

      if (!user) {
        return next(new AppError('User not found', 404));
      }

      const exportData = {
        profile: user.toJSON(),
        preferences: user.preferences,
        statistics: user.stats,
        readings: user.readings.map(r => r.toJSON()),
        exportDate: new Date().toISOString(),
        exportVersion: '1.0'
      };

      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="mistika-data-${userId}.json"`);
      res.json(exportData);
    } catch (error) {
      next(error);
    }
  }

  // Search users (admin only)
  static async searchUsers(req, res, next) {
    try {
      const { query, page = 1, limit = 20 } = req.query;
      const offset = (page - 1) * limit;

      if (!query) {
        return next(new AppError('Search query is required', 400));
      }

      const users = await User.findAndCountAll({
        where: {
          [Op.or]: [
            { email: { [Op.iLike]: `%${query}%` } },
            { firstName: { [Op.iLike]: `%${query}%` } },
            { lastName: { [Op.iLike]: `%${query}%` } },
            { displayName: { [Op.iLike]: `%${query}%` } }
          ]
        },
        attributes: { exclude: ['password', 'passwordResetToken', 'emailVerificationToken'] },
        order: [['createdAt', 'DESC']],
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      res.json({
        success: true,
        data: {
          users: users.rows,
          pagination: {
            total: users.count,
            page: parseInt(page),
            limit: parseInt(limit),
            totalPages: Math.ceil(users.count / limit)
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = {
  getProfile: UsersController.getProfile,
  updateProfile: UsersController.updateProfile,
  uploadAvatar: UsersController.uploadAvatar,
  deleteAvatar: UsersController.deleteAvatar,
  getPreferences: UsersController.getPreferences,
  updatePreferences: UsersController.updatePreferences,
  getSettings: UsersController.getSettings,
  updateSettings: UsersController.updateSettings,
  getStatistics: UsersController.getStatistics,
  searchUsers: UsersController.searchUsers,
  
  // Add any missing methods that routes might need
  createUser: async (req, res, next) => {
    res.status(501).json({ success: false, message: 'Method not implemented yet' });
  },
  getProfileByTelegramId: async (req, res, next) => {
    res.status(501).json({ success: false, message: 'Method not implemented yet' });
  },
  updateProfileByTelegramId: async (req, res, next) => {
    res.status(501).json({ success: false, message: 'Method not implemented yet' });
  },
  deleteUser: async (req, res, next) => {
    res.status(501).json({ success: false, message: 'Method not implemented yet' });
  },
  getUserStats: async (req, res, next) => {
    res.status(501).json({ success: false, message: 'Method not implemented yet' });
  },
  getMyProfile: async (req, res, next) => {
    res.status(501).json({ success: false, message: 'Method not implemented yet' });
  },
  updateMyProfile: async (req, res, next) => {
    res.status(501).json({ success: false, message: 'Method not implemented yet' });
  },
  deleteMyAccount: async (req, res, next) => {
    res.status(501).json({ success: false, message: 'Method not implemented yet' });
  },
  getMyReadings: async (req, res, next) => {
    res.status(501).json({ success: false, message: 'Method not implemented yet' });
  },
  getMyStats: async (req, res, next) => {
    res.status(501).json({ success: false, message: 'Method not implemented yet' });
  },
  getMySubscription: async (req, res, next) => {
    res.status(501).json({ success: false, message: 'Method not implemented yet' });
  },
  getMyReferrals: async (req, res, next) => {
    res.status(501).json({ success: false, message: 'Method not implemented yet' });
  },
  createReferral: async (req, res, next) => {
    res.status(501).json({ success: false, message: 'Method not implemented yet' });
  }
};