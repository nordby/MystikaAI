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
    this.host = process.env.HOST || 'localhost';
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
    this.app.use((req, res, next) => {
      console.log(`[RAW] Incoming request: ${req.method} ${req.url}`); // console.log вместо logger
      next();
    });    
    // Безопасность
    this.app.use(helmet({
      contentSecurityPolicy: this.isProduction,
      crossOriginEmbedderPolicy: false
    }));

    // CORS
    // this.app.use(cors({
    //   origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'],
    //   credentials: true,
    //   methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    //   allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
    // }));

    this.app.use(cors({
      origin: '*', // временно разрешить все origins для теста
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
        version: '1.0.0',
        environment: process.env.NODE_ENV,
        uptime: process.uptime()
      });
    });

    // API routes
    try { this.app.use('/api/v1/auth', require('./routes/auth')); } catch(e) { throw new Error('auth: ' + e.message); }
    try { this.app.use('/api/v1/cards', require('./routes/cards')); } catch(e) { throw new Error('cards: ' + e.message); }
    try { this.app.use('/api/v1/readings', require('./routes/readings')); } catch(e) { throw new Error('readings: ' + e.message); }
    try { this.app.use('/api/v1/analytics', require('./routes/analytics')); } catch(e) { throw new Error('analytics: ' + e.message); }
    try { this.app.use('/api/v1/ai', require('./routes/ai')); } catch(e) { throw new Error('ai: ' + e.message); }
    try { this.app.use('/api/v1/numerology', require('./routes/numerology')); } catch(e) { throw new Error('numerology: ' + e.message); }
    try { this.app.use('/api/v1/lunar', require('./routes/lunar')); } catch(e) { throw new Error('lunar: ' + e.message); }
    try { this.app.use('/api/v1/spreads', require('./routes/spreads')); } catch(e) { throw new Error('spreads: ' + e.message); }
    try { this.app.use('/api/v1/payments', require('./routes/payments')); } catch(e) { throw new Error('payments: ' + e.message); }
    try { this.app.use('/api/v1/telegram', require('./routes/telegram')); } catch(e) { throw new Error('telegram: ' + e.message); }
    try { this.app.use('/api/v1/users', require('./routes/users')); } catch(e) { throw new Error('users: ' + e.message); }
    try { this.app.use('/api/v1/admin', require('./routes/admin')); } catch(e) { throw new Error('admin: ' + e.message); }
    
    // API status endpoint
    this.app.get('/api/v1', (req, res) => {
      res.json({
        message: 'MISTIKA API v1.0',
        status: 'Active',
        endpoints: [
          '/api/v1/auth',
          '/api/v1/readings',
          '/api/v1/cards',
          '/api/v1/analytics',
          '/api/v1/ai',
          '/api/v1/numerology',
          '/api/v1/lunar',
          '/api/v1/spreads',
          '/api/v1/payments',
          '/api/v1/telegram',
          '/api/v1/users',
          '/api/v1/admin'
        ],
        timestamp: new Date().toISOString()
      });
    });

    // Корневой роут
    this.app.get('/', (req, res) => {
      res.json({
        name: 'MISTIKA Tarot Server',
        version: '1.0.0',
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
      const { initialize } = require('./models');
      await initialize();
      logger.info('Database initialized successfully');
      return true;
    } catch (error) {
      logger.error('Database initialization failed', { error: error.message });
      throw error;
    }
  }

  async start() {
    try {
      await this.initialize();

      this.server = this.app.listen(this.port, 'localhost', () => {
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