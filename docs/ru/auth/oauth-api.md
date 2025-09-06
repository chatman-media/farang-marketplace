# Документация OAuth API

## Обзор

Этот документ описывает OAuth API endpoints для платформы Thailand Marketplace. OAuth система поддерживает множественные провайдеры аутентификации включая Google, Apple, TikTok, Telegram, LINE, WhatsApp и традиционную email/password аутентификацию.

## Базовый URL

```
http://localhost:3001/api/oauth
```

## Аутентификация

Некоторые endpoints требуют аутентификации через Bearer токен в заголовке Authorization:

```
Authorization: Bearer <access_token>
```

## Endpoints

### 1. Получить доступные провайдеры

**GET** `/providers`

Возвращает список настроенных OAuth провайдеров.

#### Ответ

```json
{
  "providers": [
    {
      "name": "google",
      "displayName": "Google",
      "configured": true
    },
    {
      "name": "telegram",
      "displayName": "Telegram",
      "configured": true
    },
    {
      "name": "apple",
      "displayName": "Apple",
      "configured": false
    }
  ]
}
```

### 2. Инициировать OAuth поток

**GET** `/:provider/auth`

Инициирует OAuth поток аутентификации для указанного провайдера.

#### Параметры

- `provider` (path): Имя OAuth провайдера (google, apple, tiktok, line, whatsapp)
- `redirect_uri` (query, опционально): Пользовательский redirect URI после аутентификации

#### Ответ

```json
{
  "authUrl": "https://accounts.google.com/o/oauth2/v2/auth?client_id=...",
  "state": "random_state_string"
}
```

#### Пример

```bash
curl "http://localhost:3001/api/oauth/google/auth?redirect_uri=http://localhost:3000/auth/callback"
```

### 3. Обработать OAuth Callback

**POST** `/:provider/callback`

Обрабатывает OAuth callback и завершает процесс аутентификации.

#### Параметры

- `provider` (path): Имя OAuth провайдера

#### Тело запроса

**Для Google/Apple/TikTok/LINE/WhatsApp:**
```json
{
  "code": "authorization_code_from_provider",
  "state": "state_from_auth_request"
}
```

**Для Telegram:**
```json
{
  "telegramData": {
    "id": 123456789,
    "first_name": "John",
    "last_name": "Doe",
    "username": "johndoe",
    "photo_url": "https://t.me/i/userpic/320/...",
    "auth_date": 1640995200,
    "hash": "telegram_hash"
  }
}
```

#### Ответ

```json
{
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "role": "user",
    "profile": {
      "firstName": "John",
      "lastName": "Doe",
      "avatar": "https://example.com/avatar.jpg"
    },
    "socialProfiles": [
      {
        "provider": "google",
        "providerId": "google_user_id",
        "email": "user@example.com",
        "name": "John Doe",
        "avatar": "https://example.com/avatar.jpg",
        "connectedAt": "2024-01-15T10:30:00Z"
      }
    ],
    "primaryAuthProvider": "google",
    "isActive": true,
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z"
  },
  "accessToken": "jwt_access_token",
  "refreshToken": "jwt_refresh_token"
}
```

### 4. Привязать социальный аккаунт

**POST** `/:provider/link`

🔒 **Требует аутентификации**

Привязывает социальный аккаунт к профилю аутентифицированного пользователя.

#### Параметры

- `provider` (path): Имя OAuth провайдера

#### Тело запроса

Такое же как в OAuth callback запросе.

#### Ответ

```json
{
  "message": "Social account linked successfully",
  "socialProfile": {
    "provider": "google",
    "providerId": "google_user_id",
    "email": "user@example.com",
    "name": "John Doe",
    "avatar": "https://example.com/avatar.jpg",
    "connectedAt": "2024-01-15T10:30:00Z"
  }
}
```

### 5. Отвязать социальный аккаунт

**DELETE** `/:provider/unlink`

🔒 **Требует аутентификации**

Отвязывает социальный аккаунт от профиля аутентифицированного пользователя.

#### Параметры

- `provider` (path): Имя OAuth провайдера

#### Ответ

```json
{
  "message": "Social account unlinked successfully"
}
```

## Ответы с ошибками

Все endpoints могут возвращать следующие ответы с ошибками:

### 400 Bad Request

```json
{
  "error": {
    "code": "INVALID_REQUEST",
    "message": "Invalid request parameters",
    "details": "Specific error details"
  }
}
```

### 401 Unauthorized

```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required"
  }
}
```

### 403 Forbidden

```json
{
  "error": {
    "code": "FORBIDDEN",
    "message": "Access denied"
  }
}
```

### 404 Not Found

```json
{
  "error": {
    "code": "PROVIDER_NOT_FOUND",
    "message": "OAuth provider not found or not configured"
  }
}
```

### 409 Conflict

