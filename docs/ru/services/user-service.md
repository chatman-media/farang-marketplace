# 👤 User Service

## 📋 Обзор

User Service - это основной сервис аутентификации и управления пользователями в платформе Thailand Marketplace. Он обеспечивает безопасную регистрацию, аутентификацию и управление профилями пользователей с поддержкой множественных провайдеров OAuth, включая популярные в Таиланде платформы.

## 🔧 Технические характеристики

- **Порт разработки**: 3001
- **База данных**: PostgreSQL (user_service_db)
- **ORM**: Native PostgreSQL с TypeScript
- **Аутентификация**: JWT + OAuth 2.0
- **Тестирование**: Vitest (137 тестов в 8 файлах)
- **Покрытие тестами**: 95%+

## 🏗️ Архитектура

### Структура проекта
```
services/user-service/
├── src/
│   ├── controllers/     # Контроллеры API
│   ├── middleware/      # Промежуточное ПО
│   ├── models/         # Модели данных
│   ├── routes/         # Маршруты API
│   ├── services/       # Бизнес-логика
│   ├── repositories/   # Слой доступа к данным
│   ├── database/       # Конфигурация БД и миграции
│   └── tests/          # Тесты
│       ├── unit/       # Юнит-тесты
│       ├── integration/ # Интеграционные тесты
│       ├── models/     # Тесты моделей
│       ├── repositories/ # Тесты репозиториев
│       └── fixtures/   # Тестовые данные
├── uploads/            # Загруженные файлы
│   └── profiles/       # Аватары пользователей
└── package.json
```

### Модель данных

#### User (Пользователь)
```typescript
interface User {
  id: string;                    // UUID
  email: string;                 // Уникальный email
  phone?: string;                // Номер телефона
  telegramId?: string;           // Telegram ID для интеграции
  role: UserRole;                // USER, AGENCY, MANAGER, ADMIN
  profile: UserProfile;          // Профиль пользователя
  socialProfiles: SocialProfile[]; // Связанные социальные аккаунты
  primaryAuthProvider: AuthProvider; // EMAIL, GOOGLE, APPLE, TIKTOK, TELEGRAM, LINE, WHATSAPP
  isActive: boolean;             // Статус активности аккаунта
  createdAt: Date;
  updatedAt: Date;
}

interface UserProfile {
  firstName: string;
  lastName: string;
  avatar?: string;               // URL аватара
  location?: Location;           // Геолокация
  rating: number;                // Рейтинг пользователя (0-5)
  reviewsCount: number;          // Количество отзывов
  verificationStatus: VerificationStatus; // UNVERIFIED, PENDING, VERIFIED, REJECTED
  socialProfiles: SocialProfile[];
}
```

#### SocialProfile (Социальный профиль)
```typescript
interface SocialProfile {
  provider: AuthProvider;        // GOOGLE, APPLE, TIKTOK, TELEGRAM, LINE, WHATSAPP
  providerId: string;           // ID в социальной сети
  email?: string;               // Email из социального аккаунта
  name?: string;                // Имя из социального аккаунта
  avatar?: string;              // Аватар из социального аккаунта
  username?: string;            // Username (для Telegram, TikTok)
}

enum AuthProvider {
  EMAIL = "email",
  GOOGLE = "google",
  APPLE = "apple",
  TIKTOK = "tiktok",
  TELEGRAM = "telegram",
  LINE = "line",
  WHATSAPP = "whatsapp",
}

enum UserRole {
  USER = "user",
  AGENCY = "agency",
  MANAGER = "manager",
  ADMIN = "admin",
}

enum VerificationStatus {
  UNVERIFIED = "unverified",
  PENDING = "pending",
  VERIFIED = "verified",
  REJECTED = "rejected",
}
```

## 🔐 Аутентификация и авторизация

### Поддерживаемые методы аутентификации

