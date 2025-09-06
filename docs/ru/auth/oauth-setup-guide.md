# Руководство по настройке OAuth провайдеров

Это руководство объясняет, как настроить каждый OAuth провайдер для платформы Thailand Marketplace.

## Предварительные требования

1. Скопируйте переменные окружения из `.env.example` в ваш `.env` файл
2. Настройте каждый провайдер, который хотите использовать, следуя разделам ниже
3. Перезапустите user-service после обновления переменных окружения

## Настройка Google OAuth

### 1. Создание проекта Google Cloud
1. Перейдите в [Google Cloud Console](https://console.cloud.google.com/)
2. Создайте новый проект или выберите существующий
3. Включите Google+ API

### 2. Настройка экрана согласия OAuth
1. Перейдите в APIs & Services > OAuth consent screen
2. Выберите тип пользователя "External"
3. Заполните обязательные поля:
   - Название приложения: "Thailand Marketplace"
   - Email поддержки пользователей: ваш email
   - Контактная информация разработчика: ваш email

### 3. Создание OAuth учетных данных
1. Перейдите в APIs & Services > Credentials
2. Нажмите "Create Credentials" > "OAuth 2.0 Client IDs"
3. Выберите "Web application"
4. Добавьте авторизованные redirect URI:
   - `http://localhost:3001/api/oauth/google/callback` (разработка)
   - `https://yourdomain.com/api/oauth/google/callback` (продакшн)

### 4. Переменные окружения
```env
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3001/api/oauth/google/callback
```

## Настройка Apple Sign In

### 1. Аккаунт Apple Developer
1. Вам нужен аккаунт Apple Developer ($99/год)
2. Перейдите в [Apple Developer Portal](https://developer.apple.com/)

### 2. Создание App ID
1. Перейдите в Certificates, Identifiers & Profiles
2. Создайте новый App ID с возможностью Sign In with Apple

### 3. Создание Service ID
1. Создайте новый Services ID
2. Настройте Sign In with Apple
3. Добавьте ваш домен и redirect URL

### 4. Создание приватного ключа
1. Перейдите в раздел Keys
2. Создайте новый ключ с возможностью Sign In with Apple
3. Скачайте файл .p8 и запомните Key ID

### 5. Переменные окружения
```env
APPLE_CLIENT_ID=com.yourapp.service-id
APPLE_TEAM_ID=YOUR_TEAM_ID
APPLE_KEY_ID=YOUR_KEY_ID
APPLE_PRIVATE_KEY_PATH=/path/to/AuthKey_YOUR_KEY_ID.p8
APPLE_CALLBACK_URL=http://localhost:3001/api/oauth/apple/callback
```

## Настройка TikTok Login Kit

### 1. TikTok for Developers
1. Перейдите в [TikTok for Developers](https://developers.tiktok.com/)
2. Создайте аккаунт разработчика
3. Создайте новое приложение

### 2. Настройка Login Kit
1. Включите Login Kit для вашего приложения
2. Добавьте redirect URI
3. Запросите необходимые scopes: `user.info.basic`

### 3. Переменные окружения
```env
TIKTOK_CLIENT_KEY=your-tiktok-client-key
TIKTOK_CLIENT_SECRET=your-tiktok-client-secret
TIKTOK_CALLBACK_URL=http://localhost:3001/api/oauth/tiktok/callback
```

## Настройка Telegram Login Widget

### 1. Создание Telegram бота
1. Напишите [@BotFather](https://t.me/botfather) в Telegram
2. Используйте команду `/newbot` для создания нового бота
3. Получите токен бота и имя пользователя

### 2. Настройка домена
1. Используйте команду `/setdomain` с @BotFather
2. Установите ваш домен (например, `localhost:3000` для разработки)

### 3. Переменные окружения
```env
TELEGRAM_BOT_TOKEN=your-telegram-bot-token
TELEGRAM_BOT_USERNAME=your_bot_username
```

## Настройка LINE Login

### 1. LINE Developers Console
1. Перейдите в [LINE Developers](https://developers.line.biz/)
2. Создайте нового провайдера и канал
3. Выберите тип канала "LINE Login"

### 2. Настройка канала
1. Установите название и описание канала
2. Добавьте redirect URI
3. Настройте scopes: `profile`, `openid`, `email`

### 3. Переменные окружения
```env
LINE_CHANNEL_ID=your-line-channel-id
LINE_CHANNEL_SECRET=your-line-channel-secret
LINE_CALLBACK_URL=http://localhost:3001/api/oauth/line/callback
```

## Настройка WhatsApp Business API

### 1. Meta for Developers
1. Перейдите в [Meta for Developers](https://developers.facebook.com/)
2. Создайте новое приложение
3. Добавьте продукт WhatsApp Business API

### 2. Настройка WhatsApp
1. Настройте бизнес номер телефона
2. Настройте webhook URL
3. Получите необходимые разрешения

### 3. Переменные окружения
```env
WHATSAPP_APP_ID=your-whatsapp-app-id
WHATSAPP_APP_SECRET=your-whatsapp-app-secret
WHATSAPP_PHONE_NUMBER_ID=your-phone-number-id
WHATSAPP_CALLBACK_URL=http://localhost:3001/api/oauth/whatsapp/callback
```

## Тестирование OAuth потоков

### 1. Проверка доступных провайдеров
```bash
curl http://localhost:3001/api/oauth/providers
```

### 2. Тестирование OAuth потока
```bash
# Инициация OAuth
curl "http://localhost:3001/api/oauth/google/auth"

# Посетите возвращенный authUrl в браузере
# Завершите авторизацию
# Используйте возвращенный код в callback

curl -X POST "http://localhost:3001/api/oauth/google/callback" \
  -H "Content-Type: application/json" \
  -d '{"code": "authorization_code", "state": "state_value"}'
```

## Соображения для продакшна

1. **Только HTTPS**: Все OAuth потоки должны использовать HTTPS в продакшне
2. **Верификация домена**: Зарегистрируйте ваши продакшн домены у каждого провайдера
3. **Rate Limiting**: Реализуйте ограничение скорости на OAuth endpoints
4. **Обработка ошибок**: Предоставьте понятные пользователю сообщения об ошибках
5. **Безопасность**: Валидируйте все OAuth ответы и реализуйте CSRF защиту

## Устранение неполадок

### Частые проблемы
1. **Неверный redirect URI**: Убедитесь, что URI точно совпадают в настройках провайдера
2. **Ошибки scope**: Проверьте, что запрашиваемые scopes одобрены для вашего приложения
3. **Истечение токена**: Реализуйте правильную логику обновления токенов
4. **CORS ошибки**: Настройте CORS настройки для вашего frontend домена

### Режим отладки
Установите `NODE_ENV=development` для просмотра детальных сообщений об ошибках OAuth в логах.
