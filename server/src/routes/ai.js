// server/src/routes/ai.js
const express = require('express');
const multer = require('multer');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const rateLimitMiddleware = require('../middleware/rateLimiting');
const aiController = require('../controllers/ai');

// Настройка multer для обработки файлов
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
    },
    fileFilter: (req, file, cb) => {
        if (file.fieldname === 'image') {
            // Для изображений
            if (file.mimetype.startsWith('image/')) {
                cb(null, true);
            } else {
                cb(new Error('Только изображения разрешены'), false);
            }
        } else if (file.fieldname === 'audio') {
            // Для аудио
            if (file.mimetype.startsWith('audio/')) {
                cb(null, true);
            } else {
                cb(new Error('Только аудиофайлы разрешены'), false);
            }
        } else {
            cb(new Error('Неизвестный тип файла'), false);
        }
    }
});

// Все роуты требуют аутентификации
router.use(authMiddleware);

/**
 * POST /api/ai/interpret-card
 * Генерация интерпретации карты
 */
router.post('/interpret-card', 
    rateLimitMiddleware({ windowMs: 15 * 60 * 1000, max: 30 }),
    aiController.generateCardInterpretation
);

/**
 * POST /api/ai/personal-card
 * Генерация персональной карты
 */
router.post('/personal-card',
    rateLimitMiddleware({ windowMs: 60 * 60 * 1000, max: 10 }),
    aiController.generatePersonalCard
);

/**
 * POST /api/ai/analyze-photo
 * Анализ фотографии
 */
router.post('/analyze-photo',
    rateLimitMiddleware({ windowMs: 60 * 60 * 1000, max: 5 }),
    upload.single('image'),
    aiController.analyzePhoto
);

/**
 * POST /api/ai/voice-message
 * Обработка голосового сообщения
 */
router.post('/voice-message',
    rateLimitMiddleware({ windowMs: 60 * 60 * 1000, max: 10 }),
    upload.single('audio'),
    aiController.processVoiceMessage
);

/**
 * GET /api/ai/recommendations
 * Получение персонализированных рекомендаций
 */
router.get('/recommendations',
    rateLimitMiddleware({ windowMs: 60 * 60 * 1000, max: 20 }),
    aiController.getPersonalizedRecommendations
);

/**
 * POST /api/ai/daily-horoscope
 * Генерация ежедневного гороскопа
 */
router.post('/daily-horoscope',
    rateLimitMiddleware({ windowMs: 24 * 60 * 60 * 1000, max: 3 }),
    aiController.generateDailyHoroscope
);

/**
 * POST /api/ai/compatibility
 * Анализ совместимости
 */
router.post('/compatibility',
    rateLimitMiddleware({ windowMs: 60 * 60 * 1000, max: 5 }),
    aiController.analyzeCompatibility
);

/**
 * GET /api/ai/usage-stats
 * Получение статистики использования AI
 */
router.get('/usage-stats', aiController.getAIUsageStats);

module.exports = router;