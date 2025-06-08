// server/src/services/aiService.js
const axios = require('axios');
const FormData = require('form-data');
const logger = require('../utils/logger');

class AIService {
    constructor() {
        this.yandexGptApiKey = process.env.YANDEX_GPT_API_KEY;
        this.kandinskyApiKey = process.env.KANDINSKY_API_KEY;
        this.whisperApiKey = process.env.OPENAI_API_KEY;
        this.yandexGptFolderId = process.env.YANDEX_FOLDER_ID;
    }

    /**
     * Генерация интерпретации расклада через YandexGPT
     */
    async generateInterpretation(cards, question, userProfile = {}) {
        try {
            const cardsDescription = cards.map(card => 
                `${card.card_name}${card.isReversed ? ' (перевернутая)' : ''}: ${card.isReversed ? card.reversed_meaning : card.card_meaning}`
            ).join('\n');

            const prompt = this.buildInterpretationPrompt(cardsDescription, question, userProfile);

            const response = await axios.post(
                'https://llm.api.cloud.yandex.net/foundationModels/v1/completion',
                {
                    modelUri: `gpt://${this.yandexGptFolderId}/yandexgpt-lite/latest`,
                    completionOptions: {
                        stream: false,
                        temperature: 0.7,
                        maxTokens: 1000
                    },
                    messages: [
                        {
                            role: 'system',
                            text: 'Ты опытная гадалка-таролог с 30-летним стажем. Твои предсказания точны и помогают людям. Говори мистически, но понятно. Используй образы и метафоры.'
                        },
                        {
                            role: 'user',
                            text: prompt
                        }
                    ]
                },
                {
                    headers: {
                        'Authorization': `Api-Key ${this.yandexGptApiKey}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            return response.data.result.alternatives[0].message.text;

        } catch (error) {
            logger.error('Ошибка генерации интерпретации:', error);
            throw new Error('Не удалось сгенерировать интерпретацию');
        }
    }

    /**
     * Создание промпта для интерпретации
     */
    buildInterpretationPrompt(cardsDescription, question, userProfile) {
        const { birth_date, numerology_profile } = userProfile;
        
        let contextInfo = '';
        if (birth_date) {
            contextInfo += `Дата рождения: ${birth_date}\n`;
        }
        if (numerology_profile?.life_path_number) {
            contextInfo += `Число жизненного пути: ${numerology_profile.life_path_number}\n`;
        }

        return `
Вопрос: "${question}"

Выпавшие карты:
${cardsDescription}

${contextInfo ? `Личная информация:\n${contextInfo}` : ''}

Дай детальную интерпретацию расклада, учитывая:
1. Прямую связь между вопросом и картами
2. Символизм и архетипы карт
3. Взаимодействие карт между собой
4. Практические советы для вопрошающего
5. Временные рамки событий

Ответ должен быть структурированным, мистическим по стилю, но практичным по содержанию. Длина 400-600 слов.
        `.trim();
    }

    /**
     * Генерация изображения карты через Kandinsky
     */
    async generateCardImage(cardName, cardMeaning, userPhoto = null, style = 'mystical') {
        try {
            const prompt = this.buildImagePrompt(cardName, cardMeaning, userPhoto, style);
            
            // Получаем UUID модели
            const modelsResponse = await axios.get(
                'https://api-key.fusionbrain.ai/key/api/v1/models',
                {
                    headers: {
                        'X-Key': `Key ${this.kandinskyApiKey}`,
                        'X-Secret': `Secret ${process.env.KANDINSKY_SECRET_KEY}`
                    }
                }
            );

            const modelId = modelsResponse.data[0].id;

            // Создаем запрос на генерацию
            const generateResponse = await axios.post(
                'https://api-key.fusionbrain.ai/key/api/v1/text2image/run',
                {
                    type: 'GENERATE',
                    numImages: 1,
                    width: 512,
                    height: 768,
                    generateParams: {
                        query: prompt
                    }
                },
                {
                    headers: {
                        'X-Key': `Key ${this.kandinskyApiKey}`,
                        'X-Secret': `Secret ${process.env.KANDINSKY_SECRET_KEY}`,
                        'Content-Type': 'application/json'
                    },
                    params: {
                        model_id: modelId
                    }
                }
            );

            const requestId = generateResponse.data.uuid;

            // Ждем готовности изображения
            return await this.waitForImageGeneration(requestId);

        } catch (error) {
            logger.error('Ошибка генерации изображения:', error);
            throw new Error('Не удалось сгенерировать изображение карты');
        }
    }

    /**
     * Создание промпта для генерации изображения
     */
    buildImagePrompt(cardName, cardMeaning, userPhoto, style) {
        const basePrompts = {
            mystical: 'мистическая карта таро, темные тона, фиолетовые и золотые акценты, магическая атмосфера',
            classic: 'классическая карта таро в стиле Райдера-Уэйта, детализированная, символичная',
            modern: 'современная интерпретация карты таро, минималистичная, элегантная',
            personal: 'персонализированная карта таро с элементами личной истории человека'
        };

        let prompt = `${basePrompts[style] || basePrompts.mystical}, ${cardName}, ${cardMeaning}`;
        
        if (userPhoto) {
            prompt += ', с элементами внешности человека, персонализированная под личность';
        }

        prompt += ', высокое качество, детализированная прорисовка, мистическая символика, красивая композиция';

        return prompt;
    }

    /**
     * Ожидание готовности сгенерированного изображения
     */
    async waitForImageGeneration(requestId, maxAttempts = 20) {
        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            try {
                const statusResponse = await axios.get(
                    `https://api-key.fusionbrain.ai/key/api/v1/text2image/status/${requestId}`,
                    {
                        headers: {
                            'X-Key': `Key ${this.kandinskyApiKey}`,
                            'X-Secret': `Secret ${process.env.KANDINSKY_SECRET_KEY}`
                        }
                    }
                );

                const status = statusResponse.data.status;

                if (status === 'DONE') {
                    return statusResponse.data.images[0];
                } else if (status === 'FAIL') {
                    throw new Error('Генерация изображения failed');
                }

                // Ждем 3 секунды перед следующей проверкой
                await new Promise(resolve => setTimeout(resolve, 3000));

            } catch (error) {
                if (attempt === maxAttempts - 1) {
                    throw error;
                }
                await new Promise(resolve => setTimeout(resolve, 3000));
            }
        }

        throw new Error('Таймаут генерации изображения');
    }

    /**
     * Распознавание речи через Whisper
     */
    async speechToText(audioBuffer, language = 'ru') {
        try {
            const formData = new FormData();
            formData.append('file', audioBuffer, 'audio.webm');
            formData.append('model', 'whisper-1');
            formData.append('language', language);

            const response = await axios.post(
                'https://api.openai.com/v1/audio/transcriptions',
                formData,
                {
                    headers: {
                        'Authorization': `Bearer ${this.whisperApiKey}`,
                        ...formData.getHeaders()
                    }
                }
            );

            return response.data.text;

        } catch (error) {
            logger.error('Ошибка распознавания речи:', error);
            throw new Error('Не удалось распознать речь');
        }
    }

    /**
     * Анализ фото пользователя для персонализации
     */
    async analyzeUserPhoto(photoBuffer) {
        try {
            // Здесь можно использовать различные AI сервисы для анализа лица
            // Например, анализ эмоций, возраста, черт лица и т.д.
            
            const prompt = `
Проанализируй это фото и создай описание для персонализации карт таро:
- Основные черты лица
- Предполагаемый возраст
- Эмоциональное состояние
- Энергетика человека
- Цветовая палитра для карт
- Стиль оформления карт под этого человека
            `;

            // Здесь должен быть вызов к Vision API (например, OpenAI GPT-4 Vision)
            // Пока возвращаем заглушку
            return {
                age_range: '25-35',
                dominant_colors: ['#4a5568', '#9f7aea', '#ed8936'],
                energy_type: 'calm_introspective',
                recommended_style: 'mystical_purple',
                facial_features: 'gentle_eyes_warm_smile',
                suggested_symbolism: ['water', 'moon', 'intuition']
            };

        } catch (error) {
            logger.error('Ошибка анализа фото:', error);
            throw new Error('Не удалось проанализировать фото');
        }
    }

    /**
     * Генерация персональных рекомендаций
     */
    async generatePersonalRecommendations(userProfile, recentReadings = []) {
        try {
            const context = this.buildRecommendationsContext(userProfile, recentReadings);
            
            const prompt = `
На основе профиля пользователя и истории гаданий, создай персональные рекомендации:

${context}

Создай рекомендации по следующим категориям:
1. Энергетические практики на сегодня
2. Лучшее время для важных решений
3. На что обратить внимание в отношениях
4. Карьерные возможности
5. Духовное развитие

Каждая рекомендация должна быть конкретной и практичной.
            `;

            const response = await axios.post(
                'https://llm.api.cloud.yandex.net/foundationModels/v1/completion',
                {
                    modelUri: `gpt://${this.yandexGptFolderId}/yandexgpt-lite/latest`,
                    completionOptions: {
                        stream: false,
                        temperature: 0.6,
                        maxTokens: 800
                    },
                    messages: [
                        {
                            role: 'system',
                            text: 'Ты мудрый духовный наставник. Даешь практичные советы, основанные на мистических знаниях.'
                        },
                        {
                            role: 'user',
                            text: prompt
                        }
                    ]
                },
                {
                    headers: {
                        'Authorization': `Api-Key ${this.yandexGptApiKey}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            return this.parseRecommendations(response.data.result.alternatives[0].message.text);

        } catch (error) {
            logger.error('Ошибка генерации рекомендаций:', error);
            throw new Error('Не удалось сгенерировать рекомендации');
        }
    }

    /**
     * Построение контекста для рекомендаций
     */
    buildRecommendationsContext(userProfile, recentReadings) {
        let context = `Профиль пользователя:\n`;
        
        if (userProfile.birth_date) {
            context += `Дата рождения: ${userProfile.birth_date}\n`;
        }
        
        if (userProfile.numerology_profile) {
            context += `Нумерологический профиль: ${JSON.stringify(userProfile.numerology_profile)}\n`;
        }

        if (recentReadings.length > 0) {
            context += `\nПоследние гадания:\n`;
            recentReadings.forEach((reading, index) => {
                context += `${index + 1}. Вопрос: "${reading.question}" - Результат: ${reading.interpretation.substring(0, 100)}...\n`;
            });
        }

        return context;
    }

    /**
     * Парсинг рекомендаций из ответа AI
     */
    parseRecommendations(text) {
        const sections = text.split(/\d+\.\s*/);
        
        return {
            energy_practices: sections[1]?.trim() || '',
            decision_timing: sections[2]?.trim() || '',
            relationships: sections[3]?.trim() || '',
            career: sections[4]?.trim() || '',
            spiritual_growth: sections[5]?.trim() || ''
        };
    }
}

module.exports = new AIService();