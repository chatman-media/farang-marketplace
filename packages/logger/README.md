# @marketplace/logger

Универсальный логгер для клиента и сервера на основе Pino.

## Установка

```bash
bun add @marketplace/logger
```

## Использование

### Базовое использование

```typescript
import { logger, apiLogger, dbLogger } from "@marketplace/logger"

// Простое логирование
logger.info("Приложение запущено")
logger.error("Произошла ошибка", { userId: 123 })

// Использование специализированных логгеров
apiLogger.debug("API запрос", { method: "GET", url: "/users" })
dbLogger.warn("Медленный запрос", { duration: 1200 })
```

### Создание кастомного логгера

```typescript
import { createLogger } from "@marketplace/logger"

const myLogger = createLogger("my-service")
myLogger.info("Кастомное сообщение")
```

### Структурированное логирование

```typescript
import { logError, logInfo, logRequest } from "@marketplace/logger"

// Логирование ошибок с контекстом
logError(logger, "Ошибка обработки заказа", error, { orderId: 456 })

// Логирование HTTP запросов
logRequest(apiLogger, "POST", "/api/users", 201, 150)

// Логирование информации
logInfo(logger, "Пользователь создан", {
  userId: 789,
  email: "user@example.com",
})
```

## Конфигурация

### Уровни логирования

- `error` - ошибки
- `warn` - предупреждения
- `info` - информационные сообщения
- `debug` - отладочная информация

### Настройка уровня через переменные окружения

**Для сервера:**

```bash
LOG_LEVEL=debug
NODE_ENV=development
```

**Для клиента (Vite):**

```bash
VITE_LOG_LEVEL=debug
```

### Автоматическое определение уровня

- В development: `debug`
- В production: `info`

## Формат вывода

### Браузер

```json
{
  "timestamp": "2024-01-01T12:00:00.000Z",
  "level": "info",
  "category": "marketplace",
  "message": "Приложение запущено"
}
```

### Сервер

- Консоль: цветной вывод с timestamp
- Файлы: `logs/combined.log` и `logs/error.log`

## Экспортируемые логгеры

- `logger` - основной логгер для marketplace
- `apiLogger` - для API запросов (`marketplace:api`)
- `dbLogger` - для базы данных (`marketplace:db`)
- `authLogger` - для аутентификации (`marketplace:auth`)
- `serviceLogger` - для сервисов (`marketplace:service`)

## API

### ILogger интерфейс

```typescript
interface ILogger {
  error(message: string, meta?: any): void
  warn(message: string, meta?: any): void
  info(message: string, meta?: any): void
  debug(message: string, meta?: any): void
}
```

### Функции

- `createLogger(category: string): ILogger` - создает новый логгер
- `setupLogger(): Promise<void>` - инициализация (для совместимости)

### Вспомогательные функции

- `logError(logger, message, error?, context?)`
- `logInfo(logger, message, context?)`
- `logWarn(logger, message, context?)`
- `logDebug(logger, message, context?)`
- `logRequest(logger, method, url, status, duration?)`

## Примеры использования в разных частях приложения

### React компонент

```typescript
import { logger } from '@marketplace/logger';

function MyComponent() {
  useEffect(() => {
    logger.info('Компонент смонтирован');
  }, []);

  return <div>Hello World</div>;
}
```

### Express middleware

```typescript
import { apiLogger } from "@marketplace/logger"

app.use((req, res, next) => {
  const start = Date.now()
  res.on("finish", () => {
    const duration = Date.now() - start
    apiLogger.info(`${req.method} ${req.path}`, {
      status: res.statusCode,
      duration,
      userAgent: req.get("User-Agent"),
    })
  })
  next()
})
```

### Database service

```typescript
import { dbLogger } from "@marketplace/logger"

async function getUsers() {
  const start = Date.now()
  try {
    const users = await db.query("SELECT * FROM users")
    dbLogger.debug("Users fetched", {
      count: users.length,
      duration: Date.now() - start,
    })
    return users
  } catch (error) {
    dbLogger.error("Failed to fetch users", { error: error.message })
    throw error
  }
}
```
