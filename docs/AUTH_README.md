# Authentication Documentation

Документация по системе аутентификации Thailand Marketplace.

## Обзор

Система аутентификации поддерживает множественные способы входа:

- ✅ **Email/Password** - традиционная регистрация
- 🔄 **Google OAuth 2.0** - вход через Google аккаунт
- 🔄 **Apple Sign In** - вход через Apple ID
- 🔄 **TikTok Login Kit** - вход через TikTok
- 🔄 **Telegram Login Widget** - вход через Telegram
- 🔄 **LINE Login** - вход через LINE

## Документы

### 📋 [OAUTH_PROVIDERS.md](./OAUTH_PROVIDERS.md)
Основной документ с описанием всех OAuth провайдеров:
- Конфигурация каждого провайдера
- Получаемые данные
- Особенности интеграции
- План реализации
- Настройка окружения

### 🔧 [OAUTH_IMPLEMENTATION.md](./OAUTH_IMPLEMENTATION.md)
Техническое руководство по реализации:
- Архитектура системы
- Структура базы данных
- Код сервисов и провайдеров
- API endpoints
- Frontend интеграция
- Тестирование и безопасность

## Текущий статус

### ✅ Завершено
- Базовая email/password аутентификация
- JWT токены (access + refresh)
- Роли пользователей
- TypeScript типы для OAuth
- Документация

### 🔄 В разработке
- OAuth провайдеры
- Связывание социальных аккаунтов
- Frontend компоненты

### 📋 Планируется
- Двухфакторная аутентификация (2FA)
- Биометрическая аутентификация
- SSO для корпоративных клиентов

## Быстрый старт

### 1. Настройка переменных окружения
```bash
# Скопируйте .env.example в .env
cp .env.example .env

# Добавьте OAuth credentials
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
APPLE_CLIENT_ID=your_apple_service_id
# ... остальные провайдеры
```

### 2. Обновление базы данных
```bash
# Запустите миграции для OAuth
bun run migrate:oauth
```

### 3. Установка зависимостей
```bash
# OAuth библиотеки
bun add passport-google-oauth20 passport-apple @line/bot-sdk
```

### 4. Тестирование
```bash
# Запустите тесты OAuth
bun test oauth
```

## Архитектура

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │    │   User Service   │    │   OAuth         │
│                 │    │                  │    │   Providers     │
│ ┌─────────────┐ │    │ ┌──────────────┐ │    │                 │
│ │ OAuthButtons│ │◄──►│ │ OAuthService │ │◄──►│ Google, Apple,  │
│ └─────────────┘ │    │ └──────────────┘ │    │ TikTok, etc.    │
│                 │    │                  │    │                 │
│ ┌─────────────┐ │    │ ┌──────────────┐ │    └─────────────────┘
│ │ AuthContext │ │◄──►│ │ UserService  │ │
│ └─────────────┘ │    │ └──────────────┘ │
└─────────────────┘    └──────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │   PostgreSQL    │
                       │                 │
                       │ ┌─────────────┐ │
                       │ │    users    │ │
                       │ └─────────────┘ │
                       │ ┌─────────────┐ │
                       │ │social_      │ │
                       │ │profiles     │ │
                       │ └─────────────┘ │
                       └─────────────────┘
```

## Безопасность

### Основные принципы
- **State Parameter** - защита от CSRF атак
- **PKCE** - для мобильных приложений
- **Token Rotation** - регулярная смена refresh токенов
- **Rate Limiting** - ограничение попыток входа
- **Signature Validation** - проверка подписей (Telegram)

### Проверки
- Валидация всех OAuth callback'ов
- Проверка срока действия токенов
- Аудит всех попыток аутентификации
- Мониторинг подозрительной активности

## Поддержка

Для вопросов по аутентификации:
- 📧 Email: dev-team@thailand-marketplace.com
- 💬 Slack: #auth-support
- 📖 Wiki: [Authentication Wiki](https://wiki.thailand-marketplace.com/auth)

## Changelog

### v1.1.0 (Планируется)
- Добавление всех OAuth провайдеров
- Связывание социальных аккаунтов
- Улучшенная безопасность

### v1.0.0 (Текущая)
- Базовая email/password аутентификация
- JWT токены
- Роли пользователей
- Telegram ID поддержка