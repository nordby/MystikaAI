// server/src/database/connection.js
const { Sequelize } = require('sequelize');
const config = require('../config/database');
const logger = require('../utils/logger');

const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

// Создание подключения к базе данных
const sequelize = new Sequelize(
  dbConfig.database,
  dbConfig.username,
  dbConfig.password,
  {
    host: dbConfig.host,
    port: dbConfig.port,
    dialect: dbConfig.dialect,
    logging: dbConfig.logging === false ? false : (msg) => logger.debug(msg),
    dialectOptions: dbConfig.dialectOptions,
    pool: dbConfig.pool,
    define: dbConfig.define,
    timezone: '+03:00', // Московское время
  }
);

// Функция подключения к БД
const connectDatabase = async () => {
  try {
    await sequelize.authenticate();
    logger.info('✅ Подключение к базе данных установлено успешно');
    return true;
  } catch (error) {
    logger.error('❌ Невозможно подключиться к базе данных:', error);
    throw error;
  }
};

// Функция для закрытия подключения
const disconnectDatabase = async () => {
  try {
    await sequelize.close();
    logger.info('База данных отключена');
  } catch (error) {
    logger.error('Ошибка при отключении от базы данных:', error);
  }
};

module.exports = {
  sequelize,
  connectDatabase,
  disconnectDatabase,
  Sequelize,
};