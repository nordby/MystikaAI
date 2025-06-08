// server/src/models/index.js
const { Sequelize } = require('sequelize');
const logger = require('../utils/logger');

class Database {
  constructor() {
    this.sequelize = null;
    this.models = {};
    this.isConnected = false;
  }

  async initialize() {
    try {
      logger.info('Initializing database connection...');

      // Настройка Sequelize
      this.sequelize = new Sequelize(
        process.env.DATABASE_URL || {
          database: process.env.DB_NAME || 'mistika_db',
          username: process.env.DB_USER || 'postgres',
          password: process.env.DB_PASSWORD || 'password',
          host: process.env.DB_HOST || 'localhost',
          port: process.env.DB_PORT || 5432,
          dialect: 'postgres',
          logging: process.env.NODE_ENV === 'development' ? 
            (msg) => logger.debug('SQL', { query: msg }) : false,
          pool: {
            max: parseInt(process.env.DB_POOL_MAX) || 10,
            min: parseInt(process.env.DB_POOL_MIN) || 2,
            acquire: 30000,
            idle: 10000
          },
          dialectOptions: {
            ssl: process.env.DB_SSL === 'true' ? {
              require: true,
              rejectUnauthorized: false
            } : false
          }
        }
      );

      // Тест подключения
      await this.sequelize.authenticate();
      this.isConnected = true;

      logger.info('Database connection established successfully');

      // Здесь будут импортированы модели когда они будут созданы
      // this.models.User = require('./User')(this.sequelize);
      // this.models.Reading = require('./Reading')(this.sequelize);
      // ... другие модели

      // Настройка ассоциаций
      // this.setupAssociations();

      return true;
    } catch (error) {
      logger.error('Failed to connect to database', { 
        error: error.message,
        stack: error.stack 
      });
      throw error;
    }
  }

  setupAssociations() {
    // Здесь будут настроены связи между моделями
    logger.info('Setting up model associations...');
    
    // Пример ассоциаций:
    // this.models.User.hasMany(this.models.Reading);
    // this.models.Reading.belongsTo(this.models.User);
    
    logger.info('Model associations setup completed');
  }

  async sync(options = {}) {
    try {
      if (!this.isConnected) {
        throw new Error('Database not connected');
      }

      logger.info('Syncing database models...');
      await this.sequelize.sync(options);
      logger.info('Database sync completed');
      
      return true;
    } catch (error) {
      logger.error('Database sync failed', { error: error.message });
      throw error;
    }
  }

  async close() {
    try {
      if (this.sequelize) {
        await this.sequelize.close();
        this.isConnected = false;
        logger.info('Database connection closed');
      }
    } catch (error) {
      logger.error('Error closing database connection', { error: error.message });
    }
  }

  async healthCheck() {
    try {
      if (!this.isConnected) {
        return { healthy: false, message: 'Not connected' };
      }

      await this.sequelize.authenticate();
      return { 
        healthy: true, 
        message: 'Database connection is healthy',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return { 
        healthy: false, 
        message: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  getSequelize() {
    return this.sequelize;
  }

  getModels() {
    return this.models;
  }

  isReady() {
    return this.isConnected && this.sequelize;
  }
}

// Создание единственного экземпляра базы данных
const database = new Database();

module.exports = database;