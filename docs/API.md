# MISTIKA API Documentation

## Обзор

MISTIKA API предоставляет доступ к функциям мистического Таро-приложения через RESTful интерфейс. API позволяет выполнять гадания, управлять пользователями, обрабатывать платежи и интегрироваться с Telegram.

### Базовая информация

- **Базовый URL**: `https://api.mistika.app/v1`
- **Формат данных**: JSON
- **Аутентификация**: Bearer Token
- **Версионирование**: URL-based (`/v1/`)

## Аутентификация

### Telegram WebApp

```http
POST /auth/telegram
Content-Type: application/json

{
  "telegramId": 123456789,
  "firstName": "Иван",
  "lastName": "Петров",
  "username": "ivan_petrov",
  "languageCode": "ru"
}
```

**Ответ:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "telegramId": 123456789,
      "firstName": "Иван",
      "isPremium": false
    },
    "token": "jwt_token_here"
  }
}
```

### Использование токена

Все защищенные эндпоинты требуют заголовок Authorization:

```
Authorization: Bearer {jwt_token}
```

## Пользователи

### Получение профиля

```http
GET /auth/profile
Authorization: Bearer {token}
```

**Ответ:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "telegramId": 123456789,
      "firstName": "Иван",
      "lastName": "Петров",
      "isPremium": false,
      "subscription": null,
      "stats": {
        "totalReadings": 25,
        "currentStreak": 3,
        "lastReadingAt": "2024-01-15T10:30:00Z"
      },
      "preferences": {
        "theme": "dark",
        "notifications": {
          "daily_card": true,
          "premium_expiry": true
        }
      }
    }
  }
}
```

### Обновление профиля

```http
PUT /auth/profile
Authorization: Bearer {token}
Content-Type: application/json

{
  "birthDate": "1990-05-15",
  "timezone": "Europe/Moscow",
  "preferences": {
    "theme": "dark",
    "notifications": {
      "daily_card": true,
      "promotional": false
    }
  }
}
```

## Карты и Гадания

### Получение дневной карты

```http
GET /cards/daily
Authorization: Bearer {token}
```

**Ответ:**
```json
{
  "success": true,
  "data": {
    "card": {
      "id": "uuid",
      "cardName": "Дурак",
      "cardNumber": 0,
      "suit": null,
      "cardType": "major_arcana",
      "imageUrl": "https://cdn.mistika.app/cards/fool.jpg",
      "keywordsUpright": ["новые начинания", "спонтанность", "свобода"],
      "keywordsReversed": ["безрассудство", "хаос", "беспечность"]
    },
    "isReversed": false,
    "interpretation": "Сегодня день новых возможностей...",
    "date": "2024-01-15",
    "alreadyDrawn": false
  }
}
```

### Создание расклада

```http
POST /spreads/reading
Authorization: Bearer {token}
Content-Type: application/json

{
  "spreadId": "three_card",
  "question": "Что ждет меня в отношениях?"
}
```

**Ответ:**
```json
{
  "success": true,
  "data": {
    "reading": {
      "id": "uuid",
      "spreadId": "three_card",
      "question": "Что ждет меня в отношениях?",
      "cards": [
        {
          "card": {
            "id": "uuid",
            "cardName": "Двойка Кубков",
            "suit": "cups"
          },
          "position": {
            "name": "Прошлое",
            "meaning": "События прошлого, влияющие на ситуацию"
          },
          "isReversed": false,
          "interpretation": "В прошлом у вас была гармония..."
        }
      ],
      "createdAt": "2024-01-15T10:30:00Z"
    }
  }
}
```

### Получение доступных раскладов

```http
GET /spreads
```

**Ответ:**
```json
{
  "success": true,
  "data": {
    "spreads": [
      {
        "id": "one_card",
        "name": "Одна карта",
        "description": "Быстрый ответ на конкретный вопрос",
        "cardCount": 1,
        "difficulty": "easy",
        "isPremium": false
      },
      {
        "id": "celtic_cross",
        "name": "Кельтский крест",
        "description": "Полный анализ жизненной ситуации",
        "cardCount": 10,
        "difficulty": "advanced",
        "isPremium": true
      }
    ]
  }
}
```

### История гаданий

```http
GET /spreads/reading/history?page=1&limit=10
Authorization: Bearer {token}
```

## AI и Анализ

### Генерация интерпретации

