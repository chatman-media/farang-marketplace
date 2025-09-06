# Listing Service - Thailand Marketplace

Микросервис для управления объявлениями в Thailand Marketplace. Поддерживает создание, поиск и управление листингами для транспорта, товаров и услуг.

## 🚀 Возможности

### 🚗 Транспорт
- **Скутеры, мотоциклы, автомобили** - полная поддержка всех типов транспорта
- **Детальные характеристики** - двигатель, мощность, расход топлива, трансмиссия
- **Документооборот** - номера, страховка, техосмотр, регистрация
- **Система обслуживания** - история ТО, состояние компонентов
- **Гибкое ценообразование** - почасовая/дневная/недельная/месячная аренда
- **Геолокация** - точки выдачи, доставка, зоны обслуживания

### 📦 Товары
- **15 категорий** - электроника, мебель, одежда, спорт, инструменты и др.
- **Гибкие характеристики** - технические спецификации как JSON
- **Множественные типы продаж** - продажа, аренда, аукцион
- **Рассрочка и скидки** - беспроцентная рассрочка, оптовые цены
- **Информация о продавце** - рейтинг, отзывы, политики

### 🔍 Поиск и фильтрация
- **Умный поиск** - по типу, категории, цене, локации
- **Расширенные фильтры** - характеристики, доступность, рейтинг
- **Пагинация** - эффективная обработка больших результатов
- **Сортировка** - по цене, дате, популярности, рейтингу

## 📋 API Endpoints

### Транспорт

#### Создать листинг транспорта
```http
POST /api/listings/vehicles
Authorization: Bearer <token>
Content-Type: application/json

{
  "type": "scooter",
  "category": "economy",
  "condition": "good",
  "specifications": {
    "make": "Honda",
    "model": "PCX 150",
    "year": 2022,
    "color": "White",
    "engineSize": "150cc",
    "fuelType": "gasoline",
    "transmission": "cvt",
    "seatingCapacity": 2,
    "features": ["LED Headlights", "Digital Display"]
  },
  "documents": {
    "licensePlate": "กข-1234",
    "documentsComplete": true
  },
  "pricing": {
    "basePrice": 800,
    "currency": "THB",
    "dailyRate": 800,
    "securityDeposit": 5000,
    "fuelPolicy": "full_to_full"
  },
  "location": {
    "currentLocation": "Patong Beach, Phuket",
    "pickupLocations": ["Patong Beach", "Phuket Airport"],
    "deliveryAvailable": true
  },
  "images": ["https://example.com/image1.jpg"]
}
```

#### Поиск транспорта
```http
GET /api/listings/vehicles/search?type=scooter&category=economy&minPrice=500&maxPrice=1500&location=Phuket&page=1&limit=20
```

#### Получить листинг транспорта
```http
GET /api/listings/vehicles/{id}
```

### Товары

#### Создать листинг товара
```http
POST /api/listings/products
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "iPhone 15 Pro Max 256GB",
  "description": "Latest iPhone with titanium design",
  "type": "electronics",
  "category": "smartphones",
  "condition": "new",
  "listingType": "sale",
  "specifications": {
    "brand": "Apple",
    "model": "iPhone 15 Pro Max",
    "technicalSpecs": {
      "storage": "256GB",
      "color": "Natural Titanium"
    },
    "features": ["Face ID", "Wireless Charging", "5G"],
    "warrantyPeriod": "1 year"
  },
  "pricing": {
    "price": 45000,
    "currency": "THB",
    "priceType": "fixed",
    "acceptedPayments": ["credit_card", "bank_transfer"]
  },
  "availability": {
    "isAvailable": true,
    "quantity": 5,
    "deliveryAvailable": true
  },
  "location": {
    "address": "123 Sukhumvit Road",
    "city": "Bangkok",
    "region": "Bangkok",
    "country": "Thailand"
  },
  "images": ["https://example.com/iphone.jpg"],
  "tags": ["iphone", "apple", "smartphone"]
}
```

#### Поиск товаров
```http
GET /api/listings/products/search?type=electronics&category=smartphones&minPrice=20000&maxPrice=60000&city=Bangkok&inStock=true
```

#### Получить листинг товара
```http
GET /api/listings/products/{id}
```

### Управление листингами

