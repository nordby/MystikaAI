# 🔮 MISTIKA - Мистическое Таро Приложение

MISTIKA - это современное веб-приложение для гаданий на картах Таро с интеграцией Telegram WebApp и возможностями искусственного интеллекта.

## ✨ Основные возможности

### 🎴 Гадания
- **Дневная карта** - персональная карта на каждый день
- **Классические расклады** - от простых до сложных (Кельтский крест, Три карты и др.)
- **Пользовательские расклады** - создание собственных схем гадания
- **История гаданий** - сохранение и анализ всех сессий

### 🤖 AI Возможности
- **Интеллектуальные интерпретации** - глубокий анализ карт с помощью YandexGPT
- **Анализ фотографий** - мистический анализ изображений через Kandinsky AI
- **Голосовые гадания** - обработка голосовых вопросов через OpenAI Whisper
- **Персональные карты** - генерация уникальных карт на основе данных пользователя

### 🔢 Эзотерические расчеты
- **Нумерология** - расчет чисел судьбы, жизненного пути и совместимости
- **Лунный календарь** - влияние лунных фаз и астрологических событий
- **Мистический круг** - анализ энергетического баланса

### 📱 Telegram интеграция
- **Telegram WebApp** - полнофункциональное веб-приложение в Telegram
- **Telegram Bot** - быстрый доступ к основным функциям
- **Уведомления** - напоминания о дневных картах и важных событиях

### 💎 Премиум возможности
- **Безлимитные гадания** - без ограничений на количество
- **Эксклюзивные расклады** - доступ к сложным и уникальным раскладам
- **AI анализ** - все возможности искусственного интеллекта
- **Детальная аналитика** - углубленная статистика и инсайты

## 🏗️ Архитектура

### Технологический стек

**Frontend:**
- React 18 с Hooks
- Zustand для управления состоянием
- Tailwind CSS для стилизации
- Vite для сборки

**Backend:**
- Node.js + Express
- PostgreSQL с Sequelize ORM
- Redis для кэширования
- JWT аутентификация

**Bot:**
- Node.js Telegram Bot API
- Webhook интеграция
- Middleware архитектура

**AI Services:**
- YandexGPT для текстовых интерпретаций
- Kandinsky AI для анализа изображений
- OpenAI Whisper для обработки голоса

**Инфраструктура:**
- Docker контейнеризация
- Nginx reverse proxy
- Prometheus + Grafana мониторинг
- SSL/TLS шифрование

### Структура проекта

```
mistika-app/
├── client/                 # React веб-приложение
│   ├── public/
│   ├── src/
│   │   ├── components/     # Переиспользуемые компоненты
│   │   ├── pages/         # Основные страницы
│   │   ├── hooks/         # Custom React hooks
│   │   ├── services/      # API сервисы
│   │   ├── store/         # Zustand хранилища
│   │   └── utils/         # Утилиты
│   └── package.json
├── server/                # Node.js backend
│   ├── src/
│   │   ├── controllers/   # API контроллеры
│   │   ├── models/        # Модели базы данных
│   │   ├── routes/        # API маршруты
│   │   ├── services/      # Бизнес логика
│   │   ├── middleware/    # Middleware функции
│   │   └── database/      # База данных и миграции
│   └── package.json
├── bot/                   # Telegram Bot
│   ├── src/
│   │   ├── handlers/      # Обработчики команд
│   │   ├── middleware/    # Bot middleware
│   │   └── utils/         # Утилиты бота
│   └── package.json
├── shared/                # Общие типы и утилиты
│   ├── types/            # Определения типов
│   ├── constants/        # Константы (карты, нумерология)
│   └── utils/            # Общие утилиты
├── docs/                 # Документация
├── docker/               # Docker конфигурации
├── monitoring/           # Настройки мониторинга
└── docker-compose.yml    # Основная конфигурация
```

## 🚀 Быстрый старт