1. **Email/Password**
   - Регистрация с подтверждением email
   - Вход по email и паролю
   - Восстановление пароля

2. **Google OAuth 2.0**
   - Вход через Google аккаунт
   - Автоматическое создание профиля
   - Синхронизация данных профиля

3. **Apple OAuth 2.0**
   - Вход через Apple ID
   - Поддержка Sign in with Apple
   - Приватность и безопасность iOS

4. **TikTok OAuth 2.0**
   - Популярная социальная сеть в Таиланде
   - Интеграция с TikTok профилями
   - Молодежная аудитория

5. **Telegram Login Widget**
   - Популярный мессенджер в Таиланде
   - Быстрая аутентификация через бота
   - Интеграция с Telegram ID

6. **LINE OAuth 2.0**
   - Самый популярный мессенджер в Таиланде
   - Локализация для тайского рынка
   - Широкое распространение среди местных пользователей

7. **WhatsApp Business API**
   - Интеграция с WhatsApp Business
   - Поддержка бизнес-аккаунтов
   - Международная аудитория

### JWT Токены

- **Access Token**: Время жизни 15 минут
- **Refresh Token**: Время жизни 7 дней
- **Email Verification Token**: Время жизни 24 часа
- **Password Reset Token**: Время жизни 1 час

## 🌐 API Endpoints

### Аутентификация

#### POST /api/auth/register
Регистрация нового пользователя

**Запрос:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+66123456789"
}
```

**Ответ:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "isEmailVerified": false
    }
  }
}
```

#### POST /api/auth/login
Вход в систему

