# 💳 Payment Service

## 📋 Обзор

Payment Service - это современный сервис обработки платежей для платформы Thailand Marketplace с интеграцией **TON Blockchain** и поддержкой традиционных платежных систем. Он обеспечивает безопасную обработку криптовалютных и фиатных платежей, управление кошельками, возвраты средств и интеграцию с локальными тайскими платежными провайдерами.

## 🔧 Технические характеристики

- **Порт разработки**: 3003
- **Фреймворк**: Fastify
- **База данных**: PostgreSQL
- **ORM**: Drizzle ORM
- **Очереди**: BullMQ
- **Валидация**: Zod для runtime проверки типов
- **Blockchain**: TON (The Open Network) + TON Connect 3.5
- **Тестирование**: Vitest (54 теста в 4 файлах)
- **Покрытие тестами**: 95%+
- **PCI DSS**: Соответствие стандартам безопасности
- **Криптовалюты**: TON, USDT, USDC (Jettons)
- **Node.js**: 22+ (современные возможности)

## 🏗️ Архитектура

### Структура проекта
```
services/payment-service/
├── src/
│   ├── app.ts          # Современное Fastify приложение
│   ├── index.ts        # Точка входа
│   ├── routes/         # API маршруты v1
│   │   ├── payments.ts # Fastify + Zod валидация
│   │   └── webhooks.ts # Современные webhook handlers
│   ├── services/       # Бизнес-логика
│   │   ├── PaymentService.ts    # Основная логика
│   │   ├── StripeService.ts     # Stripe интеграция
│   │   └── ModernTonService.ts  # TON Blockchain (2025)
│   ├── jobs/           # BullMQ фоновые задачи
│   │   ├── index.ts
│   │   ├── processors/
│   │   └── schedulers/
│   ├── db/             # База данных (Drizzle ORM)
│   │   ├── connection.ts
│   │   └── schema.ts
│   └── test/           # Тесты (54 теста)
│       ├── PaymentAPI.test.ts
│       ├── PaymentService.test.ts
│       ├── StripeService.test.ts
│       ├── TonService.test.ts
│       └── setup.ts
├── drizzle.config.ts   # Конфигурация ORM
├── vitest.config.ts    # Конфигурация тестов
└── package.json
```

### Модель данных

#### Payment (Платеж)
```typescript
interface Payment {
  id: string;                    // UUID
  bookingId: string;             // ID бронирования
  payerId: string;               // ID плательщика
  payeeId: string;               // ID получателя

  // Сумма и валюта
  amount: number;                // Основная сумма платежа
  currency: string;              // Валюта (TON, USD, THB)
  fiatAmount?: number;           // Фиатная сумма (для крипто платежей)
  fiatCurrency?: string;         // Фиатная валюта (USD, THB)

  // Статусы и метод
  status: PaymentStatus;         // pending, processing, confirmed, completed, failed
  paymentMethod: PaymentMethodType; // ton_wallet, ton_connect, jetton_usdt, jetton_usdc, stripe_card, promptpay

  // Blockchain детали (для TON платежей)
  tonTransactionHash?: string;   // Хеш транзакции в TON
  tonWalletAddress?: string;     // Адрес TON кошелька
  tonAmount?: number;            // Сумма в TON
  confirmationBlocks?: number;   // Количество подтверждений
  requiredConfirmations?: number; // Требуемые подтверждения

  // Комиссии
  platformFee: number;           // Комиссия платформы
  processingFee: number;         // Комиссия обработки
  totalFees: number;             // Общие комиссии

  // Детали платежа
  description?: string;
  metadata?: Record<string, any>; // Дополнительные данные

  // Внешние интеграции
  externalPaymentId?: string;    // ID во внешней системе
  stripePaymentIntentId?: string; // Stripe Payment Intent ID
  stripeChargeId?: string;       // Stripe Charge ID
  webhookData?: Record<string, any>; // Данные webhook

  // Временные метки
  createdAt: Date;
  updatedAt: Date;
  processedAt?: Date;
  failedAt?: Date;
}
```

