# Настройки генерации изображений карт

## Описание

Система генерации изображений карт позволяет пользователям настраивать, как AI создает персональные изображения для их карт Таро.

## Доступные настройки

### 1. Стиль колоды по умолчанию (`defaultStyle`)
- **mystic** 🔮 - Мистический стиль с магическими элементами
- **classic** 📜 - Классический стиль в традициях Таро
- **modern** 🔳 - Современный минималистичный дизайн
- **fantasy** 🧚 - Фэнтезийный стиль с мифическими существами

### 2. Автоматическая генерация (`autoGenerate`)
- **true**: Изображения генерируются автоматически при получении новых карт
- **false**: Генерация только по запросу пользователя

### 3. Параллельная генерация (`parallelGeneration`)
- **true**: Несколько изображений генерируются одновременно (быстрее)
- **false**: Последовательная генерация (медленнее, но стабильнее)

### 4. Резервные изображения (`fallbackEnabled`)
- **true**: При сбое AI используются стандартные изображения
- **false**: При сбое показывается ошибка

### 5. Высокое качество (`highQuality`)
- **true**: Генерация в высоком разрешении (только для Premium)
- **false**: Стандартное качество

## Как настройки используются

### В компонентах
```javascript
// Получение настроек из store
const cardGeneration = useSettingsStore.getState().cardGeneration || {};

// Проверка автогенерации
if (!cardGeneration.autoGenerate) {
  return; // Пользователь отключил автогенерацию
}

// Выбор типа генерации
if (cardGeneration.parallelGeneration) {
  // Параллельная генерация
  result = await api.generateMultipleCardImages(cards, {
    style: cardGeneration.defaultStyle || 'mystic',
    maxConcurrent: 3
  });
} else {
  // Последовательная генерация
  result = await api.generateSpreadImages(cards, spreadType);
}
```

### Сохранение настроек
Настройки автоматически сохраняются:
1. **Локально** - в Zustand store с persist middleware
2. **На сервере** - в поле `preferences.cardGeneration` пользователя
3. **Мгновенно** - изменения применяются сразу при выборе

### API endpoints
- `PUT /api/v1/auth/profile` - Сохранение настроек пользователя
- `GET /api/v1/ai/styles` - Получение доступных стилей
- `POST /api/v1/ai/generate-multiple-cards` - Параллельная генерация
- `POST /api/v1/ai/generate-card-with-fallback` - Генерация с fallback
- `POST /api/v1/ai/test-generation` - Тестирование генерации

## Структура данных

### В frontend (settingsStore)
```javascript
cardGeneration: {
  defaultStyle: 'mystic',
  autoGenerate: true,
  highQuality: false,
  parallelGeneration: true,
  fallbackEnabled: true
}
```

### В backend (User.preferences)
```json
{
  "cardGeneration": {
    "defaultStyle": "mystic",
    "autoGenerate": true,
    "highQuality": false,
    "parallelGeneration": true,
    "fallbackEnabled": true
  }
}
```

## Тестирование

В профиле пользователя есть кнопка "🧪 Тестовая генерация" для проверки работы AI с выбранными настройками.

Также доступна команда `/test` в боте для комплексного тестирования всей системы генерации.