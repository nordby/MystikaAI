// server/src/routes/index.js
const express = require('express');
const logger = require('../utils/logger');

class RouteManager {
  constructor() {
    this.router = express.Router();
    this.routes = new Map();
  }

  initialize() {
    try {
      logger.info('Initializing API routes...');

      // Middleware для всех API роутов
      this.router.use((req, res, next) => {
        // Добавляем метаданные запроса
        req.requestId = require('uuid').v4();
        req.startTime = Date.now();
        
        logger.debug('API Request started', {
          requestId: req.requestId,
          method: req.method,
          path: req.path,
          ip: req.ip,
          userAgent: req.get('User-Agent')
        });

        next();
      });

      // Базовый роут API
      this.router.get('/', (req, res) => {
        res.json({
          message: 'MISTIKA API v1.0',
          version: '1.0.0',
          status: 'Active',
          timestamp: new Date().toISOString(),
          endpoints: Array.from(this.routes.keys()),
          documentation: '/api/v1/docs'
        });
      });

      // Заглушки для основных роутов
      this.setupPlaceholderRoutes();

      logger.info('API routes initialized successfully', {
        routesCount: this.routes.size
      });

      return this.router;
    } catch (error) {
      logger.error('Failed to initialize routes', { error: error.message });
      throw error;
    }
  }

  setupPlaceholderRoutes() {
    // Заглушки для роутов, которые будут созданы позже
    const placeholderRoutes = [
      { path: '/auth', description: 'Authentication endpoints' },
      { path: '/users', description: 'User management endpoints' },
      { path: '/readings', description: 'Tarot readings endpoints' },
      { path: '/cards', description: 'Tarot cards endpoints' },
      { path: '/spreads', description: 'Card spreads endpoints' },
      { path: '/numerology', description: 'Numerology endpoints' },
      { path: '/lunar', description: 'Lunar calendar endpoints' },
      { path: '/ai', description: 'AI services endpoints' },
      { path: '/payments', description: 'Payment processing endpoints' },
      { path: '/subscriptions', description: 'Subscription management endpoints' },
      { path: '/notifications', description: 'Notification endpoints' },
      { path: '/analytics', description: 'Analytics endpoints' },
      { path: '/admin', description: 'Admin panel endpoints' }
    ];

    placeholderRoutes.forEach(route => {
      this.router.use(route.path, (req, res, next) => {
        if (req.method === 'GET' && req.path === '/') {
          return res.json({
            endpoint: route.path,
            description: route.description,
            status: 'Not implemented yet',
            message: 'This endpoint is under development',
            timestamp: new Date().toISOString()
          });
        }
        
        res.status(501).json({
          success: false,
          message: 'Endpoint not implemented yet',
          endpoint: route.path,
          method: req.method,
          path: req.path
        });
      });

      this.routes.set(route.path, route);
    });
  }

  // Метод для добавления новых роутов
  addRoute(path, description, router) {
    try {
      this.router.use(path, router);
      this.routes.set(path, { path, description, active: true });
      
      logger.info('Route added', { path, description });
      return true;
    } catch (error) {
      logger.error('Failed to add route', { 
        path, 
        error: error.message 
      });
      return false;
    }
  }

  // Метод для получения списка роутов
  getRoutes() {
    return Array.from(this.routes.values());
  }

  // Middleware для обработки результатов
  responseMiddleware() {
    return (req, res, next) => {
      // Переопределяем res.json для добавления метаданных
      const originalJson = res.json;
      
      res.json = function(data) {
        const responseTime = Date.now() - req.startTime;
        
        // Добавляем метаданные к ответу
        const response = {
          success: res.statusCode < 400,
          timestamp: new Date().toISOString(),
          requestId: req.requestId,
          responseTime: `${responseTime}ms`,
          ...data
        };

        logger.debug('API Response', {
          requestId: req.requestId,
          statusCode: res.statusCode,
          responseTime: `${responseTime}ms`,
          path: req.path,
          method: req.method
        });

        return originalJson.call(this, response);
      };

      next();
    };
  }

  // Middleware для обработки ошибок API
  errorHandler() {
    return (error, req, res, next) => {
      const responseTime = Date.now() - req.startTime;
      
      logger.error('API Error', {
        requestId: req.requestId,
        error: error.message,
        stack: error.stack,
        path: req.path,
        method: req.method,
        responseTime: `${responseTime}ms`
      });

      res.status(error.status || 500).json({
        success: false,
        message: error.message || 'Internal server error',
        requestId: req.requestId,
        timestamp: new Date().toISOString(),
        responseTime: `${responseTime}ms`,
        ...(process.env.NODE_ENV === 'development' && { 
          stack: error.stack 
        })
      });
    };
  }
}

// Создание и инициализация менеджера роутов
const routeManager = new RouteManager();
const router = routeManager.initialize();

// Экспорт роутера и менеджера
module.exports = {
  router,
  routeManager,
  
  // Удобные методы для использования в app.js
  getRoutes: () => routeManager.getRoutes(),
  addRoute: (path, description, routerInstance) => 
    routeManager.addRoute(path, description, routerInstance),
  responseMiddleware: () => routeManager.responseMiddleware(),
  errorHandler: () => routeManager.errorHandler()
};