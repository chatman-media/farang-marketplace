import logger from "@marketplace/logger"

import { createApp, env, gracefulShutdown } from "./app"

// Start the modern application
const start = async () => {
  try {
    logger.info("🚀 Starting Voice Service v2.0...")

    // Create and start Fastify app
    const app = await createApp()

    await app.listen({
      port: env.PORT,
      host: "0.0.0.0",
    })

    logger.info(`🎤 Voice Service v2.0 running on port ${env.PORT}`)
    logger.info(`📊 Environment: ${env.NODE_ENV}`)
    logger.info(`🔗 Health check: http://localhost:${env.PORT}/health`)
    logger.info("🎵 Modern Voice Service initialized with:")
    logger.info("   - Fastify 5.x for high performance")
    logger.info("   - Large file upload support (50MB)")
    logger.info("   - Multi-language speech processing")
    logger.info("   - Real-time audio analysis")
    logger.info("   - TypeScript 5.x")

    // Setup graceful shutdown
    const signals = ["SIGTERM", "SIGINT", "SIGUSR2"]
    signals.forEach((signal) => {
      process.on(signal, () => gracefulShutdown(app, signal))
    })

    // Handle uncaught exceptions
    process.on("uncaughtException", (error) => {
      app.log.error(error, "Uncaught Exception")
      gracefulShutdown(app, "uncaughtException")
    })

    process.on("unhandledRejection", (reason, promise) => {
      app.log.error({ reason, promise: promise.toString() }, "Unhandled Rejection")
      gracefulShutdown(app, "unhandledRejection")
    })
  } catch (error) {
    logger.error("❌ Error starting server:", error)
    process.exit(1)
  }
}

start()