```http
POST /ai/interpret-card
Authorization: Bearer {token}
Content-Type: application/json

{
  "cardId": "uuid",
  "isReversed": false,
  "question": "Как развить карьеру?",
  "context": "work"
}
```

### Анализ фотографии

```http
POST /ai/analyze-photo
Authorization: Bearer {token}
Content-Type: multipart/form-data

image: [file]
question: "Что вы видите на этой фотографии?"
```

**Ответ:**
```json
{
  "success": true,
  "data": {
    "analysis": {
      "objects": ["человек", "дерево", "дом"],
      "mood": "спокойный",
      "colors": ["зеленый", "коричневый"],
      "interpretation": "На фотографии я вижу гармоничную композицию...",
      "recommendations": [
        "Обратите внимание на связь с природой",
        "Важность домашнего очага"
      ]
    }
  }
}
```

### Обработка голосового сообщения

```http
POST /ai/voice-message
Authorization: Bearer {token}
Content-Type: multipart/form-data

audio: [file]
```

## Платежи и Подписки

### Получение планов подписки

```http
GET /payments/plans
```

**Ответ:**
```json
{
  "success": true,
  "data": {
    "plans": [
      {
        "id": "uuid",
        "name": "Месячная подписка",
        "price": 299,
        "currency": "RUB",
        "period": "month",
        "features": [
          "Безлимитные гадания",
          "Эксклюзивные расклады",
          "AI анализ фотографий"
        ]
      }
    ]
  }
}
```

### Создание платежа

```http
POST /payments/create
Authorization: Bearer {token}
Content-Type: application/json

{
  "planId": "uuid",
  "paymentMethod": "card",
  "promoCode": "WELCOME2024"
}
```

**Ответ:**
```json
{
  "success": true,
  "data": {
    "payment": {
      "id": "uuid",
      "amount": 199,
      "currency": "RUB",
      "status": "pending",
      "paymentUrl": "https://pay.mistika.app/payment/uuid",
      "expiresAt": "2024-01-15T11:30:00Z"
    }
  }
}
```

### Статус подписки

```http
GET /payments/subscription
Authorization: Bearer {token}
```

## Нумерология

### Расчет нумерологических чисел

```http
POST /numerology/calculate
Authorization: Bearer {token}
Content-Type: application/json

{
  "birthDate": "1990-05-15",
  "fullName": "Иван Петров"
}
```

**Ответ:**
```json
{
  "success": true,
  "data": {
    "lifePathNumber": 7,
    "destinyNumber": 3,
    "personalityNumber": 5,
    "analysis": {
      "lifePath": "Число 7 указывает на духовный поиск...",
      "destiny": "Число 3 говорит о творческом потенциале...",
      "personality": "Число 5 отражает любовь к свободе..."
    }
  }
}
```

### Совместимость

```http
POST /numerology/compatibility
Authorization: Bearer {token}
Content-Type: application/json

{
  "person1": {
    "birthDate": "1990-05-15",
    "name": "Иван"
  },
  "person2": {
    "birthDate": "1992-08-20",
    "name": "Мария"
  },
  "relationshipType": "romantic"
}
```

## Лунный календарь

### Текущая лунная информация

```http
GET /lunar/today
```

**Ответ:**
```json
{
  "success": true,
  "data": {
    "date": "2024-01-15",
    "moonPhase": {
      "name": "Растущая Луна",
      "symbol": "🌔",
      "energy": "Рост, развитие, привлечение"
    },
    "lunarDay": 8,
    "zodiacSign": {
      "name": "Луна в Близнецах",
      "element": "Воздух",
      "energy": "Коммуникативная"
    },
    "recommendations": {
      "recommended": [
        "Развитие новых навыков",
        "Активная работа над проектами"
      ],
      "avoid": [
        "Сдаваться при первых трудностях"
      ]
    }
  }
}
```

### Лунный календарь на период

```http
GET /lunar/calendar?startDate=2024-01-15&endDate=2024-01-22
```

## Аналитика

### Статистика пользователя

```http
GET /analytics/user-stats
Authorization: Bearer {token}
```

**Ответ:**
```json
{
  "success": true,
  "data": {
    "stats": {
      "totalReadings": 125,
      "monthlyReadings": 15,
      "currentStreak": 7,
      "favoriteTypes": [
        {
          "type": "daily",
          "count": 45
        },
        {
          "type": "three_card",
          "count": 30
        }
      ],
      "weeklyActivity": [
        { "dayOfWeek": 1, "count": 8 },
        { "dayOfWeek": 2, "count": 12 }
      ]
    }
  }
}
```

