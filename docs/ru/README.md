# Документация Thailand Marketplace (Русский)

Добро пожаловать в документацию платформы Thailand Marketplace на русском языке.

## 📚 Доступные разделы

### 🔐 Аутентификация

- [README.md](auth/README.md) - Обзор системы аутентификации
- [oauth-api.md](auth/oauth-api.md) - Документация OAuth API
- [oauth-setup-guide.md](auth/oauth-setup-guide.md) - Руководство по настройке
  OAuth провайдеров

### 🛠️ Разработка

- [development.md](development.md) - Руководство по разработке и настройке
  окружения

## 🌐 Другие языки

- [English](../en/README.md) - English documentation
- [中文](../cn/README.md) - 中文文档

## 🚀 Быстрый старт

### Система аутентификации

Наша платформа поддерживает множественные способы входа:

- ✅ **Email/Password** - традиционная регистрация
- ✅ **Google OAuth 2.0** - вход через Google аккаунт
- ✅ **Apple Sign In** - вход через Apple ID
- ✅ **TikTok Login Kit** - вход через TikTok
- ✅ **Telegram Login Widget** - вход через Telegram
- ✅ **LINE Login** - вход через LINE (популярен в Таиланде)
- ✅ **WhatsApp Business API** - вход через WhatsApp

### Начало работы

1. **Клонируйте репозиторий**

   ```bash
   git clone https://github.com/chatman-media/farang-marketplace.git
   cd thailand-marketplace
   ```

2. **Установите зависимости**

   ```bash
   bun install
   ```

3. **Настройте базу данных и Redis**

   **Вариант 1: Локальная разработка с Docker**
   ```bash
   # Запустите PostgreSQL и Redis через Docker
   docker-compose up -d postgres redis
   ```

   **Вариант 2: Облачная БД (для тестирования/production)**
   - PostgreSQL: Neon, Supabase, AWS RDS
   - Redis: Redis Cloud, AWS ElastiCache

   **Вариант 3: Локальный Redis без Docker** (для macOS)
   ```bash
   brew install redis
   brew services start redis
   ```

   **Примечание**: Интеграционные тесты используют Neon PostgreSQL для совместимости с CI/CD.

4. **Настройте переменные окружения для всех сервисов**

   ```bash
   # Скопируйте примеры конфигураций
   cp services/user-service/.env.example services/user-service/.env
   cp services/listing-service/.env.example services/listing-service/.env
   cp services/booking-service/.env.example services/booking-service/.env
   cp services/payment-service/.env.example services/payment-service/.env
   cp services/crm-service/.env.example services/crm-service/.env
   cp services/api-gateway/.env.example services/api-gateway/.env

   # Отредактируйте .env файлы с вашими настройками
   ```

5. **Выполните миграции базы данных**

   ```bash
   # Для каждого сервиса с базой данных
   cd services/user-service && bun run db:migrate
   cd ../listing-service && bun run db:migrate
   cd ../booking-service && bun run db:migrate
   cd ../payment-service && bun run db:migrate
   cd ../crm-service && bun run db:migrate
   ```

6. **Запустите все сервисы**

   ```bash
   # Из корневой директории
   bun run dev
   ```

7. **Проверьте работу сервисов**

   ```bash
   # Запустите тесты
   bun run test

   # Проверьте типы
   bun run type-check
   ```

## 🌐 API Endpoints и порты сервисов

### **Порты сервисов в development режиме:**

- **API Gateway**: `http://localhost:3000`
- **User Service**: `http://localhost:3001`
- **Listing Service**: `http://localhost:3003`
- **Booking Service**: `http://localhost:3004`
- **CRM Service**: `http://localhost:3007`
- **Payment Service**: `http://localhost:3009`

### **Веб приложения:**

- **Web App**: `http://localhost:5173`
- **Admin Panel**: `http://localhost:5174`

### **Основные API endpoints:**

