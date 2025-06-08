-- Пользователи приложения
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    telegram_id BIGINT UNIQUE NOT NULL,
    username VARCHAR(255),
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    language_code VARCHAR(10) DEFAULT 'ru',
    photo_url TEXT,
    
    -- Персональные данные для генерации карт
    birth_date DATE,
    birth_time TIME,
    birth_place VARCHAR(255),
    
    -- Подписка и статус
    subscription_type VARCHAR(50) DEFAULT 'basic', -- basic, mystic, master, grandmaster
    subscription_expires_at TIMESTAMP,
    
    -- Статистика
    total_readings INTEGER DEFAULT 0,
    daily_readings_count INTEGER DEFAULT 0,
    last_daily_reading DATE,
    
    -- Настройки
    notifications_enabled BOOLEAN DEFAULT true,
    voice_assistant_type VARCHAR(50) DEFAULT 'grandmother', -- grandmother, young_mystic
    preferred_deck VARCHAR(50) DEFAULT 'classic',
    
    -- Реферальная система
    referral_code VARCHAR(20) UNIQUE,
    referred_by BIGINT REFERENCES users(telegram_id),
    referral_earnings DECIMAL(10,2) DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Персональные колоды карт
CREATE TABLE personal_decks (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(telegram_id) ON DELETE CASCADE,
    deck_name VARCHAR(255) NOT NULL,
    deck_type VARCHAR(50) DEFAULT 'tarot', -- tarot, oracle, lenormand
    is_default BOOLEAN DEFAULT false,
    
    -- Параметры генерации
    generation_prompt TEXT,
    style_preferences JSONB,
    color_palette JSONB,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Карты в персональных колодах
CREATE TABLE cards (
    id BIGSERIAL PRIMARY KEY,
    deck_id BIGINT REFERENCES personal_decks(id) ON DELETE CASCADE,
    card_number INTEGER NOT NULL, -- 0-77 для таро
    card_name VARCHAR(255) NOT NULL,
    card_meaning TEXT,
    reversed_meaning TEXT,
    
    -- Сгенерированное изображение
    image_url TEXT,
    image_generation_prompt TEXT,
    image_metadata JSONB,
    
    -- Для NFT (премиум функция)
    nft_token_id VARCHAR(255),
    nft_metadata JSONB,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Расклады (шаблоны)
CREATE TABLE spread_templates (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    cards_count INTEGER NOT NULL,
    positions JSONB NOT NULL, -- Позиции карт и их значения
    difficulty_level INTEGER DEFAULT 1, -- 1-5
    category VARCHAR(100), -- love, career, health, general
    is_premium BOOLEAN DEFAULT false,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Гадания пользователей
CREATE TABLE readings (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(telegram_id) ON DELETE CASCADE,
    spread_template_id BIGINT REFERENCES spread_templates(id),
    deck_id BIGINT REFERENCES personal_decks(id),
    
    -- Вопрос и контекст
    question TEXT,
    question_audio_url TEXT,
    context JSONB, -- Дополнительная информация (фото, голос и т.д.)
    
    -- Выпавшие карты
    cards_drawn JSONB NOT NULL, -- Массив с картами и их позициями
    interpretation TEXT, -- Интерпретация от AI
    
    -- Метаданные
    reading_type VARCHAR(50), -- daily, question, emergency
    is_shared BOOLEAN DEFAULT false,
    accuracy_rating INTEGER, -- 1-5, оценка пользователя
    
    -- Предсказания
    predicted_outcome TEXT,
    outcome_date DATE,
    outcome_confirmed BOOLEAN,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Мистические круги (группы пользователей)
CREATE TABLE mystic_circles (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    creator_id BIGINT REFERENCES users(telegram_id),
    max_members INTEGER DEFAULT 7,
    is_private BOOLEAN DEFAULT true,
    invite_code VARCHAR(20) UNIQUE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Участники мистических кругов
CREATE TABLE circle_members (
    id BIGSERIAL PRIMARY KEY,
    circle_id BIGINT REFERENCES mystic_circles(id) ON DELETE CASCADE,
    user_id BIGINT REFERENCES users(telegram_id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'member', -- creator, admin, member
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(circle_id, user_id)
);

-- Групповые гадания
CREATE TABLE circle_readings (
    id BIGSERIAL PRIMARY KEY,
    circle_id BIGINT REFERENCES mystic_circles(id) ON DELETE CASCADE,
    initiator_id BIGINT REFERENCES users(telegram_id),
    question TEXT NOT NULL,
    
    -- Комбинированный результат от всех участников
    combined_cards JSONB,
    combined_interpretation TEXT,
    
    status VARCHAR(50) DEFAULT 'pending', -- pending, active, completed
    expires_at TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Участие в групповых гаданиях
CREATE TABLE circle_reading_participants (
    id BIGSERIAL PRIMARY KEY,
    circle_reading_id BIGINT REFERENCES circle_readings(id) ON DELETE CASCADE,
    user_id BIGINT REFERENCES users(telegram_id),
    
    -- Вклад участника
    cards_contributed JSONB,
    energy_contribution INTEGER DEFAULT 0,
    participated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Платежи и транзакции
CREATE TABLE payments (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(telegram_id),
    telegram_payment_id VARCHAR(255) UNIQUE,
    
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'RUB',
    payment_type VARCHAR(50), -- subscription, single_reading, premium_feature
    
    -- Детали подписки
    subscription_type VARCHAR(50),
    subscription_months INTEGER,
    
    status VARCHAR(50) DEFAULT 'pending', -- pending, completed, failed, refunded
    provider_data JSONB,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Отправленные предсказания друзьям
CREATE TABLE friend_predictions (
    id BIGSERIAL PRIMARY KEY,
    sender_id BIGINT REFERENCES users(telegram_id),
    recipient_telegram_id BIGINT,
    
    prediction_text TEXT NOT NULL,
    card_image_url TEXT,
    reveal_condition JSONB, -- Условия показа (время, место, событие)
    
    is_revealed BOOLEAN DEFAULT false,
    revealed_at TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Лунный календарь и рекомендации
CREATE TABLE lunar_events (
    id BIGSERIAL PRIMARY KEY,
    event_date DATE NOT NULL,
    moon_phase VARCHAR(50) NOT NULL, -- new_moon, waxing_crescent, first_quarter, etc.
    moon_sign VARCHAR(50), -- aries, taurus, gemini, etc.
    
    energy_type VARCHAR(100),
    recommendations TEXT,
    best_activities JSONB,
    avoid_activities JSONB,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Персональные рекомендации по лунному календарю
CREATE TABLE user_lunar_recommendations (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(telegram_id) ON DELETE CASCADE,
    lunar_event_id BIGINT REFERENCES lunar_events(id),
    
    personalized_message TEXT,
    is_sent BOOLEAN DEFAULT false,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Нумерологические расчеты
CREATE TABLE numerology_profiles (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(telegram_id) ON DELETE CASCADE,
    
    -- Основные числа
    life_path_number INTEGER,
    destiny_number INTEGER,
    soul_urge_number INTEGER,
    personality_number INTEGER,
    
    -- Расчеты
    calculation_data JSONB,
    interpretation TEXT,
    
    -- Совместимость (если есть партнер)
    compatibility_data JSONB,
    
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Аналитика и метрики
CREATE TABLE user_analytics (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(telegram_id) ON DELETE CASCADE,
    event_date DATE NOT NULL,
    
    -- Активность
    readings_count INTEGER DEFAULT 0,
    time_spent_minutes INTEGER DEFAULT 0,
    features_used JSONB,
    
    -- Точность предсказаний
    predictions_made INTEGER DEFAULT 0,
    predictions_confirmed INTEGER DEFAULT 0,
    average_accuracy DECIMAL(3,2),
    
    -- Вовлеченность
    shared_readings INTEGER DEFAULT 0,
    friend_invites INTEGER DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(user_id, event_date)
);

-- Индексы для оптимизации
CREATE INDEX idx_users_telegram_id ON users(telegram_id);
CREATE INDEX idx_users_subscription ON users(subscription_type, subscription_expires_at);
CREATE INDEX idx_readings_user_id ON readings(user_id);
CREATE INDEX idx_readings_created_at ON readings(created_at DESC);
CREATE INDEX idx_cards_deck_id ON cards(deck_id);
CREATE INDEX idx_payments_user_id ON payments(user_id);
CREATE INDEX idx_analytics_user_date ON user_analytics(user_id, event_date);

-- Функция обновления updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Триггеры для автообновления updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_numerology_profiles_updated_at BEFORE UPDATE ON numerology_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();