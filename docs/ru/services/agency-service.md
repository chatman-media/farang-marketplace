# 🏢 Agency Service

## 📋 Обзор

Agency Service - это сервис управления агентствами недвижимости и их агентами на платформе Thailand Marketplace. Он обеспечивает регистрацию агентств, управление агентами, комиссионную систему, аналитику и интеграцию с другими сервисами платформы.

## 🔧 Технические характеристики

- **Порт разработки**: 3005
- **База данных**: PostgreSQL (agency_service_db)
- **ORM**: Drizzle ORM
- **Очереди**: Redis + Bull Queue
- **Тестирование**: Vitest (3 теста)
- **Покрытие тестами**: 85%+

## 🏗️ Архитектура

### Структура проекта
```
services/agency-service/
├── src/
│   ├── controllers/     # Контроллеры API
│   ├── middleware/      # Промежуточное ПО
│   ├── models/         # Модели данных
│   ├── routes/         # Маршруты API
│   ├── services/       # Бизнес-логика
│   │   ├── commission/ # Комиссионная система
│   │   ├── analytics/  # Аналитика агентств
│   │   ├── verification/ # Верификация
│   │   └── reporting/  # Отчетность
│   ├── utils/          # Утилиты
│   ├── db/             # Конфигурация БД
│   ├── jobs/           # Фоновые задачи
│   └── types/          # TypeScript типы
├── tests/              # Тесты
└── package.json
```

### Модель данных

#### Agency (Агентство)
```typescript
interface Agency {
  id: string;                    // UUID
  name: string;                  // Название агентства
  legalName: string;             // Юридическое название
  registrationNumber: string;    // Регистрационный номер
  taxId: string;                 // Налоговый номер
  
  // Контактная информация
  email: string;
  phone: string;
  website?: string;
  
  // Адрес
  address: Address;
  
  // Статус и верификация
  status: AgencyStatus;          // PENDING, ACTIVE, SUSPENDED, BANNED
  verified: boolean;             // Верифицировано ли
  verificationLevel: VerificationLevel; // BASIC, PREMIUM, ENTERPRISE
  
  // Лицензии и сертификаты
  licenses: License[];
  certifications: Certification[];
  
  // Настройки комиссий
  commissionSettings: CommissionSettings;
  
  // Финансовая информация
  bankAccount: BankAccount;
  paymentTerms: PaymentTerms;
  
  // Брендинг
  logo?: string;                 // URL логотипа
  description?: string;          // Описание агентства
  specializations: PropertyType[]; // Специализации
  
  // Метрики
  totalListings: number;         // Общее количество объявлений
  activeListings: number;        // Активные объявления
  totalBookings: number;         // Общее количество бронирований
  rating: number;                // Рейтинг (1-5)
  reviewCount: number;           // Количество отзывов
  
  // Временные метки
  createdAt: Date;
  updatedAt: Date;
  verifiedAt?: Date;
  lastActiveAt: Date;
}
```

#### Agent (Агент)
```typescript
interface Agent {
  id: string;                    // UUID
  agencyId: string;              // ID агентства
  userId: string;                // ID пользователя
  
  // Персональная информация
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  
  // Профессиональная информация
  position: AgentPosition;       // AGENT, SENIOR_AGENT, MANAGER, DIRECTOR
  licenseNumber?: string;        // Номер лицензии агента
  specializations: PropertyType[];
  languages: Language[];
  
  // Статус
  status: AgentStatus;           // ACTIVE, INACTIVE, SUSPENDED
  verified: boolean;
  
  // Права доступа
  permissions: AgentPermission[];
  
  // Комиссионные настройки
  commissionRate: number;        // Процент комиссии агента
  commissionType: CommissionType; // PERCENTAGE, FIXED, TIERED
  
  // Метрики производительности
  totalSales: number;            // Общие продажи
  totalCommission: number;       // Общая комиссия
  activeListings: number;        // Активные объявления
  completedBookings: number;     // Завершенные бронирования
  rating: number;                // Рейтинг агента
  
  // Контактные предпочтения
  preferredContactMethod: ContactMethod;
  workingHours: WorkingHours;
  timezone: string;
  
  // Временные метки
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
  joinedAgencyAt: Date;
}
```

#### Commission (Комиссия)
```typescript
interface Commission {
  id: string;
  agencyId: string;
  agentId?: string;              // Может быть null для агентских комиссий
  bookingId: string;
  listingId: string;
  
  // Финансовые данные
  bookingAmount: number;         // Сумма бронирования
  commissionRate: number;        // Процент комиссии
  commissionAmount: number;      // Сумма комиссии
  currency: Currency;
  
  // Распределение комиссии
  agencyCommission: number;      // Комиссия агентства
  agentCommission: number;       // Комиссия агента
  platformCommission: number;    // Комиссия платформы
  
  // Статус
  status: CommissionStatus;      // PENDING, CALCULATED, PAID, DISPUTED
  
  // Детали расчета
  calculationDetails: CommissionCalculation;
  
  // Выплата
  payoutId?: string;             // ID выплаты
  paidAt?: Date;
  
  // Временные метки
  createdAt: Date;
  updatedAt: Date;
  calculatedAt?: Date;
}
```

#### AgencyListing (Объявление агентства)
```typescript
interface AgencyListing {
  id: string;
  agencyId: string;
  agentId: string;               // Ответственный агент
  listingId: string;             // ID в Listing Service
  
  // Статус управления
  managementType: ManagementType; // EXCLUSIVE, NON_EXCLUSIVE, REFERRAL
  contractStartDate: Date;
  contractEndDate: Date;
  
  // Комиссионные условия
  commissionRate: number;
  commissionType: CommissionType;
  
  // Маркетинговые настройки
  featured: boolean;             // Рекомендуемое
  priority: number;              // Приоритет показа
  marketingBudget?: number;      // Бюджет на маркетинг
  
  // Статус
  status: ListingStatus;         // ACTIVE, INACTIVE, EXPIRED
  
  // Метрики
  views: number;                 // Просмотры
  inquiries: number;             // Запросы
  bookings: number;              // Бронирования
  
  // Временные метки
  createdAt: Date;
  updatedAt: Date;
  lastPromotedAt?: Date;
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

### Покрытие тестами (3 теста)

1. **agency.test.ts** - Управление агентствами
   - Регистрация агентства
   - Верификация агентства
   - Обновление информации
   - Управление статусами

2. **agent.test.ts** - Управление агентами
   - Добавление агента
   - Управление правами доступа
   - Расчет комиссий агента
   - Метрики производительности

3. **commission.test.ts** - Комиссионная система
   - Расчет комиссий
   - Распределение между агентством и агентом
   - Выплаты комиссий
   - Отчеты по комиссиям

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
PAYMENT_SERVICE_URL=http://localhost:3004
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