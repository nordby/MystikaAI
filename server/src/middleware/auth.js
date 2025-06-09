// server/src/middleware/auth.js
const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');
const { User } = require('../models');

/**
 * Middleware для проверки JWT токена
 */
async function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access token required'
      });
    }

    const token = authHeader.substring(7); // Убираем 'Bearer '
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token required'
      });
    }

    // Проверка и декодирование токена
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default-secret');
    
    // Поиск пользователя
    const user = await User.findByPk(decoded.userId);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'User account is deactivated'
      });
    }

    // Добавление пользователя в запрос
    req.user = user;
    req.token = token;
    
    next();

  } catch (error) {
    logger.error('Auth middleware error', {
      error: error.message,
      token: req.headers.authorization?.substring(0, 20) + '...'
    });

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid access token'
      });
    }

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Access token expired'
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Authentication failed'
    });
  }
}

/**
 * Опциональная аутентификация (не возвращает ошибку если токен отсутствует)
 */
async function optionalAuthMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.substring(7);
    
    if (!token) {
      return next();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default-secret');
    const user = await User.findByPk(decoded.userId);
    
    if (user && user.isActive) {
      req.user = user;
      req.token = token;
    }
    
    next();

  } catch (error) {
    // Игнорируем ошибки при опциональной аутентификации
    next();
  }
}

module.exports = authMiddleware;
module.exports.optional = optionalAuthMiddleware;