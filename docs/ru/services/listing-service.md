# 🏠 Listing Service

## 📋 Обзор

Listing Service - это универсальный сервис управления объявлениями для Thailand
Marketplace с поддержкой множественных категорий товаров и услуг. Включает
специализированную поддержку недвижимости в стиле Airbnb + Avito с
интегрированным ИИ-поиском и рекомендациями. Обеспечивает создание, управление и
поиск объявлений с поддержкой геолокации, фильтрации и персонализированных
рекомендаций.

## 🔧 Технические характеристики

- **Порт разработки**: 3003
- **База данных**: PostgreSQL (thailand_marketplace)
- **ORM**: Drizzle ORM
- **Фреймворк**: Fastify 5.x
- **Поиск**: Расширенная фильтрация + планируется Elasticsearch + ИИ векторный
  поиск
- **Тестирование**: Vitest (4 теста)
- **Категории**: Недвижимость, транспорт, туры, активности, рестораны, шоппинг,
  услуги, события, автомобили, товары
- **Покрытие тестами**: 90%+

## 🏗️ Архитектура

### Структура проекта

```
services/listing-service/
├── src/
│   ├── controllers/     # Контроллеры API
│   │   ├── ListingController.ts      # Общие листинги
│   │   ├── RealEstateController.ts   # Недвижимость
│   │   ├── ServiceProviderController.ts # Поставщики услуг
│   │   └── AIIntegrationController.ts # Интеграция с AI сервисом
│   ├── middleware/      # Промежуточное ПО
│   ├── routes/         # Маршруты API
│   │   ├── listings.ts      # Общие маршруты
│   │   ├── realEstate.ts    # Маршруты недвижимости
│   │   ├── serviceProviders.ts # Маршруты поставщиков
│   │   └── ai.ts           # AI интеграция
│   ├── services/       # Бизнес-логика
│   │   ├── ListingService.ts     # Общие листинги
│   │   ├── RealEstateService.ts  # Недвижимость
│   │   ├── ServiceProviderService.ts # Поставщики
│   │   └── AIClient.ts       # HTTP клиент для AI сервиса
│   ├── db/             # База данных
│   │   ├── schema.ts        # Схема БД
│   │   ├── connection.ts    # Подключение
│   │   └── migrations/      # Миграции
│   └── test/           # Тесты
├── AI_SEARCH_API.md    # Документация ИИ поиска
└── package.json
```

### Модель данных

#### Основные категории листингов

```typescript
enum ListingCategory {
  TRANSPORTATION = "transportation", // Транспорт
  TOURS = "tours", // Туры
  SERVICES = "services", // Услуги
  VEHICLES = "vehicles", // Автомобили
  PRODUCTS = "products", // Товары
}
```

#### Базовый Listing (Объявление)

```typescript
interface Listing {
  id: string // UUID
  ownerId: string // ID владельца
  title: string // Заголовок объявления
  description: string // Подробное описание
  category: ListingCategory // Категория листинга
  type: ListingType // Тип в рамках категории
  status: ListingStatus // Статус объявления
  price: number // Цена в основной валюте
  currency: Currency // THB, USD, EUR, etc.

  // Местоположение
  location: Location

  // Медиафайлы
  images: string[] // Массив URL изображений
  videos?: string[] // Массив URL видео
  mainImage: string // Главное изображение

  // Метаданные
  tags: string[] // Теги для поиска
  views: number // Количество просмотров
  favorites: number // Количество добавлений в избранное
  inquiries: number // Количество запросов
  averageRating: number // Средний рейтинг
  reviewCount: number // Количество отзывов

  // Временные метки
  createdAt: Date
  updatedAt: Date
  publishedAt?: Date
}
```

#### RealEstate (Недвижимость) - Специализированная модель

```typescript
interface RealEstate {
  id: string
  listingId: string // Связь с основным листингом

  // Основные характеристики
  propertyType: PropertyType // CONDO, HOUSE, VILLA, APARTMENT, etc.
  propertyStatus: PropertyStatus // AVAILABLE, RENTED, SOLD, etc.
  listingPurpose: ListingPurpose // RENT, SALE, SHORT_TERM_RENTAL, etc.

  // Физические характеристики
  bedrooms: number
  bathrooms: number // Может быть 2.5, etc.
  area: number // Общая площадь в кв.м
  livingArea?: number // Жилая площадь
  landArea?: number // Площадь участка
  floor?: number // Этаж
  totalFloors?: number // Всего этажей в здании

  // Детали здания
  buildingType?: BuildingType // LOW_RISE, MID_RISE, HIGH_RISE, etc.
  buildingAge?: number // Возраст здания в годах
  yearBuilt?: number // Год постройки
  yearRenovated?: number // Год ремонта

  // Состояние и меблировка
  furnishing: Furnishing // UNFURNISHED, PARTIALLY_FURNISHED, etc.
  condition: string // excellent, good, fair, needs_renovation

  // Виды и ориентация
  views: ViewType[] // Массив типов видов
  orientation?: Orientation // Ориентация по сторонам света
  balconies: number // Количество балконов
  terraces: number // Количество террас

  // Ценообразование
  price: number // Основная цена
  pricePerSqm?: number // Цена за кв.м
  currency: Currency // Валюта
  priceType: PriceType // FIXED, NEGOTIABLE, AUCTION, etc.

  // Арендные ставки (стиль Airbnb)
  dailyRate?: number // Суточная ставка
  weeklyRate?: number // Недельная ставка
  monthlyRate?: number // Месячная ставка
  yearlyRate?: number // Годовая ставка

  // Дополнительные расходы
  maintenanceFee?: number // Плата за обслуживание
  commonAreaFee?: number // Плата за общие зоны
  securityDeposit?: number // Залог
  cleaningFee?: number // Плата за уборку

  // Коммунальные услуги
  electricityIncluded: boolean
  waterIncluded: boolean
  internetIncluded: boolean
  cableIncluded: boolean
  gasIncluded: boolean

  // Парковка
  parkingSpaces: number // Количество парковочных мест
  parkingType?: string // covered, open, garage, street
  parkingFee?: number // Плата за парковку

  // Связанные данные
  amenities?: PropertyAmenities // Удобства
  rules?: PropertyRules // Правила (для краткосрочной аренды)
}
```