**Запрос:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Ответ:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "USER"
    },
    "tokens": {
      "accessToken": "jwt_access_token",
      "refreshToken": "jwt_refresh_token"
    }
  }
}
```

#### POST /api/auth/refresh
Обновление токенов

**Запрос:**
```json
{
  "refreshToken": "jwt_refresh_token"
}
```

#### POST /api/auth/logout
Выход из системы

#### GET /api/auth/verify-email/:token
Подтверждение email адреса

### OAuth Endpoints

#### GET /api/oauth/providers
Получение списка доступных OAuth провайдеров

**Ответ:**
```json
{
  "providers": [
    {
      "name": "google",
      "displayName": "Google",
      "available": true
    },
    {
      "name": "apple",
      "displayName": "Apple",
      "available": true
    },
    {
      "name": "tiktok",
      "displayName": "TikTok",
      "available": true
    },
    {
      "name": "telegram",
      "displayName": "Telegram",
      "available": true
    },
    {
      "name": "line",
      "displayName": "LINE",
      "available": true
    },
    {
      "name": "whatsapp",
      "displayName": "WhatsApp",
      "available": false
    }
  ]
}
```

#### GET /api/oauth/:provider
Инициирование OAuth потока для указанного провайдера

**Ответ:**
```json
{
  "authUrl": "https://accounts.google.com/oauth/authorize?...",
  "state": "random_state_string"
}
```

#### POST /api/oauth/:provider/callback
Обработка OAuth callback от провайдера

**Запрос:**
```json
{
  "code": "authorization_code",
  "state": "state_string",
  "telegramData": {
    "id": 123456789,
    "first_name": "John",
    "username": "johndoe",
    "auth_date": 1640995200,
    "hash": "telegram_hash"
  }
}
```

### Управление профилем

#### GET /api/users/profile
Получение профиля текущего пользователя

#### PUT /api/users/profile
Обновление профиля

**Запрос:**
```json
{
  "firstName": "John",
  "lastName": "Smith",
  "phone": "+66987654321",
  "preferences": {
    "language": "th",
    "currency": "THB",
    "notifications": {
      "email": true,
      "push": true,
      "sms": false
    }
  }
}
```

#### POST /api/users/upload-avatar
Загрузка аватара пользователя

#### DELETE /api/users/avatar
Удаление аватара

#### POST /api/users/change-password
Изменение пароля

#### POST /api/users/forgot-password
Запрос на восстановление пароля

#### POST /api/users/reset-password
Сброс пароля по токену

#### POST /api/profile/verification/request
Запрос на верификацию профиля

**Запрос:**
```json
{
  "documents": [
    {
      "type": "passport",
      "url": "https://storage.example.com/doc1.jpg"
    },
    {
      "type": "address_proof",
      "url": "https://storage.example.com/doc2.jpg"
    }
  ],
  "notes": "Additional verification information"
}
```

#### POST /api/profile/verification/:userId/approve
Одобрение верификации (только для админов)

#### POST /api/profile/verification/:userId/reject
Отклонение верификации (только для админов)

### Социальные аккаунты

#### POST /api/oauth/link-social
Привязка социального аккаунта к существующему пользователю

#### DELETE /api/oauth/unlink-social
Отвязка социального аккаунта

#### GET /api/oauth/social-accounts
Получение списка привязанных социальных аккаунтов

**Ответ:**
```json
{
  "socialProfiles": [
    {
      "provider": "google",
      "providerId": "123456789",
      "email": "user@gmail.com",
      "name": "John Doe"
    },
    {
      "provider": "telegram",
      "providerId": "987654321",
      "username": "johndoe"
    }
  ],
  "primaryProvider": "email"
}
```

### Административные функции

#### GET /api/admin/users
Получение списка пользователей (только для админов)

#### PUT /api/admin/users/:id/status
Изменение статуса пользователя

#### PUT /api/admin/users/:id/role
Изменение роли пользователя

## 🔒 Безопасность

### Хеширование паролей
- Использование bcrypt с salt rounds = 12
- Минимальная длина пароля: 8 символов
- Требования к сложности пароля

### Защита от атак
- Rate limiting для API endpoints
- CORS настройки
- Helmet.js для безопасности заголовков
- Валидация и санитизация входных данных
- SQL injection защита через ORM

### Шифрование данных
- OAuth токены шифруются перед сохранением
- Персональные данные защищены
- HTTPS обязателен в продакшене

## 📊 Мониторинг и логирование

### Метрики
- Количество регистраций
- Успешные/неуспешные входы
- Использование OAuth провайдеров
- Время ответа API

### Логирование
- Все операции аутентификации
- Изменения профиля
- Ошибки и исключения
- Подозрительная активность

## 🧪 Тестирование

### Покрытие тестами (137 тестов в 8 файлах)

#### Unit Tests (Юнит-тесты)
1. **AuthService.simple.test.ts** (12 тестов)
   - Извлечение токенов из заголовков
   - Валидация ролей пользователей
   - Конфигурация окружения

2. **AuthService.jwt.test.ts** (13 тестов)
   - Генерация и валидация JWT токенов
   - Обновление токенов
   - Безопасность токенов

3. **AuthController.simple.test.ts** (14 тестов)
   - Контроллеры входа и регистрации
   - Валидация токенов
   - Обработка ошибок

#### Integration Tests (Интеграционные тесты)
4. **UserService.test.ts** (31 тест)
   - Создание и управление пользователями
   - Управление паролями
   - Статистика и аналитика

5. **ProfileController.test.ts** (26 тестов)
   - Управление профилями
   - Загрузка аватаров
   - Система верификации
   - Административные функции

#### Model Tests (Тесты моделей)
6. **User.test.ts** (36 тестов)
   - Модель пользователя
   - Валидация данных
   - Бизнес-логика
   - Управление ролями

#### Service Tests (Тесты сервисов)
7. **OAuthService.test.ts** (14 тестов)
   - OAuth провайдеры
   - Google OAuth интеграция
   - Telegram Login Widget

#### Repository Tests (Тесты репозиториев)
8. **UserRepository.test.ts** (пропущены)
   - Слой доступа к данным

### Запуск тестов
```bash
# Все тесты
bun run test

