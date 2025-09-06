# OAuth Providers Integration Guide

Этот документ описывает интеграцию с различными OAuth провайдерами для аутентификации пользователей в marketplace платформе.

## Текущее состояние

В настоящее время система поддерживает:
- ✅ Email/Password аутентификацию
- ✅ JWT токены (access + refresh)
- ✅ Роли пользователей (USER, AGENCY, MANAGER, ADMIN)
- ✅ Telegram ID в профиле пользователя

## Планируемые OAuth провайдеры

### 1. Google OAuth 2.0

**Библиотека:** `passport-google-oauth20`

**Настройка:**
```bash
bun add passport-google-oauth20 @types/passport-google-oauth20
```

**Конфигурация:**
```typescript
// .env
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:3001/auth/google/callback
```

**Получение данных:**
- Email (обязательно)
- Имя и фамилия
- Аватар
- Google ID

**Scope:** `profile email`

---

### 2. Apple Sign In

**Библиотека:** `passport-apple`

**Настройка:**
```bash
bun add passport-apple
```

**Конфигурация:**
```typescript
// .env
APPLE_CLIENT_ID=your_apple_service_id
APPLE_TEAM_ID=your_apple_team_id
APPLE_KEY_ID=your_apple_key_id
APPLE_PRIVATE_KEY_PATH=./certs/apple_private_key.p8
APPLE_CALLBACK_URL=http://localhost:3001/auth/apple/callback
```

**Получение данных:**
- Email (может быть скрыт)
- Имя (только при первом входе)
- Apple ID

**Особенности:**
- Требует сертификат .p8
- Email может быть приватным (relay)
- Имя передается только при первой авторизации

---

### 3. TikTok Login Kit

**Библиотека:** Custom implementation (TikTok API)

**Настройка:**
```bash
bun add axios
```

**Конфигурация:**
```typescript
// .env
TIKTOK_CLIENT_KEY=your_tiktok_client_key
TIKTOK_CLIENT_SECRET=your_tiktok_client_secret
TIKTOK_REDIRECT_URI=http://localhost:3001/auth/tiktok/callback
```

**API Endpoints:**
- Authorization: `https://www.tiktok.com/auth/authorize/`
- Token: `https://open-api.tiktok.com/oauth/access_token/`
- User Info: `https://open-api.tiktok.com/oauth/userinfo/`

**Получение данных:**
- Username
- Display name
- Avatar
- TikTok ID

**Scope:** `user.info.basic`

---

### 4. Telegram Login Widget

**Библиотека:** Custom implementation

**Настройка:**
```bash
# Создать бота через @BotFather
# Получить bot token
```

**Конфигурация:**
```typescript
// .env
TELEGRAM_BOT_TOKEN=your_bot_token
TELEGRAM_BOT_USERNAME=your_bot_username
```

**Получение данных:**
- Telegram ID
- Username
- First name
- Last name
- Photo URL

**Особенности:**
- Использует Telegram Login Widget
- Проверка подписи через HMAC-SHA256
- Не требует redirect URL

---

### 5. LINE Login

**Библиотека:** `@line/bot-sdk` или custom implementation

**Настройка:**
```bash
bun add @line/bot-sdk
```

**Конфигурация:**
```typescript
// .env
LINE_CHANNEL_ID=your_line_channel_id
LINE_CHANNEL_SECRET=your_line_channel_secret
LINE_CALLBACK_URL=http://localhost:3001/auth/line/callback
```

**API Endpoints:**
- Authorization: `https://access.line.me/oauth2/v2.1/authorize`
- Token: `https://api.line.me/oauth2/v2.1/token`
- Profile: `https://api.line.me/v2/profile`

**Получение данных:**
- LINE ID
- Display name
- Picture URL
- Status message

**Scope:** `profile openid`

---

## Архитектура интеграции

### 1. Расширение типов

```typescript
// shared-types/src/user.ts
export enum AuthProvider {
  EMAIL = 'email',
  GOOGLE = 'google',
  APPLE = 'apple',
  TIKTOK = 'tiktok',
  TELEGRAM = 'telegram',
  LINE = 'line'
}

export interface SocialProfile {
  provider: AuthProvider
  providerId: string
  email?: string
  name?: string
  avatar?: string
  username?: string
}

export interface OAuthLoginRequest {
  provider: AuthProvider
  code?: string // для OAuth 2.0
  state?: string
  // Для Telegram
  telegramData?: {
    id: number
    first_name: string
    last_name?: string
    username?: string
    photo_url?: string
    auth_date: number
    hash: string
  }
}
```