#### PropertyAmenities (Удобства недвижимости)

```typescript
interface PropertyAmenities {
  // Удобства здания
  hasElevator: boolean // Лифт
  hasSwimmingPool: boolean // Бассейн
  hasFitnessCenter: boolean // Фитнес-центр
  hasSauna: boolean // Сауна
  hasGarden: boolean // Сад
  hasPlayground: boolean // Детская площадка
  hasSecurity: boolean // Охрана
  hasCCTV: boolean // Видеонаблюдение
  hasKeyCard: boolean // Карточный доступ
  hasReception: boolean // Ресепшн
  hasConcierge: boolean // Консьерж

  // Удобства квартиры/дома
  hasAirConditioning: boolean // Кондиционер
  hasHeating: boolean // Отопление
  hasWashingMachine: boolean // Стиральная машина
  hasDryer: boolean // Сушилка
  hasDishwasher: boolean // Посудомоечная машина
  hasWifi: boolean // Wi-Fi
  hasBalcony: boolean // Балкон
  hasTerrace: boolean // Терраса
  hasFireplace: boolean // Камин

  // Доступность
  isWheelchairAccessible: boolean // Доступность для инвалидных колясок

  // Политика домашних животных
  petsAllowed: boolean // Разрешены ли питомцы
  catsAllowed: boolean // Разрешены ли кошки
  dogsAllowed: boolean // Разрешены ли собаки
  petDeposit?: number // Залог за питомца
}
```

#### PropertyRules (Правила недвижимости - стиль Airbnb)

```typescript
interface PropertyRules {
  // Правила заезда/выезда (для краткосрочной аренды)
  checkInTime?: string;         // Время заезда "15:00"
  checkOutTime?: string;        // Время выезда "11:00"
  selfCheckIn: boolean;         // Самостоятельный заезд
  keypadEntry: boolean;         // Вход по коду

  // Правила для гостей
  maxGuests?: number;           // Максимальное количество гостей
  infantsAllowed: boolean;      // Разрешены ли младенцы
  childrenAllowed: boolean;     // Разрешены ли дети
  eventsAllowed: boolean;       // Разрешены ли мероприятия
  partiesAllowed: boolean;      // Разрешены ли вечеринки
  smokingAllowed: boolean;      // Разрешено ли курение

  // Тишина и поведение
  quietHoursStart?: string;     // Начало тихих часов "22:00"
  quietHoursEnd?: string;       // Конец тихих часов "08:00"

  // Политика отмены
  cancellationPolicy: "flexible" | "moderate" | "strict";

  // Домашние правила
  houseRules?: string;          // Текстовые правила дома
  additionalRules: string[];    // Дополнительные правила

  // Безопасность
  hasSmokeDetektor: boolean;    // Детектор дыма
  hasCarbonMonoxideDetector: boolean; // Детектор угарного газа
  hasFireExtinguisher: boolean; // Огнетушитель
  hasFirstAidKit: boolean;      // Аптечка
  hasSecurityCamera: boolean;   // Камера безопасности
}
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
  id: string
  country: string // TH, US, etc.
  province: string // Провинция/штат
  city: string // Город
  district: string // Район
  subDistrict?: string // Подрайон
  postalCode?: string // Почтовый индекс
  coordinates: GeoPoint

  // Локализация
  nameEn: string
  nameTh?: string
  nameRu?: string
  nameCn?: string
}
```

#### ListingImage (Изображение)

```typescript
interface ListingImage {
  id: string
  listingId: string
  url: string // URL изображения
  thumbnailUrl: string // URL миниатюры
  alt: string // Альтернативный текст
  caption?: string // Подпись
  order: number // Порядок отображения
  type: ImageType // EXTERIOR, INTERIOR, FLOOR_PLAN, etc.
  aiDescription?: string // ИИ описание изображения
  createdAt: Date
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

### Общие листинги

#### POST /api/listings

Создание нового общего объявления (для всех категорий кроме недвижимости)

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
?category=vehicles
&type=car
&minPrice=500000
&maxPrice=2000000
&city=Bangkok
&page=1
&limit=20
&sort=price_asc
```

### Недвижимость (Real Estate)

Real estate functionality has been temporarily removed and will be added later
when the system stabilizes.

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
- 📋 Issues:
  [GitHub Issues](https://github.com/chatman-media/farang-marketplace/issues?label=listing-service)