### Предварительные требования

- Docker и Docker Compose
- Node.js 18+ (для разработки)
- PostgreSQL 15+ (для локальной разработки)
- Redis 7+ (для локальной разработки)

### Установка и запуск

1. **Клонирование репозитория:**
```bash
git clone https://github.com/your-org/mistika-app.git
cd mistika-app
```

2. **Настройка переменных окружения:**
```bash
cp .env.example .env
# Отредактируйте .env файл с вашими настройками
```

3. **Запуск с Docker Compose:**
```bash
docker-compose up -d
```

4. **Проверка работоспособности:**
- WebApp: http://localhost:3001
- API: http://localhost:3000
- Grafana: http://localhost:3002 (admin/admin)
- Prometheus: http://localhost:9090

### Разработка

1. **Установка зависимостей:**
```bash
# Backend
cd server && npm install

# Frontend
cd ../client && npm install

# Bot
cd ../bot && npm install
```

2. **Запуск в режиме разработки:**
```bash
# Backend
cd server && npm run dev

# Frontend (в новом терминале)
cd client && npm start

# Bot (в новом терминале)
cd bot && npm run dev
```

## 🔧 Конфигурация

### Переменные окружения

#### Server (.env)
```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/mistika
REDIS_URL=redis://localhost:6379

# Authentication
JWT_SECRET=your_secret_key
JWT_EXPIRES_IN=7d

# Telegram
TELEGRAM_BOT_TOKEN=your_bot_token
TELEGRAM_WEBHOOK_URL=https://yourdomain.com/api/telegram/webhook

# AI Services
YANDEX_GPT_API_KEY=your_yandex_key
KANDINSKY_API_KEY=your_kandinsky_key
OPENAI_API_KEY=your_openai_key

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_password

# Security
CORS_ORIGIN=http://localhost:3001
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX=100
```

#### Client (.env)
```env
REACT_APP_API_URL=http://localhost:3000/api
REACT_APP_WEBAPP_URL=http://localhost:3001
REACT_APP_TELEGRAM_BOT_USERNAME=your_bot_username
```

### Настройка Telegram

1. **Создание бота:**
   - Напишите @BotFather в Telegram
   - Выполните команду `/newbot`
   - Получите токен бота

2. **Настройка WebApp:**
   - Установите команды бота через @BotFather
   - Настройте Menu Button для WebApp

3. **Настройка Webhook:**
```bash
curl -X POST "https://api.telegram.org/bot<TOKEN>/setWebhook" \
-H "Content-Type: application/json" \
-d '{"url": "https://yourdomain.com/api/telegram/webhook"}'
```

## 📊 API Документация

### Основные эндпоинты

#### Аутентификация
- `POST /api/auth/telegram` - Telegram аутентификация
- `GET /api/auth/profile` - Получение профиля пользователя
- `PUT /api/auth/profile` - Обновление профиля

#### Карты и гадания
- `GET /api/cards/daily` - Дневная карта
- `GET /api/spreads` - Доступные расклады
- `POST /api/spreads/reading` - Создание гадания
- `GET /api/spreads/reading/history` - История гаданий

#### AI сервисы
- `POST /api/ai/interpret-card` - Интерпретация карты
- `POST /api/ai/analyze-photo` - Анализ фотографии
- `POST /api/ai/voice-message` - Обработка голоса

#### Платежи
- `GET /api/payments/plans` - Планы подписки
- `POST /api/payments/create` - Создание платежа
- `GET /api/payments/subscription` - Статус подписки

Полная документация: [docs/API.md](docs/API.md)

## 🧪 Тестирование

### Запуск тестов

```bash
# Backend тесты
cd server && npm test

# Frontend тесты
cd client && npm test

# E2E тесты
npm run test:e2e

# Покрытие кода
npm run test:coverage
```

### Тестовые данные

Для разработки используются фикстуры с тестовыми картами Таро, пользователями и гаданиями.

