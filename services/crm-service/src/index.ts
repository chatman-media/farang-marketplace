import logger, { createPinoLoggerOptions } from "@marketplace/logger"
import { config } from "dotenv"
import Fastify from "fastify"
import { z } from "zod"
import { setTelegramService } from "./routes/webhooks"
import { CronService } from "./services/CronService"
import { TelegramService } from "./services/TelegramService"

// Load environment variables
config()

// Environment validation
const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.string().transform(Number).default(3007),
  CORS_ORIGIN: z.string().default("*"),
  JWT_SECRET: z.string().default("dev-jwt-secret-change-in-production"),
  DATABASE_URL: z.string().default("postgresql://user:password@localhost:5432/marketplace_crm"),
  TELEGRAM_BOT_TOKEN: z.string().optional(),
  TELEGRAM_WEBHOOK_URL: z.string().optional(),
})

const env = envSchema.parse(process.env)

// Create Fastify app function with integrated logger
const createApp = async () => {
  const app = Fastify({
    logger: createPinoLoggerOptions("crm-service"),
    bodyLimit: 10 * 1024 * 1024, // 10MB
  })

  // Register plugins
  await app.register(import("@fastify/helmet"))
  await app.register(import("@fastify/cors"), {
    origin: env.CORS_ORIGIN === "*" ? true : env.CORS_ORIGIN.split(","),
    credentials: true,
  })

  // Root endpoint
  app.get("/", async () => {
    return {
      service: "CRM Service",
      version: "2.0.0",
      status: "running",
      timestamp: new Date().toISOString(),
      framework: "Fastify 5.x",
      features: [
        "Multi-channel communication",
        "Customer management",
        "Lead tracking",
        "Campaign automation",
        "Analytics dashboard",
      ],
    }
  })

  // Health check endpoint
  app.get("/health", async () => {
    return {
      status: "healthy",
      timestamp: new Date().toISOString(),
      service: "crm-service",
      version: "2.0.0",
      environment: env.NODE_ENV,
    }
  })

  // Register routes (shared with the modular-monolith root)
  const { registerCrmRoutes } = await import("./routes")
  await registerCrmRoutes(app)

  // Global error handler
  app.setErrorHandler(async (error, _request, reply) => {
    app.log.error(error)

    if (error.validation) {
      return reply.code(400).send({
        error: "Validation Error",
        message: error.message,
        details: error.validation,
        timestamp: new Date().toISOString(),
      })
    }

    if (error.statusCode) {
      return reply.code(error.statusCode).send({
        error: error.name,
        message: error.message,
        timestamp: new Date().toISOString(),
      })
    }

    return reply.code(500).send({
      error: "Internal Server Error",
      message: env.NODE_ENV === "production" ? "Something went wrong" : error.message,
      timestamp: new Date().toISOString(),
      ...(env.NODE_ENV === "development" && { stack: error.stack }),
    })
  })

  return app
}

// Graceful shutdown
let appInstance: any = null
let cronService: CronService | null = null
let telegramService: TelegramService | null = null

const gracefulShutdown = async (signal: string) => {
  logger.info(`${signal} received, shutting down gracefully`)
  try {
    // Stop Telegram bot first
    if (telegramService) {
      await telegramService.stopBot()
      logger.info("Telegram bot stopped")
    }

    // Stop cron service
    if (cronService) {
      await cronService.stop()
    }

    // Then close the app
    if (appInstance) {
      await appInstance.close()
    }

    logger.info("CRM Service shut down successfully")
    process.exit(0)
  } catch (error) {
    logger.error("Error during shutdown:", error)
    process.exit(1)
  }
}

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"))
process.on("SIGINT", () => gracefulShutdown("SIGINT"))

// Start the application
const startApp = async () => {
  appInstance = await createApp()
  await appInstance.listen({
    port: env.PORT,
    host: "0.0.0.0",
  })

  logger.info(`🚀 CRM Service v2.0 running on port ${env.PORT}`)
  logger.info(`📊 Environment: ${env.NODE_ENV}`)
  logger.info(`🔗 API Base URL: http://localhost:${env.PORT}/api/crm`)
  logger.info(`💚 Health check: http://localhost:${env.PORT}/health`)

  // Initialize and start Telegram bot
  if (env.NODE_ENV !== "test" && env.TELEGRAM_BOT_TOKEN) {
    try {
      telegramService = new TelegramService({
        botToken: env.TELEGRAM_BOT_TOKEN,
        webhookUrl: env.TELEGRAM_WEBHOOK_URL,
      })
      setTelegramService(telegramService)
      await telegramService.startBot()

      if (env.TELEGRAM_WEBHOOK_URL) {
        logger.info(`📱 Telegram bot started with webhook: ${env.TELEGRAM_WEBHOOK_URL}`)
      } else {
        logger.info("📱 Telegram bot started with polling mode")
      }
    } catch (error) {
      logger.error("Failed to start Telegram bot:", error)
    }
  }

  // Start cron service for background tasks
  if (env.NODE_ENV !== "test") {
    cronService = new CronService()
    await cronService.start()
    logger.info(`⏰ CronService started with ${cronService.getAllJobs().length} background jobs`)
  }
}

if (require.main === module) {
  startApp().catch((error) => {
    logger.error("Failed to start CRM Service:", error)
    process.exit(1)
  })
}

export { createApp, env }
