# 🏠 Listing Service

## 📋 Обзор

Listing Service - это сервис управления объявлениями недвижимости с интегрированным ИИ-поиском и рекомендациями. Он обеспечивает создание, управление и поиск объявлений о недвижимости с поддержкой геолокации, фильтрации и персонализированных рекомендаций.

## 🔧 Технические характеристики

- **Порт разработки**: 3002
- **База данных**: PostgreSQL (listing_service_db)
- **ORM**: Drizzle ORM
- **Поиск**: Elasticsearch + ИИ векторный поиск
- **Тестирование**: Vitest (4 теста)
- **Покрытие тестами**: 90%+

## 🏗️ Архитектура

### Структура проекта
```
services/listing-service/
├── src/
│   ├── controllers/     # Контроллеры API
│   ├── middleware/      # Промежуточное ПО
│   ├── models/         # Модели данных
│   ├── routes/         # Маршруты API
│   ├── services/       # Бизнес-логика
│   │   ├── ai/         # ИИ сервисы
│   │   ├── search/     # Поисковые сервисы
│   │   └── geo/        # Геолокационные сервисы
│   ├── utils/          # Утилиты
│   ├── db/             # Конфигурация БД
│   └── types/          # TypeScript типы
├── tests/              # Тесты
├── AI_SEARCH_API.md    # Документация ИИ поиска
└── package.json
```

### Модель данных

#### Listing (Объявление)
```typescript
interface Listing {
  id: string;                    // UUID
  title: string;                 // Заголовок объявления
  description: string;           // Подробное описание
  type: PropertyType;            // CONDO, HOUSE, VILLA, APARTMENT, etc.
  category: ListingCategory;     // RENT, SALE, SHORT_TERM
  price: number;                 // Цена в основной валюте
  currency: Currency;            // THB, USD, EUR, etc.
  pricePerSqm?: number;         // Цена за кв.м
  
  // Характеристики недвижимости
  bedrooms: number;
  bathrooms: number;
  area: number;                  // Площадь в кв.м
  floorArea?: number;           // Жилая площадь
  landArea?: number;            // Площадь участка
  floor?: number;               // Этаж
  totalFloors?: number;         // Всего этажей
  
  // Геолокация
  location: Location;
  address: Address;
  coordinates: GeoPoint;
  
  // Медиа
  images: ListingImage[];
  videos?: ListingVideo[];
  virtualTour?: string;         // URL виртуального тура
  
  // Удобства и особенности
  amenities: Amenity[];
  features: Feature[];
  
  // Метаданные
  ownerId: string;              // ID владельца
  agencyId?: string;            // ID агентства
  agentId?: string;             // ID агента
  status: ListingStatus;        // ACTIVE, INACTIVE, SOLD, RENTED
  visibility: Visibility;       // PUBLIC, PRIVATE, AGENCY_ONLY
  
  // ИИ данные
  aiDescription?: string;       // ИИ-генерированное описание
  aiTags: string[];            // ИИ теги для поиска
  searchVector: number[];       // Векторное представление для поиска
  
  // Статистика
  views: number;
  favorites: number;
  inquiries: number;
  
  createdAt: Date;
  updatedAt: Date;
  publishedAt?: Date;
  expiresAt?: Date;
}
```

#### Location (Местоположение)
```typescript
interface Location {
  id: string;
  country: string;              // TH, US, etc.
  province: string;             // Провинция/штат
  city: string;                 // Город
  district: string;             // Район
  subDistrict?: string;         // Подрайон
  postalCode?: string;          // Почтовый индекс
  coordinates: GeoPoint;
  
  // Локализация
  nameEn: string;
  nameTh?: string;
  nameRu?: string;
  nameCn?: string;
}
```

#### ListingImage (Изображение)
```typescript
interface ListingImage {
  id: string;
  listingId: string;
  url: string;                  // URL изображения
  thumbnailUrl: string;         // URL миниатюры
  alt: string;                  // Альтернативный текст
  caption?: string;             // Подпись
  order: number;                // Порядок отображения
  type: ImageType;              // EXTERIOR, INTERIOR, FLOOR_PLAN, etc.
  aiDescription?: string;       // ИИ описание изображения
  createdAt: Date;
}
```