#### PaymentStatus (Статус платежа)
```typescript
enum PaymentStatus {
  PENDING = 'pending',           // Ожидает обработки
  PROCESSING = 'processing',     // В процессе обработки
  CONFIRMED = 'confirmed',       // Подтвержден (блокчейн)
  COMPLETED = 'completed',       // Завершен успешно
  FAILED = 'failed',            // Неудачный
  CANCELLED = 'cancelled',       // Отменен
  REFUNDED = 'refunded',        // Возвращен
  DISPUTED = 'disputed'         // Спорный платеж
}
```

#### Wallet (Кошелек)
```typescript
interface Wallet {
  id: string;
  userId: string;                // Владелец кошелька
  currency: Currency;
  
  // Балансы
  availableBalance: number;      // Доступный баланс
  pendingBalance: number;        // Заблокированный баланс
  totalBalance: number;          // Общий баланс
  
  // Лимиты
  dailyLimit: number;           // Дневной лимит
  monthlyLimit: number;         // Месячный лимит
  dailySpent: number;           // Потрачено за день
  monthlySpent: number;         // Потрачено за месяц
  
  // Статус
  status: WalletStatus;         // ACTIVE, SUSPENDED, FROZEN
  verified: boolean;            // Верифицирован ли
  
  // Метаданные
  createdAt: Date;
  updatedAt: Date;
  lastTransactionAt?: Date;
}
```

#### Transaction (Транзакция)
```typescript
interface Transaction {
  id: string;
  walletId: string;
  paymentId?: string;           // Связанный платеж
  
  // Тип и сумма
  type: TransactionType;        // CREDIT, DEBIT, HOLD, RELEASE
  amount: number;
  currency: Currency;
  
  // Баланс после транзакции
  balanceAfter: number;
  
  // Описание
  description: string;
  reference?: string;           // Внешняя ссылка
  
  // Метаданные
  metadata: Record<string, any>;
  createdAt: Date;
}
```

#### PaymentMethod (Способ платежа)
```typescript
enum PaymentMethodType {
  TON_WALLET = 'ton_wallet',       // TON кошелек
  TON_CONNECT = 'ton_connect',     // TON Connect интеграция
  JETTON_USDT = 'jetton_usdt',     // USDT на TON
  JETTON_USDC = 'jetton_usdc',     // USDC на TON
  STRIPE_CARD = 'stripe_card',     // Банковская карта через Stripe
  PROMPTPAY = 'promptpay'          // PromptPay (Таиланд)
}
```
```typescript
interface PaymentMethod {
  id: string;
  userId: string;
  
  // Тип
  type: PaymentMethodType;      // ton_wallet, ton_connect, jetton_usdt, jetton_usdc, stripe_card, promptpay
  provider: PaymentProvider;
  providerMethodId: string;     // ID у провайдера
  
  // Детали карты (зашифрованы)
  cardLast4?: string;
  cardBrand?: string;           // VISA, MASTERCARD, etc.
  cardExpMonth?: number;
  cardExpYear?: number;
  
  // Банковский счет
  bankName?: string;
  accountLast4?: string;
  
  // Статус
  verified: boolean;
  default: boolean;             // Способ по умолчанию
  
  // Метаданные
  createdAt: Date;
  updatedAt: Date;
  lastUsedAt?: Date;
}
```

## � Платежные провайдеры

