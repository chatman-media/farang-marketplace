# Design Document

## Overview

Thailand Marketplace представляет собой комплексную систему аренды, построенную
на микросервисной архитектуре с централизованной схемой базы данных и единым API
Gateway. Система поддерживает множественные категории аренды (транспорт, туры,
услуги, товары), использует Vite для сборки фронтенд приложений, интегрируется с
TON blockchain для платежей и включает централизованный ИИ-сервис для
автоматизации и рекомендаций.

### Категории аренды:

- **Транспорт**: Скутеры, мотоциклы, автомобили, велосипеды, лодки, квадроциклы
- **Туры**: Экскурсии, активности, гиды
- **Услуги**: Индивидуальные, корпоративные, агентские, фриланс
- **Товары**: Электроника, одежда, спорт, дом и сад
- **Недвижимость**: Квартиры, дома, коммерческая недвижимость (планируется)

## Architecture

### High-Level Architecture

```mermaid
graph TB
    subgraph "Client Applications"
        TON[TON Mini App]
        WEB[Web Application]
        BOT[Telegram Bot]
        ADMIN[Admin Panel]
    end

    subgraph "API Layer"
        GW[API Gateway]
        AUTH[Auth Service]
    end

    subgraph "Core Services"
        USER[User Service]
        LISTING[Listing Service]
        BOOKING[Booking Service]
        PAYMENT[Payment Service]
        AGENCY[Agency Service]
        AI[AI Service]
        VOICE[Voice Service]
        CRM[CRM Service]
    end

    subgraph "Data Layer"
        SCHEMA[Database Schema Package]
        POSTGRES[(PostgreSQL)]
        REDIS[(Redis Cache)]
        S3[(File Storage)]
    end

    subgraph "Shared Packages"
        TYPES[Shared Types]
        SCHEMA_PKG[@marketplace/database-schema]
    end

    subgraph "External Services"
        TON_NET[TON Network]
        TELEGRAM[Telegram API]
        AI_API[AI Provider API]
    end

    TON --> GW
    WEB --> GW
    BOT --> TELEGRAM
    ADMIN --> GW

    GW --> AUTH
    GW --> USER
    GW --> LISTING
    GW --> BOOKING
    GW --> PAYMENT
    GW --> AGENCY
    GW --> AI
    GW --> NOTIFICATION

    USER --> POSTGRES
    LISTING --> POSTGRES
    BOOKING --> POSTGRES
    PAYMENT --> TON_NET
    AGENCY --> POSTGRES
    AI --> AI_API
    NOTIFICATION --> TELEGRAM

    USER --> REDIS
    LISTING --> S3
    BOT --> AI
```

### Technology Stack

**Frontend:**

- Vite для сборки всех клиентских приложений
- React 18 с TypeScript
- Tailwind CSS для стилизации
- XState для управления состоянием (если потребуется)
- React Query для работы с API

**Backend:**

- Node.js с Bun runtime и Express
- TypeScript с строгим режимом
- Централизованная схема `@marketplace/database-schema` с Drizzle ORM
- PostgreSQL для основных данных (единая база для всех сервисов)
- Redis для кэширования и сессий (отдельные БД для изоляции сервисов)
- Централизованный AI сервис с поддержкой множественных провайдеров

**Infrastructure:**

- Docker Compose для контейнеризации (PostgreSQL + Redis)
- Turbo для монорепо управления
- Vitest для тестирования (627+ тестов, 99.4% успешность)
- Централизованная архитектура данных

## Components and Interfaces

### 1. API Gateway

**Responsibilities:**

- Маршрутизация запросов к микросервисам
- Аутентификация и авторизация
- Rate limiting и мониторинг
- CORS обработка

**Key Endpoints:**

```typescript
interface APIRoutes {
  // Authentication
  'POST /auth/login': LoginRequest -> AuthResponse
  'POST /auth/register': RegisterRequest -> AuthResponse
  'POST /auth/refresh': RefreshRequest -> AuthResponse

  // Listings
  'GET /listings': ListingFilters -> ListingResponse[]
  'POST /listings': CreateListingRequest -> ListingResponse
  'PUT /listings/:id': UpdateListingRequest -> ListingResponse
  'DELETE /listings/:id': void -> SuccessResponse

  // Bookings
  'POST /bookings': CreateBookingRequest -> BookingResponse
  'GET /bookings/user/:userId': void -> BookingResponse[]
  'PUT /bookings/:id/status': UpdateStatusRequest -> BookingResponse

  // Payments
  'POST /payments/initiate': PaymentRequest -> PaymentResponse
  'POST /payments/webhook': WebhookPayload -> void

  // AI Agent
  'POST /ai/chat': ChatRequest -> ChatResponse
  'GET /ai/conversations/:userId': void -> ConversationResponse[]
  'POST /ai/manager-intervention': InterventionRequest -> void
}
```

### 2. User Service

**Responsibilities:**

- Управление пользователями и профилями
- Ролевая система (User, Agency, Manager, Admin)
- Профили и настройки

