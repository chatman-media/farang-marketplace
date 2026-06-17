import { createWriteStream } from "node:fs"
import { mkdir } from "node:fs/promises"
import { dirname } from "node:path"
import type { Logger as PinoLogger } from "pino"
import pino from "pino"

// Strip CR/LF and other control characters from a log message so user-provided
// values cannot forge new log entries (CodeQL js/log-injection).
function sanitizeLogMessage(message: string): string {
  if (typeof message !== "string") return message
  // Replace control characters (incl. CR/LF) so user-provided values
  // cannot forge new log entries (CodeQL js/log-injection).
  let out = ""
  for (let i = 0; i < message.length; i++) {
    const code = message.charCodeAt(i)
    out += code < 0x20 || code === 0x7f ? " " : message[i]
  }
  return out
}

// Log level types
export type LogLevel = "error" | "warn" | "info" | "debug" | "trace"

// Logger interface
export interface ILogger {
  error(message: string, meta?: any): void
  warn(message: string, meta?: any): void
  info(message: string, meta?: any): void
  debug(message: string, meta?: any): void
  trace?(message: string, meta?: any): void
  readonly pinoInstance?: PinoLogger
}

// Universal logger wrapper class
class UniversalLogger implements ILogger {
  private logger: PinoLogger | null = null
  private isBrowser: boolean
  private category: string
  public readonly pinoInstance?: PinoLogger

  constructor(category: string = "marketplace") {
    this.category = category
    this.isBrowser = typeof window !== "undefined"

    if (!this.isBrowser) {
      this.logger = this.createLogger(category)
      this.pinoInstance = this.logger
    }
  }

  private createLogger(category: string): PinoLogger {
    const level = this.getLogLevel()
    const isDev = process.env.NODE_ENV === "development"
    const isTest = process.env.NODE_ENV === "test"

    // Base pino options
    const baseOptions: pino.LoggerOptions = {
      name: category,
      level,
      formatters: {
        level: (label) => {
          return { level: label }
        },
      },
    }

    // Test environment - simple console only
    if (isTest) {
      return pino({
        ...baseOptions,
        transport: {
          target: "pino-pretty",
          options: {
            colorize: true,
            ignore: "pid,hostname",
            translateTime: "HH:MM:ss",
          },
        },
      })
    }

    // Development - pretty console output
    if (isDev) {
      return pino({
        ...baseOptions,
        transport: {
          target: "pino-pretty",
          options: {
            colorize: true,
            ignore: "pid,hostname",
            translateTime: "SYS:HH:MM:ss",
            singleLine: false,
          },
        },
      })
    }

    // Production - JSON to stdout + files
    // We'll create file streams manually for production
    const streams: any[] = [{ stream: process.stdout }]

    // Add file logging in production
    this.ensureLogDirectory()

    try {
      const combinedStream = createWriteStream("logs/combined.log", { flags: "a" })
      const errorStream = createWriteStream("logs/error.log", { flags: "a" })

      streams.push({ stream: combinedStream }, { level: "error", stream: errorStream })
    } catch (error) {
      console.warn("Failed to create log file streams:", error)
    }

    // For production with multiple streams, we use multistream
    if (streams.length > 1) {
      return pino(baseOptions, pino.multistream(streams))
    }

    return pino(baseOptions)
  }

  private ensureLogDirectory(): void {
    try {
      mkdir(dirname("logs/combined.log"), { recursive: true }).catch(() => {})
    } catch {
      // Ignore - we'll handle write errors later
    }
  }

  private getLogLevel(): LogLevel {
    if (this.isBrowser) {
      // Browser environment
      try {
        const viteEnv = (import.meta as any).env || {}
        return (viteEnv.VITE_LOG_LEVEL as LogLevel) || (process.env.NODE_ENV === "development" ? "debug" : "info")
      } catch {
        return process.env.NODE_ENV === "development" ? "debug" : "info"
      }
    } else {
      // Server environment
      return (process.env.LOG_LEVEL as LogLevel) || (process.env.NODE_ENV === "development" ? "debug" : "info")
    }
  }