### 1. TON Blockchain (Основной)
```typescript
class TonService {
  async createPayment(request: PaymentRequest): Promise<TonTransaction> {
    const amount = toNano(request.amount); // Конвертация в nanotons

    const payment = await this.wallet.createTransfer({
      to: Address.parse(request.toAddress),
      value: amount,
      body: request.comment ? beginCell()
        .storeUint(0, 32)
        .storeStringTail(request.comment)
        .endCell() : undefined
    });

    return payment;
  }

  async verifyTransaction(hash: string): Promise<boolean> {
    const tx = await this.client.getTransaction(hash);
    return tx.confirmed && tx.confirmations >= 1;
  }

  async getWalletBalance(address: string): Promise<string> {
    const balance = await this.client.getBalance(Address.parse(address));
    return fromNano(balance);
  }
}
```

### 2. Поддерживаемые платежные методы

#### Криптовалютные платежи
- **TON Wallet**: Прямые переводы TON
- **TON Connect**: Интеграция с кошельками через TON Connect
- **Jetton USDT**: Стейблкоин USDT на TON
- **Jetton USDC**: Стейблкоин USDC на TON

#### Традиционные платежи
- **Stripe Card**: Банковские карты

#### Тайские платежные системы
- **PromptPay**: Национальная система QR-платежей Таиланда

## 🔗 TON Connect интеграция

### Преимущества TON платежей
1. **Низкие комиссии**: ~$0.01 за транзакцию
2. **Быстрые переводы**: Подтверждение за 5 секунд
3. **Глобальность**: Работает в любой стране
4. **Прозрачность**: Все транзакции в блокчейне
5. **Безопасность**: Криптографическая защита
6. **Стейблкоины**: USDT/USDC для стабильности

### TON Connect Workflow
```typescript
// 1. Инициализация подключения
const tonConnectUI = new TonConnectUI({
  manifestUrl: 'https://thailand-marketplace.com/tonconnect-manifest.json'
});

// 2. Подключение кошелька
const connectedWallet = await tonConnectUI.connectWallet();

// 3. Создание транзакции
const transaction = {
  validUntil: Math.floor(Date.now() / 1000) + 600, // 10 минут
  messages: [
    {
      address: "EQD...", // Адрес получателя
      amount: toNano("135.5").toString(), // Сумма в nanotons
      payload: "Booking payment #12345" // Комментарий
    }
  ]
};

// 4. Отправка транзакции
const result = await tonConnectUI.sendTransaction(transaction);
```

### Поддерживаемые кошельки
- **Tonkeeper**: Самый популярный TON кошелек
- **TON Wallet**: Официальный кошелек
- **MyTonWallet**: Веб-кошелек
- **Tonhub**: Мобильный кошелек
- **OpenMask**: Браузерное расширение

## 🌐 API Endpoints

### Создание платежа

#### POST /api/payments/create
Создание платежа (универсальный endpoint)

**Запрос для TON платежа:**
```json
{
  "bookingId": "booking-uuid",
  "amount": "135.50",
  "currency": "TON",
  "method": "ton_wallet",
  "walletAddress": "EQD...",
  "comment": "Booking payment #12345"
}
```

**Запрос для Stripe платежа:**
```json
{
  "bookingId": "booking-uuid",
  "amount": 13500,
  "currency": "THB",
  "method": "stripe_card",
  "paymentMethodId": "pm_1234567890",
  "savePaymentMethod": true
}
```

**Запрос для PromptPay:**
```json
{
  "bookingId": "booking-uuid",
  "amount": 13500,
  "currency": "THB",
  "method": "promptpay",
  "phoneNumber": "+66812345678"
}
```

**Ответ:**
```json
{
  "success": true,
  "data": {
    "paymentId": "payment-uuid",
    "status": "pending",
    "amount": "135.50",
    "currency": "TON",
    "method": "ton_wallet",
    "tonPaymentUrl": "ton://transfer/EQD...?amount=135500000000&text=Booking%20payment",
    "qrCode": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
    "expiresAt": "2024-03-15T10:30:00Z"
  }
}
```

#### POST /api/payments/:id/confirm
Подтверждение платежа

**Запрос:**
```json
{
  "paymentMethodId": "pm_1234567890",
  "returnUrl": "https://app.thailand-marketplace.com/booking/confirmation"
}
```

