# 📅 Booking Service

## 📋 Обзор

Booking Service - это сервис управления бронированиями и резервациями недвижимости. Он обеспечивает полный цикл бронирования от проверки доступности до подтверждения и управления статусами бронирований с интеграцией платежной системы.

## 🔧 Технические характеристики

- **Порт разработки**: 3003
- **База данных**: PostgreSQL (booking_service_db)
- **ORM**: Drizzle ORM
- **Очереди**: Redis + Bull Queue
- **Тестирование**: Vitest (4 теста)
- **Покрытие тестами**: 90%+

## 🏗️ Архитектура

### Структура проекта
```
services/booking-service/
├── src/
│   ├── controllers/     # Контроллеры API
│   ├── middleware/      # Промежуточное ПО
│   ├── models/         # Модели данных
│   ├── routes/         # Маршруты API
│   ├── services/       # Бизнес-логика
│   │   ├── calendar/   # Календарные сервисы
│   │   ├── payment/    # Интеграция с платежами
│   │   └── notification/ # Уведомления
│   ├── utils/          # Утилиты
│   ├── db/             # Конфигурация БД
│   ├── jobs/           # Фоновые задачи
│   └── types/          # TypeScript типы
├── tests/              # Тесты
└── package.json
```

### Модель данных

#### Booking (Бронирование)
```typescript
interface Booking {
  id: string;                    // UUID
  listingId: string;             // ID объявления
  guestId: string;               // ID гостя
  hostId: string;                // ID хозяина
  agencyId?: string;             // ID агентства
  
  // Даты и время
  checkIn: Date;                 // Дата заезда
  checkOut: Date;                // Дата выезда
  nights: number;                // Количество ночей
  
  // Гости
  adults: number;                // Количество взрослых
  children: number;              // Количество детей
  infants: number;               // Количество младенцев
  totalGuests: number;           // Общее количество гостей
  
  // Финансы
  basePrice: number;             // Базовая цена за ночь
  totalPrice: number;            // Общая стоимость
  currency: Currency;            // Валюта
  fees: BookingFee[];           // Дополнительные сборы
  taxes: BookingTax[];          // Налоги
  
  // Статусы
  status: BookingStatus;         // PENDING, CONFIRMED, CANCELLED, etc.
  paymentStatus: PaymentStatus;  // PENDING, PAID, REFUNDED, etc.
  
  // Контактная информация
  guestInfo: GuestInfo;
  specialRequests?: string;      // Особые пожелания
  
  // Метаданные
  source: BookingSource;         // WEB, MOBILE, API, PHONE
  cancellationPolicy: CancellationPolicy;
  
  // Временные метки
  createdAt: Date;
  updatedAt: Date;
  confirmedAt?: Date;
  cancelledAt?: Date;
  expiresAt: Date;               // Время истечения неподтвержденного бронирования
}
```

#### BookingStatus (Статус бронирования)
```typescript
enum BookingStatus {
  PENDING = 'PENDING',           // Ожидает подтверждения
  CONFIRMED = 'CONFIRMED',       // Подтверждено
  CHECKED_IN = 'CHECKED_IN',     // Заселение произошло
  CHECKED_OUT = 'CHECKED_OUT',   // Выселение произошло
  CANCELLED = 'CANCELLED',       // Отменено
  NO_SHOW = 'NO_SHOW',          // Не явился
  EXPIRED = 'EXPIRED'            // Истекло время подтверждения
}
```

#### Availability (Доступность)
```typescript
interface Availability {
  id: string;
  listingId: string;
  date: Date;                    // Конкретная дата
  available: boolean;            // Доступно ли
  price: number;                 // Цена за эту дату
  minStay: number;              // Минимальное количество ночей
  maxStay: number;              // Максимальное количество ночей
  checkInAllowed: boolean;       // Разрешен ли заезд
  checkOutAllowed: boolean;      // Разрешен ли выезд
  restrictions: DateRestriction[]; // Ограничения
  createdAt: Date;
  updatedAt: Date;
}
```

#### BookingFee (Сбор)
```typescript
interface BookingFee {
  id: string;
  bookingId: string;
  type: FeeType;                 // CLEANING, SERVICE, SECURITY_DEPOSIT, etc.
  name: string;                  // Название сбора
  amount: number;                // Сумма
  currency: Currency;
  taxable: boolean;              // Облагается ли налогом
  mandatory: boolean;            // Обязательный ли
  description?: string;
}
```

## 🗓️ Календарная система

