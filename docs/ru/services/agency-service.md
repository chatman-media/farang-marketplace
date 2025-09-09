# 🏢 Agency Service

## 📋 Обзор

Agency Service - это сервис управления агентствами аренды на платформе Thailand Marketplace. Он обеспечивает регистрацию и управление агентствами, предоставляющими услуги аренды транспорта (скутеры, мотоциклы, автомобили), оборудования и недвижимости, управление назначениями услуг и интеграцию с системой бронирований.

## 🔧 Технические характеристики

- **Порт разработки**: 3005
- **База данных**: PostgreSQL (agency_service_db)
- **ORM**: Drizzle ORM
- **Очереди**: Redis + Bull Queue
- **Тестирование**: Vitest (50 тестов в 3 файлах)
- **Покрытие тестами**: 85%+

## 🏗️ Архитектура

### Структура проекта
```
services/agency-service/
├── src/
│   ├── controllers/     # Контроллеры API
│   │   ├── AgencyController.ts
│   │   ├── AgencyServiceController.ts
│   │   ├── BookingIntegrationController.ts
│   │   └── ServiceAssignmentController.ts
│   ├── middleware/      # Промежуточное ПО
│   │   └── auth.ts
│   ├── routes/         # Маршруты API
│   │   ├── agencies.ts
│   │   ├── agency-services.ts
│   │   ├── assignments.ts
│   │   └── booking-integration.ts
│   ├── services/       # Бизнес-логика
│   │   ├── AgencyService.ts
│   │   ├── AgencyServiceService.ts
│   │   ├── BookingIntegrationService.ts
│   │   └── ServiceAssignmentService.ts
│   ├── db/             # База данных
│   │   ├── connection.ts
│   │   └── schema.ts
│   ├── test/           # Тесты (50 тестов)
│   │   ├── AgencyAPI.test.ts
│   │   ├── AgencyService.test.ts
│   │   ├── BookingIntegration.test.ts
│   │   └── setup.ts
│   └── types/          # TypeScript типы
└── package.json
```

### Модель данных

#### Agency (Агентство аренды)
```typescript
interface Agency {
  id: string;                    // UUID
  userId: string;                // ID владельца агентства

  // Основная информация
  name: string;                  // Название агентства
  description: string;           // Описание агентства
  businessRegistrationNumber?: string; // Регистрационный номер
  taxId?: string;                // Налоговый номер

  // Контактная информация
  email: string;
  phone: string;
  website?: string;

  // Локация и зоны покрытия
  primaryLocation: Location;     // Основное местоположение
  coverageAreas: Location[];     // Зоны обслуживания

  // Бизнес-настройки
  commissionRate: number;        // Комиссия агентства (по умолчанию 15%)
  minimumOrderValue: number;     // Минимальная сумма заказа
  currency: string;              // Валюта (THB)

  // Статус и верификация
  status: AgencyStatus;          // pending, active, suspended, inactive, rejected
  verificationStatus: VerificationStatus; // pending, verified, rejected, expired
  isVerified: boolean;           // Верифицировано ли

  // Метрики производительности
  rating: number;                // Рейтинг (0-5)
  totalReviews: number;          // Количество отзывов
  totalOrders: number;           // Общее количество заказов
  completedOrders: number;       // Завершенные заказы

  // Документы и верификация
  documents: Record<string, any>; // Документы для верификации
  verificationNotes?: string;    // Заметки по верификации

  // Настройки
  settings: Record<string, any>; // Настройки агентства

  // Временные метки
  createdAt: Date;
  updatedAt: Date;
  verifiedAt?: Date;
}
```