- **Authentication**: `POST /api/auth/login`, `POST /api/auth/register`
- **Users**: `GET /api/users/profile`, `PUT /api/users/profile`
- **Listings**: `GET /api/listings`, `POST /api/listings`,
  `GET /api/listings/search`
- **Bookings**: `POST /api/bookings`, `GET /api/bookings`,
  `PUT /api/bookings/:id/status`
- **Payments**: `POST /api/payments/initiate`, `POST /api/payments/webhook`,
  `POST /api/payments/ton`
- **CRM**: `POST /api/crm/campaigns`, `GET /api/crm/leads`,
  `POST /api/crm/telegram`, `POST /api/crm/whatsapp`

## 📖 Структура документации

```
docs/ru/
├── README.md                    # Этот файл
├── development.md               # Руководство по разработке
└── auth/                        # Документация аутентификации
    ├── README.md               # Обзор системы аутентификации
    ├── oauth-api.md            # OAuth API документация
    └── oauth-setup-guide.md    # Руководство по настройке
```

## 🧪 Тестирование

### **Статистика тестов:**

- **Общее количество**: 235 тестов
- **CRM Service**: 229/235 тестов ✅ (97.4% успешности)
  - Все сервисы: 100% при раздельном запуске
  - LineService, CommunicationService, EmailService
  - SegmentationService, TemplateService, AutomationService
  - Используют Neon PostgreSQL для интеграционных тестов
- **User Service**: 137 тестов (аутентификация, профили, роли)
- **Listing Service**: 51 тест (CRUD, поиск, фильтрация)
- **Booking Service**: 91 тест (бронирование, доступность, статусы)
- **Payment Service**: 45 тестов (платежи TON/Stripe, webhook, возвраты)

### **Запуск тестов:**

```bash
# Все тесты
bun run test

# Тесты конкретного сервиса
cd services/user-service && bun run test
cd services/listing-service && bun run test

# Тесты с покрытием
bun run test:coverage

# Интеграционные тесты
bun run test:integration
```

## 🏗️ Архитектура микросервисов

### 📦 **Реализованные сервисы:**

#### 🚪 **API Gateway**

- Централизованная точка входа для всех API
- Маршрутизация запросов к сервисам
- Rate limiting и безопасность
- Логирование запросов через Pino
- CORS и middleware управление

#### 👤 **User Service**

- Регистрация и аутентификация пользователей
- Управление профилями и загрузка изображений
- Система ролей и верификации
- JWT токены и refresh механизм
- Поддержка множественных OAuth провайдеров

#### 📋 **Listing Service**

- Управление объявлениями товаров и услуг
- Поиск с фильтрацией по категориям, цене, локации
- Категоризация и теги
- Геолокация и фильтрация
- Оптимизация изображений (WebP)

#### 📅 **Booking Service**

- Система бронирования с проверкой доступности
- Управление жизненным циклом бронирований
- Расчет цен и комиссий
- Интеграция с платежной системой
- Уведомления и статусы

#### 💳 **Payment Service**

- Интеграция с TON blockchain
- Поддержка Stripe для карт
- Поддержка PromptPay для Таиланда
- Обработка возвратов и споров
- Webhook обработка

#### 📞 **CRM Service**

- Многоканальные коммуникации (Email, Telegram, WhatsApp, LINE)
- Управление лидами и клиентами
- Автоматизированные кампании
- Аналитика взаимодействий
- Система оценки лидов

#### 📱 **Telegram Bot & Mini App**

- Уведомления о новых листингах
- Подтверждения бронирований
- Обновления статуса платежей
- Telegram Mini App для полноценного маркетплейса
- Интеграция с TON для платежей

## 🛠️ Технологии

### **Backend:**

- **Runtime**: Node.js 20+, TypeScript
- **Framework**: Fastify
- **Database**: PostgreSQL с Drizzle ORM
- **Cache**: Redis
- **Authentication**: JWT, OAuth 2.0
- **Testing**: Vitest (300+ тестов)
- **Package Manager**: Bun
- **Logging**: Pino
- **Monorepo**: Turborepo
- **Linting**: Biome