# Тесты с подробным выводом
bun run test --reporter=verbose

# Тесты в watch режиме
bun run test:watch

# Проверка типов
bun run type-check

# Конкретный тестовый файл
bun run test src/tests/unit/AuthService.simple.test.ts

# Интеграционные тесты
bun run test src/tests/integration/

# Юнит-тесты
bun run test src/tests/unit/
```

### Структура тестов
```
src/tests/
├── unit/                    # Юнит-тесты (39 тестов)
│   ├── AuthService.simple.test.ts
│   ├── AuthService.jwt.test.ts
│   └── AuthController.simple.test.ts
├── integration/             # Интеграционные тесты (57 тестов)
│   ├── UserService.test.ts
│   └── ProfileController.test.ts
├── models/                  # Тесты моделей (36 тестов)
│   └── User.test.ts
├── repositories/            # Тесты репозиториев
│   └── UserRepository.test.ts
├── fixtures/                # Тестовые данные
│   └── database.ts
└── setup.ts                 # Настройка тестов
```

## 🚀 Развертывание

### Переменные окружения
```env
# Сервер
PORT=3001
NODE_ENV=production

# База данных
DATABASE_URL=postgresql://user:password@localhost:5432/user_service_db

# JWT
JWT_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret

# OAuth - Google
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# OAuth - Apple
APPLE_CLIENT_ID=your-apple-client-id
APPLE_TEAM_ID=your-apple-team-id
APPLE_KEY_ID=your-apple-key-id
APPLE_PRIVATE_KEY_PATH=/path/to/apple-private-key.p8

# OAuth - TikTok
TIKTOK_CLIENT_KEY=your-tiktok-client-key
TIKTOK_CLIENT_SECRET=your-tiktok-client-secret

# OAuth - Telegram
TELEGRAM_BOT_TOKEN=your-telegram-bot-token
TELEGRAM_BOT_USERNAME=your-bot-username

# OAuth - LINE
LINE_CHANNEL_ID=your-line-channel-id
LINE_CHANNEL_SECRET=your-line-channel-secret

# OAuth - WhatsApp Business
WHATSAPP_APP_ID=your-whatsapp-app-id
WHATSAPP_APP_SECRET=your-whatsapp-app-secret
WHATSAPP_PHONE_NUMBER_ID=your-phone-number-id

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Redis
REDIS_URL=redis://localhost:6379

# File Upload
UPLOAD_MAX_SIZE=5242880  # 5MB
UPLOAD_ALLOWED_TYPES=image/jpeg,image/png,image/webp
```

### OAuth Провайдеры - Настройка

#### Google OAuth 2.0
1. Создайте проект в [Google Cloud Console](https://console.cloud.google.com/)
2. Включите Google+ API
3. Создайте OAuth 2.0 credentials
4. Добавьте redirect URI: `https://yourdomain.com/api/oauth/google/callback`

