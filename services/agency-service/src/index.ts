import logger from "@marketplace/logger"
import { createApp, env } from "./app"

const start = async () => {
  try {
    const app = await createApp()

    await app.listen({
      port: env.PORT,
      host: "0.0.0.0",
    })

    logger.info(`🚀 Agency service running on port ${env.PORT}`)
    logger.info(`📊 Health check: http://localhost:${env.PORT}/health`)
    logger.info(`🏢 Agencies API: http://localhost:${env.PORT}/api/agencies`)
    logger.info(`🔧 Services API: http://localhost:${env.PORT}/api/services`)
    logger.info(`📋 Assignments API: http://localhost:${env.PORT}/api/assignments`)
    logger.info(`🔗 Booking Integration API: http://localhost:${env.PORT}/api/booking-integration`)
  } catch (error) {
    logger.error("❌ Error starting server:", error)
    process.exit(1)
  }
}

// Graceful shutdown
process.on("SIGTERM", async () => {
  logger.info("🛑 SIGTERM received, shutting down gracefully")
  process.exit(0)
})

process.on("SIGINT", async () => {
  logger.info("🛑 SIGINT received, shutting down gracefully")
  process.exit(0)
})

// Start the application
start()

// Export for testing and external use
export { createApp, env }