### Экспорт данных

```http
GET /analytics/export?format=json
Authorization: Bearer {token}
```

## Telegram интеграция

### Отправка сообщения

```http
POST /telegram/send-message
Authorization: Bearer {token}
Content-Type: application/json

{
  "chatId": 123456789,
  "message": "Ваша дневная карта готова!",
  "options": {
    "parse_mode": "HTML",
    "reply_markup": {
      "inline_keyboard": [[
        {
          "text": "Посмотреть карту",
          "web_app": {
            "url": "https://mistika.app/daily"
          }
        }
      ]]
    }
  }
}
```

## Коды ошибок

### HTTP статусы

- `200` - Успешный запрос
- `201` - Ресурс создан
- `400` - Неверный запрос
- `401` - Требуется аутентификация
- `403` - Доступ запрещен
- `404` - Ресурс не найден
- `429` - Превышен лимит запросов
- `500` - Внутренняя ошибка сервера

### Коды ошибок приложения

```json
{
  "success": false,
  "error": {
    "code": "PREMIUM_REQUIRED",
    "message": "Эта функция доступна только для премиум пользователей",
    "details": {
      "feature": "ai_photo_analysis",
      "requiredPlan": "premium"
    }
  }
}
```

**Основные коды:**

- `VALIDATION_ERROR` - Ошибка валидации данных
- `AUTH_REQUIRED` - Требуется аутентификация
- `PREMIUM_REQUIRED` - Требуется премиум подписка
- `RATE_LIMIT_EXCEEDED` - Превышен лимит запросов
- `DAILY_LIMIT_EXCEEDED` - Превышен дневной лимит
- `USER_NOT_FOUND` - Пользователь не найден
- `CARD_NOT_FOUND` - Карта не найдена
- `PAYMENT_FAILED` - Ошибка платежа

## Rate Limiting

API имеет ограничения на количество запросов:

- **По умолчанию**: 100 запросов за 15 минут
- **AI анализ**: 10 запросов в час
- **Премиум функции**: 5 запросов в час для бесплатных пользователей

Заголовки ответа:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1642234567
```

## Пагинация

Для списочных запросов поддерживается пагинация:

```http
GET /spreads/reading/history?page=2&limit=10
```

**Ответ с пагинацией:**
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 2,
    "limit": 10,
    "total": 150,
    "totalPages": 15,
    "hasNext": true,
    "hasPrev": true
  }
}
```

## Webhooks

### Telegram Webhook

```http
POST /telegram/webhook
Content-Type: application/json

{
  "update_id": 123456789,
  "message": {
    "message_id": 1,
    "from": {
      "id": 123456789,
      "first_name": "Иван"
    },
    "chat": {
      "id": 123456789,
      "type": "private"
    },
    "text": "/start"
  }
}
```

### Платежные Webhooks

```http
POST /payments/webhook
Content-Type: application/json
X-Payment-Signature: signature

{
  "event": "payment.completed",
  "data": {
    "paymentId": "uuid",
    "status": "completed",
    "amount": 299,
    "currency": "RUB"
  }
}
```

## SDK и библиотеки

### JavaScript SDK

```javascript
import { MistikaAPI } from '@mistika/sdk';

const api = new MistikaAPI({
  token: 'your_jwt_token',
  baseURL: 'https://api.mistika.app/v1'
});

// Получение дневной карты
const dailyCard = await api.cards.getDaily();

// Создание расклада
const reading = await api.spreads.createReading({
  spreadId: 'three_card',
  question: 'Что меня ждет?'
});
```

### Python SDK

```python
from mistika import MistikaAPI

api = MistikaAPI(token='your_jwt_token')

# Получение дневной карты
daily_card = api.cards.get_daily()

# Создание расклада
reading = api.spreads.create_reading(
    spread_id='three_card',
    question='Что меня ждет?'
)
```

## Тестирование

### Тестовые данные

Для тестирования используйте тестовые токены:

```
Test Token: test_token_123456789
Telegram ID: 123456789 (тестовый пользователь)
```

### Sandbox режим

```
Base URL: https://api-sandbox.mistika.app/v1
```

В sandbox режиме:
- Платежи не обрабатываются реально
- AI анализ возвращает заглушки
- Telegram сообщения не отправляются

## Поддержка

- **Email**: api@mistika.app
- **Telegram**: @mistika_support
- **Документация**: https://docs.mistika.app
- **Статус API**: https://status.mistika.app