#### Apple Sign In
1. Зарегистрируйтесь в [Apple Developer Program](https://developer.apple.com/)
2. Создайте App ID с Sign in with Apple capability
3. Создайте Service ID для веб-аутентификации
4. Сгенерируйте private key (.p8 файл)

#### TikTok for Developers
1. Подайте заявку на [TikTok for Developers](https://developers.tiktok.com/)
2. Создайте приложение
3. Получите Client Key и Client Secret
4. Настройте redirect URI

#### Telegram Login Widget
1. Создайте бота через [@BotFather](https://t.me/botfather)
2. Получите bot token
3. Настройте domain для Login Widget
4. Добавьте webhook URL (опционально)

#### LINE Developers
1. Создайте аккаунт на [LINE Developers](https://developers.line.biz/)
2. Создайте Provider и Channel
3. Получите Channel ID и Channel Secret
4. Настройте Callback URL

#### WhatsApp Business API
1. Подайте заявку на [WhatsApp Business API](https://business.whatsapp.com/api)
2. Получите App ID и App Secret
3. Настройте Phone Number ID
4. Верифицируйте бизнес-аккаунт

### Docker
```dockerfile
FROM oven/bun:1-alpine
WORKDIR /app
COPY package.json bun.lockb ./
RUN bun install --frozen-lockfile
COPY . .
RUN bun run build
EXPOSE 3001
CMD ["bun", "start"]
```

## 🌏 Локализация для Таиланда

### Популярные платформы в Таиланде
1. **LINE** - 95% проникновения, основной мессенджер
2. **TikTok** - Популярен среди молодежи (18-35 лет)
3. **WhatsApp** - Международное общение и бизнес
4. **Telegram** - Техническая аудитория и крипто-сообщество
5. **Google** - Универсальная аутентификация
6. **Apple** - Премиум сегмент iOS пользователей

### Особенности интеграции
- **Тайский язык**: Поддержка UTF-8 и тайских символов
- **Местные номера телефонов**: Формат +66XXXXXXXXX
- **Культурные особенности**: Уважение к приватности
- **Мобильный фокус**: 90%+ пользователей с мобильных устройств

## 🔄 Интеграции

### Внутренние сервисы
- **CRM Service**: Синхронизация данных пользователей и коммуникации
- **Booking Service**: Аутентификация для бронирований
- **Payment Service**: Верификация пользователей для платежей
- **Notification Service**: Отправка уведомлений через предпочитаемые каналы

### Внешние сервисы
- **Google APIs**: OAuth и профильные данные
- **Apple Developer APIs**: Sign in with Apple
- **TikTok for Developers**: OAuth и профильные данные
- **Telegram Bot API**: Login Widget и интеграция
- **LINE Developers**: OAuth для тайского рынка
- **WhatsApp Business API**: Бизнес-интеграция
- **SMTP сервисы**: Отправка email уведомлений

## 📈 Производительность

### Оптимизации
- Кеширование пользовательских сессий в Redis
- Индексы базы данных для быстрого поиска
- Пагинация для списков пользователей
- Сжатие ответов API
- Connection pooling для PostgreSQL
- JWT токены для stateless аутентификации

### Масштабирование
- Горизонтальное масштабирование через load balancer
- Репликация базы данных для чтения
- CDN для статических файлов (аватары)
- Микросервисная архитектура
- Rate limiting для защиты от злоупотреблений

## 🔐 Безопасность

### Дополнительные меры безопасности
- **OAuth State Parameter**: Защита от CSRF атак
- **Webhook Signature Verification**: Проверка подлинности Telegram данных
- **Token Rotation**: Автоматическое обновление refresh токенов
- **Account Verification**: Система верификации профилей
- **Role-based Access Control**: Гранулярные права доступа
- **Audit Logging**: Логирование всех критических операций

### Соответствие стандартам
- **GDPR**: Право на удаление данных
- **OAuth 2.0**: Стандартная аутентификация
- **JWT**: Безопасные токены доступа
- **HTTPS**: Обязательное шифрование в продакшене

## 📊 Метрики и мониторинг

### Ключевые метрики
- **Регистрации**: Новые пользователи по провайдерам
- **Аутентификация**: Успешность входов по каналам
- **Верификация**: Процент верифицированных пользователей
- **OAuth**: Популярность провайдеров в Таиланде
- **Производительность**: Время ответа API endpoints

### Дашборды
- Аналитика пользователей по провайдерам
- География регистраций (фокус на Таиланд)
- Конверсия OAuth потоков
- Система алертов для критических ошибок

---

**Контакты для поддержки:**
- 📧 Email: user-service@thailand-marketplace.com
- 📱 Slack: #user-service-support
- 📋 Issues: [GitHub Issues](https://github.com/chatman-media/farang-marketplace/issues?label=user-service)
- 🌐 Документация: [Thailand Marketplace Docs](https://docs.thailand-marketplace.com/services/user-service)