### Управление платежами

#### GET /api/payments/:id
Получение информации о платеже

#### POST /api/payments/:id/refund
Возврат средств

**Запрос:**
```json
{
  "amount": 5000,
  "reason": "CANCELLATION",
  "note": "Guest cancelled due to emergency"
}
```

#### GET /api/payments
Получение списка платежей

**Параметры:**
```
?status=COMPLETED
&type=BOOKING
&userId=user-uuid
&dateFrom=2024-03-01
&dateTo=2024-03-31
&page=1
&limit=20
```

### Кошельки

#### GET /api/wallets/my
Получение кошелька пользователя

#### POST /api/wallets/topup
Пополнение кошелька

**Запрос:**
```json
{
  "amount": 10000,
  "currency": "THB",
  "paymentMethodId": "pm_1234567890"
}
```

#### POST /api/wallets/withdraw
Вывод средств

**Запрос:**
```json
{
  "amount": 5000,
  "currency": "THB",
  "bankAccountId": "ba_1234567890"
}
```

#### GET /api/wallets/transactions
История транзакций кошелька

### Способы платежа

#### GET /api/payment-methods
Получение способов платежа пользователя

#### POST /api/payment-methods
Добавление нового способа платежа

**Запрос:**
```json
{
  "type": "CARD",
  "token": "tok_1234567890",
  "setAsDefault": true
}
```

#### DELETE /api/payment-methods/:id
Удаление способа платежа

### Выплаты хозяевам

#### POST /api/payouts
Создание выплаты

**Запрос:**
```json
{
  "bookingId": "booking-uuid",
  "hostId": "host-uuid",
  "amount": 11000,
  "currency": "THB",
  "bankAccountId": "ba_1234567890"
}
```

#### GET /api/payouts
Получение списка выплат

## 🔒 Безопасность

### PCI DSS соответствие
- Токенизация карточных данных
- Шифрование чувствительных данных
- Безопасное хранение ключей
- Аудит всех операций

### Защита от мошенничества
```typescript
class FraudDetectionService {
  async analyzePayment(payment: Payment): Promise<FraudAnalysis> {
    const factors = {
      // Геолокация
      locationRisk: await this.checkLocationRisk(payment),
      
      // Поведение пользователя
      behaviorRisk: await this.analyzeBehavior(payment.payerId),
      
      // Карточные данные
      cardRisk: await this.checkCardRisk(payment.paymentMethodId),
      
      // Сумма платежа
      amountRisk: this.analyzeAmount(payment.amount),
      
      // Частота платежей
      frequencyRisk: await this.checkFrequency(payment.payerId)
    };
    
    const score = this.calculateRiskScore(factors);
    
    return {
      score,
      riskLevel: this.getRiskLevel(score),
      factors,
      recommendation: this.getRecommendation(score)
    };
  }
}
```

### Правила безопасности
1. **3D Secure** для карточных платежей
2. **Лимиты транзакций** по времени и сумме
3. **Мониторинг подозрительной активности**
4. **Двухфакторная аутентификация** для крупных сумм
5. **Блокировка подозрительных аккаунтов**

## 💰 Эскроу система

### Принцип работы
```typescript
class EscrowService {
  async holdFunds(payment: Payment): Promise<EscrowHold> {
    // Блокируем средства до подтверждения услуги
    const hold = await this.createHold({
      paymentId: payment.id,
      amount: payment.amount,
      releaseConditions: {
        checkIn: true,
        noDisputes: true,
        timeElapsed: '24h'
      }
    });
    
    return hold;
  }
  
  async releaseFunds(holdId: string, releaseAmount?: number) {
    const hold = await this.getHold(holdId);
    
    if (this.canRelease(hold)) {
      await this.transferToHost(hold, releaseAmount);
      await this.updateHoldStatus(holdId, 'RELEASED');
    }
  }
}
```

