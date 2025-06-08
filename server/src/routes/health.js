// server/src/routes/health.js
const express = require('express');
const router = express.Router();
const redis = require('../database/redis');
const sequelize = require('../database/connection');

/**
 * Простая проверка здоровья
 * GET /health
 */
router.get('/', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

/**
 * Детальная проверка здоровья
 * GET /health/detailed
 */
router.get('/detailed', async (req, res) => {
    const checks = {
        database: false,
        redis: false,
        memory: false,
        disk: false
    };

    let overallStatus = 'ok';

    // Проверка базы данных
    try {
        await sequelize.authenticate();
        checks.database = true;
    } catch (error) {
        checks.database = false;
        overallStatus = 'error';
    }

    // Проверка Redis
    try {
        await redis.ping();
        checks.redis = true;
    } catch (error) {
        checks.redis = false;
        overallStatus = 'error';
    }

    // Проверка памяти
    const memoryUsage = process.memoryUsage();
    const freeMemory = require('os').freemem();
    checks.memory = freeMemory > 100 * 1024 * 1024; // Минимум 100MB

    if (!checks.memory) {
        overallStatus = 'warning';
    }

    // Информация о системе
    const systemInfo = {
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
        uptime: process.uptime(),
        memoryUsage: {
            rss: Math.round(memoryUsage.rss / 1024 / 1024) + ' MB',
            heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024) + ' MB',
            heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024) + ' MB',
            external: Math.round(memoryUsage.external / 1024 / 1024) + ' MB'
        }
    };

    const statusCode = overallStatus === 'ok' ? 200 : overallStatus === 'warning' ? 200 : 503;

    res.status(statusCode).json({
        status: overallStatus,
        timestamp: new Date().toISOString(),
        checks,
        system: systemInfo
    });
});

/**
 * Проверка готовности к приему трафика
 * GET /health/ready
 */
router.get('/ready', async (req, res) => {
    try {
        // Проверяем критически важные компоненты
        await sequelize.authenticate();
        await redis.ping();

        res.json({
            status: 'ready',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(503).json({
            status: 'not ready',
            timestamp: new Date().toISOString(),
            error: error.message
        });
    }
});

/**
 * Проверка живости сервиса
 * GET /health/live
 */
router.get('/live', (req, res) => {
    res.json({
        status: 'alive',
        timestamp: new Date().toISOString(),
        pid: process.pid,
        uptime: process.uptime()
    });
});

module.exports = router;