import winston from "winston"

// Определяем типы для логгера
export type LogLevel = "error" | "warn" | "info" | "debug"

// Интерфейс для логгера
export interface ILogger {
  error(message: string, meta?: any): void
  warn(message: string, meta?: any): void
  info(message: string, meta?: any): void
  debug(message: string, meta?: any): void
}

// Класс-обертка для универсального логгера
class UniversalLogger implements ILogger {
  private logger: winston.Logger
  private isBrowser: boolean

  constructor(category: string = "marketplace") {
    this.isBrowser = typeof window !== "undefined"
    this.logger = this.createLogger(category)
  }

  private createLogger(category: string): winston.Logger {
    const level = this.getLogLevel()

    if (this.isBrowser) {
      // Конфигурация для браузера
      return winston.createLogger({
        level,
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.json(),
          winston.format.printf(({ timestamp, level, message, ...meta }) => {
            return JSON.stringify({
              timestamp,
              level,
              category,
              message,
              ...meta,
            })
          }),
        ),
        transports: [
          new winston.transports.Console({
            format: winston.format.combine(winston.format.colorize(), winston.format.simple()),
          }),
        ],
      })
    }

    // Конфигурация для сервера
    const transports: winston.transport[] = [
      new winston.transports.Console({
        format: winston.format.combine(winston.format.colorize(), winston.format.simple()),
      }),
    ]

    // Добавляем файловые логи только в продакшене и разработке
    if (process.env.NODE_ENV !== "test") {
      transports.push(
        new winston.transports.File({
          filename: "logs/combined.log",
          format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
        }),
        new winston.transports.File({
          filename: "logs/error.log",
          level: "error",
          format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
        }),
      )
    }

    return winston.createLogger({
      level,
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json(),
      ),
      transports,
    })
  }

  private getLogLevel(): LogLevel {
    if (this.isBrowser) {
      // Браузерное окружение
      try {
        const viteEnv = (import.meta as any).env || {}
        return (viteEnv.VITE_LOG_LEVEL as LogLevel) || (process.env.NODE_ENV === "development" ? "debug" : "info")
      } catch {
        return process.env.NODE_ENV === "development" ? "debug" : "info"
      }
    } else {
      // Серверное окружение
      return (process.env.LOG_LEVEL as LogLevel) || (process.env.NODE_ENV === "development" ? "debug" : "info")
    }
  }

  error(message: string, meta?: any): void {
    this.logger.error(message, meta)
  }

  warn(message: string, meta?: any): void {
    this.logger.warn(message, meta)
  }

  info(message: string, meta?: any): void {
    this.logger.info(message, meta)
  }

  debug(message: string, meta?: any): void {
    this.logger.debug(message, meta)
  }
}

// Создаем глобальные логгеры
export const logger = new UniversalLogger("marketplace")
export const apiLogger = new UniversalLogger("marketplace:api")
export const dbLogger = new UniversalLogger("marketplace:db")
export const authLogger = new UniversalLogger("marketplace:auth")
export const serviceLogger = new UniversalLogger("marketplace:service")

// Функция для создания кастомных логгеров
export const createLogger = (category: string): ILogger => {
  return new UniversalLogger(category)
}

// Вспомогательные функции для структурированного логирования
export const logError = (logger: ILogger, message: string, error?: Error, context?: any) => {
  logger.error(message, {
    error: error
      ? {
          name: error.name,
          message: error.message,
          stack: error.stack,
        }
      : undefined,
    ...context,
  })
}

export const logInfo = (logger: ILogger, message: string, context?: any) => {
  logger.info(message, context)
}

export const logWarn = (logger: ILogger, message: string, context?: any) => {
  logger.warn(message, context)
}

export const logDebug = (logger: ILogger, message: string, context?: any) => {
  logger.debug(message, context)
}

// Для обратной совместимости с logtape
export const setupLogger = async (): Promise<void> => {
  // Winston инициализируется автоматически при импорте
  // Эта функция оставлена для совместимости
  return Promise.resolve()
}

// Функция для логирования HTTP запросов
export const logRequest = (logger: ILogger, method: string, url: string, status: number, duration?: number) => {
  logger.info(`${method} ${url}`, {
    method,
    url,
    status,
    duration,
    type: "http_request",
  })
}

export default logger
