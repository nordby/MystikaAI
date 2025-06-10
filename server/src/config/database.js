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
      
      // Модели будут загружены через models/index.js
      logger.info('Database connection established, model loading deferred to models/index.js');

      this.isConnected = true;
      logger.info('Database initialized successfully');

      return this.sequelize;

    } catch (error) {
      logger.error('Database initialization failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Загрузка моделей (удалено - модели загружаются через models/index.js)
   */
  async loadModels() {
    // Модели теперь загружаются централизованно через models/index.js
    // Этот метод оставлен для совместимости
    logger.info('Model loading deferred to models/index.js');
    return;
  }

  /**
   * Синхронизация схемы базы данных (удалено - синхронизация выполняется через models/index.js)
   */
  async syncDatabase() {
    // Синхронизация БД теперь выполняется в models/index.js
    logger.info('Database sync deferred to models/index.js');
    return;
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