```json
{
  "error": {
    "code": "ACCOUNT_ALREADY_LINKED",
    "message": "This social account is already linked to another user"
  }
}
```

### 500 Internal Server Error

```json
{
  "error": {
    "code": "INTERNAL_SERVER_ERROR",
    "message": "An unexpected error occurred"
  }
}
```

## Особенности провайдеров

### Google OAuth

- Требует переменные окружения `GOOGLE_CLIENT_ID` и `GOOGLE_CLIENT_SECRET`
- Scopes: `profile email`
- Redirect URI должен быть зарегистрирован в Google Console

### Apple OAuth

- Требует переменные окружения `APPLE_CLIENT_ID`, `APPLE_TEAM_ID`, `APPLE_KEY_ID` и `APPLE_PRIVATE_KEY`
- Использует сервис Apple Sign in with Apple
- Поддерживает веб и мобильные потоки

### TikTok OAuth

- Требует переменные окружения `TIKTOK_CLIENT_ID` и `TIKTOK_CLIENT_SECRET`
- Scopes: `user.info.basic`
- Ограничено одобренными приложениями

### Telegram Login Widget

- Требует переменные окружения `TELEGRAM_BOT_TOKEN` и `TELEGRAM_BOT_USERNAME`
- Использует Telegram Login Widget вместо традиционного OAuth потока
- Нет authorization URL - использует интеграцию виджета

### LINE Login

- Требует переменные окружения `LINE_CHANNEL_ID` и `LINE_CHANNEL_SECRET`
- Scopes: `profile openid email`
- Популярен в Таиланде и других азиатских рынках
- Redirect URI должен быть зарегистрирован в LINE Developers Console

### WhatsApp Business API

- Требует переменные окружения `WHATSAPP_APP_ID`, `WHATSAPP_APP_SECRET` и `WHATSAPP_PHONE_NUMBER_ID`
- Использует WhatsApp Business API для аутентификации
- Требует верификацию номера телефона
- Ограничено одобренными бизнес-аккаунтами

### Email/Password аутентификация

- Традиционная email и password аутентификация
- Всегда доступна (не требует внешней конфигурации)
- Включает регистрацию, вход, сброс пароля
- Использует JWT токены для управления сессиями
- Доступна по адресам `/api/auth/register`, `/api/auth/login`, `/api/auth/refresh`

## Соображения безопасности

1. **State Parameter**: Всегда валидируйте state параметр для предотвращения CSRF атак
2. **Только HTTPS**: OAuth потоки должны использоваться только через HTTPS в продакшене
3. **Хранение токенов**: Храните access токены безопасно и реализуйте правильную ротацию токенов
4. **Ограничение Scope**: Запрашивайте только необходимые scopes от OAuth провайдеров
5. **Rate Limiting**: Реализуйте ограничение скорости на OAuth endpoints
6. **Валидация входных данных**: Валидируйте все входные параметры и OAuth ответы

## Тестирование

Для тестирования OAuth потоков в разработке:

1. Настройте тестовые приложения у каждого OAuth провайдера
2. Сконфигурируйте переменные окружения с тестовыми credentials
3. Используйте ngrok или похожие инструменты для экспонирования localhost для OAuth callbacks
4. Тестируйте как успешные, так и ошибочные сценарии

## Примеры

### Полный OAuth поток (Google)

1. **Инициировать OAuth:**
   ```bash
   curl "http://localhost:3001/api/oauth/google/auth"
   ```

2. **Пользователь посещает возвращенный authUrl и авторизуется**

3. **Обработать callback:**
   ```bash
   curl -X POST "http://localhost:3001/api/oauth/google/callback" \
     -H "Content-Type: application/json" \
     -d '{
       "code": "authorization_code_from_google",
       "state": "state_from_step_1"
     }'
   ```

### Привязать дополнительный аккаунт

```bash
curl -X POST "http://localhost:3001/api/oauth/telegram/link" \
  -H "Authorization: Bearer your_access_token" \
  -H "Content-Type: application/json" \
  -d '{
    "telegramData": {
      "id": 123456789,
      "first_name": "John",
      "hash": "telegram_hash"
    }
  }'
```

### LINE Login поток

1. **Инициировать LINE OAuth:**
   ```bash
   curl "http://localhost:3001/api/oauth/line/auth"
   ```

2. **Обработать LINE callback:**
   ```bash
   curl -X POST "http://localhost:3001/api/oauth/line/callback" \
     -H "Content-Type: application/json" \
     -d '{
       "code": "authorization_code_from_line",
       "state": "state_from_step_1"
     }'
   ```

### WhatsApp Business аутентификация

```bash
curl -X POST "http://localhost:3001/api/oauth/whatsapp/callback" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "authorization_code_from_whatsapp",
    "state": "state_from_auth_request"
  }'
```