#### Обновить статус листинга
```http
PATCH /api/listings/{id}/status
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "active"
}
```

#### Удалить листинг
```http
DELETE /api/listings/{id}
Authorization: Bearer <token>
```

## 🛠️ Установка и запуск

### Предварительные требования
- Node.js 18+
- PostgreSQL 14+
- Bun (рекомендуется) или npm

### Установка зависимостей
```bash
cd services/listing-service
bun install
```

### Настройка базы данных
```bash
# Скопировать файл окружения
cp .env.example .env

# Отредактировать DATABASE_URL в .env
# DATABASE_URL=postgresql://username:password@localhost:5432/thailand_marketplace

# Сгенерировать миграции
bun run drizzle-kit generate:pg

# Применить миграции
bun run drizzle-kit push:pg
```

### Запуск в режиме разработки
```bash
bun run dev
```

### Сборка для продакшена
```bash
bun run build
bun run start
```

### Тестирование
```bash
bun run test
bun run test:watch
bun run test:coverage
```

## 📊 Структура базы данных

### Основные таблицы

#### `listings` - Основная таблица листингов
- Общая информация для всех типов листингов
- Цены, локация, изображения, SEO
- Метрики производительности, модерация

#### `vehicles` - Данные транспорта
- Характеристики, документы, обслуживание
- Ценообразование, локация, доступность
- История аренды, аксессуары

#### `products` - Данные товаров
- Спецификации, состояние, гарантия
- Ценообразование, наличие, доставка
- Информация о продавце, политики

#### `listing_availability` - Календарь доступности
- Сложное планирование для аренды
- Блокировка дат, специальные цены

#### `listing_bookings` - Бронирования
- История бронирований и аренды
- Статусы платежей, специальные запросы

## 🔧 Конфигурация

### Переменные окружения
```bash
# Сервер
PORT=3003
NODE_ENV=development

# База данных
DATABASE_URL=postgresql://localhost:5432/thailand_marketplace

# JWT
JWT_SECRET=your-secret-key

# CORS
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001
```

### Валидация данных
- **Express Validator** для проверки входных данных
- **Zod схемы** из shared-types для типизации
- **Drizzle ORM** для валидации на уровне БД

### Безопасность
- **Helmet** для HTTP заголовков безопасности
- **Rate Limiting** для защиты от DDoS
- **JWT аутентификация** для защищенных endpoints
- **CORS** для контроля доступа

## 📈 Производительность

### Оптимизация запросов
- **Индексы** на часто используемые поля
- **Пагинация** для больших результатов
- **Lazy loading** связанных данных

### Кэширование
- **Redis** для кэширования поисковых результатов
- **HTTP кэширование** для статических данных

## 🧪 Тестирование

### Unit тесты
- Тестирование сервисов и контроллеров
- Моки для базы данных
- Покрытие кода 90%+

### Integration тесты
- Тестирование API endpoints
- Реальная база данных для тестов
- Автоматические тесты CI/CD

## 🚀 Развертывание

### Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package.json bun.lockb ./
RUN bun install --frozen-lockfile
COPY . .
RUN bun run build
EXPOSE 3003
CMD ["bun", "run", "start"]
```

### Kubernetes
- Готовые манифесты для развертывания
- Автоскейлинг по нагрузке
- Health checks и мониторинг

## 📝 Логирование

### Winston Logger
- Структурированные логи в JSON
- Ротация файлов логов
- Интеграция с ELK Stack

### Мониторинг
- Health check endpoint
- Метрики производительности
- Алерты при ошибках

## 🔄 Интеграция

### Микросервисы
- **User Service** - аутентификация и профили
- **Payment Service** - обработка платежей
- **Notification Service** - уведомления
- **Search Service** - расширенный поиск с AI

### Внешние API
- **Google Maps** - геолокация и маршруты
- **Image CDN** - оптимизация изображений
- **Analytics** - отслеживание метрик

## ✅ Готово к использованию!

Listing Service полностью готов для:
- ✅ Создания листингов любых типов
- ✅ Умного поиска и фильтрации
- ✅ Управления доступностью и бронированиями
- ✅ Интеграции с другими сервисами
- ✅ Масштабирования под нагрузку

**Универсальная система для любых товаров и услуг!** 🎉
