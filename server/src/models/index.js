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
    
    // Загружаем модели напрямую
    await loadAllModels();
    
    // Синхронизация схемы базы данных
    await syncDatabase();
    
    // Запуск сидеров для заполнения данных
    await databaseConfig.runSeeders(models);
    
    return { sequelize, models };
  } catch (error) {
    throw error;
  }
}

/**
 * Загрузка всех моделей
 */
async function loadAllModels() {
  if (models && Object.keys(models).length > 0) {
    return models; // Уже загружены
  }

  // Импортируем и регистрируем модели
  const modelFiles = [
    { name: 'User', file: './User' },
    { name: 'Card', file: './Card' },
    { name: 'Reading', file: './Reading' },
    { name: 'ReadingCard', file: './ReadingCard' },
    { name: 'Spread', file: './Spread' },
    { name: 'Subscription', file: './Subscription' },
    { name: 'MysticCircle', file: './MysticCircle' },
    { name: 'TarotReading', file: './TarotReading' }
  ];

  models = {};
  
  // Загружаем каждую модель
  for (const { name, file } of modelFiles) {
    try {
      console.log(`Loading model ${name} from ${file}...`);
      console.log(`Current models in sequelize:`, Object.keys(sequelize.models || {}));
      console.log(`Current models in local object:`, Object.keys(models));
      
      const modelDefinition = require(file);
      models[name] = modelDefinition(sequelize);
      console.log(`Model ${name} loaded successfully`);
    } catch (error) {
      console.error(`FAILED to load model ${name}: ${error.message}`);
      console.error(`Error stack:`, error.stack);
      throw error; // Прерываем при первой ошибке
    }
  }

  // Настройка ассоциаций
  Object.values(models).forEach(model => {
    if (model.associate) {
      model.associate(models);
    }
  });

  // Добавляем модели в sequelize
  sequelize.models = models;

  console.log(`All models loaded: ${Object.keys(models).join(', ')}`);
  return models;
}

/**
 * Синхронизация схемы базы данных
 */
async function syncDatabase() {
  try {
    console.log('Synchronizing database schema...');
    
    // Попробуем синхронизировать каждую модель отдельно
    for (const modelName of Object.keys(models)) {
      try {
        console.log(`Syncing model: ${modelName}`);
        await models[modelName].sync({ alter: true }); // Используем alter вместо force для безопасности
        console.log(`Model ${modelName} synced successfully`);
      } catch (error) {
        console.error(`Failed to sync model ${modelName}:`, error.message);
      }
    }
    
    console.log('Database schema synchronized successfully');
    
    // Проверим, что таблицы созданы
    try {
      const tableNames = await sequelize.getQueryInterface().showAllTables();
      console.log('Available tables:', tableNames);
    } catch (error) {
      console.warn('Could not list tables:', error.message);
    }

  } catch (error) {
    console.error('Failed to sync database schema:', error.message);
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
  loadAllModels,
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
  
  get Reading() {
    const models = getModels();
    return models.Reading;
  },
  
  get ReadingCard() {
    const models = getModels();
    return models.ReadingCard;
  },
  
  get Spread() {
    const models = getModels();
    return models.Spread;
  },
  
  get Subscription() {
    const models = getModels();
    return models.Subscription;
  },
  
  get MysticCircle() {
    const models = getModels();
    return models.MysticCircle;
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