import logger from "@marketplace/logger"
import { createApp, env, gracefulShutdown } from "./app"
import { checkDatabaseConnection } from "./db/connection"

// Start the modern application
const start = async () => {
  try {
    logger.info("🚀 Starting Booking Service v2.0...")

    // Check database connection (optional for demo)
    try {
      const dbHealthy = await checkDatabaseConnection()
      if (dbHealthy) {
        logger.info("✅ Database connected")
      } else {
        logger.info("⚠️ Database not connected (continuing anyway)")
      }
    } catch (error) {
      logger.info("⚠️ Database connection failed (continuing anyway):", (error as Error).message)
    }

    // Create and start Fastify app
    const app = await createApp()

    await app.listen({
      port: env.PORT,
      host: "0.0.0.0",
    })

    logger.info(`🏨 Booking Service v2.0 running on port ${env.PORT}`)
    logger.info(`📊 Environment: ${env.NODE_ENV}`)
    logger.info(`🔗 Health check: http://localhost:${env.PORT}/health`)
    logger.info("📅 Modern Booking Service initialized with:")
    logger.info("   - Fastify 5.x for high performance")
    logger.info("   - Database connection pooling")
    logger.info("   - Rate limiting")
    logger.info("   - Zod validation")
    logger.info("   - TypeScript 5.x")

    // Setup graceful shutdown
    const signals = ["SIGTERM", "SIGINT", "SIGUSR2"]
    signals.forEach((signal) => {
      process.on(signal, () => gracefulShutdown(app, signal))
    })

    // Handle uncaught exceptions
    process.on("uncaughtException", (error) => {
      app.log.error({ error }, "Uncaught Exception")
      gracefulShutdown(app, "uncaughtException")
    })

    process.on("unhandledRejection", (reason, promise) => {
      app.log.error({ promise, reason }, "Unhandled Rejection")
      gracefulShutdown(app, "unhandledRejection")
    })
  } catch (error) {
    logger.error("❌ Error starting server:", error)
    process.exit(1)
  }
}

start()