### Условия освобождения средств
1. **Успешное заселение** гостя
2. **Отсутствие споров** в течение 24 часов
3. **Подтверждение услуги** от гостя
4. **Автоматическое освобождение** через 7 дней

## 🔄 Фоновые задачи

### Автоматические процессы
```typescript
// Обработка отложенных выплат
const processPendingPayouts = async () => {
  const pendingPayouts = await payoutService.findPending();
  
  for (const payout of pendingPayouts) {
    if (payout.canProcess()) {
      await payoutService.process(payout.id);
    }
  }
};

// Мониторинг неудачных платежей
const retryFailedPayments = async () => {
  const failedPayments = await paymentService.findRetryable();
  
  for (const payment of failedPayments) {
    if (payment.retryCount < 3) {
      await paymentService.retry(payment.id);
    }
  }
};

// Обновление курсов валют
const updateExchangeRates = async () => {
  const rates = await exchangeRateService.fetchLatest();
  await cacheService.set('exchange_rates', rates, 3600);
};
```

## 🧪 Тестирование

### Покрытие тестами (54 теста в 4 файлах)

#### 1. **TonService.test.ts** (17 тестов)
- **TON Address Validation** (2 теста)
  - Валидация формата TON адресов
  - Проверка компонентов адреса
- **TON Amount Conversions** (3 теста)
  - Конвертация TON в nanotons
  - Конвертация nanotons в TON
  - Обработка точности сумм
- **Transaction Hash Validation** (1 тест)
  - Валидация формата хеша транзакции
- **Payment URL Generation** (2 теста)
  - Генерация TON payment URLs
  - Обработка специальных символов
- **Price Calculations** (3 теста)
  - Расчет TON из фиатных валют
  - Обработка точности цен
  - Валидация границ цен
- **Confirmation Logic** (2 теста)
  - Валидация требований подтверждения
  - Обработка таймаутов
- **Webhook Signature Verification** (2 теста)
  - Проверка подписей webhook
  - Timing-safe сравнение
- **Network Configuration** (2 теста)
  - Валидация endpoints сети
  - Валидация формата API ключей

#### 2. **StripeService.test.ts** (8 тестов)
- **Amount Conversions** (3 теста)
  - Конвертация USD в центы
  - Обработка валют без десятичных
  - Конвертация из Stripe сумм
- **Fee Calculations** (2 теста)
  - Расчет комиссий Stripe для USD
  - Комиссии для не-USD валют
- **Payment Method Validation** (1 тест)
  - Поддерживаемые методы по странам
- **Status Mapping** (1 тест)
  - Маппинг статусов Stripe
- **Configuration Validation** (1 тест)
  - Валидация поддержки валют

#### 3. **PaymentService.test.ts** (16 тестов)
- **Payment Validation** (3 теста)
  - Валидация структуры запроса
  - Валидация типов платежных методов
  - Валидация переходов статусов
- **Fee Calculations** (2 теста)
  - Расчет платформенных комиссий
  - Различные структуры комиссий
- **Currency Conversions** (3 теста)
  - Валидация кодов валют
  - Конвертация TON сумм
  - Конвертация фиат в крипто
- **Payment Timeouts** (2 теста)
  - Расчет времени истечения
  - Валидация диапазонов таймаутов
- **Search and Filtering** (2 теста)
  - Валидация параметров поиска
  - Валидация пагинации
- **Security Validations** (2 теста)
  - Валидация TON адресов
  - Валидация подписей webhook
- **Error Handling** (2 теста)
  - Структура ошибок
  - Сценарии неудачных платежей

#### 4. **PaymentAPI.test.ts** (13 тестов)
- **Payment Creation API** (2 теста)
  - Валидация структуры запроса создания
  - Требования для конкретных методов
- **Payment Processing API** (3 теста)
  - Валидация TON платежей
  - Валидация Stripe платежей
  - Валидация обновления статуса
