// server/src/app.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const bodyParser = require('body-parser');
const logger = require('./utils/logger');

class MistikaServer {
  constructor() {
    this.app = express();
    this.port = process.env.PORT || 3001;
    this.host = process.env.HOST || '0.0.0.0';
    this.isProduction = process.env.NODE_ENV === 'production';
  }

  async initialize() {
    try {
      logger.info('Initializing MISTIKA Server...');

      // Настройка middleware
      this.setupMiddleware();

      // Настройка роутов
      this.setupRoutes();

      // Настройка обработки ошибок
      this.setupErrorHandling();

      // Инициализация базы данных
      await this.initializeDatabase();

      logger.info('MISTIKA Server initialized successfully');
      return true;
    } catch (error) {
      logger.error('Failed to initialize server', { error: error.message });
      throw error;
    }
  }

  setupMiddleware() {
    // Безопасность
    this.app.use(helmet({
      contentSecurityPolicy: this.isProduction,
      crossOriginEmbedderPolicy: false
    }));

    // CORS
    this.app.use(cors({
      origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
    }));

    // Сжатие
    this.app.use(compression());

    // Парсинг тела запроса
    this.app.use(bodyParser.json({ limit: '10mb' }));
    this.app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

    // Логирование запросов
    this.app.use((req, res, next) => {
      const start = Date.now();
      
      res.on('finish', () => {
        const duration = Date.now() - start;
        logger.http('HTTP Request', {
          method: req.method,
          url: req.url,
          status: res.statusCode,
          duration: `${duration}ms`,
          userAgent: req.get('User-Agent'),
          ip: req.ip
        });
      });
      
      next();
    });

    logger.info('Middleware setup completed');
  }

  setupRoutes() {
    // Health check
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        version: require('../package.json').version,
        environment: process.env.NODE_ENV,
        uptime: process.uptime()
      });
    });

    // API routes
    this.app.use('/api/v1', (req, res, next) => {
      // Здесь будут подключены роуты когда они будут созданы
      res.json({
        message: 'MISTIKA API v1.0',
        status: 'Active',
        endpoints: [
          '/api/v1/auth',
          '/api/v1/readings',
          '/api/v1/cards',
          '/api/v1/users',
          '/api/v1/numerology',
          '/api/v1/lunar'
        ]
      });
    });

    // Корневой роут
    this.app.get('/', (req, res) => {
      res.json({
        name: 'MISTIKA Tarot Server',
        version: require('../package.json').version,
        description: 'API для таро, нумерологии и лунного календаря',
        status: 'Running',
        timestamp: new Date().toISOString()
      });
    });

    // 404 handler
    this.app.use('*', (req, res) => {
      res.status(404).json({
        success: false,
        message: 'Endpoint not found',
        path: req.originalUrl
      });
    });

    logger.info('Routes setup completed');
  }

  setupErrorHandling() {
    // Global error handler
    this.app.use((error, req, res, next) => {
      logger.error('Unhandled error', {
        error: error.message,
        stack: error.stack,
        url: req.url,
        method: req.method,
        ip: req.ip
      });

      res.status(error.status || 500).json({
        success: false,
        message: this.isProduction ? 'Internal server error' : error.message,
        ...(this.isProduction ? {} : { stack: error.stack })
      });
    });

    logger.info('Error handling setup completed');
  }

  async initializeDatabase() {
    try {
      // Здесь будет инициализация Sequelize и Redis когда модели будут созданы
      logger.info('Database initialization skipped (models not ready)');
      return true;
    } catch (error) {
      logger.error('Database initialization failed', { error: error.message });
      throw error;
    }
  }

  async start() {
    try {
      if (!this.app) {
        await this.initialize();
      }

      this.server = this.app.listen(this.port, this.host, () => {
        logger.info('MISTIKA Server started', {
          port: this.port,
          host: this.host,
          environment: process.env.NODE_ENV,
          pid: process.pid
        });
      });

      // Graceful shutdown
      process.on('SIGTERM', () => this.shutdown('SIGTERM'));
      process.on('SIGINT', () => this.shutdown('SIGINT'));

      return this.server;
    } catch (error) {
      logger.error('Failed to start server', { error: error.message });
      throw error;
    }
  }

  async shutdown(signal) {
    logger.info(`Received ${signal}, shutting down gracefully...`);
    
    if (this.server) {
      this.server.close(() => {
        logger.info('HTTP server closed');
        process.exit(0);
      });
    } else {
      process.exit(0);
    }
  }

  getApp() {
    return this.app;
  }
}

// Создание и экспорт экземпляра сервера
const server = new MistikaServer();

// Автозапуск если файл запущен напрямую
if (require.main === module) {
  server.start().catch((error) => {
    logger.error('Failed to start server', { error: error.message });
    process.exit(1);
  });
}

module.exports = server;