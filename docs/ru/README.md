# Документация Thailand Marketplace (Русский)

Добро пожаловать в документацию платформы Thailand Marketplace на русском языке.

## 📚 Доступные разделы

### 🔐 Аутентификация
- [README.md](auth/README.md) - Обзор системы аутентификации
- [oauth-api.md](auth/oauth-api.md) - Документация OAuth API
- [oauth-setup-guide.md](auth/oauth-setup-guide.md) - Руководство по настройке OAuth провайдеров

### 🛠️ Разработка
- [development.md](development.md) - Руководство по разработке и настройке окружения

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

3. **Настройте Docker окружение**
   ```bash
   # Запустите PostgreSQL и Redis
   docker-compose up -d postgres redis
   ```

4. **Настройте переменные окружения для всех сервисов**
   ```bash
   # Скопируйте примеры конфигураций
   cp services/user-service/.env.example services/user-service/.env
   cp services/listing-service/.env.example services/listing-service/.env
   cp services/booking-service/.env.example services/booking-service/.env
   cp services/payment-service/.env.example services/payment-service/.env
   cp services/agency-service/.env.example services/agency-service/.env
   cp services/ai-service/.env.example services/ai-service/.env
   cp services/voice-service/.env.example services/voice-service/.env
   
   # Отредактируйте .env файлы с вашими настройками
   ```

5. **Выполните миграции базы данных**
   ```bash
   # Для каждого сервиса с базой данных
   cd services/user-service && bun run db:migrate
   cd ../listing-service && bun run db:migrate
   cd ../booking-service && bun run db:migrate
   cd ../payment-service && bun run db:migrate
   cd ../agency-service && bun run db:migrate
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
- **User Service**: `http://localhost:3001`
- **Listing Service**: `http://localhost:3002`
- **Booking Service**: `http://localhost:3003`
- **Payment Service**: `http://localhost:3004`
- **Agency Service**: `http://localhost:3005`
- **AI Service**: `http://localhost:3006`
- **Voice Service**: `http://localhost:3007`
- **CRM Service**: `http://localhost:3008`

### **Основные API endpoints:**
- **Authentication**: `POST /api/auth/login`, `POST /api/auth/register`
- **Users**: `GET /api/users/profile`, `PUT /api/users/profile`
- **Listings**: `GET /api/listings`, `POST /api/listings`, `GET /api/listings/search`
- **Bookings**: `POST /api/bookings`, `GET /api/bookings`, `PUT /api/bookings/:id/status`
- **Payments**: `POST /api/payments/initiate`, `POST /api/payments/webhook`
- **Agencies**: `GET /api/agencies`, `POST /api/agencies/register`
- **AI**: `POST /api/ai/recommendations`, `POST /api/ai/search`
- **Voice**: `POST /api/voice/speech-to-text`, `POST /api/voice/commands`
- **CRM**: `POST /api/crm/campaigns`, `GET /api/crm/leads`

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
- **Общее количество**: 516+ тестов
- **User Service**: 137 тестов (аутентификация, профили, роли)
- **Listing Service**: 51 тест (CRUD, поиск, ИИ-интеграция)
- **Booking Service**: 91 тест (бронирование, доступность, статусы)
- **Payment Service**: 45 тестов (платежи, webhook, возвраты)
- **Agency Service**: 50 тестов (регистрация, назначения, комиссии)
- **AI Service**: 75 тестов (рекомендации, анализ, провайдеры)
- **Voice Service**: 112 тестов (распознавание речи, команды)
- **CRM Service**: В разработке

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

#### 👤 **User Service**
- Регистрация и аутентификация пользователей
- Управление профилями и загрузка изображений
- Система ролей и верификации
- JWT токены и refresh механизм
- Поддержка множественных OAuth провайдеров

#### 📋 **Listing Service**
- Управление объявлениями товаров и услуг
- ИИ-поиск с умными рекомендациями
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
- Поддержка множественных валют (TON, USDT, USDC, USD, THB)
- Обработка возвратов и споров
- Webhook обработка
- Интеграция с традиционными платежными системами

#### 🏢 **Agency Service**
- Регистрация и верификация агентств
- Управление услугами агентств
- Система назначений и комиссий
- Алгоритм умного подбора агентств
- Аналитика и отчетность

#### 🤖 **AI Service**
- Мультипровайдерная ИИ поддержка (OpenAI, DeepSeek, Claude)
- Система рекомендаций на основе машинного обучения
- Анализ поведения пользователей
- Автоматическая категоризация контента
- Обнаружение мошенничества

#### 🎤 **Voice Service**
- Голосовой поиск с преобразованием речи в текст
- Многоязычная поддержка (английский, тайский, русский, китайский)
- Голосовые команды для навигации
- Интеграция с множественными провайдерами (Google, Azure, AWS)
- Обработка естественного языка

