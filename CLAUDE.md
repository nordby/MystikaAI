# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Architecture

MISTIKA is a mystical Tarot application with three main components:

### Core Components
- **client/**: React 18 frontend with Telegram WebApp integration
- **server/**: Node.js/Express backend API with PostgreSQL and Redis
- **bot/**: Telegram Bot with webhook integration
- **shared/**: Common constants, types, and utilities across all components

### Key Technologies
- Frontend: React 18, Zustand state management, Tailwind CSS, Vite
- Backend: Express, Sequelize ORM, JWT auth, Redis caching
- Database: PostgreSQL with migrations via Sequelize CLI
- AI Integration: YandexGPT, Kandinsky AI, OpenAI Whisper
- Infrastructure: Docker Compose, Nginx, Prometheus/Grafana monitoring

## Development Commands

### Frontend (client/)
```bash
npm start          # Development server (supports browser testing)
npm run build      # Production build
npm test           # Run tests
npm run lint       # ESLint check
npm run lint:fix   # ESLint auto-fix
npm run type-check # TypeScript checking
```

### Backend (server/)
```bash
npm run dev        # Development with nodemon
npm start          # Production start
npm test           # Run tests
npm run lint       # ESLint check
npm run migrate    # Run database migrations
```

### Bot (bot/)
```bash
npm run dev        # Development with nodemon
npm start          # Production start
npm test           # Run tests
npm run lint       # ESLint check
```

### Docker Operations
```bash
docker-compose up -d                    # Start all services
docker-compose down                     # Stop all services
docker-compose logs -f [service-name]   # View logs
```

## Important Development Notes

### Browser Development Mode
The client supports browser testing without Telegram WebApp:
- Set `NODE_ENV=development` and run `npm start` in client/
- Mock Telegram user data is available in `client/src/hooks/useTelegram.js`
- All UI components work without Telegram integration

### Database Setup
- Migrations are in `server/src/database/migrations/`
- Seeds for Tarot cards are in `server/seeders/cards.js`
- Use `npm run migrate` to apply database changes

### Shared Constants
Critical Tarot and mystical data is centralized in `shared/constants/`:
- `tarot.js`: Full Tarot deck definitions, spreads, and meanings
- `numerology.js`: Numerological calculations
- `lunar.js`: Lunar calendar data

### AI Services Architecture
AI functionality is modular:
- `server/src/services/aiService.js`: YandexGPT integration
- `server/src/services/kandinskyService.js`: Image analysis
- Voice processing via OpenAI Whisper in bot handlers

### State Management
- Client uses Zustand stores in `client/src/store/`
- Key stores: authStore, cardsStore, userStore, settingsStore
- Server uses Redis for session caching and rate limiting

### Telegram Integration
- Bot handlers are in `bot/src/handlers/`
- WebApp communication via `client/src/services/telegram.js`
- Webhook URL configuration required for production

## Service Ports
- Client: 3001 (React dev server)
- Server: 3000 (Express API)
- PostgreSQL: 5432
- Redis: 6379
- Grafana: 3002
- Prometheus: 9090

## Environment Variables
Each component requires specific `.env` configuration:
- Database connection strings
- Telegram bot tokens and webhook URLs
- AI service API keys (YandexGPT, Kandinsky, OpenAI)
- JWT secrets and CORS origins