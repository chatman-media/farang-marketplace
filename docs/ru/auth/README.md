# Документация по аутентификации

Документация по системе аутентификации Thailand Marketplace.

## Обзор

Система аутентификации поддерживает множественные способы входа:

- ✅ **Email/Password** - традиционная регистрация
- ✅ **Google OAuth 2.0** - вход через Google аккаунт
- ✅ **Apple Sign In** - вход через Apple ID
- ✅ **TikTok Login Kit** - вход через TikTok
- ✅ **Telegram Login Widget** - вход через Telegram
- ✅ **LINE Login** - вход через LINE
- ✅ **WhatsApp Business API** - вход через WhatsApp

## Документы

### 📋 [oauth-api.md](../../auth/oauth-api.md)

Основной документ с описанием всех OAuth провайдеров:

- API endpoints для каждого провайдера
- Примеры запросов и ответов
- Обработка ошибок
- Безопасность и валидация

### 🔧 [oauth-setup-guide.md](../../auth/oauth-setup-guide.md)

Техническое руководство по настройке:

- Пошаговая настройка каждого провайдера
- Конфигурация в консолях разработчиков
- Переменные окружения
- Troubleshooting и отладка

## Текущий статус

### ✅ Завершено

- Базовая email/password аутентификация
- JWT токены (access + refresh)
- Роли пользователей
- Все OAuth провайдеры реализованы
- Полная документация
- 176 тестов проходят успешно

### 🔄 В разработке

- Frontend компоненты
- Мобильные приложения

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
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
LINE_CHANNEL_ID=your_line_channel_id
WHATSAPP_APP_ID=your_whatsapp_app_id
# ... остальные провайдеры
```

### 2. Установка зависимостей

```bash
# Установите зависимости
bun install
```

### 3. Запуск сервиса

```bash
# Запустите user-service
bun run dev
```

### 4. Тестирование

```bash
# Запустите тесты
bun run test
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

## Поддерживаемые провайдеры

| Провайдер | Статус | Особенности                   |
| --------- | ------ | ----------------------------- |
| Google    | ✅     | OAuth 2.0, profile + email    |
| Apple     | ✅     | Sign in with Apple, JWT       |
| TikTok    | ✅     | Login Kit, basic info         |
| Telegram  | ✅     | Login Widget, hash validation |
| LINE      | ✅     | Популярен в Азии              |
| WhatsApp  | ✅     | Business API                  |
| Email     | ✅     | Традиционная регистрация      |

## API Endpoints

### Основные endpoints

- `GET /api/oauth/providers` - список доступных провайдеров
- `GET /api/oauth/:provider/auth` - инициация OAuth
- `POST /api/oauth/:provider/callback` - обработка callback
- `POST /api/oauth/:provider/link` - привязка аккаунта
- `DELETE /api/oauth/:provider/unlink` - отвязка аккаунта

### Email аутентификация

- `POST /api/auth/register` - регистрация
- `POST /api/auth/login` - вход
- `POST /api/auth/refresh` - обновление токена
- `POST /api/auth/logout` - выход

## Поддержка

Для вопросов по аутентификации:

- 📧 Email: dev-team@thailand-marketplace.com
- 💬 Slack: #auth-support
- 📖 Wiki: [Authentication Wiki](https://wiki.thailand-marketplace.com/auth)

## Changelog

### v1.1.0 (Текущая)

- Добавлены все OAuth провайдеры
- Полная реализация WhatsApp, Apple, TikTok
- Улучшенная безопасность
- Полная документация

### v1.0.0

- Базовая email/password аутентификация
- JWT токены
- Роли пользователей
- Telegram ID поддержка
