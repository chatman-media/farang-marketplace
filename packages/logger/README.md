# @marketplace/logger

Централизованный пакет логирования для платформы маркетплейса.

## Установка

```bash
npm install @marketplace/logger
```

## Использование

### Базовое использование

```typescript
import { logger } from "@marketplace/logger"

// Различные уровни логирования
logger.error("Ошибка в приложении")
logger.warn("Предупреждение")
logger.info("Информационное сообщение")
logger.http("HTTP запрос")
logger.debug("Отладочная информация")
```

### Структурированное логирование

```typescript
import { logError, logInfo, logWarn, logDebug } from "@marketplace/logger"

// Логирование ошибок с дополнительной информацией
try {
  // некоторый код
} catch (error) {
  logError("Ошибка при обработке запроса", error, {
    userId: "123",
    action: "createListing",
  })
}

// Информационное логирование с метаданными
logInfo("Пользователь создал объявление", {
  userId: "123",
  listingId: "456",
  category: "vehicles",
})
```

### Использование с Express.js и Morgan

```typescript
import express from "express"
import morgan from "morgan"
import { stream } from "@marketplace/logger"

const app = express()

// Использование stream для HTTP логирования
app.use(morgan("combined", { stream }))
```

## Конфигурация

Пакет автоматически настраивается в зависимости от переменной окружения
`NODE_ENV`:

- **development**: уровень логирования `debug`
- **production**: уровень логирования `warn`

## Файлы логов

Логи сохраняются в следующие файлы:

- `logs/error.log` - только ошибки
- `logs/combined.log` - все логи
- Консоль - все логи с цветовой подсветкой

## Уровни логирования

1. **error** (0) - Критические ошибки
2. **warn** (1) - Предупреждения
3. **info** (2) - Информационные сообщения
4. **http** (3) - HTTP запросы
5. **debug** (4) - Отладочная информация

## TypeScript поддержка

Пакет полностью поддерживает TypeScript и экспортирует интерфейс
`LoggerInterface` для типизации.

```typescript
import { LoggerInterface } from "@marketplace/logger"

class MyService {
  constructor(private logger: LoggerInterface) {}

  doSomething() {
    this.logger.info("Выполняется операция")
  }
}
```
