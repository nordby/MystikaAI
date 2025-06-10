// server/src/routes/admin.js
const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin');
const authMiddleware = require('../middleware/auth');
const logger = require('../utils/logger');

// Middleware для проверки админских прав
const adminMiddleware = (req, res, next) => {
  if (!req.user || !req.user.isAdmin) {
    return res.status(403).json({
      success: false,
      message: 'Недостаточно прав для доступа к административной панели'
    });
  }
  next();
};

// Middleware для логирования admin запросов
router.use((req, res, next) => {
  logger.info('Admin API request', {
    method: req.method,
    path: req.path,
    adminId: req.user?.id,
    userAgent: req.get('User-Agent')
  });
  next();
});

// Все admin роуты требуют аутентификации и админских прав
router.use(authMiddleware);
router.use(adminMiddleware);

// Пользователи
router.get('/users', adminController.getAllUsers);
router.get('/users/:id', adminController.getUserById);
router.put('/users/:id', adminController.updateUser);
router.delete('/users/:id', adminController.deleteUser);
router.post('/users/:id/ban', adminController.banUser);
router.post('/users/:id/unban', adminController.unbanUser);

// Статистика
router.get('/stats/overview', adminController.getOverviewStats);
router.get('/stats/users', adminController.getUserStats);
router.get('/stats/readings', adminController.getReadingStats);
router.get('/stats/payments', adminController.getPaymentStats);

// Контент-менеджмент
router.get('/readings', adminController.getAllReadings);
router.delete('/readings/:id', adminController.deleteReading);

// Модерация
router.get('/reports', adminController.getReports);
router.post('/reports/:id/resolve', adminController.resolveReport);

// Конфигурация
router.get('/config', adminController.getConfig);
router.put('/config', adminController.updateConfig);

// Системные операции
router.post('/maintenance', adminController.toggleMaintenanceMode);
router.post('/clear-cache', adminController.clearCache);
router.get('/logs', adminController.getLogs);

module.exports = router;