## 📈 Мониторинг

### Grafana Dashboards

- **Application Metrics** - производительность приложения
- **Database Metrics** - состояние PostgreSQL
- **Redis Metrics** - статистика кэша
- **System Metrics** - ресурсы сервера
- **User Analytics** - поведение пользователей

### Алерты

Настроены уведомления для:
- Высокая нагрузка на CPU/RAM
- Медленные запросы к БД
- Ошибки API (>5% за 5 минут)
- Недоступность внешних сервисов

## 🔒 Безопасность

### Реализованные меры

- JWT токены с ротацией
- Rate limiting для API
- Валидация всех входных данных
- SQL injection защита через ORM
- XSS защита
- HTTPS принудительно
- Секреты в переменных окружения
- Регулярные обновления зависимостей

### Соответствие требованиям

- GDPR совместимость
- Шифрование персональных данных
- Логирование действий пользователей
- Возможность экспорта/удаления данных

## 🌐 Деплой

### Production окружение

1. **Подготовка сервера:**
```bash
# Обновление системы
sudo apt update && sudo apt upgrade -y

# Установка Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Установка Docker Compose
sudo apt install docker-compose-plugin
```

2. **Настройка SSL:**
```bash
# Certbot для Let's Encrypt
sudo apt install certbot
sudo certbot certonly --standalone -d yourdomain.com
```

3. **Деплой:**
```bash
# Клонирование на сервер
git clone https://github.com/your-org/mistika-app.git
cd mistika-app

# Копирование production конфигурации
cp docker-compose.prod.yml docker-compose.yml
cp .env.production .env

# Запуск
docker-compose up -d
```

### CI/CD Pipeline

GitHub Actions для автоматического деплоя:

```yaml
name: Deploy to Production
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to server
        run: |
          # Build and deploy steps
```

## 🤝 Участие в разработке

### Процесс разработки

1. Fork репозитория
2. Создайте feature branch (`git checkout -b feature/amazing-feature`)
3. Commit изменений (`git commit -m 'Add amazing feature'`)
4. Push в branch (`git push origin feature/amazing-feature`)
5. Откройте Pull Request

### Стандарты кода

- ESLint + Prettier для форматирования
- Conventional Commits для сообщений коммитов
- Обязательные тесты для новой функциональности
- Code review для всех изменений

### Структура коммитов

```
feat: добавление новой функции
fix: исправление бага
docs: обновление документации
style: форматирование кода
refactor: рефакторинг без изменения функциональности
test: добавление или изменение тестов
chore: обновление зависимостей или конфигурации
```

## 📝 Changelog

### v1.0.0 (2024-01-15)
- ✨ Первый релиз приложения
- 🎴 Базовые расклады Таро
- 🤖 AI интерпретации
- 📱 Telegram WebApp интеграция
- 💎 Система подписок

## 📄 Лицензия

MIT License. Подробности в файле [LICENSE](LICENSE).

## 👥 Команда

- **Lead Developer** - [Ваше имя](https://github.com/yourusername)
- **UI/UX Designer** - [Имя дизайнера](https://github.com/designer)
- **DevOps Engineer** - [Имя инженера](https://github.com/devops)

## 📞 Поддержка

- **Email**: support@mistika.app
- **Telegram**: @mistika_support
- **Discord**: [MISTIKA Community](https://discord.gg/mistika)
- **Issues**: [GitHub Issues](https://github.com/your-org/mistika-app/issues)

## 🙏 Благодарности

- Rider-Waite Tarot deck for card imagery
- YandexGPT for AI interpretations
- Telegram for WebApp platform
- Open source community

---

<div align="center">

**🔮 Откройте тайны Вселенной с MISTIKA 🔮**

[Веб-сайт](https://mistika.app) • [Telegram Bot](https://t.me/mistika_bot) • [Документация](https://docs.mistika.app)

</div>