#### AgencyService (Услуга агентства)
```typescript
interface AgencyService {
  id: string;                    // UUID
  agencyId: string;              // ID агентства

  // Детали услуги
  name: string;                  // Название услуги
  description: string;           // Описание услуги
  category: ServiceCategory;     // Категория (vehicles, equipment, property, etc.)

  // Ценообразование
  basePrice: number;             // Базовая цена
  currency: string;              // Валюта (THB)
  pricingModel: string;          // Модель ценообразования (fixed, hourly, per_item)

  // Конфигурация услуги
  isActive: boolean;             // Активна ли услуга
  requiresApproval: boolean;     // Требует ли одобрения
  estimatedDuration?: string;    // Примерная продолжительность

  // Требования и возможности
  requirements: string[];        // Требования к клиенту
  capabilities: string[];        // Возможности услуги

  // Метаданные
  metadata: Record<string, any>; // Дополнительные данные

  // Временные метки
  createdAt: Date;
  updatedAt: Date;
}
```

#### ServiceCategory (Категории услуг)
```typescript
enum ServiceCategory {
  VEHICLES = 'vehicles',         // Транспорт (скутеры, мотоциклы, машины, велосипеды)
  WATERCRAFT = 'watercraft',     // Водный транспорт (лодки, катеры, яхты)
  EQUIPMENT = 'equipment',       // Оборудование (строительное, спортивное, профессиональное)
  PROPERTY = 'property',         // Недвижимость (квартиры, дома, офисы)
  ELECTRONICS = 'electronics',   // Электроника (камеры, ноутбуки, техника)
  TOOLS = 'tools',              // Инструменты (строительные, садовые, ремонтные)
  FURNITURE = 'furniture',       // Мебель (для мероприятий, офиса, дома)
  EVENTS = 'events',            // Мероприятия (свадьбы, конференции, праздники)
  RECREATION = 'recreation',     // Отдых (спорт, туризм, развлечения)
  HOUSEHOLD = 'household',       // Бытовые товары
  OTHER = 'other'               // Прочее
}
```

#### ServiceAssignment (Назначение услуги)
```typescript
interface ServiceAssignment {
  id: string;                    // UUID
  agencyId: string;              // ID агентства
  agencyServiceId: string;       // ID услуги агентства

  // Связанные сущности
  listingId: string;             // ID объявления в listing-service
  bookingId?: string;            // ID бронирования в booking-service (опционально)

  // Ценообразование и комиссия
  servicePrice: number;          // Цена услуги
  commissionAmount: number;      // Сумма комиссии
  commissionRate: number;        // Процент комиссии
  currency: string;              // Валюта (THB)

  // Статус и отслеживание
  status: ServiceAssignmentStatus; // active, paused, completed, cancelled
  assignedAt: Date;              // Время назначения
  startedAt?: Date;              // Время начала выполнения
  completedAt?: Date;            // Время завершения

  // Отслеживание производительности
  customerRating?: number;       // Оценка клиента (1-5)
  customerFeedback?: string;     // Отзыв клиента
  agencyNotes?: string;          // Заметки агентства

  // Метаданные
  metadata: Record<string, any>; // Дополнительные данные

  // Временные метки
  createdAt: Date;
  updatedAt: Date;
}
```

#### ServiceAssignmentStatus (Статусы назначения услуг)
```typescript
enum ServiceAssignmentStatus {
  ACTIVE = 'active',             // Активное назначение
  PAUSED = 'paused',             // Приостановлено
  COMPLETED = 'completed',       // Завершено
  CANCELLED = 'cancelled'        // Отменено
}
```

#### AgencyStatus (Статусы агентства)
```typescript
enum AgencyStatus {
  PENDING = 'pending',           // Ожидает рассмотрения
  ACTIVE = 'active',             // Активное
  SUSPENDED = 'suspended',       // Приостановлено
  INACTIVE = 'inactive',         // Неактивное
  REJECTED = 'rejected'          // Отклонено
}
```

#### VerificationStatus (Статусы верификации)
```typescript
enum VerificationStatus {
  PENDING = 'pending',           // Ожидает верификации
  VERIFIED = 'verified',         // Верифицировано
  REJECTED = 'rejected',         // Отклонено
  EXPIRED = 'expired'            // Истекло
}
```