#### 📞 **CRM Service**
- Многоканальные коммуникации (Email, Telegram, WhatsApp, LINE)
- Управление лидами и клиентами
- Автоматизированные кампании
- Аналитика взаимодействий
- Система оценки лидов

## 🛠️ Технологии

### **Backend:**
- **Runtime**: Node.js, TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL с Drizzle ORM
- **Cache**: Redis
- **Authentication**: JWT, OAuth 2.0
- **Testing**: Vitest (516+ тестов)
- **Package Manager**: Bun
- **Containerization**: Docker

### **AI & ML:**
- **AI Providers**: OpenAI, DeepSeek, Claude
- **Speech Recognition**: Google Speech-to-Text, Azure, AWS
- **Natural Language Processing**: Собственные алгоритмы
- **Machine Learning**: Система рекомендаций

### **Blockchain & Payments:**
- **Blockchain**: TON (The Open Network)
- **Cryptocurrencies**: TON, USDT, USDC
- **Traditional Payments**: Stripe, Wise, Revolut, PromptPay
- **Multi-currency**: USD, THB, EUR, RUB

### **Communication:**
- **Email**: SMTP интеграция
- **Messaging**: Telegram Bot API, WhatsApp Business API, LINE API
- **Real-time**: WebSocket соединения
- **Notifications**: Push уведомления

## 📚 Документация сервисов и пакетов

### 🔧 **Сервисы:**
- 👤 [User Service](../../services/user-service/README.md) - Аутентификация и управление пользователями
- 🏠 [Listing Service](../../services/listing-service/README.md) - Управление объявлениями с ИИ-поиском
- 📅 [Booking Service](../../services/booking-service/README.md) - Система бронирования и транзакций
- 💳 [Payment Service](../../services/payment-service/README.md) - Интеграция платежей с TON blockchain
- 🏢 [Agency Service](../../services/agency-service/README.md) - Система управления агентствами
- 🤖 [AI Service](../../services/ai-service/README.md) - ИИ-рекомендации и анализ
- 🎤 [Voice Service](../../services/voice-service/README.md) - Голосовые функции и распознавание речи
- 📞 [CRM Service](../../services/crm-service/README.md) - Многоканальные коммуникации

### 📦 **Пакеты:**
- 🌐 [Shared Types](../../packages/shared-types/README.md) - Общие типы TypeScript
- 🗣️ [i18n Package](../../packages/i18n/README.md) - Интернационализация и локализация

### 📱 **Приложения:**
- 🌐 [Web App](../../apps/web/) - Основное веб-приложение
- ⚙️ [Admin Panel](../../apps/admin/) - Административная панель
- 💎 [TON App](../../apps/ton-app/) - TON blockchain интеграция

## 📞 Поддержка

Для получения помощи:
- 📧 Email: dev-team@thailand-marketplace.com
- 💬 Slack: #support
- 🐛 Issues: [GitHub Issues](https://github.com/chatman-media/farang-marketplace/issues)

## 📄 Лицензия

Этот проект лицензирован под MIT License - см. файл [LICENSE](../../LICENSE) для деталей.

## 🤝 Вклад в проект

Мы приветствуем вклад в развитие проекта! Пожалуйста, прочитайте [CONTRIBUTING.md](../../CONTRIBUTING.md) для получения информации о том, как внести свой вклад.

## 📈 Статус проекта

### 🎯 **Текущий статус: 434+ тестов пройдено | 8 сервисов готово | Готово к продакшену**

#### ✅ **Полностью реализованные сервисы:**
- ✅ **User Service**: Аутентификация, управление пользователями, профили (8 тестов)
- ✅ **Listing Service**: Управление объявлениями с ИИ-поиском (4 теста)
- ✅ **Booking Service**: Система бронирования и транзакций (4 теста)
- ✅ **Payment Service**: Интеграция платежей с TON blockchain (4 теста)
- ✅ **Agency Service**: Система управления агентствами (3 теста)
- ✅ **AI Service**: ИИ-рекомендации и анализ (5 тестов)
- ✅ **Voice Service**: Голосовые функции и распознавание речи (2 теста)
- ✅ **CRM Service**: Многоканальные коммуникации (6 тестов)

#### 🔄 **В разработке:**
- 🔄 **API Gateway**: Централизованная маршрутизация
- 🔄 **Web Application**: React фронтенд
- 🔄 **Admin Panel**: Административная панель
- 🔄 **Mobile App**: React Native приложение
- 🔄 **Telegram Bot**: Интеграция с Telegram

---

*Последнее обновление: Январь 2024*
