# Руководство по разработке

## Предварительные требования

- [Bun](https://bun.sh) >= 1.0.0
- [Docker](https://docker.com) и Docker Compose
- [Node.js](https://nodejs.org) >= 18 (для совместимости)

## Быстрый старт

1. **Клонирование и настройка проекта:**

   ```bash
   git clone https://github.com/chatman-media/farang-marketplace.git
   cd thailand-marketplace
   ./scripts/setup-dev.sh
   ```

2. **Настройка переменных окружения:**

   ```bash
   cp .env.example .env
   # Отредактируйте .env с вашей конфигурацией
   ```

3. **Запуск разработки:**
   ```bash
   bun run dev
   ```

## Структура проекта

```
thailand-marketplace/
├── apps/                    # Frontend приложения
│   ├── web/                # Основное веб-приложение
│   ├── admin/              # Панель администратора
│   └── ton-app/            # TON Mini App
├── services/               # Backend микросервисы
│   └── user-service/       # Сервис управления пользователями
├── packages/               # Общие пакеты
│   └── shared-types/       # TypeScript определения типов
├── docker/                 # Конфигурация Docker
├── scripts/                # Скрипты разработки
└── docs/                   # Документация
```

## Доступные скрипты

### Команды корневого уровня

- `bun run dev` - Запуск всех сервисов в режиме разработки
- `bun run build` - Сборка всех пакетов и приложений
- `bun run test` - Запуск всех тестов
- `bun run test:watch` - Запуск тестов в режиме наблюдения
- `bun run lint` - Линтинг всего кода
- `bun run lint:fix` - Исправление проблем линтинга
- `bun run format` - Форматирование кода с Prettier
- `bun run type-check` - Проверка типов TypeScript

### Docker команды

- `bun run docker:up` - Запуск Docker сервисов
- `bun run docker:down` - Остановка Docker сервисов
- `bun run docker:logs` - Просмотр логов Docker
- `bun run docker:reset` - Сброс Docker окружения (удаляет volumes)

## Сервисы разработки

### Сервисы баз данных

- **PostgreSQL**: `localhost:5432`
  - База данных: `marketplace`
  - Пользователь: `marketplace_user`
  - Пароль: `marketplace_pass`

- **Redis**: `localhost:6379`
  - Без аутентификации в разработке

- **MinIO**: `localhost:9000` (API), `localhost:9001` (Консоль)
  - Access Key: `minioadmin`
  - Secret Key: `minioadmin123`

### Инструменты разработки

- **MailHog**: `http://localhost:8025`
  - SMTP сервер для тестирования email
  - Веб-интерфейс для просмотра отправленных писем

- **PgAdmin**: `http://localhost:5050` (опционально, используйте
  `--profile tools`)
  - Email: `admin@marketplace.local`
  - Пароль: `admin123`

## Обзор архитектуры

### Структура монорепозитория

Этот проект использует Turbo для управления монорепозиторием со следующей
структурой workspace:

- **Apps**: Frontend приложения, построенные с Vite + React
- **Services**: Backend микросервисы, построенные с Node.js/TypeScript
- **Packages**: Общие библиотеки и определения типов

### Технологический стек

**Frontend:**

- React 18 с TypeScript
- Vite для инструментов сборки
- Tailwind CSS для стилизации
- Zustand для управления состоянием

**Backend:**

- Node.js с TypeScript
- Express/Fastify для API
- PostgreSQL для основной базы данных
- Redis для кэширования и сессий
- MinIO для хранения файлов

**Разработка:**

- Turbo для управления монорепозиторием
- Docker для локального окружения разработки
- ESLint + Prettier для качества кода
- Vitest для тестирования

## Пакет общих типов

Пакет `@marketplace/shared-types` содержит все TypeScript интерфейсы и типы,
используемые на платформе:

- **Типы пользователей**: Профили пользователей, аутентификация, роли
- **Типы листингов**: Листинги товаров/услуг, категории
- **Типы бронирования**: Резервации, транзакции
- **CRM типы**: Управление клиентами, коммуникации, кампании
- **AI типы**: Управление разговорами, интерфейсы AI сервисов
- **Типы платежей**: Обработка транзакций, интеграция TON

## Конфигурация окружения

### Обязательные переменные окружения

```bash
# База данных
DATABASE_URL=postgresql://marketplace_user:marketplace_pass@localhost:5432/marketplace

# Redis
REDIS_URL=redis://localhost:6379

# MinIO/S3
MINIO_ENDPOINT=http://localhost:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin123

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production

# Внешние API
OPENAI_API_KEY=your-openai-api-key
TELEGRAM_BOT_TOKEN=your-telegram-bot-token
```

### Конфигурация для конкретных сервисов

Каждый сервис может иметь дополнительные переменные окружения. Проверьте файл
`.env.example` в директории каждого сервиса.

## Рабочий процесс разработки

### Добавление новых функций

1. **Создание ветки функции:**

   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Обновление общих типов при необходимости:**

   ```bash
   cd packages/shared-types
   # Добавьте новые типы
   bun run build
   ```

3. **Реализация в сервисах/приложениях:**

   ```bash
   cd services/your-service
   # Реализуйте функцию
   bun run test
   ```

4. **Тестирование интеграции:**
   ```bash
   bun run test
   bun run lint
   bun run type-check
   ```

### Миграции базы данных

Изменения схемы базы данных должны быть сделаны в:

- `docker/postgres/init.sql` для начальной схемы
- Файлы миграций для конкретных сервисов для инкрементальных изменений

### Качество кода

Проект обеспечивает качество кода через:

- **ESLint**: Правила линтинга для TypeScript/JavaScript
- **Prettier**: Форматирование кода
- **TypeScript**: Проверка типов
- **Vitest**: Юнит и интеграционное тестирование

Запуск проверок качества:

```bash
bun run lint
bun run format:check
bun run type-check
bun run test
```

## Устранение неполадок

### Частые проблемы

1. **Docker сервисы не запускаются:**

   ```bash
   docker-compose down -v
   docker-compose up -d
   ```

2. **Конфликты портов:**
   - Проверьте доступность портов 5432, 6379, 9000, 9001
   - Измените docker-compose.yml при необходимости

3. **Ошибки сборки:**

   ```bash
   bun run clean
   bun install
   bun run build
   ```

4. **Ошибки типов после обновления shared-types:**
   ```bash
   cd packages/shared-types
   bun run build
   cd ../..
   bun run type-check
   ```

### Получение помощи

- Проверьте логи: `bun run docker:logs`
- Проверьте состояние сервисов: `docker-compose ps`
- Сбросьте окружение: `bun run docker:reset`

## Вклад в проект

1. Следуйте установленному стилю кода (ESLint + Prettier)
2. Пишите тесты для новых функций
3. Обновляйте документацию по мере необходимости
4. Убедитесь, что все проверки проходят перед отправкой PR

## Следующие шаги

После настройки окружения разработки:

1. Изучите структуру кодовой базы
2. Запустите набор тестов для понимания текущей функциональности
3. Проверьте дорожную карту проекта в основном README
4. Начните реализацию функций согласно списку задач
