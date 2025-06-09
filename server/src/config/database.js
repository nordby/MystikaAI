// server/src/config/database.js
const { Sequelize } = require('sequelize');
const logger = require('../utils/logger');

class DatabaseConfig {
  constructor() {
    this.sequelize = null;
    this.isConnected = false;
  }

  /**
   * Получение конфигурации базы данных
   */
  getConfig() {
    const env = process.env.NODE_ENV || 'development';
    
    const configs = {
      development: {
        database: process.env.DB_NAME || 'mistika',
        username: process.env.DB_USER || 'mistika_user',
        password: process.env.DB_PASSWORD || 'mistika_password',
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 5432,
        dialect: 'postgres',
        logging: (msg) => logger.debug('SQL:', msg),
        pool: {
          max: 10,
          min: 0,
          acquire: 30000,
          idle: 10000
        }
      },
      production: {
        database: process.env.DB_NAME,
        username: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        host: process.env.DB_HOST,
        port: process.env.DB_PORT || 5432,
        dialect: 'postgres',
        logging: false,
        pool: {
          max: 20,
          min: 5,
          acquire: 60000,
          idle: 300000
        },
        dialectOptions: {
          ssl: process.env.DB_SSL === 'true' ? {
            require: true,
            rejectUnauthorized: false
          } : false
        }
      }
    };

    // Поддержка DATABASE_URL
    if (process.env.DATABASE_URL) {
      return {
        url: process.env.DATABASE_URL,
        dialect: 'postgres',
        logging: false,
        pool: {
          max: 20,
          min: 5,
          acquire: 60000,
          idle: 300000
        }
      };
    }

    return configs[env] || configs.development;
  }

  /**
   * Инициализация подключения к базе данных
   */
  async initialize() {
    try {
      const config = this.getConfig();
      
      if (config.url) {
        this.sequelize = new Sequelize(config.url, config);
      } else {
        this.sequelize = new Sequelize(
          config.database,
          config.username,
          config.password,
          config
        );
      }

      // Тестирование подключения
      await this.sequelize.authenticate();
      
      // Загрузка моделей
      await this.loadModels();

      // Синхронизация базы данных
      await this.syncDatabase();

      this.isConnected = true;
      logger.info('Database initialized successfully');

      return this.sequelize;

    } catch (error) {
      logger.error('Database initialization failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Загрузка моделей
   */
  async loadModels() {
    try {
      // Загрузка моделей
      const User = require('../models/User_simple')(this.sequelize);
      const TarotReading = require('../models/TarotReading')(this.sequelize);

      // Создание объекта models
      const models = {
        User,
        TarotReading
      };

      // Настройка ассоциаций (временно отключено для отладки)
      // Object.keys(models).forEach(modelName => {
      //   if (models[modelName].associate) {
      //     models[modelName].associate(models);
      //   }
      // });

      // Добавление моделей в sequelize
      this.sequelize.models = models;

      logger.info('Database models loaded successfully');

    } catch (error) {
      logger.error('Failed to load database models', { error: error.message });
      throw error;
    }
  }

  /**
   * Синхронизация схемы базы данных
   */
  async syncDatabase() {
    try {
      logger.info('Synchronizing database schema...');
      logger.info('Available models:', Object.keys(this.sequelize.models));
      
      // Попробуем синхронизировать каждую модель отдельно
      for (const modelName of Object.keys(this.sequelize.models)) {
        try {
          logger.info(`Syncing model: ${modelName}`);
          await this.sequelize.models[modelName].sync({ force: true });
          logger.info(`Model ${modelName} synced successfully`);
        } catch (error) {
          logger.error(`Failed to sync model ${modelName}:`, error.message);
          throw error;
        }
      }
      
      logger.info('Database schema synchronized successfully');
      
      // Проверим, что таблицы созданы
      try {
        const tableNames = await this.sequelize.getQueryInterface().showAllTables();
        logger.info('Created tables:', tableNames);
      } catch (error) {
        logger.warn('Could not list tables:', error.message);
      }

      // Запуск сидеров после синхронизации
      // await this.runSeeders(this.sequelize.models);
      logger.info('Database initialization completed successfully');

    } catch (error) {
      logger.error('Failed to load database models', { error: error.message });
      throw error;
    }
  }

  /**
   * Получение экземпляра Sequelize
   */
  getSequelize() {
    if (!this.sequelize) {
      throw new Error('Database not initialized. Call initialize() first.');
    }
    return this.sequelize;
  }

  /**
   * Получение моделей
   */
  getModels() {
    const sequelize = this.getSequelize();
    return sequelize.models;
  }

  /**
   * Запуск сидеров для заполнения данных
   */
  async runSeeders(models) {
    try {
      logger.info('Running database seeders...');

      // Запуск сидера карт
      const { seedCards } = require('../seeders/cards');
      await seedCards(models.Card);

      logger.info('Database seeders completed successfully');

    } catch (error) {
      logger.warn('Seeder execution failed (this may be normal if data already exists)', { 
        error: error.message 
      });
    }
  }

  /**
   * Закрытие подключения
   */
  async close() {
    if (this.sequelize) {
      await this.sequelize.close();
      this.isConnected = false;
      logger.info('Database connection closed');
    }
  }
}

module.exports = new DatabaseConfig();