  error(message: string, meta?: any): void {
    const safe = sanitizeLogMessage(message)
    if (this.isBrowser) {
      console.error(`[${this.category}]`, safe, meta)
    } else if (this.logger) {
      if (meta) {
        this.logger.error(meta, safe)
      } else {
        this.logger.error(safe)
      }
    }
  }

  warn(message: string, meta?: any): void {
    const safe = sanitizeLogMessage(message)
    if (this.isBrowser) {
      console.warn(`[${this.category}]`, safe, meta)
    } else if (this.logger) {
      if (meta) {
        this.logger.warn(meta, safe)
      } else {
        this.logger.warn(safe)
      }
    }
  }

  info(message: string, meta?: any): void {
    const safe = sanitizeLogMessage(message)
    if (this.isBrowser) {
      console.info(`[${this.category}]`, safe, meta)
    } else if (this.logger) {
      if (meta) {
        this.logger.info(meta, safe)
      } else {
        this.logger.info(safe)
      }
    }
  }

  debug(message: string, meta?: any): void {
    const safe = sanitizeLogMessage(message)
    if (this.isBrowser) {
      console.debug(`[${this.category}]`, safe, meta)
    } else if (this.logger) {
      if (meta) {
        this.logger.debug(meta, safe)
      } else {
        this.logger.debug(safe)
      }
    }
  }

  trace(message: string, meta?: any): void {
    const safe = sanitizeLogMessage(message)
    if (this.isBrowser) {
      console.debug(`[${this.category}] [TRACE]`, safe, meta)
    } else if (this.logger) {
      if (meta) {
        this.logger.trace(meta, safe)
      } else {
        this.logger.trace(safe)
      }
    }
  }
}

// Create global loggers
export const logger = new UniversalLogger("marketplace")
export const apiLogger = new UniversalLogger("marketplace:api")
export const dbLogger = new UniversalLogger("marketplace:db")
export const authLogger = new UniversalLogger("marketplace:auth")
export const serviceLogger = new UniversalLogger("marketplace:service")

// Function to create custom loggers
export const createLogger = (category: string): ILogger => {
  return new UniversalLogger(category)
}

// Helper functions for structured logging
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

// Setup function for backward compatibility
export const setupLogger = async (): Promise<void> => {
  // Pino initializes automatically on import
  // This function is kept for backward compatibility
  return Promise.resolve()
}

// Function for logging HTTP requests
export const logRequest = (logger: ILogger, method: string, url: string, status: number, duration?: number) => {
  logger.info(`${method} ${url}`, {
    method,
    url,
    status,
    duration,
    type: "http_request",
  })
}

// Create Pino logger options for Fastify integration
export const createPinoLoggerOptions = (category: string = "marketplace"): pino.LoggerOptions => {
  const level = (process.env.LOG_LEVEL as LogLevel) || (process.env.NODE_ENV === "development" ? "debug" : "info")
  const isDev = process.env.NODE_ENV === "development"
  const isTest = process.env.NODE_ENV === "test"

  const baseOptions: pino.LoggerOptions = {
    name: category,
    level,
    formatters: {
      level: (label) => {
        return { level: label }
      },
    },
  }

  // Test environment
  if (isTest) {
    return {
      ...baseOptions,
      transport: {
        target: "pino-pretty",
        options: {
          colorize: true,
          ignore: "pid,hostname",
          translateTime: "HH:MM:ss",
        },
      },
    }
  }

  // Development - pretty console output
  if (isDev) {
    return {
      ...baseOptions,
      transport: {
        target: "pino-pretty",
        options: {
          colorize: true,
          ignore: "pid,hostname",
          translateTime: "SYS:HH:MM:ss",
          singleLine: false,
        },
      },
    }
  }

  // Production - JSON format
  return baseOptions
}

export default logger
