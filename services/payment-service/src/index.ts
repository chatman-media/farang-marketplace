import logger from "@marketplace/logger"
import { createApp, env, gracefulShutdown } from "./app"
import { checkDatabaseConnection } from "./db/connection"

// Initialize modern job system
import "./jobs/modern-queue"

// Start the modern application
const start = async () => {
  try {
    logger.info("🚀 Starting Payment Service v2.0...")

    // Check database connection
    const dbHealthy = await checkDatabaseConnection()
    if (!dbHealthy) {
      throw new Error("Database connection failed")
    }
    logger.info("✅ Database connected")

    // Create and start Fastify app
    const app = await createApp()

    await app.listen({
      port: env.PORT,
      host: "0.0.0.0",
    })

    logger.info(`🚀 Payment Service v2.0 running on port ${env.PORT}`)
    logger.info(`📊 Environment: ${env.NODE_ENV}`)
    logger.info(`🔗 TON Network: ${env.TON_NETWORK}`)
    logger.info("💳 Modern Payment Service initialized with:")
    logger.info("   - Fastify 5.x for high performance")
    logger.info("   - BullMQ for job processing")
    logger.info("   - TON Connect 3.5 integration")
    logger.info("   - Zod validation")
    logger.info("   - TypeScript 5.8")
    logger.info("   - Drizzle ORM 0.38")

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
    logger.error("❌ Failed to start Payment Service:", error)
    process.exit(1)
  }
}

// Start the application
start()