### 2. Обновление User модели

```typescript
// Добавить в UserEntity
export interface User {
  // ... существующие поля
  socialProfiles: SocialProfile[]
  primaryAuthProvider: AuthProvider
}
```

### 3. OAuth Service

```typescript
export class OAuthService {
  async authenticateWithProvider(
    provider: AuthProvider, 
    data: OAuthLoginRequest
  ): Promise<AuthResponse>
  
  async linkSocialAccount(
    userId: string, 
    socialProfile: SocialProfile
  ): Promise<void>
  
  async unlinkSocialAccount(
    userId: string, 
    provider: AuthProvider
  ): Promise<void>
}
```

### 4. Маршруты

```typescript
// OAuth routes
GET  /auth/:provider          // Redirect to provider
GET  /auth/:provider/callback // Handle callback
POST /auth/:provider          // Direct auth (для Telegram)

// Account linking
POST /auth/link/:provider     // Link social account
DELETE /auth/unlink/:provider // Unlink social account
GET  /auth/accounts           // Get linked accounts
```

## Безопасность

### 1. Проверка состояния (State Parameter)
- Генерация случайного state для каждого запроса
- Проверка state в callback
- Защита от CSRF атак

### 2. Проверка подписи (Telegram)
```typescript
function verifyTelegramAuth(data: TelegramAuthData, botToken: string): boolean {
  const { hash, ...authData } = data
  const dataCheckString = Object.keys(authData)
    .sort()
    .map(key => `${key}=${authData[key]}`)
    .join('\n')
  
  const secretKey = crypto.createHash('sha256').update(botToken).digest()
  const calculatedHash = crypto.createHmac('sha256', secretKey)
    .update(dataCheckString)
    .digest('hex')
  
  return calculatedHash === hash
}
```

### 3. Валидация токенов
- Проверка срока действия
- Валидация audience и issuer
- Проверка подписи JWT

## План реализации

### Этап 1: Подготовка
- [ ] Расширить типы в shared-types
- [ ] Обновить User модель и миграции
- [ ] Создать OAuthService

### Этап 2: Google OAuth
- [ ] Настроить Google OAuth 2.0
- [ ] Реализовать маршруты
- [ ] Добавить тесты

### Этап 3: Apple Sign In
- [ ] Настроить Apple Sign In
- [ ] Обработать особенности Apple ID
- [ ] Добавить тесты

### Этап 4: Telegram Login
- [ ] Реализовать Telegram Widget
- [ ] Добавить проверку подписи
- [ ] Интеграция с существующим telegramId

### Этап 5: TikTok и LINE
- [ ] Реализовать TikTok Login Kit
- [ ] Добавить LINE Login
- [ ] Финальное тестирование

### Этап 6: Frontend интеграция
- [ ] Добавить кнопки OAuth в UI
- [ ] Реализовать account linking
- [ ] Обновить документацию

## Конфигурация окружения

```bash
# .env для всех провайдеров

# Google OAuth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# Apple Sign In
APPLE_CLIENT_ID=
APPLE_TEAM_ID=
APPLE_KEY_ID=
APPLE_PRIVATE_KEY_PATH=

# TikTok Login Kit
TIKTOK_CLIENT_KEY=
TIKTOK_CLIENT_SECRET=

# Telegram Bot
TELEGRAM_BOT_TOKEN=
TELEGRAM_BOT_USERNAME=

# LINE Login
LINE_CHANNEL_ID=
LINE_CHANNEL_SECRET=

# Base URLs
FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://localhost:3001
```

## Тестирование

### Unit тесты
- Проверка валидации OAuth данных
- Тестирование создания пользователей
- Проверка связывания аккаунтов

### Integration тесты
- Полный OAuth flow
- Проверка callback обработки
- Тестирование ошибок

### E2E тесты
- Авторизация через каждый провайдер
- Связывание/отвязывание аккаунтов
- Переключение между провайдерами

## Мониторинг и логирование

- Логирование всех OAuth попыток
- Метрики по провайдерам
- Отслеживание ошибок авторизации
- Алерты на подозрительную активность

---

**Статус:** 📋 Планирование  
**Приоритет:** Высокий  
**Оценка:** 2-3 недели разработки  
**Ответственный:** Backend Team