## 🌐 API Endpoints

### Управление агентствами

#### POST /api/agencies
Регистрация нового агентства

**Запрос:**
```json
{
  "name": "Bangkok Premium Properties",
  "legalName": "Bangkok Premium Properties Co., Ltd.",
  "registrationNumber": "0105564000123",
  "taxId": "0105564000123",
  "email": "info@bangkokpremium.com",
  "phone": "+66-2-123-4567",
  "website": "https://bangkokpremium.com",
  "address": {
    "street": "123 Sukhumvit Road",
    "district": "Watthana",
    "city": "Bangkok",
    "province": "Bangkok",
    "postalCode": "10110",
    "country": "Thailand"
  },
  "specializations": ["CONDO", "HOUSE", "COMMERCIAL"],
  "description": "Leading real estate agency in Bangkok"
}
```

**Ответ:**
```json
{
  "success": true,
  "data": {
    "agency": {
      "id": "agency-uuid",
      "name": "Bangkok Premium Properties",
      "status": "PENDING",
      "verified": false,
      "verificationLevel": "BASIC",
      "createdAt": "2024-01-15T10:00:00Z"
    }
  }
}
```

#### GET /api/agencies/:id
Получение информации об агентстве

#### PUT /api/agencies/:id
Обновление информации об агентстве

#### GET /api/agencies
Получение списка агентств

**Параметры:**
```
?status=ACTIVE
&verified=true
&city=Bangkok
&specialization=CONDO
&page=1
&limit=20
&sort=rating
&order=desc
```

### Управление агентами

#### POST /api/agencies/:agencyId/agents
Добавление агента в агентство

**Запрос:**
```json
{
  "userId": "user-uuid",
  "position": "AGENT",
  "licenseNumber": "RE-2024-001234",
  "specializations": ["CONDO", "HOUSE"],
  "languages": ["TH", "EN", "ZH"],
  "commissionRate": 60,
  "commissionType": "PERCENTAGE",
  "permissions": ["CREATE_LISTING", "MANAGE_BOOKINGS", "VIEW_ANALYTICS"]
}
```

#### GET /api/agencies/:agencyId/agents
Получение списка агентов агентства

#### PUT /api/agents/:id
Обновление информации об агенте

#### DELETE /api/agents/:id
Удаление агента из агентства

### Управление объявлениями

#### POST /api/agencies/:agencyId/listings
Добавление объявления под управление агентства

**Запрос:**
```json
{
  "listingId": "listing-uuid",
  "agentId": "agent-uuid",
  "managementType": "EXCLUSIVE",
  "contractStartDate": "2024-01-15",
  "contractEndDate": "2024-12-31",
  "commissionRate": 5,
  "commissionType": "PERCENTAGE",
  "featured": true,
  "priority": 1
}
```

#### GET /api/agencies/:agencyId/listings
Получение объявлений агентства

#### PUT /api/agency-listings/:id
Обновление настроек объявления

### Комиссионная система

#### GET /api/agencies/:agencyId/commissions
Получение комиссий агентства

**Параметры:**
```
?status=PAID
&agentId=agent-uuid
&dateFrom=2024-01-01
&dateTo=2024-01-31
&page=1
&limit=20
```

#### POST /api/commissions/calculate
Расчет комиссии для бронирования

**Запрос:**
```json
{
  "bookingId": "booking-uuid",
  "agencyId": "agency-uuid",
  "agentId": "agent-uuid"
}
```

#### PUT /api/commissions/:id/pay
Выплата комиссии

### Аналитика и отчеты

#### GET /api/agencies/:agencyId/analytics
Получение аналитики агентства