### Управление доступностью
- Календарь доступности на 2 года вперед
- Блокировка дат для обслуживания
- Сезонное ценообразование
- Минимальные и максимальные сроки проживания
- Ограничения на заезд/выезд

### Правила бронирования
- Advance booking (заблаговременное бронирование)
- Same-day booking (бронирование в день заезда)
- Instant booking (мгновенное бронирование)
- Request to book (запрос на бронирование)

## 🌐 API Endpoints

### Проверка доступности

#### GET /api/availability/:listingId
Проверка доступности объявления

**Параметры:**
```
?checkIn=2024-03-15
&checkOut=2024-03-20
&guests=2
```

**Ответ:**
```json
{
  "success": true,
  "data": {
    "available": true,
    "dates": [
      {
        "date": "2024-03-15",
        "available": true,
        "price": 2500,
        "checkInAllowed": true
      }
    ],
    "totalPrice": 12500,
    "nights": 5,
    "fees": [
      {
        "type": "CLEANING",
        "name": "Cleaning Fee",
        "amount": 1000
      }
    ]
  }
}
```

#### POST /api/availability/bulk
Проверка доступности для нескольких объявлений

### Создание бронирования

#### POST /api/bookings
Создание нового бронирования

**Запрос:**
```json
{
  "listingId": "listing-uuid",
  "checkIn": "2024-03-15",
  "checkOut": "2024-03-20",
  "guests": {
    "adults": 2,
    "children": 0,
    "infants": 0
  },
  "guestInfo": {
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "phone": "+66123456789",
    "nationality": "US"
  },
  "specialRequests": "Late check-in around 10 PM",
  "paymentMethodId": "pm_1234567890"
}
```

**Ответ:**
```json
{
  "success": true,
  "data": {
    "booking": {
      "id": "booking-uuid",
      "status": "PENDING",
      "totalPrice": 13500,
      "currency": "THB",
      "expiresAt": "2024-01-15T12:00:00Z"
    },
    "paymentIntent": {
      "id": "pi_1234567890",
      "clientSecret": "pi_1234567890_secret_xyz"
    }
  }
}
```

### Управление бронированиями

#### GET /api/bookings/:id
Получение информации о бронировании

#### PUT /api/bookings/:id/confirm
Подтверждение бронирования

#### PUT /api/bookings/:id/cancel
Отмена бронирования

**Запрос:**
```json
{
  "reason": "GUEST_CANCELLED",
  "note": "Guest had to cancel due to emergency"
}
```

#### GET /api/bookings
Получение списка бронирований

**Параметры:**
```
?status=CONFIRMED
&checkIn=2024-03-01
&checkOut=2024-03-31
&guestId=user-uuid
&page=1
&limit=20
```

### Календарь хозяина

#### GET /api/host/calendar/:listingId
Получение календаря для хозяина

#### PUT /api/host/availability/:listingId
Обновление доступности

**Запрос:**
```json
{
  "dates": [
    {
      "date": "2024-03-15",
      "available": false,
      "reason": "MAINTENANCE"
    },
    {
      "date": "2024-03-16",
      "available": true,
      "price": 3000,
      "minStay": 2
    }
  ]
}
```

#### POST /api/host/block-dates
Блокировка дат

### Чек-ин/чек-аут

#### POST /api/bookings/:id/checkin
Отметка о заселении

#### POST /api/bookings/:id/checkout
Отметка о выселении

**Запрос:**
```json
{
  "actualCheckIn": "2024-03-15T15:30:00Z",
  "guestCount": 2,
  "notes": "Guests arrived on time, provided all documents"
}
```

## 💰 Интеграция с платежами

### Payment Service интеграция
```typescript
// Создание платежного намерения
const paymentIntent = await paymentService.createIntent({
  amount: booking.totalPrice,
  currency: booking.currency,
  bookingId: booking.id,
  customerId: booking.guestId
});

// Обработка успешного платежа
const handlePaymentSuccess = async (paymentIntentId: string) => {
  const booking = await bookingService.confirmPayment(paymentIntentId);
  await notificationService.sendConfirmation(booking);
};
```

### Политики отмены
- **Flexible**: Полный возврат за 24 часа до заезда
- **Moderate**: Полный возврат за 5 дней до заезда
- **Strict**: Возврат 50% за 7 дней до заезда
- **Super Strict**: Возврат 50% за 30 дней до заезда
- **Non-refundable**: Без возврата средств

## 📱 Уведомления

### Типы уведомлений
1. **Подтверждение бронирования**
2. **Напоминание о платеже**
3. **Инструкции для заселения**
4. **Напоминание о заселении**
5. **Запрос отзыва**
6. **Уведомления об отмене**