- **Payment Search API** (2 теста)
  - Валидация параметров поиска
  - Структура ответа поиска
- **Authentication and Authorization** (2 теста)
  - Валидация JWT токенов
  - Проверка прав доступа
- **Webhook API** (2 теста)
  - Структура TON webhook
  - Верификация подписи webhook
- **Error Handling** (2 теста)
  - Структура ошибок
  - HTTP статус коды

### Тестовые данные
```typescript
// Тестовые карты Stripe
const TEST_CARDS = {
  VISA_SUCCESS: '4242424242424242',
  VISA_DECLINED: '4000000000000002',
  MASTERCARD_SUCCESS: '5555555555554444',
  AMEX_SUCCESS: '378282246310005'
};

// Тестовые сценарии
const TEST_SCENARIOS = {
  SUCCESSFUL_PAYMENT: {
    amount: 10000,
    currency: 'THB',
    card: TEST_CARDS.VISA_SUCCESS
  },
  DECLINED_PAYMENT: {
    amount: 5000,
    currency: 'THB',
    card: TEST_CARDS.VISA_DECLINED
  }
};
```

### Запуск тестов
```bash
# Все тесты
bun test

# Тесты с покрытием
bun test --coverage

# Интеграционные тесты
bun test:integration

# Тесты безопасности
bun test:security
```

## 🚀 Развертывание

### Переменные окружения
```env
# Сервер
PORT=3003
NODE_ENV=production

# База данных
DATABASE_URL=postgresql://user:password@localhost:5432/payment_service_db

# TON Blockchain
TON_NETWORK=mainnet
TON_API_KEY=your-ton-api-key
TON_WALLET_MNEMONIC=your-wallet-mnemonic-phrase
TON_WALLET_ADDRESS=EQD...
TON_JETTON_USDT_ADDRESS=EQC...
TON_JETTON_USDC_ADDRESS=EQB...

# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PUBLISHABLE_KEY=pk_live_...

# Тайские платежные системы
PROMPTPAY_MERCHANT_ID=your-promptpay-id

# Безопасность
ENCRYPTION_KEY=your-encryption-key
JWT_SECRET=your-jwt-secret
WEBHOOK_SECRET=your-webhook-secret

# Лимиты
DAILY_TRANSACTION_LIMIT=100000
MONTHLY_TRANSACTION_LIMIT=1000000
MAX_REFUND_DAYS=30
TON_MIN_AMOUNT=0.1
TON_MAX_AMOUNT=10000

# Комиссии
PLATFORM_FEE_PERCENTAGE=3.5
STRIPE_FEE_PERCENTAGE=2.9
STRIPE_FEE_FIXED=30
TON_NETWORK_FEE=0.01
JETTON_TRANSFER_FEE=0.05

# Курсы валют
EXCHANGE_RATE_API_KEY=your-exchange-api-key
COINGECKO_API_KEY=your-coingecko-key

# Мониторинг
SENTRY_DSN=your-sentry-dsn
DATADOG_API_KEY=your-datadog-key
```

## 🔄 Интеграции

### Внутренние сервисы
- **Booking Service**: Обработка платежей за бронирования
- **User Service**: Аутентификация и профили
- **CRM Service**: Уведомления о платежах
- **Agency Service**: Комиссии агентств

### Внешние сервисы

#### Blockchain интеграции
- **TON Network**: Основная блокчейн сеть
- **TON Connect**: Интеграция с кошельками
- **TON Center API**: Доступ к блокчейн данным
- **Jetton Contracts**: USDT/USDC токены на TON

#### Традиционные платежи
- **Stripe**: Международные карточные платежи

#### Тайские платежные системы
- **PromptPay API**: Национальная система QR-платежей

#### Курсы валют и аналитика
- **CoinGecko API**: Курсы криптовалют
- **Exchange Rates API**: Фиатные курсы
- **TON API**: Данные о сети TON
- **Fraud Detection APIs**: Защита от мошенничества