**Ответ:**
```json
{
  "success": true,
  "data": {
    "period": {
      "from": "2024-01-01",
      "to": "2024-01-31"
    },
    "metrics": {
      "totalBookings": 45,
      "totalRevenue": 2250000,
      "totalCommission": 112500,
      "averageBookingValue": 50000,
      "conversionRate": 12.5,
      "topAgent": {
        "id": "agent-uuid",
        "name": "John Smith",
        "bookings": 15,
        "commission": 37500
      }
    },
    "trends": {
      "bookingsGrowth": 15.2,
      "revenueGrowth": 22.8,
      "commissionGrowth": 18.5
    }
  }
}
```

#### GET /api/agents/:agentId/analytics
Получение аналитики агента

#### GET /api/agencies/:agencyId/reports/monthly
Месячный отчет агентства

## 💰 Комиссионная система

### Расчет комиссий
```typescript
class CommissionCalculator {
  async calculateCommission(booking: Booking, agency: Agency, agent?: Agent) {
    const bookingAmount = booking.totalPrice;
    const agencyRate = agency.commissionSettings.rate;
    
    // Базовая комиссия агентства
    const agencyCommission = bookingAmount * (agencyRate / 100);
    
    // Комиссия агента (если есть)
    let agentCommission = 0;
    if (agent) {
      const agentRate = agent.commissionRate;
      agentCommission = agencyCommission * (agentRate / 100);
    }
    
    // Комиссия платформы
    const platformRate = 3.5; // 3.5% платформенная комиссия
    const platformCommission = bookingAmount * (platformRate / 100);
    
    return {
      bookingAmount,
      agencyCommission: agencyCommission - agentCommission,
      agentCommission,
      platformCommission,
      totalCommission: agencyCommission + platformCommission
    };
  }
}
```

### Типы комиссий
1. **Процентная**: Фиксированный процент от суммы бронирования
2. **Фиксированная**: Фиксированная сумма за бронирование
3. **Ступенчатая**: Разные проценты в зависимости от суммы
4. **Гибридная**: Комбинация фиксированной и процентной

### Схемы выплат
- **Еженедельные выплаты**: Каждый понедельник
- **Ежемесячные выплаты**: 1 числа каждого месяца
- **По требованию**: Минимальная сумма 10,000 THB

## 🔍 Верификация агентств

### Уровни верификации

#### Basic (Базовый)
- Проверка документов
- Подтверждение контактов
- Базовые функции платформы

#### Premium (Премиум)
- Проверка лицензий
- Финансовая проверка
- Расширенные функции аналитики
- Приоритетная поддержка

#### Enterprise (Корпоративный)
- Полная юридическая проверка
- Проверка страхования
- Персональный менеджер
- Кастомизация интерфейса

### Процесс верификации
```typescript
class VerificationService {
  async verifyAgency(agencyId: string, level: VerificationLevel) {
    const agency = await this.getAgency(agencyId);
    
    const checks = {
      documents: await this.verifyDocuments(agency),
      licenses: await this.verifyLicenses(agency),
      financial: await this.verifyFinancial(agency),
      legal: await this.verifyLegal(agency)
    };
    
    const passed = this.evaluateChecks(checks, level);
    
    if (passed) {
      await this.approveVerification(agencyId, level);
      await this.notifyVerificationSuccess(agency);
    } else {
      await this.requestAdditionalDocuments(agencyId, checks);
    }
    
    return { passed, checks };
  }
}
```

## 📊 Аналитика и метрики

### Метрики агентства
```typescript
interface AgencyMetrics {
  // Основные показатели
  totalListings: number;
  activeListings: number;
  totalBookings: number;
  totalRevenue: number;
  totalCommission: number;
  
  // Производительность
  conversionRate: number;        // Конверсия просмотров в бронирования
  averageBookingValue: number;   // Средняя стоимость бронирования
  repeatCustomerRate: number;    // Процент повторных клиентов
  
  // Качество
  averageRating: number;         // Средний рейтинг
  responseTime: number;          // Среднее время ответа (минуты)
  cancellationRate: number;      // Процент отмен
  
  // Рост
  monthlyGrowth: {
    bookings: number;
    revenue: number;
    listings: number;
  };
}
```