## 🤖 ИИ-функциональность

### Векторный поиск
- Преобразование текстовых запросов в векторы
- Семантический поиск по описаниям
- Поиск по изображениям
- Многоязычная поддержка поиска

### Персонализированные рекомендации
- Анализ поведения пользователей
- Рекомендации на основе предпочтений
- Похожие объявления
- Трендовые предложения

### Автоматическая обработка
- ИИ-генерация описаний
- Автоматическое тегирование
- Определение характеристик по фото
- Оценка качества объявления

## 🌐 API Endpoints

### Управление объявлениями

#### POST /api/listings
Создание нового объявления

**Запрос:**
```json
{
  "title": "Luxury Condo in Bangkok",
  "description": "Beautiful 2-bedroom condo with city view",
  "type": "CONDO",
  "category": "RENT",
  "price": 45000,
  "currency": "THB",
  "bedrooms": 2,
  "bathrooms": 2,
  "area": 85,
  "location": {
    "country": "TH",
    "province": "Bangkok",
    "city": "Bangkok",
    "district": "Sukhumvit",
    "coordinates": {
      "lat": 13.7563,
      "lng": 100.5018
    }
  },
  "amenities": ["POOL", "GYM", "PARKING", "SECURITY"],
  "images": [
    {
      "url": "https://example.com/image1.jpg",
      "type": "EXTERIOR",
      "order": 1
    }
  ]
}
```

#### GET /api/listings/:id
Получение объявления по ID

#### PUT /api/listings/:id
Обновление объявления

#### DELETE /api/listings/:id
Удаление объявления

#### GET /api/listings
Получение списка объявлений с фильтрацией

**Параметры запроса:**
```
?type=CONDO
&category=RENT
&minPrice=20000
&maxPrice=50000
&bedrooms=2
&location=Bangkok
&amenities=POOL,GYM
&page=1
&limit=20
&sort=price_asc
```

### Поиск и фильтрация

#### GET /api/search
Обычный поиск с фильтрами

#### POST /api/search/ai
ИИ-поиск с естественным языком

**Запрос:**
```json
{
  "query": "Найди квартиру с 2 спальнями рядом с BTS в Бангкоке до 40000 бат",
  "language": "ru",
  "location": {
    "lat": 13.7563,
    "lng": 100.5018,
    "radius": 5000
  },
  "filters": {
    "maxPrice": 40000,
    "currency": "THB"
  }
}
```

#### GET /api/search/similar/:id
Поиск похожих объявлений

#### GET /api/search/recommendations
Персонализированные рекомендации

### Геолокационный поиск

#### GET /api/geo/nearby
Поиск объявлений поблизости

**Параметры:**
```
?lat=13.7563
&lng=100.5018
&radius=2000
&type=CONDO
&category=RENT
```

#### GET /api/geo/areas
Получение популярных районов

#### GET /api/geo/transit
Поиск рядом с общественным транспортом

### Статистика и аналитика

#### GET /api/listings/:id/stats
Статистика просмотров объявления

#### POST /api/listings/:id/view
Отметка просмотра объявления

#### POST /api/listings/:id/favorite
Добавление в избранное

#### GET /api/analytics/trends
Тренды рынка недвижимости

## 🔍 Поисковые возможности

### Типы поиска

1. **Текстовый поиск**
   - Поиск по заголовку и описанию
   - Автодополнение
   - Исправление опечаток

2. **Фильтрация**
   - По типу недвижимости
   - По ценовому диапазону
   - По количеству комнат
   - По удобствам
   - По местоположению

3. **Геолокационный поиск**
   - Поиск в радиусе
   - Поиск по районам
   - Поиск рядом с транспортом
   - Поиск рядом с POI

4. **ИИ-поиск**
   - Естественный язык
   - Семантический поиск
   - Поиск по изображениям
   - Контекстные рекомендации

### Сортировка
- По цене (возрастание/убывание)
- По дате публикации
- По популярности
- По релевантности
- По расстоянию
- По рейтингу