## 📊 Финансовая отчетность

### Метрики платежей
```typescript
interface PaymentMetrics {
  totalVolume: number;           // Общий объем
  successRate: number;           // Процент успешных платежей
  averageAmount: number;         // Средняя сумма
  refundRate: number;           // Процент возвратов
  fraudRate: number;            // Процент мошенничества
  processingTime: number;       // Среднее время обработки
}

const generateDailyReport = async (date: Date) => {
  const payments = await paymentService.getByDate(date);
  
  return {
    date,
    totalTransactions: payments.length,
    totalVolume: payments.reduce((sum, p) => sum + p.amount, 0),
    successfulPayments: payments.filter(p => p.status === 'COMPLETED').length,
    failedPayments: payments.filter(p => p.status === 'FAILED').length,
    refunds: payments.filter(p => p.type === 'REFUND').length,
    averageAmount: payments.reduce((sum, p) => sum + p.amount, 0) / payments.length
  };
};
```

### Комиссии и сборы

#### Криптовалютные платежи (TON)
- **Сетевая комиссия TON**: ~0.01 TON (~$0.01)
- **Jetton переводы**: ~0.05 TON (~$0.05)
- **Платформенная комиссия**: 2.5% (ниже чем фиат)

#### Традиционные платежи
- **Платформенная комиссия**: 3.5% с каждого бронирования
- **Stripe комиссия**: 2.9% + 30 центов
- **Комиссия за валютное конвертирование**: 1.5%

#### Тайские платежи
- **PromptPay**: 0.5% (минимум 1 THB)

#### Комиссии за вывод средств
- **Фиат**: 50 THB
- **Криптовалюта**: 0.1 TON

## 📈 Производительность

### Оптимизации
- Кеширование курсов валют
- Асинхронная обработка webhook'ов
- Пакетная обработка выплат
- Индексы базы данных для быстрого поиска

### Масштабирование
- Горизонтальное масштабирование
- Шардинг по регионам
- Очереди для обработки платежей
- CDN для статических ресурсов

## 📊 Мониторинг

### Алерты
- Высокий процент неудачных платежей
- Подозрительная активность
- Превышение лимитов транзакций
- Проблемы с платежными провайдерами
- Задержки в обработке

### Дашборды
- **Объем платежей в реальном времени** (TON vs Fiat)
- **Конверсия платежей** по методам
- **Географическое распределение** пользователей
- **Анализ способов платежа** (популярность в Таиланде)
- **Мониторинг блокчейн транзакций**
- **Курсы криптовалют** и волатильность
- **Мониторинг мошенничества**

## 🌏 Локализация для Таиланда

### Особенности тайского рынка
1. **PromptPay доминирование**: 90% населения использует QR-платежи
2. **Криптовалютная активность**: Высокое принятие TON и стейблкоинов
3. **Мобильные платежи**: 95% транзакций с мобильных устройств
4. **LINE Pay интеграция**: Популярность среди молодежи
5. **Банковские ограничения**: Сложности с международными переводами

### Преимущества TON для Таиланда
- **Обход банковских ограничений**: Прямые международные переводы
- **Низкие комиссии**: Особенно важно для небольших сумм
- **Быстрые переводы**: Мгновенные международные платежи
- **Стейблкоины**: Защита от волатильности THB
- **Доступность**: Работает 24/7 без банковских выходных

---

**Контакты для поддержки:**
- 📧 Email: payment-service@thailand-marketplace.com
- 📱 Slack: #payment-service-support
- 🚨 Emergency: payment-emergency@thailand-marketplace.com
- 📋 Issues: [GitHub Issues](https://github.com/chatman-media/farang-marketplace/issues?label=payment-service)
- 🔗 TON Support: [TON Community](https://t.me/toncoin)
- 📖 Документация: [Thailand Marketplace Payment Docs](https://docs.thailand-marketplace.com/services/payment-service)