### Каналы уведомлений
- Email
- SMS
- Push уведомления
- In-app уведомления

## 🔄 Фоновые задачи

### Автоматические процессы
```typescript
// Истечение неподтвержденных бронирований
const expireBookings = async () => {
  const expiredBookings = await bookingService.findExpired();
  for (const booking of expiredBookings) {
    await bookingService.expire(booking.id);
    await availabilityService.releaseBlocked(booking.listingId, booking.dates);
  }
};

// Автоматический чек-аут
const autoCheckout = async () => {
  const overdueBookings = await bookingService.findOverdueCheckouts();
  for (const booking of overdueBookings) {
    await bookingService.autoCheckout(booking.id);
  }
};
```

## 🧪 Тестирование

### Покрытие тестами (4 теста)

1. **booking.test.ts** - Основная функциональность
   - Создание бронирования
   - Подтверждение бронирования
   - Отмена бронирования
   - Проверка статусов

2. **availability.test.ts** - Календарь и доступность
   - Проверка доступности
   - Блокировка дат
   - Ценообразование
   - Ограничения

3. **payment.test.ts** - Платежная интеграция
   - Создание платежного намерения
   - Обработка успешного платежа
   - Обработка неудачного платежа
   - Возвраты

4. **calendar.test.ts** - Календарная логика
   - Расчет ночей
   - Проверка пересечений
   - Валидация дат
   - Часовые пояса

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
PORT=3003
NODE_ENV=production

# База данных
DATABASE_URL=postgresql://user:password@localhost:5432/booking_service_db

# Redis
REDIS_URL=redis://localhost:6379

# Интеграции
PAYMENT_SERVICE_URL=http://localhost:3004
LISTING_SERVICE_URL=http://localhost:3002
USER_SERVICE_URL=http://localhost:3001
CRM_SERVICE_URL=http://localhost:3008

# Уведомления
EMAIL_SERVICE_URL=http://localhost:3009
SMS_PROVIDER_API_KEY=your-sms-api-key

# Временные зоны
DEFAULT_TIMEZONE=Asia/Bangkok

# Бизнес-правила
BOOKING_EXPIRY_HOURS=24
MAX_ADVANCE_BOOKING_DAYS=365
MIN_ADVANCE_BOOKING_HOURS=2

# Мониторинг
SENTRY_DSN=your-sentry-dsn
```

## 🔄 Интеграции

### Внутренние сервисы
- **Payment Service**: Обработка платежей и возвратов
- **Listing Service**: Получение информации об объявлениях
- **User Service**: Аутентификация и профили пользователей
- **CRM Service**: Уведомления и коммуникации

### Внешние сервисы
- **Stripe**: Обработка платежей
- **Twilio**: SMS уведомления
- **SendGrid**: Email уведомления
- **Google Calendar**: Синхронизация календарей

## 📊 Бизнес-логика

### Правила бронирования
1. **Проверка доступности** перед созданием
2. **Блокировка дат** на время обработки платежа
3. **Автоматическое истечение** неоплаченных бронирований
4. **Политики отмены** в зависимости от типа объявления
5. **Минимальные/максимальные сроки** проживания

### Расчет стоимости
```typescript
const calculateTotalPrice = (booking: BookingRequest) => {
  const basePrice = calculateBasePrice(booking.dates, booking.listingId);
  const fees = calculateFees(booking.listingId, basePrice);
  const taxes = calculateTaxes(basePrice + fees, booking.location);
  
  return {
    basePrice,
    fees,
    taxes,
    total: basePrice + fees + taxes
  };
};
```

## 📈 Производительность

### Оптимизации
- Кеширование календарей доступности
- Индексы базы данных для быстрого поиска
- Пагинация списков бронирований
- Асинхронная обработка уведомлений

### Масштабирование
- Горизонтальное масштабирование
- Шардинг по регионам
- Очереди для фоновых задач
- Кеширование в Redis

## 📊 Мониторинг

### Метрики
- Количество бронирований
- Конверсия из просмотров в бронирования
- Средняя стоимость бронирования
- Время обработки запросов
- Процент отмен

### Алерты
- Высокое время ответа API
- Ошибки платежной системы
- Превышение лимита неподтвержденных бронирований
- Проблемы с уведомлениями

---

**Контакты для поддержки:**
- 📧 Email: booking-service@thailand-marketplace.com
- 📱 Slack: #booking-service-support
- 📋 Issues: [GitHub Issues](https://github.com/chatman-media/farang-marketplace/issues?label=booking-service)