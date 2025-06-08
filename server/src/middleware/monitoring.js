// server/src/middleware/monitoring.js
const promClient = require('prom-client');
const logger = require('../utils/logger');

// Создаем реестр метрик
const register = new promClient.Registry();

// Добавляем метрики по умолчанию
promClient.collectDefaultMetrics({ register });

// Пользовательские метрики
const httpRequestDuration = new promClient.Histogram({
    name: 'http_request_duration_seconds',
    help: 'Duration of HTTP requests in seconds',
    labelNames: ['method', 'route', 'status_code'],
    buckets: [0.1, 0.5, 1, 2, 5]
});

const httpRequestsTotal = new promClient.Counter({
    name: 'http_requests_total',
    help: 'Total number of HTTP requests',
    labelNames: ['method', 'route', 'status_code']
});

const activeUsers = new promClient.Gauge({
    name: 'active_users_total',
    help: 'Number of active users'
});

const premiumUsers = new promClient.Gauge({
    name: 'premium_users_total',
    help: 'Number of premium users'
});

const aiRequestsTotal = new promClient.Counter({
    name: 'ai_requests_total',
    help: 'Total number of AI requests',
    labelNames: ['type', 'status']
});

const readingsTotal = new promClient.Counter({
    name: 'readings_total',
    help: 'Total number of readings performed',
    labelNames: ['type']
});

// Регистрируем метрики
register.registerMetric(httpRequestDuration);
register.registerMetric(httpRequestsTotal);
register.registerMetric(activeUsers);
register.registerMetric(premiumUsers);
register.registerMetric(aiRequestsTotal);
register.registerMetric(readingsTotal);

/**
 * Middleware для сбора метрик HTTP запросов
 */
const metricsMiddleware = (req, res, next) => {
    const start = Date.now();
    
    res.on('finish', () => {
        const duration = (Date.now() - start) / 1000;
        const route = req.route?.path || req.path;
        
        httpRequestDuration
            .labels(req.method, route, res.statusCode.toString())
            .observe(duration);
            
        httpRequestsTotal
            .labels(req.method, route, res.statusCode.toString())
            .inc();
    });
    
    next();
};

/**
 * Обновление бизнес метрик
 */
const updateBusinessMetrics = async () => {
    try {
        const User = require('../models/User');
        const { Op } = require('sequelize');
        
        // Активные пользователи (за последние 30 дней)
        const activeUsersCount = await User.count({
            where: {
                updated_at: {
                    [Op.gte]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
                }
            }
        });
        
        // Премиум пользователи
        const premiumUsersCount = await User.count({
            where: {
                subscription_type: { [Op.ne]: 'basic' }
            }
        });
        
        activeUsers.set(activeUsersCount);
        premiumUsers.set(premiumUsersCount);
        
    } catch (error) {
        logger.error('Ошибка обновления бизнес метрик:', error);
    }
};

/**
 * Трекинг AI запросов
 */
const trackAIRequest = (type, status) => {
    aiRequestsTotal.labels(type, status).inc();
};

/**
 * Трекинг гаданий
 */
const trackReading = (type) => {
    readingsTotal.labels(type).inc();
};

/**
 * Эндпоинт для метрик
 */
const metricsHandler = async (req, res) => {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
};

// Обновляем бизнес метрики каждые 5 минут
setInterval(updateBusinessMetrics, 5 * 60 * 1000);
updateBusinessMetrics(); // Первоначальное обновление

module.exports = {
    metricsMiddleware,
    metricsHandler,
    trackAIRequest,
    trackReading,
    register
};