**Data Models:**

```typescript
interface User {
  id: string
  email: string
  phone?: string
  telegramId?: string
  role: UserRole
  profile: UserProfile
  createdAt: Date
  updatedAt: Date
  isActive: boolean
}

interface UserProfile {
  firstName: string
  lastName: string
  avatar?: string
  location?: Location
  rating: number
  reviewsCount: number
  verificationStatus: VerificationStatus
}

enum UserRole {
  USER = "user",
  AGENCY = "agency",
  MANAGER = "manager",
  ADMIN = "admin",
}
```

### 3. Listing Service

**Responsibilities:**

- Управление объявлениями для всех категорий аренды
- Централизованная схема с поддержкой транспорта, туров, услуг, товаров
- Специализированные таблицы для транспорта и товаров
- Интеграция с централизованным AI сервисом для рекомендаций
- Система обслуживания транспорта и история аренды
- Модерация контента и поиск

**Категории аренды:**

- **Transportation**: Скутеры, мотоциклы, автомобили, велосипеды, лодки,
  квадроциклы
- **Tours**: Экскурсии, активности, гиды
- **Services**: Индивидуальные, корпоративные, агентские, фриланс услуги
- **Vehicles**: Полное управление транспортом с отслеживанием обслуживания
- **Products**: Электроника, одежда, спорт, дом и сад

**Data Models:**

```typescript
interface Listing {
  id: string
  ownerId: string
  title: string
  description: string
  category: ListingCategory
  type: ListingType
  price: Price
  location: Location
  images: string[]
  availability: Availability
  features: Feature[]
  status: ListingStatus
  createdAt: Date
  updatedAt: Date
}

enum ListingCategory {
  TRANSPORTATION = "transportation",
  TOURS = "tours",
  SERVICES = "services",
  VEHICLES = "vehicles",
  PRODUCTS = "products",
}

enum VehicleType {
  SCOOTER = "scooter",
  MOTORCYCLE = "motorcycle",
  CAR = "car",
  BICYCLE = "bicycle",
  BOAT = "boat",
  ATV = "atv",
  TRUCK = "truck",
  VAN = "van",
  BUS = "bus",
}

enum ListingType {
  RENTAL = "rental",
  SERVICE = "service",
}

interface Price {
  amount: number
  currency: string
  period?: PricePeriod // для аренды
}
```

### 4. Booking Service

**Responsibilities:**

- Управление бронированиями и заказами
- Календарь доступности
- Статусы заказов
- Интеграция с платежами

**Data Models:**

```typescript
interface Booking {
  id: string
  listingId: string
  renterId: string
  ownerId: string
  type: BookingType
  startDate: Date
  endDate?: Date // для аренды
  totalAmount: number
  status: BookingStatus
  paymentId?: string
  agencyServices?: AgencyService[]
  createdAt: Date
  updatedAt: Date
}

enum BookingStatus {
  PENDING = "pending",
  CONFIRMED = "confirmed",
  ACTIVE = "active",
  COMPLETED = "completed",
  CANCELLED = "cancelled",
  DISPUTED = "disputed",
}
```

### 5. Agency Service

**Responsibilities:**

- Управление агентствами и их услугами
- Назначение услуг к объявлениям
- Расчет комиссий
- Координация с владельцами

**Data Models:**

```typescript
interface Agency {
  id: string
  userId: string
  name: string
  description: string
  services: AgencyServiceType[]
  coverage: Location[]
  rating: number
  commissionRate: number
  isVerified: boolean
}

interface AgencyServiceType {
  id: string
  name: string
  description: string
  basePrice: number
  category: ServiceCategory
}

enum ServiceCategory {
  DELIVERY = "delivery",
  EMERGENCY = "emergency",
  MAINTENANCE = "maintenance",
  INSURANCE = "insurance",
}
```

### 6. AI Service (Централизованный)

**Responsibilities:**

- Централизованный AI сервис для всех микросервисов
- Поддержка множественных AI провайдеров (OpenAI, DeepSeek, Claude)
- Интеллектуальные рекомендации для всех категорий аренды
- Анализ пользовательского поведения и предпочтений
- AI-enhanced поиск и автоматическая категоризация контента
- Интеграция с marketplace операциями и booking intelligence
- Система промптов и контекста
- Логирование для менеджеров

**Data Models:**

```typescript
interface Conversation {
  id: string
  userId: string
  messages: Message[]
  context: ConversationContext
  status: ConversationStatus
  assignedManagerId?: string
  createdAt: Date
  updatedAt: Date
}

interface Message {
  id: string
  role: MessageRole
  content: string
  timestamp: Date
  metadata?: MessageMetadata
}

enum MessageRole {
  USER = "user",
  AI = "ai",
  MANAGER = "manager",
}

interface ConversationContext {
  currentListing?: string
  userIntent?: string
  previousBookings?: string[]
  customPrompts?: string[]
}
```

## Data Models

### Централизованная Database Schema

