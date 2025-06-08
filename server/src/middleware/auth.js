// server/src/middleware/auth.js
const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

// Проверка JWT токена
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Токен не предоставлен'
    });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      logger.error('Ошибка верификации токена:', err);
      return res.status(403).json({
        success: false,
        message: 'Недействительный токен'
      });
    }

    req.user = user;
    next();
  });
};

// Опциональная аутентификация
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return next();
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (!err) {
      req.user = user;
    }
    next();
  });
};

// Проверка прав администратора
const requireAdmin = (req, res, next) => {
  if (!req.user || !req.user.isAdmin) {
    return res.status(403).json({
      success: false,
      message: 'Требуются права администратора'
    });
  }
  next();
};

// Проверка подписки
const requireSubscription = (subscriptionType) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Требуется аутентификация'
      });
    }

    const allowedTypes = {
      'mystic': ['mystic', 'master', 'grandmaster'],
      'master': ['master', 'grandmaster'],
      'grandmaster': ['grandmaster']
    };

    const userSubscription = req.user.subscriptionType || 'basic';
    const allowed = allowedTypes[subscriptionType] || [];

    if (!allowed.includes(userSubscription)) {
      return res.status(403).json({
        success: false,
        message: `Требуется подписка уровня ${subscriptionType} или выше`,
        requiredSubscription: subscriptionType,
        currentSubscription: userSubscription
      });
    }

    next();
  };
};

module.exports = {
  authenticateToken,
  optionalAuth,
  requireAdmin,
  requireSubscription
};