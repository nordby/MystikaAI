// server/src/middleware/error.js
const logger = require('../utils/logger');

// Обработчик ошибок
const errorHandler = (err, req, res, next) => {
  // Логирование ошибки
  logger.error({
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    user: req.user?.id
  });

  // Установка статуса по умолчанию
  const status = err.status || err.statusCode || 500;

  // Определение сообщения об ошибке
  let message = err.message || 'Внутренняя ошибка сервера';
  
  // В production скрываем детали ошибок 500
  if (process.env.NODE_ENV === 'production' && status === 500) {
    message = 'Внутренняя ошибка сервера';
  }

  // Специальная обработка разных типов ошибок
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Ошибка валидации',
      errors: err.errors
    });
  }

  if (err.name === 'SequelizeValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Ошибка валидации данных',
      errors: err.errors.map(e => ({
        field: e.path,
        message: e.message
      }))
    });
  }

  if (err.name === 'SequelizeUniqueConstraintError') {
    return res.status(409).json({
      success: false,
      message: 'Такая запись уже существует',
      field: err.errors[0]?.path
    });
  }

  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Недействительный токен'
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Токен истек'
    });
  }

  // Обработка ошибок multer
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      success: false,
      message: 'Файл слишком большой'
    });
  }

  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    return res.status(400).json({
      success: false,
      message: 'Неожиданное поле файла'
    });
  }

  // Ответ клиенту
  res.status(status).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && {
      error: err.message,
      stack: err.stack
    })
  });
};

// Обработчик для несуществующих маршрутов
const notFound = (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Маршрут не найден',
    path: req.originalUrl
  });
};

// Асинхронный обработчик для оборачивания async функций
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = {
  errorHandler,
  notFound,
  asyncHandler
};