## 📊 Интеграция с ИИ сервисами

### AI Service интеграция
```typescript
// Генерация описания
const aiDescription = await aiService.generateDescription({
  type: listing.type,
  features: listing.features,
  location: listing.location,
  images: listing.images
});

// Векторизация для поиска
const searchVector = await aiService.createEmbedding(
  `${listing.title} ${listing.description}`
);

// Получение рекомендаций
const recommendations = await aiService.getRecommendations({
  userId: user.id,
  currentListing: listing.id,
  preferences: user.preferences
});
```

## 🖼️ Управление медиафайлами

### Загрузка изображений
- Поддержка JPEG, PNG, WebP
- Автоматическое создание миниатюр
- Оптимизация размера и качества
- CDN для быстрой загрузки

### Обработка изображений
- Автоматическое изменение размера
- Водяные знаки
- EXIF данные для геолокации
- ИИ-анализ содержимого

## 🧪 Тестирование

### Покрытие тестами (4 теста)

1. **listing.test.ts** - CRUD операции
   - Создание объявления
   - Получение объявления
   - Обновление объявления
   - Удаление объявления

2. **search.test.ts** - Поисковая функциональность
   - Текстовый поиск
   - Фильтрация
   - Геолокационный поиск
   - ИИ-поиск

3. **ai.test.ts** - ИИ функции
   - Генерация описаний
   - Векторный поиск
   - Рекомендации

4. **media.test.ts** - Медиафайлы
   - Загрузка изображений
   - Обработка изображений
   - Удаление файлов

### Запуск тестов
```bash
# Все тесты
bun test

# Тесты с покрытием
bun test --coverage

# Интеграционные тесты
bun test:integration
```

## 🚀 Развертывание

### Переменные окружения
```env
# Сервер
PORT=3002
NODE_ENV=production

# База данных
DATABASE_URL=postgresql://user:password@localhost:5432/listing_service_db

# Elasticsearch
ELASTICSEARCH_URL=http://localhost:9200
ELASTICSEARCH_INDEX=listings

# ИИ сервисы
OPENAI_API_KEY=your-openai-key
AI_SERVICE_URL=http://localhost:3006

# Файловое хранилище
AWS_S3_BUCKET=thailand-marketplace-media
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_REGION=ap-southeast-1

# CDN
CDN_URL=https://cdn.thailand-marketplace.com

# Геолокация
GOOGLE_MAPS_API_KEY=your-google-maps-key

# Redis
REDIS_URL=redis://localhost:6379

# Мониторинг
SENTRY_DSN=your-sentry-dsn
```

## 🔄 Интеграции

### Внутренние сервисы
- **AI Service**: ИИ-рекомендации и обработка
- **User Service**: Аутентификация и профили
- **Booking Service**: Связь с бронированиями
- **Agency Service**: Управление агентствами

### Внешние сервисы
- **Google Maps API**: Геолокация и карты
- **AWS S3**: Хранение медиафайлов
- **Elasticsearch**: Поисковый движок
- **OpenAI API**: ИИ-обработка текста
- **CloudFlare**: CDN для изображений

## 📈 Производительность

### Оптимизации
- Кеширование популярных поисковых запросов
- Индексы базы данных для быстрого поиска
- Пагинация результатов
- Ленивая загрузка изображений
- Сжатие API ответов

### Масштабирование
- Горизонтальное масштабирование
- Шардинг базы данных по регионам
- CDN для статических файлов
- Кеширование в Redis
- Elasticsearch кластер

## 📊 Мониторинг

### Метрики
- Количество объявлений
- Поисковые запросы
- Время ответа API
- Использование ИИ функций
- Популярные районы

### Алерты
- Высокое время ответа
- Ошибки ИИ сервисов
- Проблемы с Elasticsearch
- Превышение лимитов API

---

**Контакты для поддержки:**
- 📧 Email: listing-service@thailand-marketplace.com
- 📱 Slack: #listing-service-support
- 📋 Issues: [GitHub Issues](https://github.com/chatman-media/farang-marketplace/issues?label=listing-service)