### **Blockchain & Payments:**

- **Blockchain**: TON (The Open Network)
- **Traditional Payments**: Stripe, PromptPay
- **Multi-currency**: USD, THB

### **Communication:**

- **Email**: Nodemailer
- **Messaging**: Telegram Bot API, WhatsApp Business API, LINE API
- **Notifications**: Email, Telegram, WhatsApp уведомления

## 📚 Документация сервисов и пакетов

### 🔧 **Сервисы:**

- 🚪 [API Gateway](../../services/api-gateway/README.md) - Централизованный API
  шлюз
- 👤 [User Service](../../services/user-service/README.md) - Аутентификация и
  управление пользователями
- 🏠 [Listing Service](../../services/listing-service/README.md) - Управление
  объявлениями
- 📅 [Booking Service](../../services/booking-service/README.md) - Система
  бронирования и транзакций
- 💳 [Payment Service](../../services/payment-service/README.md) - Интеграция
  платежей (TON, Stripe, PromptPay)
- 📞 [CRM Service](../../services/crm-service/README.md) - Многоканальные
  коммуникации

### 📦 **Пакеты:**

- 🌐 [Shared Types](../../packages/shared-types/README.md) - Общие типы
  TypeScript
- 🗄️ [Database Schema](../../packages/database-schema/README.md) - Drizzle ORM
  схемы
- 📝 [Logger](../../packages/logger/README.md) - Pino логирование
- 🗣️ [i18n Package](../../packages/i18n/README.md) - Интернационализация и
  локализация

### 📱 **Приложения:**

- 🌐 [Web App](../../apps/web/) - Основное веб-приложение
- ⚙️ [Admin Panel](../../apps/admin/) - Административная панель
- 💎 [TON App](../../apps/ton-app/) - TON blockchain интеграция

## 📞 Поддержка

Для получения помощи:

- 📧 Email: dev-team@thailand-marketplace.com
- 💬 Slack: #support
- 🐛 Issues:
  [GitHub Issues](https://github.com/chatman-media/farang-marketplace/issues)

## 📄 Лицензия

Этот проект лицензирован под MIT License - см. файл [LICENSE](../../LICENSE) для
деталей.

## 🤝 Вклад в проект

Мы приветствуем вклад в развитие проекта! Пожалуйста, прочитайте
[CONTRIBUTING.md](../../CONTRIBUTING.md) для получения информации о том, как
внести свой вклад.

## 📈 Статус проекта

### 🎯 **Текущий статус: 300+ тестов пройдено | 6 сервисов готово | В разработке**

#### ✅ **Полностью реализованные сервисы:**

- ✅ **API Gateway**: Централизованная маршрутизация с Fastify
- ✅ **User Service**: Аутентификация, управление пользователями, профили (137
  тестов)
- ✅ **Listing Service**: Управление объявлениями и поиск (51 тест)
- ✅ **Booking Service**: Система бронирования и транзакций (91 тест)
- ✅ **Payment Service**: Интеграция платежей TON/Stripe/PromptPay (45 тестов)
- ✅ **CRM Service**: Многоканальные коммуникации (в разработке)

#### 🔄 **В разработке:**

- 🔄 **Web Application**: React фронтенд на Vite
- 🔄 **Admin Panel**: Административная панель
- 🔄 **Telegram Bot**: Уведомления и интеграция
- 🔄 **Telegram Mini App**: Полноценный маркетплейс в Telegram

#### 📦 **Инфраструктура:**

- ✅ Централизованное логирование (Pino)
- ✅ Общие типы и схемы (shared-types, database-schema)
- ✅ Интернационализация (i18n)
- ✅ Turborepo для монорепо

---

_Последнее обновление: Ноябрь 2025_
