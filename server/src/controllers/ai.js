// server/src/controllers/ai.js
const aiService = require('../services/aiService');
const logger = require('../utils/logger');

/**
 * Интерпретация гадания с помощью ИИ
 */
const interpretReading = async (req, res) => {
    try {
        const {
            cards,
            spreadType,
            positions,
            question,
            user
        } = req.body;

        if (!cards || !Array.isArray(cards) || cards.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Cards array is required'
            });
        }

        // Подготавливаем данные пользователя
        const userData = {
            id: user.id,
            language: user.language || 'ru'
        };

        // Получаем интерпретацию от AI сервиса
        const interpretation = await aiService.interpretReading(
            cards,
            question || 'Общее гадание',
            userData,
            {
                spreadType: spreadType || 'single',
                positions: positions || [],
                language: userData.language,
                style: 'detailed',
                model: 'claude-3-5-haiku-20241022'
            }
        );

        logger.info('AI interpretation completed', {
            userId: user.id,
            cardCount: cards.length,
            spreadType,
            model: interpretation.model,
            processingTime: interpretation.processingTime
        });

        res.json({
            success: true,
            interpretation: {
                interpretation: interpretation.interpretation,
                summary: interpretation.summary,
                advice: interpretation.advice,
                mood: interpretation.mood,
                confidence: interpretation.confidence,
                model: interpretation.model,
                processingTime: interpretation.processingTime
            }
        });

    } catch (error) {
        logger.error('AI interpretation error', {
            error: error.message,
            userId: req.body.user?.id,
            cardCount: req.body.cards?.length
        });

        res.status(500).json({
            success: false,
            message: 'Failed to generate interpretation',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Генерация интерпретации карт через AI
 */
const generateCardInterpretation = async (req, res) => {
    try {
        const { cardId, isReversed, question, userId } = req.body;
        
        if (!cardId) {
            return res.status(400).json({
                success: false,
                message: 'ID карты обязателен'
            });
        }

        const interpretation = await aiService.generateCardInterpretation({
            cardId,
            isReversed,
            question,
            userId
        });

        res.json({
            success: true,
            interpretation
        });

    } catch (error) {
        logger.error('Ошибка генерации интерпретации карты:', error);
        res.status(500).json({
            success: false,
            message: 'Не удалось сгенерировать интерпретацию'
        });
    }
};

/**
 * Генерация персональной карты через AI
 */
const generatePersonalCard = async (req, res) => {
    try {
        const userId = req.user.id;
        const { 
            birthDate, 
            name, 
            preferences,
            question 
        } = req.body;

        const personalCard = await aiService.generatePersonalCard({
            userId,
            birthDate,
            name,
            preferences,
            question
        });

        res.json({
            success: true,
            personalCard
        });

    } catch (error) {
        logger.error('Ошибка генерации персональной карты:', error);
        res.status(500).json({
            success: false,
            message: 'Не удалось создать персональную карту'
        });
    }
};

/**
 * Анализ фотографии через AI
 */
const analyzePhoto = async (req, res) => {
    try {
        const userId = req.user.id;
        
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'Файл изображения не найден'
            });
        }

        const analysis = await aiService.analyzePhoto({
            userId,
            imageBuffer: req.file.buffer,
            mimeType: req.file.mimetype,
            originalName: req.file.originalname
        });

        res.json({
            success: true,
            analysis
        });

    } catch (error) {
        logger.error('Ошибка анализа фотографии:', error);
        res.status(500).json({
            success: false,
            message: 'Не удалось проанализировать фотографию'
        });
    }
};

/**
 * Обработка голосового сообщения
 */
const processVoiceMessage = async (req, res) => {
    try {
        const userId = req.user.id;
        
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'Аудиофайл не найден'
            });
        }

        const voiceAnalysis = await aiService.processVoiceMessage({
            userId,
            audioBuffer: req.file.buffer,
            mimeType: req.file.mimetype
        });

        res.json({
            success: true,
            voiceAnalysis
        });

    } catch (error) {
        logger.error('Ошибка обработки голосового сообщения:', error);
        res.status(500).json({
            success: false,
            message: 'Не удалось обработать голосовое сообщение'
        });
    }
};

/**
 * Получение рекомендаций на основе истории пользователя
 */
const getPersonalizedRecommendations = async (req, res) => {
    try {
        const userId = req.user.id;
        const { type = 'general' } = req.query;

        const recommendations = await aiService.generatePersonalizedRecommendations({
            userId,
            type
        });

        res.json({
            success: true,
            recommendations
        });

    } catch (error) {
        logger.error('Ошибка получения рекомендаций:', error);
        res.status(500).json({
            success: false,
            message: 'Не удалось получить рекомендации'
        });
    }
};

/**
 * Генерация ежедневного гороскопа
 */
const generateDailyHoroscope = async (req, res) => {
    try {
        const userId = req.user.id;
        const { zodiacSign, birthDate } = req.body;

        const horoscope = await aiService.generateDailyHoroscope({
            userId,
            zodiacSign,
            birthDate
        });

        res.json({
            success: true,
            horoscope
        });

    } catch (error) {
        logger.error('Ошибка генерации гороскопа:', error);
        res.status(500).json({
            success: false,
            message: 'Не удалось сгенерировать гороскоп'
        });
    }
};

/**
 * Анализ совместимости
 */
const analyzeCompatibility = async (req, res) => {
    try {
        const userId = req.user.id;
        const { 
            user1BirthDate, 
            user2BirthDate, 
            relationshipType = 'romantic' 
        } = req.body;

        if (!user1BirthDate || !user2BirthDate) {
            return res.status(400).json({
                success: false,
                message: 'Даты рождения обеих сторон обязательны'
            });
        }

        const compatibility = await aiService.analyzeCompatibility({
            userId,
            user1BirthDate,
            user2BirthDate,
            relationshipType
        });

        res.json({
            success: true,
            compatibility
        });

    } catch (error) {
        logger.error('Ошибка анализа совместимости:', error);
        res.status(500).json({
            success: false,
            message: 'Не удалось проанализировать совместимость'
        });
    }
};

/**
 * Получение статистики использования AI
 */
const getAIUsageStats = async (req, res) => {
    try {
        const userId = req.user.id;
        
        const stats = await aiService.getUsageStats(userId);

        res.json({
            success: true,
            stats
        });

    } catch (error) {
        logger.error('Ошибка получения статистики AI:', error);
        res.status(500).json({
            success: false,
            message: 'Не удалось получить статистику'
        });
    }
};

module.exports = {
    interpretReading,
    generateCardInterpretation,
    generatePersonalCard,
    analyzePhoto,
    processVoiceMessage,
    getPersonalizedRecommendations,
    generateDailyHoroscope,
    analyzeCompatibility,
    getAIUsageStats
};