### Метрики агента
```typescript
interface AgentMetrics {
  // Продажи
  totalSales: number;
  monthlyBookings: number;
  averageDealSize: number;
  
  // Активность
  activeListings: number;
  clientInteractions: number;
  responseRate: number;
  
  // Качество
  customerRating: number;
  dealClosureRate: number;
  clientRetentionRate: number;
  
  // Сравнение с коллегами
  rankInAgency: number;
  performanceScore: number;
}
```

## 🧪 Тестирование

### Покрытие тестами (50 тестов в 3 файлах)

1. **AgencyAPI.test.ts** (18 тестов) - API тестирование
   - Создание агентства
   - Получение информации об агентстве
   - Обновление агентства
   - Управление статусами
   - Верификация агентства
   - API валидация

2. **AgencyService.test.ts** (15 тестов) - Бизнес-логика
   - Управление агентствами
   - Управление услугами агентства
   - Расчет комиссий
   - Метрики производительности
   - Валидация данных

3. **BookingIntegration.test.ts** (17 тестов) - Интеграция с бронированиями
   - Назначение услуг на бронирования
   - Отслеживание статусов
   - Интеграция с booking-service
   - Обработка платежей
   - Управление жизненным циклом заказов

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
PORT=3005
NODE_ENV=production

# База данных
DATABASE_URL=postgresql://user:password@localhost:5432/agency_service_db

# Redis
REDIS_URL=redis://localhost:6379

# Интеграции
USER_SERVICE_URL=http://localhost:3001
LISTING_SERVICE_URL=http://localhost:3002
BOOKING_SERVICE_URL=http://localhost:3003
PAYMENT_SERVICE_URL=http://localhost:3003
CRM_SERVICE_URL=http://localhost:3008

# Верификация
VERIFICATION_API_URL=https://api.verification-service.com
VERIFICATION_API_KEY=your-verification-api-key

# Комиссии
DEFAULT_AGENCY_COMMISSION=5
DEFAULT_AGENT_COMMISSION=60
PLATFORM_COMMISSION=3.5
MIN_PAYOUT_AMOUNT=10000

# Файловое хранилище
AWS_S3_BUCKET=agency-documents
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key

# Мониторинг
SENTRY_DSN=your-sentry-dsn
```

## 🔄 Интеграции

### Внутренние сервисы
- **User Service**: Аутентификация и профили агентов
- **Listing Service**: Управление объявлениями
- **Booking Service**: Обработка бронирований
- **Payment Service**: Выплата комиссий
- **CRM Service**: Коммуникации с клиентами

### Внешние сервисы
- **Verification APIs**: Проверка документов и лицензий
- **Banking APIs**: Выплаты комиссий
- **Document Storage**: Хранение документов верификации
- **Analytics Services**: Расширенная аналитика

## 📈 Производительность

### Оптимизации
- Кеширование метрик агентств
- Индексы для быстрого поиска
- Пагинация больших списков
- Асинхронная обработка отчетов

### Масштабирование
- Горизонтальное масштабирование
- Шардинг по регионам
- Очереди для фоновых задач
- CDN для документов

## 📊 Мониторинг

### Метрики системы
- Количество активных агентств
- Общий объем комиссий
- Время обработки верификации
- Производительность агентов

### Алерты
- Проблемы с выплатами комиссий
- Высокое время ответа API
- Ошибки верификации
- Подозрительная активность

---

**Контакты для поддержки:**
- 📧 Email: agency-service@thailand-marketplace.com
- 📱 Slack: #agency-service-support
- 📋 Issues: [GitHub Issues](https://github.com/chatman-media/farang-marketplace/issues?label=agency-service)