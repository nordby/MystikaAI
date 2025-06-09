// server/src/models/index.js
const databaseConfig = require('../config/database');

let models = {};
let sequelize = null;

/**
 * Инициализация моделей и базы данных
 */
async function initialize() {
  try {
    // Инициализация подключения к БД
    sequelize = await databaseConfig.initialize();
    
    // Получение моделей из конфигурации БД
    models = databaseConfig.getModels();
    
    return { sequelize, models };
  } catch (error) {
    throw error;
  }
}

/**
 * Получение моделей (ленивая инициализация)
 */
function getModels() {
  if (!models || Object.keys(models).length === 0) {
    if (sequelize && sequelize.models) {
      models = sequelize.models;
    }
  }
  return models;
}

/**
 * Получение Sequelize
 */
function getSequelize() {
  return sequelize || databaseConfig.getSequelize();
}

// Экспорт для удобного использования
module.exports = {
  initialize,
  getModels,
  getSequelize,
  
  // Прямой доступ к моделям
  get User() {
    const models = getModels();
    return models.User;
  },
  
  get Card() {
    const models = getModels();
    return models.Card;
  },
  
  get TarotReading() {
    const models = getModels();
    return models.TarotReading;
  },
  
  // Совместимость со старым API
  get sequelize() {
    return getSequelize();
  },
  
  get models() {
    return getModels();
  }
};