Вся схема базы данных централизована в пакете `@marketplace/database-schema` с
использованием Drizzle ORM.

**Основные таблицы:**

- **users** - Пользователи с ролями и профилями
- **listings** - Объявления для всех категорий аренды
- **vehicles** - Специализированная таблица для транспорта
- **products** - Специализированная таблица для товаров
- **serviceProviders** - Поставщики услуг
- **listingBookings** - Бронирования
- **vehicleMaintenance** - Обслуживание транспорта
- **vehicleRentals** - История аренды транспорта
- **customers, leads, communicationHistory** - CRM система
- **campaigns, messageTemplates** - Маркетинг
- **chatHistory, aiPromptTemplates** - AI интеграция

**Users Table (централизованная):**

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20),
  telegram_id VARCHAR(50),
  password_hash VARCHAR(255),
  role user_role NOT NULL DEFAULT 'user',
  profile JSONB NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Listings Table:**

```sql
CREATE TABLE listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES users(id),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  category listing_category NOT NULL,
  type listing_type NOT NULL,
  price JSONB NOT NULL,
  location JSONB NOT NULL,
  images TEXT[],
  availability JSONB,
  features JSONB,
  status listing_status DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Bookings Table:**

```sql
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID REFERENCES listings(id),
  renter_id UUID REFERENCES users(id),
  owner_id UUID REFERENCES users(id),
  type booking_type NOT NULL,
  start_date TIMESTAMP NOT NULL,
  end_date TIMESTAMP,
  total_amount DECIMAL(10,2) NOT NULL,
  status booking_status DEFAULT 'pending',
  payment_id VARCHAR(255),
  agency_services JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

## Централизованная Архитектура

### Database Schema Package

Пакет `@marketplace/database-schema` содержит:

- **23 таблицы** с полной схемой для всех категорий аренды
- **34 enum типа** для валидации данных
- **Drizzle ORM** конфигурация и миграции
- **TypeScript типы** для всех таблиц
- **21 тест** с 100% покрытием

### Docker Integration

- **PostgreSQL**: Единая база данных для всех сервисов
- **Redis**: Отдельные базы данных для изоляции сервисов
  - DB 1: API Gateway (rate limiting)
  - DB 2: Payment Service (job queues)
  - DB 3: Booking Service (caching)
  - DB 4: User Service (sessions)
  - DB 5: CRM Service (caching)

### AI Service Centralization

- **Единый AI сервис** вместо локальных провайдеров
- **Множественные провайдеры**: OpenAI, DeepSeek, Claude
- **Централизованное управление** API ключами и конфигурацией
- **Переиспользование логики** между сервисами

### Testing Architecture

- **627+ тестов** с 99.4% успешностью
- **Единообразное тестирование** через Vitest
- **Изолированные тестовые базы данных**
- **Централизованные фикстуры** и утилиты

## Error Handling

### Error Response Format

```typescript
interface ErrorResponse {
  error: {
    code: string
    message: string
    details?: any
    timestamp: string
    requestId: string
  }
}
```

### Error Categories

1. **Validation Errors (400)** - Неверные входные данные
2. **Authentication Errors (401)** - Проблемы с аутентификацией
3. **Authorization Errors (403)** - Недостаточно прав
4. **Not Found Errors (404)** - Ресурс не найден
5. **Business Logic Errors (422)** - Нарушение бизнес-правил
6. **Rate Limit Errors (429)** - Превышение лимитов
7. **Server Errors (500)** - Внутренние ошибки сервера

### Error Handling Strategy

- Централизованная обработка ошибок в API Gateway
- Логирование всех ошибок с контекстом
- Graceful degradation для внешних сервисов
- Retry механизмы для временных сбоев
- Circuit breaker для защиты от каскадных отказов

## Testing Strategy

### Current Testing Status

- **627+ тестов** с 99.4% успешностью
- **Все сервисы покрыты** комплексными тестами
- **Централизованная схема** протестирована (21 тест)
- **Redis интеграция** протестирована для всех сервисов

### Unit Testing

- **Vitest** для всех TypeScript компонентов
- **Покрытие 99.4%** успешных тестов
- **Централизованные моки** для внешних зависимостей
- **Бизнес-логика** всех rental категорий протестирована

### Integration Testing

- **API endpoints** всех сервисов протестированы
- **Централизованная база данных** интеграция
- **Redis интеграция** с отдельными БД для сервисов
- **AI сервис интеграция** с множественными провайдерами
- **Docker Compose** для изолированной тестовой среды

### End-to-End Testing

- Playwright для веб-приложения
- Тестирование критических пользовательских сценариев
- Автоматизированное тестирование в CI/CD

### Performance Testing

- Load testing с помощью Artillery или k6
- Мониторинг производительности API
- Тестирование под нагрузкой для критических endpoints

### Security Testing

- OWASP ZAP для сканирования уязвимостей
- Тестирование аутентификации и авторизации
- Валидация входных данных
- Тестирование защиты от CSRF и XSS атак
